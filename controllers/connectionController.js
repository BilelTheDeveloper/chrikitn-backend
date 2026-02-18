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

// --- NEW UPDATES BELOW (Manual Purge & Ready Logic) ---

// @desc    Terminate a connection manually and purge all associated messages
// @route   DELETE /api/connections/terminate/:id
exports.terminateConnection = async (req, res) => {
    try {
        const connection = await Connection.findById(req.params.id);

        if (!connection) {
            return res.status(404).json({ success: false, msg: "Connection not found" });
        }

        // Security: Ensure the person deleting is one of the participants
        if (!connection.participants.includes(req.user.id)) {
            return res.status(401).json({ success: false, msg: "Unauthorized" });
        }

        // 1. Purge all messages for this specific room
        // ✅ FIXED: Changed chatRoomId to connectionId to match your Message Model
        const Message = require('../models/Message'); 
        await Message.deleteMany({ connectionId: req.params.id });

        // 2. Remove the connection record entirely
        await Connection.findByIdAndDelete(req.params.id);

        res.status(200).json({ 
            success: true, 
            msg: "Frequency terminated and history purged." 
        });
    } catch (err) {
        console.error("Termination Error:", err);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
};

// @desc    Toggle 'Deal Done' ready status for a user
// @route   POST /api/connections/ready/:id
exports.toggleReady = async (req, res) => {
    try {
        const connection = await Connection.findById(req.params.id);
        const userId = req.user.id;

        if (!connection || !connection.participants.includes(userId)) {
            return res.status(401).json({ success: false, msg: "Unauthorized" });
        }

        // If user already in eliteReady, remove them (toggle), otherwise add them
        const index = connection.eliteReady.indexOf(userId);
        if (index > -1) {
            connection.eliteReady.splice(index, 1);
        } else {
            connection.eliteReady.push(userId);
        }

        // ✅ UPDATE: When both are ready, flip isElite to true to protect from Janitor
        if (connection.eliteReady.length === 2) {
            connection.status = 'elite_pending';
            connection.isElite = true; 
        } else {
            connection.status = 'negotiating';
            connection.isElite = false; // Reset if someone un-clicks
        }

        await connection.save();

        res.status(200).json({ 
            success: true, 
            isElite: connection.isElite,
            readyCount: connection.eliteReady.length 
        });
    } catch (err) {
        console.error("Toggle Ready Error:", err);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
};