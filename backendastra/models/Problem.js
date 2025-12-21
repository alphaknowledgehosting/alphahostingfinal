const { DataAPIClient } = require('@datastax/astra-db-ts');

class Problem {
  constructor() {
    this.client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    this.db = this.client.db(process.env.ASTRA_DB_API_ENDPOINT);
    this.collection = this.db.collection('problems');
    
    // In-memory cache (no time-based expiry)
    this.cache = new Map();
    this.isCachePopulated = false;
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Get all problems and cache them (load once, keep forever until modified)
   */
  async getAllProblemsCache() {
    // Return cached data if already populated
    if (this.isCachePopulated) {
      console.log('✅ Returning cached problems (no expiry)');
      return Array.from(this.cache.values());
    }

    // Fetch from DB (first time only)
    console.log('🔄 Loading all problems into cache...');
    const problems = await this.collection.find({}).toArray();
    
    // Populate cache
    this.cache.clear();
    problems.forEach(p => this.cache.set(p.id, p));
    this.isCachePopulated = true;
    
    console.log(`✅ Cached ${problems.length} problems (will stay cached until modified)`);
    return problems;
  }

  /**
   * Create a new global problem
   */
  async createProblem(problemData) {
    try {
      const problem = {
        id: problemData.id || this.generateId(),
        title: problemData.title,
        practiceLink: problemData.practiceLink || '',
        platform: problemData.platform || '',
        youtubeLink: problemData.youtubeLink || '',
        editorialLink: problemData.editorialLink || '',
        notesLink: problemData.notesLink || '',
        difficulty: problemData.difficulty || 'Easy',
        tags: problemData.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: problemData.createdBy
      };

      const result = await this.collection.insertOne(problem);
      
      // ✅ Add to cache immediately (no full invalidation needed)
      if (this.isCachePopulated) {
        this.cache.set(problem.id, { ...problem, _id: result.insertedId });
        console.log(`✅ Problem created and added to cache: ${problem.id}`);
      }
      
      return { success: true, problem: { ...problem, _id: result.insertedId } };
    } catch (error) {
      console.error('Error creating problem:', error);
      throw new Error('Failed to create problem');
    }
  }

  /**
   * Get all problems (for search/selection) - uses cache
   */
  async getAllProblems(filters = {}) {
    try {
      // Get from cache
      let problems = await this.getAllProblemsCache();
      
      // Apply filters
      if (filters.difficulty) {
        problems = problems.filter(p => p.difficulty === filters.difficulty);
      }
      if (filters.platform) {
        problems = problems.filter(p => p.platform === filters.platform);
      }
      if (filters.tags && filters.tags.length > 0) {
        problems = problems.filter(p => 
          p.tags && p.tags.some(tag => filters.tags.includes(tag))
        );
      }
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        problems = problems.filter(p => 
          (p.title && p.title.toLowerCase().includes(searchLower)) ||
          (p.platform && p.platform.toLowerCase().includes(searchLower))
        );
      }

      return problems.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    } catch (error) {
      console.error('Error fetching problems:', error);
      throw new Error('Failed to fetch problems');
    }
  }

  /**
   * Get problem by ID - uses cache
   */
  async getProblemById(problemId) {
    try {
      // Ensure cache is populated
      await this.getAllProblemsCache();
      
      // Return from cache
      const problem = this.cache.get(problemId);
      
      if (!problem) {
        console.log(`⚠️ Problem not found in cache: ${problemId}`);
        return null;
      }
      
      return problem;
    } catch (error) {
      console.error('Error fetching problem:', error);
      throw new Error('Failed to fetch problem');
    }
  }

  /**
   * Get multiple problems by IDs (for sheet rendering) - uses cache (zero DB calls!)
   */
  async getProblemsByIds(ids) {
    try {
      if (!ids || ids.length === 0) {
        return [];
      }

      // Ensure cache is populated
      await this.getAllProblemsCache();
      
      // Find missing IDs for debugging
      const foundProblems = [];
      const missingIds = [];
      
      ids.forEach(id => {
        const problem = this.cache.get(id);
        if (problem) {
          foundProblems.push(problem);
        } else {
          missingIds.push(id);
        }
      });
      
      if (missingIds.length > 0) {
        console.log(`⚠️ Missing ${missingIds.length} problem(s) from cache:`, missingIds);
      }
      
      console.log(`✅ Retrieved ${foundProblems.length}/${ids.length} problems from cache`);
      return foundProblems;
      
    } catch (error) {
      console.error('Error fetching problems by IDs:', error);
      throw new Error('Failed to fetch problems');
    }
  }

  /**
   * Get batch of problems by IDs (for optimized sheet loading) - uses cache
   */
  async getBatch(problemIds) {
    try {
      if (!problemIds || problemIds.length === 0) {
        return [];
      }

      console.log(`🔍 Batch fetching ${problemIds.length} problems from cache`);
      
      // Use the cached version
      const problems = await this.getProblemsByIds(problemIds);
      
      console.log(`✅ Batch found ${problems.length} problems`);
      return problems;
      
    } catch (error) {
      console.error('Error batch fetching problems:', error);
      throw new Error('Failed to batch fetch problems');
    }
  }

  /**
   * Update problem - updates cache immediately
   */
  async updateProblem(problemId, updateData) {
    try {
      // Remove _id from update data if present
      const { _id, ...cleanData } = updateData;
      
      const result = await this.collection.updateOne(
        { id: problemId },
        {
          $set: {
            ...cleanData,
            updatedAt: new Date().toISOString()
          }
        }
      );
      
      // ✅ Update cache immediately
      if (this.isCachePopulated && this.cache.has(problemId)) {
        const cached = this.cache.get(problemId);
        this.cache.set(problemId, { 
          ...cached, 
          ...cleanData,
          updatedAt: new Date().toISOString()
        });
        console.log(`✅ Problem updated in DB and cache: ${problemId}`);
      }
      
      return { success: true, result };
    } catch (error) {
      console.error('Error updating problem:', error);
      throw new Error('Failed to update problem');
    }
  }

 /**
 * Delete problem with cascade to sheets - handles orphaned problems gracefully
 */
async deleteProblem(problemId) {
  try {
    console.log(`🗑️ Deleting problem: ${problemId}`);
    
    // 1. Try to delete from database
    const result = await this.collection.deleteOne({ id: problemId });
    
    if (result.deletedCount === 0) {
      console.log(`⚠️ Problem ${problemId} not in database (cleaning orphaned references)`);
    } else {
      console.log(`✅ Deleted from database`);
    }
    
    // 2. Remove from cache
    if (this.isCachePopulated && this.cache.has(problemId)) {
      this.cache.delete(problemId);
      console.log(`✅ Removed from cache`);
    }
    
    // 3. ALWAYS remove from sheets
    await this.removeFromAllSheets(problemId);
    
    console.log(`✅ Cleanup complete for ${problemId}`);
    
    return { 
      success: true, 
      deletedCount: result.deletedCount,
      message: result.deletedCount > 0
        ? 'Problem deleted successfully' 
        : 'Orphaned problem references removed from sheets'
    };
    
  } catch (error) {
    console.error('Error deleting problem:', error);
    throw new Error('Failed to delete problem');
  }
}


 /**
 * Remove problem from all sheets (cascade delete helper)
 */
async removeFromAllSheets(problemId) {
  try {
    const sheetsCollection = this.db.collection('sheets');
    
    // Find all sheets containing this problem in either array
    const sheetsWithProblem = await sheetsCollection.find({
      $or: [
        { 'sections.subsections.problems': problemId },
        { 'sections.subsections.problemIds': problemId }
      ]
    }).toArray();
    
    if (sheetsWithProblem.length === 0) {
      console.log('ℹ️ No sheets contain this problem');
      return;
    }
    
    console.log(`📊 Cleaning ${sheetsWithProblem.length} sheets...`);
    
    // Update each sheet
    let cleanedCount = 0;
    for (const sheet of sheetsWithProblem) {
      // Remove problem from nested structure (both arrays)
      sheet.sections = sheet.sections.map(section => ({
        ...section,
        subsections: section.subsections.map(subsection => ({
          ...subsection,
          // Filter both 'problems' and 'problemIds' arrays
          problems: subsection.problems?.filter(pId => pId !== problemId) || [],
          problemIds: subsection.problemIds?.filter(pId => pId !== problemId) || []
        }))
      }));
      
      // Update in database
      await sheetsCollection.updateOne(
        { _id: sheet._id },
        { 
          $set: { 
            sections: sheet.sections,
            updatedAt: new Date().toISOString()
          } 
        }
      );
      
      cleanedCount++;
      console.log(`  ✓ Cleaned sheet: ${sheet.title}`);
    }
    
    console.log(`✅ Removed problem from ${cleanedCount} sheets`);
    
  } catch (error) {
    console.error('Error removing problem from sheets:', error);
    console.warn('⚠️ Problem deleted but sheet cleanup may be incomplete');
    // Don't throw - we still want the problem deletion to succeed
  }
}
/**
 * Remove problem from all sheets (cascade delete helper)
 */
async removeFromAllSheets(problemId) {
  try {
    const sheetsCollection = this.db.collection('sheets');
    
    // Find all sheets containing this problem in either array
    const sheetsWithProblem = await sheetsCollection.find({
      $or: [
        { 'sections.subsections.problems': problemId },
        { 'sections.subsections.problemIds': problemId }
      ]
    }).toArray();
    
    if (sheetsWithProblem.length === 0) {
      console.log('ℹ️ No sheets contain this problem');
      return;
    }
    
    console.log(`📊 Cleaning ${sheetsWithProblem.length} sheets...`);
    
    // Update each sheet
    let cleanedCount = 0;
    for (const sheet of sheetsWithProblem) {
      // Remove problem from nested structure (both arrays)
      sheet.sections = sheet.sections.map(section => ({
        ...section,
        subsections: section.subsections.map(subsection => ({
          ...subsection,
          // Filter both 'problems' and 'problemIds' arrays
          problems: subsection.problems?.filter(pId => pId !== problemId) || [],
          problemIds: subsection.problemIds?.filter(pId => pId !== problemId) || []
        }))
      }));
      
      // Update in database
      await sheetsCollection.updateOne(
        { _id: sheet._id },
        { 
          $set: { 
            sections: sheet.sections,
            updatedAt: new Date().toISOString()
          } 
        }
      );
      
      cleanedCount++;
      console.log(`  ✓ Cleaned sheet: ${sheet.title}`);
    }
    
    console.log(`✅ Removed problem from ${cleanedCount} sheets`);
    
  } catch (error) {
    console.error('Error removing problem from sheets:', error);
    console.warn('⚠️ Problem deleted but sheet cleanup may be incomplete');
    // Don't throw - we still want the problem deletion to succeed
  }
}


  /**
   * Search problems (for autocomplete/selection UI) - uses cache
   */
  async searchProblems(searchTerm, limit = 20) {
    try {
      console.log(`🔍 Searching problems with term: "${searchTerm}"`);
      
      // Get all problems from cache
      let problems = await this.getAllProblemsCache();
      
      console.log(`📊 Total problems in cache: ${problems.length}`);
      
      // Client-side filtering
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        problems = problems.filter(p => 
          (p.title && p.title.toLowerCase().includes(searchLower)) ||
          (p.platform && p.platform.toLowerCase().includes(searchLower)) ||
          (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      }
      
      console.log(`✅ Found ${problems.length} matching problems`);
      
      // Sort by most recent and limit
      return problems
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error searching problems:', error);
      throw new Error('Failed to search problems');
    }
  }

  /**
   * Manual cache refresh (optional, for admin panel or debugging)
   */
  async refreshCache() {
    console.log('🔄 Manually refreshing cache...');
    this.isCachePopulated = false;
    this.cache.clear();
    return await this.getAllProblemsCache();
  }

  /**
   * Get cache statistics (for monitoring/debugging)
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      isPopulated: this.isCachePopulated,
      problems: Array.from(this.cache.keys())
    };
  }
}

module.exports = Problem;
