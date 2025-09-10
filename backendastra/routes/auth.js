const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

// Debug logging middleware
router.use('*', (req, res, next) => {
  // console.log(`🔍 Auth route: ${req.method} ${req.originalUrl}`);
  next();
});

// Google OAuth verification - MAKE SURE THIS MATCHES
router.post('/google/verify', authController.verifyGoogleToken);

// Get current user (protected route)
router.get('/user', authenticateUser, authController.getCurrentUser);

// Logout
router.post('/logout', authController.logout);

// Health check for auth routes
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Auth routes working',
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;
