const Notification = require('../models/Notification');

// @desc    Retrieve all tactical signals (Invites, Missions, Alerts)
// @route   GET /api/notifications
// @access  Protected
exports.getUserNotifications = async (req, res) => {
  try {
    // 1. Fetch notifications for the logged-in user
    const signals = await Notification.find({ recipient: req.user._id })
      .populate({
        path: 'sender',
        select: 'name identityImage speciality customSpeciality'
      })
      .sort({ createdAt: -1 });

    // 🔍 THE TRUTH LOG: Check your backend terminal/server logs!
    console.log(`📡 DB_SCAN: Found ${signals.length} signals for User ID: ${req.user._id}`);
    if (signals.length > 0) {
        console.log("📝 FIRST_SIGNAL_TYPE:", signals[0].type);
    }

    res.status(200).json({
      success: true,
      count: signals.length,
      data: signals
    });
  } catch (err) {
    console.error("SIGNAL_FETCH_ERROR:", err);
    res.status(500).json({ 
      success: false, 
      msg: "Comms failure: Unable to fetch signals.",
      error: err.message 
    });
  }
};