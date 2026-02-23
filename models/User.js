const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // 1. Core Identity
  name: { 
    type: String, 
    required: [true, "Name protocol is required"] 
  },
  email: { 
    type: String, 
    required: [true, "Email protocol is required"], 
    unique: true,
    lowercase: true 
  },
  password: { 
    type: String, 
    required: [true, "Secret key is required"] 
  },

  // 2. Bio-Data
  phone: { 
    type: String, 
    required: [true, "Direct line is required"] 
  },
  role: { 
    type: String, 
    enum: ['Simple', 'Freelancer', 'Brand', 'Admin'], 
    default: 'Simple' 
  },
  portfolioUrl: { 
    type: String, 
    default: '' 
  },
  // 🏷️ BADGE PROTOCOL FIELDS
  speciality: { 
    type: String, 
    default: '' 
  },
  customSpeciality: { 
    type: String, 
    default: '' 
  },
  
  // --- UPDATED: SUBSCRIPTION & PREMIUM PROTOCOL ---
  subscriptionPlan: {
    type: String,
    enum: ['None', 'Monthly', 'Quarterly'],
    default: 'None'
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  isPremium: { 
    type: Boolean, 
    default: false 
  },
  // 🎁 The Gift: Starts with 90 days. 
  // Future payments will extend this specific date.
  accessUntil: { 
    type: Date, 
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
  },
  lastPaymentDate: {
    type: Date,
    default: null
  },
  // Keeping this so your old logic doesn't crash
  trialExpiration: { 
    type: Date, 
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
  },
  bio: { 
    type: String, 
    maxlength: [160, "Bio protocol must be under 160 characters"],
    default: "Neural Operative in the Collective." 
  },
  // ------------------------------------------

  // 3. Security & Verification
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Active', 'Suspended'], 
    default: 'Pending' 
  },
  // 🔐 PASSWORD RESET PROTOCOL FIELDS
  resetOTP: {
    type: String,
    default: null
  },
  resetOTPExpires: {
    type: Date,
    default: null
  },

  // 4. Evidence (The Uploaded ID & Biometric Capture)
  identityImage: { 
    type: String, 
    required: [true, "Identity image evidence is required"] 
  },
  biometricImage: { 
    type: String, 
    required: [true, "Biometric face capture is required"] 
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', UserSchema);