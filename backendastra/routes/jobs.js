// routes/jobs.js
const express = require('express');
const router = express.Router();
const jobsService = require('../services/jobsService');
const jobsFetchScheduler = require('../jobs/jobsFetchScheduler');

// Get all jobs
router.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await jobsService.getJobs();
    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get tech/DSA jobs
router.get('/api/jobs/tech', async (req, res) => {
  try {
    const jobs = await jobsService.getTechJobs();
    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search jobs
router.get('/api/jobs/search', async (req, res) => {
  try {
    const { q } = req.query;
    const jobs = await jobsService.searchJobs(q);
    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get job statistics
router.get('/api/jobs/stats', async (req, res) => {
  try {
    const stats = await jobsService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// Debug endpoint - Remove in production
router.get('/api/jobs/debug-api', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get('https://jobs.indianapi.in/jobs', {
      headers: {
        'x-api-key': process.env.INDIAN_API_KEY,
        'Content-Type': 'application/json'
      },
      params: {
        limit: '5' // Just get 5 for debugging
      }
    });

    res.json({
      success: true,
      responseType: typeof response.data,
      isArray: Array.isArray(response.data),
      keys: response.data ? Object.keys(response.data) : [],
      sampleData: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      responseData: error.response?.data
    });
  }
});


// Manual sync (admin only - protect with auth middleware)
router.post('/api/jobs/sync', async (req, res) => {
  try {
    await jobsFetchScheduler.manualFetch();
    res.json({
      success: true,
      message: 'Jobs synced successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
