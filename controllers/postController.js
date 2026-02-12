const Post = require('../models/Post');

// 1. USER: Create a new project post
exports.createPost = async (req, res) => {
  try {
    const { domain, globalVision, description, goal } = req.body;
    
    // ✅ CLOUDINARY UPDATE: If a file is uploaded, req.file.path will be the Cloudinary URL
    const newPost = new Post({
      user: req.user.id, 
      domain,
      globalVision,
      description,
      goal,
      postImage: req.file ? req.file.path : '', // ✅ Capturing the cloud link
      isVerified: false 
    });

    const savedPost = await newPost.save();
    res.status(201).json({ 
      success: true, 
      message: "Transmission sent to Admin for verification.", 
      post: savedPost 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. ADMIN: Get all unverified posts
exports.getPendingPosts = async (req, res) => {
  try {
    const pending = await Post.find({ isVerified: false })
      // ✅ FIX: Switched to 'identityImage' to match your profile picture choice
      .populate('user', 'name identityImage email portfolioUrl role status') 
      .sort({ createdAt: -1 });
    
    const validPending = pending.filter(post => post.user !== null);
    res.status(200).json(validPending);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. ADMIN: Accept a post
exports.acceptPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id, 
      { isVerified: true }, 
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json({ success: true, message: "Post authorized and live on feed." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. ADMIN: Reject a post
exports.rejectPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json({ success: true, message: "Post terminated from database." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. PUBLIC/USER: Get all verified posts for the Main Feed
exports.getVerifiedPosts = async (req, res) => {
  try {
    const posts = await Post.find({ isVerified: true })
      // ✅ FIX: Switched to 'identityImage' and included 'name' and 'portfolioUrl'
      .populate('user', 'name identityImage email portfolioUrl role bio')
      .sort({ createdAt: -1 });
    
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};