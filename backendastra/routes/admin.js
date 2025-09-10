const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateUser, requireRole } = require('../middleware/auth');

const userModel = new User();

// Get all users (admin only)
router.get('/users', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user role (admin only)
router.put('/users/:userId/role', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    if (!['admin', 'mentor', 'student'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    // Don't allow admin to change their own role
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change your own role' 
      });
    }
    
    const result = await userModel.updateUserRole(req.params.userId, role);
    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    // Don't allow admin to delete themselves
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }
    
    await userModel.deleteUser(req.params.userId);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
