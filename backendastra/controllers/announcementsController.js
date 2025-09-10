const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { sendEmailToAllUsers } = require('../services/emailService');

// Helper function to validate UUID format
const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Helper function to validate ID (works with both UUID and ObjectId)
const isValidId = (id) => {
  if (!id) return false;
  // Check for UUID format (Astra DB)
  if (isValidUUID(id)) return true;
  // Check for MongoDB ObjectId format (24-character hex)
  if (id.match(/^[0-9a-fA-F]{24}$/)) return true;
  return false;
};

exports.getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({}, { sort: { createdAt: -1 } });
    // console.log(`📋 Fetched ${announcements.length} announcements`);
    res.json({ announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    // Check if user is admin or mentor
    if (!req.user || !['admin', 'mentor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { title, content, type, links, readTime } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const announcement = new Announcement({
      title,
      content,
      type: type || 'info',
      authorId: req.user._id,
      author: req.user.name,
      links: links || [],
      readTime: readTime || '2 min read'
    });

    await announcement.save();
    // console.log(`✅ Announcement created: ${announcement._id}`);

    // Send emails ONLY for urgent announcements
    let emailMessage = '';
    if (type === 'urgent') {
      try {
        const users = await User.find({ email: { $exists: true, $ne: null } });
        
        if (users.length > 0) {
          // Send emails in the background - don't block the response
          setImmediate(async () => {
            try {
              const emailResult = await sendEmailToAllUsers(announcement, users, type);
              // console.log(`🚨 URGENT announcement email notification sent:`, emailResult);
            } catch (emailError) {
              console.error('❌ Error sending urgent announcement emails:', emailError);
            }
          });
          
          // console.log(`🚨 Sending URGENT announcement emails to ${users.length} users`);
          emailMessage = ` Email notifications are being sent to all users due to urgent priority.`;
        }
      } catch (error) {
        // console.error('Error fetching users for urgent email notification:', error);
      }
    } else {
      // console.log(`📢 ${type.toUpperCase()} announcement created - no email notifications sent (only urgent announcements trigger emails)`);
      emailMessage = ` No email notifications sent (only urgent announcements trigger emails).`;
    }

    res.status(201).json({ 
      announcement, 
      success: true,
      message: `Announcement created successfully.${emailMessage}`
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    if (!req.user || !['admin', 'mentor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { announcementId } = req.params;
    const { title, content, type, links, readTime } = req.body;

    // Validate ID format
    if (!isValidId(announcementId)) {
      // console.log(`❌ Invalid announcement ID format for update: ${announcementId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid announcement ID format' 
      });
    }

    // console.log(`🔄 Updating announcement: ${announcementId}`);

    const announcement = await Announcement.findOne({ _id: announcementId });
    if (!announcement) {
      console.error(`❌ Announcement not found: ${announcementId}`);
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const previousType = announcement.type;
    
    announcement.title = title || announcement.title;
    announcement.content = content || announcement.content;
    announcement.type = type || announcement.type;
    announcement.links = links || announcement.links;
    announcement.readTime = readTime || announcement.readTime;

    await announcement.update();
    // console.log(`✅ Announcement updated: ${announcementId}`);

    // Send emails if announcement is updated to urgent (and wasn't urgent before)
    let emailMessage = '';
    if (type === 'urgent' && previousType !== 'urgent') {
      try {
        const users = await User.find({ email: { $exists: true, $ne: null } });
        
        if (users.length > 0) {
          setImmediate(async () => {
            try {
              const emailResult = await sendEmailToAllUsers(announcement, users, type);
              // console.log(`🚨 URGENT announcement update email notification sent:`, emailResult);
            } catch (emailError) {
              // console.error('❌ Error sending urgent announcement update emails:', emailError);
            }
          });
          
          // console.log(`🚨 Sending URGENT announcement update emails to ${users.length} users`);
          emailMessage = ` Email notifications sent due to urgent priority.`;
        }
      } catch (error) {
        console.error('Error fetching users for urgent email notification:', error);
      }
    }

    res.json({ 
      announcement, 
      success: true,
      message: `Announcement updated successfully.${emailMessage}`
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// FIXED: Updated delete function to handle UUID format
exports.deleteAnnouncement = async (req, res) => {
  try {
    // Permission check
    if (!req.user || !['admin', 'mentor'].includes(req.user.role)) {
      // console.log(`❌ Unauthorized delete attempt by user: ${req.user?.email || 'unknown'}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    const { announcementId } = req.params;
    
    // Validate ID format (UUID or ObjectId)
    if (!isValidId(announcementId)) {
      // console.log(`❌ Invalid announcement ID format: ${announcementId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid announcement ID format' 
      });
    }

    // console.log(`🗑️ User ${req.user.email} attempting to delete announcement: ${announcementId}`);

    // First verify announcement exists
    const existingAnnouncement = await Announcement.findOne({ _id: announcementId });
    
    if (!existingAnnouncement) {
      // console.log(`❌ Announcement not found in database: ${announcementId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Announcement not found or already deleted' 
      });
    }

    // console.log(`📋 Found announcement: "${existingAnnouncement.title}" by ${existingAnnouncement.author}`);

    // Perform the deletion
    const deleteResult = await Announcement.deleteOne({ _id: announcementId });
    
    if (deleteResult.deletedCount === 0) {
      // console.log(`❌ Delete operation failed for: ${announcementId}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete announcement from database' 
      });
    }

    // Double-check deletion was successful
    const confirmDeletion = await Announcement.findOne({ _id: announcementId });
    if (confirmDeletion) {
      console.error(`❌ CRITICAL: Announcement still exists after deletion: ${announcementId}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Deletion verification failed' 
      });
    }

    // console.log(`✅ Successfully deleted announcement: ${announcementId}`);
    // console.log(`📊 Deletion confirmed - announcement no longer exists in database`);

    // Send success response
    res.json({ 
      success: true, 
      message: 'Announcement deleted successfully',
      deletedId: announcementId,
      deletedTitle: existingAnnouncement.title,
      timestamp: new Date().toISOString()
    });

    // Log the successful deletion
    // console.log(`🎉 Announcement "${existingAnnouncement.title}" successfully deleted by ${req.user.email}`);

  } catch (error) {
    console.error('❌ Error during announcement deletion:', error);
    
    // Generic server error
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
