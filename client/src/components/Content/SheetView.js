import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProgress } from '../../context/ProgressContext';
import { sheetAPI, problemAPI } from '../../services/api';
import SectionView from './SectionView';
import toast from 'react-hot-toast';
import { 
  FaTrophy, 
  FaFire, 
  FaClock, 
  FaChartBar, 
  FaCode,
  FaBookOpen,
  FaGraduationCap,
  FaStar,
  FaSpinner,
  FaExclamationTriangle,
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes
} from 'react-icons/fa';


// ============= INLINE EDITABLE TEXT COMPONENT =============
const InlineEditableText = ({ 
  value, 
  onSave, 
  placeholder = "Click to edit", 
  multiline = false, 
  isEditable = true,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTempValue(value || '');
  }, [value]);

  const startEdit = () => {
    if (isEditable) {
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
        toast.success('Sheet updated successfully!');
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

  if (!isEditable) {
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
            className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm resize-none disabled:opacity-50"
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
            className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50"
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
      className={`group cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg px-2 sm:px-3 py-1 sm:py-2 transition-colors duration-200 ${className}`}
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


// ============= ADD SECTION FORM COMPONENT =============
const AddSectionForm = ({ onSubmit, onCancel }) => {
  const [sectionName, setSectionName] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sectionName.trim()) {
      toast.error('Please enter a section name');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        name: sectionName.trim(),
        description: sectionDescription.trim()
      });
      setSectionName('');
      setSectionDescription('');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to add section. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-6 md:mb-8 p-4 md:p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-500/30">
      <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
          <FaPlus className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
          Add New Section
        </h3>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section Name *
            </label>
            <input
              type="text"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 text-sm md:text-base"
              required
              placeholder="Enter section name"
              autoFocus
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={sectionDescription}
              onChange={(e) => setSectionDescription(e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 text-sm md:text-base"
              placeholder="Optional description"
              disabled={submitting}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-4 md:mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            <FaTimes className="w-3 h-3 md:w-4 md:h-4" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={submitting || !sectionName.trim()}
            className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            {submitting ? (
              <>
                <FaSpinner className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <FaSave className="w-3 h-3 md:w-4 md:h-4" />
                <span>Add Section</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};


// ============= MAIN SHEET VIEW COMPONENT =============
const SheetView = ({ sheetId, onBack }) => {
  const { user, canManageSheets } = useAuth();
  const { stats, getSheetDifficultyProgress, refreshStats } = useProgress();
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [problemsMap, setProblemsMap] = useState({});
  const [loadingProblems, setLoadingProblems] = useState(false);

  useEffect(() => {
    if (sheetId) {
      loadSheet();
    }
  }, [sheetId]);

  // ✅ REMOVED CACHING - Direct API call with real-time data
  const loadSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Direct API call - No caching
      const response = await sheetAPI.getById(sheetId);
      const sheetData = response.data?.sheet;
      
      if (!sheetData) {
        throw new Error('Sheet not found');
      }
      
      setSheet(sheetData);
      
      // ✅ Load problems immediately in background
      loadSheetProblems(sheetData);
      
      if (refreshStats) {
        refreshStats();
      }
    } catch (error) {
      console.error('Error loading sheet:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load sheet');
      toast.error('Failed to load sheet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ REMOVED CACHING - Load all problems in one batch call (no cache)
  const loadSheetProblems = async (sheetData) => {
    try {
      setLoadingProblems(true);
      
      // Collect all unique problem IDs
      const allProblemIds = new Set();
      sheetData.sections?.forEach(section => {
        section.subsections?.forEach(subsection => {
          subsection.problemIds?.forEach(id => allProblemIds.add(id));
        });
      });

      if (allProblemIds.size === 0) {
        setProblemsMap({});
        setLoadingProblems(false);
        return;
      }

      // ✅ Direct BATCH API CALL - No caching
      const response = await problemAPI.getBatch(Array.from(allProblemIds));
      const problems = response.data?.problems || [];
      
      // Create problems map
      const problemsMapData = {};
      problems.forEach(problem => {
        if (problem && problem.id) {
          problemsMapData[problem.id] = problem;
        }
      });
      
      setProblemsMap(problemsMapData);
      
    } catch (error) {
      console.error('Error loading sheet problems:', error);
      // Don't show error toast, not critical
    } finally {
      setLoadingProblems(false);
    }
  };

  const handleUpdateSheet = async (field, value) => {
    if (!canManageSheets) return;
    
    try {
      await sheetAPI.update(sheetId, { [field]: value });
      setSheet(prev => ({
        ...prev,
        [field]: value
      }));
      // ✅ Direct refresh - No cache clearing needed
    } catch (error) {
      console.error('Error updating sheet:', error);
      toast.error('Failed to update sheet. Please try again.');
      throw error;
    }
  };

  const handleAddSection = async (sectionData) => {
    if (!canManageSheets) return;
    
    const response = await sheetAPI.addSection(sheetId, sectionData);
    const newSection = response.data?.section || {
      id: Date.now().toString(),
      ...sectionData,
      subsections: []
    };
    
    setSheet(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
    
    setShowAddSection(false);
    // ✅ Direct refresh - No cache clearing needed
    toast.success('Section added successfully!');
  };

  const handleUpdateSection = async (sectionId, field, value) => {
    if (!canManageSheets) return;
    
    try {
      await sheetAPI.updateSection(sheetId, sectionId, { [field]: value });
      setSheet(prev => ({
        ...prev,
        sections: prev.sections.map(section => 
          section.id === sectionId 
            ? { ...section, [field]: value }
            : section
        )
      }));
      // ✅ Direct refresh - No cache clearing needed
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error('Failed to update section. Please try again.');
      throw error;
    }
  };

  const handleDeleteSection = async (sectionId, sectionName) => {
    if (!canManageSheets) return;
    
    try {
      await sheetAPI.deleteSection(sheetId, sectionId);
      setSheet(prev => ({
        ...prev,
        sections: prev.sections.filter(section => section.id !== sectionId)
      }));
      
      // ✅ Direct refresh - No cache clearing needed
      toast.success(`Section "${sectionName}" deleted successfully!`);
      
      // Reload problems after section deletion
      if (sheet) {
        loadSheetProblems(sheet);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section. Please try again.');
    }
  };

  const handleAddSubsection = async (sectionId, subsectionData) => {
    if (!canManageSheets) return;
    
    const response = await sheetAPI.addSubsection(sheetId, sectionId, subsectionData);
    const newSubsection = response.data?.subsection || {
      id: Date.now().toString(),
      ...subsectionData,
      problemIds: []
    };
    
    setSheet(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              subsections: [...(section.subsections || []), newSubsection]
            }
          : section
      )
    }));
    
    // ✅ Direct refresh - No cache clearing needed
  };

  const handleUpdateSubsection = async (sectionId, subsectionId, field, value) => {
    if (!canManageSheets) return;
    
    try {
      await sheetAPI.updateSubsection(sheetId, sectionId, subsectionId, { [field]: value });
      setSheet(prev => ({
        ...prev,
        sections: prev.sections.map(section => 
          section.id === sectionId 
            ? {
                ...section,
                subsections: section.subsections.map(subsection =>
                  subsection.id === subsectionId
                    ? { ...subsection, [field]: value }
                    : subsection
                )
              }
            : section
        )
      }));
      // ✅ Direct refresh - No cache clearing needed
    } catch (error) {
      console.error('Error updating subsection:', error);
      toast.error('Failed to update subsection. Please try again.');
      throw error;
    }
  };

  const handleDeleteSubsection = async (sectionId, subsectionId, subsectionName) => {
    if (!canManageSheets) return;
    
    try {
      await sheetAPI.deleteSubsection(sheetId, sectionId, subsectionId);
      setSheet(prev => ({
        ...prev,
        sections: prev.sections.map(section => 
          section.id === sectionId 
            ? {
                ...section,
                subsections: section.subsections.filter(subsection => subsection.id !== subsectionId)
              }
            : section
        )
      }));
      
      // ✅ Direct refresh - No cache clearing needed
      toast.success(`Subsection "${subsectionName}" deleted successfully!`);
      
      // Reload problems after subsection deletion
      if (sheet) {
        loadSheetProblems(sheet);
      }
    } catch (error) {
      console.error('Error deleting subsection:', error);
      toast.error('Failed to delete subsection. Please try again.');
    }
  };

  const getSheetProgress = () => {
    if (!sheet) return { completed: 0, total: 0 };
    
    const totalProblems = sheet.sections.reduce((total, section) => {
      return total + section.subsections.reduce((sectionTotal, subsection) => {
        return sectionTotal + (subsection.problemIds?.length || 0);
      }, 0);
    }, 0);

    const completedProblems = stats.sheetStats?.[sheet.id] || 0;
    return { completed: completedProblems, total: totalProblems };
  };

  const getDifficultyBreakdown = () => {
    if (!sheet) return { 
      Easy: { completed: 0, total: 0 }, 
      Medium: { completed: 0, total: 0 }, 
      Hard: { completed: 0, total: 0 } 
    };
    
    const breakdown = { 
      Easy: { completed: 0, total: 0 }, 
      Medium: { completed: 0, total: 0 }, 
      Hard: { completed: 0, total: 0 } 
    };
    
    // Calculate totals from the problems map
    sheet.sections.forEach(section => {
      section.subsections?.forEach(subsection => {
        subsection.problemIds?.forEach(problemId => {
          const problem = problemsMap[problemId];
          if (problem && problem.difficulty) {
            const difficulty = problem.difficulty;
            if (breakdown[difficulty]) {
              breakdown[difficulty].total++;
            }
          }
        });
      });
    });
    
    // Get completed counts from ProgressContext
    if (getSheetDifficultyProgress) {
      breakdown.Easy.completed = getSheetDifficultyProgress(sheet.id, 'Easy');
      breakdown.Medium.completed = getSheetDifficultyProgress(sheet.id, 'Medium');
      breakdown.Hard.completed = getSheetDifficultyProgress(sheet.id, 'Hard');
    }
    
    return breakdown;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <FaSpinner className="w-6 h-6 md:w-8 md:h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Loading sheet...</p>
        </div>
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="text-red-500 mb-4">
            <FaExclamationTriangle className="w-12 h-12 md:w-16 md:h-16 mx-auto" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sheet Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm md:text-base">
            {error || 'The requested sheet could not be found.'}
          </p>
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 mx-auto text-sm md:text-base"
          >
            <FaArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            <span>Back to Sheets</span>
          </button>
        </div>
      </div>
    );
  }

  const progress = getSheetProgress();
  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const difficultyBreakdown = getDifficultyBreakdown();

  const getStatusConfig = () => {
    if (percentage === 100) {
      return {
        color: 'text-green-600 dark:text-green-400',
        bgGradient: 'from-green-500 to-green-600',
        icon: FaTrophy,
        message: 'Congratulations! Sheet completed! 🎉'
      };
    } else if (percentage >= 75) {
      return {
        color: 'text-orange-600 dark:text-orange-400',
        bgGradient: 'from-orange-500 to-orange-600',
        icon: FaFire,
        message: 'Almost there! Keep going! 🔥'
      };
    } else if (percentage > 0) {
      return {
        color: 'text-[#6366f1] dark:text-[#a855f7]',
        bgGradient: 'from-[#6366f1] to-[#a855f7]',
        icon: FaStar,
        message: 'Great progress! Keep it up! ⭐'
      };
    } else {
      return {
        color: 'text-gray-600 dark:text-gray-400',
        bgGradient: 'from-gray-500 to-gray-600',
        icon: FaClock,
        message: 'Ready to start your journey? 🚀'
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-[#030014] dark:via-slate-900 dark:to-purple-900 py-6 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8">
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden dark:block hidden">
        <div className="absolute top-10 left-10 w-48 h-48 md:w-72 md:h-72 bg-[#6366f1]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-48 h-48 md:w-72 md:h-72 bg-[#a855f7]/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Back Button */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm md:text-base p-2 -m-2"
          >
            <FaArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            <span>Back to Sheets</span>
          </button>
        </div>
        
        {/* Sheet Header */}
        <div className="mb-6 md:mb-8 p-4 md:p-6 lg:p-8 bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-xl border border-gray-200/50 dark:border-white/10 relative overflow-hidden">
          
          <div className="relative z-10">
            
            {/* Title Section */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4 md:mb-6">
                <div className="flex items-start space-x-3 md:space-x-4 flex-1">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-xl md:rounded-2xl shadow-lg flex items-center justify-center flex-shrink-0">
                    <FaBookOpen className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {canManageSheets ? (
                      <InlineEditableText
                        value={sheet.name}
                        onSave={(value) => handleUpdateSheet('name', value)}
                        placeholder="Sheet name"
                        isEditable={canManageSheets}
                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tight"
                      />
                    ) : (
                      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                        {sheet.name}
                      </h1>
                    )}
                    {canManageSheets && sheet.description ? (
                      <InlineEditableText
                        value={sheet.description}
                        onSave={(value) => handleUpdateSheet('description', value)}
                        placeholder="Add description..."
                        multiline={true}
                        isEditable={canManageSheets}
                        className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 mt-1 md:mt-2 leading-relaxed"
                      />
                    ) : sheet.description ? (
                      <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 mt-1 md:mt-2 leading-relaxed">
                        {sheet.description}
                      </p>
                    ) : canManageSheets ? (
                      <InlineEditableText
                        value=""
                        onSave={(value) => handleUpdateSheet('description', value)}
                        placeholder="Add description..."
                        multiline={true}
                        isEditable={canManageSheets}
                        className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 mt-1 md:mt-2 leading-relaxed"
                      />
                    ) : null}
                  </div>
                </div>
                
                {/* Add Section Button */}
                {canManageSheets && (
                  <button
                    onClick={() => setShowAddSection(!showAddSection)}
                    className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 text-sm md:text-base"
                  >
                    <FaPlus className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Add Section</span>
                  </button>
                )}
              </div>
              
              {/* Status Message */}
              <div className="inline-flex items-center space-x-2 bg-gray-50/80 dark:bg-white/5 backdrop-blur-sm px-3 md:px-4 py-2 rounded-xl border border-gray-200/50 dark:border-white/10">
                <StatusIcon className={`w-3 h-3 md:w-4 md:h-4 ${statusConfig.color}`} />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {statusConfig.message}
                </span>
              </div>
            </div>
            
            {/* Progress Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
              
              {/* Total Progress Section */}
              <div className="bg-gray-50/80 dark:bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200/50 dark:border-white/10">
                <div className="flex items-center space-x-4 md:space-x-6">
                  
                  {/* Circular Progress */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-gray-200 dark:text-gray-600"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${percentage}, 100`}
                        className={`transition-all duration-1000 ease-out ${statusConfig.color}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm sm:text-base md:text-lg lg:text-xl font-bold ${statusConfig.color}`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Details */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FaChartBar className="w-3 h-3 md:w-4 md:h-4 text-[#6366f1]" />
                      <span className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Total Progress
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {progress.completed} / {progress.total}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Problems completed
                    </div>
                  </div>
                </div>
              </div>

              {/* Difficulty Breakdown */}
              <div className="bg-gray-50/80 dark:bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200/50 dark:border-white/10">
                <div className="flex items-center space-x-2 mb-4">
                  <FaGraduationCap className="w-3 h-3 md:w-4 md:h-4 text-[#a855f7]" />
                  <span className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Difficulty Breakdown
                  </span>
                  {loadingProblems && (
                    <FaSpinner className="w-3 h-3 animate-spin text-gray-400" />
                  )}
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  {/* Easy */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400">Easy</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white">
                        {difficultyBreakdown.Easy.completed} / {difficultyBreakdown.Easy.total}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {difficultyBreakdown.Easy.total > 0 ? Math.round((difficultyBreakdown.Easy.completed / difficultyBreakdown.Easy.total) * 100) : 0}%
                      </div>
                    </div>
                  </div>

                  {/* Medium */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400">Medium</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white">
                        {difficultyBreakdown.Medium.completed} / {difficultyBreakdown.Medium.total}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {difficultyBreakdown.Medium.total > 0 ? Math.round((difficultyBreakdown.Medium.completed / difficultyBreakdown.Medium.total) * 100) : 0}%
                      </div>
                    </div>
                  </div>

                  {/* Hard */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-400">Hard</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white">
                        {difficultyBreakdown.Hard.completed} / {difficultyBreakdown.Hard.total}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {difficultyBreakdown.Hard.total > 0 ? Math.round((difficultyBreakdown.Hard.completed / difficultyBreakdown.Hard.total) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Completion Badge */}
          {percentage === 100 && (
            <div className="absolute top-2 right-2 md:top-4 md:right-4 animate-bounce">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg flex items-center space-x-1">
                <FaTrophy className="w-2 h-2 md:w-3 md:h-3" />
                <span className="hidden sm:inline">Completed</span>
                <span className="sm:hidden">✓</span>
              </div>
            </div>
          )}
        </div>

        {/* Add Section Form */}
        {showAddSection && canManageSheets && (
          <AddSectionForm
            onSubmit={handleAddSection}
            onCancel={() => setShowAddSection(false)}
          />
        )}

        {/* Sections Container */}
        {sheet.sections && sheet.sections.length > 0 ? (
          <div className="space-y-1 md:space-y-2">
            {sheet.sections.map(section => (
              <SectionView
                key={section.id}
                section={section}
                sheetId={sheet.id}
                onUpdateSection={handleUpdateSection}
                onDeleteSection={handleDeleteSection}
                onAddSubsection={handleAddSubsection}
                onUpdateSubsection={handleUpdateSubsection}
                onDeleteSubsection={handleDeleteSubsection}
                onRefresh={loadSheet}
                canManageSheets={canManageSheets}
                problemsMap={problemsMap}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12 px-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCode className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-2">No sections available</h3>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
              {canManageSheets ? 'This sheet is empty. Click "Add Section" to get started!' : 'This sheet is currently being prepared. Check back later!'}
            </p>
            {canManageSheets && (
              <button
                onClick={() => setShowAddSection(true)}
                className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 mx-auto text-sm md:text-base"
              >
                <FaPlus className="w-3 h-3 md:w-4 md:h-4" />
                <span>Add Your First Section</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetView;
