const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// ✅ CLOUDINARY UPDATE: Handles the image upload to the cloud
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
// ✅ FIX: Added 'protect' here so the controller knows WHO is posting
router.post(
    '/create', 
    protect, 
    upload.single('intelImage'), 
    createVipPost
);

// --- ADMIN ACTIONS (Headquarters) ---
router.get('/admin/pending', protect, getPendingVipPosts);
router.patch('/admin/verify/:id', protect, verifyVipPost);

module.exports = router;