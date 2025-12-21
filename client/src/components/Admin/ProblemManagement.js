import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import { sheetAPI, problemAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSave, 
  FaTimes,
  FaExternalLinkAlt,
  FaYoutube,
  FaSpinner,
  FaUnlink
} from 'react-icons/fa';
import { BookOpen, FileText, Search } from 'lucide-react';
import YouTubeModal from '../Common/YouTubeModal';


// ============= INLINE FIELD EDITOR COMPONENT =============
const InlineFieldEditor = ({ value, onSave, placeholder, type = 'text', disabled }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (tempValue !== value) {
      setSaving(true);
      try {
        await onSave(tempValue);
        setIsEditing(false);
        toast.success('Field updated!');
      } catch (error) {
        toast.error('Failed to update');
      } finally {
        setSaving(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setTempValue(value || '');
      setIsEditing(false);
    }
  };

  if (disabled) {
    return <span className="text-gray-900 dark:text-white text-sm">{value || placeholder}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          type={type}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="flex-1 px-2 py-1 border border-indigo-400 dark:border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50"
          disabled={saving}
        />
      </div>
    );
  }

  return (
    <div 
      className="group cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded px-2 py-1 transition-colors"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          {value || <span className="text-gray-400 italic text-xs">{placeholder}</span>}
        </span>
        <FaEdit className="w-3 h-3 text-gray-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
      </div>
    </div>
  );
};


// ============= PROBLEM SELECTOR COMPONENT WITH PORTAL =============
const ProblemSelector = ({ onSelect, selectedProblemIds = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchProblems();
        setShowDropdown(true);
      } else {
        setProblems([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Update dropdown position on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showDropdown && dropdownRef.current) {
        updateDropdownPosition();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [showDropdown]);

  const searchProblems = async () => {
    try {
      setLoading(true);
      const response = await problemAPI.search(searchTerm, 20);
      setProblems(response.data.problems || []);
    } catch (error) {
      console.error('Error searching problems:', error);
      toast.error('Failed to search problems');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (problem) => {
    if (selectedProblemIds.includes(problem.id)) {
      toast.info('Problem already added to this subsection');
      return;
    }
    onSelect(problem);
    setSearchTerm('');
    setProblems([]);
    setShowDropdown(false);
  };

  const updateDropdownPosition = () => {
    if (!searchInputRef.current || !dropdownRef.current) return;
    
    const rect = searchInputRef.current.getBoundingClientRect();
    dropdownRef.current.style.top = `${rect.bottom + 8}px`;
    dropdownRef.current.style.left = `${rect.left}px`;
    dropdownRef.current.style.width = `${rect.width}px`;
  };

  // Dropdown portal component
  const DropdownPortal = () => {
    useEffect(() => {
      if (showDropdown) {
        updateDropdownPosition();
      }
    }, [showDropdown]);

    if (!showDropdown || searchTerm.length < 2) return null;

    return createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          zIndex: 999999,
          maxHeight: '400px'
        }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-indigo-200 dark:border-indigo-600 overflow-y-auto"
      >
        {loading ? (
          <div className="p-4 text-center text-gray-500">Searching...</div>
        ) : problems.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No problems found. Try different keywords.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {problems.map((problem) => {
              const isSelected = selectedProblemIds.includes(problem.id);
              return (
                <li
                  key={problem.id}
                  onClick={() => !isSelected && handleSelect(problem)}
                  className={`p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors ${
                    isSelected ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {problem.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {problem.platform && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {problem.platform}
                          </span>
                        )}
                        {problem.difficulty && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              problem.difficulty === 'Easy'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : problem.difficulty === 'Medium'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {problem.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div className="relative mb-4">
      <div ref={searchInputRef} className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
          placeholder="Search existing problems by title or platform..."
          className="w-full pl-10 pr-4 py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
        />
      </div>

      <DropdownPortal />
    </div>
  );
};


// ============= INLINE PROBLEM FORM COMPONENT (unchanged) =============
const ProblemForm = ({ problem, onSubmit, onCancel, isEditing = false, canManageSheets, canAddEditorials }) => {
  const [formData, setFormData] = useState(problem);
  const [submitting, setSubmitting] = useState(false);
  const titleInputRef = useRef(null);

  const canEditAll = canManageSheets;
  const canEditEditorial = canAddEditorials;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    
    if (!formData.title?.trim()) {
      toast.error('Problem title is required.');
      titleInputRef.current?.focus();
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 md:p-6 border-2 border-dashed border-indigo-300 dark:border-indigo-600 mb-4">
      <form onSubmit={handleFormSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Problem Title *
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              required
              disabled={!canEditAll || submitting}
              placeholder="Enter problem title"
              autoComplete="off"
            />
          </div>

          {canEditAll && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform
                </label>
                <input
                  type="text"
                  value={formData.platform || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  placeholder="e.g., LeetCode, GeeksforGeeks"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Practice Link
                </label>
                <input
                  type="url"
                  value={formData.practiceLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, practiceLink: e.target.value }))}
                  className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  placeholder="https://leetcode.com/problems/..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  YouTube Link
                </label>
                <input
                  type="url"
                  value={formData.youtubeLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeLink: e.target.value }))}
                  className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty || 'Easy'}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  disabled={submitting}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </>
          )}

          {canEditEditorial && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Editorial Link
                </label>
                <input
                  type="url"
                  value={formData.editorialLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, editorialLink: e.target.value }))}
                  className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  placeholder="GitHub markdown link"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes Link
                </label>
                <input
                  type="url"
                  value={formData.notesLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notesLink: e.target.value }))}
                  className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  placeholder="Link to notes or documentation"
                  disabled={submitting}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4 md:mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-sm md:text-base"
          >
            <FaTimes className="w-3 h-3 md:w-4 md:h-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.title?.trim()}
            className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-sm md:text-base shadow-lg"
          >
            {submitting ? (
              <>
                <FaSpinner className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                <FaSave className="w-3 h-3 md:w-4 md:h-4" />
                {isEditing ? 'Update' : 'Add'} Problem
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};


// ============= MAIN PROBLEM MANAGEMENT COMPONENT (rest unchanged) =============
const ProblemManagement = ({ 
  sheet, 
  sectionId, 
  subsectionId, 
  onRefresh 
}) => {
  const { user, canManageSheets, canAddEditorials } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlinkingId, setUnlinkingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showVideo, setShowVideo] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState(null);

  useEffect(() => {
    loadProblems();
  }, [sheet, sectionId, subsectionId]);

  const loadProblems = async () => {
    const section = sheet.sections.find(s => s.id === sectionId);
    const subsection = section?.subsections.find(s => s.id === subsectionId);
    const problemIds = subsection?.problemIds || [];

    if (problemIds.length === 0) {
      setProblems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await problemAPI.getBatch(problemIds);
      setProblems(response.data.problems || []);
    } catch (error) {
      console.error('Error loading problems:', error);
      toast.error('Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkExistingProblem = async (problem) => {
    try {
      await sheetAPI.linkProblem(sheet.id, sectionId, subsectionId, problem.id);
      toast.success(`Problem "${problem.title}" added to subsection!`);
      onRefresh();
    } catch (error) {
      console.error('Error linking problem:', error);
      toast.error('Failed to link problem');
    }
  };

  const handleCreateAndLinkProblem = async (problemData) => {
    if (!problemData.title?.trim()) {
      toast.error('Problem title is required.');
      return;
    }

    const loadingToast = toast.loading('Creating problem...');

    try {
      const createResponse = await problemAPI.create(problemData);
      const newProblem = createResponse.data.problem;

      await sheetAPI.linkProblem(sheet.id, sectionId, subsectionId, newProblem.id);
      
      setShowCreateForm(false);
      toast.success(`New problem "${newProblem.title}" created and added! 🎉`, { id: loadingToast });
      onRefresh();
    } catch (error) {
      console.error('Error creating and linking problem:', error);
      toast.error(`Failed to create problem: ${error.response?.data?.message || error.message}`, { id: loadingToast });
    }
  };

  const handleUpdateProblem = async (problemId, updateData) => {
    const loadingToast = toast.loading('Updating problem...');

    try {
      await problemAPI.update(problemId, updateData);
      setEditingProblemId(null);
      toast.success('Problem updated successfully! ✅', { id: loadingToast });
      onRefresh();
    } catch (error) {
      console.error('Error updating problem:', error);
      toast.error(`Failed to update problem: ${error.response?.data?.message || error.message}`, { id: loadingToast });
    }
  };

  const handleUpdateField = async (problemId, field, value) => {
    try {
      await problemAPI.update(problemId, { [field]: value });
      onRefresh();
    } catch (error) {
      console.error('Error updating field:', error);
      throw error;
    }
  };

  const handleUnlinkProblem = async (problemId, problemTitle) => {
    if (!window.confirm(
      `Remove "${problemTitle}" from this subsection?\n\n` +
      `The problem will still exist globally and in other subsections where it's used.`
    )) {
      return;
    }

    try {
      setUnlinkingId(problemId);
      await sheetAPI.unlinkProblem(sheet.id, sectionId, subsectionId, problemId);
      toast.success('Problem removed from subsection');
      onRefresh();
    } catch (error) {
      console.error('Error unlinking problem:', error);
      toast.error('Failed to remove problem');
    } finally {
      setUnlinkingId(null);
    }
  };

  const handleDeleteProblem = async (problemId, problemTitle) => {
    if (!window.confirm(
      `⚠️ DANGER: Delete "${problemTitle}" GLOBALLY?\n\n` +
      `This will:\n` +
      `• Remove it from ALL sheets\n` +
      `• Delete ALL user progress for ALL users\n` +
      `• Delete the problem permanently\n\n` +
      `This action CANNOT be undone!`
    )) {
      return;
    }

    const loadingToast = toast.loading('Deleting problem globally...');

    try {
      setDeletingId(problemId);
      await problemAPI.delete(problemId);
      toast.success('Problem deleted globally! 🗑️', { id: loadingToast });
      onRefresh();
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast.error(`Failed to delete: ${error.response?.data?.message || error.message}`, { id: loadingToast });
      setDeletingId(null);
    }
  };

  const isEmpty = (value) => {
    return !value || value === '' || value === null || value === undefined;
  };

  const handleLinkClick = (link, type, problem) => {
    if (isEmpty(link)) return;

    switch (type) {
      case 'editorial':
        const editorialPath = `/editorial/${problem.id}`;
        window.open(editorialPath, '_blank', 'noopener,noreferrer');
        break;
      case 'youtube':
        setShowVideo({ url: link, title: problem.title || 'Untitled Problem' });
        break;
      case 'practice':
      case 'notes':
      default:
        window.open(link, '_blank', 'noopener,noreferrer');
        break;
    }
  };

  const selectedProblemIds = problems.map(p => p.id);
  const isDisabled = unlinkingId !== null || deletingId !== null;

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        {/* Problem Selector (Search + Create) */}
        {canManageSheets && (
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-indigo-200/50 dark:border-indigo-500/30 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Problems</h3>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2 text-sm shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <FaPlus className="w-4 h-4" />
                Create New Problem
              </button>
            </div>

            <ProblemSelector
              onSelect={handleLinkExistingProblem}
              selectedProblemIds={selectedProblemIds}
            />

            {showCreateForm && (
              <ProblemForm
                problem={{
                  title: '',
                  practiceLink: '',
                  platform: '',
                  youtubeLink: '',
                  editorialLink: '',
                  notesLink: '',
                  difficulty: 'Easy'
                }}
                onSubmit={handleCreateAndLinkProblem}
                onCancel={() => setShowCreateForm(false)}
                canManageSheets={canManageSheets}
                canAddEditorials={canAddEditorials}
              />
            )}
          </div>
        )}

        {/* Problems Table */}
        {loading ? (
          <div className="text-center py-8">
            <FaSpinner className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Loading problems...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-8 md:py-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-500/30">
            <p className="text-lg mb-2 text-gray-500 dark:text-gray-400">No problems added yet</p>
            {canManageSheets && (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Search for existing problems or create new ones above.
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-indigo-200/50 dark:border-indigo-500/30 shadow-xl overflow-hidden">
            <div className="p-4 md:p-6 border-b border-indigo-200/50 dark:border-indigo-500/30 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Problems ({problems.length}) - Click any field to edit
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {canManageSheets ? 'As admin, you can edit all fields' : 'As mentor, you can edit editorial and notes only'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-indigo-200/50 dark:divide-indigo-500/30">
                <thead className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-800/30 dark:to-purple-800/30">
                  <tr>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Title / Platform
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Links
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 dark:bg-slate-800/50 divide-y divide-indigo-200/30 dark:divide-indigo-500/20">
                  {problems.map((problem, index) => (
                    <tr key={problem.id} className={`${
                      index % 2 === 0 
                        ? 'bg-white/80 dark:bg-slate-800/80' 
                        : 'bg-indigo-50/80 dark:bg-indigo-900/20'
                    } hover:bg-indigo-100/80 dark:hover:bg-indigo-800/30 transition-colors ${
                      isDisabled ? 'opacity-70' : ''
                    }`}>
                      <td className="px-4 md:px-6 py-4">
                        <InlineFieldEditor
                          value={problem.title}
                          onSave={(value) => handleUpdateField(problem.id, 'title', value)}
                          placeholder="Problem title"
                          disabled={!canManageSheets || isDisabled}
                        />
                        <div className="mt-1">
                          <InlineFieldEditor
                            value={problem.platform}
                            onSave={(value) => handleUpdateField(problem.id, 'platform', value)}
                            placeholder="Platform"
                            disabled={!canManageSheets || isDisabled}
                          />
                        </div>
                      </td>
                      
                      <td className="px-4 md:px-6 py-4 text-center">
                        {canManageSheets && !isDisabled ? (
                          <select
                            value={problem.difficulty || 'Easy'}
                            onChange={(e) => handleUpdateField(problem.id, 'difficulty', e.target.value)}
                            className={`px-3 py-1 text-xs font-bold rounded-full border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                              problem.difficulty === 'Easy' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400'
                                : problem.difficulty === 'Medium'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'
                            }`}
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        ) : problem.difficulty ? (
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                            problem.difficulty === 'Easy' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400'
                              : problem.difficulty === 'Medium'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'
                          }`}>
                            {problem.difficulty}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>

                      <td className="px-4 md:px-6 py-4">
                        <div className="flex justify-center space-x-3">
                          {!isEmpty(problem.practiceLink) && (
                            <button
                              onClick={() => handleLinkClick(problem.practiceLink, 'practice', problem)}
                              disabled={isDisabled}
                              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Practice Link"
                            >
                              <FaExternalLinkAlt className="w-4 h-4" />
                            </button>
                          )}
                          {!isEmpty(problem.youtubeLink) && (
                            <button
                              onClick={() => handleLinkClick(problem.youtubeLink, 'youtube', problem)}
                              disabled={isDisabled}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="YouTube Video"
                            >
                              <FaYoutube className="w-4 h-4" />
                            </button>
                          )}
                          {!isEmpty(problem.editorialLink) && (
                            <button
                              onClick={() => handleLinkClick(problem.editorialLink, 'editorial', problem)}
                              disabled={isDisabled}
                              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Editorial"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                          )}
                          {!isEmpty(problem.notesLink) && (
                            <button
                              onClick={() => handleLinkClick(problem.notesLink, 'notes', problem)}
                              disabled={isDisabled}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Notes"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-4 md:px-6 py-4">
                        <div className="flex justify-center space-x-2">
                          {(canManageSheets || canAddEditorials) && (
                            <button
                              onClick={() => setEditingProblemId(problem.id)}
                              disabled={isDisabled || editingProblemId !== null}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
                              title="Edit All Fields"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                          )}
                          
                          {canManageSheets && (
                            <button
                              onClick={() => handleUnlinkProblem(problem.id, problem.title)}
                              disabled={isDisabled}
                              className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
                              title="Remove from subsection (keeps global problem)"
                            >
                              {unlinkingId === problem.id ? (
                                <FaSpinner className="w-4 h-4 animate-spin" />
                              ) : (
                                <FaUnlink className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {canManageSheets && (
                            <button
                              onClick={() => handleDeleteProblem(problem.id, problem.title)}
                              disabled={isDisabled}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
                              title="Delete globally (removes from ALL sheets + ALL user progress)"
                            >
                              {deletingId === problem.id ? (
                                <FaSpinner className="w-4 h-4 animate-spin" />
                              ) : (
                                <FaTrash className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Full Edit Form Modal */}
        {editingProblemId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditingProblemId(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Problem</h3>
                <ProblemForm
                  problem={problems.find(p => p.id === editingProblemId)}
                  onSubmit={(data) => handleUpdateProblem(editingProblemId, data)}
                  onCancel={() => setEditingProblemId(null)}
                  isEditing={true}
                  canManageSheets={canManageSheets}
                  canAddEditorials={canAddEditorials}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* YouTube Modal */}
      {showVideo && (
        <YouTubeModal
          videoUrl={showVideo.url}
          isOpen={!!showVideo}
          onClose={() => setShowVideo(null)}
          problemName={showVideo.title}
        />
      )}
    </>
  );
};

export default ProblemManagement;
