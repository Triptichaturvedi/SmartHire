const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    read: { type: Boolean, default: false },
    link: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
