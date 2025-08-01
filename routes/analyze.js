// routes/analyze.js
const express = require('express');
const router = express.Router();
const analyzeClothingImage = require('../utils/huggingFaceService');

router.post('/analyze', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });

  try {
    const result = await analyzeClothingImage(imageUrl);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
