const express = require('express');
const router = express.Router();
const { 
    getMyConnections, 
    terminateConnection, 
    toggleReady 
} = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

// URL: GET /api/connections
// ✅ No Cloudinary upload middleware needed here as we are only fetching data
router.get('/', protect, getMyConnections);

// ✅ NEW: Terminate Connection & Purge Messages
// URL: DELETE /api/connections/terminate/:id
router.delete('/terminate/:id', protect, terminateConnection);

// ✅ NEW: Toggle 'Deal Done' Ready Status
// URL: POST /api/connections/ready/:id
router.post('/ready/:id', protect, toggleReady);

module.exports = router;