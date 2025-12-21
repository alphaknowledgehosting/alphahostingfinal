import React, { useState } from 'react';
import { useProgress } from '../../context/ProgressContext';
import SubsectionView from './SubsectionView';
import toast from 'react-hot-toast';
import { 
  FaChevronRight, 
  FaChevronDown,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaSpinner,
  FaFolder,
  FaFolderOpen,
  FaTrophy,
  FaFire,
  FaClock
} from 'react-icons/fa';

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

  React.useEffect(() => {
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
        toast.success('Section updated successfully!');
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

// ============= ADD SUBSECTION FORM COMPONENT =============
const AddSubsectionForm = ({ onSubmit, onCancel }) => {
  const [subsectionName, setSubsectionName] = useState('');
  const [subsectionDescription, setSubsectionDescription] = useState('');
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
        name: subsectionName.trim(),
        description: subsectionDescription.trim()
      });
      setSubsectionName('');
      setSubsectionDescription('');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to add subsection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-dashed border-green-300 dark:border-green-600 mb-4">
      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <FaPlus className="w-3 h-3 text-green-600" />
        Add New Subsection
      </h4>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subsection Name *
            </label>
            <input
              type="text"
              value={subsectionName}
              onChange={(e) => setSubsectionName(e.target.value)}
              className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white text-sm"
              required
              placeholder="Enter subsection name"
              autoFocus
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={subsectionDescription}
              onChange={(e) => setSubsectionDescription(e.target.value)}
              className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white text-sm"
              placeholder="Optional description"
              disabled={submitting}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <FaTimes className="w-3 h-3" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={submitting || !subsectionName.trim()}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {submitting ? (
              <>
                <FaSpinner className="w-3 h-3 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <FaPlus className="w-3 h-3" />
                <span>Add Subsection</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============= MAIN SECTION VIEW COMPONENT =============
const SectionView = ({ 
  section, 
  sheetId, 
  onUpdateSection, 
  onDeleteSection, 
  onAddSubsection,
  onUpdateSubsection,
  onDeleteSubsection,
  onRefresh,
  canManageSheets,
  problemsMap = {} // ✅ CHANGE #1: ADD THIS LINE
}) => {
  const { stats } = useProgress();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddSubsection, setShowAddSubsection] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  if (!section) {
    console.error('SectionView: section is undefined');
    return null;
  }

  const getSectionProgress = () => {
    if (!section.subsections || !Array.isArray(section.subsections)) {
      return { completed: 0, total: 0 };
    }

    const totalProblems = section.subsections.reduce((total, subsection) => {
      return total + (subsection.problemIds?.length || 0);
    }, 0);

    const completedProblems = stats?.sectionStats?.[section.id] || 0;
    return { completed: completedProblems, total: totalProblems };
  };

  const handleUpdateSectionInternal = async (field, value) => {
    if (onUpdateSection) {
      await onUpdateSection(section.id, field, value);
    }
  };

  const handleDeleteSectionInternal = async () => {
    if (!canManageSheets) return;
    
    if (!window.confirm(`Are you sure you want to delete section "${section.name}"? This will remove all subsections and problem references (but not delete global problems).`)) {
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
      setDeleting(false);
    }
  };

  const handleAddSubsectionInternal = async (subsectionData) => {
    if (onAddSubsection) {
      await onAddSubsection(section.id, subsectionData);
      setShowAddSubsection(false);
      toast.success('Subsection added successfully!');
    }
  };

  const handleExpansionClick = (e) => {
    if (!editing && !deleting) {
      setIsExpanded(!isExpanded);
    }
  };

  const progress = getSectionProgress();
  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  const getStatusConfig = () => {
    if (percentage === 100) {
      return {
        color: 'green',
        gradient: 'from-green-500 to-green-600',
        bg: 'from-green-50/50 via-white to-green-50/30 dark:from-green-500/10 dark:via-white/5 dark:to-green-500/5',
        border: 'border-green-200/50 dark:border-green-500/30',
        progressBg: 'bg-green-500',
        progressColor: 'text-green-600 dark:text-green-400',
        icon: FaTrophy,
        status: 'COMPLETED',
        accent: 'text-green-700 dark:text-green-400'
      };
    } else if (percentage > 0) {
      return {
        color: 'blue',
        gradient: 'from-[#6366f1] to-[#a855f7]',
        bg: 'from-[#6366f1]/10 via-white to-[#a855f7]/10 dark:from-[#6366f1]/10 dark:via-white/5 dark:to-[#a855f7]/10',
        border: 'border-[#6366f1]/20 dark:border-[#a855f7]/30',
        progressBg: 'bg-green-500',
        progressColor: 'text-green-600 dark:text-green-400',
        icon: FaFire,
        status: 'IN PROGRESS',
        accent: 'text-[#6366f1] dark:text-[#a855f7]'
      };
    } else {
      return {
        color: 'gray',
        gradient: 'from-gray-500 to-gray-600',
        bg: 'from-gray-50/50 via-white to-gray-50/30 dark:from-white/5 dark:via-white/5 dark:to-white/5',
        border: 'border-gray-200/50 dark:border-white/10',
        progressBg: 'bg-gray-400',
        progressColor: 'text-gray-600 dark:text-gray-400',
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
      {/* Section Header - RESPONSIVE LAYOUT */}
      <div 
        className={`
          p-3 sm:p-4 md:p-6 border backdrop-blur-md
          shadow-lg transition-all duration-300 ease-out hover:shadow-xl
          relative overflow-hidden group
          ${isExpanded 
            ? 'rounded-t-2xl border-b-0' 
            : 'rounded-2xl hover:scale-[1.01]'
          }
          bg-gradient-to-r ${statusConfig.bg}
          ${statusConfig.border}
          ${deleting ? 'opacity-70 pointer-events-none' : ''}
          ${editing ? '' : 'cursor-pointer'}
        `}
      >
        
        {/* Admin Controls */}
        {canManageSheets && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddSubsection(true);
                }}
                disabled={deleting}
                className="p-1 sm:p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add Subsection"
              >
                <FaPlus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSectionInternal();
                }}
                disabled={deleting}
                className="p-1 sm:p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Section"
              >
                {deleting ? (
                  <FaSpinner className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                ) : (
                  <FaTrash className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* MOBILE LAYOUT (sm and below) - COMPACT VERSION */}
        <div className="sm:hidden" onClick={handleExpansionClick}>
          {/* Title Row with Chevron */}
          <div className="flex items-center space-x-2 mb-3">
            {/* Expand/Collapse Button */}
            <div className="flex items-center justify-center w-6 h-6">
              {isExpanded ? (
                <FaChevronDown className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#a855f7]" />
              ) : (
                <FaChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            
            {/* Section Title - Mobile */}
            <div className="flex-1 min-w-0">
              {canManageSheets ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <InlineEditableText
                    value={section.name}
                    onSave={(value) => handleUpdateSectionInternal('name', value)}
                    placeholder="Section name"
                    isEditable={canManageSheets}
                    disabled={deleting}
                    className="text-base font-bold leading-tight truncate"
                  />
                </div>
              ) : (
                <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight truncate">
                  {section.name}
                </h2>
              )}
            </div>
          </div>
          
          {/* Progress Bar Row */}
          <div className="ml-8">
            <div className="relative mb-2">
              {/* Progress Bar - GREEN COLOR */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ease-out ${statusConfig.progressBg}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              {/* Progress Numbers - At the end of bar - GREEN COLOR */}
              <div className={`absolute -right-1 -top-6 text-sm font-bold ${statusConfig.progressColor}`}>
                {progress.completed}/{progress.total}
              </div>
            </div>
            
            {/* Section Info */}
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {section.subsections?.length || 0} subsections • {progress.total} problems
            </p>
          </div>
        </div>

        {/* DESKTOP LAYOUT (sm and above) */}
        <div className="hidden sm:flex justify-between items-center" onClick={handleExpansionClick}>
          {/* Left Section */}
          <div className="flex items-center gap-4 z-10 relative">
            {/* Modern Expand/Collapse Icon */}
            <div className="flex items-center justify-center w-8 h-8 transition-all duration-300 ease-out group-hover:scale-110">
              {isExpanded ? (
                <FaChevronDown className="w-5 h-5 text-[#6366f1] dark:text-[#a855f7] transition-all duration-300 ease-out" />
              ) : (
                <FaChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-all duration-300 ease-out group-hover:text-[#6366f1] dark:group-hover:text-[#a855f7]" />
              )}
            </div>
            
            {/* Section Info */}
            <div className="min-w-0 flex-1">
              {canManageSheets ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <InlineEditableText
                    value={section.name}
                    onSave={(value) => handleUpdateSectionInternal('name', value)}
                    placeholder="Section name"
                    isEditable={canManageSheets}
                    disabled={deleting}
                    className="text-lg sm:text-2xl font-bold tracking-tight"
                  />
                </div>
              ) : (
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                  {section.name}
                </h2>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2 flex-wrap">
                <span>{section.subsections?.length || 0} subsections</span>
                <span className="hidden sm:inline">•</span>
                <span>{progress.total} problems</span>
              </p>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-4 sm:gap-6 z-10 relative">
            
            {/* Circular Progress - GREEN COLOR */}
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
                {/* Progress circle - GREEN COLOR */}
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${percentage}, 100`}
                  className={`transition-all duration-1000 ease-out ${statusConfig.progressColor}`}
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
        </div>

        {/* Completion Badge */}
        {percentage === 100 && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 animate-bounce z-30">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg flex items-center gap-1">
              <FaTrophy className="w-3 h-3" />
              <span className="hidden sm:inline">Done</span>
            </div>
          </div>
        )}

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/0 via-[#6366f1]/2 to-[#6366f1]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Add Subsection Form */}
      {showAddSubsection && canManageSheets && !deleting && (
        <div className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-x border-green-200/50 dark:border-green-500/30">
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
            {section.subsections && section.subsections.length > 0 ? (
              section.subsections.map((subsection, index) => (
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
                    onRefresh={onRefresh}
                    canManageSheets={canManageSheets}
                    problemsMap={problemsMap} 
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-6">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  No subsections yet.
                </div>
                {canManageSheets && (
                  <button
                    onClick={() => setShowAddSubsection(true)}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg flex items-center gap-2 mx-auto"
                  >
                    <FaPlus className="w-4 h-4" />
                    Add First Subsection
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionView;
