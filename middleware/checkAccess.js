const User = require('../models/User');

const checkAccess = async (req, res, next) => {
  try {
    // 1. Get user ID from the authenticated request (assuming you use JWT)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found in the Collective." });
    }

    // 2. Logic: The "Stasis" Check
    const now = new Date();
    const isExpired = now > user.accessUntil;

    if (user.status !== 'Active' || user.isPaused || isExpired) {
      return res.status(403).json({
        status: "Stasis",
        message: "Your link to the Collective is inactive or expired.",
        reason: isExpired ? "Subscription Expired" : "Account Paused/Pending",
        action: "/payment-portal" 
      });
    }

    // 3. If all green, move to the next function
    next();
  } catch (err) {
    res.status(500).json({ message: "Security Protocol Error." });
  }
};

module.exports = checkAccess;