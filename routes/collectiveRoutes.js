const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware'); // Your Cloudinary middleware
const { protect } = require('../middleware/authMiddleware'); // ✅ CORRECTED NAME & DESTRUCTURING
const { initiateCollective } = require('../controllers/collectiveController');

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

module.exports = router;