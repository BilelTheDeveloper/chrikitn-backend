const express = require('express');
const router = express.Router();

// ✅ Import both protect AND admin guards
const { protect, admin } = require('../middleware/authMiddleware');

// 🛠️ THE CRITICAL FIX:
// Since cloudinary.js exports { cloudinary, upload }, we MUST destructure it here.
// This matches your config/cloudinary.js exactly and fixes "upload.single is not a function"
const { upload } = require('../config/cloudinary'); 

const { 
    createVipPost, 
    getVipFeed, 
    getPendingVipPosts, 
    verifyVipPost 
} = require('../controllers/vipController');

// TEMPORARY: Run this once to fix old database entries
router.get('/migrate-fix-media', async (req, res) => {
    try {
        const VipPost = require('../models/VipPost');
        const result = await VipPost.updateMany(
            { mediaType: { $exists: false } }, 
            { $set: { mediaType: 'image' } }
        );
        res.json({ 
            msg: "Migration Successful", 
            matched: result.matchedCount, 
            modified: result.modifiedCount 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PUBLIC VIP FEED ---
router.get('/feed', protect, getVipFeed);

// --- USER ACTIONS ---
router.post(
    '/create', 
    protect, 
    upload.single('intelImage'), 
    createVipPost
);

// --- ADMIN ACTIONS (Headquarters) ---
router.get(
    '/admin/pending', 
    protect, 
    admin, 
    getPendingVipPosts
);

router.patch(
    '/admin/verify/:id', 
    protect, 
    admin, 
    verifyVipPost
);

module.exports = router;