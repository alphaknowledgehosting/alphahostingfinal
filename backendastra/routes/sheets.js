const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const Sheet = require('../models/Sheet');
const Progress = require('../models/Progress');
const { authenticateUser, requireRole } = require('../middleware/auth');

const sheetModel = new Sheet();
const progressModel = new Progress();
const problemModel = new Problem();

// ✅ NEW: Get all sheets with embedded problems in ONE call
router.get('/with-problems', async (req, res) => {
  try {
    const sheets = await sheetModel.getAllSheets();
    
    // Collect all unique problem IDs across all sheets
    const allProblemIds = new Set();
    sheets.forEach(sheet => {
      sheet.sections?.forEach(section => {
        section.subsections?.forEach(subsection => {
          subsection.problemIds?.forEach(id => allProblemIds.add(id));
        });
      });
    });
    
    // Fetch all problems in one batch query
    let allProblems = [];
    if (allProblemIds.size > 0) {
      allProblems = await problemModel.getBatch(Array.from(allProblemIds));
    }
    
    // Create problem lookup map for O(1) access
    const problemMap = {};
    allProblems.forEach(problem => {
      problemMap[problem.id] = problem;
    });
    
    // Attach problems to each sheet
    const sheetsWithProblems = sheets.map(sheet => {
      const sheetProblemIds = new Set();
      sheet.sections?.forEach(section => {
        section.subsections?.forEach(subsection => {
          subsection.problemIds?.forEach(id => sheetProblemIds.add(id));
        });
      });
      
      // Get all problems for this sheet
      const sheetProblems = Array.from(sheetProblemIds)
        .map(id => problemMap[id])
        .filter(Boolean);
      
      return {
        ...sheet,
        problems: sheetProblems
      };
    });
    
    res.json({ 
      success: true, 
      sheets: sheetsWithProblems,
      totalProblems: allProblems.length 
    });
  } catch (error) {
    console.error('Error getting sheets with problems:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all sheets (public) - Keep for backward compatibility
router.get('/', async (req, res) => {
  try {
    const sheets = await sheetModel.getAllSheets();
    res.json({ success: true, sheets });
  } catch (error) {
    console.error('Error getting sheets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ NEW: Unlink problem from subsection (doesn't delete globally)
router.delete(
  '/:sheetId/sections/:sectionId/subsections/:subsectionId/problems/:problemId/unlink',
  authenticateUser,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { sheetId, sectionId, subsectionId, problemId } = req.params;
      
      await sheetModel.unlinkProblem(sheetId, sectionId, subsectionId, problemId);
      
      res.json({ 
        success: true, 
        message: 'Problem unlinked from subsection successfully' 
      });
    } catch (error) {
      console.error('Error unlinking problem:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
);

// Link existing problem to subsection
router.post(
  '/:sheetId/sections/:sectionId/subsections/:subsectionId/link-problem',
  authenticateUser,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { sheetId, sectionId, subsectionId } = req.params;
      const { problemId } = req.body;

      // Verify problem exists
      const problemModel = new Problem();
      const problem = await problemModel.getProblemById(problemId);
      if (!problem) {
        return res.status(404).json({ success: false, message: 'Problem not found' });
      }

      // Add problem reference to subsection
      await sheetModel.addProblemToSubsection(sheetId, sectionId, subsectionId, problemId);
      
      // ✅ Progress sync now happens automatically inside addProblemToSubsection
      
      res.json({ 
        success: true, 
        message: 'Problem linked successfully and progress synced for all users', 
        problem 
      });
    } catch (error) {
      console.error('Error linking problem:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// UPDATE: Remove problem reference (not delete the problem itself)
router.delete(
  '/:sheetId/sections/:sectionId/subsections/:subsectionId/problems/:problemId',
  authenticateUser,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { sheetId, sectionId, subsectionId, problemId } = req.params;
      
      // Remove reference from subsection (problem still exists globally)
      await sheetModel.removeProblemFromSubsection(sheetId, sectionId, subsectionId, problemId);
      
      res.json({ 
        success: true, 
        message: 'Problem unlinked from subsection (problem still exists globally)' 
      });
    } catch (error) {
      console.error('Error unlinking problem:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Get sheet by ID (public)
router.get('/:sheetId', async (req, res) => {
  try {
    const sheet = await sheetModel.getSheetById(req.params.sheetId);
    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet not found' });
    }
    res.json({ success: true, sheet });
  } catch (error) {
    console.error('Error getting sheet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create sheet (admin only)
router.post('/', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const sheetData = {
      ...req.body,
      createdBy: req.user._id
    };
    const result = await sheetModel.createSheet(sheetData);
    res.json(result);
  } catch (error) {
    console.error('Error creating sheet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update sheet (admin only)
router.put('/:sheetId', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const result = await sheetModel.updateSheet(req.params.sheetId, req.body);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error updating sheet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete sheet (admin only)
router.delete('/:sheetId', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { sheetId } = req.params;
    
    // Delete all progress for this sheet first
    try {
      await progressModel.deleteBySheetId(sheetId);
    } catch (progressError) {
      console.error('Error deleting progress for sheet:', sheetId, progressError);
    }
    
    // Delete the sheet
    await sheetModel.deleteSheet(sheetId);
    res.json({ success: true, message: 'Sheet and all associated progress deleted successfully' });
  } catch (error) {
    console.error('Error deleting sheet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add section (admin only)
router.post('/:sheetId/sections', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const result = await sheetModel.addSection(req.params.sheetId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error adding section:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update section (admin only)
router.put('/:sheetId/sections/:sectionId', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const result = await sheetModel.updateSection(req.params.sheetId, req.params.sectionId, req.body);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete section (admin only)
router.delete('/:sheetId/sections/:sectionId', authenticateUser, requireRole(['admin']), async (req, res) => {
  const { sheetId, sectionId } = req.params;

  try {
    // First verify the sheet exists
    const sheetExists = await sheetModel.getSheetById(sheetId);
    if (!sheetExists) {
      return res.status(404).json({ success: false, message: 'Sheet not found' });
    }

    // Delete all progress for this section first (non-blocking)
    try {
      await progressModel.deleteBySectionId(sectionId);
    } catch (progressError) {
      console.error('Warning: Error deleting progress for section:', sectionId, progressError.message);
    }

    // Delete the section from the sheet
    const result = await sheetModel.deleteSection(sheetId, sectionId);

    // Check if deletion was successful
    if (!result || !result.success || (result.modifiedCount !== undefined && result.modifiedCount === 0)) {
      throw new Error('Section not found or could not be deleted from the sheet');
    }

    res.json({ 
      success: true, 
      message: 'Section and all associated progress deleted successfully',
      deletedSectionId: sectionId,
      result: result 
    });

  } catch (error) {
    console.error('Failed to delete section:', sectionId, 'Error:', error.message);
    
    let errorMessage = error.message || 'Unknown error occurred while deleting section';
    
    if (error.message.includes('Cast to ObjectId failed')) {
      errorMessage = 'Invalid section ID format';
    } else if (error.message.includes('not found')) {
      errorMessage = 'Section not found in the sheet';
    }
    
    res.status(500).json({ 
      success: false, 
      message: `Failed to delete section: ${errorMessage}`,
      sectionId: sectionId,
      sheetId: sheetId,
      errorType: error.name || 'UnknownError'
    });
  }
});

// Add subsection (admin only)
router.post('/:sheetId/sections/:sectionId/subsections', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { sheetId, sectionId } = req.params;
    const result = await sheetModel.addSubsection(sheetId, sectionId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error adding subsection:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update subsection (admin only)
router.put('/:sheetId/sections/:sectionId/subsections/:subsectionId', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const result = await sheetModel.updateSubsection(
      req.params.sheetId, 
      req.params.sectionId, 
      req.params.subsectionId, 
      req.body
    );
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error updating subsection:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete subsection (admin only)
router.delete('/:sheetId/sections/:sectionId/subsections/:subsectionId', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { subsectionId } = req.params;
    
    // Delete all progress for this subsection first
    try {
      await progressModel.deleteBySubsectionId(subsectionId);
    } catch (progressError) {
      console.error('Error deleting progress for subsection:', subsectionId, progressError);
    }
    
    const result = await sheetModel.deleteSubsection(
      req.params.sheetId, 
      req.params.sectionId, 
      req.params.subsectionId
    );
    res.json({ success: true, message: 'Subsection and all associated progress deleted successfully' });
  } catch (error) {
    console.error('Error deleting subsection:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add problem (admin only)
router.post('/:sheetId/sections/:sectionId/subsections/:subsectionId/problems', 
  authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { sheetId, sectionId, subsectionId } = req.params;
    
    const problemData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const result = await sheetModel.addProblem(sheetId, sectionId, subsectionId, problemData);
    res.json(result);
  } catch (error) {
    console.error('Error adding problem:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update problem (admin can update all, mentor can update editorial only)
router.put('/:sheetId/sections/:sectionId/subsections/:subsectionId/problems/:problemId', 
  authenticateUser, requireRole(['admin', 'mentor']), async (req, res) => {
  try {
    let updateData = req.body;
    
    // If user is mentor, only allow editorial updates
    if (req.user.role === 'mentor') {
      updateData = {
        editorialLink: req.body.editorialLink,
        notesLink: req.body.notesLink,
        updatedAt: new Date().toISOString()
      };
    }
    
    const result = await sheetModel.updateProblem(
      req.params.sheetId, 
      req.params.sectionId, 
      req.params.subsectionId, 
      req.params.problemId,
      updateData
    );
    res.json(result);
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete problem (admin only)
router.delete('/:sheetId/sections/:sectionId/subsections/:subsectionId/problems/:problemId', 
  authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { problemId } = req.params;

    // Delete all progress records for this problem
    try {
      await progressModel.deleteByProblemId(problemId);
    } catch (progressError) {
      console.error('Error deleting progress for problem:', problemId, progressError);
    }

    // Delete the problem from the sheet
    const result = await sheetModel.deleteProblem(
      req.params.sheetId, 
      req.params.sectionId, 
      req.params.subsectionId, 
      req.params.problemId
    );

    res.json({ success: true, message: 'Problem and associated progress deleted successfully' });
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Patch problem for inline updates
router.patch('/:sheetId/sections/:sectionId/subsections/:subsectionId/problems/:problemId', 
  authenticateUser, requireRole(['admin', 'mentor']), async (req, res) => {
  try {
    const { sheetId, sectionId, subsectionId, problemId } = req.params;
    const updateData = req.body;

    // Restrict mentors to only update editorial and notes fields
    if (req.user.role === 'mentor') {
      const allowedFields = ['editorialLink', 'notesLink'];
      const providedFields = Object.keys(updateData);
      
      for (const field of providedFields) {
        if (!allowedFields.includes(field)) {
          return res.status(403).json({ 
            success: false, 
            message: `Mentors can only update editorial and notes fields. Cannot update: ${field}` 
          });
        }
      }
    }

    updateData.updatedAt = new Date().toISOString();

    const result = await sheetModel.updateProblem(sheetId, sectionId, subsectionId, problemId, updateData);
    
    res.json({ success: true, message: 'Problem updated successfully' });
  } catch (error) {
    console.error('Error patching problem:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
