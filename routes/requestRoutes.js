const express = require('express');
const router = express.Router();
const { 
    initiateRequest, 
    getIncomingRequests, 
    respondToRequest 
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

// 1. Send a new mission request
// URL: POST /api/requests/initiate
// ✅ No file upload here; mission details are purely text-based
router.post('/initiate', protect, initiateRequest);

// 2. Get requests for the logged-in freelancer
// URL: GET /api/requests/incoming
router.get('/incoming', protect, getIncomingRequests);

// 3. Accept or Reject a request
// URL: PATCH /api/requests/:id/respond
router.patch('/:id/respond', protect, respondToRequest);

module.exports = router;