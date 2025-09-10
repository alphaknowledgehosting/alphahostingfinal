import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { announcementAPI } from '../services/api';

// Enhanced utility functions for exact time formatting
const formatExactTime = (dateString) => {
  const date = new Date(dateString);
  
  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  return date.toLocaleString('en-US', options) + ' IST';
};

const getDetailedTimeInfo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  let timeAgo = '';
  if (diffInMinutes < 1) {
    timeAgo = 'Just now';
  } else if (diffInMinutes < 60) {
    timeAgo = `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    timeAgo = `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    timeAgo = `${diffInDays}d ago`;
  } else {
    timeAgo = 'More than a week ago';
  }
  
  return {
    exact: formatExactTime(dateString),
    relative: timeAgo,
    isRecent: diffInMinutes < 60
  };
};

// Real-time notification function
const showRealtimeNotification = (announcement) => {
  const timeInfo = getDetailedTimeInfo(announcement.createdAt);
  
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="
      position: fixed; 
      top: 80px; 
      right: 20px; 
      z-index: 9999;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      max-width: 350px;
      animation: slideIn 0.3s ease-out;
    ">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 18px;">📢</span>
        <strong>New Announcement</strong>
        <span style="font-size: 10px; opacity: 0.8; margin-left: auto;">
          ${timeInfo.exact}
        </span>
      </div>
      <div style="font-size: 14px; opacity: 0.9; margin-bottom: 4px;">
        ${announcement.title}
      </div>
      <div style="font-size: 11px; opacity: 0.7;">
        Posted just now
      </div>
    </div>
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 5000);
};

// FIXED: Global request tracking to prevent multiple simultaneous requests
const requestTracker = {
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

// FIXED: Smart fetch trigger with global deduplication
const useSmartFetchTrigger = (queryClient, user) => {
  const lastFetchRef = useRef(Date.now());
  const timeoutRef = useRef(null);

  const triggerSmartFetch = useCallback((reason = 'unknown') => {
    if (!user?._id) return;
    
    const queryKey = ['announcements', user._id];
    const requestKey = `announcements-${user._id}`;
    
    // Check if there's already an ongoing request
    if (requestTracker.isRequestOngoing(requestKey)) {
      // console.log(`⏳ Skipping fetch (${reason}) - request already in progress`);
      return;
    }
    
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    
    // Check if query is already fetching via React Query
    const queryState = queryClient.getQueryState(queryKey);
    if (queryState?.isFetching || queryState?.isRefetching) {
      // console.log(`⏳ Skipping fetch (${reason}) - React Query already fetching`);
      return;
    }
    
    // Prevent fetching if less than 10 seconds since last fetch
    if (timeSinceLastFetch < 10000) {
      // console.log(`⏳ Skipping fetch (${reason}) - too recent (${timeSinceLastFetch}ms ago)`);
      return;
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce: Wait 500ms before actually triggering
    timeoutRef.current = setTimeout(() => {
      // Double-check if request is still needed
      if (requestTracker.isRequestOngoing(requestKey)) {
        // console.log(`⏳ Skipping delayed fetch (${reason}) - request started elsewhere`);
        return;
      }
      
      // console.log(`🎯 Smart fetch triggered: ${reason}`);
      lastFetchRef.current = now;
      
      const invalidatePromise = queryClient.invalidateQueries(queryKey);
      requestTracker.startRequest(requestKey, invalidatePromise);
    }, 500);
  }, [queryClient, user?._id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return triggerSmartFetch;
};

// FIXED: Request deduplication wrapper for the API call
const createDedupedAnnouncementFetcher = () => {
  return async (userId) => {
    const requestKey = `fetch-announcements-${userId}`;
    
    // If there's already an ongoing request, return that promise
    if (requestTracker.isRequestOngoing(requestKey)) {
      // console.log('🔄 Reusing ongoing announcement fetch request');
      return requestTracker.getOngoingRequest(requestKey);
    }
    
    // Create new request
    // console.log('🔄 Fetching announcements from server with read status...');
    const fetchPromise = announcementAPI.getAll().then(response => {
      // console.log('✅ Announcements fetched:', response.data.announcements?.length || 0);
      return response.data.announcements || [];
    });
    
    // Track this request
    return requestTracker.startRequest(requestKey, fetchPromise);
  };
};

// Create the deduped fetcher
const dedupedFetcher = createDedupedAnnouncementFetcher();

export const useAnnouncements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const triggerSmartFetch = useSmartFetchTrigger(queryClient, user);
  
  // Store the trigger function in a ref so mutations can access it
  const triggerFetchRef = useRef(triggerSmartFetch);
  triggerFetchRef.current = triggerSmartFetch;
  
  // Expose the trigger function for external use (mutations, manual refresh)
  useEffect(() => {
    if (user && queryClient) {
      queryClient.setMutationDefaults(['announcements'], {
        meta: { triggerSmartFetch: triggerFetchRef.current }
      });
    }
  }, [user, queryClient]);
  
  return useQuery({
    queryKey: ['announcements', user?._id],
    queryFn: () => dedupedFetcher(user._id), // Use deduped fetcher
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh longer
    cacheTime: 1000 * 60 * 15, // 15 minutes - cache stays in memory longer
    refetchOnWindowFocus: false, // Disabled to prevent auto-refetch
    refetchOnMount: false, // CHANGED: Prevent refetch on every mount
    refetchOnReconnect: false, // CHANGED: Prevent refetch on reconnect
    retry: 1, // Reduced retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // ADDED: Prevent duplicate requests
    notifyOnChangeProps: ['data', 'error', 'isError', 'isLoading'],
    structuralSharing: true, // Enable structural sharing to prevent unnecessary re-renders
    onSuccess: (newData) => {
      const cachedData = queryClient.getQueryData(['announcements', user?._id]);
      
      if (cachedData && newData.length > cachedData.length) {
        const latestAnnouncement = newData[0];
        const wasAlreadyCached = cachedData.some(ann => 
          (ann._id || ann.id) === (latestAnnouncement._id || latestAnnouncement.id)
        );
        
        if (!wasAlreadyCached && latestAnnouncement && !latestAnnouncement.isRead) {
          // console.log('🔔 New announcement detected:', latestAnnouncement.title);
          showRealtimeNotification(latestAnnouncement);
        }
      }
    }
  });
};

export const useAnnouncementMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addAnnouncement = useMutation({
    mutationFn: async (announcementData) => {
      // console.log('Creating announcement:', announcementData);
      const response = await announcementAPI.create(announcementData);
      return response.data;
    },
    onMutate: async (newAnnouncement) => {
      await queryClient.cancelQueries(['announcements']);
      
      const previousAnnouncements = queryClient.getQueryData(['announcements', user?._id]);
      
      const optimisticAnnouncement = {
        _id: `temp-${Date.now()}`,
        id: `temp-${Date.now()}`,
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        type: newAnnouncement.type || 'info',
        priority: newAnnouncement.priority || 'medium',
        isActive: true,
        isRead: false,
        readBy: [],
        author: user?.name || 'You',
        createdAt: new Date().toISOString(),
        links: newAnnouncement.links || [],
        readTime: newAnnouncement.readTime || '2 min read',
        isOptimistic: true
      };
      
      queryClient.setQueryData(['announcements', user?._id], (old) => 
        [optimisticAnnouncement, ...(old || [])]
      );
      
      // console.log('⚡ Optimistic announcement added');
      
      return { previousAnnouncements };
    },
    onError: (err, newAnnouncement, context) => {
      console.error('Error creating announcement:', err);
      if (context?.previousAnnouncements) {
        queryClient.setQueryData(['announcements', user?._id], context.previousAnnouncements);
        // console.log('❌ Rolled back optimistic update');
      }
    },
    onSuccess: (response, variables, context) => {
      // console.log('✅ Announcement created successfully');
      
      queryClient.setQueryData(['announcements', user?._id], (old) => {
        const filteredOld = (old || []).filter(ann => !ann.isOptimistic);
        return [response.announcement, ...filteredOld];
      });
      
      // Signal other tabs about the new announcement without triggering immediate fetch
      localStorage.setItem('announcements-updated', Date.now().toString());
      setTimeout(() => localStorage.removeItem('announcements-updated'), 1000);
    },
    onSettled: () => {
      // Only invalidate if data seems inconsistent
      setTimeout(() => {
        const currentData = queryClient.getQueryData(['announcements', user?._id]);
        const hasOptimisticData = currentData?.some(ann => ann.isOptimistic);
        if (hasOptimisticData) {
          // console.log('🔄 Found optimistic data, cleaning up...');
          queryClient.invalidateQueries(['announcements', user?._id]);
        }
      }, 2000);
    }
  });

  const updateAnnouncement = useMutation({
    mutationFn: async ({ announcementId, data }) => {
      // console.log('🔄 Updating announcement:', announcementId, data);
      const response = await announcementAPI.update(announcementId, data);
      return { ...response.data, announcementId };
    },
    onMutate: async ({ announcementId, data }) => {
      // console.log('⚡ Starting optimistic update for:', announcementId);
      
      await queryClient.cancelQueries(['announcements']);
      
      const previousAnnouncements = queryClient.getQueryData(['announcements', user?._id]);
      
      queryClient.setQueryData(['announcements', user?._id], (old) => {
        if (!old) return [];
        
        return old.map(ann => {
          if ((ann._id || ann.id) === announcementId) {
            return {
              ...ann,
              ...data,
              updatedAt: new Date().toISOString(),
              isOptimistic: true
            };
          }
          return ann;
        });
      });
      
      // console.log('⚡ Optimistically updated announcement in cache');
      
      return { previousAnnouncements, announcementId };
    },
    onError: (err, { announcementId }, context) => {
      console.error('❌ Update failed, rolling back:', err.message);
      
      if (context?.previousAnnouncements) {
        queryClient.setQueryData(['announcements', user?._id], context.previousAnnouncements);
        // console.log('↩️ Rolled back optimistic update');
      }
      
      alert('Failed to update announcement: ' + (err.response?.data?.message || err.message));
    },
    onSuccess: (response, { announcementId }) => {
      // console.log('✅ Update successful for:', announcementId);
      
      queryClient.setQueryData(['announcements', user?._id], (old) => {
        if (!old) return [];
        
        return old.map(ann => {
          if ((ann._id || ann.id) === announcementId) {
            return {
              ...ann,
              ...response.result,
              isOptimistic: false
            };
          }
          return ann;
        });
      });
    }
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (announcementId) => {
      // console.log('🗑️ Frontend: Deleting announcement with ID:', announcementId);
      
      if (!announcementId || typeof announcementId !== 'string') {
        console.error('❌ Frontend: Invalid announcement ID:', announcementId);
        throw new Error('Invalid announcement ID provided');
      }
      
      const response = await announcementAPI.delete(announcementId);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Delete operation failed');
      }
      
      return { deletedId: announcementId, ...response.data };
    },
    onMutate: async (announcementId) => {
      // console.log('⚡ Frontend: Starting optimistic delete for:', announcementId);
      
      await queryClient.cancelQueries(['announcements']);
      
      const previousAnnouncements = queryClient.getQueryData(['announcements', user?._id]);
      
      const announcementToDelete = previousAnnouncements?.find(ann => {
        const matchesId = (ann.id === announcementId);
        const matchesMongoId = (ann._id === announcementId);
        return matchesId || matchesMongoId;
      });
      
      if (!announcementToDelete) {
        console.warn('⚠️ Frontend: Announcement not found in cache:', announcementId);
        throw new Error('Announcement not found in current data');
      }
      
      queryClient.setQueryData(['announcements', user?._id], (old) => {
        if (!old) return [];
        
        const filtered = old.filter(ann => {
          const shouldKeep = ann.id !== announcementId && ann._id !== announcementId;
          return shouldKeep;
        });
        
        // console.log(`⚡ Frontend: Optimistically removed. Count: ${old.length} → ${filtered.length}`);
        return filtered;
      });
      
      return { previousAnnouncements, announcementToDelete };
    },
    onError: (error, announcementId, context) => {
      console.error('❌ Frontend: Delete failed:', error.message);
      
      if (context?.previousAnnouncements) {
        // console.log('↩️ Frontend: Rolling back optimistic delete');
        queryClient.setQueryData(['announcements', user?._id], context.previousAnnouncements);
      }
      
      alert('Failed to delete announcement: ' + error.message);
    },
    onSuccess: (response, announcementId, context) => {
      // console.log('✅ Frontend: Delete successful:', response);
      
      queryClient.setQueryData(['announcements', user?._id], (old) => {
        if (!old) return [];
        
        const filtered = old.filter(ann => 
          ann.id !== response.deletedId && ann._id !== response.deletedId
        );
        
        // console.log(`✅ Frontend: Confirmed removal. Final count: ${filtered.length}`);
        return filtered;
      });
      
      // console.log(`🎉 Frontend: Announcement "${context.announcementToDelete?.title}" successfully deleted`);
    }
  });

  const markAsRead = useMutation({
    mutationFn: async (announcementId) => {
      // console.log('Marking announcement as read:', announcementId);
      const response = await announcementAPI.markAsRead(announcementId);
      return response.data;
    },
    onMutate: async (announcementId) => {
      await queryClient.cancelQueries(['announcements']);
      
      const previousAnnouncements = queryClient.getQueryData(['announcements', user?._id]);
      
      queryClient.setQueryData(['announcements', user?._id], (old) =>
        (old || []).map(ann => 
          (ann._id || ann.id) === announcementId 
            ? { ...ann, isRead: true, readBy: [...(ann.readBy || []), user._id] }
            : ann
        )
      );
      
      return { previousAnnouncements };
    },
    onError: (err, variables, context) => {
      console.error('Error marking as read:', err);
      if (context?.previousAnnouncements) {
        queryClient.setQueryData(['announcements', user?._id], context.previousAnnouncements);
      }
    },
    onSuccess: () => {
      // console.log('✅ Marked as read successfully');
    },
  });

  return { addAnnouncement, updateAnnouncement, deleteAnnouncement, markAsRead };
};

// Enhanced real-time updates with better deduplication
export const useAnnouncementUpdates = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const triggerSmartFetch = useSmartFetchTrigger(queryClient, user);
  const lastEventRef = useRef({ type: null, timestamp: 0 });
  
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const now = Date.now();
        const lastEvent = lastEventRef.current;
        
        if (lastEvent.type === 'visibility' && now - lastEvent.timestamp < 5000) {
          // console.log('⏳ Skipping visibility change - too recent');
          return;
        }
        
        // console.log('👁️ Tab became visible - triggering smart fetch');
        lastEventRef.current = { type: 'visibility', timestamp: now };
        triggerSmartFetch('visibility-change');
      }
    };

    const handleFocus = () => {
      const now = Date.now();
      const lastEvent = lastEventRef.current;
      
      if (lastEvent.type === 'focus' && now - lastEvent.timestamp < 5000) {
        // console.log('⏳ Skipping focus event - too recent');
        return;
      }
      
      // console.log('🎯 Window focused - triggering smart fetch');
      lastEventRef.current = { type: 'focus', timestamp: now };
      triggerSmartFetch('window-focus');
    };

    const options = { passive: true };
    document.addEventListener('visibilitychange', handleVisibilityChange, options);
    window.addEventListener('focus', handleFocus, options);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [triggerSmartFetch, user]);

  useEffect(() => {
    if (!user) return;

    const handleStorageChange = (event) => {
      if (event.key === 'announcements-updated') {
        const now = Date.now();
        const lastEvent = lastEventRef.current;
        
        if (lastEvent.type === 'storage' && now - lastEvent.timestamp < 5000) {
          // console.log('⏳ Skipping storage event - too recent');
          return;
        }
        
        // console.log('📢 Storage event: Announcements updated in another tab');
        lastEventRef.current = { type: 'storage', timestamp: now };
        triggerSmartFetch('storage-event');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [triggerSmartFetch, user]);

  useEffect(() => {
    if (user) {
      window.refreshAnnouncements = () => {
        const now = Date.now();
        const lastEvent = lastEventRef.current;
        
        if (lastEvent.type === 'manual' && now - lastEvent.timestamp < 2000) {
          // console.log('⏳ Skipping manual refresh - too recent');
          return;
        }
        
        lastEventRef.current = { type: 'manual', timestamp: now };
        triggerSmartFetch('manual-refresh');
      };
    }

    return () => {
      if (window.refreshAnnouncements) {
        delete window.refreshAnnouncements;
      }
    };
  }, [triggerSmartFetch, user]);
};

export { formatExactTime, getDetailedTimeInfo };
