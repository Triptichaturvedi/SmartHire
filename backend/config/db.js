const mongoose = require("mongoose");

let connectionError = null;

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    connectionError = new Error("MONGODB_URI is not configured");
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    connectionError = null;
    return true;
  } catch (error) {
    connectionError = error;
    return false;
  }
}

function getDatabaseStatus() {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return {
    state: states[mongoose.connection.readyState] || "unknown",
    connected: mongoose.connection.readyState === 1,
    error: connectionError
      ? {
          name: connectionError.name,
          message: connectionError.message,
        }
      : null,
  };
}

module.exports = { connectDatabase, getDatabaseStatus };
