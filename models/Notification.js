const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['COLLECTIVE_INVITE', 'MISSION_REQUEST', 'SYSTEM_ALERT', 'CHAT_NOTIF'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    // We keep this flexible so it never blocks a save
    collectiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collective' },
    missionId: { type: mongoose.Schema.Types.ObjectId }, // Kept for legacy support
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' }, // ✅ NEW: Synced with Connection/Request logic
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // ✅ ADDED: To track which post the mission is about
    externalLink: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  ctaStatus: { 
    type: String,
    enum: ['Pending', 'Completed', 'Ignored'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);