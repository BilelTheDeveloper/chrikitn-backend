const express = require('express');
const router = express.Router();
const { grantAccess, getWhitelistedEmails, revokeAccess } = require('../controllers/accessController');

// For now, we keep them open as you requested for testing
router.post('/grant', grantAccess);
router.get('/list', getWhitelistedEmails);
router.delete('/revoke/:email', revokeAccess);

module.exports = router;