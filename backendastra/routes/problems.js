const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const Sheet = require('../models/Sheet');
const Progress = require('../models/Progress');
const { authenticateUser, requireRole } = require('../middleware/auth');

const problemModel = new Problem();
const sheetModel = new Sheet();
const progressModel = new Progress();

// Get all problems (with optional filters)
router.get('/', async (req, res) => {
  try {
    const filters = {
      difficulty: req.query.difficulty,
      platform: req.query.platform,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      searchTerm: req.query.search
    };
    
    const problems = await problemModel.getAllProblems(filters);
    res.json({ success: true, problems });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search problems (for autocomplete)
router.get('/search', async (req, res) => {
  try {
    const { q, limit } = req.query;
    const problems = await problemModel.searchProblems(q || '', parseInt(limit) || 20);
    res.json({ success: true, problems });
  } catch (error) {
    console.error('Error searching problems:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ IMPORTANT: Batch endpoint MUST come BEFORE /:problemId route
router.post('/batch', async (req, res) => {
  try {
    const { problemIds } = req.body;
    
    if (!problemIds || !Array.isArray(problemIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'problemIds array required' 
      });
    }
    
    if (problemIds.length === 0) {
      return res.json({ success: true, problems: [] });
    }
    
    const problems = await problemModel.getProblemsByIds(problemIds);
    res.json({ success: true, problems });
  } catch (error) {
    console.error('Error fetching problems batch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get problem by ID (MUST come after /batch route)
router.get('/:problemId', async (req, res) => {
  try {
    const problem = await problemModel.getProblemById(req.params.problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    res.json({ success: true, problem });
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new problem (admin only)
router.post('/', authenticateUser, requireRole('admin'), async (req, res) => {
  try {
    const problemData = {
      ...req.body,
      createdBy: req.user.email || req.user._id
    };
    const result = await problemModel.createProblem(problemData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update problem (admin only)
router.put('/:problemId', authenticateUser, requireRole('admin'), async (req, res) => {
  try {
    const result = await problemModel.updateProblem(req.params.problemId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ NEW: Delete problem globally (removes from ALL sheets + ALL user progress)
router.delete('/:problemId', authenticateUser, requireRole('admin'), async (req, res) => {
  try {
    const { problemId } = req.params;
    
    const problem = await problemModel.getProblemById(problemId);
    if (!problem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Problem not found' 
      });
    }
    
    // Step 1: Remove problem from all sheets
    const sheets = await sheetModel.getAllSheets();
    for (const sheet of sheets) {
      let updated = false;
      
      sheet.sections?.forEach(section => {
        section.subsections?.forEach(subsection => {
          if (subsection.problemIds?.includes(problemId)) {
            subsection.problemIds = subsection.problemIds.filter(id => id !== problemId);
            updated = true;
          }
        });
      });
      
      if (updated) {
        await sheetModel.updateSheet(sheet.id, sheet);
      }
    }
    
    // Step 2: Delete ALL user progress for this problem
    await progressModel.deleteByProblemId(problemId);
    
    // Step 3: Delete the problem itself
    await problemModel.deleteProblem(problemId);
    
    res.json({ 
      success: true, 
      message: 'Problem deleted successfully from all sheets and all user progress removed' 
    });
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
