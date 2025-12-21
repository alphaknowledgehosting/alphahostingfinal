const express = require('express');
const router = express.Router();
const Sheet = require('../models/Sheet');
const Progress = require('../models/Progress');
const { authenticateUser, requireRole } = require('../middleware/auth');

const sheetModel = new Sheet();
const progressModel = new Progress();

// Get all sheets (public)
router.get('/', async (req, res) => {
  try {
    const sheets = await sheetModel.getAllSheets();
    res.json({ success: true, sheets });
  } catch (error) {
    console.error('Error getting sheets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
      // console.log('Deleted all progress for sheet:', sheetId);
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
    // console.log('Adding section to sheet:', req.params.sheetId, 'Data:', req.body);
    const result = await sheetModel.addSection(req.params.sheetId, req.body);
    // console.log('Section added successfully:', result);
    res.json(result);
  } catch (error) {
    console.error('Error adding section:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update section (admin only)
router.put('/:sheetId/sections/:sectionId', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    // console.log('Updating section:', req.params.sectionId, 'Data:', req.body);
    const result = await sheetModel.updateSection(req.params.sheetId, req.params.sectionId, req.body);
    // console.log('Section updated successfully:', result);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete section (admin only) - FIXED
router.delete('/:sheetId/sections/:sectionId', authenticateUser, requireRole(['admin']), async (req, res) => {
  const { sheetId, sectionId } = req.params;
  // console.log('Starting deletion for section:', sectionId, 'from sheet:', sheetId);

  try {
    // First verify the sheet exists
    const sheetExists = await sheetModel.getSheetById(sheetId);
    if (!sheetExists) {
      // console.log('Sheet not found:', sheetId);
      return res.status(404).json({ success: false, message: 'Sheet not found' });
    }

    // console.log('Sheet found, proceeding with section deletion');

    // Delete all progress for this section first (non-blocking)
    try {
      // console.log('Attempting to delete progress for section:', sectionId);
      await progressModel.deleteBySectionId(sectionId);
      // console.log('Successfully deleted progress for section:', sectionId);
    } catch (progressError) {
      // console.error('Warning: Error deleting progress for section:', sectionId, progressError.message);
      // Continue with section deletion even if progress deletion fails
    }

    // Delete the section from the sheet
    // console.log('Attempting to delete section data for section:', sectionId);
    const result = await sheetModel.deleteSection(sheetId, sectionId);
    // console.log('Raw deletion result:', result);

    // Check if deletion was successful
    if (!result || !result.success || (result.modifiedCount !== undefined && result.modifiedCount === 0)) {
      // console.error('Section deletion failed - no documents were modified');
      throw new Error('Section not found or could not be deleted from the sheet');
    }

    // console.log('Section deleted successfully:', sectionId);
    res.json({ 
      success: true, 
      message: 'Section and all associated progress deleted successfully',
      deletedSectionId: sectionId,
      result: result 
    });

  } catch (error) {
    console.error('Failed to delete section:', sectionId, 'Error:', error.message);
    console.error('Full error stack:', error.stack);
    
    // Return more specific error messages
    let errorMessage = error.message || 'Unknown error occurred while deleting section';
    
    // Handle specific database errors
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



// Add subsection (admin only) - FIXED
router.post('/:sheetId/sections/:sectionId/subsections', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { sheetId, sectionId } = req.params;
    // console.log('Adding subsection to sheet:', sheetId, 'section:', sectionId, 'Data:', req.body);
    
    const result = await sheetModel.addSubsection(sheetId, sectionId, req.body);
    // console.log('Subsection added successfully:', result);
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
      // console.log('Deleted all progress for subsection:', subsectionId);
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

// Add problem (admin only) - FIXED
router.post('/:sheetId/sections/:sectionId/subsections/:subsectionId/problems', 
  authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { sheetId, sectionId, subsectionId } = req.params;
    // console.log('Adding problem to sheet:', sheetId, 'section:', sectionId, 'subsection:', subsectionId);
    // console.log('Problem data:', req.body);
    
    const problemData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const result = await sheetModel.addProblem(sheetId, sectionId, subsectionId, problemData);
    // console.log('Problem added successfully:', result);
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
      // console.log('Deleted progress records for problem:', problemId);
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

// Patch problem for inline updates - FIXED
router.patch('/:sheetId/sections/:sectionId/subsections/:subsectionId/problems/:problemId', 
  authenticateUser, requireRole(['admin', 'mentor']), async (req, res) => {
  try {
    const { sheetId, sectionId, subsectionId, problemId } = req.params;
    const updateData = req.body;

    // console.log('Patching problem:', problemId, 'with data:', updateData);

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
    
    // console.log('Problem patch result:', result);
    res.json({ success: true, message: 'Problem updated successfully' });
  } catch (error) {
    console.error('Error patching problem:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
