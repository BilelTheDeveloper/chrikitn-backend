const User = require('../models/User');

// Use 'exports.name' to match the destructuring in the route file
exports.searchOperatives = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    // 1. Define the Stasis Filters
    const now = new Date();

    const results = await User.find({
      role: 'Freelancer',
      status: 'Active',           // Must be verified by Admin
      isVerified: true,           // Double check for security
      isPaused: false,            // Must not be manually paused
      accessUntil: { $gt: now },  // Must not be expired ($gt = Greater Than Now)
      
      // 2. The original search regex logic
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name identityImage speciality') 
    .limit(5);

    res.json(results);
  } catch (err) {
    console.error("SEARCH_SYSTEM_FAILURE:", err);
    res.status(500).json({ msg: "Search Engine Error" });
  }
};