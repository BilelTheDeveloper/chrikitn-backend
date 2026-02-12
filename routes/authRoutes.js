const express = require('express');
const router = express.Router();
// ✅ Added verifyOTP to the imports
const { registerUser, loginUser, sendOTP, verifyOTP } = require('../controllers/authController'); 

// ✅ CLOUDINARY UPDATE: Import the upload service we created
const { upload } = require('../config/cloudinary');

// --- 1. ACCESS ROUTES ---

/**
 * @route   POST /api/auth/send-otp
 * @desc    Generates and sends 6-digit code to user email
 */
// Added a safety next() check to ensure no middleware hangs
router.post('/send-otp', (req, res, next) => {
    // Set a local timeout for this specific heavy network request
    res.setTimeout(30000, () => {
        if (!res.headersSent) {
            res.status(504).json({ success: false, msg: "Network Gateway Timeout" });
        }
    });
    next();
}, sendOTP);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Checks if OTP is correct before allowing user to proceed
 */
router.post('/verify-otp', verifyOTP); // ✅ Added this to block false codes at Step 2

/**
 * @route   POST /api/auth/signup
 * @desc    Registers with identityImage AND biometricImage + OTP check
 * ✅ Now using Cloudinary engine to handle the file upload
 */
router.post('/signup', (req, res, next) => {
  const multiUpload = upload.fields([
    { name: 'identityImage', maxCount: 1 },
    { name: 'biometricImage', maxCount: 1 }
  ]);

  multiUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        msg: err.message 
      });
    }
    next();
  });
}, registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticates user and returns JWT
 */
router.post('/login', loginUser);

module.exports = router;