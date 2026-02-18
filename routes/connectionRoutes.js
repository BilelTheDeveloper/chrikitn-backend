const express = require('express');
const router = express.Router();
const { getMyConnections } = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

// URL: GET /api/connections
// ✅ No Cloudinary upload middleware needed here as we are only fetching data
router.get('/', protect, getMyConnections);

module.exports = router;