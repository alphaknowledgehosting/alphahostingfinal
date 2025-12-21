const { DataAPIClient } = require('@datastax/astra-db-ts');

class Progress {
  constructor() {
    this.client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    this.db = this.client.db(process.env.ASTRA_DB_API_ENDPOINT);
    this.collection = this.db.collection('progress');
    this.sheetCollection = this.db.collection('sheets');
    this.locationCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }
  // ✅ NEW: Clean up progress contexts when a problem is unlinked from a location
async cleanupProgressForUnlinkedProblem(problemId, unlinkedLocation) {
  try {
    console.log(`🧹 Cleaning up progress for problem ${problemId} from location:`, unlinkedLocation);
    
    // Find all users who have progress for this problem
    const cursor = this.collection.find({ problemId });
    const affectedEntries = await cursor.toArray();
    
    if (affectedEntries.length === 0) {
      console.log(`✅ No existing progress found for problem ${problemId}`);
      return { success: true, cleanedUsers: 0 };
    }
    
    let cleanedCount = 0;
    
    for (const entry of affectedEntries) {
      let needsUpdate = false;
      const updates = {};
      
      // Remove from completion contexts
      if (entry.contexts && entry.contexts.length > 0) {
        const filteredContexts = entry.contexts.filter(ctx => 
          !(ctx.sheetId === unlinkedLocation.sheetId &&
            ctx.sectionId === unlinkedLocation.sectionId &&
            ctx.subsectionId === unlinkedLocation.subsectionId)
        );
        
        if (filteredContexts.length !== entry.contexts.length) {
          updates.contexts = filteredContexts;
          needsUpdate = true;
        }
      }
      
      // Remove from revision contexts
      if (entry.revisionContexts && entry.revisionContexts.length > 0) {
        const filteredRevisionContexts = entry.revisionContexts.filter(ctx => 
          !(ctx.sheetId === unlinkedLocation.sheetId &&
            ctx.sectionId === unlinkedLocation.sectionId &&
            ctx.subsectionId === unlinkedLocation.subsectionId)
        );
        
        if (filteredRevisionContexts.length !== entry.revisionContexts.length) {
          updates.revisionContexts = filteredRevisionContexts;
          needsUpdate = true;
        }
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        // Check if both contexts are empty after removal
        const finalContexts = updates.contexts !== undefined ? updates.contexts : entry.contexts || [];
        const finalRevisionContexts = updates.revisionContexts !== undefined ? updates.revisionContexts : entry.revisionContexts || [];
        
        if (finalContexts.length === 0 && finalRevisionContexts.length === 0) {
          // Delete the entire progress entry if no contexts remain
          await this.collection.deleteOne({ userId: entry.userId, problemId });
          console.log(`🗑️ Deleted entire progress entry for user ${entry.userId} (no contexts remain)`);
        } else {
          // Update with filtered contexts
          await this.collection.updateOne(
            { userId: entry.userId, problemId },
            { $set: updates }
          );
          console.log(`✅ Cleaned up progress for user ${entry.userId}`);
        }
        cleanedCount++;
      }
    }
    
    console.log(`✅ Cleaned up progress for ${cleanedCount} users`);
    return { success: true, cleanedUsers: cleanedCount };
    
  } catch (error) {
    console.error('Error cleaning up progress for unlinked problem:', error);
    return { success: false, error: error.message };
  }
}

  async findProblemLocations(problemId, useCache = true) {
    try {
      // Check cache first
      if (useCache && this.locationCache.has(problemId)) {
        const cached = this.locationCache.get(problemId);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.locations;
        }
      }

      const cursor = this.sheetCollection.find({});
      const sheets = await cursor.toArray();
      const locations = [];
      
      sheets.forEach(sheet => {
        if (!sheet.sections) return;
        sheet.sections.forEach(section => {
          if (!section.subsections) return;
          section.subsections.forEach(subsection => {
            if (subsection.problemIds?.includes(problemId)) {
              locations.push({
                sheetId: sheet.id,
                sectionId: section.id,
                subsectionId: subsection.id
              });
            }
          });
        });
      });
      
      // Cache the result
      this.locationCache.set(problemId, {
        locations,
        timestamp: Date.now()
      });
      
      return locations;
    } catch (error) {
      console.error('Error finding problem locations:', error);
      return [];
    }
  }

  async getProgressEntry(userId, problemId) {
    try {
      return await this.collection.findOne({ userId, problemId });
    } catch (error) {
      return null;
    }
  }

  // ✅ FIXED: Toggle problem - Updates contexts for ALL locations
  async toggleProblem(userId, problemId, sheetId, sectionId, subsectionId, difficulty, completed) {
    try {
      // ✅ Find ALL locations where this problem exists
      const allLocations = await this.findProblemLocations(problemId, false); // Don't use cache
      
      // ✅ Get existing progress entry
      let progressEntry = await this.getProgressEntry(userId, problemId);
      
      if (!progressEntry) {
        // Create new entry if marking as completed
        if (completed) {
          progressEntry = {
            userId,
            problemId,
            completed: true,
            completedAt: new Date().toISOString(),
            difficulty,
            markedForRevision: false,
            // ✅ Create contexts for ALL locations
            contexts: allLocations.map(loc => ({
              ...loc,
              completed: true,
              markedAt: new Date().toISOString()
            })),
            revisionContexts: []
          };
          await this.collection.insertOne(progressEntry);
          console.log(`✅ Created progress for problem ${problemId} across ${allLocations.length} locations`);
        }
      } else {
        // Update existing entry
        if (completed) {
          // ✅ Update contexts for ALL locations
          const contexts = allLocations.map(loc => ({
            ...loc,
            completed: true,
            markedAt: new Date().toISOString()
          }));
          
          await this.collection.updateOne(
            { userId, problemId },
            {
              $set: {
                completed: true,
                completedAt: new Date().toISOString(),
                difficulty: difficulty || progressEntry.difficulty,
                contexts
              }
            }
          );
          console.log(`✅ Updated progress for problem ${problemId} across ${allLocations.length} locations`);
        } else {
          // Mark as incomplete
          const updates = {
            completed: false,
            completedAt: null,
            contexts: [],
            difficulty: difficulty || progressEntry.difficulty
          };
          
          // Delete entry if not marked for revision
          if (!progressEntry.markedForRevision) {
            await this.collection.deleteOne({ userId, problemId });
            console.log(`✅ Deleted progress for problem ${problemId}`);
          } else {
            await this.collection.updateOne({ userId, problemId }, { $set: updates });
            console.log(`✅ Marked problem ${problemId} as incomplete but kept revision status`);
          }
        }
      }
      
      return { success: true, locationsUpdated: allLocations.length };
    } catch (error) {
      console.error('Error toggling problem:', error);
      throw new Error('Failed to toggle problem completion');
    }
  }

  // ✅ FIXED: Toggle revision - Updates contexts for ALL locations
  async toggleRevision(userId, problemId, sheetId, sectionId, subsectionId, difficulty, markedForRevision) {
    try {
      // ✅ Find ALL locations where this problem exists
      const allLocations = await this.findProblemLocations(problemId, false); // Don't use cache
      
      let progressEntry = await this.getProgressEntry(userId, problemId);
      
      if (!progressEntry) {
        // Create new entry if marking for revision
        if (markedForRevision) {
          progressEntry = {
            userId,
            problemId,
            completed: false,
            markedForRevision: true,
            revisionMarkedAt: new Date().toISOString(),
            difficulty,
            contexts: [],
            // ✅ Create revision contexts for ALL locations
            revisionContexts: allLocations.map(loc => ({
              ...loc,
              markedAt: new Date().toISOString()
            }))
          };
          await this.collection.insertOne(progressEntry);
          console.log(`✅ Marked problem ${problemId} for revision across ${allLocations.length} locations`);
        }
      } else {
        if (markedForRevision) {
          // ✅ Update revision contexts for ALL locations
          const revisionContexts = allLocations.map(loc => ({
            ...loc,
            markedAt: new Date().toISOString()
          }));
          
          await this.collection.updateOne(
            { userId, problemId },
            {
              $set: {
                markedForRevision: true,
                revisionMarkedAt: new Date().toISOString(),
                difficulty: difficulty || progressEntry.difficulty,
                revisionContexts
              }
            }
          );
          console.log(`✅ Updated revision for problem ${problemId} across ${allLocations.length} locations`);
        } else {
          // Unmark from revision
          const updates = {
            markedForRevision: false,
            revisionMarkedAt: null,
            revisionContexts: [],
            difficulty: difficulty || progressEntry.difficulty
          };
          
          const contexts = progressEntry.contexts || [];
          if (contexts.length === 0 && !progressEntry.completed) {
            await this.collection.deleteOne({ userId, problemId });
            console.log(`✅ Deleted revision for problem ${problemId}`);
          } else {
            await this.collection.updateOne({ userId, problemId }, { $set: updates });
            console.log(`✅ Unmarked problem ${problemId} from revision but kept completion status`);
          }
        }
      }
      
      return { success: true, locationsUpdated: allLocations.length };
    } catch (error) {
      console.error('Error toggling revision:', error);
      throw new Error('Failed to toggle revision status');
    }
  }

  async getUserProgress(userId, autoSync = true) {
   try {
    const cursor = this.collection.find({ userId });
    const progressData = await cursor.toArray();
    const expandedProgress = [];
    progressData.forEach(entry => {
      // Expand completed contexts
      if (entry.contexts?.length > 0) {
        entry.contexts.forEach(ctx => {
          expandedProgress.push({
            userId: entry.userId,
            problemId: entry.problemId,
            completed: ctx.completed || entry.completed,
            completedAt: entry.completedAt,
            difficulty: entry.difficulty,
            sheetId: ctx.sheetId,
            sectionId: ctx.sectionId,
            subsectionId: ctx.subsectionId,
            markedForRevision: entry.markedForRevision || false,
            revisionMarkedAt: entry.revisionMarkedAt
          });
        });
      }
      
      // Expand revision contexts
      if (entry.revisionContexts?.length > 0) {
        entry.revisionContexts.forEach(ctx => {
          const existing = expandedProgress.find(e => 
            e.problemId === entry.problemId &&
            e.sheetId === ctx.sheetId &&
            e.sectionId === ctx.sectionId &&
            e.subsectionId === ctx.subsectionId
          );
          
          if (existing) {
            existing.markedForRevision = true;
            existing.revisionMarkedAt = entry.revisionMarkedAt;
          } else {
            expandedProgress.push({
              userId: entry.userId,
              problemId: entry.problemId,
              completed: entry.completed || false,
              completedAt: entry.completedAt,
              difficulty: entry.difficulty,
              sheetId: ctx.sheetId,
              sectionId: ctx.sectionId,
              subsectionId: ctx.subsectionId,
              markedForRevision: true,
              revisionMarkedAt: entry.revisionMarkedAt
            });
          }
        });
      }
      
      // Handle entries with no contexts (legacy data)
      if ((!entry.contexts || entry.contexts.length === 0) && 
          (!entry.revisionContexts || entry.revisionContexts.length === 0)) {
        expandedProgress.push({
          userId: entry.userId,
          problemId: entry.problemId,
          completed: entry.completed || false,
          completedAt: entry.completedAt,
          difficulty: entry.difficulty,
          sheetId: entry.sheetId,
          sectionId: entry.sectionId,
          subsectionId: entry.subsectionId,
          markedForRevision: entry.markedForRevision || false,
          revisionMarkedAt: entry.revisionMarkedAt
        });
      }
    });
    
    return expandedProgress;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw new Error('Failed to fetch progress');
  }
}


  async getUserStats(userId) {
    try {
      const expandedProgress = await this.getUserProgress(userId);
      const completedProblems = expandedProgress.filter(p => p.completed);
      const revisionProblems = expandedProgress.filter(p => p.markedForRevision);
      
      const stats = {
        totalCompleted: new Set(completedProblems.map(p => p.problemId)).size,
        totalMarkedForRevision: new Set(revisionProblems.map(p => p.problemId)).size,
        bySheet: {},
        bySection: {},
        bySubsection: {},
        revisionBySheet: {},
        recentActivity: completedProblems.slice(0, 10).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
        recentRevisions: revisionProblems.slice(0, 10).sort((a, b) => new Date(b.revisionMarkedAt) - new Date(a.revisionMarkedAt))
      };

      completedProblems.forEach(problem => {
        stats.bySheet[problem.sheetId] = (stats.bySheet[problem.sheetId] || 0) + 1;
        stats.bySection[problem.sectionId] = (stats.bySection[problem.sectionId] || 0) + 1;
        stats.bySubsection[problem.subsectionId] = (stats.bySubsection[problem.subsectionId] || 0) + 1;
      });

      revisionProblems.forEach(problem => {
        stats.revisionBySheet[problem.sheetId] = (stats.revisionBySheet[problem.sheetId] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error('Failed to fetch stats');
    }
  }
  // ✅ Sync progress for a specific problem when it's linked to a new location
async syncProblemProgress(problemId, newLocation) {
  try {
    console.log(`🔄 Syncing progress for problem ${problemId} to new location:`, newLocation);
    
    // Find all users who have completed or marked this problem
    const cursor = this.collection.find({ problemId });
    const affectedEntries = await cursor.toArray();
    
    if (affectedEntries.length === 0) {
      console.log(`✅ No existing progress found for problem ${problemId}`);
      return { success: true, syncedUsers: 0 };
    }
    
    let syncedCount = 0;
    
    for (const entry of affectedEntries) {
      const updates = {};
      let needsUpdate = false;
      
      // Update completion contexts
      if (entry.completed && entry.contexts) {
        const existingContexts = entry.contexts || [];
        const contextExists = existingContexts.some(c => 
          c.sheetId === newLocation.sheetId &&
          c.sectionId === newLocation.sectionId &&
          c.subsectionId === newLocation.subsectionId
        );
        
        if (!contextExists) {
          updates.contexts = [
            ...existingContexts,
            {
              ...newLocation,
              completed: true,
              markedAt: entry.completedAt || new Date().toISOString()
            }
          ];
          needsUpdate = true;
        }
      }
      
      // Update revision contexts
      if (entry.markedForRevision && entry.revisionContexts) {
        const existingRevisionContexts = entry.revisionContexts || [];
        const revisionContextExists = existingRevisionContexts.some(c => 
          c.sheetId === newLocation.sheetId &&
          c.sectionId === newLocation.sectionId &&
          c.subsectionId === newLocation.subsectionId
        );
        
        if (!revisionContextExists) {
          updates.revisionContexts = [
            ...existingRevisionContexts,
            {
              ...newLocation,
              markedAt: entry.revisionMarkedAt || new Date().toISOString()
            }
          ];
          needsUpdate = true;
        }
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        await this.collection.updateOne(
          { userId: entry.userId, problemId },
          { $set: updates }
        );
        syncedCount++;
        console.log(`✅ Synced progress for user ${entry.userId}`);
      }
    }
    
    console.log(`✅ Synced progress for ${syncedCount} users`);
    return { success: true, syncedUsers: syncedCount };
    
  } catch (error) {
    console.error('Error syncing problem progress:', error);
    return { success: false, error: error.message };
  }
}


  async getRevisionProblems(userId) {
    try {
      const cursor = this.collection.find({ userId, markedForRevision: true });
      const problems = await cursor.toArray();
      return problems.sort((a, b) => new Date(b.revisionMarkedAt) - new Date(a.revisionMarkedAt));
    } catch (error) {
      console.error('Error fetching revision problems:', error);
      throw new Error('Failed to fetch revision problems');
    }
  }

  async getAllProgress() {
    const cursor = this.collection.find({});
    return await cursor.toArray();
  }

  async deleteUserProgress(userId) {
    return await this.collection.deleteMany({ userId });
  }

  async deleteByProblemId(problemId) {
    this.locationCache.delete(problemId);
    return await this.collection.deleteMany({ problemId });
  }

  async deleteBySheetId(sheetId) {
    return await this.collection.deleteMany({ sheetId });
  }

  async deleteBySectionId(sectionId) {
    return await this.collection.deleteMany({ sectionId });
  }

  async deleteBySubsectionId(subsectionId) {
    return await this.collection.deleteMany({ subsectionId });
  }
}

module.exports = Progress;
