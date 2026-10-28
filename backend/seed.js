require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { connectDatabase } = require("./config/db");
const User = require("./models/User");
const Job = require("./models/Job");

const demoJobs = [
  ["Frontend Developer Intern", "TechNova", "Noida, Uttar Pradesh", "Internship", "₹10,000–₹15,000/month", "Fresher", "Work with a development team to build responsive web interfaces using React, JavaScript, HTML, and CSS.", ["React", "JavaScript", "HTML", "CSS"]],
  ["Junior Full Stack Developer", "PixelStack", "Gurugram, Haryana", "Full-time", "₹4–6 LPA", "0–1 years", "Help build and maintain web applications using React, Node.js, Express, and database technologies.", ["React", "Node.js", "Express", "MongoDB"]],
  ["Data Analyst Intern", "InsightWorks", "Remote", "Internship", "₹8,000–₹12,000/month", "Fresher", "Assist with data cleaning, analysis, reporting, and visualisation to help teams make data-driven decisions.", ["Python", "SQL", "Excel", "Power BI"]],
  ["UI/UX Designer", "DesignOrbit", "Delhi, India", "Full-time", "₹3–5 LPA", "1–2 years", "Create intuitive user experiences, wireframes, prototypes, and polished interfaces for web products.", ["Figma", "Wireframing", "Prototyping", "UI Design"]],
];

async function seed() {
  if (!process.env.DEMO_RECRUITER_EMAIL || !process.env.DEMO_RECRUITER_PASSWORD) {
    throw new Error("Set DEMO_RECRUITER_EMAIL and DEMO_RECRUITER_PASSWORD before seeding.");
  }
  if (!(await connectDatabase())) throw new Error("MongoDB connection failed; check Atlas configuration.");
  const email = process.env.DEMO_RECRUITER_EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(process.env.DEMO_RECRUITER_PASSWORD, 12);
  const recruiter = await User.findOneAndUpdate(
    { email },
    { $set: { name: "SmartHire Demo Recruiter", passwordHash, role: "recruiter" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await Job.deleteMany({ recruiter: recruiter._id, demo: true });
  await Job.insertMany(demoJobs.map(([title, company, location, type, salary, experience, description, skills]) => ({
    title, company, location, type, salary, experience, description, skills, status: "published", demo: true, recruiter: recruiter._id,
  })));
  console.log(`Seeded ${demoJobs.length} clearly marked demo jobs.`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
});
