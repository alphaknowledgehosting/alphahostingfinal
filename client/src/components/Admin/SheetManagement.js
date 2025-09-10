import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { sheetAPI } from '../../services/api';
import InlineProblemEditor from './InlineProblemEditor';
import toast from 'react-hot-toast';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSave, 
  FaTimes,
  FaFolder,
  FaFolderOpen,
  FaChevronDown,
  FaChevronRight,
  FaSync,
  FaExternalLinkAlt,
  FaYoutube,
  FaBook,
  FaFileAlt,
  FaArrowLeft,
  FaSpinner,
  FaGraduationCap
} from 'react-icons/fa';
import { BookOpen, FileText, Plus } from 'lucide-react';

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
        toast.success(`${multiline ? 'Description' : 'Name'} updated successfully!`);
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

// Add Item Form Component
const AddItemForm = ({ 
  onSubmit, 
  onCancel, 
  placeholder = "Enter name...", 
  buttonText = "Add",
  value,
  onChange,
  multiFields = false,
  fields = {}
}) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (multiFields) {
      if (Object.values(fields).some(field => field.required && !field.value?.trim())) {
        toast.error('Please fill in all required fields');
        return;
      }
    } else {
      if (!value?.trim()) {
        toast.error('Please enter a value');
        return;
      }
    }

    try {
      setSubmitting(true);
      if (multiFields) {
        await onSubmit(fields);
      } else {
        await onSubmit(value);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(`Failed to ${buttonText.toLowerCase()}: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3 md:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-600 mb-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {multiFields ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(fields).map(([key, field]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.label} {field.required && '*'}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    rows={2}
                    required={field.required}
                    disabled={submitting}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    required={field.required}
                    disabled={submitting}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            autoFocus
            required
            disabled={submitting}
          />
        )}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTimes className="w-3 h-3" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <FaSpinner className="w-3 h-3 animate-spin" />
                <span>{buttonText}ing...</span>
              </>
            ) : (
              <>
                <FaPlus className="w-3 h-3" />
                <span>{buttonText}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const SheetManagement = () => {
  const { user, canManageSheets, canAddEditorials } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubsection, setSelectedSubsection] = useState(null);
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [addingSection, setAddingSection] = useState({});
  const [addingSubsection, setAddingSubsection] = useState({});
  const [deletingIds, setDeletingIds] = useState(new Set());

  const [newSheet, setNewSheet] = useState({ name: '', description: '' });
  const [newSectionName, setNewSectionName] = useState('');
  const [newSubsectionName, setNewSubsectionName] = useState('');
  const [newProblem, setNewProblem] = useState({
    title: '',
    practiceLink: '',
    platform: '',
    youtubeLink: '',
    editorialLink: '',
    notesLink: '',
    difficulty: 'Easy'
  });

  useEffect(() => {
    if (canManageSheets) {
      loadSheets();
    }
  }, [canManageSheets]);

  const loadSheets = async () => {
    try {
      setLoading(true);
      const response = await sheetAPI.getAll();
      const sheetsData = response.data?.sheets || [];
      setSheets(sheetsData);
    } catch (error) {
      console.error('Error loading sheets:', error);
      toast.error(`Failed to load sheets: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshSheets = async () => {
    try {
      setRefreshing(true);
      await loadSheets();
    } finally {
      setRefreshing(false);
    }
  };

  // Sheet Operations
  const handleAddSheet = async (fields) => {
    if (!canManageSheets) return;
    
    await sheetAPI.create({
      name: fields.name.value,
      description: fields.description.value
    });
    
    setShowAddSheet(false);
    setNewSheet({ name: '', description: '' });
    await refreshSheets();
    toast.success('Sheet created successfully!');
  };

  const handleUpdateSheet = async (sheetId, field, value) => {
    await sheetAPI.update(sheetId, { [field]: value });
    await refreshSheets();
  };

  const handleDeleteSheet = async (sheetId, sheetName) => {
    if (!window.confirm(`Are you sure you want to delete "${sheetName}"? This will delete all sections, subsections, problems, and user progress associated with this sheet.`)) {
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(sheetId));
      await sheetAPI.delete(sheetId);
      await refreshSheets();
      toast.success(`Sheet "${sheetName}" deleted successfully!`);
    } catch (error) {
      console.error('Error deleting sheet:', error);
      toast.error(`Failed to delete sheet: ${error.response?.data?.message || error.message}`);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(sheetId);
        return newSet;
      });
    }
  };

  // Section Operations
  const handleAddSection = async (sheetId, sectionName) => {
    if (!sectionName?.trim()) return;
    
    await sheetAPI.addSection(sheetId, { name: sectionName.trim() });
    setAddingSection(prev => ({ ...prev, [sheetId]: false }));
    setNewSectionName('');
    await refreshSheets();
    toast.success('Section added successfully!');
  };

  const handleUpdateSection = async (sheetId, sectionId, field, value) => {
    await sheetAPI.updateSection(sheetId, sectionId, { [field]: value });
    await refreshSheets();
  };

  const handleDeleteSection = async (sheetId, sectionId, sectionName) => {
    if (!window.confirm(`Are you sure you want to delete section "${sectionName}"? This will delete all subsections, problems, and user progress in this section.`)) {
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(sectionId));
      await sheetAPI.deleteSection(sheetId, sectionId);
      await refreshSheets();
      toast.success(`Section "${sectionName}" deleted successfully!`);
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error(`Failed to delete section: ${error.response?.data?.message || error.message}`);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });
    }
  };

  // Subsection Operations
  const handleAddSubsection = async (sheetId, sectionId, subsectionName) => {
    if (!subsectionName?.trim()) return;
    
    await sheetAPI.addSubsection(sheetId, sectionId, { name: subsectionName.trim() });
    setAddingSubsection(prev => ({ ...prev, [`${sheetId}_${sectionId}`]: false }));
    setNewSubsectionName('');
    await refreshSheets();
    toast.success('Subsection added successfully!');
  };

  const handleUpdateSubsection = async (sheetId, sectionId, subsectionId, field, value) => {
    await sheetAPI.updateSubsection(sheetId, sectionId, subsectionId, { [field]: value });
    await refreshSheets();
  };

  const handleDeleteSubsection = async (sheetId, sectionId, subsectionId, subsectionName) => {
    if (!window.confirm(`Are you sure you want to delete subsection "${subsectionName}"? This will delete all problems and user progress in this subsection.`)) {
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(subsectionId));
      await sheetAPI.deleteSubsection(sheetId, sectionId, subsectionId);
      await refreshSheets();
      toast.success(`Subsection "${subsectionName}" deleted successfully!`);
    } catch (error) {
      console.error('Error deleting subsection:', error);
      toast.error(`Failed to delete subsection: ${error.response?.data?.message || error.message}`);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(subsectionId);
        return newSet;
      });
    }
  };

  // Problem Operations
  const handleManageProblems = (sheetId, sectionId, subsectionId, subsectionName) => {
    setSelectedSubsection({ sheetId, sectionId, subsectionId, subsectionName });
  };

  const handleAddProblem = async (formData) => {
    if (!selectedSubsection || !formData.title.trim()) return;
    
    await sheetAPI.addProblem(
      selectedSubsection.sheetId,
      selectedSubsection.sectionId,
      selectedSubsection.subsectionId,
      formData
    );
    
    setNewProblem({
      title: '',
      practiceLink: '',
      platform: '',
      youtubeLink: '',
      editorialLink: '',
      notesLink: '',
      difficulty: 'Easy'
    });
    setShowAddProblem(false);
    await refreshSheets();
    toast.success('Problem added successfully!');
  };

  const handleDeleteProblem = async (problemId) => {
    if (!selectedSubsection || !window.confirm('Are you sure you want to delete this problem?')) return;
    
    try {
      setDeletingIds(prev => new Set(prev).add(problemId));
      await sheetAPI.deleteProblem(
        selectedSubsection.sheetId,
        selectedSubsection.sectionId,
        selectedSubsection.subsectionId,
        problemId
      );
      
      await refreshSheets();
      toast.success('Problem deleted successfully!');
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast.error(`Failed to delete problem: ${error.response?.data?.message || error.message}`);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(problemId);
        return newSet;
      });
    }
  };

  const toggleExpanded = (type, id) => {
    setExpandedItems(prev => ({
      ...prev,
      [`${type}_${id}`]: !prev[`${type}_${id}`]
    }));
  };

  const getCurrentSubsectionProblems = () => {
    if (!selectedSubsection) return [];
    
    const sheet = sheets.find(s => s.id === selectedSubsection.sheetId);
    const section = sheet?.sections?.find(s => s.id === selectedSubsection.sectionId);
    const subsection = section?.subsections?.find(s => s.id === selectedSubsection.subsectionId);
    
    return subsection?.problems || [];
  };

  const ProblemForm = ({ problem, onSubmit, onCancel, isEditing = false }) => {
    const [formData, setFormData] = useState(problem || newProblem);
    const [submitting, setSubmitting] = useState(false);

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      if (submitting) return;

      try {
        setSubmitting(true);
        await onSubmit(formData);
      } catch (error) {
        console.error('Form submit error:', error);
        toast.error(`Failed to ${isEditing ? 'update' : 'add'} problem: ${error.response?.data?.message || error.message}`);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-indigo-200/50 dark:border-indigo-500/30 mb-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-4 md:mb-6">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <FaGraduationCap className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Problem' : 'Add New Problem'}
          </h3>
        </div>
        
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Problem Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                required
                placeholder="Enter problem title"
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
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Link to notes or documentation"
                    disabled={submitting}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6 md:mt-8">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <FaTimes className="w-3 h-3 md:w-4 md:h-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.title}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {submitting ? (
                <>
                  <FaSpinner className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                  <span>{isEditing ? 'Updating...' : 'Adding...'}</span>
                </>
              ) : (
                <>
                  <FaSave className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{isEditing ? 'Update' : 'Add'} Problem</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (!canManageSheets) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8 px-4">
        <div className="text-center p-6 md:p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-500/30 max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaTimes className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-red-600 dark:text-red-400 text-sm md:text-base">
            Admin privileges required to access Sheet Management.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8 px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaSpinner className="w-8 h-8 animate-spin text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Sheets...</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Please wait while we fetch your data.</p>
        </div>
      </div>
    );
  }

  // Problem Management View
  if (selectedSubsection) {
    const problems = getCurrentSubsectionProblems();
    
    return (
      <div className="min-h-screen py-4 md:py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 md:space-x-4">
              <button
                onClick={() => setSelectedSubsection(null)}
                className="flex items-center px-3 md:px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-indigo-200/50 dark:border-indigo-500/30 shadow-lg transition-colors text-sm"
              >
                <FaArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                Back to Sheets
              </button>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Problems in "{selectedSubsection.subsectionName}"
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
                  Manage problems, editorials, and content for this subsection
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddProblem(true)}
              className="w-full sm:w-auto flex items-center justify-center px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-200 transform hover:scale-105 text-sm"
            >
              <FaPlus className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Add Problem
            </button>
          </div>

          {/* Add Problem Form */}
          {showAddProblem && (
            <ProblemForm
              problem={newProblem}
              onSubmit={handleAddProblem}
              onCancel={() => setShowAddProblem(false)}
            />
          )}

          {/* Problems List */}
          {problems.length === 0 ? (
            <div className="text-center py-8 md:py-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-500/30">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaGraduationCap className="w-8 h-8 md:w-10 md:h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h4 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">No Problems Yet</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm md:text-base">
                Click "Add Problem" to create the first problem in this subsection.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-500/30 overflow-hidden">
                  <div className="p-6 border-b border-indigo-200/50 dark:border-indigo-500/30 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <FaGraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Problems ({problems.length}) - Click to edit inline
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {canManageSheets ? 'As admin, you can edit all fields' : 'As mentor, you can edit editorial and notes fields only'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-indigo-200/50 dark:divide-indigo-500/30">
                      <thead className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-800/30 dark:to-purple-800/30">
                        <tr>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Problem Title
                          </th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Editorial
                          </th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Video
                          </th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Notes
                          </th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Practice
                          </th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Difficulty
                          </th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50 dark:bg-slate-800/50 divide-y divide-indigo-200/30 dark:divide-indigo-500/20">
                        {problems.map((problem, index) => (
                          <React.Fragment key={problem.id}>
                            {editingProblem === problem.id ? (
                              <tr>
                                <td colSpan="8" className="p-0">
                                  <InlineProblemEditor
                                    problem={problem}
                                    sheetId={selectedSubsection.sheetId}
                                    sectionId={selectedSubsection.sectionId}
                                    subsectionId={selectedSubsection.subsectionId}
                                    onUpdate={() => {
                                      setEditingProblem(null);
                                      refreshSheets();
                                    }}
                                    onCancel={() => setEditingProblem(null)}
                                  />
                                </td>
                              </tr>
                            ) : (
                              <tr className={`${index % 2 === 0 ? 'bg-white/80 dark:bg-slate-800/80' : 'bg-indigo-50/80 dark:bg-indigo-900/20'} hover:bg-indigo-100/80 dark:hover:bg-indigo-800/30 transition-colors`}>
                                <td className="px-4 py-4 text-center border-r border-indigo-200/30 dark:border-indigo-500/20">
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                                    <span className="text-white text-xs">●</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 border-r border-indigo-200/30 dark:border-indigo-500/20">
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {problem.title || 'Untitled Problem'}
                                  </div>
                                  {problem.platform && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                      {problem.platform}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-center border-r border-indigo-200/30 dark:border-indigo-500/20">
                                  {problem.editorialLink ? (
                                    <a
                                      href={problem.editorialLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                                    >
                                      <BookOpen className="w-5 h-5 mx-auto" />
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-center border-r border-indigo-200/30 dark:border-indigo-500/20">
                                  {problem.youtubeLink ? (
                                    <a
                                      href={problem.youtubeLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                    >
                                      <FaYoutube className="w-5 h-5 mx-auto" />
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-center border-r border-indigo-200/30 dark:border-indigo-500/20">
                                  {problem.notesLink ? (
                                    <a
                                      href={problem.notesLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                    >
                                      <FileText className="w-5 h-5 mx-auto" />
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-center border-r border-indigo-200/30 dark:border-indigo-500/20">
                                  {problem.practiceLink ? (
                                    <a
                                      href={problem.practiceLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                                    >
                                      <FaExternalLinkAlt className="w-5 h-5 mx-auto" />
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-center border-r border-indigo-200/30 dark:border-indigo-500/20">
                                  {problem.difficulty ? (
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
                                <td className="px-4 py-4 text-center">
                                  <div className="flex justify-center space-x-2">
                                    {(canManageSheets || canAddEditorials) && (
                                      <button
                                        onClick={() => setEditingProblem(problem.id)}
                                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                        title="Edit Problem"
                                      >
                                        <FaEdit className="w-4 h-4" />
                                      </button>
                                    )}
                                    {canManageSheets && (
                                      <button
                                        onClick={() => handleDeleteProblem(problem.id)}
                                        disabled={deletingIds.has(problem.id)}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        title="Delete Problem"
                                      >
                                        {deletingIds.has(problem.id) ? (
                                          <FaSpinner className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <FaTrash className="w-4 h-4" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {problems.map((problem, index) => (
                  <div key={problem.id} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl border border-indigo-200/50 dark:border-indigo-500/30 shadow-lg overflow-hidden">
                    {editingProblem === problem.id ? (
                      <div className="p-4">
                        <InlineProblemEditor
                          problem={problem}
                          sheetId={selectedSubsection.sheetId}
                          sectionId={selectedSubsection.sectionId}
                          subsectionId={selectedSubsection.subsectionId}
                          onUpdate={() => {
                            setEditingProblem(null);
                            refreshSheets();
                          }}
                          onCancel={() => setEditingProblem(null)}
                        />
                      </div>
                    ) : (
                      <div className="p-4">
                        {/* Problem Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {problem.title || 'Untitled Problem'}
                            </h4>
                            {problem.platform && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {problem.platform}
                              </p>
                            )}
                          </div>
                          
                          {/* Difficulty Badge */}
                          {problem.difficulty && (
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              problem.difficulty === 'Easy' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400'
                                : problem.difficulty === 'Medium'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'
                            }`}>
                              {problem.difficulty}
                            </span>
                          )}
                        </div>
                        
                        {/* Links Row */}
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-3">
                            {problem.practiceLink && (
                              <a
                                href={problem.practiceLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Practice Link"
                              >
                                <FaExternalLinkAlt className="w-4 h-4" />
                              </a>
                            )}
                            {problem.youtubeLink && (
                              <a
                                href={problem.youtubeLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="YouTube Video"
                              >
                                <FaYoutube className="w-4 h-4" />
                              </a>
                            )}
                            {problem.editorialLink && (
                              <a
                                href={problem.editorialLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                title="Editorial"
                              >
                                <BookOpen className="w-4 h-4" />
                              </a>
                            )}
                            {problem.notesLink && (
                              <a
                                href={problem.notesLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Notes"
                              >
                                <FileText className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex space-x-1">
                            {(canManageSheets || canAddEditorials) && (
                              <button
                                onClick={() => setEditingProblem(problem.id)}
                                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Edit Problem"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                            )}
                            {canManageSheets && (
                              <button
                                onClick={() => handleDeleteProblem(problem.id)}
                                disabled={deletingIds.has(problem.id)}
                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete Problem"
                              >
                                {deletingIds.has(problem.id) ? (
                                  <FaSpinner className="w-4 h-4 animate-spin" />
                                ) : (
                                  <FaTrash className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main Sheet Management View
  return (
    <div className="min-h-screen py-4 md:py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <FaGraduationCap className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Sheet Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Manage your problem sheets, sections, and content ({sheets.length} sheets)
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={refreshSheets}
              disabled={refreshing}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 shadow-lg transition-all duration-200 disabled:cursor-not-allowed text-sm"
            >
              <FaSync className={`w-3 h-3 md:w-4 md:h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddSheet(true)}
              className="flex items-center justify-center px-4 md:px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-200 transform hover:scale-105 text-sm"
            >
              <FaPlus className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Add Sheet
            </button>
          </div>
        </div>

        {/* Add Sheet Form */}
        {showAddSheet && (
          <AddItemForm
            multiFields={true}
            fields={{
              name: {
                label: 'Sheet Name',
                value: newSheet.name,
                onChange: (value) => setNewSheet(prev => ({ ...prev, name: value })),
                placeholder: 'Enter sheet name',
                required: true
              },
              description: {
                label: 'Description',
                value: newSheet.description,
                onChange: (value) => setNewSheet(prev => ({ ...prev, description: value })),
                placeholder: 'Optional description',
                type: 'textarea'
              }
            }}
            onSubmit={handleAddSheet}
            onCancel={() => {
              setShowAddSheet(false);
              setNewSheet({ name: '', description: '' });
            }}
            buttonText="Add Sheet"
          />
        )}

        {/* Sheets List */}
        <div className="space-y-4 md:space-y-6">
          {sheets.map((sheet) => (
            <div key={sheet.id} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-indigo-200/50 dark:border-indigo-500/30 shadow-xl overflow-hidden">
              
              {/* Sheet Header */}
              <div className="p-4 md:p-6 border-b border-indigo-200/50 dark:border-indigo-500/30 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                    <button
                      onClick={() => toggleExpanded('sheet', sheet.id)}
                      className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex-shrink-0"
                    >
                      {expandedItems[`sheet_${sheet.id}`] ? <FaChevronDown className="w-4 h-4 md:w-5 md:h-5" /> : <FaChevronRight className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FaFolderOpen className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <InlineEditableText
                        value={sheet.name}
                        onSave={(value) => handleUpdateSheet(sheet.id, 'name', value)}
                        placeholder="Sheet name"
                        isEditable={canManageSheets}
                        className="text-lg md:text-xl font-bold"
                      />
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {(sheet.sections || []).length} sections
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <button
                      onClick={() => setAddingSection(prev => ({ ...prev, [sheet.id]: true }))}
                      className="px-3 md:px-4 py-2 text-xs md:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <FaPlus className="w-2 h-2 md:w-3 md:h-3" />
                      <span>Add Section</span>
                    </button>
                    {canManageSheets && (
                      <button
                        onClick={() => handleDeleteSheet(sheet.id, sheet.name)}
                        disabled={deletingIds.has(sheet.id)}
                        className="px-3 md:px-4 py-2 text-xs md:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Sheet"
                      >
                        {deletingIds.has(sheet.id) ? (
                          <FaSpinner className="w-2 h-2 md:w-3 md:h-3 animate-spin" />
                        ) : (
                          <FaTrash className="w-2 h-2 md:w-3 md:h-3" />
                        )}
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Sheet Description */}
                <div className="mt-4">
                  <InlineEditableText
                    value={sheet.description}
                    onSave={(value) => handleUpdateSheet(sheet.id, 'description', value)}
                    placeholder="Add sheet description..."
                    multiline={true}
                    isEditable={canManageSheets}
                  />
                </div>
              </div>

              {/* Add Section Form */}
              {addingSection[sheet.id] && (
                <div className="p-3 md:p-4">
                  <AddItemForm
                    value={newSectionName}
                    onChange={setNewSectionName}
                    onSubmit={(value) => handleAddSection(sheet.id, value)}
                    onCancel={() => setAddingSection(prev => ({ ...prev, [sheet.id]: false }))}
                    placeholder="Enter section name..."
                    buttonText="Add Section"
                  />
                </div>
              )}

              {/* Sections */}
              {expandedItems[`sheet_${sheet.id}`] && (
                <div className="p-4 md:p-6">
                  {sheet.sections && sheet.sections.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      {sheet.sections.map((section) => (
                        <div key={section.id} className="ml-3 md:ml-6 border-l-2 border-indigo-200 dark:border-indigo-500 pl-3 md:pl-6 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-r-xl">
                          
                          {/* Section Header */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 py-3 gap-3">
                            <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                              <button
                                onClick={() => toggleExpanded('section', section.id)}
                                className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex-shrink-0"
                              >
                                {expandedItems[`section_${section.id}`] ? <FaChevronDown className="w-3 h-3 md:w-4 md:h-4" /> : <FaChevronRight className="w-3 h-3 md:w-4 md:h-4" />}
                              </button>
                              <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FaFolder className="w-3 h-3 md:w-4 md:h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <InlineEditableText
                                  value={section.name}
                                  onSave={(value) => handleUpdateSection(sheet.id, section.id, 'name', value)}
                                  placeholder="Section name"
                                  isEditable={canManageSheets}
                                  className="font-semibold"
                                />
                                <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {(section.subsections || []).length} subsections
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                              <button
                                onClick={() => setAddingSubsection(prev => ({ ...prev, [`${sheet.id}_${section.id}`]: true }))}
                                className="px-2 md:px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                              >
                                <FaPlus className="w-2 h-2" />
                                <span>Add Subsection</span>
                              </button>
                              {canManageSheets && (
                                <button
                                  onClick={() => handleDeleteSection(sheet.id, section.id, section.name)}
                                  disabled={deletingIds.has(section.id)}
                                  className="px-2 md:px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete Section"
                                >
                                  {deletingIds.has(section.id) ? (
                                    <FaSpinner className="w-2 h-2 animate-spin" />
                                  ) : (
                                    <FaTrash className="w-2 h-2" />
                                  )}
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Add Subsection Form */}
                          {addingSubsection[`${sheet.id}_${section.id}`] && (
                            <div className="mb-4">
                              <AddItemForm
                                value={newSubsectionName}
                                onChange={setNewSubsectionName}
                                onSubmit={(value) => handleAddSubsection(sheet.id, section.id, value)}
                                onCancel={() => setAddingSubsection(prev => ({ ...prev, [`${sheet.id}_${section.id}`]: false }))}
                                placeholder="Enter subsection name..."
                                buttonText="Add Subsection"
                              />
                            </div>
                          )}

                          {/* Subsections */}
                          {expandedItems[`section_${section.id}`] && (
                            <div className="ml-3 md:ml-6 space-y-3">
                              {section.subsections && section.subsections.length > 0 ? (
                                section.subsections.map((subsection) => (
                                  <div key={subsection.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-700/50 dark:to-gray-700/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50 hover:shadow-md transition-shadow gap-3">
                                    <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                                      <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-md flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs">📁</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <InlineEditableText
                                          value={subsection.name}
                                          onSave={(value) => handleUpdateSubsection(sheet.id, section.id, subsection.id, 'name', value)}
                                          placeholder="Subsection name"
                                          isEditable={canManageSheets}
                                          className="font-medium"
                                        />
                                        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                          {(subsection.problems || []).length} problems
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                                      <button
                                        onClick={() => handleManageProblems(sheet.id, section.id, subsection.id, subsection.name)}
                                        className="px-2 md:px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                      >
                                        Manage Problems
                                      </button>
                                      {canManageSheets && (
                                        <button
                                          onClick={() => handleDeleteSubsection(sheet.id, section.id, subsection.id, subsection.name)}
                                          disabled={deletingIds.has(subsection.id)}
                                          className="px-2 md:px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="Delete Subsection"
                                        >
                                          {deletingIds.has(subsection.id) ? (
                                            <FaSpinner className="w-2 h-2 animate-spin" />
                                          ) : (
                                            <FaTrash className="w-2 h-2" />
                                          )}
                                          <span>Delete</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm italic p-3 md:p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                                  No subsections yet. Click "Add Subsection" to create one.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 ml-3 md:ml-6 italic p-3 md:p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg text-xs md:text-sm">
                      No sections yet. Click "Add Section" to create one.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sheets.length === 0 && (
          <div className="text-center py-12 md:py-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-indigo-200/50 dark:border-indigo-500/30 shadow-xl">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <FaGraduationCap className="w-8 h-8 md:w-10 md:h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">No Sheets Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
              Get started by creating your first problem sheet. Click "Add Sheet" to begin organizing your coding problems.
            </p>
            <button
              onClick={() => setShowAddSheet(true)}
              className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mx-auto text-sm md:text-base"
            >
              <FaPlus className="w-4 h-4 md:w-5 md:h-5" />
              <span>Create Your First Sheet</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetManagement;
