import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { 
  FaExternalLinkAlt, 
  FaYoutube, 
  FaCheckCircle, 
  FaTimes, 
  FaLock, 
  FaFileAlt,
  FaSpinner,
  FaGoogle,
  FaTrophy,
  FaCheck,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaBookmark,
  FaRegBookmark
} from 'react-icons/fa';
import { 
  ChevronRight,
  PlayCircle,
  FileText,
  ExternalLink,
  BookOpen,
  Plus,
  Edit
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import LoginButton from '../Auth/LoginButton';
import YouTubeModal from '../Common/YouTubeModal';
import { sheetAPI } from '../../services/api';

// Reusable Editable Cell Component
const EditableCell = ({ 
  value, 
  onSave, 
  isEditable, 
  type = 'text', 
  options = [], 
  placeholder = '', 
  renderValue,
  className = '',
  disabled = false
}) => {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTempValue(value || '');
  }, [value]);

  const startEdit = () => {
    if (isEditable && !disabled) {
      setTempValue(value || '');
      setEditing(true);
    }
  };

  const cancelEdit = () => {
    setTempValue(value || '');
    setEditing(false);
  };

  const saveEdit = async () => {
    if (tempValue !== value) {
      setSaving(true);
      try {
        await onSave(tempValue);
        setEditing(false);
      } catch (error) {
        console.error('Save failed:', error);
        toast.error('Failed to save changes. Please try again.');
      } finally {
        setSaving(false);
      }
    } else {
      setEditing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <td className={`p-3 sm:p-4 text-center border-r border-gray-200/20 dark:border-white/10 ${className} ${disabled ? 'opacity-70' : ''}`}>
      {editing ? (
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          {type === 'select' ? (
            <select
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:opacity-50"
              autoFocus
              disabled={saving || disabled}
            >
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 disabled:opacity-50"
              autoFocus
              disabled={saving || disabled}
            />
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              saveEdit();
            }}
            disabled={saving || disabled}
            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save"
          >
            {saving ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaSave className="w-3 h-3" />}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              cancelEdit();
            }}
            disabled={saving || disabled}
            className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cancel"
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-1">
          {renderValue ? renderValue(value) : (
            <span className="text-sm text-gray-900 dark:text-white">
              {value || (isEditable && !disabled ? 
                <span className="text-gray-400 dark:text-gray-500 italic">Click to add</span> : 
                <span className="text-gray-400 dark:text-gray-500">—</span>
              )}
            </span>
          )}
          {isEditable && !editing && !disabled && (
            <button
              onClick={startEdit}
              className="ml-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Edit"
            >
              <FaEdit className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </td>
  );
};

const ProblemItem = ({ 
  problem, 
  sheetId, 
  sectionId, 
  subsectionId, 
  index, 
  onUpdateProblem, 
  onDeleteProblem,
  canManageSheets,
  onProgress
}) => {
  const { user, canAddEditorials } = useAuth();
  const { toggleProblem, toggleRevision, isProblemCompleted, isProblemMarkedForRevision, refreshStats } = useProgress();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isTogglingRevision, setIsTogglingRevision] = useState(false);
  const [localProblem, setLocalProblem] = useState(problem);
  const [editingEditorial, setEditingEditorial] = useState(false);
  const [tempEditorialValue, setTempEditorialValue] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const isCompleted = isProblemCompleted(problem.id);
  const isMarkedForRevision = isProblemMarkedForRevision(problem.id);

  useEffect(() => {
    setLocalProblem(problem);
  }, [problem]);

  const isEmpty = (value) => {
    return !value || value === '' || value === null || value === undefined;
  };

  const canEditField = (field) => {
    if (!user) return false;
    if (canManageSheets) return true;
    if (canAddEditorials && (field === 'editorialLink' || field === 'notesLink')) return true;
    return false;
  };

  const updateField = async (field, value) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!canEditField(field)) {
      toast.error('You do not have permission to edit this field.');
      return;
    }

    setUpdating(true);
    const loadingToast = toast.loading(`Updating ${field}...`);
    
    try {
      setLocalProblem(prev => ({ ...prev, [field]: value }));
      
      if (onUpdateProblem) {
        await onUpdateProblem(sectionId, subsectionId, problem.id, field, value);
      } else {
        await sheetAPI.updateProblemField(sheetId, sectionId, subsectionId, problem.id, { [field]: value });
      }
      
      toast.success(`${field} updated successfully! ✅`, { id: loadingToast });
    } catch (error) {
      console.error('Error updating field:', error);
      setLocalProblem(prev => ({ ...prev, [field]: problem[field] }));
      toast.error(`Failed to update ${field}: ${error.response?.data?.message || error.message}`, { id: loadingToast });
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const startEditingEditorial = () => {
    if (!canEditField('editorialLink')) {
      if (!user) {
        setShowAuthModal(true);
      } else {
        toast.error('You do not have permission to edit this field.');
      }
      return;
    }
    setTempEditorialValue(localProblem.editorialLink || '');
    setEditingEditorial(true);
  };

  const saveEditorial = async () => {
    try {
      await updateField('editorialLink', tempEditorialValue);
      setEditingEditorial(false);
    } catch (error) {
      console.error('Failed to save editorial:', error);
      toast.error('Failed to save editorial link. Please try again.');
    }
  };

  const cancelEditingEditorial = () => {
    setTempEditorialValue('');
    setEditingEditorial(false);
  };

  const handleEditorialKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditorial();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingEditorial();
    }
  };

  const getDifficultyStyle = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': 
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20';
      case 'medium': 
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20';
      case 'hard': 
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20';
      default: 
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/10 border border-gray-200 dark:border-gray-500/20';
    }
  };

  const getDifficultyDotColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-amber-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleCheckboxChange = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsToggling(true);
    try {
      const success = await toggleProblem({
        problemId: problem.id,
        sheetId,
        sectionId,
        subsectionId,
        difficulty: problem.difficulty,
        completed: !isCompleted
      });
      
      if (success) {
        toast.success(isCompleted ? 'Problem marked as incomplete' : 'Problem completed! 🎉');
        await refreshStats();
        if (onProgress) onProgress();
      } else {
        toast.error('Failed to update problem status');
      }
    } catch (error) {
      console.error('Failed to toggle problem completion:', error);
      toast.error('Failed to update problem status. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  const handleRevisionToggle = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsTogglingRevision(true);
    try {
      const success = await toggleRevision({
        problemId: problem.id,
        sheetId,
        sectionId,
        subsectionId,
        difficulty: problem.difficulty,
        markedForRevision: !isMarkedForRevision
      });
      
      if (success) {
        toast.success(isMarkedForRevision ? 'Removed from revision list' : 'Added to revision list! 📚');
        await refreshStats();
        if (onProgress) onProgress();
      } else {
        toast.error('Failed to update revision status');
      }
    } catch (error) {
      console.error('Failed to toggle revision status:', error);
      toast.error('Failed to update revision status. Please try again.');
    } finally {
      setIsTogglingRevision(false);
    }
  };

  const handleViewEditorial = () => {
    if (!isEmpty(localProblem.editorialLink)) {
      const editorialPath = `/editorial/${problem.id}`;
      window.open(editorialPath, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteProblem = async () => {
    if (!canManageSheets) {
      toast.error('You do not have permission to delete problems.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${localProblem.title || 'this problem'}"? This action cannot be undone.`)) {
      return;
    }

    const loadingToast = toast.loading('Deleting problem...');

    try {
      setDeleting(true);
      
      if (onDeleteProblem) {
        await onDeleteProblem(sectionId, subsectionId, problem.id);
      } else {
        await sheetAPI.deleteProblem(sheetId, sectionId, subsectionId, problem.id);
      }
      
      toast.success(`Problem "${localProblem.title || 'Untitled'}" deleted successfully! 🗑️`, { id: loadingToast });
      
      await refreshStats();
      if (onProgress) onProgress();
      
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast.error(`Failed to delete problem: ${error.response?.data?.message || error.message}`, { id: loadingToast });
      setDeleting(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setShowAuthModal(false);
  };

  // Enhanced Authentication Modal with Problem Data Display
  const AuthModal = () => {
    if (!showAuthModal) return null;

    const closeModal = () => {
      setShowAuthModal(false);
    };

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        {/* Enhanced Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={closeModal}
        />
        
        {/* Modal Container */}
        <div className="relative w-full max-w-lg bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-300">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/5 via-[#a855f7]/3 to-[#6366f1]/5 dark:from-[#6366f1]/10 dark:via-[#a855f7]/5 dark:to-[#6366f1]/10 rounded-3xl" />
          
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 w-10 h-10 bg-white/80 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-500/20 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl backdrop-blur-sm transition-all duration-200 flex items-center justify-center z-10 border border-white/30 dark:border-white/20"
          >
            <FaTimes className="w-4 h-4" />
          </button>

          {/* Modal Content */}
          <div className="relative p-8 sm:p-12 text-center">
            
            {/* Icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-2xl shadow-xl animate-pulse opacity-20"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-2xl shadow-lg flex items-center justify-center">
                <FaLock className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Sign In Required
            </h2>
            
            {/* Subtitle */}
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Sign in to mark problems as completed, add to revision list, and track your progress
            </p>

            {/* Problem Info Display */}
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/30 dark:border-white/10 shadow-lg">
              <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
                <div className="bg-white dark:bg-white/10 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-white/20 backdrop-blur-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {isEmpty(localProblem.title) ? 'Untitled Problem' : localProblem.title}
                  </span>
                </div>
                
                {!isEmpty(localProblem.difficulty) && (
                  <span className={`
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                    ${getDifficultyStyle(localProblem.difficulty)}
                  `}>
                    <span className={`w-2 h-2 rounded-full ${getDifficultyDotColor(localProblem.difficulty)}`}></span>
                    {localProblem.difficulty}
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                After signing in, you can mark this problem as completed or add it to your revision list!
              </p>
            </div>

            {/* Centered Login Button */}
            <div className="flex justify-center items-center mb-6 w-full">
              <div className="flex justify-center w-full">
                <LoginButton 
                  onLoginSuccess={handleLoginSuccess}
                  variant="google"
                />
              </div>
            </div>

            {/* Skip Button */}
            <button 
              onClick={closeModal}
              className="text-gray-500 dark:text-gray-400 hover:text-[#6366f1] dark:hover:text-[#a855f7] font-medium transition-colors duration-200"
            >
              Maybe Later
            </button>

            {/* Sign In Encouragement */}
            <div className="mt-6 bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 dark:from-[#6366f1]/20 dark:to-[#a855f7]/20 rounded-2xl p-4 border border-[#6366f1]/20 dark:border-[#a855f7]/30 backdrop-blur-sm">
              <p className="text-[#6366f1] dark:text-[#a855f7] font-semibold flex items-center justify-center gap-2 text-sm">
                <span>✨</span>
                Sign in with Google in seconds and start tracking your progress!
                <span>🚀</span>
              </p>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const isDisabled = updating || deleting;

  return (
    <>
      <tr className={`
        border border-gray-200/30 dark:border-white/10
        transition-all duration-200 hover:border-gray-300 dark:hover:border-white/20
        ${isDisabled ? 'opacity-70' : ''}
        ${isCompleted 
          ? (isMarkedForRevision 
              ? 'bg-gradient-to-r from-orange-50/50 via-white to-orange-50/30 dark:from-orange-500/10 dark:via-slate-800 dark:to-orange-500/5'
              : 'bg-gradient-to-r from-green-50/50 via-white to-green-50/30 dark:from-green-500/10 dark:via-slate-800 dark:to-green-500/5')
          : index % 2 === 0 
            ? 'bg-white dark:bg-slate-800' 
            : 'bg-gray-50/50 dark:bg-slate-700/50'
        }
        hover:shadow-sm hover:bg-gray-50/80 dark:hover:bg-slate-700/80
      `}>
        
        {/* Modern Status Checkbox with Color-coded Tick */}
        <td className="p-3 sm:p-4 text-center border-r border-gray-200/20 dark:border-white/10">
          <div className="flex items-center justify-center relative">
            <button
              onClick={handleCheckboxChange}
              disabled={isToggling || isDisabled}
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                transition-all duration-300 transform hover:scale-110 active:scale-95
                disabled:opacity-70 disabled:cursor-not-allowed
                ${isCompleted 
                  ? (isMarkedForRevision
                      ? 'bg-orange-500 border-orange-500 shadow-md shadow-orange-500/30' 
                      : 'bg-green-500 border-green-500 shadow-md shadow-green-500/30')
                  : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-white/30 hover:border-green-400 dark:hover:border-green-400 hover:shadow-sm'
                }
              `}
              title={isCompleted ? (isMarkedForRevision ? "Solved (Marked for Revision)" : "Solved") : "Mark as solved"}
            >
              {isToggling ? (
                <FaSpinner className="w-3 h-3 animate-spin text-green-500" />
              ) : isCompleted ? (
                <FaCheck className="w-2.5 h-2.5 text-white" />
              ) : null}
            </button>
          </div>
        </td>

        {/* Problem Title - Only show "Solved" text, no revision badge */}
        <EditableCell
          value={localProblem.title}
          onSave={(value) => updateField('title', value)}
          isEditable={canEditField('title')}
          disabled={isDisabled}
          placeholder="Enter problem title"
          className="text-left font-semibold"
          renderValue={(value) => (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base text-gray-900 dark:text-white">
                {isEmpty(value) ? (
                  <span className="text-gray-400 dark:text-gray-500 italic">Click to add title</span>
                ) : (
                  value
                )}
              </span>
              {isCompleted && !isToggling && (
                <span className={`
                  text-white px-2 py-0.5 rounded-full text-xs font-medium
                  ${isMarkedForRevision ? 'bg-orange-500' : 'bg-green-500'}
                `}>
                  Solved
                </span>
              )}
            </div>
          )}
        />

        {/* Practice Link - MOVED TO THIRD POSITION */}
        <EditableCell
          value={localProblem.practiceLink}
          onSave={(value) => updateField('practiceLink', value)}
          isEditable={canEditField('practiceLink')}
          disabled={isDisabled}
          type="url"
          placeholder="Enter practice URL"
          renderValue={(value) => 
            !isEmpty(value) ? (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="group text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-all duration-200 transform hover:scale-110 active:scale-95 mx-auto flex items-center justify-center gap-1"
                title="Solve on platform"
              >
                <FaExternalLinkAlt className="w-4 h-4 group-hover:scale-110 transition-all duration-200" />
                <span className="hidden sm:inline text-sm font-semibold text-gray-700 dark:text-gray-300">Solve</span>
              </a>
            ) : canEditField('practiceLink') && !isDisabled ? (
              <button
                title="Add practice link"
                className="group text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 transform hover:scale-110 active:scale-95 mx-auto flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2"
              >
                <Plus className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">—</span>
            )
          }
        />

        {/* Revision Toggle - MOVED TO FOURTH POSITION */}
        <td className="p-3 sm:p-4 text-center border-r border-gray-200/20 dark:border-white/10">
          <div className="flex items-center justify-center relative">
            <button
              onClick={handleRevisionToggle}
              disabled={isTogglingRevision || isDisabled}
              className={`
                transition-all duration-300 transform hover:scale-110 active:scale-95
                disabled:opacity-70 disabled:cursor-not-allowed
                ${isMarkedForRevision 
                  ? 'text-orange-500 hover:text-orange-600' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-orange-500'
                }
              `}
              title={isMarkedForRevision ? "Remove from revision list" : "Add to revision list"}
            >
              {isTogglingRevision ? (
                <FaSpinner className="w-5 h-5 animate-spin" />
              ) : isMarkedForRevision ? (
                <FaBookmark className="w-5 h-5" />
              ) : (
                <FaRegBookmark className="w-5 h-5" />
              )}
            </button>
          </div>
        </td>

        {/* Editorial Link - MOVED TO FIFTH POSITION */}
        <td className="p-3 sm:p-4 text-center border-r border-gray-200/20 dark:border-white/10">
          <div className="flex items-center justify-center space-x-2">
            {editingEditorial ? (
              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="url"
                  value={tempEditorialValue}
                  onChange={(e) => setTempEditorialValue(e.target.value)}
                  onKeyDown={handleEditorialKeyPress}
                  placeholder="Enter editorial URL"
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 min-w-0 w-32 disabled:opacity-50"
                  autoFocus
                  disabled={isDisabled}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveEditorial();
                  }}
                  disabled={isDisabled}
                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save"
                >
                  {updating ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaSave className="w-3 h-3" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEditingEditorial();
                  }}
                  disabled={isDisabled}
                  className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cancel"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                {!isEmpty(localProblem.editorialLink) && (
                  <button
                    onClick={handleViewEditorial}
                    disabled={isDisabled}
                    title="Read editorial (opens in new tab)"
                    className="group text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-all duration-200 transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                  </button>
                )}
                
                {canEditField('editorialLink') && !isDisabled && (
                  <button
                    onClick={startEditingEditorial}
                    title={isEmpty(localProblem.editorialLink) ? "Add editorial" : "Edit editorial"}
                    className="group text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-200 transform hover:scale-110 active:scale-95"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                
                {!canEditField('editorialLink') && isEmpty(localProblem.editorialLink) && (
                  <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">—</span>
                )}
              </>
            )}
          </div>
        </td>

        {/* Video Link - MOVED TO SIXTH POSITION */}
        <EditableCell
          value={localProblem.youtubeLink}
          onSave={(value) => updateField('youtubeLink', value)}
          isEditable={canEditField('youtubeLink')}
          disabled={isDisabled}
          type="url"
          placeholder="Enter YouTube URL"
          renderValue={(value) => 
            !isEmpty(value) ? (
              <button
                onClick={() => setShowVideo(true)}
                disabled={isDisabled}
                title="Watch editorial video"
                className="group text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200 transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaYoutube className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              </button>
            ) : canEditField('youtubeLink') && !isDisabled ? (
              <button
                title="Add video"
                className="group text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 transform hover:scale-110 active:scale-95 mx-auto flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2"
              >
                <Plus className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">—</span>
            )
          }
        />

        {/* Notes Link - MOVED TO SEVENTH POSITION */}
        <EditableCell
          value={localProblem.notesLink}
          onSave={(value) => updateField('notesLink', value)}
          isEditable={canEditField('notesLink')}
          disabled={isDisabled}
          type="url"
          placeholder="Enter notes URL"
          renderValue={(value) => 
            !isEmpty(value) ? (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="group text-[#6366f1] hover:text-[#5855eb] dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-200 transform hover:scale-110 active:scale-95 mx-auto flex items-center justify-center"
                title="View notes"
              >
                <FileText className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              </a>
            ) : canEditField('notesLink') && !isDisabled ? (
              <button
                title="Add notes"
                className="group text-gray-400 dark:text-gray-500 hover:text-[#6366f1] dark:hover:text-blue-400 transition-all duration-200 transform hover:scale-110 active:scale-95 mx-auto flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2"
              >
                <Plus className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">—</span>
            )
          }
        />

        {/* Difficulty */}
        <EditableCell
          value={localProblem.difficulty}
          onSave={(value) => updateField('difficulty', value)}
          isEditable={canEditField('difficulty')}
          disabled={isDisabled}
          type="select"
          options={['Easy', 'Medium', 'Hard']}
          renderValue={(value) => 
            !isEmpty(value) ? (
              <span className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                transition-all duration-200 hover:scale-105
                ${getDifficultyStyle(value)}
              `}>
                <span className={`w-2 h-2 rounded-full ${getDifficultyDotColor(value)}`}></span>
                <span className="hidden sm:inline">{value}</span>
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">—</span>
            )
          }
        />

        {/* Actions */}
        {canManageSheets && (
          <td className="p-3 sm:p-4 text-center">
            <button
              onClick={handleDeleteProblem}
              disabled={isDisabled}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Problem"
            >
              {deleting ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaTrash className="w-4 h-4" />
              )}
            </button>
          </td>
        )}
      </tr>

      <AuthModal />

      {!isEmpty(localProblem.youtubeLink) && (
        <YouTubeModal
          videoUrl={localProblem.youtubeLink}
          isOpen={showVideo}
          onClose={() => setShowVideo(false)}
          problemName={localProblem.title || 'Untitled Problem'}
        />
      )}
    </>
  );
};

export default ProblemItem;
