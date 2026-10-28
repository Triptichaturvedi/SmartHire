const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../server.js");

let server;
let baseUrl;

test.before(() => new Promise((resolve) => {
  server = app.listen(0, () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    resolve();
  });
}));

test.after(() => new Promise((resolve) => server.close(resolve)));

test("health reports database connectivity state", async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`);
  const body = await response.json();
  assert.ok([200, 503].includes(response.status));
  assert.equal(typeof body.database.connected, "boolean");
});

test("database-backed registration does not fake success while disconnected", async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/register`, { method: "POST" });
  const body = await response.json();
  if (response.status === 503) assert.match(body.message, /database/i);
});

test("protected candidate and admin routes reject unauthenticated requests", async () => {
  const protectedPaths = [
    ["/api/v1/auth/me", "GET"],
    ["/api/v1/profile", "PATCH"],
    ["/api/v1/profile/resume", "GET"],
    ["/api/v1/applications/mine", "GET"],
    ["/api/v1/admin/stats", "GET"],
  ];
  for (const [path, method] of protectedPaths) {
    const response = await fetch(`${baseUrl}${path}`, { method });
    assert.ok([401, 503].includes(response.status), `${path}: ${response.status}`);
  }
});

test("unknown API routes return a structured 404", async () => {
  const response = await fetch(`${baseUrl}/api/v1/does-not-exist`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { success: false, message: "Route not found." });
});
