import axios from 'axios';

// Two Render backends API configuration for load distribution
const API_DOMAINS = {
  AUTH: process.env.REACT_APP_RENDER_AUTH_API || 'https://alphaknowledgefinal-1.onrender.com',
  CORE: process.env.REACT_APP_RENDER_CORE_API || 'https://alphaknowledgefinal-2.onrender.com'
};

// Create API instances for each service
const createAPIInstance = (baseURL, service) => {
  const instance = axios.create({
    baseURL: `${baseURL}/api`,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: service === 'AUTH' ? 30000 : 30000,
  });

  // Enhanced request interceptor: inject Authorization if token exists
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        // console.log('🔐 Token added to request:', config.url);
      } else {
        // console.log('⚠️ No token found for request:', config.url);
      }
      return config;
    },
    (error) => {
      // console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // ENHANCED: Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const url = error.config?.url || '';
      const method = (error.config?.method || 'get').toLowerCase();

      // Suppress unauthenticated check for current user by resolving to a success-like response
      if (status === 401 && method === 'get' && url.includes('/auth/user')) {
        return Promise.resolve({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: error.response?.headers || {},
          config: error.config,
          request: error.request
        });
      }

      if (status === 401) {
        // console.log('🔒 Unauthorized - clearing tokens');
        localStorage.removeItem('authToken');
        localStorage.removeItem('cachedUser');

        // Optional: soft redirect only if not already at public pages
        const path = window.location.pathname;
        if (path !== '/' && path !== '/login') {
          // window.location.href = '/';
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Create service-specific API instances
const authApi = createAPIInstance(API_DOMAINS.AUTH, 'AUTH');     // Render Backend 1
const coreApi = createAPIInstance(API_DOMAINS.CORE, 'CORE');     // Render Backend 2

// AUTH API - Hosted on Render Backend 1 (Persistent Auth Services)
export const authAPI = {
  getCurrentUser: async () => {
    try {
      const response = await authApi.get('/auth/user', {
        validateStatus: (status) => (status >= 200 && status < 300) || status === 401
      });
      return response?.data ?? null;
    } catch (error) {
      return null;
    }
  },

  verifyGoogleToken: async (token) => {
    try {
      // console.log('🔐 Verifying Google token...');
      const response = await authApi.post('/auth/google/verify', { token });

      if (response?.data?.success && response?.data?.token) {
        localStorage.setItem('authToken', response.data.token);
        // console.log('✅ JWT token stored in localStorage');

        if (response?.data?.user) {
          localStorage.setItem('cachedUser', JSON.stringify(response.data.user));
          // console.log('✅ User data cached');
        }
      } else {
        // console.error('❌ No JWT token received from backend!');
        // console.log('Response:', response?.data);
      }

      return response?.data ?? null;
    } catch (error) {
      // console.error('❌ Token verification failed:', error.response?.data || error.message);
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.post('/auth/logout', undefined, {
        validateStatus: (s) => s >= 200 && s < 500
      });
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('cachedUser');
      // console.log('🔓 Tokens cleared from localStorage');
    }
  },
};

// Debug functions - Using AUTH service
export const testAPI = {
  healthCheck: async () => {
    try {
      const response = await authApi.get('/health');
      // console.log('✅ Backend is reachable:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ Backend test failed:', error);
      throw error;
    }
  },

  checkToken: () => {
    const token = localStorage.getItem('authToken');
    // console.log('🔐 Token in storage:', token ? 'Present' : 'Missing');
    // if (token) console.log('Token preview:', token.substring(0, 20) + '...');
    return !!token;
  }
};

// CORE APIs - Hosted on Render Backend 2 (All CRUD Operations & Admin Functions)
export const progressAPI = {
  getUserProgress: (userId) => coreApi.get(`/progress/${userId}`),
  toggleProblem: (problemData) => coreApi.post('/progress/toggle', problemData),
  toggleRevision: (problemData) => coreApi.post('/progress/toggle-revision', problemData),
  getStats: (userId) => coreApi.get(`/progress/stats/${userId}`),
  getRevisionProblems: (userId) => coreApi.get(`/progress/revision/${userId}`)
};

export const sheetAPI = {
  getAll: () => coreApi.get('/sheets'),
  getById: (id) => coreApi.get(`/sheets/${id}`),
  create: (data) => coreApi.post('/sheets', data),
  update: (id, data) => coreApi.put(`/sheets/${id}`, data),
  delete: (id) => coreApi.delete(`/sheets/${id}`),
  addSection: (sheetId, data) => coreApi.post(`/sheets/${sheetId}/sections`, data),
  updateSection: (sheetId, sectionId, data) => coreApi.put(`/sheets/${sheetId}/sections/${sectionId}`, data),
  deleteSection: (sheetId, sectionId) => coreApi.delete(`/sheets/${sheetId}/sections/${sectionId}`),
  addSubsection: (sheetId, sectionId, data) => coreApi.post(`/sheets/${sheetId}/sections/${sectionId}/subsections`, data),
  updateSubsection: (sheetId, sectionId, subsectionId, data) => coreApi.put(`/sheets/${sheetId}/sections/${sectionId}/subsections/${subsectionId}`, data),
  deleteSubsection: (sheetId, sectionId, subsectionId) => coreApi.delete(`/sheets/${sheetId}/sections/${sectionId}/subsections/${subsectionId}`),
  addProblem: (sheetId, sectionId, subsectionId, data) => coreApi.post(`/sheets/${sheetId}/sections/${sectionId}/subsections/${subsectionId}/problems`, data),
  updateProblem: (sheetId, sectionId, subsectionId, problemId, data) => coreApi.put(`/sheets/${sheetId}/sections/${sectionId}/subsections/${subsectionId}/problems/${problemId}`, data),
  updateProblemField: (sheetId, sectionId, subsectionId, problemId, data) => coreApi.patch(`/sheets/${sheetId}/sections/${sectionId}/subsections/${subsectionId}/problems/${problemId}`, data),
  deleteProblem: (sheetId, sectionId, subsectionId, problemId) => coreApi.delete(`/sheets/${sheetId}/sections/${sectionId}/subsections/${subsectionId}/problems/${problemId}`),
};

export const contentAPI = {
  // Editorial management
  getEditorials: () => coreApi.get('/editorials'),
  getEditorial: (problemId) => coreApi.get(`/editorials/${problemId}`),
  createEditorial: (problemId, data) => coreApi.post(`/editorials/${problemId}`, data),
  updateEditorial: (problemId, data) => coreApi.put(`/editorials/${problemId}`, data),
  deleteEditorial: (problemId) => coreApi.delete(`/editorials/${problemId}`),

  // File uploads
  uploadFile: (file, type = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return coreApi.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Template management
  getTemplates: () => coreApi.get('/templates'),
  createTemplate: (data) => coreApi.post('/templates', data),
  updateTemplate: (id, data) => coreApi.put(`/templates/${id}`, data),
  deleteTemplate: (id) => coreApi.delete(`/templates/${id}`)
};

export const searchAPI = {
  searchProblems: (query, filters = {}) => coreApi.get(`/search/problems?q=${encodeURIComponent(query)}&${new URLSearchParams(filters)}`),
  searchSheets: (query, filters = {}) => coreApi.get(`/search/sheets?q=${encodeURIComponent(query)}&${new URLSearchParams(filters)}`),
  searchUsers: (query, filters = {}) => coreApi.get(`/search/users?q=${encodeURIComponent(query)}&${new URLSearchParams(filters)}`),
  globalSearch: (query) => coreApi.get(`/search/global?q=${encodeURIComponent(query)}`)
};

export const announcementAPI = {
  getAll: () => coreApi.get('/announcements'),
  create: (data) => coreApi.post('/announcements', data),
  update: (id, data) => coreApi.put(`/announcements/${id}`, data),
  delete: (id) => coreApi.delete(`/announcements/${id}`),
  markAsRead: (id) => coreApi.post(`/announcements/${id}/read`),
  getReadStatus: (id) => coreApi.get(`/announcements/${id}/read-status`),
  getUnreadCount: () => coreApi.get('/announcements/unread-count'),
};

export const adminAPI = {
  // User management
  getUsers: () => coreApi.get('/admin/users'),
  updateUserRole: (userId, role) => coreApi.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => coreApi.delete(`/admin/users/${userId}`),
  createUser: (userData) => coreApi.post('/admin/users', userData),
  getUserDetails: (userId) => coreApi.get(`/admin/users/${userId}`),

  // System management
  getSystemStats: () => coreApi.get('/admin/stats'),
  getAuditLogs: (page = 1, limit = 50) => coreApi.get(`/admin/audit-logs?page=${page}&limit=${limit}`),

  // Bulk operations
  bulkUpdateUsers: (userUpdates) => coreApi.put('/admin/users/bulk', { updates: userUpdates }),
  bulkDeleteUsers: (userIds) => coreApi.delete('/admin/users/bulk', { data: { userIds } }),

  // Settings management
  getSettings: () => coreApi.get('/admin/settings'),
  updateSettings: (settings) => coreApi.put('/admin/settings', settings)
};

export const analyticsAPI = {
  getUserProgress: (userId, dateRange) => coreApi.get(`/analytics/users/${userId}/progress?${dateRange}`),
  getSheetAnalytics: (sheetId, dateRange) => coreApi.get(`/analytics/sheets/${sheetId}?${dateRange}`),
  getOverallStats: (dateRange) => coreApi.get(`/analytics/overview?${dateRange}`),
  getProblemStats: (problemId) => coreApi.get(`/analytics/problems/${problemId}`),
  getLeaderboard: (type = 'all', limit = 100) => coreApi.get(`/analytics/leaderboard?type=${type}&limit=${limit}`),
  exportAnalytics: (type, filters) => coreApi.post(`/analytics/export`, { type, filters })
};

export const notificationAPI = {
  getNotifications: (userId) => coreApi.get(`/notifications/${userId}`),
  markAsRead: (notificationId) => coreApi.put(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) => coreApi.put(`/notifications/${userId}/read-all`),
  deleteNotification: (notificationId) => coreApi.delete(`/notifications/${notificationId}`),

  // Admin notifications
  createNotification: (data) => coreApi.post('/notifications', data),
  broadcastNotification: (data) => coreApi.post('/notifications/broadcast', data)
};

// Keep legacy export for backward compatibility
export default authApi;
