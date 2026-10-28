const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "professional", "recruiter", "admin"],
      required: true,
    },
    suspended: { type: Boolean, default: false },
    profile: {
      phone: { type: String, trim: true, maxlength: 30 },
      headline: { type: String, trim: true, maxlength: 160 },
      bio: { type: String, trim: true, maxlength: 2000 },
      skills: [{ type: String, trim: true, maxlength: 80 }],
      experience: { type: String, trim: true, maxlength: 2000 },
      education: { type: String, trim: true, maxlength: 2000 },
      resume: {
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
      },
    },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
