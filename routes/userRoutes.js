const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Path: GET /api/users/profile/:id
router.get('/profile/:id', protect, userController.getUserProfile);

module.exports = router;