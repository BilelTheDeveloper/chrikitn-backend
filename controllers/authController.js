const User = require('../models/User');
const Access = require('../models/Access'); // ✅ IMPORTED: The Access model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, sendEmailOTP } = require('../utils/otpService');

let tempOTPStore = {};

/**
 * @desc    GENERATE AND SEND 6-DIGIT OTP
 * @route   POST /api/auth/send-otp
 */
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, msg: "Email required." });

    const otp = generateOTP();
    
    tempOTPStore[email] = {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000 
    };

    console.log(`[OTP] Attempting to send code to: ${email}`);

    await Promise.race([
        sendEmailOTP(email, otp),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP_GATEWAY_TIMEOUT')), 15000))
    ]);
    
    console.log(`[OTP] Success: Code ${otp} sent to ${email}`);
    res.status(200).json({ success: true, msg: "OTP transmitted to email." });

  } catch (err) {
    console.error("❌ NODEMAILER_ERROR:", err.message);
    if (req.body.email) delete tempOTPStore[req.body.email];

    res.status(500).json({ 
      success: false, 
      msg: "Failed to send OTP. Network handshake failed.",
      error: err.message 
    });
  }
};

/**
 * @desc    NEW: VERIFY OTP
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
 * @desc    REGISTER NEW OPERATIVE
 */
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, portfolioUrl, otp, speciality, customSpeciality } = req.body;

    const record = tempOTPStore[email];
    if (!record || record.code !== otp || Date.now() > record.expires) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Invalid or Expired OTP.' 
      });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Email protocol already exists.' 
      });
    }

    const identityFile = (req.files && req.files['identityImage']) ? req.files['identityImage'][0] : null;
    const biometricFile = (req.files && req.files['biometricImage']) ? req.files['biometricImage'][0] : null;

    if (!identityFile || !biometricFile) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Dual-image evidence required.' 
      });
    }

    user = new User({
      name,
      email,
      phone,
      password,
      role,
      portfolioUrl: portfolioUrl || '',
      speciality: speciality || '',
      customSpeciality: customSpeciality || '',
      identityImage: identityFile.path,  
      biometricImage: biometricFile.path, 
      isVerified: role === 'Admin', 
      status: role === 'Admin' ? 'Active' : 'Pending'
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    delete tempOTPStore[email];

    const adminAccess = await Access.findOne({ email: user.email.toLowerCase() });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, isAdmin: !!adminAccess }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status,
        accessUntil: user.accessUntil, // ✅ ADDED: Send subscription end date
        isPaused: user.isPaused,       // ✅ ADDED: Send pause status
        isAdmin: !!adminAccess 
      }
    });

  } catch (err) {
    console.error('SERVER_ERROR:', err.message);
    res.status(500).json({ success: false, msg: 'Error during registration.' });
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

    if (user.status !== 'Active') {
      return res.status(403).json({ 
        success: false, 
        msg: 'Access Restricted: Your dossier is currently under Admin review.' 
      });
    }

    const adminAccess = await Access.findOne({ email: user.email.toLowerCase() });

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        isAdmin: !!adminAccess 
      }, 
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
        status: user.status,
        accessUntil: user.accessUntil, // ✅ ADDED: Send subscription end date
        isPaused: user.isPaused,       // ✅ ADDED: Send pause status
        isAdmin: !!adminAccess 
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, msg: 'Authentication Protocol Failure.' });
  }
};