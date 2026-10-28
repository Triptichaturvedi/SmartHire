const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env.test") });

const testUri = process.env.MONGODB_TEST_URI;
const developmentUri = process.env.MONGODB_URI;

function parseMongoUri(uri) {
  try {
    const parsed = new URL(uri);
    if (!["mongodb:", "mongodb+srv:"].includes(parsed.protocol) || !parsed.hostname) {
      return null;
    }

    const databasePath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    if (databasePath.includes("/")) {
      return null;
    }

    return {
      parsed,
      database: databasePath || "test",
      hasExplicitDatabase: Boolean(databasePath),
      identity: `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.port ? `:${parsed.port}` : ""}/${databasePath || "test"}`,
    };
  } catch {
    return null;
  }
}

function hasPlaceholder(uri) {
  return /<[^>]+>/.test(uri);
}

const parsedTestUri = typeof testUri === "string" ? parseMongoUri(testUri) : null;
const parsedDevelopmentUri = typeof developmentUri === "string" ? parseMongoUri(developmentUri) : null;
const testDatabase = parsedTestUri?.database || "";
const matchesDevelopmentUri =
  Boolean(parsedTestUri && parsedDevelopmentUri && parsedTestUri.identity === parsedDevelopmentUri.identity);

console.error(`MONGODB_TEST_URI present: ${Boolean(testUri)}`);
console.error(`MONGODB_TEST_URI parses: ${Boolean(parsedTestUri)}`);
console.error(`MONGODB_TEST_URI database: ${testDatabase || "<none>"}`);
console.error(`MONGODB_TEST_URI matches MONGODB_URI: ${matchesDevelopmentUri}`);

if (!testUri) {
  test("MongoDB integration suite requires MONGODB_TEST_URI", { skip: "Set MONGODB_TEST_URI to an isolated database whose name contains test." }, () => {});
} else {
  if (
    !parsedTestUri ||
    !parsedTestUri.hasExplicitDatabase ||
    hasPlaceholder(testUri) ||
    !/test/i.test(testDatabase) ||
    matchesDevelopmentUri
  ) {
    throw new Error("Refusing integration tests: MONGODB_TEST_URI must be a valid, separate MongoDB URI with a database name containing 'test'.");
  }

  process.env.MONGODB_URI = testUri;
  const app = require("../server.js");
  const User = require("../models/User");
  let server;
  let baseUrl;
  let testConnectionAttempted = false;
  let testConnectionEstablished = false;

  function client() {
    let cookie = "";
    return {
      async request(route, options = {}) {
        const headers = new Headers(options.headers);
        if (cookie) headers.set("cookie", cookie);
        const response = await fetch(`${baseUrl}${route}`, { ...options, headers });
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) cookie = setCookie.split(";")[0];
        return response;
      },
    };
  }

  async function json(response) {
    return response.json();
  }

  test.before(async () => {
    testConnectionAttempted = true;
    await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });
    testConnectionEstablished = mongoose.connection.readyState === 1;
    await mongoose.connection.dropDatabase();
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  test.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    try {
      if (testConnectionEstablished) {
        await mongoose.connection.dropDatabase();
      }
    } finally {
      if (testConnectionAttempted && mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    }
  });

  test("complete candidate, recruiter, resume, notification, and admin journey", async () => {
    const student = client();
    const recruiter = client();
    const otherRecruiter = client();

    let response = await student.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test Student", email: "student@test.invalid", password: "student-password", role: "student" }),
    });
    assert.equal(response.status, 201);
    const studentRegistration = await json(response);
    const studentId = studentRegistration.user.id;

    response = await student.request("/api/v1/auth/logout", { method: "POST" });
    assert.equal(response.status, 200);
    assert.equal((await student.request("/api/v1/auth/me")).status, 401);
    response = await student.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "student@test.invalid", password: "student-password" }),
    });
    assert.equal(response.status, 200);
    assert.equal((await json(await student.request("/api/v1/auth/me"))).user.id, studentId);

    response = await student.request("/api/v1/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ headline: "Full-stack student", skills: ["JavaScript", "MongoDB"] }),
    });
    assert.equal(response.status, 200);
    assert.equal((await json(response)).user.profile.headline, "Full-stack student");
    assert.deepEqual((await json(await student.request("/api/v1/auth/me"))).user.profile.skills, ["JavaScript", "MongoDB"]);

    response = await recruiter.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test Recruiter", email: "recruiter@test.invalid", password: "recruiter-password", role: "recruiter" }),
    });
    assert.equal(response.status, 201);
    const recruiterId = (await json(response)).user.id;

    response = await recruiter.request("/api/v1/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Integration Engineer",
        company: "Test Company",
        location: "Remote",
        type: "Full-time",
        category: "Engineering",
        description: "Build and test reliable recruitment software with our team.",
        skills: ["Node.js"],
      }),
    });
    assert.equal(response.status, 201);
    const job = (await json(response)).job;
    assert.equal(job.status, "draft");

    response = await recruiter.request(`/api/v1/jobs/${job._id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "published", salary: "Competitive" }),
    });
    assert.equal(response.status, 200);
    assert.equal((await json(response)).job.status, "published");
    assert.equal((await student.request(`/api/v1/jobs/${job._id}`)).status, 200);
    assert.equal((await student.request("/api/v1/jobs")).status, 200);

    response = await student.request(`/api/v1/jobs/${job._id}/applications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "1234567890", coverLetter: "I would be excited to contribute to this engineering team." }),
    });
    assert.equal(response.status, 201);
    const application = (await json(response)).application;
    response = await student.request(`/api/v1/jobs/${job._id}/applications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "1234567890", coverLetter: "This duplicate application must be rejected." }),
    });
    assert.equal(response.status, 409);

    response = await recruiter.request("/api/v1/applications/recruiter");
    assert.equal(response.status, 200);
    assert.equal((await json(response)).applications.length, 1);
    response = await recruiter.request(`/api/v1/applications/${application._id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "shortlisted", note: "Strong initial fit." }),
    });
    assert.equal(response.status, 200);
    assert.equal((await json(response)).application.status, "shortlisted");
    const applications = (await json(await student.request("/api/v1/applications/mine"))).applications;
    assert.equal(applications[0].status, "shortlisted");
    const notifications = (await json(await student.request("/api/v1/notifications"))).notifications;
    assert.equal(notifications.length, 1);
    response = await student.request(`/api/v1/notifications/${notifications[0]._id}/read`, { method: "PATCH" });
    assert.equal(response.status, 200);
    assert.equal((await json(response)).notification.read, true);

    const form = new FormData();
    form.append("resume", new Blob(["%PDF-test-resume"], { type: "application/pdf" }), "resume.pdf");
    response = await student.request("/api/v1/profile/resume", { method: "POST", body: form });
    assert.equal(response.status, 200);
    assert.equal((await student.request("/api/v1/profile/resume")).status, 200);
    assert.equal((await recruiter.request(`/api/v1/applications/${application._id}/resume`)).status, 200);
    const replacement = new FormData();
    replacement.append("resume", new Blob(["%PDF-replacement"], { type: "application/pdf" }), "replacement.pdf");
    assert.equal((await student.request("/api/v1/profile/resume", { method: "POST", body: replacement })).status, 200);
    assert.equal((await student.request("/api/v1/profile/resume", { method: "DELETE" })).status, 200);
    assert.equal((await student.request("/api/v1/profile/resume")).status, 404);

    response = await otherRecruiter.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Other Recruiter", email: "other-recruiter@test.invalid", password: "other-password", role: "recruiter" }),
    });
    assert.equal(response.status, 201);
    const privateResume = new FormData();
    privateResume.append("resume", new Blob(["%PDF-private-resume"], { type: "application/pdf" }), "private.pdf");
    assert.equal((await student.request("/api/v1/profile/resume", { method: "POST", body: privateResume })).status, 200);
    assert.equal((await otherRecruiter.request(`/api/v1/applications/${application._id}/resume`)).status, 403);
    assert.equal((await otherRecruiter.request(`/api/v1/jobs/${job._id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "Tampered" }) })).status, 404);
    assert.equal(recruiterId.length > 0, true);

    const admin = await User.create({
      name: "Test Admin",
      email: "admin@test.invalid",
      passwordHash: await bcrypt.hash("admin-password", 12),
      role: "admin",
    });
    const adminClient = client();
    assert.equal((await adminClient.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: admin.email, password: "admin-password" }),
    })).status, 200);
    assert.equal((await adminClient.request("/api/v1/admin/stats")).status, 200);
    response = await adminClient.request(`/api/v1/admin/users/${studentId}/suspension`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ suspended: true }),
    });
    assert.equal(response.status, 200);
    assert.equal((await student.request("/api/v1/auth/me")).status, 403);
    assert.equal((await recruiter.request("/api/v1/admin/stats")).status, 403);
  });
}
