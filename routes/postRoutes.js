const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// ✅ CLOUDINARY UPDATE: Import the upload service for post images
const { upload } = require('../config/cloudinary');

// Importing functions from the controller
const { 
  createPost, 
  getVerifiedPosts, 
  getPendingPosts, 
  acceptPost, 
  rejectPost 
} = require('../controllers/postController');

// --- 1. PUBLIC FEED ---
// Access: Public
// URL: GET /api/posts/feed
router.get('/feed', getVerifiedPosts);

// --- 2. USER BROADCAST ---
// Access: Private (Logged in users)
// URL: POST /api/posts/broadcast
// ✅ Added upload.single('postImage') to handle the project image
router.post('/broadcast', protect, upload.single('postImage'), createPost);

// --- 3. ADMIN OPERATIONS ---
// Access: Private (Should be Admin only)
// URL: GET /api/posts/pending
router.get('/pending', protect, getPendingPosts);

// URL: PUT /api/posts/accept/:id
router.put('/accept/:id', protect, acceptPost);

// URL: DELETE /api/posts/reject/:id
router.delete('/reject/:id', protect, rejectPost);

module.exports = router;