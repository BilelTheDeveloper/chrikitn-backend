const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  // THE AUTHOR
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // PROJECT DATA
  domain: {
    type: String,
    required: true,
    trim: true
  },
  
  globalVision: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  goal: {
    type: String,
    required: true,
    trim: true
  },

  // ADMIN VERIFICATION LOGIC
  isVerified: {
    type: Boolean,
    default: false // Hidden from Feed until Admin changes this to true
  }
}, {
  // Automatically creates createdAt and updatedAt fields
  timestamps: true 
});

// Create index for faster querying of verified posts for the User Feed
PostSchema.index({ isVerified: 1, createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);