const Notification = require('../models/Notification');

// @desc    Retrieve all tactical signals (Invites, Missions, Alerts)
// @route   GET /api/notifications
// @access  Protected
exports.getUserNotifications = async (req, res) => {
  try {
    // 1. Fetch all notifications where the user is the recipient
    // 2. Populate sender details so we can show who sent the invite
    const signals = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name identityImage speciality customSpeciality')
      .populate('metadata.collectiveId', 'name logo') // Optional: populate collective info too
      .sort({ createdAt: -1 }); // Newest first

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