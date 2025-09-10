import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { sheetAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FaSave, 
  FaTimes, 
  FaSpinner
} from 'react-icons/fa';

const InlineProblemEditor = ({ 
  problem, 
  sheetId, 
  sectionId, 
  subsectionId, 
  onUpdate, 
  onCancel 
}) => {
  const { canManageSheets, canAddEditorials } = useAuth();
  const [formData, setFormData] = useState(problem || {});
  const [saving, setSaving] = useState(false);
  const titleInputRef = useRef(null);

  const canEditAll = canManageSheets;
  const canEditEditorial = canAddEditorials;

  // Auto-focus on title input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast.error('Problem title is required.');
      titleInputRef.current?.focus();
      return;
    }

    const loadingToast = toast.loading('Updating problem...');
    
    try {
      setSaving(true);
      await sheetAPI.updateProblem(sheetId, sectionId, subsectionId, problem.id, formData);
      
      toast.success('Problem updated successfully! ✅', { id: loadingToast });
      onUpdate();
    } catch (error) {
      console.error('Error updating problem:', error);
      toast.error(`Failed to update problem: ${error.response?.data?.message || error.message}`, {
        id: loadingToast
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(problem);
    onCancel();
  };

  const handleKeyDown = (e, fieldName) => {
    if (e.key === 'Enter' && fieldName === 'title') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-900/30 dark:to-purple-900/30 backdrop-blur-sm border-l-4 border-indigo-500">
      
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Edit Problem</h4>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={saving || !formData.title?.trim()}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center space-x-1"
              title="Save Changes"
            >
              {saving ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaSave className="w-3 h-3" />}
              <span>Save</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center space-x-1"
              title="Cancel"
            >
              <FaTimes className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Title - Always editable by admin */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Problem Title *
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              onKeyDown={(e) => handleKeyDown(e, 'title')}
              className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter problem title"
              disabled={!canEditAll || saving}
              required
            />
          </div>

          {/* Platform and Difficulty - Admin only */}
          {canEditAll && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform
                </label>
                <input
                  type="text"
                  value={formData.platform || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., LeetCode"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty || 'Easy'}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
          )}

          {/* Practice Link - Admin only */}
          {canEditAll && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Practice Link
              </label>
              <input
                type="url"
                value={formData.practiceLink || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, practiceLink: e.target.value }))}
                className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="https://leetcode.com/problems/..."
                disabled={saving}
              />
            </div>
          )}

          {/* YouTube Link - Admin only */}
          {canEditAll && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                YouTube Link
              </label>
              <input
                type="url"
                value={formData.youtubeLink || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, youtubeLink: e.target.value }))}
                className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="https://youtube.com/watch?v=..."
                disabled={saving}
              />
            </div>
          )}

          {/* Editorial Link - Admin and Mentor */}
          {canEditEditorial && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Editorial Link
              </label>
              <input
                type="url"
                value={formData.editorialLink || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, editorialLink: e.target.value }))}
                className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="GitHub markdown link"
                disabled={saving}
              />
            </div>
          )}

          {/* Notes Link - Admin and Mentor */}
          {(canEditAll || canEditEditorial) && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes Link
              </label>
              <input
                type="url"
                value={formData.notesLink || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notesLink: e.target.value }))}
                className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Link to notes or documentation"
                disabled={saving}
              />
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table Row Layout */}
      <div className="hidden md:block">
        <div className="grid grid-cols-12 gap-4 items-start">
          
          {/* Title Column */}
          <div className="col-span-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Problem Title *
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              onKeyDown={(e) => handleKeyDown(e, 'title')}
              className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter problem title"
              disabled={!canEditAll || saving}
              required
            />
            {/* Platform below title */}
            {canEditAll && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform
                </label>
                <input
                  type="text"
                  value={formData.platform || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., LeetCode"
                  disabled={saving}
                />
              </div>
            )}
          </div>

          {/* Links Section */}
          <div className="col-span-6 grid grid-cols-2 gap-3">
            {/* Practice Link - Admin only */}
            {canEditAll && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Practice Link
                </label>
                <input
                  type="url"
                  value={formData.practiceLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, practiceLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Practice URL"
                  disabled={saving}
                />
              </div>
            )}

            {/* YouTube Link - Admin only */}
            {canEditAll && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  YouTube Link
                </label>
                <input
                  type="url"
                  value={formData.youtubeLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="YouTube URL"
                  disabled={saving}
                />
              </div>
            )}

            {/* Editorial Link - Admin and Mentor */}
            {canEditEditorial && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Editorial Link
                </label>
                <input
                  type="url"
                  value={formData.editorialLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, editorialLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Editorial URL"
                  disabled={saving}
                />
              </div>
            )}

            {/* Notes Link - Admin and Mentor */}
            {(canEditAll || canEditEditorial) && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes Link
                </label>
                <input
                  type="url"
                  value={formData.notesLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notesLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Notes URL"
                  disabled={saving}
                />
              </div>
            )}
          </div>

          {/* Difficulty and Actions */}
          <div className="col-span-3">
            {canEditAll && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty || 'Easy'}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={saving || !formData.title?.trim()}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center space-x-1"
                title="Save Changes"
              >
                {saving ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaSave className="w-3 h-3" />}
                <span>Save</span>
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center space-x-1"
                title="Cancel"
              >
                <FaTimes className="w-3 h-3" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-2">
          {canManageSheets ? (
            <p>💡 As an admin, you can edit all fields. Press Enter on title to save, Escape to cancel.</p>
          ) : (
            <p>💡 As a mentor, you can edit editorial and notes fields only. Press Enter on title to save, Escape to cancel.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InlineProblemEditor;
