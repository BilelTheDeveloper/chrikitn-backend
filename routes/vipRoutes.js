const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// ✅ CLOUDINARY UPDATE: Swap Sharp for Cloudinary service
const { upload } = require('../config/cloudinary'); 

const { 
    createVipPost, 
    getVipFeed, 
    getPendingVipPosts, 
    verifyVipPost 
} = require('../controllers/vipController');

// --- PUBLIC VIP FEED ---
// GET: Fetch all verified posts
router.get('/feed', protect, getVipFeed);

// --- USER ACTIONS ---
// POST: Create Intel (Auth -> Cloudinary Upload -> Controller)
// ✅ UPDATE: Replaced uploadVip/optimizeVipImage with cloud upload middleware
router.post(
    '/create', 
    protect, 
    upload.single('intelImage'), 
    createVipPost
);

// --- ADMIN ACTIONS (Headquarters) ---
// GET: Fetch all posts where verified: false
router.get('/admin/pending', protect, getPendingVipPosts);

// PATCH: Approve (verify: true) or Delete (Reject) a post
router.patch('/admin/verify/:id', protect, verifyVipPost);

module.exports = router;