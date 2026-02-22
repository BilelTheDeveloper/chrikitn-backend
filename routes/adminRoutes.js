const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { 
    getDashboardStats, 
    getPendingCollectives, // ✅ ADDED
    deployCollective      // ✅ ADDED
} = require('../controllers/adminController');

// @desc    Get All Main Dashboard Stats
// @route   GET /api/admin/dashboard-stats
router.get('/dashboard-stats', protect, admin, getDashboardStats);

// @desc    Get all collectives waiting for Admin Deployment
// @route   GET /api/admin/pending-collectives
router.get('/pending-collectives', protect, admin, getPendingCollectives); // ✅ REGISTERED

// @desc    Final Deployment of a Collective
// @route   PUT /api/admin/deploy-collective/:id
router.put('/deploy-collective/:id', protect, admin, deployCollective); // ✅ REGISTERED

module.exports = router;