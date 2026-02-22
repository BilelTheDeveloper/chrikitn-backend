const mongoose = require('mongoose');

const CollectiveSchema = new mongoose.Schema({
  // 1. IDENTITY & BRANDING (The "Shopify" Assets)
  name: {
    type: String,
    required: [true, "Collective name protocol is required"],
    unique: true,
    trim: true
  },
  logo: {
    type: String, // Path to /uploads
    required: [true, "Collective brand logo is required"]
  },
  slogan: {
    type: String,
    required: [true, "Collective mission slogan is required"]
  },
  description: { // This feeds the "About" section in the web-in-web
    type: String,
    required: [true, "Collective intel summary is required"]
  },
  heroBackground: {
    type: String, // The high-res background image
    required: [true, "Collective portal visual is required"]
  },

  // 2. THE UNIT (Membership & Roles)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Declined'],
      default: 'Pending'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // 3. PORTFOLIO INTEL (Combined links/works)
  portfolioLinks: [String],
  lastWorks: [{
    image: String,
    title: String,
    link: String
  }],

  // ✅ NEW: SERVICES SECTION (Max 5)
  services: {
    type: [{
      title: { type: String, required: true },
      description: { type: String, required: true }
    }],
    validate: [arrayLimit, '{PATH} exceeds the limit of 5 services']
  },

  // 4. OPERATIONAL STATUS & DEPLOYMENT GATES
  rating: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    // Updated enum to include the Admin Approval phase
    enum: ['Assembling', 'Awaiting Admin', 'Active', 'Suspended'],
    default: 'Assembling' 
  },
  // New Flag: True only when Admin clicks "Deploy"
  isDeployed: {
    type: Boolean,
    default: false
  },
  deployedAt: {
    type: Date
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ✅ HELPER: VALIDATE MAX 5 SERVICES
function arrayLimit(val) {
  return val.length <= 5;
}

// Create an index to rank by rating for the feed
CollectiveSchema.index({ rating: -1, status: 1 });

module.exports = mongoose.model('Collective', CollectiveSchema);