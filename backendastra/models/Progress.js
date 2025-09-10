const { DataAPIClient } = require('@datastax/astra-db-ts');

class Progress {
  constructor() {
    this.client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    this.db = this.client.db(process.env.ASTRA_DB_API_ENDPOINT);
    this.collection = this.db.collection('progress');
  }

  async getUserProgress(userId) {
    try {
      const cursor = this.collection.find({ userId });
      const progress = await cursor.toArray();
      return progress;
    } catch (error) {
      // console.error('Error fetching user progress:', error);
      throw new Error('Failed to fetch progress');
    }
  }

  async toggleProblem(userId, problemId, sheetId, sectionId, subsectionId, completed) {
    try {
      const progressId = `${userId}_${problemId}`;
      
      // First check if progress entry exists
      const existingProgress = await this.collection.findOne({ _id: progressId });
      
      if (completed) {
        // Mark as completed
        const progressEntry = {
          _id: progressId,
          userId,
          problemId,
          sheetId,
          sectionId,
          subsectionId,
          completed: true,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Preserve existing revision status
          markedForRevision: existingProgress?.markedForRevision || false,
          revisionMarkedAt: existingProgress?.revisionMarkedAt || null
        };

        const result = await this.collection.replaceOne(
          { _id: progressId },
          progressEntry,
          { upsert: true }
        );

        return { success: true, progress: progressEntry };
      } else {
        // Mark as incomplete but preserve revision status if exists
        if (existingProgress && existingProgress.markedForRevision) {
          const progressEntry = {
            _id: progressId,
            userId,
            problemId,
            sheetId,
            sectionId,
            subsectionId,
            completed: false,
            completedAt: null,
            updatedAt: new Date().toISOString(),
            markedForRevision: true,
            revisionMarkedAt: existingProgress.revisionMarkedAt
          };
          
          await this.collection.replaceOne(
            { _id: progressId },
            progressEntry
          );
          
          return { success: true, progress: progressEntry };
        } else {
          // Remove entry completely if not marked for revision
          await this.collection.deleteOne({ _id: progressId });
          return { success: true, progress: null };
        }
      }
    } catch (error) {
      // console.error('Error toggling problem:', error);
      throw new Error('Failed to update progress');
    }
  }

  async toggleRevision(userId, problemId, sheetId, sectionId, subsectionId, markedForRevision) {
    try {
      const progressId = `${userId}_${problemId}`;
      
      // Check if progress entry exists
      const existingProgress = await this.collection.findOne({ _id: progressId });
      
      if (markedForRevision) {
        // Mark for revision
        const progressEntry = {
          _id: progressId,
          userId,
          problemId,
          sheetId,
          sectionId,
          subsectionId,
          completed: existingProgress?.completed || false,
          completedAt: existingProgress?.completedAt || null,
          updatedAt: new Date().toISOString(),
          markedForRevision: true,
          revisionMarkedAt: new Date().toISOString()
        };

        const result = await this.collection.replaceOne(
          { _id: progressId },
          progressEntry,
          { upsert: true }
        );

        return { success: true, progress: progressEntry };
      } else {
        // Unmark for revision
        if (existingProgress) {
          if (existingProgress.completed) {
            // Keep the entry but remove revision marking
            const progressEntry = {
              ...existingProgress,
              markedForRevision: false,
              revisionMarkedAt: null,
              updatedAt: new Date().toISOString()
            };
            
            await this.collection.replaceOne(
              { _id: progressId },
              progressEntry
            );
            
            return { success: true, progress: progressEntry };
          } else {
            // Remove entry completely if not completed and not marked for revision
            await this.collection.deleteOne({ _id: progressId });
            return { success: true, progress: null };
          }
        }
        
        return { success: true, progress: null };
      }
    } catch (error) {
      // console.error('Error toggling revision:', error);
      throw new Error('Failed to update revision status');
    }
  }

  async getUserStats(userId) {
    try {
      const cursor = this.collection.find({ userId });
      const allProgress = await cursor.toArray();
      
      const completedProblems = allProgress.filter(p => p.completed);
      const revisionProblems = allProgress.filter(p => p.markedForRevision);
      
      const stats = {
        totalCompleted: completedProblems.length,
        totalMarkedForRevision: revisionProblems.length,
        bySheet: {},
        bySection: {},
        revisionBySheet: {},
        recentActivity: completedProblems
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
          .slice(0, 10),
        recentRevisions: revisionProblems
          .sort((a, b) => new Date(b.revisionMarkedAt) - new Date(a.revisionMarkedAt))
          .slice(0, 10)
      };

      // Group completed problems by sheet
      completedProblems.forEach(problem => {
        if (!stats.bySheet[problem.sheetId]) {
          stats.bySheet[problem.sheetId] = 0;
        }
        stats.bySheet[problem.sheetId]++;
      });

      // Group revision problems by sheet
      revisionProblems.forEach(problem => {
        if (!stats.revisionBySheet[problem.sheetId]) {
          stats.revisionBySheet[problem.sheetId] = 0;
        }
        stats.revisionBySheet[problem.sheetId]++;
      });

      return stats;
    } catch (error) {
      // console.error('Error fetching user stats:', error);
      throw new Error('Failed to fetch stats');
    }
  }

  async getRevisionProblems(userId) {
    try {
      const cursor = this.collection.find({ 
        userId, 
        markedForRevision: true 
      });
      const revisionProblems = await cursor.toArray();
      return revisionProblems.sort((a, b) => 
        new Date(b.revisionMarkedAt) - new Date(a.revisionMarkedAt)
      );
    } catch (error) {
      // console.error('Error fetching revision problems:', error);
      throw new Error('Failed to fetch revision problems');
    }
  }

  async getAllProgress() {
    try {
      const cursor = this.collection.find({});
      const allProgress = await cursor.toArray();
      return allProgress;
    } catch (error) {
      // console.error('Error fetching all progress:', error);
      throw new Error('Failed to fetch all progress');
    }
  }

  async deleteUserProgress(userId) {
    try {
      const result = await this.collection.deleteMany({ userId });
      return result;
    } catch (error) {
      // console.error('Error deleting user progress:', error);
      throw new Error('Failed to delete progress');
    }
  }

  async deleteByProblemId(problemId) {
    try {
      const result = await this.collection.deleteMany({ problemId: problemId });
      return result;
    } catch (error) {
      // console.error('Error deleting progress by problemId:', error);
      throw new Error('Failed to delete progress records');
    }
  }

  async deleteBySheetId(sheetId) {
    try {
      const result = await this.collection.deleteMany({ sheetId: sheetId });
      return result;
    } catch (error) {
      // console.error('Error deleting progress by sheetId:', error);
      throw new Error('Failed to delete progress records');
    }
  }

  async deleteBySectionId(sectionId) {
    try {
      const result = await this.collection.deleteMany({ sectionId: sectionId });
      return result;
    } catch (error) {
      // console.error('Error deleting progress by sectionId:', error);
      throw new Error('Failed to delete progress records');
    }
  }

  async deleteBySubsectionId(subsectionId) {
    try {
      const result = await this.collection.deleteMany({ subsectionId: subsectionId });
      return result;
    } catch (error) {
      // console.error('Error deleting progress by subsectionId:', error);
      throw new Error('Failed to delete progress records');
    }
  }
}

module.exports = Progress;
