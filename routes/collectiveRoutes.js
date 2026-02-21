const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware'); // Your Cloudinary middleware
const { protect } = require('../middleware/authMiddleware'); // ✅ CORRECTED NAME & DESTRUCTURING
const { initiateCollective, acceptInvitation } = require('../controllers/collectiveController');

// FOUNDING ROUTE (Phase 1)
router.post(
  '/initiate', 
  protect, // ✅ Using 'protect' to ensure the user is logged in
  upload.fields([
    { name: 'logo', maxCount: 1 }, 
    { name: 'background', maxCount: 1 }
  ]), 
  initiateCollective
);

// ✅ NEW: ACCEPT SYNDICATE INVITATION (Phase 2 Handshake)
// Logic: Triggers the status change from 'Pending' to 'Joined'
router.put('/accept/:id', protect, acceptInvitation);

module.exports = router;