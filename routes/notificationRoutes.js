const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); 
const { getUserNotifications } = require('../controllers/notificationController');

/**
 * @route   GET /api/notifications
 * @desc    Fetch all collective invites and mission requests for the user
 * @access  Private (Operatives Only)
 */
router.get('/', protect, getUserNotifications);

module.exports = router;