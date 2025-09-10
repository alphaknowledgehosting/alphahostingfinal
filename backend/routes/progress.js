const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/auth');
const Progress = require('../models/Progress');

// @desc    Get user progress
// @route   GET /api/progress/:userId
router.get('/:userId', ensureAuth, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const progress = await Progress.find({ userId: req.params.userId });
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Toggle problem completion
// @route   POST /api/progress/toggle
router.post('/toggle', ensureAuth, async (req, res) => {
  try {
    const { problemId, sheetId, sectionId, subsectionId } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!problemId || !sheetId || !sectionId || !subsectionId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let progress = await Progress.findOne({ userId, problemId });

    if (progress) {
      progress.isCompleted = !progress.isCompleted;
      progress.completedAt = progress.isCompleted ? new Date() : null;
      progress.updatedAt = new Date();
    } else {
      progress = new Progress({
        userId,
        problemId,
        sheetId,
        sectionId,
        subsectionId,
        isCompleted: true,
        completedAt: new Date()
      });
    }

    await progress.save();
    res.json({ success: true, progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get progress statistics (UPDATED WITH SUBSECTION STATS)
// @route   GET /api/progress/stats/:userId
router.get('/stats/:userId', ensureAuth, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const progress = await Progress.find({ userId: req.params.userId, isCompleted: true });
    
    const stats = {
      totalCompleted: progress.length,
      sheetStats: {},
      sectionStats: {},
      subsectionStats: {}, // Added subsection stats
      recentActivity: []
    };

    // Calculate stats by sheet, section, and subsection
    progress.forEach(p => {
      // Sheet stats
      if (!stats.sheetStats[p.sheetId]) {
        stats.sheetStats[p.sheetId] = 0;
      }
      stats.sheetStats[p.sheetId]++;

      // Section stats
      if (!stats.sectionStats[p.sectionId]) {
        stats.sectionStats[p.sectionId] = 0;
      }
      stats.sectionStats[p.sectionId]++;

      // Subsection stats (NEW)
      if (!stats.subsectionStats[p.subsectionId]) {
        stats.subsectionStats[p.subsectionId] = 0;
      }
      stats.subsectionStats[p.subsectionId]++;
    });

    // Get recent activity (last 10 completed problems)
    const recentProgress = await Progress.find({ 
      userId: req.params.userId, 
      isCompleted: true 
    })
    .sort({ completedAt: -1 })
    .limit(10);

    stats.recentActivity = recentProgress.map(p => ({
      problemId: p.problemId,
      sheetId: p.sheetId,
      sectionId: p.sectionId,
      subsectionId: p.subsectionId, // Added for more detailed activity
      completedAt: p.completedAt
    }));

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Bulk update progress (for import/export features)
// @route   POST /api/progress/bulk
router.post('/bulk', ensureAuth, async (req, res) => {
  try {
    const { problems } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(problems)) {
      return res.status(400).json({ message: 'Problems must be an array' });
    }

    const bulkOps = problems.map(problem => ({
      updateOne: {
        filter: { userId, problemId: problem.problemId },
        update: {
          $set: {
            sheetId: problem.sheetId,
            sectionId: problem.sectionId,
            subsectionId: problem.subsectionId,
            isCompleted: problem.isCompleted,
            completedAt: problem.isCompleted ? new Date() : null,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await Progress.bulkWrite(bulkOps);
    res.json({ 
      success: true,
      message: 'Bulk update completed',
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
