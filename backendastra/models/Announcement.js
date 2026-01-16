const { DataAPIClient, ObjectId } = require('@datastax/astra-db-ts');

class Announcement {
  constructor() {
    this.client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    this.db = this.client.db(process.env.ASTRA_DB_API_ENDPOINT);
    this.collection = this.db.collection('announcements');
  }

  async create(announcementData) {
    try {
      const announcement = {
        id: this.generateId(),
        title: announcementData.title,
        content: announcementData.content,
        type: announcementData.type || 'info',
        priority: announcementData.priority || 'medium',
        isActive: announcementData.isActive !== false,
        readBy: [],
        author: announcementData.author || 'Admin',
        links: announcementData.links || [],
        readTime: announcementData.readTime || '2 min read',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: announcementData.createdBy
      };

      const result = await this.collection.insertOne(announcement);
      return { success: true, announcement: { ...announcement, _id: result.insertedId } };
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw new Error('Failed to create announcement');
    }
  }

  async getAll() {
    try {
      const cursor = this.collection.find({ isActive: true });
      const announcements = await cursor.toArray();
      return announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw new Error('Failed to fetch announcements');
    }
  }

  async getAllWithReadStatus(userId) {
    try {
      const announcements = await this.getAll();
      
      return announcements.map(announcement => ({
        ...announcement,
        isRead: announcement.readBy?.includes(userId) || false
      }));
    } catch (error) {
      console.error('Error fetching announcements with read status:', error);
      throw new Error('Failed to fetch announcements');
    }
  }

  // FIXED: Updates the User's timestamp instead of the Announcement document
  async markAsRead(announcementId, userId) {
    try {
      // We import User here to avoid circular dependency issues at the top
      const User = require('./User');
      const userModel = new User();
      
      // Update the user's "last checked" time to NOW
      await userModel.updateLastAnnouncementCheck(userId);

      return { success: true, message: 'Announcements marked as read' };
    } catch (error) {
      console.error('Error marking as read:', error);
      throw new Error('Failed to mark as read');
    }
  }

  async isRead(announcementId, userId) {
    try {
      // Try both search methods
      let announcement = await this.collection.findOne({ 
        id: announcementId,
        readBy: userId 
      });
      
      if (!announcement && this.isValidObjectId(announcementId)) {
        announcement = await this.collection.findOne({ 
          _id: new ObjectId(announcementId),
          readBy: userId 
        });
      }
      
      if (!announcement) {
        announcement = await this.collection.findOne({ 
          _id: announcementId,
          readBy: userId 
        });
      }
      
      return !!announcement;
    } catch (error) {
      console.error('Error checking read status:', error);
      return false;
    }
  }

  // FIXED: Counts announcements created AFTER the user last checked
  async getUnreadCount(userId) {
    try {
      const User = require('./User');
      const userModel = new User();
      const user = await userModel.findById(userId);

      // If user has never checked, everything active is unread
      const lastCheck = user?.lastAnnouncementCheck ? new Date(user.lastAnnouncementCheck) : new Date(0);

      const unreadCount = await this.collection.countDocuments({
        isActive: true,
        createdAt: { $gt: lastCheck.toISOString() } // $gt means "Greater Than"
      });
      
      return unreadCount;
    } catch (error) {
      return 0;
    }
  }

  async getById(announcementId) {
    try {
      // Try both id fields for compatibility
      let announcement = await this.collection.findOne({ id: announcementId });
      
      if (!announcement && this.isValidObjectId(announcementId)) {
        announcement = await this.collection.findOne({ _id: new ObjectId(announcementId) });
      }
      
      if (!announcement) {
        announcement = await this.collection.findOne({ _id: announcementId });
      }
      
      return announcement;
    } catch (error) {
      console.error('Error fetching announcement:', error);
      throw new Error('Failed to fetch announcement');
    }
  }

  async update(announcementId, updateData) {
    try {
      // //console.log('🔄 Updating announcement in database:', announcementId, updateData);
      
      const updateFields = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      Object.keys(updateFields).forEach(key => {
        if (updateFields[key] === undefined) {
          delete updateFields[key];
        }
      });

      // Try updating by custom id field first
      let result = await this.collection.updateOne(
        { id: announcementId },
        { $set: updateFields }
      );

      // If not found, try by _id field (for ObjectId)
      if (result.matchedCount === 0 && this.isValidObjectId(announcementId)) {
        result = await this.collection.updateOne(
          { _id: new ObjectId(announcementId) },
          { $set: updateFields }
        );
      }

      // If still not found, try _id as string
      if (result.matchedCount === 0) {
        result = await this.collection.updateOne(
          { _id: announcementId },
          { $set: updateFields }
        );
      }

      if (result.matchedCount === 0) {
        throw new Error('Announcement not found');
      }

      // //console.log('✅ Update result:', result);
      
      // Return the updated announcement
      const updatedAnnouncement = await this.getById(announcementId);
      
      return { 
        success: true, 
        result: updatedAnnouncement,
        message: 'Announcement updated successfully'
      };
    } catch (error) {
      // console.error('Error updating announcement:', error);
      throw new Error('Failed to update announcement: ' + error.message);
    }
  }

  // FIXED delete method (keeping your existing implementation)
  async delete(announcementId) {
    try {
      // //console.log('🗑️ Model: Deleting announcement from database:', announcementId);
      
      if (!announcementId) {
        throw new Error('No announcement ID provided');
      }

      // First verify the announcement exists
      let existingAnnouncement = null;
      
      // Try finding by custom 'id' field first
      try {
        existingAnnouncement = await this.collection.findOne({ id: announcementId });
        // //console.log('🔍 Model: Found by custom id field:', !!existingAnnouncement);
      } catch (error) {
        // //console.log('⚠️ Model: Could not search by custom id:', error.message);
      }
      
      // If not found and looks like ObjectId, try by _id field
      if (!existingAnnouncement && this.isValidObjectId(announcementId)) {
        try {
          existingAnnouncement = await this.collection.findOne({ _id: announcementId });
          // //console.log('🔍 Model: Found by _id field:', !!existingAnnouncement);
        } catch (error) {
          // //console.log('⚠️ Model: Could not search by _id:', error.message);
        }
      }

      if (!existingAnnouncement) {
        // //console.log('❌ Model: Announcement not found');
        return { 
          success: false, 
          message: 'Announcement not found',
          deletedCount: 0
        };
      }

      // //console.log('📋 Model: Found announcement to delete:', existingAnnouncement.title);
      
      // Perform deletion using the same field we found it with
      let deleteResult;
      
      if (existingAnnouncement.id === announcementId) {
        deleteResult = await this.collection.deleteOne({ id: announcementId });
      } else {
        deleteResult = await this.collection.deleteOne({ _id: announcementId });
      }
      
      if (deleteResult.deletedCount === 0) {
        // console.error('❌ Model: Delete operation failed');
        return { 
          success: false, 
          message: 'Failed to delete announcement',
          deletedCount: 0
        };
      }
      
      // //console.log('✅ Model: Successfully deleted from database');
      
      return { 
        success: true, 
        message: 'Announcement deleted successfully',
        deletedCount: deleteResult.deletedCount,
        deletedTitle: existingAnnouncement.title,
        deletedId: announcementId
      };
      
    } catch (error) {
      // console.error('❌ Model: Error deleting announcement:', error);
      
      return { 
        success: false, 
        message: 'Database error during deletion: ' + error.message,
        deletedCount: 0
      };
    }
  }

  // Helper method to check if string looks like ObjectId
  isValidObjectId(id) {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

module.exports = Announcement;
