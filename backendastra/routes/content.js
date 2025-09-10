const express = require('express');
const router = express.Router();

// @desc    Get all content
// @route   GET /api/content
router.get('/', (req, res) => {
  // This endpoint can be used if you want to serve content from backend
  // For now, frontend will read from JSON file directly
  res.json({ message: 'Content served from frontend JSON file' });
});

module.exports = router;
