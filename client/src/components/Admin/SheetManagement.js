import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { sheetAPI, problemAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
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
  FaArrowLeft,
  FaSpinner,
  FaGraduationCap,
  FaUnlink
} from 'react-icons/fa';
import { BookOpen, FileText, Plus, Search } from 'lucide-react';
import YouTubeModal from '../Common/YouTubeModal';

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

// ============= INLINE FIELD EDITOR FOR PROBLEMS =============
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

// ============= PROBLEM FORM COMPONENT =============
const ProblemForm = ({ problem, onSubmit, onCancel, isEditing = false, canManageSheets, canAddEditorials }) => {
  const [formData, setFormData] = useState(problem);
  const [submitting, setSubmitting] = useState(false);
  const titleInputRef = useRef(null);

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
              className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 text-sm md:text-base"
              required
              disabled={!canManageSheets || submitting}
              placeholder="Enter problem title"
            />
          </div>

          {canManageSheets && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Platform</label>
                <input
                  type="text"
                  value={formData.platform || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm md:text-base"
                  placeholder="e.g., LeetCode"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Practice Link</label>
                <input
                  type="url"
                  value={formData.practiceLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, practiceLink: e.target.value }))}
                  className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm md:text-base"
                  placeholder="https://leetcode.com/problems/..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">YouTube Link</label>
                <input
                  type="url"
                  value={formData.youtubeLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeLink: e.target.value }))}
                  className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm md:text-base"
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                <select
                  value={formData.difficulty || 'Easy'}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm md:text-base"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Editorial Link</label>
                <input
                  type="url"
                  value={formData.editorialLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, editorialLink: e.target.value }))}
                  className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm md:text-base"
                  placeholder="GitHub markdown link"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes Link</label>
                <input
                  type="url"
                  value={formData.notesLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notesLink: e.target.value }))}
                  className="w-full px-3 py-2 md:py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm md:text-base"
                  placeholder="Link to notes"
                  disabled={submitting}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            <FaTimes className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.title?.trim()}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg"
          >
            {submitting ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                <FaSave className="w-4 h-4" />
                {isEditing ? 'Update' : 'Add'} Problem
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============= ADD ITEM FORM =============
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
                    className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm resize-none disabled:opacity-50"
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
                    className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50"
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
            className="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
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
            className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            <FaTimes className="w-3 h-3" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
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

// ============= MAIN SHEET MANAGEMENT COMPONENT =============
const SheetManagement = () => {
  const { user, canManageSheets, canAddEditorials } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubsection, setSelectedSubsection] = useState(null);
  const [addingSection, setAddingSection] = useState({});
  const [addingSubsection, setAddingSubsection] = useState({});
  const [deletingIds, setDeletingIds] = useState(new Set());
  
  // Problem management states
  const [currentProblems, setCurrentProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [unlinkingId, setUnlinkingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // ✅ NEW
  const [showVideo, setShowVideo] = useState(null);

  const [newSheet, setNewSheet] = useState({ name: '', description: '' });
  const [newSectionName, setNewSectionName] = useState('');
  const [newSubsectionName, setNewSubsectionName] = useState('');

  useEffect(() => {
    if (canManageSheets) {
      loadSheets();
    }
  }, [canManageSheets]);

  useEffect(() => {
    if (selectedSubsection) {
      loadProblemsForSubsection();
    }
  }, [selectedSubsection, sheets]);

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

  const loadProblemsForSubsection = async () => {
    if (!selectedSubsection) return;

    const sheet = sheets.find(s => s.id === selectedSubsection.sheetId);
    const section = sheet?.sections?.find(s => s.id === selectedSubsection.sectionId);
    const subsection = section?.subsections?.find(s => s.id === selectedSubsection.subsectionId);
    const problemIds = subsection?.problemIds || [];

    if (problemIds.length === 0) {
      setCurrentProblems([]);
      return;
    }

    try {
      setLoadingProblems(true);
      const response = await problemAPI.getBatch(problemIds);
      setCurrentProblems(response.data.problems || []);
    } catch (error) {
      console.error('Error loading problems:', error);
      toast.error('Failed to load problems');
    } finally {
      setLoadingProblems(false);
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
    if (!window.confirm(`Are you sure you want to delete "${sheetName}"? This will remove all references but NOT delete global problems.`)) {
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
    if (!window.confirm(`Are you sure you want to delete section "${sectionName}"? This will remove all references but NOT delete global problems.`)) {
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
    if (!window.confirm(`Are you sure you want to delete subsection "${subsectionName}"? This will remove all references but NOT delete global problems.`)) {
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

  const handleLinkExistingProblem = async (problem) => {
    if (!selectedSubsection) return;

    try {
      await sheetAPI.linkProblem(
        selectedSubsection.sheetId,
        selectedSubsection.sectionId,
        selectedSubsection.subsectionId,
        problem.id
      );
      toast.success(`Problem "${problem.title}" added to subsection!`);
      await refreshSheets();
    } catch (error) {
      console.error('Error linking problem:', error);
      toast.error('Failed to link problem');
    }
  };

  const handleCreateAndLinkProblem = async (problemData) => {
    if (!selectedSubsection || !problemData.title?.trim()) {
      toast.error('Problem title is required.');
      return;
    }

    const loadingToast = toast.loading('Creating problem...');

    try {
      const createResponse = await problemAPI.create(problemData);
      const createdProblem = createResponse.data.problem;

      await sheetAPI.linkProblem(
        selectedSubsection.sheetId,
        selectedSubsection.sectionId,
        selectedSubsection.subsectionId,
        createdProblem.id
      );

      setShowCreateForm(false);
      toast.success(`Problem "${createdProblem.title}" created and added! 🎉`, { id: loadingToast });
      await refreshSheets();
    } catch (error) {
      console.error('Error creating and linking problem:', error);
      toast.error('Failed to create problem', { id: loadingToast });
    }
  };

  const handleUpdateProblem = async (problemId, updateData) => {
    const loadingToast = toast.loading('Updating problem...');

    try {
      await problemAPI.update(problemId, updateData);
      setEditingProblemId(null);
      toast.success('Problem updated successfully! ✅', { id: loadingToast });
      await refreshSheets();
    } catch (error) {
      console.error('Error updating problem:', error);
      toast.error('Failed to update problem', { id: loadingToast });
    }
  };

  const handleUpdateField = async (problemId, field, value) => {
    try {
      await problemAPI.update(problemId, { [field]: value });
      await refreshSheets();
    } catch (error) {
      console.error('Error updating field:', error);
      throw error;
    }
  };

  // ✅ Unlink problem from subsection
  const handleUnlinkProblem = async (problemId, problemTitle) => {
    if (!selectedSubsection) return;

    if (!window.confirm(
      `Remove "${problemTitle}" from this subsection?\n\n` +
      `The problem will still exist globally and in other subsections where it's used.`
    )) {
      return;
    }

    try {
      setUnlinkingId(problemId);
      await sheetAPI.unlinkProblem(
        selectedSubsection.sheetId,
        selectedSubsection.sectionId,
        selectedSubsection.subsectionId,
        problemId
      );
      toast.success('Problem removed from subsection');
      await refreshSheets();
    } catch (error) {
      console.error('Error unlinking problem:', error);
      toast.error('Failed to remove problem');
    } finally {
      setUnlinkingId(null);
    }
  };

  // ✅ NEW: Delete problem globally
  const handleDeleteProblem = async (problemId, problemTitle) => {
    if (!selectedSubsection) return;

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
      await refreshSheets();
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

  const toggleExpanded = (type, id) => {
    setExpandedItems(prev => ({
      ...prev,
      [`${type}_${id}`]: !prev[`${type}_${id}`]
    }));
  };

  // ============= RENDER GUARD =============
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

  // ============= PROBLEM MANAGEMENT VIEW =============
  if (selectedSubsection) {
    const selectedProblemIds = currentProblems.map(p => p.id);
    const isDisabled = unlinkingId !== null || deletingId !== null; // ✅ NEW

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
                  Search existing problems or create new ones
                </p>
              </div>
            </div>
          </div>

          {/* Problem Selector (Search + Create Button) */}
          {canManageSheets && (
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-indigo-200/50 dark:border-indigo-500/30 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Problems</h3>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2 text-sm shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Create New Problem
                </button>
              </div>

              {/* Search Existing Problems */}
              <ProblemSelector
                onSelect={handleLinkExistingProblem}
                selectedProblemIds={selectedProblemIds}
              />

              {/* Create New Problem Form */}
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
          {loadingProblems ? (
            <div className="text-center py-8">
              <FaSpinner className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Loading problems...</p>
            </div>
          ) : currentProblems.length === 0 ? (
            <div className="text-center py-8 md:py-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-500/30">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaGraduationCap className="w-8 h-8 md:w-10 md:h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h4 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">No Problems Yet</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mb-6">
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
                          Problems ({currentProblems.length}) - Click to edit inline
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
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Problem Title</th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Editorial</th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Video</th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Notes</th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Practice</th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Difficulty</th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50 dark:bg-slate-800/50 divide-y divide-indigo-200/30 dark:divide-indigo-500/20">
                        {currentProblems.map((problem, index) => (
                          <React.Fragment key={problem.id}>
                            {editingProblemId === problem.id ? (
                              <tr>
                                <td colSpan="7" className="p-0">
                                  <ProblemForm
                                    problem={problem}
                                    onSubmit={(data) => handleUpdateProblem(editingProblemId, data)}
                                    onCancel={() => setEditingProblemId(null)}
                                    isEditing={true}
                                    canManageSheets={canManageSheets}
                                    canAddEditorials={canAddEditorials}
                                  />
                                </td>
                              </tr>
                            ) : (
                              <tr className={`${
                                index % 2 === 0 ? 'bg-white/80 dark:bg-slate-800/80' : 'bg-indigo-50/80 dark:bg-indigo-900/20'
                              } hover:bg-indigo-100/80 dark:hover:bg-indigo-800/30 transition-colors ${
                                isDisabled ? 'opacity-70' : ''
                              }`}>
                                
                                {/* Problem Title Column */}
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
                                
                                {/* Editorial Column */}
                                <td className="px-4 py-4 text-center border-r border-indigo-200/30 dark:border-indigo-500/20">
                                  {!isEmpty(problem.editorialLink) ? (
                                    <button
                                      onClick={() => handleLinkClick(problem.editorialLink, 'editorial', problem)}
                                      disabled={isDisabled}
                                      className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <BookOpen className="w-5 h-5 mx-auto" />
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                
                                {/* Video Column */}
                                <td className="px-4 py-4 text-center border-r border-indigo-200/30 dark:border-indigo-500/20">
                                  {!isEmpty(problem.youtubeLink) ? (
                                    <button
                                      onClick={() => handleLinkClick(problem.youtubeLink, 'youtube', problem)}
                                      disabled={isDisabled}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <FaYoutube className="w-5 h-5 mx-auto" />
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                
                                {/* Notes Column */}
                                <td className="px-4 py-4 text-center border-r border-indigo-200/30 dark:border-indigo-500/20">
                                  {!isEmpty(problem.notesLink) ? (
                                    <button
                                      onClick={() => handleLinkClick(problem.notesLink, 'notes', problem)}
                                      disabled={isDisabled}
                                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <FileText className="w-5 h-5 mx-auto" />
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                
                                {/* Practice Column */}
                                <td className="px-4 py-4 text-center border-r border-indigo-200/30 dark:border-indigo-500/20">
                                  {!isEmpty(problem.practiceLink) ? (
                                    <button
                                      onClick={() => handleLinkClick(problem.practiceLink, 'practice', problem)}
                                      disabled={isDisabled}
                                      className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <FaExternalLinkAlt className="w-5 h-5 mx-auto" />
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                
                                {/* Difficulty Column */}
                                <td className="px-4 py-4 text-center border-r border-indigo-200/30 dark:border-indigo-500/20">
                                  {problem.difficulty ? (
                                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                                      problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400'
                                      : problem.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400'
                                      : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'
                                    }`}>
                                      {problem.difficulty}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                
                                {/* ✅ UPDATED: Actions Column with Edit, Unlink, and Delete */}
                                <td className="px-4 py-4 text-center">
                                  <div className="flex justify-center space-x-2">
                                    {/* Edit Button */}
                                    {(canManageSheets || canAddEditorials) && (
                                      <button
                                        onClick={() => setEditingProblemId(problem.id)}
                                        disabled={isDisabled}
                                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Edit Problem"
                                      >
                                        <FaEdit className="w-4 h-4" />
                                      </button>
                                    )}
                                    
                                    {/* Unlink Button */}
                                    {canManageSheets && (
                                      <button
                                        onClick={() => handleUnlinkProblem(problem.id, problem.title)}
                                        disabled={isDisabled}
                                        className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Remove from subsection (keeps global problem)"
                                      >
                                        {unlinkingId === problem.id ? (
                                          <FaSpinner className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <FaUnlink className="w-4 h-4" />
                                        )}
                                      </button>
                                    )}
                                    
                                    {/* ✅ NEW: Delete Button (Global Delete) */}
                                    {canManageSheets && (
                                      <button
                                        onClick={() => handleDeleteProblem(problem.id, problem.title)}
                                        disabled={isDisabled}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                {currentProblems.map((problem) => (
                  <div key={problem.id} className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl border border-indigo-200/50 dark:border-indigo-500/30 shadow-lg overflow-hidden ${
                    isDisabled ? 'opacity-70' : ''
                  }`}>
                    {editingProblemId === problem.id ? (
                      <div className="p-4">
                        <ProblemForm
                          problem={problem}
                          onSubmit={(data) => handleUpdateProblem(editingProblemId, data)}
                          onCancel={() => setEditingProblemId(null)}
                          isEditing={true}
                          canManageSheets={canManageSheets}
                          canAddEditorials={canAddEditorials}
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
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{problem.platform}</p>
                            )}
                          </div>
                          {/* Difficulty Badge */}
                          {problem.difficulty && (
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400'
                              : problem.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'
                            }`}>
                              {problem.difficulty}
                            </span>
                          )}
                        </div>

                        {/* Links Row */}
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-3">
                            {!isEmpty(problem.practiceLink) && (
                              <button
                                onClick={() => handleLinkClick(problem.practiceLink, 'practice', problem)}
                                disabled={isDisabled}
                                className="p-2 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Practice Link"
                              >
                                <FaExternalLinkAlt className="w-4 h-4" />
                              </button>
                            )}
                            {!isEmpty(problem.youtubeLink) && (
                              <button
                                onClick={() => handleLinkClick(problem.youtubeLink, 'youtube', problem)}
                                disabled={isDisabled}
                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="YouTube Video"
                              >
                                <FaYoutube className="w-4 h-4" />
                              </button>
                            )}
                            {!isEmpty(problem.editorialLink) && (
                              <button
                                onClick={() => handleLinkClick(problem.editorialLink, 'editorial', problem)}
                                disabled={isDisabled}
                                className="p-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Editorial"
                              >
                                <BookOpen className="w-4 h-4" />
                              </button>
                            )}
                            {!isEmpty(problem.notesLink) && (
                              <button
                                onClick={() => handleLinkClick(problem.notesLink, 'notes', problem)}
                                disabled={isDisabled}
                                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Notes"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* ✅ UPDATED: Actions with Edit, Unlink, and Delete */}
                          <div className="flex space-x-1">
                            {(canManageSheets || canAddEditorials) && (
                              <button
                                onClick={() => setEditingProblemId(problem.id)}
                                disabled={isDisabled}
                                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Edit Problem"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                            )}
                            {canManageSheets && (
                              <>
                                {/* Unlink Button */}
                                <button
                                  onClick={() => handleUnlinkProblem(problem.id, problem.title)}
                                  disabled={isDisabled}
                                  className="p-2 text-orange-600 hover:text-orange-800 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                                  title="Remove"
                                >
                                  {unlinkingId === problem.id ? (
                                    <FaSpinner className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FaUnlink className="w-4 h-4" />
                                  )}
                                </button>
                                
                                {/* ✅ NEW: Delete Button */}
                                <button
                                  onClick={() => handleDeleteProblem(problem.id, problem.title)}
                                  disabled={isDisabled}
                                  className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                  title="Delete Globally"
                                >
                                  {deletingId === problem.id ? (
                                    <FaSpinner className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FaTrash className="w-4 h-4" />
                                  )}
                                </button>
                              </>
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

        {/* YouTube Modal */}
        {showVideo && (
          <YouTubeModal
            videoUrl={showVideo.url}
            isOpen={!!showVideo}
            onClose={() => setShowVideo(null)}
            problemName={showVideo.title}
          />
        )}
      </div>
    );
  }

  // ============= MAIN SHEET MANAGEMENT VIEW =============
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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Sheet Management</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Manage your problem sheets ({sheets.length} sheets)</p>
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
                        {deletingIds.has(sheet.id) ? <FaSpinner className="w-2 h-2 md:w-3 md:h-3 animate-spin" /> : <FaTrash className="w-2 h-2 md:w-3 md:h-3" />}
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
                                  {deletingIds.has(section.id) ? <FaSpinner className="w-2 h-2 animate-spin" /> : <FaTrash className="w-2 h-2" />}
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
                                          {(subsection.problemIds || []).length} problems
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
                                          {deletingIds.has(subsection.id) ? <FaSpinner className="w-2 h-2 animate-spin" /> : <FaTrash className="w-2 h-2" />}
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
