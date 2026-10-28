const jwt = require("jsonwebtoken");
const User = require("../models/User");

function requireAuth(req, res, next) {
  const token = req.cookies?.smarthire_token;
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    User.findById(payload.sub)
      .then((user) => {
        if (!user) {
          return res.status(401).json({ success: false, message: "User account not found." });
        }
        if (user.suspended) {
          return res.status(403).json({ success: false, message: "This account has been suspended." });
        }
        req.user = user;
        return next();
      })
      .catch(next);
  } catch (_error) {
    return res.status(401).json({ success: false, message: "Invalid or expired session." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "You are not allowed to perform this action." });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
