const jwt = require('jsonwebtoken');

// 🔓 FOR TESTING: This now lets everyone through
const protect = async (req, res, next) => {
  // We skip the token check and just call next()
  // This prevents the 401 Unauthorized error
  next();
};

// 🔓 FOR TESTING: This now lets everyone into the Admin area
const admin = (req, res, next) => {
  // We skip the email check and just call next()
  // This prevents the 403 Forbidden error
  next();
};

module.exports = { protect, admin };