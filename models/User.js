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
  // --- ADDED THIS FIELD ---
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