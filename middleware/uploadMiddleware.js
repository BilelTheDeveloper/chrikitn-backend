const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// ⚙️ CLOUDINARY CONFIGURATION
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 🛡️ THE "SILENT PIPE" STORAGE
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // 📁 Using your verified folder name
    folder: 'chriki_uploads', 
    
    // 🚀 STABILITY FIX: 'auto' is best for low RAM 
    // because it lets Cloudinary's servers do the heavy lifting
    resource_type: 'auto', 
    
    // Limits the formats at the Cloudinary gate to prevent invalid uploads
    allowed_formats: ['jpg', 'png', 'webp', 'WEBP', 'mp4', 'mov', 'quicktime'],
  },
});

const upload = multer({ 
  storage: storage,
  limits: { 
    // 20MB is the "Sweet Spot" for Render Free Tier. 
    // It prevents memory spikes that cause the 'undefined' crash.
    fileSize: 20 * 1024 * 1024 
  } 
});

module.exports = upload;