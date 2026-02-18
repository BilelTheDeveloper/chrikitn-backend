const mongoose = require('mongoose');

const ConnectionSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request'
    },
    chatRoomId: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: String,
        // ✅ Added 'elite_pending' to track when one person clicks Deal Done
        enum: ['negotiating', 'active', 'completed', 'terminated', 'elite_pending'],
        default: 'negotiating'
    },
    // ✅ Track who is ready for Elite Workspace (max 2 IDs)
    eliteReady: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // ✅ Flag to protect the connection from the 5-day auto-purge
    isElite: {
        type: Boolean,
        default: false
    },
    // ✅ Critical for the Janitor script (updates every message)
    lastActivity: {
        type: Date,
        default: Date.now
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Connection', ConnectionSchema);