const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// This connects to the credentials you put in your .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chriki_uploads', 
    // 🔑 THE FIX: 'auto' allows Cloudinary to switch between image and video automatically
    resource_type: 'auto', 
    // 🔑 ADDED: Video formats must be explicitly allowed
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'mpeg'],
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB safety limit for Render Free Tier
  }
});

module.exports = { cloudinary, upload };