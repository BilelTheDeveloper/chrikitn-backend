const mongoose = require('mongoose');

const RoleRequestSchema = new mongoose.Schema({
  // 1. Link to the User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 2. What they want to become
  requestedRole: {
    type: String,
    enum: ['Freelancer', 'Brand'],
    required: true
  },
  
  // 3. Their proof of work
  portfolioLink: {
    type: String,
    required: [true, "Please provide a link to your dossier/portfolio"]
  },
  
  // 4. Verification Status
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  
  // 5. Applied Date
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RoleRequest', RoleRequestSchema);