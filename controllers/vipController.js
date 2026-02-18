const VipPost = require('../models/VipPost');
const User = require('../models/User');

// @desc    Create a new VIP Intel post
// @route   POST /api/vip/create
// @access  Private (Protect Middleware)
exports.createVipPost = async (req, res) => {
  try {
    // 🔍 Terminal logging for debugging
    console.log("--- New VIP Post Attempt ---");
    
    // Safety check: If protect middleware fails to provide req.user, stop here gracefully
    if (!req.user) {
      console.log("❌ AUTH ERROR: No user attached to request.");
      return res.status(401).json({ success: false, msg: "User identity not verified." });
    }

    console.log("Authenticated User ID:", req.user.id || req.user._id);
    console.log("Body:", req.body);
    console.log("File:", req.file ? req.file.path : "No Media");

    // Capture User ID
    const userId = req.user.id || req.user._id;
    
    // 1. Fetch user for role mapping
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ success: false, msg: "User profile not found." });
    }

    // 2. Sync with Role Enum: ['Freelancer', 'Brand', 'Simple']
    const userRole = userDoc.role; 
    let assignedIntelType;
    
    // Clean mapping logic
    if (userRole === 'Simple' || userRole === 'simple') {
      assignedIntelType = 'Simple';
    } else if (userRole === 'Brand') {
      assignedIntelType = 'Brand';
    } else {
      assignedIntelType = 'Freelancer';
    }

    const averageRating = userDoc.averageRating || 0;

    // 🛡️ MEDIA DETECTION LOGIC (STABILIZED)
    let detectedMediaType = 'image';
    let mediaPath = false;

    if (req.file) {
      mediaPath = req.file.path;
      
      // Checking multiple sources to confirm if it's a video
      const isVideoMime = req.file.mimetype && req.file.mimetype.startsWith('video');
      const isVideoResource = req.file.resource_type === 'video';
      
      if (isVideoMime || isVideoResource) {
        detectedMediaType = 'video';
      }
    } else {
      // If no file was uploaded, return an error instead of crashing the server
      return res.status(400).json({ success: false, msg: "No media file uploaded." });
    }

    // 3. Prepare Base Data
    const intelData = {
      user: userId, 
      intelType: assignedIntelType, 
      intelImage: mediaPath, 
      mediaType: detectedMediaType, 
      ratingSnapshot: averageRating,
      verified: false 
    };

    // 4. Role-Specific Data Parsing
    if (assignedIntelType === 'Freelancer') {
      const { globalService, serviceDescription, portfolioLinks } = req.body;
      
      let parsedLinks = [];
      try {
        if (portfolioLinks) {
          parsedLinks = typeof portfolioLinks === 'string' 
            ? JSON.parse(portfolioLinks) 
            : portfolioLinks;
        }
      } catch (e) {
        parsedLinks = portfolioLinks ? [portfolioLinks] : [];
      }

      intelData.globalService = globalService || "Service Provided";
      intelData.serviceDescription = serviceDescription || "No description provided";
      intelData.portfolioLinks = Array.isArray(parsedLinks) 
        ? parsedLinks.filter(l => l && l.trim() !== "") 
        : [];
    } 
    else {
      // Logic for Brand AND Simple
      const { brandName, searchingFor, brandSocialLink } = req.body;
      
      intelData.brandName = brandName || userDoc.name || "Elite Entity";
      intelData.searchingFor = searchingFor || "Confidential objective";
      intelData.brandSocialLink = brandSocialLink || "";
    }

    // 5. Save to Database
    const newPost = new VipPost(intelData);
    await newPost.save();

    res.status(201).json({
      success: true,
      msg: "Intel received. Verification in progress.",
      post: newPost
    });

  } catch (err) {
    // 🔍 Improved logging to see the actual error object in Render
    console.error("❌ VIP CREATE ERROR:", err);
    res.status(500).json({ 
      success: false, 
      msg: "Internal Server Error", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined // Helps debug locally
    });
  }
};

// @desc    Get all APPROVED VIP Intel (Main Feed)
exports.getVipFeed = async (req, res) => {
  try {
    const feed = await VipPost.find({ verified: true })
      // ✅ UPDATE: Added speciality and customSpeciality to populate
      .populate('user', 'name identityImage avatar role averageRating speciality customSpeciality')
      .sort({ ratingSnapshot: -1, createdAt: -1 });

    res.json(feed);
  } catch (err) {
    console.error("FEED ERROR:", err.message);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
};

// --- ADMIN ACTIONS ---

exports.getPendingVipPosts = async (req, res) => {
  try {
    const pending = await VipPost.find({ verified: false })
      // ✅ UPDATE: Added speciality and customSpeciality to populate
      .populate('user', 'name role email identityImage avatar speciality customSpeciality')
      .sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error fetching pending" });
  }
};

exports.verifyVipPost = async (req, res) => {
  try {
    const { status } = req.body; 
    if (status === 'approve') {
      await VipPost.findByIdAndUpdate(req.params.id, { verified: true });
      return res.json({ success: true, msg: "Verified" });
    } 
    await VipPost.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: "Removed" });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Action failed" });
  }
};