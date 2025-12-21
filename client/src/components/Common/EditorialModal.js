import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaTimes, 
  FaChevronDown, 
  FaChevronUp, 
  FaClock, 
  FaMemory, 
  FaCopy, 
  FaCheck,
  FaYoutube,
  FaSpinner,
  FaExclamationTriangle,
  FaBook
} from 'react-icons/fa';
import { 
  ChevronRight,
  ChevronDown as ChevronDownLucide,
  Code,
  BookOpen,
  PlayCircle
} from 'lucide-react';
import YouTubeModal from './YouTubeModal';

const EditorialModal = ({ isOpen, onClose, editorialUrl, problemName, youtubeLink }) => {
  const [editorialData, setEditorialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedLanguages, setSelectedLanguages] = useState({});
  const [copiedCode, setCopiedCode] = useState({});
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('editorial');

  useEffect(() => {
    if (isOpen && editorialUrl) {
      fetchEditorial();
    }
  }, [isOpen, editorialUrl]);

  const fetchEditorial = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert GitHub URL to raw content URL
      const rawUrl = editorialUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      const response = await fetch(rawUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch editorial content');
      }
      
      const markdownContent = await response.text();
      const parsedData = parseMarkdown(markdownContent);
      setEditorialData(parsedData);
      
      // Initialize expanded sections (all collapsed by default)
      const initialExpanded = {};
      parsedData.approaches.forEach(approach => {
        initialExpanded[approach.id] = false;
      });
      setExpandedSections(initialExpanded);
      
      // Initialize selected languages
      const initialLanguages = {};
      parsedData.approaches.forEach(approach => {
        if (approach.code && approach.code.length > 0) {
          initialLanguages[approach.id] = approach.code[0].language;
        }
      });
      setSelectedLanguages(initialLanguages);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseMarkdown = (markdown) => {
    const lines = markdown.split('\n');
    const result = {
      title: '',
      description: '',
      approaches: [],
      videoExplanation: ''
    };

    let currentApproach = null;
    let currentSection = null;
    let codeBlock = null;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Parse title (# Title)
      if (line.startsWith('# ') && !result.title) {
        result.title = line.substring(2).trim();
        continue;
      }

      // Parse description (content before first approach)
      if (!currentApproach && line.trim() && !line.startsWith('#')) {
        result.description += line + '\n';
        continue;
      }

      // Parse approaches (## Approach Name)
      if (line.startsWith('## ')) {
        if (currentApproach) {
          result.approaches.push(currentApproach);
        }
        
        currentApproach = {
          id: line.substring(3).toLowerCase().replace(/\s+/g, '-'),
          name: line.substring(3).trim(),
          explanation: '',
          code: [],
          complexity: {
            time: '',
            space: ''
          }
        };
        currentSection = 'explanation';
        continue;
      }

      // Parse complexity sections
      if (line.startsWith('### Time Complexity')) {
        currentSection = 'timeComplexity';
        continue;
      }
      if (line.startsWith('### Space Complexity')) {
        currentSection = 'spaceComplexity';
        continue;
      }

      // Parse code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Starting code block
          inCodeBlock = true;
          const language = line.substring(3).trim() || 'javascript';
          codeBlock = {
            language: language,
            code: ''
          };
        } else {
          // Ending code block
          inCodeBlock = false;
          if (currentApproach && codeBlock) {
            currentApproach.code.push(codeBlock);
            codeBlock = null;
          }
        }
        continue;
      }

      // Add content to current section
      if (inCodeBlock && codeBlock) {
        codeBlock.code += line + '\n';
      } else if (currentApproach) {
        if (currentSection === 'explanation') {
          currentApproach.explanation += line + '\n';
        } else if (currentSection === 'timeComplexity') {
          currentApproach.complexity.time += line + '\n';
        } else if (currentSection === 'spaceComplexity') {
          currentApproach.complexity.space += line + '\n';
        }
      }
    }

    // Add last approach
    if (currentApproach) {
      result.approaches.push(currentApproach);
    }

    return result;
  };

  const toggleSection = (approachId) => {
    setExpandedSections(prev => ({
      ...prev,
      [approachId]: !prev[approachId]
    }));
  };

  const changeLanguage = (approachId, language) => {
    setSelectedLanguages(prev => ({
      ...prev,
      [approachId]: language
    }));
  };

  const copyCode = async (code, approachId, language) => {
    try {
      await navigator.clipboard.writeText(code);
      const key = `${approachId}-${language}`;
      setCopiedCode(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedCode(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const formatComplexity = (complexity) => {
    return complexity.replace(/O$$(.*?)$$/g, '<code class="complexity-code">O($1)</code>');
  };

  const getApproachBadgeStyle = (approachName) => {
    const name = approachName.toLowerCase();
    if (name.includes('brute') || name.includes('naive')) {
      return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30';
    } else if (name.includes('better') || name.includes('improved')) {
      return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
    } else if (name.includes('optimal') || name.includes('efficient')) {
      return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30';
    }
    return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
  };

  if (!isOpen) return null;

  const closeModal = () => {
    setActiveTab('editorial');
    setShowYouTubeModal(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z- flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={closeModal}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-7xl h-[90vh] bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-300 overflow-hidden flex flex-col">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/5 via-[#a855f7]/3 to-[#6366f1]/5 dark:from-[#6366f1]/10 dark:via-[#a855f7]/5 dark:to-[#6366f1]/10 rounded-3xl" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/20 dark:border-white/10 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-xl flex items-center justify-center shadow-lg">
              <FaBook className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editorialData?.title || problemName || 'Problem Editorial'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Detailed solution approaches and explanations
              </p>
            </div>
          </div>
          
          <button
            onClick={closeModal}
            className="w-10 h-10 bg-white/80 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-500/20 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl backdrop-blur-sm transition-all duration-200 flex items-center justify-center border border-white/30 dark:border-white/20"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="relative flex items-center px-6 py-3 border-b border-white/10 dark:border-white/10 backdrop-blur-sm">
          <div className="flex space-x-1 bg-white/50 dark:bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('editorial')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'editorial'
                  ? 'bg-white dark:bg-white/10 text-[#6366f1] dark:text-[#a855f7] shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-[#6366f1] dark:hover:text-[#a855f7]'
              }`}
            >
              <BookOpen className="w-4 h-4 inline-block mr-2" />
              Editorial
            </button>
            {youtubeLink && (
              <button
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'video'
                    ? 'bg-white dark:bg-white/10 text-red-600 dark:text-red-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                }`}
              >
                <FaYoutube className="w-4 h-4 inline-block mr-2" />
                Video Explanation
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-hidden">
          {activeTab === 'editorial' && (
            <div className="h-full overflow-y-auto p-6">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <FaSpinner className="w-8 h-8 animate-spin text-[#6366f1] mx-auto" />
                    <p className="text-gray-600 dark:text-gray-400">Loading editorial...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <FaExclamationTriangle className="w-8 h-8 text-red-500 mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Failed to Load Editorial
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {editorialData && !loading && !error && (
                <div className="space-y-6">
                  {/* Description */}
                  {editorialData.description && (
                    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-white/10">
                      <div className="prose prose-gray dark:prose-invert max-w-none">
                        {editorialData.description.split('\n').map((line, index) => (
                          <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approaches */}
                  <div className="space-y-4">
                    {editorialData.approaches.map((approach, index) => (
                      <div
                        key={approach.id}
                        className="bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/10 overflow-hidden"
                      >
                        {/* Approach Header */}
                        <div
                          onClick={() => toggleSection(approach.id)}
                          className="cursor-pointer p-6 hover:bg-white/30 dark:hover:bg-white/5 transition-all duration-200 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {expandedSections[approach.id] ? (
                                <ChevronDownLucide className="w-5 h-5 text-[#6366f1] dark:text-[#a855f7]" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {approach.name}
                              </h3>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mt-2 ${getApproachBadgeStyle(approach.name)}`}>
                                Approach {index + 1}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Approach Content */}
                        {expandedSections[approach.id] && (
                          <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Left Panel - Explanation */}
                              <div className="space-y-4">
                                <div className="bg-white/60 dark:bg-white/10 rounded-xl p-5 border border-white/30 dark:border-white/20">
                                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                    <BookOpen className="w-4 h-4 mr-2 text-[#6366f1] dark:text-[#a855f7]" />
                                    Explanation
                                  </h4>
                                  <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
                                    {approach.explanation.split('\n').map((line, lineIndex) => (
                                      <p key={lineIndex} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {line}
                                      </p>
                                    ))}
                                  </div>
                                </div>

                                {/* Complexity */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {/* Time Complexity */}
                                  {approach.complexity.time && (
                                    <div className="bg-blue-50/50 dark:bg-blue-500/10 rounded-xl p-4 border border-blue-200/30 dark:border-blue-500/20">
                                      <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center">
                                        <FaClock className="w-3 h-3 mr-2" />
                                        Time Complexity
                                      </h5>
                                      <div 
                                        className="text-sm text-blue-600 dark:text-blue-300"
                                        dangerouslySetInnerHTML={{
                                          __html: formatComplexity(approach.complexity.time)
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* Space Complexity */}
                                  {approach.complexity.space && (
                                    <div className="bg-purple-50/50 dark:bg-purple-500/10 rounded-xl p-4 border border-purple-200/30 dark:border-purple-500/20">
                                      <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2 flex items-center">
                                        <FaMemory className="w-3 h-3 mr-2" />
                                        Space Complexity
                                      </h5>
                                      <div 
                                        className="text-sm text-purple-600 dark:text-purple-300"
                                        dangerouslySetInnerHTML={{
                                          __html: formatComplexity(approach.complexity.space)
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Panel - Code */}
                              {approach.code && approach.code.length > 0 && (
                                <div className="space-y-4">
                                  <div className="bg-white/60 dark:bg-white/10 rounded-xl border border-white/30 dark:border-white/20 overflow-hidden">
                                    {/* Code Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                                      <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center">
                                        <Code className="w-4 h-4 mr-2 text-[#6366f1] dark:text-[#a855f7]" />
                                        Implementation
                                      </h4>
                                      
                                      {/* Language Selector */}
                                      {approach.code.length > 1 && (
                                        <div className="flex space-x-1 bg-white/50 dark:bg-white/10 rounded-lg p-1">
                                          {approach.code.map((codeItem) => (
                                            <button
                                              key={codeItem.language}
                                              onClick={() => changeLanguage(approach.id, codeItem.language)}
                                              className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                                selectedLanguages[approach.id] === codeItem.language
                                                  ? 'bg-[#6366f1] text-white shadow-sm'
                                                  : 'text-gray-600 dark:text-gray-400 hover:text-[#6366f1] dark:hover:text-[#a855f7]'
                                              }`}
                                            >
                                              {codeItem.language}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Code Content */}
                                    {approach.code
                                      .filter(codeItem => codeItem.language === selectedLanguages[approach.id])
                                      .map((codeItem, codeIndex) => (
                                      <div key={codeIndex} className="relative">
                                        <pre className="p-4 overflow-x-auto bg-gray-900 dark:bg-black/60 text-gray-100 text-sm leading-relaxed">
                                          <code>{codeItem.code}</code>
                                        </pre>
                                        
                                        {/* Copy Button */}
                                        <button
                                          onClick={() => copyCode(codeItem.code, approach.id, codeItem.language)}
                                          className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
                                        >
                                          {copiedCode[`${approach.id}-${codeItem.language}`] ? (
                                            <FaCheck className="w-3 h-3" />
                                          ) : (
                                            <FaCopy className="w-3 h-3" />
                                          )}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'video' && youtubeLink && (
            <div className="h-full p-6">
              <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-white/10 text-center h-full flex items-center justify-center">
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                    <FaYoutube className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Video Explanation Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Watch the detailed video explanation for this problem to better understand the solution approaches.
                    </p>
                    <button
                      onClick={() => setShowYouTubeModal(true)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <PlayCircle className="w-5 h-5 mr-2" />
                      Watch Video
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* YouTube Modal */}
      {showYouTubeModal && youtubeLink && (
        <YouTubeModal
          videoUrl={youtubeLink}
          isOpen={showYouTubeModal}
          onClose={() => setShowYouTubeModal(false)}
          problemName={problemName}
        />
      )}

      <style jsx>{`
        .complexity-code {
          background: rgba(99, 102, 241, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.875em;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }
      `}</style>
    </div>,
    document.body
  );
};

export default EditorialModal;
