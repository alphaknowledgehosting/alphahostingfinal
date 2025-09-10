const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const { authenticateUser } = require('../middleware/auth');

const progressModel = new Progress();

// Get user progress
router.get('/:userId', authenticateUser, async (req, res) => {
  try {
    const progress = await progressModel.getUserProgress(req.params.userId);
    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle problem completion
router.post('/toggle', authenticateUser, async (req, res) => {
  try {
    const { userId, problemId, sheetId, sectionId, subsectionId, completed } = req.body;
    
    // Verify user can only update their own progress
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot update progress for another user' 
      });
    }
    
    const result = await progressModel.toggleProblem(
      userId, 
      problemId, 
      sheetId, 
      sectionId, 
      subsectionId, 
      completed
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle revision marking
router.post('/toggle-revision', authenticateUser, async (req, res) => {
  try {
    const { userId, problemId, sheetId, sectionId, subsectionId, markedForRevision } = req.body;
    
    // Verify user can only update their own progress
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot update progress for another user' 
      });
    }
    
    const result = await progressModel.toggleRevision(
      userId, 
      problemId, 
      sheetId, 
      sectionId, 
      subsectionId, 
      markedForRevision
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user stats
router.get('/stats/:userId', authenticateUser, async (req, res) => {
  try {
    const stats = await progressModel.getUserStats(req.params.userId);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get problems marked for revision
router.get('/revision/:userId', authenticateUser, async (req, res) => {
  try {
    // Verify user can only access their own revision problems
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot access revision problems for another user' 
      });
    }
    
    const revisionProblems = await progressModel.getRevisionProblems(req.params.userId);
    res.json({ success: true, revisionProblems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
