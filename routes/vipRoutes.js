const express = require('express');
const router = express.Router();

// ✅ Import both protect AND admin guards
const { protect, admin } = require('../middleware/authMiddleware');

// ✅ CLOUDINARY UPDATE: Handles the image upload to the cloud
const { upload } = require('../config/cloudinary'); 

const { 
    createVipPost, 
    getVipFeed, 
    getPendingVipPosts, 
    verifyVipPost 
} = require('../controllers/vipController');

// --- PUBLIC VIP FEED ---
// GET: Fetch all verified posts (Protect ensures only members see it)
router.get('/feed', protect, getVipFeed);

// --- USER ACTIONS ---
// ✅ ORDER MATTERS: protect first to identify the user, then upload for the image
router.post(
    '/create', 
    protect, 
    upload.single('intelImage'), 
    createVipPost
);

// --- ADMIN ACTIONS (Headquarters) ---
// ✅ ADDED 'admin': Only bilel.thedeveloper@gmail.com can access these
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