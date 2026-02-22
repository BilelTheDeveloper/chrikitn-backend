const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { 
  initiateCollective, 
  acceptInvitation,
  deployCollective,
  deleteCollective, // ✅ ADDED: The Termination Logic
  getAllCollectives, 
  getCollectiveById  
} = require('../controllers/collectiveController');

// --- PUBLIC & DISCOVERY ---

// ✅ DISCOVERY ROUTE: Fetch all ACTIVE collectives for the feed
router.get('/', getAllCollectives);

// ✅ PORTAL ROUTE: Fetch a single collective's data (Used for both Preview and Live)
router.get('/:id', getCollectiveById);


// --- OPERATIONAL PHASES ---

// 🛡️ PHASE 1: FOUNDING
// Creates the Syndicate with "Assembling" status
router.post(
  '/initiate', 
  protect, 
  upload.fields([
    { name: 'logo', maxCount: 1 }, 
    { name: 'background', maxCount: 1 }
  ]), 
  initiateCollective
);

// 🤝 PHASE 2: THE HANDSHAKE
// Members accept their recruitment invitations
router.put('/accept/:id', protect, acceptInvitation);

// 🚀 PHASE 3: DEPLOYMENT (ADMIN ONLY)
// Final verification by Admin to move from "Awaiting Admin" to "Active"
router.put('/deploy/:id', protect, deployCollective);

// 🧨 PHASE 4: TERMINATION (ADMIN ONLY)
// Admin rejects and purges the collective from the database
router.delete('/:id', protect, deleteCollective);

module.exports = router;