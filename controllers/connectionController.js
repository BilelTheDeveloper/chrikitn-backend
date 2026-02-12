const Connection = require('../models/Connection');
const User = require('../models/User'); // Explicitly import User to register the schema for population

// @desc    Get all active connections for the logged-in user
// @route   GET /api/connections
exports.getMyConnections = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find connections where the user is a participant
        const connections = await Connection.find({
            participants: { $in: [userId] }
        })
        // 1. Populate participants with all fields needed for the 'getPartner' logic
        // ✅ CLOUDINARY READY: identityImage will now return the full Cloudinary URL
        .populate({
            path: 'participants',
            select: 'name identityImage role email' 
        })
        // 2. Populate last message
        .populate({
            path: 'lastMessage',
            populate: { path: 'sender', select: 'name' }
        })
        .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: connections.length,
            data: connections
        });
    } catch (err) {
        console.error("Connection Fetch Error:", err);
        res.status(500).json({ success: false, msg: "Server Error fetching connections" });
    }
};