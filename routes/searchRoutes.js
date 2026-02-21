const express = require('express');
const router = express.Router();
// 1. Make sure the path to your controller is correct
const { searchOperatives } = require('../controllers/searchController'); 
// 2. Make sure the path to your middleware is correct
const { protect } = require('../middleware/authMiddleware'); 

// THE SEARCH TUNNEL
// Line 7 is likely here. 'searchOperatives' must be a function.
router.get('/operatives', protect, searchOperatives); 

module.exports = router;