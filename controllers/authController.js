const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// ✅ Use the service you created to keep this file clean
const { generateOTP, sendEmailOTP } = require('../utils/otpService');

// Temporary storage for OTPs (Email -> {code, expires})
let tempOTPStore = {};

/**
 * @desc    GENERATE AND SEND 6-DIGIT OTP
 * @route   POST /api/auth/send-otp
 */
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, msg: "Email required." });

    // ✅ Use your service logic
    const otp = generateOTP();
    
    // Store in memory for 5 minutes
    tempOTPStore[email] = {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000 
    };

    console.log(`[OTP] Attempting to send code to: ${email}`);

    // 🛡️ ENHANCEMENT: Race the email send against a 15s timeout
    // This ensures the controller doesn't wait forever if the network is stuck
    await Promise.race([
        sendEmailOTP(email, otp),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP_GATEWAY_TIMEOUT')), 15000))
    ]);
    
    console.log(`[OTP] Success: Code ${otp} sent to ${email}`);
    res.status(200).json({ success: true, msg: "OTP transmitted to email." });

  } catch (err) {
    // ✅ Log the REAL error so we can see it in the terminal
    console.error("❌ NODEMAILER_ERROR:", err.message);
    
    // Clean up store if mail fails
    if (req.body.email) delete tempOTPStore[req.body.email];

    res.status(500).json({ 
      success: false, 
      msg: "Failed to send OTP. Network handshake failed.",
      error: err.message 
    });
  }
};

/**
 * @desc    NEW: VERIFY OTP (Blocks user at Step 2 if wrong)
 * @route   POST /api/auth/verify-otp
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = tempOTPStore[email];

    if (!record || record.code !== otp || Date.now() > record.expires) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Invalid or Expired OTP. Access Denied.' 
      });
    }

    res.status(200).json({ success: true, msg: "OTP Verified. Proceed to next layer." });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Verification logic failure." });
  }
};

/**
 * @desc    REGISTER NEW OPERATIVE (With OTP + Dual-Image Verification)
 * @route   POST /api/auth/signup
 */
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, portfolioUrl, otp } = req.body;

    // --- OTP VERIFICATION CHECK ---
    const record = tempOTPStore[email];
    if (!record || record.code !== otp || Date.now() > record.expires) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Invalid or Expired OTP. Please request a new code.' 
      });
    }

    // 1. Check if identity already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Email protocol already exists in the system.' 
      });
    }

    // 2. Multi-File Validation Safety Check
    const identityFile = (req.files && req.files['identityImage']) ? req.files['identityImage'][0] : null;
    const biometricFile = (req.files && req.files['biometricImage']) ? req.files['biometricImage'][0] : null;

    if (!identityFile || !biometricFile) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Dual-image evidence (ID + Biometric) is required for protocol entry.' 
      });
    }

    // 3. Create the new user instance
    user = new User({
      name,
      email,
      phone,
      password,
      role,
      portfolioUrl: portfolioUrl || '',
      identityImage: identityFile.path,  
      biometricImage: biometricFile.path, 
      isVerified: role === 'Admin', 
      status: role === 'Admin' ? 'Active' : 'Pending'
    });

    // 4. Encrypt Secret Key
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 5. Save to Central Node
    await user.save();

    // ✅ Clear OTP from memory after success
    delete tempOTPStore[email];

    // 6. Generate Session Token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '24h' }
    );

    // 7. Success Response
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status
      }
    });

  } catch (err) {
    console.error('SERVER_ERROR:', err.message);
    res.status(500).json({ 
      success: false, 
      msg: 'Server Intelligence Error during registration.',
      error: err.message 
    });
  }
};

/**
 * @desc    AUTHENTICATE OPERATIVE
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, msg: 'Credentials Invalid.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, msg: 'Credentials Invalid.' });
    }

    // ✅ SECURITY UPDATE: Block access if status is not 'Active'
    if (user.status !== 'Active') {
      return res.status(403).json({ 
        success: false, 
        msg: 'Access Restricted: Your dossier is currently under Admin review.' 
      });
    }

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, msg: 'Authentication Protocol Failure.' });
  }
};