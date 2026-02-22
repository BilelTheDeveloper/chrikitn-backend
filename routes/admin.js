const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Path to your User model
const fs = require('fs'); // Required to delete physical files
const path = require('path');

// NEW: Import Admin Controller for the new logic
const adminController = require('../controllers/adminController');
// NEW: Import Middleware (Assuming you have these for protection)
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/admin/users
// @desc    Get all users for the verification table
router.get('/users', async (req, res) => {
  try {
    // Sort by newest first
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server Error: Unable to fetch operatives" });
  }
});

// @route   PATCH /api/admin/verify/:id
// @desc    Update user verification status (ACCEPT)
router.patch('/verify/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isVerified: true, 
        status: 'Active' 
      },
      { new: true } // Return the updated document
    );
    
    if (!user) return res.status(404).json({ msg: "Operative not found" });
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ msg: "Protocol Failure: Update denied" });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Reject and permanently delete user + their images (REJECT)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: "Operative not found" });
    }

    // --- OPTIONAL: Delete physical images from uploads folder ---
    const filesToDelete = [user.identityImage, user.biometricImage];
    
    filesToDelete.forEach(filePath => {
      if (filePath) {
        const absolutePath = path.join(__dirname, '..', filePath); // Adjust path based on your folder structure
        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath);
        }
      }
    });

    // --- Delete user from Database ---
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, msg: "Operative and associated data purged" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "System Error: Purge sequence failed" });
  }
});

// --- NEW COLLECTIVE DEPLOYMENT ROUTES ---

// @route   GET /api/admin/dashboard-stats
router.get('/dashboard-stats', protect, admin, adminController.getDashboardStats);

// @route   GET /api/admin/pending-collectives
// @desc    Fetch syndicates awaiting admin approval
router.get('/pending-collectives', protect, admin, adminController.getPendingCollectives);

// @route   PUT /api/admin/deploy-collective/:id
// @desc    Final deployment switch
router.put('/deploy-collective/:id', protect, admin, adminController.deployCollective);

module.exports = router;