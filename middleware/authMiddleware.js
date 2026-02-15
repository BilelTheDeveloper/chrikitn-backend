const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Access = require('../models/Access');

/**
 * @desc    Protect Routes: Verify JWT and attach user to req
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check if the token exists in the headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // 3. Find user in DB and attach to req.user
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

/**
 * @desc    Admin Protocol: Cross-reference email against the Access Whitelist
 */
const admin = async (req, res, next) => {
  try {
    // 1. Ensure 'protect' has already run
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, msg: 'Not authorized, no user identity' });
    }

    // 2. SEARCH THE WHITELIST: Match current user's email with the Access Collection
    const hasAccess = await Access.findOne({ email: req.user.email.toLowerCase() });

    if (hasAccess) {
      // ✅ SUCCESS: Operative is on the list
      next();
    } else {
      // ❌ FAIL: Valid user, but NOT an authorized Admin
      console.warn(`🛡️ SECURITY ALERT: Unauthorized Admin access attempt by ${req.user.email}`);
      return res.status(403).json({ 
        success: false, 
        msg: 'Access Denied: Your identity is not registered in the Admin Whitelist' 
      });
    }
  } catch (error) {
    console.error('ADMIN_MIDDLEWARE_CRITICAL_ERROR:', error);
    return res.status(500).json({ success: false, msg: 'Internal Security Handshake Failure' });
  }
};

// Exporting both for use in routes
module.exports = { protect, admin };