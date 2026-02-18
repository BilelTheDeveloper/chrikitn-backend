const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 1. Memory Storage (keep the file in RAM for Sharp to process)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Format rejected. Only images are allowed for VIP Intel.'), false);
    }
};

const uploadVip = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 2. Sharp Image Processing Logic
const optimizeVipImage = async (req, res, next) => {
    if (!req.file) return next();

    // Ensure the output directory exists
    const outDir = 'uploads/vip';
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    // Define optimized filename
    const filename = `intel-${Date.now()}.webp`;
    const outputPath = path.join(outDir, filename);

    try {
        await sharp(req.file.buffer)
            .resize(1000, 1000, { 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .webp({ quality: 75 }) // Converts to WebP and compresses
            .toFile(outputPath);

        // Update req.file properties so the Controller saves the right path
        req.file.filename = filename;
        req.file.path = `/uploads/vip/${filename}`;
        
        next();
    } catch (err) {
        console.error("Sharp optimization failure:", err);
        next();
    }
};

module.exports = { uploadVip, optimizeVipImage };