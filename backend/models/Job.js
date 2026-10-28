const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    company: { type: String, required: true, trim: true, maxlength: 150 },
    location: { type: String, required: true, trim: true, maxlength: 150 },
    type: {
      type: String,
      enum: ["Internship", "Full-time", "Part-time", "Contract"],
      required: true,
    },
    category: { type: String, trim: true, maxlength: 100 },
    salary: { type: String, trim: true, maxlength: 100 },
    experience: { type: String, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    skills: [{ type: String, trim: true, maxlength: 80 }],
    status: { type: String, enum: ["draft", "published", "closed", "archived"], default: "draft" },
    demo: { type: Boolean, default: false },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ title: "text", company: "text", location: "text", skills: "text" });

module.exports = mongoose.model("Job", jobSchema);
