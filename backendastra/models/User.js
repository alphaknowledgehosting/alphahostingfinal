const { DataAPIClient } = require('@datastax/astra-db-ts');

class User {
  constructor() {
    this.client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    this.db = this.client.db(process.env.ASTRA_DB_API_ENDPOINT);
    this.collection = this.db.collection('users');
  }

  async createUser(userData) {
    try {
      const user = {
        _id: this.generateId(),
        googleId: userData.googleId,
        name: userData.name,
        email: userData.email,
        profilePicture: userData.profilePicture,
        role: userData.role || 'student',
        isActive: true, // ADD THIS FIELD
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await this.collection.insertOne(user);
      return user; // Return the user with our custom _id
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async findByGoogleId(googleId) {
    try {
      return await this.collection.findOne({ googleId });
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      return await this.collection.findOne({ email });
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  async findById(userId) {
    try {
      return await this.collection.findOne({ _id: userId });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const result = await this.collection.updateOne(
        { _id: userId },
        { 
          $set: { 
            ...updateData, 
            updatedAt: new Date().toISOString() 
          }
        }
      );
      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserRole(userId, newRole) {
    try {
      const result = await this.collection.updateOne(
        { _id: userId },
        { 
          $set: { 
            role: newRole,
            updatedAt: new Date().toISOString() 
          }
        }
      );
      return result;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // ADD: Method for getting users with emails for announcements
  async getUsersWithEmails() {
    try {
      // Get all users first, then filter in JavaScript since Astra DB syntax differs
      const allUsers = await this.collection.find({}).toArray();
      
      const usersWithEmails = allUsers.filter(user => 
        user.email && 
        user.email.includes('@') && 
        user.isActive !== false
      );

      // console.log(`📧 Found ${usersWithEmails.length} users with valid emails out of ${allUsers.length} total users`);
      return usersWithEmails;
    } catch (error) {
      console.error('❌ Error fetching users with emails:', error);
      return [];
    }
  }

  async getAllUsers() {
    try {
      const cursor = this.collection.find({});
      return await cursor.toArray();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const result = await this.collection.deleteOne({ _id: userId });
      return result;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Generate a custom ID for Astra DB
  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

module.exports = User;
