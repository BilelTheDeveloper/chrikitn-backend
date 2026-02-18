const User = require('../models/User');
const Post = require('../models/Post');

// Get specific profile data by ID
exports.getUserProfile = async (req, res) => {
  try {
    // 1. Find the user by the ID from the URL
    // We select only the fields we want to show (safety first!)
    const user = await User.findById(req.params.id)
      .select('-password -role'); // Hide password and sensitive role data if needed

    if (!user) {
      return res.status(404).json({ success: false, message: "Operative not found in database." });
    }

    // 2. Find the LATEST verified post by this specific user
    const latestPost = await Post.findOne({ user: req.params.id, isVerified: true })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      user,
      latestPost
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};