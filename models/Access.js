const mongoose = require('mongoose');

const AccessSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  grantedBy: {
    type: String, // You can store the email of the admin who granted this
    default: 'System_Master'
  },
  grantedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Access', AccessSchema);