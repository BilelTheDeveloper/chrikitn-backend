const express = require('express');
const router = express.Router();
const { 
    getChatHistory, 
    sendMessage 
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// ✅ CLOUDINARY UPDATE: Import the upload service for chat media
const { upload } = require('../config/cloudinary');

// 1. Fetch the full history of a secure line
// URL: GET /api/chat/:connectionId
router.get('/:connectionId', protect, getChatHistory);

// 2. Transmit a new message (REST Fallback)
// URL: POST /api/chat/send
// ✅ Added upload middleware to support image sharing in chat via Cloudinary
router.post('/send', protect, upload.single('file'), sendMessage);

module.exports = router;