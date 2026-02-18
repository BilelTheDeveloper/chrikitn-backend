const express = require('express');
const router = express.Router();
const { 
    forgotPassword, 
    verifyResetOTP, 
    resetPassword 
} = require('../controllers/passwordController');

// 🛡️ STEP 1: Request OTP (Dispatches Brevo Email)
// POST /api/password/forgot
router.post('/forgot', forgotPassword);

// 🛡️ STEP 2: Validate OTP
// POST /api/password/verify-otp
router.post('/verify-otp', verifyResetOTP);

// 🛡️ STEP 3: Final Password Override
// POST /api/password/reset
router.post('/reset', resetPassword);

module.exports = router;