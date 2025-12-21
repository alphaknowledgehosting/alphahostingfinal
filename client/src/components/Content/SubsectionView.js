import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import { useProgress } from '../../context/ProgressContext';
import { sheetAPI, problemAPI } from '../../services/api';
import ProblemItem from './ProblemItem';
import toast from 'react-hot-toast';
import { 
  FaChevronRight, 
  FaChevronDown,
  FaCheckCircle, 
  FaTrophy, 
  FaClock,
  FaListAlt,
  FaCode,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaSpinner,
  FaGraduationCap,
  FaSearch
} from 'react-icons/fa';
import { Search } from 'lucide-react';

// ============= INLINE EDITABLE TEXT COMPONENT =============
const InlineEditableText = ({ 
  value, 
  onSave, 
  placeholder = "Click to edit", 
  multiline = false, 
  isEditable = true,
  className = "",
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTempValue(value || '');
  }, [value]);

  const startEdit = (e) => {
    if (e) {
      e.stopPropagation();
    }
    if (isEditable && !disabled) {
      setTempValue(value || '');
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (tempValue !== value) {
      setSaving(true);
      try {
        await onSave(tempValue);
        setIsEditing(false);
        toast.success('Subsection updated successfully!');
      } catch (error) {
        console.error('Save failed:', error);
        toast.error(`Failed to save changes: ${error.response?.data?.message || error.message}`);
      } finally {
        setSaving(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!isEditable || disabled) {
    return <span className="text-gray-900 dark:text-white">{value || placeholder}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2" onClick={e => e.stopPropagation()}>
        {multiline ? (
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm resize-none min-w-0 disabled:opacity-50 disabled:cursor-not-allowed w-full"
            placeholder={placeholder}
            autoFocus
            rows={2}
            disabled={saving}
          />
        ) : (
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm min-w-0 disabled:opacity-50 disabled:cursor-not-allowed w-full"
            placeholder={placeholder}
            autoFocus
            disabled={saving}
          />
        )}
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center space-x-1"
            title="Save"
          >
            {saving ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaSave className="w-3 h-3" />}
            <span>Save</span>
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 sm:flex-none px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cancel"
          >
            <FaTimes className="w-3 h-3" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`group cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg px-3 py-2 transition-colors duration-200 ${className}`}
      onClick={startEdit}
      title="Click to edit"
    >
      <div className="flex items-center justify-between">
        <span className="text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          {value || <span className="text-gray-400 italic">{placeholder}</span>}
        </span>
        <FaEdit className="w-3 h-3 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
      </div>
    </div>
  );
};

// ============= PROBLEM SELECTOR COMPONENT =============
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

  useEffect(() => {
    const handleScroll = () => {
      if (showDropdown && dropdownRef.current && searchInputRef.current) {
        updateDropdownPosition();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [showDropdown]);

  const searchProblems = async () => {
    try {
      setLoading(true);
      const response = await problemAPI.search({ q: searchTerm, limit: 20 });
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
    dropdownRef.current.style.top = `${rect.bottom + window.scrollY + 8}px`;
    dropdownRef.current.style.left = `${rect.left + window.scrollX}px`;
    dropdownRef.current.style.width = `${rect.width}px`;
  };

  const DropdownPortal = () => {
    useEffect(() => {
      if (showDropdown) {
        updateDropdownPosition();
      }
    }, [showDropdown, problems]);

    if (!showDropdown || searchTerm.length < 2) return null;

    return createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: 'absolute',
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

// ============= CREATE PROBLEM FORM COMPONENT =============
const CreateProblemForm = ({ onSubmit, onCancel, canManageSheets, canAddEditorials }) => {
  const [formData, setFormData] = useState({
    title: '',
    practiceLink: '',
    platform: '',
    youtubeLink: '',
    editorialLink: '',
    notesLink: '',
    difficulty: 'Easy'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a problem title');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
      setFormData({
        title: '',
        practiceLink: '',
        platform: '',
        youtubeLink: '',
        editorialLink: '',
        notesLink: '',
        difficulty: 'Easy'
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to create problem. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-500/30 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
          <FaGraduationCap className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Create New Global Problem
        </h3>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Problem Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              required
              placeholder="Enter problem title"
              autoFocus
              disabled={submitting}
            />
          </div>

          {canManageSheets && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Practice Link
                </label>
                <input
                  type="url"
                  value={formData.practiceLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, practiceLink: e.target.value }))}
                  className="w-full px-4 py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                  placeholder="https://leetcode.com/problems/..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform
                </label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-4 py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                  placeholder="LeetCode, GeeksforGeeks, etc."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  YouTube Link
                </label>
                <input
                  type="url"
                  value={formData.youtubeLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeLink: e.target.value }))}
                  className="w-full px-4 py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-4 py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                  disabled={submitting}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </>
          )}

          {canAddEditorials && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Editorial Link
                </label>
                <input
                  type="url"
                  value={formData.editorialLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, editorialLink: e.target.value }))}
                  className="w-full px-4 py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
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
                  value={formData.notesLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, notesLink: e.target.value }))}
                  className="w-full px-4 py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                  placeholder="Link to notes or documentation"
                  disabled={submitting}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-6 py-3 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTimes className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.title.trim()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <FaSave className="w-4 h-4" />
                <span>Create & Add Problem</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============= MAIN SUBSECTION VIEW COMPONENT =============
const SubsectionView = ({ 
  subsection, 
  sheetId, 
  sectionId, 
  index, 
  onUpdateSubsection, 
  onDeleteSubsection,
  onRefresh,
  canManageSheets,
  problemsMap = {}
}) => {
  const { user, canAddEditorials } = useAuth();
  const { stats } = useProgress();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  // ✅ DEBUG SECTION
  //console.log('🔧 SubsectionView Render:', {
  //   subsectionName: subsection?.name,
  //   rawProblemIds: subsection?.problemIds,
  //   problemIdsType: Array.isArray(subsection?.problemIds) ? 'array' : typeof subsection?.problemIds,
  //   problemIdsLength: subsection?.problemIds?.length || 0,
  //   problemsMapKeys: Object.keys(problemsMap),
  //   problemsMapSize: Object.keys(problemsMap).length,
  //   sampleProblemId: subsection?.problemIds?.[0]
  // });

  if (!subsection) {
    console.error('❌ SubsectionView: subsection is undefined');
    return null;
  }

  // ✅ CRITICAL: Handle both string IDs and object references
  const problems = (subsection.problemIds || [])
    .map(item => {
      // Extract ID whether it's a string or an object
      const id = typeof item === 'string' ? item : (item?.id || item?._id);
      //console.log(`🔍 Looking up problem:`, { item, extractedId: id });
      
      const problem = problemsMap[id];
      
      if (!problem) {
        console.warn(`⚠️ Problem not found for ID: ${id}`);
      } else {
        //console.log(`✓ Found problem: ${id} -> "${problem.title}"`);
      }
      
      return problem;
    })
    .filter(Boolean);

  // //console.log(`📝 SubsectionView Final Results:`, {
  //   subsectionName: subsection.name,
  //   totalProblemIds: subsection.problemIds?.length || 0,
  //   foundProblems: problems.length,
  //   problemTitles: problems.map(p => p.title)
  // });

  const getSubsectionProgress = () => {
    const totalProblems = subsection.problemIds?.length || 0;
    const completedProblems = stats?.subsectionStats?.[subsection.id] || 0;
    return { completed: completedProblems, total: totalProblems };
  };

  const handleUpdateSubsectionInternal = async (field, value) => {
    if (onUpdateSubsection) {
      await onUpdateSubsection(sectionId, subsection.id, field, value);
    }
  };

  const handleDeleteSubsectionInternal = async () => {
    if (!canManageSheets) return;
    
    if (!window.confirm(`Are you sure you want to delete subsection "${subsection.name}"? This will remove all problem references (but not delete global problems).`)) {
      return;
    }

    try {
      setDeleting(true);
      if (onDeleteSubsection) {
        await onDeleteSubsection(sectionId, subsection.id, subsection.name);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete subsection. Please try again.');
      setDeleting(false);
    }
  };

  const handleLinkExistingProblem = async (problem) => {
    try {
      await sheetAPI.linkProblem(sheetId, sectionId, subsection.id, problem.id);
      toast.success(`Problem "${problem.title}" added to subsection!`);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error linking problem:', error);
      toast.error('Failed to link problem');
    }
  };

  const handleCreateAndLinkProblem = async (problemData) => {
    try {
      const createResponse = await problemAPI.create(problemData);
      const newProblem = createResponse.data.problem;

      await sheetAPI.linkProblem(sheetId, sectionId, subsection.id, newProblem.id);
      
      toast.success(`Problem "${newProblem.title}" created and added!`);
      setShowCreateForm(false);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error creating and linking problem:', error);
      toast.error('Failed to create problem');
    }
  };

  const handleExpansionClick = (e) => {
    if (!editing && !deleting) {
      setIsExpanded(!isExpanded);
    }
  };

  const progress = getSubsectionProgress();
  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  const getStatusConfig = () => {
    if (percentage === 100) {
      return {
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-500/20',
        borderColor: 'border-green-200 dark:border-green-500/30',
        progressColor: 'text-green-600 dark:text-green-400',
        icon: FaTrophy,
        status: 'COMPLETED'
      };
    } else if (percentage > 0) {
      return {
        color: 'text-[#6366f1] dark:text-[#a855f7]',
        bgColor: 'bg-blue-50 dark:bg-[#6366f1]/20',
        borderColor: 'border-blue-200 dark:border-[#6366f1]/30',
        progressColor: 'text-[#6366f1] dark:text-[#a855f7]',
        icon: FaCode,
        status: 'IN PROGRESS'
      };
    } else {
      return {
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-white/5',
        borderColor: 'border-gray-200 dark:border-white/10',
        progressColor: 'text-gray-600 dark:text-gray-400',
        icon: FaClock,
        status: 'NOT STARTED'
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const selectedProblemIds = subsection.problemIds || [];

  return (
    <div className="w-full">
      
      {/* Subsection Header */}
      <div 
        className={`
          py-4 px-6 sm:px-12 lg:px-16 
          flex justify-between items-center transition-all duration-300 
          hover:bg-blue-50/30 dark:hover:bg-[#6366f1]/10 
          group relative
          ${index === 0 ? 'pt-4' : 'pt-4'}
          ${deleting ? 'opacity-70 pointer-events-none' : ''}
          ${editing ? '' : 'cursor-pointer'}
        `}
      >
        
        {/* Admin Controls */}
        {canManageSheets && (
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddProblem(true);
                }}
                disabled={deleting}
                className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add Problem"
              >
                <FaPlus className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSubsectionInternal();
                }}
                disabled={deleting}
                className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Subsection"
              >
                {deleting ? (
                  <FaSpinner className="w-3 h-3 animate-spin" />
                ) : (
                  <FaTrash className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Left Section */}
        <div className="flex items-center space-x-3 sm:space-x-4 flex-1" onClick={handleExpansionClick}>
          
          {/* Expand/Collapse Button */}
          <div className="flex items-center justify-center w-8 h-8 transition-all duration-300 ease-out group-hover:scale-110">
            {isExpanded ? (
              <FaChevronDown className="w-3 h-3 text-[#6366f1] dark:text-[#a855f7] transition-all duration-300 ease-out group-hover:text-[#6366f1] dark:group-hover:text-[#a855f7]" />
            ) : (
              <FaChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500 transition-all duration-300 ease-out group-hover:text-[#6366f1] dark:group-hover:text-[#a855f7]" />
            )}
          </div>
          
          {/* Subsection Info */}
          <div className="flex-1">
            {canManageSheets ? (
              <div onClick={(e) => e.stopPropagation()}>
                <InlineEditableText
                  value={subsection.name}
                  onSave={(value) => handleUpdateSubsectionInternal('name', value)}
                  placeholder="Subsection name"
                  isEditable={canManageSheets}
                  disabled={deleting}
                  className="text-base sm:text-lg font-semibold leading-tight"
                />
              </div>
            ) : (
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                {subsection.name}
              </h3>
            )}
            <div className="flex items-center space-x-2 mt-1">
              <FaListAlt className="w-3 h-3 text-gray-400 dark:text-gray-500" />
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                {progress.total} problems
              </span>
            </div>
          </div>
        </div>
        
        {/* Right Section - Progress Display */}
        <div className="flex items-center space-x-3 sm:space-x-4" onClick={handleExpansionClick}>
          
          {/* Circular Progress */}
          <div className="relative">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-600" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${percentage}, 100`} className={`transition-all duration-1000 ease-out ${statusConfig.progressColor}`} strokeLinecap="round" />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-gray-900 dark:text-white">{progress.completed}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-none">/{progress.total}</span>
            </div>
            
            {percentage === 100 && progress.total > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800 animate-bounce">
                <FaCheckCircle className="w-2 h-2 text-white" />
              </div>
            )}
          </div>

          {/* Status Info */}
          <div className="text-right hidden sm:block">
            <div className="text-lg font-bold text-gray-900 dark:text-white">{percentage}%</div>
            <div className={`text-xs font-bold uppercase tracking-wider flex items-center justify-end space-x-1 ${statusConfig.progressColor}`}>
              <StatusIcon className="w-3 h-3" />
              <span>{statusConfig.status}</span>
            </div>
          </div>

          <div className="sm:hidden">
            <div className="text-sm font-bold text-gray-900 dark:text-white">{percentage}%</div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/0 via-[#6366f1]/2 to-[#6366f1]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Problem Management Section */}
      {showAddProblem && canManageSheets && !deleting && (
        <div className="px-6 sm:px-12 lg:px-20 pb-4">
          <div className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Problems</h3>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 text-sm"
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
              <CreateProblemForm
                onSubmit={handleCreateAndLinkProblem}
                onCancel={() => setShowCreateForm(false)}
                canManageSheets={canManageSheets}
                canAddEditorials={canAddEditorials}
              />
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setShowAddProblem(false);
                  setShowCreateForm(false);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Problems Table */}
{isExpanded && !deleting && (
  <div className="px-6 sm:px-12 lg:px-20 pb-4 animate-in slide-in-from-top duration-300 ease-out">
    <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 shadow-xl">
      
      {problems.length === 0 ? (
        <div className="text-center py-12 px-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/5 to-[#a855f7]/5 rounded-full blur-3xl opacity-50"></div>
            
            <div className="relative space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6366f1]/20 to-[#a855f7]/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-white/20">
                <FaCode className="w-8 h-8 text-[#6366f1] dark:text-[#a855f7]" />
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  No Problems Available
                </h4>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                  {canManageSheets 
                    ? 'This subsection is empty. Click the "+" button above to add your first problem!'
                    : "This subsection doesn't have any problems yet. Check back later for new coding challenges!"
                  }
                </p>
              </div>
              
              {canManageSheets && (
                <button
                  onClick={() => setShowAddProblem(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mx-auto"
                >
                  <FaPlus className="w-4 h-4" />
                  <span>Add Your First Problem</span>
                </button>
              )}
              
              <div className="flex justify-center space-x-2 mt-6">
                <div className="w-2 h-2 bg-[#6366f1]/60 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-[#a855f7]/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-2 h-2 bg-[#6366f1]/60 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <style jsx>{`
            .custom-scrollbar {
              /* Firefox */
              scrollbar-width: thin;
              scrollbar-color: rgba(99, 102, 241, 0.2) rgba(220, 225, 230, 0.05);
            }
            
            /* WebKit browsers (Chrome, Safari, Edge) */
            .custom-scrollbar::-webkit-scrollbar {
              height: 6px; /* Horizontal scrollbar height */
              width: 6px;  /* Vertical scrollbar width */
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(156, 163, 175, 0.1);
              border-radius: 8px;
              margin: 4px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: linear-gradient(135deg, #6366f1, #a855f7);
              border-radius: 8px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              transition: all 0.3s ease;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(135deg, #5855eb, #9333ea);
              box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
              transform: scale(1.1);
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:active {
              background: linear-gradient(135deg, #4f46e5, #7c3aed);
            }
            
            /* Dark mode adjustments */
            @media (prefers-color-scheme: dark) {
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
              }
              
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, #6366f1, #a855f7);
                border: 1px solid rgba(255, 255, 255, 0.1);
              }
              
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(135deg, #7c3aed, #c084fc);
                box-shadow: 0 4px 8px rgba(168, 85, 247, 0.4);
              }
            }
            
            /* Mobile optimizations */
            @media (max-width: 768px) {
              .custom-scrollbar::-webkit-scrollbar {
                height: 4px;
                width: 4px;
              }
              
              .custom-scrollbar::-webkit-scrollbar-thumb {
                border-radius: 6px;
              }
            }
            
            /* Corner styling */
            .custom-scrollbar::-webkit-scrollbar-corner {
              background: rgba(156, 163, 175, 0.1);
            }
            
            /* Button styling (arrows) */
            .custom-scrollbar::-webkit-scrollbar-button {
              display: none; /* Hide arrows for cleaner look */
            }
          `}</style>
          
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#6366f1]/10 via-[#a855f7]/5 to-[#6366f1]/10 border-b-2 border-[#6366f1]/20">
                <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"></div>
                    <span>Status</span>
                  </div>
                </th>
                <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#a855f7] to-[#6366f1] rounded-full"></div>
                    <span>Problem</span>
                  </div>
                </th>
                <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#a855f7] to-[#6366f1] rounded-full"></div>
                    <span>Practice</span>
                  </div>
                </th>
                <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#a855f7] to-[#6366f1] rounded-full"></div>
                    <span>Video</span>
                  </div>
                </th>
                
                <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"></div>
                    <span>Editorial</span>
                  </div>
                </th>
                <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"></div>
                    <span>Notes</span>
                  </div>
                </th>
                <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"></div>
                    <span>Revision</span>
                  </div>
                </th>
                <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"></div>
                    <span>Difficulty</span>
                  </div>
                </th>
                {canManageSheets && (
                  <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-[#a855f7] to-[#6366f1] rounded-full"></div>
                      <span>Actions</span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/30 dark:divide-white/10">
              {problems.map((problem, problemIndex) => (
                <ProblemItem
                  key={problem.id}
                  problem={problem}
                  sheetId={sheetId}
                  sectionId={sectionId}
                  subsectionId={subsection.id}
                  index={problemIndex}
                  onRefresh={onRefresh}
                  canManageSheets={canManageSheets}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
)}

    </div>
  );
};

export default SubsectionView;
