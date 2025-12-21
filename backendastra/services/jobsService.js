// services/jobsService.js
const axios = require('axios');
const Job = require('../models/Job');

class JobsAPIService {
  constructor() {
    this.appId = process.env.ADZUNA_APP_ID;
    this.appKey = process.env.ADZUNA_APP_KEY;
    this.baseURL = 'https://api.adzuna.com/v1/api';
    this.country = 'in'; // India country code
    this.jobModel = new Job();
    this.maxRequestsPerMonth = 10;
    
    // Debug: Check if API credentials are loaded
    if (!this.appId || !this.appKey) {
      console.error('❌ ADZUNA_APP_ID or ADZUNA_APP_KEY not set in .env file!');
      console.error('Please add: ADZUNA_APP_ID and ADZUNA_APP_KEY');
    } else {
      //console.log('✅ Adzuna API credentials configured');
    }
  }

  /**
   * Fetch jobs from Adzuna API - India only
   */
  async fetchJobsFromAPI() {
    try {
      if (!this.appId || !this.appKey) {
        throw new Error('ADZUNA credentials not configured. Please add them to your .env file');
      }

      //console.log('📡 Fetching jobs from Adzuna API (India)...');
      
      // Fetch tech jobs from multiple pages to get more results
      const allJobs = [];
      const maxPages = 5; // Fetch 5 pages (50 jobs per page = 250 jobs max)
      
      for (let page = 1; page <= maxPages; page++) {
        try {
          const response = await axios.get(
            `${this.baseURL}/jobs/${this.country}/search/${page}`,
            {
              params: {
                app_id: this.appId,
                app_key: this.appKey,
                results_per_page: 50,
                what: 'software developer engineer', // Search for tech jobs
                category: 'it-jobs',
                sort_by: 'date', // Most recent first
                'content-type': 'application/json'
              },
              timeout: 15000
            }
          );

          if (response.data && response.data.results && Array.isArray(response.data.results)) {
            allJobs.push(...response.data.results);
            //console.log(`📄 Page ${page}: Fetched ${response.data.results.length} jobs`);
            
            // If we got fewer results than requested, we've reached the end
            if (response.data.results.length < 50) {
              break;
            }
          }
          
          // Add a small delay between requests to be nice to the API
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (pageError) {
          console.error(`⚠️  Error fetching page ${page}:`, pageError.message);
          break; // Stop if we encounter an error
        }
      }

      if (allJobs.length === 0) {
        //console.log('⚠️  No jobs found from Adzuna');
        return [];
      }

      // Transform Adzuna data to our format
      const transformedJobs = allJobs.map(job => ({
        id: job.id || this.generateId(),
        title: job.title || 'Untitled Position',
        company: job.company?.display_name || 'Company Not Specified',
        about_company: job.company?.display_name || '',
        job_description: job.description || '',
        job_title: job.title || 'Untitled Position',
        job_type: this.getJobType(job.contract_time, job.contract_type),
        location: job.location?.display_name || job.location?.area?.join(', ') || 'India',
        experience: this.extractExperience(job.description, job.title),
        role_and_responsibility: job.description || '',
        education_and_skills: this.extractSkills(job.description),
        apply_link: job.redirect_url || '',
        salary: this.getSalary(job),
        posted_date: job.created || new Date().toISOString()
      }));

      //console.log(`✅ Successfully fetched and transformed ${transformedJobs.length} jobs from Adzuna`);
      return transformedJobs;
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('❌ Invalid Adzuna credentials (401 Unauthorized)');
        console.error('Please verify your ADZUNA_APP_ID and ADZUNA_APP_KEY');
      } else if (error.response?.status === 429) {
        console.error('❌ Rate limit exceeded (429 Too Many Requests)');
      } else {
        console.error('❌ Adzuna API request failed:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
      }
      
      return [];
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Get job type from contract info
   */
  getJobType(contractTime, contractType) {
    const time = contractTime || '';
    const type = contractType || '';
    
    if (time === 'full_time') return 'Full Time';
    if (time === 'part_time') return 'Part Time';
    if (type === 'permanent') return 'Permanent';
    if (type === 'contract') return 'Contract';
    
    return 'Full Time';
  }

  /**
   * Extract experience level from description and title
   */
  extractExperience(description, title) {
    const text = `${description} ${title}`.toLowerCase();
    
    if (text.match(/\b(0-1|fresher|graduate|entry[\s-]level)\b/)) {
      return 'Fresher (0-1 years)';
    }
    if (text.match(/\b(1-3|junior)\b/)) {
      return '1-3 years';
    }
    if (text.match(/\b(3-5|mid[\s-]level|intermediate)\b/)) {
      return '3-5 years';
    }
    if (text.match(/\b(5-7|5\+|senior)\b/)) {
      return '5+ years';
    }
    if (text.match(/\b(7\+|lead|principal|architect)\b/)) {
      return '7+ years';
    }
    
    return 'Not specified';
  }

  /**
   * Extract skills from description
   */
  extractSkills(description) {
    if (!description) return '';
    
    const skillKeywords = [
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin',
      'React', 'Angular', 'Vue', 'Node.js', 'Django', 'Flask', 'Spring',
      'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
      'Git', 'Agile', 'Scrum', 'REST API', 'GraphQL',
      'Data Structures', 'Algorithms', 'System Design', 'DSA'
    ];
    
    const foundSkills = [];
    const lowerDesc = description.toLowerCase();
    
    skillKeywords.forEach(skill => {
      if (lowerDesc.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });
    
    return foundSkills.length > 0 ? foundSkills.join(', ') : 'Skills listed in description';
  }

  /**
   * Get salary information
   */
  getSalary(job) {
    if (job.salary_min && job.salary_max) {
      return `₹${job.salary_min} - ₹${job.salary_max}`;
    } else if (job.salary_min) {
      return `₹${job.salary_min}+`;
    } else if (job.salary_max) {
      return `Up to ₹${job.salary_max}`;
    }
    return 'Not disclosed';
  }

  /**
   * Sync jobs: Fetch from API and store in database
   */
  async syncJobs() {
    try {
      const jobs = await this.fetchJobsFromAPI();
      
      if (!jobs || jobs.length === 0) {
        //console.log('⚠️  No jobs to sync');
        return { inserted: 0, updated: 0, message: 'No jobs available from Adzuna' };
      }
      
      const result = await this.jobModel.storeJobs(jobs);
      await this.jobModel.cleanupExpiredJobs();
      
      //console.log(`✅ Job sync complete: ${result.inserted} new, ${result.updated} updated`);
      return result;
      
    } catch (error) {
      console.error('Error syncing jobs:', error.message);
      throw new Error('Failed to sync jobs: ' + error.message);
    }
  }

  /**
   * Get all jobs from database
   */
  async getJobs() {
    return await this.jobModel.getAllJobs();
  }

  /**
   * Get tech jobs from database
   */
  async getTechJobs() {
    return await this.jobModel.getTechJobs();
  }

  /**
   * Search jobs in database
   */
  async searchJobs(searchTerm) {
    return await this.jobModel.searchJobs(searchTerm);
  }

  /**
   * Get job statistics
   */
  async getStats() {
    return await this.jobModel.getJobStats();
  }
}

module.exports = new JobsAPIService();
