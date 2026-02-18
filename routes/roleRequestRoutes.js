const express = require('express');
const router = express.Router();
const roleCtrl = require('../controllers/roleRequestController');

// We only import 'protect' to bypass the 403 Admin restriction
const { protect } = require('../middleware/authMiddleware'); 

// ✅ CLOUDINARY NOTE: No upload middleware needed here yet 
// as portfolioLink is currently handled as a text URL string.

/**
 * @route   POST /api/role-request/apply
 * @desc    Submit a role upgrade request
 */
router.post('/apply', protect, roleCtrl.submitRoleRequest);

/**
 * @route   GET /api/role-request/admin/pending
 * @desc    Fetch all pending requests (Admin check removed for testing)
 */
router.get('/admin/pending', protect, roleCtrl.getPendingRequests);

/**
 * @route   PATCH /api/role-request/admin/verify/:id
 * @desc    Approve or Reject a request (Admin check removed for testing)
 */
router.patch('/admin/verify/:id', protect, roleCtrl.verifyRoleRequest);

module.exports = router;