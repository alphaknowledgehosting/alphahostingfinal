import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProgress } from '../../context/ProgressContext';
import { sheetAPI } from '../../services/api';
import ProgressBar from '../Common/ProgressBar';
import toast from 'react-hot-toast';
import { 
  FaFolder, 
  FaCode, 
  FaChevronRight, 
  FaSpinner,
  FaExclamationTriangle,
  FaArrowRight, 
  FaTrophy, 
  FaFolderOpen, 
  FaListAlt,
  FaFire,
  FaStar,
  FaBrain,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes
} from 'react-icons/fa';

// Inline Editable Component
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

// Add Sheet Form Component
const AddSheetForm = ({ onSubmit, onCancel }) => {
  const [newSheet, setNewSheet] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newSheet.name.trim()) {
      toast.error('Please enter a sheet name');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(newSheet);
      setNewSheet({ name: '', description: '' });
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to add sheet. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-8 p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-500/30">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
          <FaPlus className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Add New Sheet
        </h3>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sheet Name *
            </label>
            <input
              type="text"
              value={newSheet.name}
              onChange={(e) => setNewSheet(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              required
              placeholder="Enter sheet name"
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
              value={newSheet.description}
              onChange={(e) => setNewSheet(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              placeholder="Optional description"
              disabled={submitting}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
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
            disabled={submitting || !newSheet.name.trim()}
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
                <span>Add Sheet</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const SheetList = ({ onSheetSelect }) => {
  const { user, canManageSheets } = useAuth();
  const { stats } = useProgress();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sheetAPI.getAll();
      const sheetsData = response.data?.sheets || [];
      
      setSheets(sheetsData);
    } catch (error) {
      console.error('Error loading sheets:', error);
      setError('Failed to load sheets. Please try again.');
      toast.error('Failed to load sheets. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSheet = async (sheetData) => {
    if (!canManageSheets) return;
    
    await sheetAPI.create(sheetData);
    setShowAddSheet(false);
    await loadSheets();
    toast.success('Sheet created successfully!');
  };

  const handleUpdateSheet = async (sheetId, field, value) => {
    if (!canManageSheets) return;
    
    await sheetAPI.update(sheetId, { [field]: value });
    await loadSheets();
  };

  const handleDeleteSheet = async (sheetId, sheetName) => {
    if (!canManageSheets) return;
    
    if (!window.confirm(`Are you sure you want to delete "${sheetName}"? This will delete all sections, subsections, problems, and user progress associated with this sheet.`)) {
      return;
    }

    try {
      setDeletingId(sheetId);
      await sheetAPI.delete(sheetId);
      await loadSheets();
      toast.success(`Sheet "${sheetName}" deleted successfully!`);
    } catch (error) {
      console.error('Error deleting sheet:', error);
      toast.error('Failed to delete sheet. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getSheetProgress = (sheetId, sheet) => {
    const totalProblems = sheet.sections.reduce((total, section) => {
      return total + section.subsections.reduce((sectionTotal, subsection) => {
        return sectionTotal + subsection.problems.length;
      }, 0);
    }, 0);

    const completedProblems = stats.sheetStats?.[sheetId] || 0;
    return { completed: completedProblems, total: totalProblems };
  };

  const handleSheetSelect = (sheetId) => {
    onSheetSelect(sheetId);
  };

  const getDifficultyStats = (sheet) => {
    let easy = 0, medium = 0, hard = 0;
    sheet.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        subsection.problems.forEach(problem => {
          switch(problem.difficulty?.toLowerCase()) {
            case 'easy': easy++; break;
            case 'medium': medium++; break;
            case 'hard': hard++; break;
          }
        });
      });
    });
    return { easy, medium, hard };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-[#030014] dark:via-slate-900 dark:to-purple-900 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden dark:block hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#6366f1]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#a855f7]/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="text-center relative z-10">
          <FaSpinner className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading sheets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-[#030014] dark:via-slate-900 dark:to-purple-900 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden dark:block hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#6366f1]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#a855f7]/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="text-center relative z-10">
          <FaExclamationTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadSheets}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-[#030014] dark:via-slate-900 dark:to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden dark:block hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-[#6366f1]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#a855f7]/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-2xl shadow-lg">
              <FaBrain className="w-8 h-8 text-white" />
            </div>
            {canManageSheets && (
              <button
                onClick={() => setShowAddSheet(!showAddSheet)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
              >
                <FaPlus className="w-4 h-4" />
                <span>Add Sheet</span>
              </button>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Choose Your DSA Journey
          </h2>
          <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
            Master data structures and algorithms with carefully curated problem sets
          </p>
        </div>

        {/* Add Sheet Form */}
        {showAddSheet && canManageSheets && (
          <AddSheetForm
            onSubmit={handleAddSheet}
            onCancel={() => setShowAddSheet(false)}
          />
        )}
        
        {/* Sheets Grid */}
        {sheets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaListAlt className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sheets available</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {canManageSheets ? 'Click "Add Sheet" to create the first one!' : 'Check back later for new problem sets!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {sheets.map(sheet => {
              const progress = getSheetProgress(sheet.id, sheet);
              const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
              const difficultyStats = getDifficultyStats(sheet);
              const isDeleting = deletingId === sheet.id;
              
              return (
                <div
                  key={sheet.id}
                  className={`group relative bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 dark:border-white/10 cursor-pointer transition-all duration-500 ease-out hover:shadow-2xl dark:hover:shadow-[#6366f1]/10 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden ${
                    isDeleting ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  
                  {/* Admin Controls */}
                  {canManageSheets && (
                    <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSheet(sheet.id, sheet.name);
                          }}
                          disabled={isDeleting}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Sheet"
                        >
                          {isDeleting ? (
                            <FaSpinner className="w-3 h-3 animate-spin" />
                          ) : (
                            <FaTrash className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="relative p-6 sm:p-8 h-full flex flex-col" onClick={() => handleSheetSelect(sheet.id)}>
                    
                    {/* Sheet Header */}
                    <div className="mb-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <FaCode className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            {canManageSheets ? (
                              <InlineEditableText
                                value={sheet.name}
                                onSave={(value) => handleUpdateSheet(sheet.id, 'name', value)}
                                placeholder="Sheet name"
                                isEditable={canManageSheets && !isDeleting}
                                className="text-xl sm:text-2xl font-bold leading-tight"
                              />
                            ) : (
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                {sheet.name}
                              </h3>
                            )}
                          </div>
                        </div>
                        
                        <FaArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-[#6366f1] group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      
                      {canManageSheets ? (
                        <InlineEditableText
                          value={sheet.description}
                          onSave={(value) => handleUpdateSheet(sheet.id, 'description', value)}
                          placeholder="Add description..."
                          multiline={true}
                          isEditable={canManageSheets && !isDeleting}
                          className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2"
                        />
                      ) : (
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                          {sheet.description || `Master data structures and algorithms with ${progress.total} carefully curated problems`}
                        </p>
                      )}
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-gray-50/80 dark:bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-white/10">
                        <div className="flex items-center space-x-2">
                          <FaListAlt className="w-4 h-4 text-[#6366f1]" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {progress.total}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Problems</p>
                      </div>
                      
                      <div className="bg-gray-50/80 dark:bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-white/10">
                        <div className="flex items-center space-x-2">
                          <FaFolderOpen className="w-4 h-4 text-[#a855f7]" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {sheet.sections.length}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Sections</p>
                      </div>
                    </div>

                    {/* Difficulty Distribution */}
                    {(difficultyStats.easy > 0 || difficultyStats.medium > 0 || difficultyStats.hard > 0) && (
                      <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Difficulty Distribution</p>
                        <div className="flex space-x-2">
                          {difficultyStats.easy > 0 && (
                            <div className="flex items-center space-x-1 bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg text-xs font-medium">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span>{difficultyStats.easy}</span>
                            </div>
                          )}
                          {difficultyStats.medium > 0 && (
                            <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg text-xs font-medium">
                              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                              <span>{difficultyStats.medium}</span>
                            </div>
                          )}
                          {difficultyStats.hard > 0 && (
                            <div className="flex items-center space-x-1 bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-1 rounded-lg text-xs font-medium">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              <span>{difficultyStats.hard}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress Section */}
                    <div className="mt-auto">
                      <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-white/5 dark:to-white/10 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Progress</span>
                          <div className="flex items-center space-x-2">
                            {percentage >= 75 ? (
                              <FaFire className="w-4 h-4 text-orange-500" />
                            ) : percentage > 0 ? (
                              <FaStar className="w-4 h-4 text-[#6366f1]" />
                            ) : null}
                            <span className={`text-sm font-bold ${
                              percentage === 100 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-[#6366f1] dark:text-[#a855f7]'
                            }`}>
                              {progress.completed} / {progress.total}
                            </span>
                          </div>
                        </div>
                        
                        <ProgressBar
                          completed={progress.completed}
                          total={progress.total}
                          label=""
                          variant="minimal"
                          color={percentage === 100 ? "green" : "blue"}
                          size="sm"
                          showLabels={false}
                          animated={true}
                        />
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {percentage}% Complete
                          </span>
                          {percentage === 100 && (
                            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                              <FaTrophy className="w-3 h-3" />
                              <span className="text-xs font-bold">COMPLETED</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Completion Badge */}
                    {percentage === 100 && (
                      <div className="absolute -top-2 -right-2 animate-bounce">
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg transform rotate-12 flex items-center space-x-1">
                          <FaTrophy className="w-3 h-3" />
                          <span>Done</span>
                        </div>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/0 via-[#6366f1]/5 to-[#a855f7]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetList;
