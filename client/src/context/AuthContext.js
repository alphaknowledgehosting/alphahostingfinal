import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { authAPI } from '../services/api';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Global unread count tracker to prevent duplicate requests
const unreadCountTracker = {
  ongoing: new Map(),
  isRequestOngoing(key) {
    return this.ongoing.has(key);
  },
  startRequest(key, promise) {
    this.ongoing.set(key, promise);
    promise.finally(() => {
      this.ongoing.delete(key);
    });
    return promise;
  },
  getOngoingRequest(key) {
    return this.ongoing.get(key);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs for optimized polling/state
  const pollingIntervalRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const lastKnownCountRef = useRef(0);
  const lastFetchTimeRef = useRef(0); // use ref instead of state to avoid re-renders
  const isSettingUpRef = useRef(false); // guard against overlapping setup

  // Create authenticated axios instance
  const createAuthenticatedAxios = useCallback(() => {
    const token = localStorage.getItem('authToken');

    return axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'https://alphaknowledgefinal-1.onrender.com',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      timeout: 30000
    });
  }, []);

  // Silently bootstrap auth status on mount once, only if token exists
  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');

        // If no token: skip network entirely, treat as logged-out
        if (!token) {
          setUser(null);
          setLoading(false);
          setInitialized(true);
          return;
        }

        // With token: hydrate from cache for snappy UI
        const cachedUser = localStorage.getItem('cachedUser');
        if (cachedUser && mounted) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch {
            // ignore malformed cache
          }
        }

        // Validate/refresh user with backend (API layer suppresses 401 to null)
        const response = await authAPI.getCurrentUser();
        if (!mounted) return;

        const userData = response?.user || response?.data?.user || null;

        if (userData) {
          setUser(userData);
          localStorage.setItem('cachedUser', JSON.stringify(userData));
        } else {
          // Token invalid/expired: clear
          setUser(null);
          localStorage.removeItem('cachedUser');
          localStorage.removeItem('authToken');
        }
      } catch {
        if (!mounted) return;
        setUser(null);
        localStorage.removeItem('cachedUser');
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    bootstrapAuth();
    return () => { mounted = false; };
  }, []);

  // Smart fetchUnreadCount - no throttling for event-driven calls; ref-based reads
  const fetchUnreadCount = useCallback(async (reason = 'unknown', skipThrottle = false) => {
    if (!user || !user._id) {
      if (lastKnownCountRef.current !== 0) {
        lastKnownCountRef.current = 0;
        setUnreadCount(0);
      }
      return 0;
    }

    const requestKey = `unread-count-${user._id}`;

    if (unreadCountTracker.isRequestOngoing(requestKey)) {
      return unreadCountTracker.getOngoingRequest(requestKey);
    }

    // Only throttle for polling, not for events
    const now = Date.now();
    if (!skipThrottle && lastFetchTimeRef.current && (now - lastFetchTimeRef.current) < 30000) {
      // return cached without triggering re-render
      return lastKnownCountRef.current;
    }

    try {
      const authenticatedAxios = createAuthenticatedAxios();

      const fetchPromise = authenticatedAxios.get('/api/announcements').then(response => {
        const announcements = response.data.announcements || [];

        // LocalStorage handling
        let seenIds = [];
        try {
          const seenIdsRaw = localStorage.getItem('seenAnnouncements');
          seenIds = seenIdsRaw ? JSON.parse(seenIdsRaw) : [];
          seenIds = Array.isArray(seenIds) ? seenIds : [];
        } catch {
          seenIds = [];
          localStorage.setItem('seenAnnouncements', JSON.stringify([]));
        }

        const seenSet = new Set(seenIds);

        // Calculate unread announcements
        const unreadAnnouncements = announcements.filter(ann => {
          const announcementId = ann._id || ann.id;
          if (!announcementId) return false;

          // Server-side readBy
          if (ann.readBy && Array.isArray(ann.readBy) && ann.readBy.includes(user._id)) {
            return false;
          }

          // LocalStorage seen
          if (seenSet.has(announcementId)) {
            return false;
          }

          // Creation date vs user join date
          if (user.createdAt && ann.createdAt) {
            const announcementDate = new Date(ann.createdAt);
            const userJoinDate = new Date(user.createdAt);
            if (announcementDate < userJoinDate) return false;
          }

          return true;
        });

        const newUnread = unreadAnnouncements.length;

        // Only update state if changed
        if (newUnread !== lastKnownCountRef.current) {
          lastKnownCountRef.current = newUnread;
          setUnreadCount(newUnread);
        }

        lastFetchTimeRef.current = now;
        return newUnread;
      });

      return unreadCountTracker.startRequest(requestKey, fetchPromise);

    } catch (error) {
      // If announcements endpoint returns 401, consider user session invalid
      if (error?.response?.status === 401) {
        setUser(null);
        if (lastKnownCountRef.current !== 0) {
          lastKnownCountRef.current = 0;
          setUnreadCount(0);
        }
        localStorage.removeItem('cachedUser');
        localStorage.removeItem('authToken');
      }
      return lastKnownCountRef.current;
    }
  }, [user, createAuthenticatedAxios]);

  // Event-driven system with BroadcastChannel - depend only on user?._id
  useEffect(() => {
    const userId = user?._id;
    if (!userId) {
      if (lastKnownCountRef.current !== 0) {
        lastKnownCountRef.current = 0;
        setUnreadCount(0);
      }
      return;
    }

    if (isSettingUpRef.current) return;
    isSettingUpRef.current = true;

    // Setup
    const channel = new BroadcastChannel('announcements');
    broadcastChannelRef.current = channel;

    const handleBroadcast = (event) => {
      const type = event?.data?.type;
      if (type === 'new-announcement') {
        fetchUnreadCount('broadcast-new', true);
      } else if (type === 'mark-read') {
        fetchUnreadCount('broadcast-read', true);
      }
    };

    channel.addEventListener('message', handleBroadcast);

    // Initial fetch on user login, guard against rapid repeats
    const now = Date.now();
    if (!lastFetchTimeRef.current || (now - lastFetchTimeRef.current) > 2000) {
      fetchUnreadCount('user-login', true);
    }

    // Minimal fallback polling (every 10 minutes)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    pollingIntervalRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchUnreadCount('fallback-polling', false);
      }
    }, 10 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount('tab-visible', true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    isSettingUpRef.current = false;

    return () => {
      channel.removeEventListener('message', handleBroadcast);
      channel.close();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?._id, fetchUnreadCount]);

  // Storage synchronization
  useEffect(() => {
    const userId = user?._id;
    if (!userId) return;

    const handleStorageChange = (event) => {
      if (event.key === 'seenAnnouncements') {
        fetchUnreadCount('storage-change', true);
      }
    };

    const handleCustomStorage = () => {
      fetchUnreadCount('custom-storage', true);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdated', handleCustomStorage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleCustomStorage);
    };
  }, [user?._id, fetchUnreadCount]);

  // Utility function to broadcast announcement events
  const broadcastAnnouncementEvent = useCallback((type, data = {}) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type,
        data,
        timestamp: Date.now()
      });
    }
    window.dispatchEvent(new CustomEvent('announcementUpdated', {
      detail: { type, data }
    }));
  }, []);

  const refreshUnreadCount = useCallback((reason = 'manual') => {
    if (!user || !user._id) return;
    fetchUnreadCount(reason, true);
  }, [user?._id, fetchUnreadCount]);

  // Login with Google JWT token
  const loginWithToken = useCallback(async (googleToken) => {
    try {
      const response = await authAPI.verifyGoogleToken(googleToken);
      const userData = response?.user || response?.data?.user || null;

      if (userData) {
        setUser(userData);
        localStorage.setItem('cachedUser', JSON.stringify(userData));
        return userData;
      } else {
        throw new Error('No user data received');
      }
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      if (lastKnownCountRef.current !== 0) {
        lastKnownCountRef.current = 0;
        setUnreadCount(0);
      }
      lastFetchTimeRef.current = 0;
      localStorage.removeItem('cachedUser');
      localStorage.removeItem('seenAnnouncements');
      localStorage.removeItem('authToken');
    }
  }, []);

  // markAllAsRead with immediate broadcast
  const markAllAsRead = useCallback(async () => {
    if (!user || !user._id) return;

    try {
      const authenticatedAxios = createAuthenticatedAxios();
      const response = await authenticatedAxios.get('/api/announcements');

      const announcements = response.data.announcements || [];
      const allIds = announcements.map(ann => ann._id || ann.id).filter(Boolean);

      localStorage.setItem('seenAnnouncements', JSON.stringify(allIds));

      // Immediate local update
      if (lastKnownCountRef.current !== 0) {
        lastKnownCountRef.current = 0;
        setUnreadCount(0);
      }

      broadcastAnnouncementEvent('mark-read', {
        action: 'mark-all',
        announcementIds: allIds
      });

      window.dispatchEvent(new Event('localStorageUpdated'));

      // Server updates (async)
      const unreadAnnouncements = announcements.filter(ann => {
        const announcementId = ann._id || ann.id;
        return announcementId && (!ann.readBy || !ann.readBy.includes(user._id));
      });
      Promise.all(
        unreadAnnouncements.map(ann =>
          authenticatedAxios.post(`/api/announcements/${ann._id || ann.id}/read`, {})
            .catch(() => {})
        )
      );
    } catch {
      // silent
    }
  }, [user?._id, createAuthenticatedAxios, broadcastAnnouncementEvent]);

  // markAnnouncementAsRead with immediate broadcast
  const markAnnouncementAsRead = useCallback((announcementId) => {
    if (!user || !user._id || !announcementId) return;

    try {
      let seenIds = [];
      try {
        const seenIdsRaw = localStorage.getItem('seenAnnouncements');
        seenIds = seenIdsRaw ? JSON.parse(seenIdsRaw) : [];
        seenIds = Array.isArray(seenIds) ? seenIds : [];
      } catch {
        seenIds = [];
      }

      if (!seenIds.includes(announcementId)) {
        const updatedSeen = [...new Set([...seenIds, announcementId])];
        localStorage.setItem('seenAnnouncements', JSON.stringify(updatedSeen));

        // Immediate local update
        const next = Math.max(0, lastKnownCountRef.current - 1);
        if (next !== lastKnownCountRef.current) {
          lastKnownCountRef.current = next;
          setUnreadCount(next);
        }

        broadcastAnnouncementEvent('mark-read', {
          action: 'mark-single',
          announcementId
        });

        window.dispatchEvent(new Event('localStorageUpdated'));

        const authenticatedAxios = createAuthenticatedAxios();
        authenticatedAxios.post(`/api/announcements/${announcementId}/read`, {})
          .catch(() => {});
      }
    } catch {
      // silent
    }
  }, [user?._id, createAuthenticatedAxios, broadcastAnnouncementEvent]);

  // handleNewAnnouncement with immediate broadcast
  const handleNewAnnouncement = useCallback((newAnnouncementId) => {
    if (!user || !user._id) return;

    const seenIds = JSON.parse(localStorage.getItem('seenAnnouncements') || '[]');
    if (!seenIds.includes(newAnnouncementId)) {
      const next = lastKnownCountRef.current + 1;
      lastKnownCountRef.current = next;
      setUnreadCount(next);

      broadcastAnnouncementEvent('new-announcement', {
        announcementId: newAnnouncementId
      });
    }
  }, [user?._id, broadcastAnnouncementEvent]);

  // Role-based permissions
  const isAdmin = user?.role === 'admin';
  const isMentor = user?.role === 'mentor';
  const isStudent = user?.role === 'student';
  const canManageAnnouncements = isAdmin;
  const canAddEditorials = isAdmin || isMentor;
  const canManageUsers = isAdmin;
  const canManageSheets = isAdmin;
  const canAddProblems = isAdmin;

  // Helper: gate protected pages (call inside route components)
  const requireAuth = useCallback(() => {
    return !!user?._id;
  }, [user?._id]);

  const value = useMemo(() => ({
    user,
    loginWithToken,
    logout,
    loading,
    initialized,
    unreadCount,
    markAllAsRead,
    refreshUnreadCount,
    handleNewAnnouncement,
    markAnnouncementAsRead,
    broadcastAnnouncementEvent,
    isAdmin,
    isMentor,
    isStudent,
    canManageAnnouncements,
    canAddEditorials,
    canManageUsers,
    canManageSheets,
    canAddProblems,
    requireAuth
  }), [
    user,
    loginWithToken,
    logout,
    loading,
    initialized,
    unreadCount,
    markAllAsRead,
    refreshUnreadCount,
    handleNewAnnouncement,
    markAnnouncementAsRead,
    broadcastAnnouncementEvent,
    isAdmin,
    isMentor,
    isStudent,
    canManageAnnouncements,
    canAddEditorials,
    canManageUsers,
    canManageSheets,
    canAddProblems,
    requireAuth
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
