import axios from 'axios';

// Production-ready environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://alphahostingfinal.onrender.com';

// console.log('🌐 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Enhanced request interceptor: inject Authorization if token exists
api.interceptors.request.use(
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
// - Convert 401 for GET /auth/user into a success-like resolved response to avoid rejected Promise and console error
// - For other 401s, clear tokens (optional redirect commented)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const method = (error.config?.method || 'get').toLowerCase();

    // Suppress unauthenticated check for current user by resolving to a success-like response
    if (status === 401 && method === 'get' && url.includes('/auth/user')) {
      return Promise.resolve({
        data: null,
        status: 200,            // normalize as OK to suppress red error indicator in console
        statusText: 'OK',
        headers: error.response?.headers || {},
        config: error.config,
        request: error.request
      });
    }

    // if (!(status === 401 && url?.includes('/auth/user'))) {
    //   console.error(`❌ API Error: ${status} ${error.config?.method?.toUpperCase()} ${url}`, error.response?.data || error.message);
    // }

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

// FIXED: Auth API with proper token storage and 401 suppression on initial load
export const authAPI = {
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/user', {
        // Accept 401 as valid to avoid rejection if interceptor ever changes
        validateStatus: (status) => (status >= 200 && status < 300) || status === 401
      });
      // Removed erroneous `if (!response.success) return;`
      // Normalize to null for no user
      return response?.data ?? null;
    } catch (error) {
      // Keep quiet on initial load
      return null;
    }
  },

  verifyGoogleToken: async (token) => {
    try {
      // console.log('🔐 Verifying Google token...');
      const response = await api.post('/auth/google/verify', { token });

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
      // Important: send undefined (no body), not null; avoid JSON parser error on server
      await api.post('/auth/logout', undefined, {
        // Avoid rejection/noise in case backend returns 4xx on logout
        validateStatus: (s) => s >= 200 && s < 500
      });
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('cachedUser');
      // console.log('🔓 Tokens cleared from localStorage');
    }
  },
};

// Progress API with revision support
export const progressAPI = {
  getUserProgress: (userId) => api.get(`/progress/${userId}`),
  toggleProblem: (problemData) => api.post('/progress/toggle', problemData),
  toggleRevision: (problemData) => api.post('/progress/toggle-revision', problemData),
  getStats: (userId) => api.get(`/progress/stats/${userId}`),
  getRevisionProblems: (userId) => api.get(`/progress/revision/${userId}`)
};
export const problemAPI = {
   delete: (problemId) => api.delete(`/problems/${problemId}`),
  getBatch: (problemIds) => api.post('/problems/batch', { problemIds }),
  getAll: (filters) => api.get('/problems', { params: filters }),
  search: (params) => api.get('/problems/search', { params }),
  getById: (problemId) => api.get(`/problems/${problemId}`),
  getByIds: (problemIds) => api.post('/problems/batch', { problemIds }),
  create: (problemData) => api.post('/problems', problemData),
  update: (problemId, data) => api.put(`/problems/${problemId}`, data),
  delete: (problemId) => api.delete(`/problems/${problemId}`)
};
// Sheet API
export const sheetAPI = {
   getAllWithProblems: () => api.get('/sheets/with-problems'),
  getAll: () => api.get('/sheets'),
  getById: (sheetId) => api.get(`/sheets/${sheetId}`),
  create: (sheetData) => api.post('/sheets', sheetData),
  update: (sheetId, sheetData) => api.put(`/sheets/${sheetId}`, sheetData),
  delete: (sheetId) => api.delete(`/sheets/${sheetId}`),
  
  // Section management
  addSection: (sheetId, sectionData) => api.post(`/sheets/${sheetId}/sections`, sectionData),
  updateSection: (sheetId, sectionId, sectionData) => api.put(`/sheets/${sheetId}/sections/${sectionId}`, sectionData),
  deleteSection: (sheetId, sectionId) => api.delete(`/sheets/${sheetId}/sections/${sectionId}`),
  
  // Subsection management
  addSubsection: (sheetId, sectionId, subsectionData) => api.post(`/sheets/${sheetId}/sections/${sectionId}/subsections`, subsectionData),
  updateSubsection: (sheetId, sectionId, subsectionId, subsectionData) => api.put(`/sheets/${sheetId}/sections/${sectionId}/subsections/${subsectionId}`, subsectionData),
  deleteSubsection: (sheetId, sectionId, subsectionId) => api.delete(`/sheets/${sheetId}/sections/${sectionId}/subsections/${subsectionId}`),
  
  // ✅ NEW: Unlink problem from subsection (doesn't delete globally)
  unlinkProblem: (sheetId, sectionId, subsectionId, problemId) => 
    api.delete(`/sheets/${sheetId}/sections/${sectionId}/subsections/${subsectionId}/problems/${problemId}/unlink`),
  
  // Link existing problem to subsection
  linkProblem: (sheetId, sectionId, subsectionId, problemId) => 
    api.post(`/sheets/${sheetId}/sections/${sectionId}/subsections/${subsectionId}/link-problem`, { problemId })
};


export const announcementAPI = {
  getAll: () => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
  markAsRead: (id) => api.post(`/announcements/${id}/read`),
  getReadStatus: (id) => api.get(`/announcements/${id}/read-status`),
  getUnreadCount: () => api.get('/announcements/unread-count'),
};

// Admin APIs
export const adminAPI = {
  // User management
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  createUser: (userData) => api.post('/admin/users', userData),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),

  // System management
  getSystemStats: () => api.get('/admin/stats'),
  getAuditLogs: (page = 1, limit = 50) => api.get(`/admin/audit-logs?page=${page}&limit=${limit}`),

  // Bulk operations
  bulkUpdateUsers: (userUpdates) => api.put('/admin/users/bulk', { updates: userUpdates }),
  bulkDeleteUsers: (userIds) => api.delete('/admin/users/bulk', { data: { userIds } }),

  // Settings management
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings) => api.put('/admin/settings', settings)
};

// Content management APIs
export const contentAPI = {
  // Editorial management
  getEditorials: () => api.get('/editorials'),
  getEditorial: (problemId) => api.get(`/editorials/${problemId}`),
  createEditorial: (problemId, data) => api.post(`/editorials/${problemId}`, data),
  updateEditorial: (problemId, data) => api.put(`/editorials/${problemId}`, data),
  deleteEditorial: (problemId) => api.delete(`/editorials/${problemId}`),

  // File uploads
  uploadFile: (file, type = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Template management
  getTemplates: () => api.get('/templates'),
  createTemplate: (data) => api.post('/templates', data),
  updateTemplate: (id, data) => api.put(`/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/templates/${id}`)
};

// Analytics and reporting APIs
export const analyticsAPI = {
  getUserProgress: (userId, dateRange) => api.get(`/analytics/users/${userId}/progress?${dateRange}`),
  getSheetAnalytics: (sheetId, dateRange) => api.get(`/analytics/sheets/${sheetId}?${dateRange}`),
  getOverallStats: (dateRange) => api.get(`/analytics/overview?${dateRange}`),
  getProblemStats: (problemId) => api.get(`/analytics/problems/${problemId}`),
  getLeaderboard: (type = 'all', limit = 100) => api.get(`/analytics/leaderboard?type=${type}&limit=${limit}`),
  exportAnalytics: (type, filters) => api.post(`/analytics/export`, { type, filters })
};

// Notification APIs
export const notificationAPI = {
  getNotifications: (userId) => api.get(`/notifications/${userId}`),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) => api.put(`/notifications/${userId}/read-all`),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),

  // Admin notifications
  createNotification: (data) => api.post('/notifications', data),
  broadcastNotification: (data) => api.post('/notifications/broadcast', data)
};

// Search APIs
export const searchAPI = {
  searchProblems: (query, filters = {}) => api.get(`/search/problems?q=${encodeURIComponent(query)}&${new URLSearchParams(filters)}`),
  searchSheets: (query, filters = {}) => api.get(`/search/sheets?q=${encodeURIComponent(query)}&${new URLSearchParams(filters)}`),
  searchUsers: (query, filters = {}) => api.get(`/search/users?q=${encodeURIComponent(query)}&${new URLSearchParams(filters)}`),
  globalSearch: (query) => api.get(`/search/global?q=${encodeURIComponent(query)}`)
};

// Debug functions (console statements commented)
export const testAPI = {
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
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

export default api;
