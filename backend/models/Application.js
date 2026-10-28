const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, trim: true, maxlength: 500 },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    coverLetter: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["submitted", "shortlisted", "interview", "offered", "rejected", "withdrawn"],
      default: "submitted",
    },
    statusHistory: { type: [historySchema], default: [] },
    recruiterNotes: { type: String, trim: true, maxlength: 3000 },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
