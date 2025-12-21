// jobs/jobsFetchScheduler.js
const cron = require('node-cron');
const jobsService = require('../services/jobsService');
const Job = require('../models/Job');

class JobsFetchScheduler {
  constructor() {
    this.jobModel = new Job();
    this.lastFetchFile = './last-fetch.json';
    this.fs = require('fs').promises;
  }

  /**
   * Check if we should fetch today
   * Fetches every 3 days to stay within 10 requests/month limit
   */
  async shouldFetchToday() {
    try {
      const data = await this.fs.readFile(this.lastFetchFile, 'utf-8');
      const { lastFetch, requestCount, month } = JSON.parse(data);
      
      const currentMonth = new Date().getMonth();
      const lastFetchDate = new Date(lastFetch);
      const daysSinceLastFetch = (Date.now() - lastFetchDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Reset if new month
      if (month !== currentMonth) {
        await this.updateFetchRecord(true);
        return true;
      }
      
      // Check if 3 days have passed and we haven't exceeded limit
      if (daysSinceLastFetch >= 3 && requestCount < 10) {
        return true;
      }
      
      return false;
      
    } catch (error) {
      // First run - create file and allow fetch
      await this.updateFetchRecord(true);
      return true;
    }
  }

  /**
   * Update fetch record
   */
  async updateFetchRecord(reset = false) {
    try {
      let data = { requestCount: 0, month: new Date().getMonth() };
      
      if (!reset) {
        try {
          const existing = await this.fs.readFile(this.lastFetchFile, 'utf-8');
          data = JSON.parse(existing);
        } catch (error) {
          // File doesn't exist yet
        }
      }
      
      data.lastFetch = new Date().toISOString();
      data.requestCount = (data.requestCount || 0) + 1;
      data.month = new Date().getMonth();
      
      await this.fs.writeFile(this.lastFetchFile, JSON.stringify(data, null, 2));
      console.log(`📝 Updated fetch record: ${data.requestCount}/10 requests this month`);
      
    } catch (error) {
      console.error('Error updating fetch record:', error);
    }
  }

  /**
   * Perform scheduled fetch
   */
  async performScheduledFetch() {
    try {
      console.log('⏰ Checking if scheduled fetch is needed...');
      
      const shouldFetch = await this.shouldFetchToday();
      
      if (shouldFetch) {
        console.log('✅ Performing scheduled job fetch...');
        await jobsService.syncJobs();
        await this.updateFetchRecord();
      } else {
        console.log('⏭️ Skipping fetch - next fetch in 3 days or less');
      }
      
    } catch (error) {
      console.error('Error in scheduled fetch:', error);
    }
  }

  /**
   * Start the scheduler
   * Runs daily at 2 AM to check if fetch is needed
   */
  start() {
    console.log('🕒 Starting jobs fetch scheduler...');
    
    // Run every day at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.performScheduledFetch();
    });

    // Cleanup expired jobs daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
      console.log('🗑️ Running daily cleanup...');
      await this.jobModel.cleanupExpiredJobs();
    });

    console.log('✅ Scheduler started - will fetch every 3 days');
  }

  /**
   * Manual fetch (for admin use)
   */
  async manualFetch() {
    console.log('🔧 Manual fetch triggered...');
    await jobsService.syncJobs();
    await this.updateFetchRecord();
  }
}

module.exports = new JobsFetchScheduler();
