import React, { useState, useEffect } from 'react';
import SubsectionView from './SubsectionView';
import { useProgress } from '../../hooks/useProgress';
import toast from 'react-hot-toast';
import { 
  FaChevronDown, 
  FaChevronRight, 
  FaTrophy, 
  FaFire, 
  FaClock,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaSpinner
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
        toast.success('Section updated successfully!');
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

// Add Subsection Form
const AddSubsectionForm = ({ onSubmit, onCancel }) => {
  const [subsectionName, setSubsectionName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subsectionName.trim()) {
      toast.error('Please enter a subsection name');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        name: subsectionName.trim()
      });
      setSubsectionName('');
      toast.success('Subsection added successfully!');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to add subsection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-dashed border-green-300 dark:border-green-600 mb-4">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <input
          type="text"
          value={subsectionName}
          onChange={(e) => setSubsectionName(e.target.value)}
          placeholder="Enter subsection name..."
          className="flex-1 px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
          autoFocus
          required
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !subsectionName.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <FaSpinner className="w-3 h-3 animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <FaPlus className="w-3 h-3" />
              <span>Add</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaTimes className="w-3 h-3" />
          <span>Cancel</span>
        </button>
      </form>
    </div>
  );
};

const SectionView = ({ 
  section, 
  sheetId, 
  onUpdateSection, 
  onDeleteSection, 
  onAddSubsection, 
  onUpdateSubsection, 
  onDeleteSubsection, 
  onAddProblem,
  onUpdateProblem,
  onDeleteProblem,
  canManageSheets 
}) => {
  const { stats, refreshStats } = useProgress();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddSubsection, setShowAddSubsection] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (refreshStats) {
      refreshStats();
    }
  }, [refreshStats]);

  const getSectionProgress = () => {
    const totalProblems = section.subsections.reduce((total, subsection) => {
      return total + subsection.problems.length;
    }, 0);

    const completedProblems = stats.sectionStats?.[section.id] || 0;
    return { completed: completedProblems, total: totalProblems };
  };

  const handleUpdateSectionInternal = async (field, value) => {
    if (onUpdateSection) {
      await onUpdateSection(section.id, field, value);
    }
  };

  const handleDeleteSectionInternal = async () => {
    if (!canManageSheets) return;
    
    if (!window.confirm(`Are you sure you want to delete section "${section.name}"? This will delete all subsections, problems, and user progress in this section.`)) {
      return;
    }

    try {
      setDeleting(true);
      if (onDeleteSection) {
        await onDeleteSection(section.id, section.name);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete section. Please try again.');
      setDeleting(false); // Reset loading state on error
    }
    // Note: Don't reset deleting state on success as component will unmount
  };

  const handleAddSubsectionInternal = async (subsectionData) => {
    if (onAddSubsection) {
      await onAddSubsection(section.id, subsectionData);
      setShowAddSubsection(false);
    }
  };

  const progress = getSectionProgress();
  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  // Status configuration based on progress
  const getStatusConfig = () => {
    if (percentage === 100) {
      return {
        color: 'green',
        gradient: 'from-green-500 to-green-600',
        bg: 'from-green-50/50 via-white to-green-50/30 dark:from-green-500/10 dark:via-white/5 dark:to-green-500/5',
        border: 'border-green-200/50 dark:border-green-500/30',
        icon: FaTrophy,
        status: 'COMPLETED',
        accent: 'text-green-700 dark:text-green-400'
      };
    } else if (percentage >= 50) {
      return {
        color: 'blue',
        gradient: 'from-[#6366f1] to-[#a855f7]',
        bg: 'from-blue-50/50 via-white to-blue-50/30 dark:from-[#6366f1]/10 dark:via-white/5 dark:to-[#a855f7]/10',
        border: 'border-blue-200/50 dark:border-[#6366f1]/30',
        icon: FaFire,
        status: 'IN PROGRESS',
        accent: 'text-[#6366f1] dark:text-[#a855f7]'
      };
    } else {
      return {
        color: 'gray',
        gradient: 'from-gray-500 to-gray-600',
        bg: 'from-gray-50/50 via-white to-gray-50/30 dark:from-white/5 dark:via-white/10 dark:to-white/5',
        border: 'border-gray-200/50 dark:border-white/10',
        icon: FaClock,
        status: 'NOT STARTED',
        accent: 'text-gray-700 dark:text-gray-400'
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="mb-2">
      {/* Section Header */}
      <div 
        className={`
          cursor-pointer p-4 sm:p-6 border backdrop-blur-md
          flex justify-between items-center shadow-lg
          transition-all duration-300 ease-out hover:shadow-xl
          relative overflow-hidden group
          ${isExpanded 
            ? 'rounded-t-2xl border-b-0' 
            : 'rounded-2xl hover:scale-[1.01]'
          }
          bg-gradient-to-r ${statusConfig.bg}
          ${statusConfig.border}
          ${deleting ? 'opacity-70 pointer-events-none' : ''}
        `}
        onClick={() => !deleting && setIsExpanded(!isExpanded)}
      >
        
        {/* Admin Controls */}
        {canManageSheets && (
          <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddSubsection(true);
                }}
                disabled={deleting}
                className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add Subsection"
              >
                <FaPlus className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSectionInternal();
                }}
                disabled={deleting}
                className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Section"
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
        <div className="flex items-center gap-4 z-10 relative">
          {/* Modern Expand/Collapse Icon - Simplified */}
          <div className="flex items-center justify-center w-8 h-8 transition-all duration-300 ease-out group-hover:scale-110">
            {isExpanded ? (
              <FaChevronDown
                className="w-5 h-5 text-[#6366f1] dark:text-[#a855f7] transition-all duration-300 ease-out group-hover:text-[#6366f1] dark:group-hover:text-[#a855f7]"
              />
            ) : (
              <FaChevronRight
                className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-all duration-300 ease-out group-hover:text-[#6366f1] dark:group-hover:text-[#a855f7]"
              />
            )}
          </div>
          
          {/* Section Info */}
          <div className="min-w-0 flex-1">
            {canManageSheets ? (
              <InlineEditableText
                value={section.name}
                onSave={(value) => handleUpdateSectionInternal('name', value)}
                placeholder="Section name"
                isEditable={canManageSheets}
                disabled={deleting}
                className="text-lg sm:text-2xl font-bold tracking-tight"
              />
            ) : (
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                {section.name}
              </h2>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2 flex-wrap">
              <span>{section.subsections.length} subsections</span>
              <span className="hidden sm:inline">•</span>
              <span>{progress.total} problems</span>
            </p>
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-4 sm:gap-6 z-10 relative">
          
          {/* Circular Progress */}
          <div className="relative">
            <svg className="w-14 h-14 sm:w-16 sm:h-16 transform -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-200 dark:text-gray-600"
              />
              {/* Progress circle */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${percentage}, 100`}
                className={`transition-all duration-1000 ease-out ${statusConfig.accent}`}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Percentage Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs sm:text-sm font-bold ${statusConfig.accent}`}>
                {percentage}%
              </span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="text-right">
            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
              {progress.completed} / {progress.total}
            </div>
            <div className={`
              text-xs font-bold uppercase tracking-wider flex items-center gap-1 justify-end
              ${statusConfig.accent}
            `}>
              <StatusIcon className="w-3 h-3" />
              <span className="hidden sm:inline">{statusConfig.status}</span>
            </div>
          </div>
        </div>

        {/* Completion Badge */}
        {percentage === 100 && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 animate-bounce">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg flex items-center gap-1">
              <FaTrophy className="w-3 h-3" />
              <span className="hidden sm:inline">Done</span>
            </div>
          </div>
        )}

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Add Subsection Form */}
      {showAddSubsection && canManageSheets && !deleting && (
        <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-x border-green-200/50 dark:border-green-500/30">
          <AddSubsectionForm
            onSubmit={handleAddSubsectionInternal}
            onCancel={() => setShowAddSubsection(false)}
          />
        </div>
      )}

      {/* Section Content */}
      {isExpanded && !deleting && (
        <div className={`
          border border-t-0 rounded-b-2xl shadow-lg backdrop-blur-md
          bg-white/98 dark:bg-white/5 overflow-hidden
          animate-in slide-in-from-top duration-300 ease-out
          ${statusConfig.border}
        `}>
          <div className="divide-y divide-gray-100 dark:divide-white/10">
            {section.subsections.map((subsection, index) => (
              <div 
                key={subsection.id}
                className="transition-colors duration-200"
              >
                <SubsectionView
                  subsection={subsection}
                  sheetId={sheetId}
                  sectionId={section.id}
                  index={index}
                  onUpdateSubsection={onUpdateSubsection}
                  onDeleteSubsection={onDeleteSubsection}
                  onAddProblem={onAddProblem}
                  onUpdateProblem={onUpdateProblem}
                  onDeleteProblem={onDeleteProblem}
                  canManageSheets={canManageSheets}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionView;
