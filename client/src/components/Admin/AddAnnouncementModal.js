import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AddAnnouncementModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    readTime: '2 min read',
    links: []
  });

  const [newLink, setNewLink] = useState({ text: '', url: '', type: 'secondary' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addLink = () => {
    if (newLink.text && newLink.url) {
      setFormData(prev => ({
        ...prev,
        links: [...prev.links, { ...newLink }]
      }));
      setNewLink({ text: '', url: '', type: 'secondary' });
      toast.success('Link added successfully');
    } else {
      toast.error('Please enter both link text and URL');
    }
  };

  const removeLink = (index) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
    toast.success('Link removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || loading) return;

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      
      // Reset form only after successful submission
      setFormData({
        title: '',
        content: '',
        type: 'info',
        readTime: '2 min read',
        links: []
      });
      
      toast.success('Announcement created successfully!');
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeConfig = (type) => {
    const configs = {
      urgent: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
      important: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
      info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }
    };
    return configs[type] || configs.info;
  };

  if (!isOpen) return null;

  const isLoading = loading || isSubmitting;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!isLoading ? onClose : undefined} />
      
      <div className="relative w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
            Add New Announcement
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 transition-all text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter announcement title..."
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['info', 'important', 'urgent'].map((type) => {
                const config = getTypeConfig(type);
                const Icon = config.icon;
                return (
                  <label
                    key={type}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.type === type
                        ? 'border-[#6366f1] bg-[#6366f1]/10'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-slate-800'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={formData.type === type}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="sr-only"
                    />
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">{type}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={4}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 transition-all resize-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter announcement content..."
            />
          </div>

          {/* Read Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Read Time
            </label>
            <input
              type="text"
              name="readTime"
              value={formData.readTime}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 transition-all text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g., 2 min read"
            />
          </div>

          {/* Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Links (Optional)
            </label>
            
            {/* Add Link Form */}
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={newLink.text}
                  onChange={(e) => setNewLink(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Link text"
                  disabled={isLoading}
                  className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                  disabled={isLoading}
                  className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={newLink.type}
                  onChange={(e) => setNewLink(prev => ({ ...prev, type: e.target.value }))}
                  disabled={isLoading}
                  className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none text-sm text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                </select>
                <button
                  type="button"
                  onClick={addLink}
                  disabled={isLoading || !newLink.text || !newLink.url}
                  className="flex items-center gap-2 px-4 py-2 bg-[#6366f1] text-white rounded-lg hover:bg-[#5855eb] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add Link
                </button>
              </div>
            </div>

            {/* Links List */}
            {formData.links.length > 0 && (
              <div className="space-y-2">
                {formData.links.map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
                    <div>
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{link.text}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        link.type === 'primary' 
                          ? 'bg-[#6366f1] text-white' 
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}>
                        {link.type}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{link.url}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      disabled={isLoading}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.title || !formData.content}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white rounded-xl hover:from-[#5855eb] hover:to-[#9333ea] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Announcement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddAnnouncementModal;
