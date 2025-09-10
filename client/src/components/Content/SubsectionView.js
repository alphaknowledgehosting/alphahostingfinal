import React, { useState, useEffect } from 'react';
import { useProgress } from '../../hooks/useProgress';
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
  FaBookmark
} from 'react-icons/fa';

// Inline Editable Component
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

  const startEdit = () => {
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
        toast.error('Failed to save changes. Please try again.');
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
      <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
        {multiline ? (
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm resize-none min-w-0 disabled:opacity-50"
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
            className="flex-1 px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm min-w-0 disabled:opacity-50"
            placeholder={placeholder}
            autoFocus
            disabled={saving}
          />
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center space-x-1"
          title="Save"
        >
          {saving ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaSave className="w-3 h-3" />}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Cancel"
        >
          <FaTimes className="w-3 h-3" />
        </button>
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

// Problem Form Component
const ProblemForm = ({ onSubmit, onCancel, canManageSheets, canAddEditorials }) => {
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
      toast.error('Failed to add problem. Please try again.');
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
          Add New Problem
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
                <span>Adding...</span>
              </>
            ) : (
              <>
                <FaSave className="w-4 h-4" />
                <span>Add Problem</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const SubsectionView = ({ 
  subsection, 
  sheetId, 
  sectionId, 
  index, 
  onUpdateSubsection, 
  onDeleteSubsection, 
  onAddProblem,
  onUpdateProblem,
  onDeleteProblem,
  canManageSheets 
}) => {
  const { stats } = useProgress();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!subsection) {
    console.error('SubsectionView: subsection is undefined');
    return null;
  }

  if (!Array.isArray(subsection.problems)) {
    console.error('SubsectionView: subsection.problems is not an array', subsection);
    return null;
  }

  const getSubsectionProgress = () => {
    const totalProblems = subsection.problems.length;
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
    
    if (!window.confirm(`Are you sure you want to delete subsection "${subsection.name}"? This will delete all problems and user progress in this subsection.`)) {
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
      setDeleting(false); // Reset loading state on error
    }
    // Note: Don't reset deleting state on success as component will unmount
  };

  const handleAddProblemInternal = async (problemData) => {
    if (onAddProblem) {
      await onAddProblem(sectionId, subsection.id, problemData);
      setShowAddProblem(false);
    }
  };

  const progress = getSubsectionProgress();
  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  // Status configuration
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

  return (
    <div className="w-full">
      
      {/* Subsection Header */}
      <div 
        className={`
          cursor-pointer py-4 px-6 sm:px-12 lg:px-16 
          flex justify-between items-center transition-all duration-300 
          hover:bg-blue-50/30 dark:hover:bg-[#6366f1]/10 
          group relative
          ${index === 0 ? 'pt-4' : 'pt-4'}
          ${deleting ? 'opacity-70 pointer-events-none' : ''}
        `}
        onClick={() => !deleting && setIsExpanded(!isExpanded)}
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
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Expand/Collapse Button */}
          <div className="flex items-center justify-center w-8 h-8 transition-all duration-300 ease-out group-hover:scale-110">
            {isExpanded ? (
              <FaChevronDown
                className="w-3 h-3 text-[#6366f1] dark:text-[#a855f7] transition-all duration-300 ease-out group-hover:text-[#6366f1] dark:group-hover:text-[#a855f7]"
              />
            ) : (
              <FaChevronRight
                className="w-3 h-3 text-gray-400 dark:text-gray-500 transition-all duration-300 ease-out group-hover:text-[#6366f1] dark:group-hover:text-[#a855f7]"
              />
            )}
          </div>
          
          {/* Subsection Info */}
          <div>
            {canManageSheets ? (
              <InlineEditableText
                value={subsection.name}
                onSave={(value) => handleUpdateSubsectionInternal('name', value)}
                placeholder="Subsection name"
                isEditable={canManageSheets}
                disabled={deleting}
                className="text-base sm:text-lg font-semibold leading-tight"
              />
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
        
        {/* Right Section */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Circular Progress */}
          <div className="relative">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 transform -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-gray-200 dark:text-gray-600"
              />
              {/* Progress circle */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${percentage}, 100`}
                className={`transition-all duration-1000 ease-out ${statusConfig.progressColor}`}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Progress Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {progress.completed}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-none">
                /{progress.total}
              </span>
            </div>
            
            {/* Completion Badge */}
            {percentage === 100 && progress.total > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800 animate-bounce">
                <FaCheckCircle className="w-2 h-2 text-white" />
              </div>
            )}
          </div>

          {/* Status Info */}
          <div className="text-right hidden sm:block">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {percentage}%
            </div>
            <div className={`
              text-xs font-bold uppercase tracking-wider flex items-center justify-end space-x-1
              ${statusConfig.progressColor}
            `}>
              <StatusIcon className="w-3 h-3" />
              <span>{statusConfig.status}</span>
            </div>
          </div>

          {/* Mobile Status */}
          <div className="sm:hidden">
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {percentage}%
            </div>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/0 via-[#6366f1]/2 to-[#6366f1]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Add Problem Form */}
      {showAddProblem && canManageSheets && !deleting && (
        <div className="px-6 sm:px-12 lg:px-20 pb-4">
          <ProblemForm
            onSubmit={handleAddProblemInternal}
            onCancel={() => setShowAddProblem(false)}
            canManageSheets={canManageSheets}
            canAddEditorials={true}
          />
        </div>
      )}

      {/* Problems Table */}
      {isExpanded && !deleting && (
        <div className="px-6 sm:px-12 lg:px-20 pb-4 animate-in slide-in-from-top duration-300 ease-out">
          <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 shadow-xl">
            
            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                {/* Table Header with Brand Gradient - UPDATED ORDER */}
                <thead>
                  <tr className="bg-gradient-to-r from-[#6366f1]/10 via-[#a855f7]/5 to-[#6366f1]/10 dark:from-[#6366f1]/20 dark:via-[#a855f7]/10 dark:to-[#6366f1]/20 border-b-2 border-[#6366f1]/20 dark:border-white/20 backdrop-blur-sm">
                    <th className="p-3 sm:p-4 text-left font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider w-[6%]">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"></div>
                        <span>Status</span>
                      </div>
                    </th>
                    <th className="p-3 sm:p-4 text-left font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider w-[18%]">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#a855f7] to-[#6366f1] rounded-full"></div>
                        <span>Problem</span>
                      </div>
                    </th>
                    <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider w-[9%]">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#a855f7] to-[#6366f1] rounded-full"></div>
                        <span>Practice</span>
                      </div>
                    </th>
                    <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider w-[8%]">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"></div>
                        <span>Revision</span>
                      </div>
                    </th>
                    <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider w-[9%]">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"></div>
                        <span>Editorial</span>
                      </div>
                    </th>
                    <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider w-[9%]">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#a855f7] to-[#6366f1] rounded-full"></div>
                        <span>Video</span>
                      </div>
                    </th>
                    <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider w-[9%]">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"></div>
                        <span>Notes</span>
                      </div>
                    </th>
                    <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider w-[12%]">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"></div>
                        <span>Difficulty</span>
                      </div>
                    </th>
                    {canManageSheets && (
                      <th className="p-3 sm:p-4 text-center font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider w-[10%]">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-[#a855f7] to-[#6366f1] rounded-full"></div>
                          <span>Actions</span>
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                
                {/* Table Body with Enhanced Styling */}
                <tbody className="divide-y divide-gray-200/30 dark:divide-white/10">
                  {subsection.problems.map((problem, problemIndex) => (
                    <ProblemItem
                      key={problem.id}
                      problem={problem}
                      sheetId={sheetId}
                      sectionId={sectionId}
                      subsectionId={subsection.id}
                      index={problemIndex}
                      onUpdateProblem={onUpdateProblem}
                      onDeleteProblem={onDeleteProblem}
                      canManageSheets={canManageSheets}
                      onProgress={() => {}} // Refresh callback
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enhanced Empty State */}
            {subsection.problems.length === 0 && (
              <div className="text-center py-12 px-6">
                <div className="relative">
                  {/* Decorative background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/5 to-[#a855f7]/5 rounded-full blur-3xl opacity-50"></div>
                  
                  {/* Content */}
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
                    
                    {/* Add Problem Button in Empty State */}
                    {canManageSheets && (
                      <button
                        onClick={() => setShowAddProblem(true)}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mx-auto"
                      >
                        <FaPlus className="w-4 h-4" />
                        <span>Add Your First Problem</span>
                      </button>
                    )}
                    
                    {/* Decorative elements */}
                    <div className="flex justify-center space-x-2 mt-6">
                      <div className="w-2 h-2 bg-[#6366f1]/60 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-[#a855f7]/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      <div className="w-2 h-2 bg-[#6366f1]/60 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubsectionView;
