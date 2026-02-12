const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // ✅ Attaching decoded payload (id, email, role) to req.user
      req.user = decoded; 
      
      return next(); 
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// 🔒 THE MASTER KEY: Only your email can pass this gate
const admin = (req, res, next) => {
  // We check if the user exists and specifically if it's you
  if (req.user && req.user.email === 'bilel.thedeveloper@gmail.com') {
    next();
  } else {
    // Anyone else gets a 403 Forbidden
    console.warn(`🛑 Blocked access attempt from: ${req.user?.email || 'Anonymous'}`);
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Only the Head Developer can access this terminal.' 
    });
  }
};

module.exports = { protect, admin };