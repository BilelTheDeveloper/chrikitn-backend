const express = require('express');
const router = express.Router();
// ✅ Keep your original imports
const { registerUser, loginUser, sendOTP, verifyOTP } = require('../controllers/authController'); 
// ✅ ADDED: Import the protect middleware to verify identity for the "me" route
const { protect } = require('../middleware/authMiddleware');

// ✅ CLOUDINARY UPDATE: Import the upload service we created
const { upload } = require('../config/cloudinary');

// --- 1. ACCESS ROUTES ---

/**
 * @route   GET /api/auth/me
 * @desc    Get fresh user data from DB (Forces expiration check)
 * @access  Private
 */
router.get('/me', protect, (req, res) => {
    // req.user is automatically populated by the protect middleware
    res.status(200).json({
        success: true,
        data: req.user
    });
});

/**
 * @route   POST /api/auth/send-otp
 * @desc    Generates and sends 6-digit code to user email
 */
router.post('/send-otp', (req, res, next) => {
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
router.post('/verify-otp', verifyOTP);

/**
 * @route   POST /api/auth/signup
 * @desc    Registers with identityImage AND biometricImage + OTP check
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