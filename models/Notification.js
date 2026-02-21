const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // 1. TARGET & SENDER
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

  // 2. CONTENT PROTOCOL
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

  // 3. THE "ACTION" DATA (Crucial for the "Accept" button)
  metadata: {
    collectiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collective' },
    missionId: { type: mongoose.Schema.Types.ObjectId },
    externalLink: String
  },

  // 4. STATUS
  isRead: {
    type: Boolean,
    default: false
  },
  ctaStatus: { // Track if they already Accepted/Declined
    type: String,
    enum: ['Pending', 'Completed', 'Ignored'],
    default: 'Pending'
  },

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Auto-purge after 7 days to keep DB clean (Janitor style)
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);