const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/adminController');

// Only bilel.thedeveloper@gmail.com can trigger this
router.get('/dashboard-stats', protect, admin, getDashboardStats);

module.exports = router;