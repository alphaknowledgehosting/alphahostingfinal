import React, { useState, useEffect, memo, Suspense, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { 
  Bell, 
  Calendar, 
  Clock, 
  ExternalLink, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Loader,
  Mail,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  useAnnouncements, 
  useAnnouncementMutations, 
  useAnnouncementUpdates,
  getDetailedTimeInfo 
} from '../../hooks/useAnnouncements';

// Import components
import Footer from '../Common/Footer';
import Header from '../Common/Header';
import AddAnnouncementModal from '../Admin/AddAnnouncementModal';
import LoginButton from '../Auth/LoginButton';

// Announcement type configurations
const getAnnouncementConfig = (type) => {
  const configs = {
    urgent: {
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50/80 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800/50',
      textColor: 'text-red-700 dark:text-red-300',
      badgeColor: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
      label: 'Urgent',
      pulse: 'animate-pulse'
    },
    important: {
      icon: AlertCircle,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50/80 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800/50',
      textColor: 'text-orange-700 dark:text-orange-300',
      badgeColor: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200',
      label: 'Important'
    },
    info: {
      icon: Info,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50/80 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800/50',
      textColor: 'text-blue-700 dark:text-blue-300',
      badgeColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200',
      label: 'Info'
    }
  };
  return configs[type] || configs.info;
};

// Login Required Guard Component
const LoginRequiredGuard = memo(() => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#030014] flex items-center justify-center">
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Login Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be logged in to view announcements and stay updated with the latest news from Alpha Knowledge.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
              <Bell className="w-4 h-4" />
              <span>Get notified about new courses, updates, and important news</span>
            </div>
          </div>
        </div>
        
        <LoginButton 
          variant="google" 
          onLoginSuccess={() => window.location.reload()}
        />
        
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          By logging in, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
});

// Edit Modal Component
const EditAnnouncementModal = memo(({ isOpen, onClose, onSubmit, announcement, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    readTime: '2 min read',
    links: []
  });

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        type: announcement.type || 'info',
        readTime: announcement.readTime || '2 min read',
        links: announcement.links || []
      });
    }
  }, [announcement]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    onSubmit(formData);
  };

  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, { text: '', url: '', type: 'secondary' }]
    }));
  };

  const updateLink = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const removeLink = (index) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Edit Announcement
              </h3>
              
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter announcement title"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter announcement content"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="info">Info</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent (Sends Emails)</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Read Time
              </label>
              <input
                type="text"
                value={formData.readTime}
                onChange={(e) => setFormData(prev => ({ ...prev, readTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 2 min read"
              />
            </div>

            {/* Links Section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Links (Optional)
                </label>
                <button
                  type="button"
                  onClick={addLink}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Link
                </button>
              </div>
              
              {formData.links.map((link, index) => (
                <div key={index} className="mb-2 p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={link.text}
                      onChange={(e) => updateLink(index, 'text', e.target.value)}
                      placeholder="Link text"
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="text-red-600 hover:text-red-800 text-sm px-2"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Update Announcement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

// Loading Components
const LoadingSkeleton = memo(() => (
  <div className="min-h-screen bg-white dark:bg-[#030014] relative">
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>
    
    <div className="relative z-10 pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 mt-4">
          <div className="inline-block mb-4">
            <div className="w-48 h-10 bg-gradient-to-r from-blue-200/50 to-purple-200/50 dark:from-blue-800/30 dark:to-purple-800/30 rounded-full animate-pulse"></div>
          </div>
          <div className="w-80 h-16 bg-gradient-to-r from-blue-200/50 to-purple-200/50 dark:from-blue-800/30 dark:to-purple-800/30 rounded-2xl mx-auto mb-4 animate-pulse"></div>
          <div className="w-96 h-6 bg-gray-200/50 dark:bg-gray-800/30 rounded-lg mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-xl p-4 border border-white/20 dark:border-white/10 animate-pulse">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-300/50 dark:bg-gray-600/30 rounded mx-auto mb-2"></div>
                <div className="w-16 h-4 bg-gray-300/50 dark:bg-gray-600/30 rounded mx-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#030014]">
      <div className="max-w-4xl mx-auto space-y-4">
        {[...Array(3)].map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </div>
    </div>
    <div className="fixed bottom-8 right-8 z-50">
      <div className="bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full p-4 shadow-lg border border-white/20 dark:border-white/10">
        <div className="flex items-center gap-3">
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Loading announcements...</span>
        </div>
      </div>
    </div>
  </div>
));

const LoadingCard = memo(() => (
  <div className="bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-white/10 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-300/50 dark:bg-gray-600/30"></div>
        <div className="w-16 h-6 bg-gray-300/50 dark:bg-gray-600/30 rounded-full"></div>
      </div>
      <div className="text-right space-y-2">
        <div className="w-32 h-4 bg-gray-300/50 dark:bg-gray-600/30 rounded"></div>
        <div className="w-20 h-3 bg-gray-300/50 dark:bg-gray-600/30 rounded"></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="w-3/4 h-6 bg-gray-300/50 dark:bg-gray-600/30 rounded"></div>
      <div className="w-full h-4 bg-gray-300/50 dark:bg-gray-600/30 rounded"></div>
      <div className="w-5/6 h-4 bg-gray-300/50 dark:bg-gray-600/30 rounded"></div>
      <div className="flex gap-3 mt-4">
        <div className="w-20 h-8 bg-gray-300/50 dark:bg-gray-600/30 rounded"></div>
        <div className="w-24 h-8 bg-gray-300/50 dark:bg-gray-600/30 rounded"></div>
      </div>
    </div>
  </div>
));

// Enhanced Announcement Card Component - FIXED: Proper parameter declaration
const AnnouncementCard = memo(({ announcement, index, canManageAnnouncements, onEdit, onDelete }) => {
  const config = getAnnouncementConfig(announcement.type);
  const Icon = config.icon;
  const [isNew, setIsNew] = useState(false);
  
  // Get detailed time information
  const timeInfo = getDetailedTimeInfo(announcement.createdAt || announcement.date);

  useEffect(() => {
    const createdTime = new Date(announcement.createdAt || announcement.date);
    const now = new Date();
    const hoursDiff = (now - createdTime) / (1000 * 60 * 60);
    setIsNew(hoursDiff < 1); // NEW tag shows for 1 hour
  }, [announcement]);

  // Handle optimistic update styling
  const isOptimistic = announcement.isOptimistic;

  return (
    <div 
      className={`relative group ${config.bgColor} backdrop-blur-xl rounded-2xl p-6 border ${config.borderColor} transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden ${
        isNew ? 'ring-2 ring-blue-400/50 dark:ring-blue-600/50' : ''
      } ${isOptimistic ? 'opacity-75 border-dashed' : ''}`}
      data-aos="fade-up" 
      data-aos-delay={Math.min(index * 50, 300)}
    >
      {/* Optimistic update indicator */}
      {isOptimistic && (
        <div className="absolute top-2 left-2 z-20">
          <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Loader className="w-3 h-3 animate-spin" />
            SAVING
          </div>
        </div>
      )}

      {isNew && !isOptimistic && (
        <div className="absolute top-2 left-2 z-20">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            NEW
          </div>
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}></div>
      
      {canManageAnnouncements && (
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <button
            onClick={() => onEdit(announcement)}
            className="p-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 dark:border-white/10 text-blue-600 hover:text-blue-700 transition-colors"
            title="Edit announcement"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(announcement.id || announcement._id)}
            className="p-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 dark:border-white/10 text-red-600 hover:text-red-700 transition-colors"
            title="Delete announcement"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${config.badgeColor} flex items-center justify-center ${config.pulse || ''}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className={`text-xs font-medium ${config.badgeColor} px-2 py-1 rounded-full w-fit`}>
              {config.label}
            </span>
          </div>
        </div>
        
        {/* Enhanced Time Display - Exact time like in email */}
        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
          <div 
            className="flex items-center gap-1 mb-1 cursor-help"
            title={`Posted: ${timeInfo.exact}`}
          >
            <Clock className="w-3 h-3" />
            <span className={`font-medium ${timeInfo.isRecent ? 'text-green-600 dark:text-green-400' : ''}`}>
              {timeInfo.exact}
            </span>
          </div>
          {/* Show relative time below exact time */}
          <div className="text-xs opacity-75 mt-1">
            {timeInfo.relative}
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#6366f1] group-hover:to-[#a855f7] transition-all duration-300">
          {announcement.title}
        </h3>
        
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-sm md:text-base">
          {announcement.content}
        </p>

        {announcement.links && announcement.links.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {announcement.links.map((link, linkIndex) => (
              <a
                key={linkIndex}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  link.type === 'primary'
                    ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white hover:from-[#5855eb] hover:to-[#9333ea] shadow-lg hover:shadow-xl'
                    : 'bg-white/50 dark:bg-white/10 text-gray-900 dark:text-white border border-white/20 hover:bg-white/80 dark:hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                <span>{link.text}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        )}

        {/* Enhanced Footer - Only author and date, no read time */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] flex items-center justify-center">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <span>By {announcement.author}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(announcement.createdAt || announcement.date).toLocaleDateString('en-US', {
                timeZone: 'Asia/Kolkata',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

// FIXED: Main Component - Moved all hooks to top level
const Announcements = () => {
  const location = useLocation();
  const { user, loading, canManageAnnouncements, markAllAsRead } = useAuth();
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // NEW: Refs and state for auto-scroll
  const announcementsContainerRef = useRef(null);
  const [previousAnnouncementCount, setPreviousAnnouncementCount] = useState(0);

  // FIXED: Always call hooks at top level
  const { 
    data: announcements = [], 
    isLoading, 
    error, 
    refetch,
    isRefetching,
    isFetching
  } = useAnnouncements();

  const { 
    addAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement 
  } = useAnnouncementMutations();

  useAnnouncementUpdates();

  // Event handlers - FIXED: Properly defined functions
  const handleAddAnnouncement = async (announcementData) => {
    try {
      await addAnnouncement.mutateAsync(announcementData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowEditModal(true);
  };

  const handleUpdateAnnouncement = async (updateData) => {
    try {
      await updateAnnouncement.mutateAsync({
        announcementId: editingAnnouncement.id || editingAnnouncement._id,
        data: updateData
      });
      setShowEditModal(false);
      setEditingAnnouncement(null);
    } catch (error) {
      console.error('Error updating announcement:', error);
    }
  };

  // FIXED: Properly defined delete handler
  const handleDeleteAnnouncement = async (announcementId) => {
    // console.log('🗑️ Component: Delete handler called with ID:', announcementId);
    
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      // Make sure we're passing the right ID - try custom id first, then _id
      const idToUse = announcementId;
      // console.log('🗑️ Component: Using ID for deletion:', idToUse);
      
      await deleteAnnouncement.mutateAsync(idToUse);
    } catch (error) {
      console.error('Component: Error deleting announcement:', error);
    }
  };

  const handleRefresh = () => {
    // console.log('🔄 Manual refresh triggered');
    refetch();
  };

  // FIXED: All useEffect hooks moved to top level
  useEffect(() => {
    // console.log('📄 Announcements page loaded - forcing immediate refresh');
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (location.pathname === '/announcements') {
      // console.log('🔄 Route changed to announcements - refreshing data');
      refetch();
    }
  }, [location.pathname, refetch]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, markAllAsRead]);

  useEffect(() => {
    if (!isLoading && announcements.length > 0) {
      if (announcements.length > previousAnnouncementCount && previousAnnouncementCount > 0) {
        if (announcementsContainerRef.current) {
          announcementsContainerRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          
          setTimeout(() => {
            const firstCard = announcementsContainerRef.current?.querySelector('[data-aos="fade-up"]');
            if (firstCard) {
              firstCard.style.transform = 'scale(1.02)';
              firstCard.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.3)';
              setTimeout(() => {
                firstCard.style.transform = '';
                firstCard.style.boxShadow = '';
              }, 2000);
            }
          }, 100);
        }
      }
      setPreviousAnnouncementCount(announcements.length);
    }
  }, [announcements, isLoading, previousAnnouncementCount]);

  useEffect(() => {
    if (!isLoading) {
      AOS.init({
        once: false,
        offset: 10,
        duration: 600,
      });
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && announcements.length > 0) {
      const timer = setTimeout(() => {
        const seenIds = JSON.parse(localStorage.getItem('seenAnnouncements') || '[]');
        const allIds = announcements.map(ann => ann._id || ann.id);
        const updatedSeen = [...new Set([...seenIds, ...allIds])];
        localStorage.setItem('seenAnnouncements', JSON.stringify(updatedSeen));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [announcements, isLoading]);

  // Computed values
  const filteredAnnouncements = announcements.filter(announcement => 
    filter === 'all' || announcement.type === filter
  );

  const stats = {
    total: announcements.length,
    urgent: announcements.filter(a => a.type === 'urgent').length,
    important: announcements.filter(a => a.type === 'important').length,
    info: announcements.filter(a => a.type === 'info').length
  };

  // Early returns after all hooks
  if (!user && !loading) {
    return (
      <>
        <Header />
        <LoginRequiredGuard />
        <Footer />
      </>
    );
  }

  if (isLoading || loading) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
        <LoadingSkeleton />
        <Footer />
      </Suspense>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-white dark:bg-[#030014]">
        
        {/* Real-time Update Indicator */}
        {(isRefetching || isFetching) && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/20 dark:border-white/10 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Updating...</span>
            </div>
          </div>
        )}

        <div className={`relative z-10 transition-all duration-500 ${!isLoading ? "opacity-100" : "opacity-0"}`}>
          
          <section className="relative pt-20 pb-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#030014]">
            <div className="max-w-7xl mx-auto">
              
              <div className="text-center mb-8 mt-4">
                <div className="inline-block animate-float mb-4" data-aos="zoom-in">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full blur opacity-30"></div>
                    <div className="relative px-6 py-3 rounded-full bg-blue-50/90 dark:bg-black/40 backdrop-blur-xl border border-blue-200 dark:border-white/10">
                      <span className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-transparent bg-clip-text text-sm font-medium flex items-center">
                        <Bell className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                        Latest Updates & News
                        <Mail className="w-4 h-4 ml-2 text-purple-500 dark:text-purple-400" />
                      </span>
                    </div>
                  </div>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight" data-aos="fade-up" data-aos-delay="100">
                  <span className="relative inline-block">
                    <span className="absolute -inset-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] blur-2xl opacity-20"></span>
                    <span className="relative bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
                      Announcements
                    </span>
                  </span>
                </h1>

                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="200">
                  Stay updated with the latest news, features, and important information from Alpha Knowledge
                </p>
              </div>

              {!error && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-aos="fade-up" data-aos-delay="300">
                  <div className="bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/20 dark:border-white/10">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                    </div>
                  </div>
                  <div className="bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/20 dark:border-white/10">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                        {stats.urgent}
                        {stats.urgent > 0 && <Mail className="w-4 h-4" />}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Urgent</div>
                    </div>
                  </div>
                  <div className="bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/20 dark:border-white/10">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.important}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Important</div>
                    </div>
                  </div>
                  <div className="bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/20 dark:border-white/10">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.info}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Info</div>
                    </div>
                  </div>
                </div>
              )}

              {!error && (
                <div className="flex flex-wrap justify-center items-center gap-3 mb-6" data-aos="fade-up" data-aos-delay="400">
                  {['all', 'urgent', 'important', 'info'].map((filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setFilter(filterType)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        filter === filterType
                          ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white shadow-lg'
                          : 'bg-white/10 dark:bg-black/20 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/30 border border-white/20'
                      }`}
                    >
                      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                      {filterType !== 'all' && (
                        <span className="ml-2 text-xs opacity-75">
                          ({stats[filterType]})
                        </span>
                      )}
                    </button>
                  ))}
                  
                  <button
                    onClick={handleRefresh}
                    disabled={isRefetching}
                    className="p-2 bg-white/10 dark:bg-black/20 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/30 border border-white/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                    title="Refresh announcements"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}

              {canManageAnnouncements && (
                <div className="flex justify-center mb-6" data-aos="fade-up" data-aos-delay="500">
                  <button
                    onClick={() => setShowAddModal(true)}
                    disabled={addAnnouncement.isLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white rounded-xl hover:from-[#5855eb] hover:to-[#9333ea] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  >
                    {addAnnouncement.isLoading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    Add Announcement
                    <Mail className="w-4 h-4 opacity-75" />
                  </button>
                </div>
              )}
            </div>
          </section>

          <section ref={announcementsContainerRef} className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#030014]">
            <div className="max-w-4xl mx-auto">
              
              {error && (
                <div className="text-center py-16" data-aos="fade-up">
                  <AlertTriangle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Failed to load announcements
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {error.message || 'An error occurred while loading announcements'}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleRefresh}
                      disabled={isRefetching}
                      className="px-4 py-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white rounded-lg hover:from-[#5855eb] hover:to-[#9333ea] transition-all duration-200 disabled:opacity-50"
                    >
                      {isRefetching ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                          Retrying...
                        </>
                      ) : (
                        'Retry'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {!error && (
                <>
                  {filteredAnnouncements.length > 0 ? (
                    <div className="space-y-4">
                      {/* FIXED: Proper parameter declaration in map function */}
                      {filteredAnnouncements.map((announcement, index) => (
                        <AnnouncementCard 
                          key={announcement._id || announcement.id || `temp-${index}`} 
                          announcement={announcement} 
                          index={index}
                          canManageAnnouncements={canManageAnnouncements}
                          onEdit={handleEditAnnouncement}
                          onDelete={handleDeleteAnnouncement}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16" data-aos="fade-up">
                      <Bell className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No announcements found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {announcements.length === 0 
                          ? "No announcements available at this time."
                          : "No announcements match your current filter."
                        }
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        {/* Modals */}
        <AddAnnouncementModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddAnnouncement}
          loading={addAnnouncement.isLoading}
        />

        <EditAnnouncementModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingAnnouncement(null);
          }}
          onSubmit={handleUpdateAnnouncement}
          announcement={editingAnnouncement}
          loading={updateAnnouncement.isLoading}
        />

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>
      </div>
      <Footer />
    </div>
  );
};

export default Announcements;
