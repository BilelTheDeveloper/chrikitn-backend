const Access = require('../models/Access');
const User = require('../models/User');

// @desc    Add email to Admin Whitelist
exports.grantAccess = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    // Clean the email (lowercase and trim)
    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if already in whitelist
    const existing = await Access.findOne({ email: cleanEmail });
    if (existing) return res.status(400).json({ msg: "Email already has access" });

    // 2. Add to Access Collection
    await Access.create({ email: cleanEmail });

    // 3. Update User role to Admin if they exist in the User collection
    await User.findOneAndUpdate({ email: cleanEmail }, { role: 'Admin' });

    res.status(200).json({ success: true, msg: `Clearance granted to ${cleanEmail}` });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// @desc    Get all whitelisted emails
exports.getWhitelistedEmails = async (req, res) => {
  try {
    const list = await Access.find().sort({ grantedAt: -1 });
    // Ensure we always return an array even if empty
    res.status(200).json(list || []);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// @desc    Revoke Access
exports.revokeAccess = async (req, res) => {
  try {
    const { email } = req.params;
    const cleanEmail = email.toLowerCase().trim();

    // 🛡️ PROTECT SYSTEM MASTER: Prevent revoking the main admin if needed
    if (cleanEmail === 'bilel.thedeveloper@gmail.com') {
        return res.status(403).json({ msg: "System Master access cannot be revoked via terminal." });
    }

    await Access.findOneAndDelete({ email: cleanEmail });
    
    // Demote the user role back to Normal
    await User.findOneAndUpdate({ email: cleanEmail }, { role: 'Normal' });

    res.status(200).json({ success: true, msg: "Access revoked successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};