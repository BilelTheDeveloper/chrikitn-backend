const VipPost = require('../models/VipPost');
const User = require('../models/User');

// @desc    Create a new VIP Intel post (Shadow Mode)
// @route   POST /api/vip/create
// @access  Private (VIP Users Only)
exports.createVipPost = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    // 1. Fetch user to get fresh role and rating
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ success: false, msg: "User profile not found." });
    }

    // MAPPER: If you are a 'Founder', we treat the intelType as 'Brand' 
    // so it passes your Mongoose Enum ['Freelancer', 'Brand']
    const userRole = userDoc.role;
    const assignedIntelType = (userRole === 'simple' || userRole === 'Brand') ? 'Brand' : 'Freelancer';
    const averageRating = userDoc.averageRating || 0;

    // 2. Build the base intel data
    const intelData = {
      user: userId,
      intelType: assignedIntelType, 
      // ✅ CLOUDINARY UPDATE: Capture the cloud URL directly
      // Removed the local path .replace logic as it's no longer needed for cloud URLs
      intelImage: req.file ? req.file.path : false, 
      ratingSnapshot: averageRating,
      verified: false // Always false initially for admin review
    };

    // 3. Handle Field Logic based on the assigned type
    if (assignedIntelType === 'Freelancer') {
      const { globalService, serviceDescription, portfolioLinks } = req.body;
      
      let parsedLinks = [];
      try {
        parsedLinks = typeof portfolioLinks === 'string' 
          ? JSON.parse(portfolioLinks) 
          : portfolioLinks;
      } catch (e) {
        parsedLinks = portfolioLinks ? [portfolioLinks] : []; 
      }

      intelData.globalService = globalService;
      intelData.serviceDescription = serviceDescription;
      intelData.portfolioLinks = Array.isArray(parsedLinks) ? parsedLinks : [parsedLinks];
    } 
    else {
      // Logic for Brand AND Founder
      const { brandName, searchingFor, brandSocialLink } = req.body;
      
      // If Founder, we use their name if brandName is missing
      intelData.brandName = brandName || userDoc.name || "Elite Partner";
      intelData.searchingFor = searchingFor;
      intelData.brandSocialLink = brandSocialLink;
    }

    // 4. Save to Database
    const newPost = new VipPost(intelData);
    await newPost.save();

    res.status(201).json({
      success: true,
      msg: "Intel received. Verification in progress.",
      post: newPost
    });

  } catch (err) {
    console.error("VIP CREATE ERROR:", err);
    res.status(500).json({ 
      success: false, 
      msg: "Protocol Failure", 
      error: err.message 
    });
  }
};

// @desc    Get all APPROVED VIP Intel (Main Feed)
// @route   GET /api/vip/feed
exports.getVipFeed = async (req, res) => {
  try {
    const feed = await VipPost.find({ verified: true })
      // FIXED: Added identityImage to the populate list
      // ✅ CLOUDINARY READY: identityImage will now return the cloud URL
      .populate('user', 'name identityImage avatar role averageRating')
      .sort({ ratingSnapshot: -1, createdAt: -1 });

    res.json(feed);
  } catch (err) {
    console.error("FEED ERROR:", err.message);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
};

// --- ADMIN SPECIFIC CONTROLLERS ---

// @desc    Get all PENDING VIP Intel (Admin Dashboard)
// @route   GET /api/vip/admin/pending
exports.getPendingVipPosts = async (req, res) => {
  try {
    const pending = await VipPost.find({ verified: false })
      // FIXED: Added identityImage to the populate list
      .populate('user', 'name role email identityImage avatar')
      .sort({ createdAt: -1 });

    res.json(pending);
  } catch (err) {
    res.status(500).json({ success: false, msg: "Failed to fetch pending intel" });
  }
};

// @desc    Verify or Reject a post (Approve or Delete)
// @route   PATCH /api/vip/admin/verify/:id
exports.verifyVipPost = async (req, res) => {
  try {
    const { status } = req.body; // Expecting 'approve' or 'reject'
    
    if (status === 'approve') {
      // Change verified to true -> appears in feed
      await VipPost.findByIdAndUpdate(req.params.id, { verified: true });
      return res.json({ success: true, msg: "Intel cleared for broadcast." });
    } 
    
    // If rejected/else, delete the post from existence
    await VipPost.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: "Intel purged from system." });

  } catch (err) {
    res.status(500).json({ success: false, msg: "Verification protocol failed." });
  }
};