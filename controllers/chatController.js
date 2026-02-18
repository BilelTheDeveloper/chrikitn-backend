const Message = require('../models/Message');
const Connection = require('../models/Connection');

// @desc    1. FETCH CHAT HISTORY
// @route   GET /api/chat/:connectionId
exports.getChatHistory = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const userId = req.user.id;

        // SECURITY CHECK: Is the user a participant in this connection?
        const connection = await Connection.findById(connectionId);
        
        if (!connection) {
            return res.status(404).json({ success: false, msg: "Secure line not found." });
        }

        if (!connection.participants.includes(userId)) {
            return res.status(401).json({ success: false, msg: "Unauthorized: You are not part of this mission." });
        }

        // Fetch messages and sort by time
        // ✅ IDENTITY IMAGE: Now populates with the Cloudinary URL from the user model
        const messages = await Message.find({ connectionId })
            .sort({ createdAt: 1 })
            .populate('sender', 'name identityImage'); 

        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Failed to retrieve archive." });
    }
};

// @desc    2. SAVE MESSAGE (Manual/Fallback/Image support)
// @route   POST /api/chat/send
exports.sendMessage = async (req, res) => {
    try {
        const { connectionId, content } = req.body;
        const senderId = req.user.id;

        // SECURITY CHECK
        const connection = await Connection.findById(connectionId);
        if (!connection || !connection.participants.includes(senderId)) {
            return res.status(401).json({ success: false, msg: "Unauthorized transmission." });
        }

        // ✅ CLOUDINARY UPDATE: Check if a file was uploaded in the chat
        let fileUrl = '';
        if (req.file) {
            fileUrl = req.file.path; // The Cloudinary URL
        }

        // CREATE MESSAGE
        const newMessage = await Message.create({
            connectionId,
            sender: senderId,
            content,
            fileUrl: fileUrl // Stores the image/file if present
        });

        // ✅ POPULATE SENDER DATA BEFORE SENDING BACK TO FRONTEND
        // This ensures identityImage (Cloudinary URL) and name are included
        const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name identityImage');

        // Update the Connection's lastMessage reference
        connection.lastMessage = newMessage._id;
        await connection.save();

        res.status(201).json({ success: true, data: populatedMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: "Transmission failed." });
    }
};