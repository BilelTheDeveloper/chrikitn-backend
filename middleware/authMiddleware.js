const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check if the token exists in the headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (Remove "Bearer " prefix)
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify the token using your Secret Key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user in the DB and attach to req.user (excluding password)
      // This is the step that fixes the "Cannot read properties of undefined (reading 'id')" error
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, msg: "User no longer exists." });
      }

      next();
    } catch (error) {
      console.error("❌ TOKEN VERIFICATION ERROR:", error.message);
      return res.status(401).json({ success: false, msg: "Not authorized, token failed." });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, msg: "Not authorized, no token found." });
  }
};

const admin = (req, res, next) => {
  // Check if user exists and has the specific admin email
  if (req.user && req.user.email === 'bilel.thedeveloper@gmail.com') {
    next();
  } else {
    res.status(403).json({ success: false, msg: "Access denied. Admin clearance required." });
  }
};

module.exports = { protect, admin };