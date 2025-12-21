import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Check, X } from 'lucide-react';
import { problemAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const ProblemSelector = ({ onSelect, onCreateNew, selectedProblemIds = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2 && showSearchModal) {
      searchProblems();
    } else {
      setProblems([]);
    }
  }, [searchTerm, showSearchModal]);

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
    setShowSearchModal(false);
  };

  return (
    <div className="relative mb-6">
      <div className="flex gap-2">
        {/* Search Button - Opens Modal */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="flex-1 flex items-center gap-2 px-4 py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors text-left text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-700"
        >
          <Search className="w-5 h-5" />
          <span>Search existing problems by title or platform...</span>
        </button>

        {/* Create New Button */}
        <button
          onClick={() => setShowCreateNew(!showCreateNew)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 flex items-center gap-2 font-medium shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create New Problem
        </button>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowSearchModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Search Problems
              </h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search problems..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 border border-indigo-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-6">
              {searchTerm.length < 2 ? (
                <div className="text-center text-gray-500 py-8">
                  Type at least 2 characters to search...
                </div>
              ) : loading ? (
                <div className="text-center text-gray-500 py-8">Searching...</div>
              ) : problems.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No problems found. Try different keywords or create a new one.
                </div>
              ) : (
                <ul className="space-y-2">
                  {problems.map((problem) => {
                    const isSelected = selectedProblemIds.includes(problem.id);
                    return (
                      <li
                        key={problem.id}
                        onClick={() => !isSelected && handleSelect(problem)}
                        className={`p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed'
                            : 'border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                              {problem.title}
                            </h4>
                            <div className="flex items-center gap-3">
                              {problem.platform && (
                                <span className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                                  {problem.platform}
                                </span>
                              )}
                              {problem.difficulty && (
                                <span
                                  className={`text-sm px-3 py-1 rounded-lg font-medium ${
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
                          {isSelected && (
                            <Check className="w-6 h-6 text-green-500 flex-shrink-0 ml-4" />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create New Problem Form (inline) */}
      {showCreateNew && (
        <div className="mt-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-dashed border-green-300 dark:border-green-600">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Create New Global Problem
          </h3>
          <ProblemCreateForm
            onSubmit={(newProblem) => {
              onCreateNew(newProblem);
              setShowCreateNew(false);
            }}
            onCancel={() => setShowCreateNew(false)}
          />
        </div>
      )}
    </div>
  );
};

export default ProblemSelector;
