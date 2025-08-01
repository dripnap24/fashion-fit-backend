const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Wardrobe = require('../models/Wardrobe');
const { verifyToken } = require('../middleware/auth');
const analyzeClothingImage = require('../utils/huggingFaceService');

// Make sure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Setup multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Upload route
router.post('/upload', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image file is required' });

  try {
    const localPath = req.file.path;
    const localImageUrl = `http://localhost:5000/${localPath.replace(/\\/g, '/')}`;

    const result = await analyzeClothingImage(localPath);
    const aiLabel = result?.[0]?.label || 'unknown';

    const newItem = await Wardrobe.create({
      userId: req.user.id,
      imageUrl: localImageUrl,
      aiLabel,
    });

    res.status(201).json({ message: '✅ Uploaded & labeled', item: newItem });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'AI labeling or upload failed' });
  }
});

module.exports = router;


