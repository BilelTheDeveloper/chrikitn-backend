const Payment = require('../models/Payment');
const User = require('../models/User');

// 📤 1. USER: Upload D17 Receipt
// Logic: Saves the Cloudinary URL and user selection to the database.
exports.uploadReceipt = async (req, res) => {
    try {
        const { plan, amount } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, msg: "Please upload the D17 receipt image." });
        }

        const newPayment = new Payment({
            user: req.user.id, // Provided by authMiddleware
            screenshot: req.file.path, // Cloudinary secure URL
            plan,
            amount
        });

        await newPayment.save();
        res.status(201).json({ success: true, msg: "Evidence submitted. Awaiting Admin verification." });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ success: false, msg: "Payment Submission Failure." });
    }
};

// ✅ 2. ADMIN: Approve Payment & Extend Access
// Logic: Calculates days based on plan and extends accessUntil date.
exports.approvePayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await Payment.findById(paymentId);

        if (!payment) return res.status(404).json({ success: false, msg: "Receipt not found." });
        if (payment.status !== 'Pending') return res.status(400).json({ success: false, msg: "Already processed." });

        // Calculate Extension (30 days for Monthly, 90 for Quarterly)
        const daysToAdd = payment.plan === 'Monthly' ? 30 : 90;
        const extensionMs = daysToAdd * 24 * 60 * 60 * 1000;

        const user = await User.findById(payment.user);
        if (!user) return res.status(404).json({ success: false, msg: "User not found." });

        // 🛡️ Extension Protection Logic:
        // Current Time
        const now = Date.now();
        
        // If user is already expired, we start extending from "Now".
        // If they still have time (e.g., 5 days left), we add the new 30 days onto their future date.
        const currentExpiry = user.accessUntil ? new Date(user.accessUntil).getTime() : now;
        const baseDate = currentExpiry > now ? currentExpiry : now;
        
        // Apply the extension
        user.accessUntil = new Date(baseDate + extensionMs);
        
        // ✅ UPDATE USER SUBSCRIPTION STATUS
        user.isPaused = false;
        user.status = 'Active';
        user.isPremium = true; // They paid, so they are now Premium
        user.subscriptionPlan = payment.plan; // Set to 'Monthly' or 'Quarterly'
        user.lastPaymentDate = new Date();

        // Update the payment record status
        payment.status = 'Approved';
        
        // Save both documents
        await user.save();
        await payment.save();

        res.json({ 
            success: true, 
            msg: `Access extended by ${daysToAdd} days for ${user.name}. New Expiry: ${user.accessUntil.toDateString()}` 
        });
    } catch (err) {
        console.error("Approval Error:", err);
        res.status(500).json({ success: false, msg: "Internal Approval Error." });
    }
};

// 📋 3. ADMIN: Get all Pending Receipts
// Logic: Fetches all payments waiting for approval and populates user info.
exports.getPendingPayments = async (req, res) => {
    try {
        const pending = await Payment.find({ status: 'Pending' })
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 }); // Newest first
        res.json({ success: true, data: pending });
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ success: false, msg: "Fetch Error." });
    }
};