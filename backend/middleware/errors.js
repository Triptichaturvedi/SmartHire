function requireDatabase(req, res, next) {
  if (req.app.locals.databaseConnected()) return next();
  return res.status(503).json({
    success: false,
    message: "This feature is unavailable until the database is connected.",
  });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: "Route not found." });
}

function errorHandler(error, _req, res, _next) {
  if (error.status) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: "A record with these details already exists." });
  }
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "Resume must be 5 MB or smaller." });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(error.errors).map((item) => item.message).join(" "),
    });
  }
  console.error("Request error:", error.name, error.message);
  return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
}

module.exports = { requireDatabase, notFound, errorHandler };
