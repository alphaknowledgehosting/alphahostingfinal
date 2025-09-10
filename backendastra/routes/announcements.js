const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { authenticateUser, requireRole } = require('../middleware/auth');

const announcementModel = new Announcement();

// Get all announcements (public access but with read status for authenticated users)
router.get('/', async (req, res) => {
  try {
    let announcements;
    
    // If user is authenticated, get announcements with read status
    if (req.user) {
      announcements = await announcementModel.getAllWithReadStatus(req.user._id);
    } else {
      announcements = await announcementModel.getAll();
    }
    
    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Error getting announcements:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread count for authenticated users
router.get('/unread-count', authenticateUser, async (req, res) => {
  try {
    const unreadCount = await announcementModel.getUnreadCount(req.user._id);
    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark announcement as read
router.post('/:announcementId/read', authenticateUser, async (req, res) => {
  try {
    const { announcementId } = req.params;
    // console.log('Marking announcement as read via API:', { announcementId, userId: req.user._id });
    
    const result = await announcementModel.markAsRead(announcementId, req.user._id);
    res.json(result);
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get read status for specific announcement
router.get('/:announcementId/read-status', authenticateUser, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const isRead = await announcementModel.isRead(announcementId, req.user._id);
    
    res.json({ success: true, isRead });
  } catch (error) {
    console.error('Error getting read status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create announcement (admin only) - FIXED with proper User model usage
router.post('/', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const announcementData = {
      ...req.body,
      createdBy: req.user._id,
      author: req.user.name || 'Admin'
    };

    // console.log(`📝 Creating ${req.body.type || 'info'} announcement:`, req.body.title);
    
    const result = await announcementModel.create(announcementData);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create announcement' 
      });
    }

    const announcement = result.announcement;
    let emailMessage = '';

    // CRITICAL: Send emails ONLY for urgent announcements
    if (announcement.type === 'urgent') {
      // console.log('🚨 URGENT announcement created - sending emails to all users...');
      
      try {
        // FIXED: Proper User model instantiation and usage
        const User = require('../models/User');
        const userModel = new User();
        const users = await userModel.getUsersWithEmails();
        
        // console.log(`📧 Found ${users.length} users in database`);
        
        if (users.length > 0) {
          // Send emails in background (non-blocking)
          setImmediate(async () => {
            try {
              const { sendEmailToAllUsers } = require('../services/emailService');
              const emailResult = await sendEmailToAllUsers(announcement, users, 'urgent');
              
              if (emailResult.success) {
                // console.log(`🎉 URGENT announcement emails sent: ${emailResult.count}/${emailResult.total} delivered`);
              } else if (emailResult.skipped) {
                // console.log(`⏭️ Email sending skipped: ${emailResult.reason}`);
              } else {
                // console.error(`❌ URGENT announcement email sending failed:`, emailResult.error);
              }
            } catch (emailError) {
              // console.error('❌ Error in background email sending:', emailError);
            }
          });
          
          emailMessage = ` 🚨 URGENT email notifications are being sent to ${users.length} users.`;
        } else {
          emailMessage = ` ⚠️ No users found with email addresses.`;
        }
      } catch (userFetchError) {
        console.error('❌ Error fetching users for email notification:', userFetchError);
        emailMessage = ` ❌ Error fetching user emails: ${userFetchError.message}`;
      }
    } else {
      // console.log(`📢 ${(req.body.type || 'info').toUpperCase()} announcement created - no emails sent (only URGENT announcements trigger emails)`);
      emailMessage = ` 📧 No emails sent (only URGENT announcements trigger email notifications).`;
    }

    // Send success response
    res.status(201).json({ 
      success: true,
      announcement,
      message: `Announcement created successfully.${emailMessage}`
    });

  } catch (error) {
    console.error('❌ Error creating announcement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create announcement: ' + error.message 
    });
  }
});

// Update announcement (admin only)
router.put('/:id', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const result = await announcementModel.update(req.params.id, req.body);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    // console.log('🗑️ Backend: Delete request received for ID:', id);
    
    if (!id) {
      // console.log('❌ Backend: No ID provided');
      return res.status(400).json({ 
        success: false, 
        message: 'Announcement ID is required' 
      });
    }

    // Perform deletion
    const deleteResult = await announcementModel.delete(id);
    // console.log('🗑️ Backend: Delete result:', deleteResult);

    // Check if deletion was successful
    if (deleteResult.success) {
      // console.log('✅ Backend: Deletion successful');
      return res.status(200).json({
        success: true,
        message: 'Announcement deleted successfully',
        deletedId: id,
        deletedCount: deleteResult.deletedCount || 1
      });
    } else {
      // console.log('❌ Backend: Deletion failed - not found');
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

  } catch (error) {
    console.error('❌ Backend: Error during deletion:', error);
    
    // Only send 500 for actual server errors
    return res.status(500).json({
      success: false,
      message: 'Internal server error during deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
