const mongoose = require('mongoose');

const VipPostSchema = new mongoose.Schema({
  // 🔗 The Owner of the post
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 🏷️ Category for form rendering and validation logic
  intelType: {
    type: String,
    // Added 'Founder' to the allowed list
    enum: ['Freelancer', 'Brand', 'Simple'], 
    required: true
  },

  // 🛡️ The Gatekeeper: False by default. Must be true to appear in the main feed.
  verified: {
    type: Boolean,
    default: false 
  },

  // --- 👤 FREELANCER SPECIFIC FIELDS ---
  globalService: { 
    type: String 
  },
  serviceDescription: { 
    type: String 
  },
  portfolioLinks: [
    { type: String }
  ], 

  // --- 🏢 BRAND SPECIFIC FIELDS ---
  brandName: { 
    type: String 
  },
  searchingFor: { 
    type: String 
  },
  brandSocialLink: { 
    type: String 
  },

  // --- 🛠️ SHARED SYSTEM FIELDS ---
  // Will store the path to the optimized WebP image or Video URL
  intelImage: { 
    type: mongoose.Schema.Types.Mixed, 
    default: false 
  }, 

  // ✅ NEW: DISTINGUISH MEDIA TYPE
  // This tells the frontend whether to render <img> or <video>
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  
  // A snapshot of user rating at the time of posting for the sorting algorithm
  ratingSnapshot: { 
    type: Number, 
    default: 0 
  }, 
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ⚡ SPEED OPTIMIZATION: 
// Indexing ratingSnapshot (high to low) and date (newest first)
// This makes the 'Trier' logic extremely fast on the database level.
VipPostSchema.index({ ratingSnapshot: -1, createdAt: -1 });

module.exports = mongoose.model('VipPost', VipPostSchema);