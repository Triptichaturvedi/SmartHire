const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const { connectDatabase, getDatabaseStatus } = require("./config/db");
const User = require("./models/User");
const Job = require("./models/Job");
const Application = require("./models/Application");
const Notification = require("./models/Notification");
const { requireAuth, requireRole } = require("./middleware/auth");
const { requireDatabase, notFound, errorHandler } = require("./middleware/errors");
const resumeStorage = require("./storage/resumeStorage");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const allowedRoles = ["student", "professional", "recruiter"];
const candidateRoles = ["student", "professional"];
const cookieSameSite = ["lax", "strict", "none"].includes(process.env.COOKIE_SAMESITE)
  ? process.env.COOKIE_SAMESITE
  : "lax";
const secureCookies = process.env.NODE_ENV === "production" || cookieSameSite === "none";
const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: resumeStorage.directory,
    filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    callback(null, allowed.includes(file.mimetype));
  },
});

app.locals.databaseConnected = () => getDatabaseStatus().connected;
app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: true }));

function safeUser(user) {
  const profile = user.profile?.toObject ? user.profile.toObject() : { ...user.profile };
  if (profile.resume) {
    profile.resume = {
      originalName: profile.resume.originalName,
      mimeType: profile.resume.mimeType,
      size: profile.resume.size,
    };
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profile,
  };
}

function setSession(res, user) {
  if (!process.env.JWT_SECRET) {
    throw Object.assign(new Error("JWT_SECRET is not configured"), { status: 503 });
  }
  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("smarthire_token", token, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function validateCredentials(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 100) throw Object.assign(new Error("Name must be 2-100 characters."), { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(new Error("A valid email is required."), { status: 400 });
  if (password.length < 8 || password.length > 128) throw Object.assign(new Error("Password must be 8-128 characters."), { status: 400 });
  return { name, email, password };
}

function validateObjectId(value) {
  return mongoose.isValidObjectId(value);
}

function isOwnerOfJob(user, job) {
  return user.role === "admin" || job.recruiter.toString() === user._id.toString();
}

app.get("/api/v1/health", (_req, res) => {
  const database = getDatabaseStatus();
  res.status(database.connected ? 200 : 503).json({
    success: database.connected,
    message: database.connected ? "SmartHire API and database are ready." : "SmartHire API is running, but the database is unavailable.",
    database,
  });
});

app.post("/api/v1/auth/register", requireDatabase, async (req, res, next) => {
  try {
    const { name, email, password } = validateCredentials(req.body);
    const role = req.body.role;
    if (!allowedRoles.includes(role)) return res.status(400).json({ success: false, message: "A valid account role is required." });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role });
    setSession(res, user);
    return res.status(201).json({ success: true, user: safeUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/auth/login", requireDatabase, async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Email or password is incorrect." });
    }
    setSession(res, user);
    return res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/auth/logout", (_req, res) => {
  res.clearCookie("smarthire_token", { httpOnly: true, secure: secureCookies, sameSite: cookieSameSite });
  res.json({ success: true, message: "Logged out." });
});

app.get("/api/v1/auth/me", requireDatabase, requireAuth, (req, res) => {
  res.json({ success: true, user: safeUser(req.user) });
});

app.patch("/api/v1/profile", requireDatabase, requireAuth, async (req, res, next) => {
  try {
    const allowed = ["phone", "headline", "bio", "skills", "experience", "education"];
    const profile = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) profile[key] = req.body[key];
    }
    if (profile.skills && (!Array.isArray(profile.skills) || profile.skills.length > 50)) {
      return res.status(400).json({ success: false, message: "Skills must be an array of at most 50 items." });
    }
    const updates = Object.fromEntries(Object.entries(profile).map(([key, value]) => [`profile.${key}`, value]));
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    return res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/profile/resume", requireDatabase, requireAuth, requireRole(...candidateRoles), resumeUpload.single("resume"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Upload a PDF or DOCX resume up to 5 MB." });
    const previous = req.user.profile?.resume?.filename;
    if (previous) {
      resumeStorage.remove(previous);
    }
    const user = await User.findByIdAndUpdate(req.user._id, {
      $set: { "profile.resume": { filename: req.file.filename, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size } },
    }, { new: true, runValidators: true });
    return res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    if (req.file && resumeStorage.exists(req.file.filename)) resumeStorage.remove(req.file.filename);
    return next(error);
  }
});

app.delete("/api/v1/profile/resume", requireDatabase, requireAuth, requireRole(...candidateRoles), async (req, res, next) => {
  try {
    const filename = req.user.profile?.resume?.filename;
    if (filename) {
      resumeStorage.remove(filename);
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $unset: { "profile.resume": 1 } }, { new: true });
    return res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/profile/resume", requireDatabase, requireAuth, requireRole(...candidateRoles), async (req, res, next) => {
  try {
    const filename = req.user.profile?.resume?.filename;
    if (!filename) return res.status(404).json({ success: false, message: "No resume has been uploaded." });
    const filePath = resumeStorage.pathFor(filename);
    if (!resumeStorage.exists(filename)) return res.status(404).json({ success: false, message: "Resume file is unavailable." });
    return res.download(filePath, req.user.profile.resume.originalName);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/jobs", requireDatabase, async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), 50);
    const filter = { status: "published" };
    if (typeof req.query.type === "string" && ["Internship", "Full-time", "Part-time", "Contract"].includes(req.query.type)) filter.type = req.query.type;
    if (typeof req.query.search === "string" && req.query.search.trim()) filter.$text = { $search: req.query.search.trim().slice(0, 100) };
    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("recruiter", "name"),
      Job.countDocuments(filter),
    ]);
    return res.json({ success: true, jobs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/jobs/:id", requireDatabase, async (req, res, next) => {
  try {
    if (!validateObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Job not found." });
    const job = await Job.findOne({ _id: req.params.id, status: "published" }).populate("recruiter", "name");
    if (!job) return res.status(404).json({ success: false, message: "Job not found." });
    return res.json({ success: true, job });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/jobs", requireDatabase, requireAuth, requireRole("recruiter"), async (req, res, next) => {
  try {
    const job = await Job.create({ ...req.body, recruiter: req.user._id, status: "draft" });
    return res.status(201).json({ success: true, job });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/recruiter/jobs", requireDatabase, requireAuth, requireRole("recruiter", "admin"), async (req, res, next) => {
  try {
    const jobs = await Job.find(req.user.role === "admin" ? {} : { recruiter: req.user._id }).sort({ createdAt: -1 }).lean();
    const counts = await Application.aggregate([{ $match: { job: { $in: jobs.map((job) => job._id) } } }, { $group: { _id: "$job", count: { $sum: 1 } } }]);
    const countMap = new Map(counts.map((item) => [item._id.toString(), item.count]));
    return res.json({ success: true, jobs: jobs.map((job) => ({ ...job, applicantCount: countMap.get(job._id.toString()) || 0 })) });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/v1/jobs/:id", requireDatabase, requireAuth, requireRole("recruiter", "admin"), async (req, res, next) => {
  try {
    if (!validateObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Job not found." });
    const filter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, recruiter: req.user._id };
    const updates = {};
    for (const key of ["title", "company", "location", "type", "category", "salary", "experience", "description", "skills", "status"]) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const job = await Job.findOneAndUpdate(filter, updates, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ success: false, message: "Job not found or not owned by you." });
    return res.json({ success: true, job });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/jobs/:id/applications", requireDatabase, requireAuth, requireRole(...candidateRoles), async (req, res, next) => {
  try {
    if (!validateObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Job not found." });
    const { phone, coverLetter } = req.body;
    if (typeof phone !== "string" || phone.trim().length < 7 || typeof coverLetter !== "string" || coverLetter.trim().length < 20) {
      return res.status(400).json({ success: false, message: "Phone and a cover letter of at least 20 characters are required." });
    }
    const job = await Job.findOne({ _id: req.params.id, status: "published" });
    if (!job) return res.status(409).json({ success: false, message: "This job is not accepting applications." });
    const application = await Application.create({ job: job._id, candidate: req.user._id, phone: phone.trim(), coverLetter: coverLetter.trim(), statusHistory: [{ status: "submitted", changedBy: req.user._id }] });
    await Notification.create({ user: job.recruiter, message: `${req.user.name} applied for ${job.title}.`, link: `/applications/${application._id}` });
    return res.status(201).json({ success: true, application });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/applications/mine", requireDatabase, requireAuth, requireRole(...candidateRoles), async (req, res, next) => {
  try {
    const applications = await Application.find({ candidate: req.user._id }).sort({ createdAt: -1 }).populate("job");
    return res.json({ success: true, applications });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/applications/recruiter", requireDatabase, requireAuth, requireRole("recruiter", "admin"), async (req, res, next) => {
  try {
    const jobs = await Job.find(req.user.role === "admin" ? {} : { recruiter: req.user._id }).select("_id");
    const applications = await Application.find({ job: { $in: jobs.map((job) => job._id) } }).sort({ createdAt: -1 }).populate("job", "title company").populate("candidate", "name email profile");
    const sanitizedApplications = applications.map((application) => {
      const result = application.toObject();
      if (result.candidate?.profile?.resume) delete result.candidate.profile.resume.filename;
      return result;
    });
    return res.json({ success: true, applications: sanitizedApplications });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/v1/applications/:id/status", requireDatabase, requireAuth, requireRole("recruiter", "admin"), async (req, res, next) => {
  try {
    const validStatuses = ["shortlisted", "interview", "offered", "rejected"];
    if (!validStatuses.includes(req.body.status) || !validateObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid application status." });
    const application = await Application.findById(req.params.id).populate("job", "title recruiter");
    if (!application) return res.status(404).json({ success: false, message: "Application not found." });
    if (req.user.role !== "admin" && application.job.recruiter.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "You do not own this application." });
    application.status = req.body.status;
    if (req.body.note !== undefined) application.recruiterNotes = String(req.body.note).trim().slice(0, 3000);
    application.statusHistory.push({ status: req.body.status, note: req.body.note, changedBy: req.user._id });
    await application.save();
    await Notification.create({ user: application.candidate, message: `Your application for ${application.job.title} is now ${req.body.status}.` });
    return res.json({ success: true, application });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/applications/:id/resume", requireDatabase, requireAuth, requireRole("recruiter", "admin"), async (req, res, next) => {
  try {
    if (!validateObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Application not found." });
    const application = await Application.findById(req.params.id).populate("job", "recruiter").populate("candidate", "profile");
    if (!application || !application.candidate.profile?.resume?.filename) return res.status(404).json({ success: false, message: "Resume not found." });
    if (!isOwnerOfJob(req.user, application.job)) return res.status(403).json({ success: false, message: "You do not own this application." });
    const resume = application.candidate.profile.resume;
    const filePath = resumeStorage.pathFor(resume.filename);
    if (!resumeStorage.exists(resume.filename)) return res.status(404).json({ success: false, message: "Resume file is unavailable." });
    return res.download(filePath, resume.originalName);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/dashboard/stats", requireDatabase, requireAuth, async (req, res, next) => {
  try {
    if (candidateRoles.includes(req.user.role)) {
      const [applicationsSent, recommendedJobs] = await Promise.all([
        Application.countDocuments({ candidate: req.user._id }),
        Job.countDocuments({ status: "published" }),
      ]);
      return res.json({ success: true, stats: { applicationsSent, recommendedJobs, profileCompletion: req.user.profile?.resume ? 80 : 40 } });
    }
    const jobs = await Job.find({ recruiter: req.user._id }).select("_id status");
    const [totalApplicants, shortlisted] = await Promise.all([
      Application.countDocuments({ job: { $in: jobs.map((job) => job._id) } }),
      Application.countDocuments({ job: { $in: jobs.map((job) => job._id) }, status: { $in: ["shortlisted", "interview", "offered"] } }),
    ]);
    return res.json({ success: true, stats: { activeJobs: jobs.filter((job) => job.status === "published").length, totalApplicants, shortlisted } });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/notifications", requireDatabase, requireAuth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    return res.json({ success: true, notifications });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/v1/notifications/:id/read", requireDatabase, requireAuth, async (req, res, next) => {
  try {
    if (!validateObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Notification not found." });
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found." });
    return res.json({ success: true, notification });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/admin/stats", requireDatabase, requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const [users, jobs, applications] = await Promise.all([User.countDocuments(), Job.countDocuments(), Application.countDocuments()]);
    return res.json({ success: true, stats: { users, jobs, applications } });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/admin/users", requireDatabase, requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select("name email role suspended createdAt");
    return res.json({ success: true, users });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/admin/jobs", requireDatabase, requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).populate("recruiter", "name email");
    return res.json({ success: true, jobs });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/v1/admin/users/:id/suspension", requireDatabase, requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    if (!validateObjectId(req.params.id) || typeof req.body.suspended !== "boolean") return res.status(400).json({ success: false, message: "Invalid suspension request." });
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ success: false, message: "You cannot suspend your own admin account." });
    const target = await User.findById(req.params.id).select("name email role suspended");
    if (!target) return res.status(404).json({ success: false, message: "User not found." });
    if (target.role === "admin") return res.status(403).json({ success: false, message: "Admin accounts cannot be moderated here." });
    target.suspended = req.body.suspended;
    const user = await target.save();
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.json({ success: true, user });
  } catch (error) {
    return next(error);
  }
});

app.use(notFound);
app.use(errorHandler);

async function start() {
  const connected = await connectDatabase();
  if (!connected) {
    const status = getDatabaseStatus();
    console.error(`MongoDB unavailable (${status.error?.name || "ConfigurationError"}): ${status.error?.message || "unknown error"}`);
  }
  return app.listen(PORT, () => console.log(`SmartHire API running on port ${PORT}`));
}

if (require.main === module) start();

module.exports = app;
