const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    relatedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    // The "Handshake" Statuses
    senderAccept: {
        type: Boolean,
        default: true // The one who sends the request obviously accepts it
    },
    receiverAccept: {
        type: Boolean,
        default: false // Waiting for the freelancer to click "Accept"
    },
    // Mission Briefing Data
    globalMissionObjective: {
        type: String,
        required: true,
        trim: true
    },
    missionDetails: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Request', RequestSchema);