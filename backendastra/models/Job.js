// models/Job.js
const { DataAPIClient } = require('@datastax/astra-db-ts');

class Job {
  constructor() {
    this.client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    this.db = this.client.db(process.env.ASTRA_DB_API_ENDPOINT);
    this.collection = this.db.collection('jobs');
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // models/Job.js - Update storeJobs method to include salary
async storeJobs(jobsArray) {
  try {
    if (!Array.isArray(jobsArray)) {
      console.error('❌ Expected array of jobs, got:', typeof jobsArray);
      throw new Error('Jobs data must be an array');
    }

    if (jobsArray.length === 0) {
      //console.log('⚠️  No jobs to store');
      return { success: true, inserted: 0, updated: 0 };
    }

    //console.log(`📦 Processing ${jobsArray.length} jobs for storage...`);

    const jobsToInsert = jobsArray.map(job => ({
      id: job.id || this.generateId(),
      title: job.title || job.job_title || 'Untitled',
      company: job.company || 'Unknown Company',
      about_company: job.about_company || '',
      job_description: job.job_description || '',
      job_title: job.job_title || job.title || 'Untitled',
      job_type: job.job_type || 'Full Time',
      location: job.location || '',
      experience: job.experience || '',
      role_and_responsibility: job.role_and_responsibility || '',
      education_and_skills: job.education_and_skills || '',
      apply_link: job.apply_link || '',
      salary: job.salary || 'Not disclosed', // Add salary field
      posted_date: job.posted_date || new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
    }));

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const job of jobsToInsert) {
      try {
        const existing = await this.collection.findOne({
          company: job.company,
          title: job.title
        });

        if (existing) {
          await this.collection.updateOne(
            { _id: existing._id },
            {
              $set: {
                ...job,
                fetchedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          );
          updated++;
        } else {
          await this.collection.insertOne(job);
          inserted++;
        }
      } catch (error) {
        console.error(`❌ Error processing job ${job.title}:`, error.message);
        errors++;
      }
    }

    //console.log(`✅ Jobs stored: ${inserted} new, ${updated} updated, ${errors} errors`);
    return { success: true, inserted, updated, errors };
  } catch (error) {
    console.error('Error storing jobs:', error);
    throw new Error('Failed to store jobs');
  }
}

  /**
   * Get all active jobs (not expired)
   */
  async getAllJobs() {
    try {
      const now = new Date().toISOString();
      
      // Fetch all jobs and filter client-side (Astra Data API limitation)
      const cursor = this.collection.find({});
      let jobs = await cursor.toArray();
      
      // Filter expired jobs client-side
      jobs = jobs.filter(job => {
        const expiresAt = new Date(job.expiresAt).getTime();
        const nowTime = new Date(now).getTime();
        return expiresAt > nowTime;
      });

      //console.log(`📊 Retrieved ${jobs.length} active jobs`);
      return jobs.sort((a, b) => 
        new Date(b.fetchedAt) - new Date(a.fetchedAt)
      );
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw new Error('Failed to fetch jobs');
    }
  }

  /**
   * Get tech/DSA related jobs
   */
  async getTechJobs() {
    try {
      const allJobs = await this.getAllJobs();
      
      const techKeywords = [
        'software', 'developer', 'engineer', 'programmer', 'coding',
        'data structures', 'algorithms', 'backend', 'frontend', 
        'full stack', 'java', 'python', 'javascript', 'react', 'node',
        'dsa', 'software development', 'sde'
      ];
      
      const techJobs = allJobs.filter(job => {
        const searchText = `${job.title} ${job.job_description} ${job.education_and_skills} ${job.job_title}`.toLowerCase();
        return techKeywords.some(keyword => searchText.includes(keyword));
      });

      //console.log(`💻 Found ${techJobs.length} tech jobs`);
      return techJobs;
    } catch (error) {
      console.error('Error fetching tech jobs:', error);
      throw new Error('Failed to fetch tech jobs');
    }
  }

  /**
   * Search jobs by term
   */
  async searchJobs(searchTerm) {
    try {
      const allJobs = await this.getAllJobs();
      
      if (!searchTerm || !searchTerm.trim()) {
        return allJobs;
      }

      const searchLower = searchTerm.toLowerCase();
      const filtered = allJobs.filter(job => 
        (job.title && job.title.toLowerCase().includes(searchLower)) ||
        (job.company && job.company.toLowerCase().includes(searchLower)) ||
        (job.location && job.location.toLowerCase().includes(searchLower)) ||
        (job.job_description && job.job_description.toLowerCase().includes(searchLower)) ||
        (job.education_and_skills && job.education_and_skills.toLowerCase().includes(searchLower))
      );

      //console.log(`🔍 Search "${searchTerm}" found ${filtered.length} jobs`);
      return filtered;
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw new Error('Failed to search jobs');
    }
  }

  /**
   * Clean up expired jobs (called by cron job)
   */
  async cleanupExpiredJobs() {
    try {
      const now = new Date().toISOString();
      
      // Fetch all jobs
      const cursor = this.collection.find({});
      const allJobs = await cursor.toArray();
      
      // Find expired jobs
      const expiredJobs = allJobs.filter(job => {
        const expiresAt = new Date(job.expiresAt).getTime();
        const nowTime = new Date(now).getTime();
        return expiresAt <= nowTime;
      });

      // Delete expired jobs
      let deletedCount = 0;
      for (const job of expiredJobs) {
        await this.collection.deleteOne({ _id: job._id });
        deletedCount++;
      }

      //console.log(`🗑️ Cleaned up ${deletedCount} expired jobs`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error cleaning up jobs:', error);
      throw new Error('Failed to cleanup jobs');
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats() {
    try {
      const allJobs = await this.getAllJobs();
      
      const stats = {
        total: allJobs.length,
        byLocation: {},
        byExperience: {},
        byJobType: {},
        byCompany: {}
      };

      allJobs.forEach(job => {
        // Location stats
        const location = job.location || 'Unknown';
        stats.byLocation[location] = (stats.byLocation[location] || 0) + 1;

        // Experience stats
        const experience = job.experience || 'Not specified';
        stats.byExperience[experience] = (stats.byExperience[experience] || 0) + 1;

        // Job type stats
        const jobType = job.job_type || 'Not specified';
        stats.byJobType[jobType] = (stats.byJobType[jobType] || 0) + 1;

        // Company stats
        const company = job.company || 'Unknown';
        stats.byCompany[company] = (stats.byCompany[company] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting job stats:', error);
      throw new Error('Failed to get job stats');
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId) {
    try {
      const job = await this.collection.findOne({ id: jobId });
      
      // Check if expired
      if (job && new Date(job.expiresAt) < new Date()) {
        await this.collection.deleteOne({ id: jobId });
        return null;
      }

      return job;
    } catch (error) {
      console.error('Error fetching job:', error);
      throw new Error('Failed to fetch job');
    }
  }
}

module.exports = Job;
