import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { sheetAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSave, 
  FaTimes,
  FaExternalLinkAlt,
  FaYoutube,
  FaBook,
  FaFileAlt,
  FaSpinner
} from 'react-icons/fa';
import { BookOpen, FileText } from 'lucide-react';
import YouTubeModal from '../Common/YouTubeModal';

const ProblemManagement = ({ 
  sheet, 
  sectionId, 
  subsectionId, 
  onRefresh 
}) => {
  const { user, canManageSheets, canAddEditorials } = useAuth();
  const [problems, setProblems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showVideo, setShowVideo] = useState(null);
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
    loadProblems();
  }, [sheet, sectionId, subsectionId]);

  const loadProblems = () => {
    const section = sheet.sections.find(s => s.id === sectionId);
    const subsection = section?.subsections.find(s => s.id === subsectionId);
    setProblems(subsection?.problems || []);
  };

  const isEmpty = (value) => {
    return !value || value === '' || value === null || value === undefined;
  };

  const handleAddProblem = async (formData) => {
    if (!canManageSheets) {
      toast.error('You do not have permission to add problems.');
      return;
    }
    
    if (!formData.title?.trim()) {
      toast.error('Problem title is required.');
      return;
    }

    const loadingToast = toast.loading('Adding problem...');
    
    try {
      setLoading(true);
      await sheetAPI.addProblem(sheet.id, sectionId, subsectionId, formData);
      
      setNewProblem({
        title: '',
        practiceLink: '',
        platform: '',
        youtubeLink: '',
        editorialLink: '',
        notesLink: '',
        difficulty: 'Easy'
      });
      setShowAddForm(false);
      
      toast.success('Problem added successfully! 🎉', { id: loadingToast });
      onRefresh();
    } catch (error) {
      console.error('Error adding problem:', error);
      toast.error(`Failed to add problem: ${error.response?.data?.message || error.message}`, { 
        id: loadingToast 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProblem = async (problemId, updateData) => {
    const loadingToast = toast.loading('Updating problem...');
    
    try {
      setLoading(true);
      await sheetAPI.updateProblem(sheet.id, sectionId, subsectionId, problemId, updateData);
      setEditingProblem(null);
      
      toast.success('Problem updated successfully! ✅', { id: loadingToast });
      onRefresh();
    } catch (error) {
      console.error('Error updating problem:', error);
      toast.error(`Failed to update problem: ${error.response?.data?.message || error.message}`, {
        id: loadingToast
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProblem = async (problemId, problemTitle) => {
    if (!canManageSheets) {
      toast.error('You do not have permission to delete problems.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${problemTitle || 'this problem'}"? This action cannot be undone.`)) {
      return;
    }

    const loadingToast = toast.loading('Deleting problem...');

    try {
      setDeletingId(problemId);
      await sheetAPI.deleteProblem(sheet.id, sectionId, subsectionId, problemId);
      
      toast.success(`Problem "${problemTitle || 'Untitled'}" deleted successfully! 🗑️`, { 
        id: loadingToast 
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast.error(`Failed to delete problem: ${error.response?.data?.message || error.message}`, {
        id: loadingToast
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Handle different link types like ProblemItem
  const handleLinkClick = (link, type, problem) => {
    if (isEmpty(link)) return;

    switch (type) {
      case 'editorial':
        // Custom editorial viewer
        const editorialPath = `/editorial/${problem.id}`;
        window.open(editorialPath, '_blank', 'noopener,noreferrer');
        break;
      case 'youtube':
        // Open YouTube modal
        setShowVideo({ url: link, title: problem.title || 'Untitled Problem' });
        break;
      case 'practice':
      case 'notes':
      default:
        // External links open in new tab
        window.open(link, '_blank', 'noopener,noreferrer');
        break;
    }
  };

  const ProblemForm = ({ problem, onSubmit, onCancel, isEditing = false }) => {
    const [formData, setFormData] = useState(problem || newProblem);
    const [submitting, setSubmitting] = useState(false);
    const titleInputRef = useRef(null);

    const canEditAll = canManageSheets;
    const canEditEditorial = canAddEditorials;

    // ✅ AUTO-FOCUS FIX - Use setTimeout to ensure DOM is ready
    useEffect(() => {
      const timer = setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
          titleInputRef.current.select(); // Select existing text when editing
        }
      }, 100); // Small delay ensures form is fully rendered

      return () => clearTimeout(timer);
    }, []);

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      if (submitting) return;
      
      if (!formData.title?.trim()) {
        toast.error('Problem title is required.');
        titleInputRef.current?.focus(); // Refocus on validation error
        return;
      }

      try {
        setSubmitting(true);
        await onSubmit(formData);
      } catch (error) {
        console.error('Form submit error:', error);
        // Error is handled in parent component
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title - Always editable by admin - AUTO FOCUS */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Problem Title *
              </label>
              <input
                ref={titleInputRef} // ✅ Auto-focus ref
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={!canEditAll || submitting}
                placeholder="Enter problem title"
                autoComplete="off"
              />
            </div>

            {/* Platform - Admin only */}
            {canEditAll && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform
                </label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., LeetCode, GeeksforGeeks"
                  disabled={submitting}
                />
              </div>
            )}

            {/* Practice Link - Admin only */}
            {canEditAll && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Practice Link
                </label>
                <input
                  type="url"
                  value={formData.practiceLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, practiceLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="https://leetcode.com/problems/..."
                  disabled={submitting}
                />
              </div>
            )}

            {/* Editorial Link - Admin and Mentor */}
            {canEditEditorial && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Editorial Link
                </label>
                <input
                  type="url"
                  value={formData.editorialLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, editorialLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="GitHub markdown link"
                  disabled={submitting}
                />
              </div>
            )}

            {/* YouTube Link - Admin only */}
            {canEditAll && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  YouTube Link
                </label>
                <input
                  type="url"
                  value={formData.youtubeLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={submitting}
                />
              </div>
            )}

            {/* Notes Link - Admin and Mentor */}
            {(canEditAll || canEditEditorial) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes Link
                </label>
                <input
                  type="url"
                  value={formData.notesLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, notesLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Link to notes or documentation"
                  disabled={submitting}
                />
              </div>
            )}

            {/* Difficulty - Admin only */}
            {canEditAll && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <FaTimes className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.title?.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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

  return (
    <>
      <div className="space-y-6">
        {/* Add Problem Button */}
        {canManageSheets && (
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Problems ({problems.length})
            </h3>
            <button
              onClick={() => setShowAddForm(true)}
              disabled={loading || showAddForm}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Add Problem
            </button>
          </div>
        )}

        {/* Add Problem Form */}
        {showAddForm && (
          <ProblemForm
            problem={newProblem}
            onSubmit={handleAddProblem}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Problems Table */}
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Problem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Links
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {problems.map((problem, index) => (
                <tr key={problem.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}>
                  <td className="px-6 py-4">
                    {editingProblem === problem.id ? (
                      <ProblemForm
                        problem={problem}
                        onSubmit={(data) => handleUpdateProblem(problem.id, data)}
                        onCancel={() => setEditingProblem(null)}
                        isEditing={true}
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {problem.title || 'Untitled Problem'}
                        </div>
                        {problem.platform && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {problem.platform}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  
                  {editingProblem !== problem.id && (
                    <>
                      <td className="px-6 py-4">
                        {problem.difficulty ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            problem.difficulty === 'Easy' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : problem.difficulty === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}>
                            {problem.difficulty}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-3">
                          {!isEmpty(problem.practiceLink) && (
                            <button
                              onClick={() => handleLinkClick(problem.practiceLink, 'practice', problem)}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 transition-colors"
                              title="Practice Link"
                            >
                              <FaExternalLinkAlt className="w-4 h-4" />
                            </button>
                          )}
                          {!isEmpty(problem.youtubeLink) && (
                            <button
                              onClick={() => handleLinkClick(problem.youtubeLink, 'youtube', problem)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 transition-colors"
                              title="YouTube Video"
                            >
                              <FaYoutube className="w-4 h-4" />
                            </button>
                          )}
                          {!isEmpty(problem.editorialLink) && (
                            <button
                              onClick={() => handleLinkClick(problem.editorialLink, 'editorial', problem)}
                              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 transition-colors"
                              title="Editorial"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                          )}
                          {!isEmpty(problem.notesLink) && (
                            <button
                              onClick={() => handleLinkClick(problem.notesLink, 'notes', problem)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors"
                              title="Notes"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {(canManageSheets || canAddEditorials) && (
                            <button
                              onClick={() => setEditingProblem(problem.id)}
                              disabled={loading || editingProblem !== null}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Edit Problem"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                          )}
                          {canManageSheets && (
                            <button
                              onClick={() => handleDeleteProblem(problem.id, problem.title)}
                              disabled={deletingId === problem.id}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Delete Problem"
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
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {problems.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">No problems found</div>
            {canManageSheets && (
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Click "Add Problem" to create the first one.
              </p>
            )}
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
