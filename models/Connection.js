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
        enum: ['negotiating', 'active', 'completed', 'terminated'],
        default: 'negotiating'
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