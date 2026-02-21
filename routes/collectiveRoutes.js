const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { 
  initiateCollective, 
  acceptInvitation,
  getAllCollectives, // <--- NEW
  getCollectiveById  // <--- NEW
} = require('../controllers/collectiveController');

// ✅ DISCOVERY ROUTE: Fetch all collectives for the feed
// This is the route the frontend is currently hitting and getting a 404 on
router.get('/', getAllCollectives);

// ✅ PORTAL ROUTE: Fetch a single collective's data
router.get('/:id', getCollectiveById);

// FOUNDING ROUTE (Phase 1)
router.post(
  '/initiate', 
  protect, 
  upload.fields([
    { name: 'logo', maxCount: 1 }, 
    { name: 'background', maxCount: 1 }
  ]), 
  initiateCollective
);

// ACCEPT SYNDICATE INVITATION (Phase 2 Handshake)
router.put('/accept/:id', protect, acceptInvitation);

module.exports = router;