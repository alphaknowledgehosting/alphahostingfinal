// pages/Jobs.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaBriefcase, 
  FaMapMarkerAlt, 
  FaBuilding, 
  FaClock, 
  FaSearch,
  FaFilter,
  FaExternalLinkAlt,
  FaGraduationCap,
  FaCode,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaMoneyBillWave,
  FaUserTie,
  FaArrowLeft,
  FaSync,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ;
const Jobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedJob, setExpandedJob] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Admin-related states
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Check if user is admin
  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    AOS.init({
      once: false,
      duration: 1000,
    });
    fetchJobs();
  }, []);

  // Fetch jobs from backend
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/jobs/tech`);
      setJobs(response.data.data || []);
      setFilteredJobs(response.data.data || []);
      
      const statsResponse = await axios.get(`${API_BASE_URL}/api/jobs/stats`);
      setStats(statsResponse.data.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Manual job sync (admin only)
  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        setSyncMessage({ 
          type: 'error', 
          text: 'Authentication required. Please login again.' 
        });
        return;
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/api/jobs/sync`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setSyncMessage({ 
          type: 'success', 
          text: 'Jobs synced successfully! Refreshing list...' 
        });
        
        // Refresh jobs list after successful sync
        setTimeout(async () => {
          await fetchJobs();
          setSyncMessage({ 
            type: 'success', 
            text: 'Jobs list updated with latest data!' 
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Error syncing jobs:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to sync jobs. Please try again.';
      setSyncMessage({ 
        type: 'error', 
        text: errorMessage 
      });
    } finally {
      setSyncing(false);
      // Clear message after 6 seconds
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = [...jobs];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(searchLower) ||
        job.company?.toLowerCase().includes(searchLower) ||
        job.job_description?.toLowerCase().includes(searchLower) ||
        job.education_and_skills?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter(job => 
        job.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    if (selectedExperience) {
      filtered = filtered.filter(job => 
        job.experience?.toLowerCase().includes(selectedExperience.toLowerCase())
      );
    }

    if (selectedJobType) {
      filtered = filtered.filter(job => 
        job.job_type?.toLowerCase().includes(selectedJobType.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  }, [searchTerm, selectedLocation, selectedExperience, selectedJobType, jobs]);

  // Get unique values for filters
  const getUniqueValues = (field) => {
    const values = jobs.map(job => job[field]).filter(Boolean);
    return [...new Set(values)];
  };

  const locations = getUniqueValues('location');
  const experiences = getUniqueValues('experience');
  const jobTypes = getUniqueValues('job_type');

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLocation('');
    setSelectedExperience('');
    setSelectedJobType('');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently posted';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Toggle job expansion
  const toggleJobExpansion = (jobId) => {
    setExpandedJob(expandedJob === jobId ? null : jobId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-[#030014] dark:via-slate-900 dark:to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden dark:block hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-[#6366f1]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#a855f7]/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 mb-8 text-gray-700 dark:text-gray-300 hover:text-[#6366f1] dark:hover:text-[#6366f1] transition-all duration-300"
          data-aos="fade-right"
          data-aos-duration="800"
        >
          <div className="p-2 rounded-lg bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 group-hover:border-[#6366f1]/50 group-hover:bg-[#6366f1]/5 transition-all duration-300">
            <FaArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-semibold">Back</span>
        </button>

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
            <h2
              data-aos="fade-down"
              data-aos-duration="1000"
              className="inline-block text-4xl sm:text-5xl lg:text-6xl font-bold text-center tracking-tight"
              style={{
                backgroundImage: "linear-gradient(45deg, #6366f1 10%, #a855f7 93%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                 lineHeight: "1.4", 
              }}
            >
              Tech Job Openings
            </h2>
            
            {/* Admin Badge */}
            {isAdmin && (
              <div 
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg animate-pulse"
                data-aos="fade-left"
                data-aos-duration="1000"
              >
                <FaShieldAlt className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">Admin</span>
              </div>
            )}
          </div>
          
          <p
            data-aos="fade-up"
            data-aos-duration="1100"
            className="text-gray-600 dark:text-slate-400 max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed"
          >
           <b> Note:</b> This information is fetched via an API, so some details may be inaccurate. We apologize for any inconvenience.
          </p>
        </div>

        {/* Admin Sync Control Panel */}
        {isAdmin && (
          <div 
            className="mb-8"
            data-aos="fade-up"
            data-aos-duration="1000"
          >
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-xl rounded-2xl p-6 border-2 border-amber-200 dark:border-amber-800 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
                    <FaSync className={`w-5 h-5 text-white ${syncing ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      Admin Controls
                      <FaShieldAlt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manually trigger job sync from Indian Jobs API
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 min-w-[180px] justify-center"
                >
                  {syncing ? (
                    <>
                      <FaSpinner className="w-5 h-5 animate-spin" />
                      <span>Syncing Jobs...</span>
                    </>
                  ) : (
                    <>
                      <FaSync className="w-5 h-5" />
                      <span>Sync Jobs Now</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Sync Status Message */}
              {syncMessage && (
                <div 
                  className={`mt-4 p-4 rounded-xl flex items-center gap-3 transition-all duration-500 ${
                    syncMessage.type === 'success' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
                  }`}
                  data-aos="fade-down"
                >
                  <div className={`p-2 rounded-lg ${
                    syncMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {syncMessage.type === 'success' ? (
                      <FaCheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <FaExclamationTriangle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="font-semibold flex-1">{syncMessage.text}</span>
                  <button
                    onClick={() => setSyncMessage(null)}
                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Info Note */}
              <div className="mt-4 flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-white/5 p-3 rounded-lg">
                <FaInfoCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <p>
                  <strong>Note:</strong> Manual sync is limited to 10 requests per month. 
                  Use this feature only when necessary. Automatic sync runs every 3 days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        {stats && (
          <div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8"
            data-aos="fade-up"
            data-aos-duration="1000"
          >
            <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-xl">
                  <FaBriefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-xl">
                  <FaMapMarkerAlt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Locations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Object.keys(stats.byLocation).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-xl">
                  <FaBuilding className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Companies</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Object.keys(stats.byCompany).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div 
          className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-8 border border-gray-200/50 dark:border-white/10"
          data-aos="fade-up"
          data-aos-duration="1000"
        >
          {/* Search Bar */}
          <div className="relative mb-6">
            <FaSearch className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job title, company, or skills..."
              className="w-full p-4 pl-12 bg-gray-50 dark:bg-white/10 rounded-xl border border-gray-300 dark:border-white/20 placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-transparent transition-all duration-300"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-[#6366f1] dark:hover:text-[#6366f1] transition-colors mb-4"
          >
            <FaFilter className="w-4 h-4" />
            <span className="font-semibold">Filters</span>
            {showFilters ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <div className="relative">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full p-3 pr-10 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-all duration-300 appearance-none cursor-pointer hover:border-[#6366f1]/50"
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">All Locations</option>
                    {locations.map((location, index) => (
                      <option key={index} value={location} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                        {location}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Experience Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Experience Level
                </label>
                <div className="relative">
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="w-full p-3 pr-10 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-all duration-300 appearance-none cursor-pointer hover:border-[#6366f1]/50"
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">All Experience Levels</option>
                    {experiences.map((exp, index) => (
                      <option key={index} value={exp} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                        {exp}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Job Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Job Type
                </label>
                <div className="relative">
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="w-full p-3 pr-10 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-all duration-300 appearance-none cursor-pointer hover:border-[#6366f1]/50"
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">All Job Types</option>
                    {jobTypes.map((type, index) => (
                      <option key={index} value={type} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                        {type}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(searchTerm || selectedLocation || selectedExperience || selectedJobType) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Active Filters:</span>
              {searchTerm && (
                <span className="px-3 py-1 bg-[#6366f1]/10 dark:bg-[#6366f1]/20 text-[#6366f1] rounded-full text-sm flex items-center gap-2">
                  Search: {searchTerm}
                  <FaTimes 
                    className="w-3 h-3 cursor-pointer hover:text-[#a855f7]" 
                    onClick={() => setSearchTerm('')}
                  />
                </span>
              )}
              {selectedLocation && (
                <span className="px-3 py-1 bg-[#6366f1]/10 dark:bg-[#6366f1]/20 text-[#6366f1] rounded-full text-sm flex items-center gap-2">
                  {selectedLocation}
                  <FaTimes 
                    className="w-3 h-3 cursor-pointer hover:text-[#a855f7]" 
                    onClick={() => setSelectedLocation('')}
                  />
                </span>
              )}
              {selectedExperience && (
                <span className="px-3 py-1 bg-[#6366f1]/10 dark:bg-[#6366f1]/20 text-[#6366f1] rounded-full text-sm flex items-center gap-2">
                  {selectedExperience}
                  <FaTimes 
                    className="w-3 h-3 cursor-pointer hover:text-[#a855f7]" 
                    onClick={() => setSelectedExperience('')}
                  />
                </span>
              )}
              {selectedJobType && (
                <span className="px-3 py-1 bg-[#6366f1]/10 dark:bg-[#6366f1]/20 text-[#6366f1] rounded-full text-sm flex items-center gap-2">
                  {selectedJobType}
                  <FaTimes 
                    className="w-3 h-3 cursor-pointer hover:text-[#a855f7]" 
                    onClick={() => setSelectedJobType('')}
                  />
                </span>
              )}
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Jobs Count */}
        <div className="mb-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Showing <span className="font-bold text-[#6366f1]">{filteredJobs.length}</span> {filteredJobs.length === 1 ? 'job' : 'jobs'}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-20">
            <FaSpinner className="w-12 h-12 text-[#6366f1] animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading jobs...</p>
          </div>
        )}

        {/* No Jobs Found */}
        {!loading && filteredJobs.length === 0 && (
          <div 
            className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-gray-200/50 dark:border-white/10 text-center"
            data-aos="fade-up"
          >
            <FaBriefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Jobs Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or search term to find more opportunities.
            </p>
            {(searchTerm || selectedLocation || selectedExperience || selectedJobType) && (
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Jobs List */}
        {!loading && filteredJobs.length > 0 && (
          <div className="space-y-6">
            {filteredJobs.map((job, index) => (
              <div
                key={job.id || index}
                data-aos="fade-up"
                data-aos-duration="1000"
                data-aos-delay={Math.min(index * 50, 500)}
                className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-3xl shadow-lg p-6 border border-gray-200/50 dark:border-white/10 hover:shadow-xl dark:hover:shadow-[#6366f1]/10 transition-all duration-300 hover:scale-[1.01]"
              >
                {/* Job Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {job.title || job.job_title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-2">
                        <FaBuilding className="w-4 h-4 text-[#6366f1]" />
                        <span className="font-semibold">{job.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="w-4 h-4 text-[#a855f7]" />
                        <span>{job.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock className="w-4 h-4 text-green-500" />
                        <span>{formatDate(job.posted_date)}</span>
                      </div>
                    </div>
                    
                    {/* Experience and Salary Row */}
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Experience Badge */}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 dark:from-[#6366f1]/20 dark:to-[#a855f7]/20 rounded-lg">
                        <FaUserTie className="w-3.5 h-3.5 text-[#6366f1]" />
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Experience</span>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {job.experience && job.experience !== 'Not specified' ? job.experience : 'Not specified'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Salary Badge - Only show if disclosed */}
                      {job.salary && job.salary !== 'Not disclosed' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                          <FaMoneyBillWave className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Salary</span>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{job.salary}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Job Type Badge */}
                  <div className="flex flex-col gap-2 items-end ml-4">
                    {job.job_type && (
                      <span className="px-3 py-1 bg-[#6366f1]/10 dark:bg-[#6366f1]/20 text-[#6366f1] rounded-full text-sm font-semibold whitespace-nowrap">
                        {job.job_type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Job Description Preview */}
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {job.job_description || 'No description available'}
                </p>

                {/* Skills/Requirements Preview */}
                {job.education_and_skills && job.education_and_skills !== 'Skills listed in description' && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaGraduationCap className="w-4 h-4 text-[#6366f1]" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Skills Required:
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 pl-6">
                      {job.education_and_skills}
                    </p>
                  </div>
                )}

                {/* Expanded Content */}
                {expandedJob === job.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-4">
                    {/* Full Description */}
                    {job.job_description && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <FaCode className="w-5 h-5 text-[#6366f1]" />
                          Job Description
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {job.job_description}
                        </p>
                      </div>
                    )}

                    {/* About Company */}
                    {job.about_company && job.about_company !== job.company && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <FaBuilding className="w-5 h-5 text-[#6366f1]" />
                          About Company
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {job.about_company}
                        </p>
                      </div>
                    )}

                    {/* Role and Responsibilities */}
                    {job.role_and_responsibility && job.role_and_responsibility !== job.job_description && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <FaUserTie className="w-5 h-5 text-[#6366f1]" />
                          Role & Responsibilities
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {job.role_and_responsibility}
                        </p>
                      </div>
                    )}

                    {/* Education and Skills */}
                    {job.education_and_skills && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <FaGraduationCap className="w-5 h-5 text-[#6366f1]" />
                          Education & Skills Required
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {job.education_and_skills}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={() => toggleJobExpansion(job.id)}
                    className="flex-1 min-w-[150px] px-4 py-3 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {expandedJob === job.id ? (
                      <>
                        <FaChevronUp className="w-4 h-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <FaChevronDown className="w-4 h-4" />
                        View Details
                      </>
                    )}
                  </button>
                  
                  {job.apply_link && (
                    <a
                      href={job.apply_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[150px] px-4 py-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-[#6366f1]/30 flex items-center justify-center gap-2"
                    >
                      <span>Apply Now</span>
                      <FaExternalLinkAlt className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
