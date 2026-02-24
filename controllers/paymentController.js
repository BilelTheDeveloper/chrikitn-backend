const Payment = require('../models/Payment');
const User = require('../models/User');

// 📤 1. USER: Upload D17 Receipt
// Logic: Saves the Cloudinary URL and user selection to the database.
exports.uploadReceipt = async (req, res) => {
    try {
        const { plan, amount } = req.body;

        if (!req.file) {
            return res.status(400).json({ msg: "Please upload the D17 receipt image." });
        }

        const newPayment = new Payment({
            user: req.user.id, // Provided by authMiddleware
            screenshot: req.file.path, // Cloudinary secure URL
            plan,
            amount
        });

        await newPayment.save();
        res.status(201).json({ msg: "Evidence submitted. Awaiting Admin verification." });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ msg: "Payment Submission Failure." });
    }
};

// ✅ 2. ADMIN: Approve Payment & Extend Access
// Logic: Calculates days based on plan and extends accessUntil date.
exports.approvePayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await Payment.findById(paymentId);

        if (!payment) return res.status(404).json({ msg: "Receipt not found." });
        if (payment.status !== 'Pending') return res.status(400).json({ msg: "Already processed." });

        // Calculate Extension (30 days for Monthly, 90 for Quarterly)
        const daysToAdd = payment.plan === 'Monthly' ? 30 : 90;
        const extensionMs = daysToAdd * 24 * 60 * 60 * 1000;

        const user = await User.findById(payment.user);
        if (!user) return res.status(404).json({ msg: "User not found." });

        // 🛡️ Extension Protection:
        // If the user is already expired, we start extending from "Now".
        // If they still have time, we add onto their "existing expiration date".
        const baseDate = user.accessUntil > Date.now() ? new Date(user.accessUntil) : new Date();
        user.accessUntil = new Date(baseDate.getTime() + extensionMs);
        
        // Restore their status and unpause the account
        user.isPaused = false;
        user.status = 'Active';

        // Update the payment record status
        payment.status = 'Approved';
        
        await user.save();
        await payment.save();

        res.json({ msg: `Access extended by ${daysToAdd} days for ${user.name}.` });
    } catch (err) {
        console.error("Approval Error:", err);
        res.status(500).json({ msg: "Approval Error." });
    }
};

// 📋 3. ADMIN: Get all Pending Receipts
// Logic: Fetches all payments waiting for approval and populates user info.
exports.getPendingPayments = async (req, res) => {
    try {
        const pending = await Payment.find({ status: 'Pending' })
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 }); // Newest first
        res.json(pending);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ msg: "Fetch Error." });
    }
};