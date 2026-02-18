const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateOTP, sendEmailOTP } = require('../utils/otpService');

/**
 * @desc    1. REQUEST PASSWORD RESET (Send OTP)
 * @route   POST /api/password/forgot
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, msg: "Email protocol required." });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        // Security Note: We don't tell the user if the email doesn't exist 
        // to prevent email fishing, but for your logic we will return success.
        if (!user) {
            return res.status(200).json({ 
                success: true, 
                msg: "If this account exists, an OTP has been dispatched." 
            });
        }

        // Generate OTP and Expiry (10 Minutes)
        const otp = generateOTP();
        user.resetOTP = otp;
        user.resetOTPExpires = Date.now() + 10 * 60 * 1000; 

        await user.save();

        // MASK EMAIL LOGIC (e.g., bi*******er@gmail.com)
        const [name, domain] = user.email.split('@');
        const maskedEmail = name.substring(0, 2) + "*".repeat(name.length - 4) + name.slice(-2) + "@" + domain;

        // Dispatch Email via Brevo
        await sendEmailOTP(user.email, otp);

        res.status(200).json({ 
            success: true, 
            msg: "Reset OTP transmitted successfully.",
            maskedEmail // Frontend will display this
        });

    } catch (err) {
        console.error('FORGOT_PASSWORD_ERROR:', err.message);
        res.status(500).json({ success: false, msg: "Internal Security Handshake failed." });
    }
};

/**
 * @desc    2. VERIFY RESET OTP
 * @route   POST /api/password/verify-otp
 */
exports.verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ 
            email: email.toLowerCase(),
            resetOTP: otp,
            resetOTPExpires: { $gt: Date.now() } // Must be in the future
        });

        if (!user) {
            return res.status(400).json({ 
                success: false, 
                msg: "Invalid or Expired OTP. Access Denied." 
            });
        }

        res.status(200).json({ 
            success: true, 
            msg: "OTP Verified. Protocol clear for password override." 
        });

    } catch (err) {
        res.status(500).json({ success: false, msg: "Verification logic failure." });
    }
};

/**
 * @desc    3. RESET PASSWORD (OVERRIDE)
 * @route   POST /api/password/reset
 */
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ 
            email: email.toLowerCase(),
            resetOTP: otp,
            resetOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false, 
                msg: "Session expired or invalid. Please restart the protocol." 
            });
        }

        // Hash new password using the same salt factor as registration
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // CLEAR OTP FIELDS AFTER SUCCESS
        user.resetOTP = null;
        user.resetOTPExpires = null;

        await user.save();

        res.status(200).json({ 
            success: true, 
            msg: "Password updated successfully. New credentials active." 
        });

    } catch (err) {
        console.error('RESET_PASSWORD_ERROR:', err.message);
        res.status(500).json({ success: false, msg: "Failed to update security credentials." });
    }
};