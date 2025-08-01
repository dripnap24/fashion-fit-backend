const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Wardrobe = require('../models/Wardrobe');
const { verifyToken } = require('../middleware/auth');
const analyzeClothingImage = require('../utils/huggingFaceService');

// ✅ Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 🛠️ Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// 📤 Upload clothing item with AI labeling
router.post('/upload', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image file is required' });
  }

  try {
    // 🧠 AI clothing label using local file path
    const result = await analyzeClothingImage(req.file.path);
    const aiLabel = result?.[0]?.label || 'unknown';

    const localImageUrl = `http://localhost:5000/uploads/${req.file.filename}`;

    // 💾 Save to MongoDB
    const newItem = await Wardrobe.create({
      userId: req.user.id,
      imageUrl: localImageUrl,
      aiLabel
    });

    res.status(201).json({ message: 'Uploaded & labeled', item: newItem });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'AI labeling or upload failed' });
  }
});

module.exports = router;



