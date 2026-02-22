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
        cb(new Error('Format rejected. Only images are allowed.'), false);
    }
};

// Existing VIP Upload
const uploadVip = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// NEW: Collective Upload (Handles multiple specific fields)
const uploadCollective = multer({
    storage,
    fileFilter,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit for high-res backgrounds
}).fields([
    { name: 'logo', maxCount: 1 },
    { name: 'background', maxCount: 1 }
]);

// 2. Existing Sharp Image Processing Logic (FOR VIP)
const optimizeVipImage = async (req, res, next) => {
    if (!req.file) return next();

    const outDir = 'uploads/vip';
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const filename = `intel-${Date.now()}.webp`;
    const outputPath = path.join(outDir, filename);

    try {
        await sharp(req.file.buffer)
            .resize(1000, 1000, { 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .webp({ quality: 75 }) 
            .toFile(outputPath);

        req.file.filename = filename;
        req.file.path = `/uploads/vip/${filename}`;
        
        next();
    } catch (err) {
        console.error("Sharp optimization failure (VIP):", err);
        next();
    }
};

// 3. NEW: Sharp Image Processing Logic (FOR COLLECTIVES)
const optimizeCollectiveImages = async (req, res, next) => {
    if (!req.files || (!req.files.logo && !req.files.background)) return next();

    const outDir = 'uploads/collectives';
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    try {
        // A. Process LOGO
        if (req.files.logo) {
            const logoFile = req.files.logo[0];
            const logoFilename = `logo-${Date.now()}.webp`;
            const logoPath = path.join(outDir, logoFilename);

            await sharp(logoFile.buffer)
                .resize(500, 500, { fit: 'cover' }) // Logo usually square/fixed
                .webp({ quality: 80 })
                .toFile(logoPath);

            // Update path for database
            req.files.logo[0].path = `/uploads/collectives/${logoFilename}`;
        }

        // B. Process HERO BACKGROUND
        if (req.files.background) {
            const bgFile = req.files.background[0];
            const bgFilename = `hero-${Date.now()}.webp`;
            const bgPath = path.join(outDir, bgFilename);

            await sharp(bgFile.buffer)
                .resize(1920, 1080, { // Wide screen optimization
                    fit: 'inside',
                    withoutEnlargement: true 
                })
                .webp({ quality: 75 }) // Heavy compression for large files
                .toFile(bgPath);

            // Update path for database
            req.files.background[0].path = `/uploads/collectives/${bgFilename}`;
        }

        next();
    } catch (err) {
        console.error("Sharp optimization failure (Collective):", err);
        next();
    }
};

module.exports = { 
    uploadVip, 
    optimizeVipImage,
    uploadCollective,      // Exporting the new Multi-upload
    optimizeCollectiveImages // Exporting the new Multi-processor
};