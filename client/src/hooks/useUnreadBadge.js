import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import axios from 'axios';

export const useUnreadBadge = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('/api/announcements', { 
          withCredentials: true 
        });
        
        const announcements = response.data.announcements || [];
        const seenIds = JSON.parse(localStorage.getItem('seenAnnouncements') || '[]');
        const unread = announcements.filter(ann => !seenIds.includes(ann._id || ann.id));
        
        setUnreadCount(unread.length);
      } catch (error) {
        console.error('Error fetching unread count:', error);
        setUnreadCount(0);
      }
    };

    // Fetch immediately
    fetchUnreadCount();
    
    // Poll every 2 minutes for updates
    const interval = setInterval(fetchUnreadCount, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Function to mark announcements as read
  const markAsRead = (announcementIds) => {
    const seenIds = JSON.parse(localStorage.getItem('seenAnnouncements') || '[]');
    const updatedSeen = [...new Set([...seenIds, ...announcementIds])];
    localStorage.setItem('seenAnnouncements', JSON.stringify(updatedSeen));
    setUnreadCount(0);
  };

  const markAllAsRead = () => {
    // This will be called from the Announcements page
    const event = new CustomEvent('markAllAnnouncementsRead');
    window.dispatchEvent(event);
  };

  // Listen for mark as read events
  useEffect(() => {
    const handleMarkAsRead = () => {
      setUnreadCount(0);
    };

    window.addEventListener('markAllAnnouncementsRead', handleMarkAsRead);
    return () => window.removeEventListener('markAllAnnouncementsRead', handleMarkAsRead);
  }, []);

  return { unreadCount, markAsRead, markAllAsRead };
};
