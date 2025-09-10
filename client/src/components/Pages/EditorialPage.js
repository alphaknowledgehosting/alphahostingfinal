import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { sheetAPI } from '../../services/api';
import { 
  FaArrowLeft, 
  FaSpinner, 
  FaExclamationTriangle,
  FaBook,
  FaEdit,
  FaSave,
  FaTimes,
  FaEye,
  FaYoutube,
  FaCopy,
  FaCheck,
  FaImage,
  FaHeart,
  FaLinkedin,
  FaGithub,
  FaInstagram,
  FaTwitter,
  FaGlobe
} from 'react-icons/fa';
import { 
  ChevronRight,
  ChevronDown as ChevronDownLucide,
  Code,
  BookOpen,
  PlayCircle,
  Home,
  FileText,
  Lightbulb,
  Timer,
  Database,
  ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const EditorialPage = () => {
  const { problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [editorial, setEditorial] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorialContent, setEditorialContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('editorial');
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedLanguages, setSelectedLanguages] = useState({});
  const [copiedCode, setCopiedCode] = useState({});
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [editorialData, setEditorialData] = useState(null);

  useEffect(() => {
    if (problemId) {
      loadProblemAndEditorial();
    }
  }, [problemId]);

  const loadProblemAndEditorial = async () => {
    try {
      setLoading(true);
      setError(null);

      // console.log('Loading problem:', problemId);

      // Try to find the problem in all sheets
      const sheetsResponse = await sheetAPI.getAll();
      const sheets = sheetsResponse.data?.sheets || [];
      
      let foundProblem = null;
      let foundSheet = null;
      
      // console.log('Searching through', sheets.length, 'sheets');
      
      for (const sheet of sheets) {
        for (const section of sheet.sections || []) {
          for (const subsection of section.subsections || []) {
            const problem = subsection.problems?.find(p => p.id === problemId);
            if (problem) {
              foundProblem = problem;
              foundSheet = sheet;
              // console.log('Found problem:', problem.title, 'in sheet:', sheet.name);
              break;
            }
          }
          if (foundProblem) break;
        }
        if (foundProblem) break;
      }

      if (!foundProblem) {
        throw new Error(`Problem with ID "${problemId}" not found in any sheet`);
      }

      setProblem(foundProblem);

      // Load editorial content
      if (foundProblem.editorialLink && foundProblem.editorialLink.trim()) {
        try {
          // console.log('Loading editorial from:', foundProblem.editorialLink);
          
          // If it's a GitHub markdown link, fetch the raw content
          let editorialUrl = foundProblem.editorialLink.trim();
          
          // Convert GitHub URLs to raw content URLs
          if (editorialUrl.includes('github.com') && !editorialUrl.includes('raw.githubusercontent.com')) {
            if (editorialUrl.includes('/blob/')) {
              editorialUrl = editorialUrl
                .replace('github.com', 'raw.githubusercontent.com')
                .replace('/blob/', '/');
            }
          }

          // console.log('Fetching from URL:', editorialUrl);

          const response = await fetch(editorialUrl);
          
          if (response.ok) {
            const content = await response.text();
            // console.log('Editorial content loaded, length:', content.length);
            setEditorial(content);
            setEditorialContent(content);
            const parsedData = parseMarkdown(content);
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
          } else {
            // console.error('Failed to fetch editorial, status:', response.status);
            throw new Error(`Failed to fetch editorial content (${response.status})`);
          }
        } catch (fetchError) {
          // console.error('Error fetching editorial:', fetchError);
          const errorContent = `# Editorial Content Error

**Error loading editorial from:** ${foundProblem.editorialLink}

**Error Details:** ${fetchError.message}

The editorial link exists but the content could not be fetched. This could be due to:
- The link being incorrect or inaccessible
- Network connectivity issues
- CORS restrictions
- The file not being publicly accessible

Please check the editorial link and try again.`;
          
          setEditorial(errorContent);
          setEditorialContent(errorContent);
        }
      } else {
        // console.log('No editorial link found for problem');
        const noEditorialContent = `# No Editorial Available

This problem **"${foundProblem.title}"** does not have an editorial yet.

**Problem ID:** ${problemId}
**Sheet:** ${foundSheet?.name || 'Unknown'}

If you're an admin or mentor, you can add an editorial link from the problem management interface.`;
        
        setEditorial(noEditorialContent);
        setEditorialContent(noEditorialContent);
      }
    } catch (error) {
      // console.error('Error loading problem and editorial:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Enhanced markdown parser - extracts special thanks
  const parseMarkdown = (markdown) => {
    const lines = markdown.split('\n');
    const result = {
      title: '',
      description: '',
      approaches: [],
      videoExplanation: '',
      specialThanks: null
    }

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

      // Check for special thanks pattern
      const specialThanksMatch = line.match(/Special thanks to \[([^\]]+)\]\(([^)]+)\)(.*)/);
      if (specialThanksMatch) {
        const [, name, url, restOfText] = specialThanksMatch;
        result.specialThanks = {
          name: name,
          url: url,
          additionalText: restOfText.trim()
        }
        continue;
      }

      // Parse description (content before first approach)
      if (!currentApproach && line.trim() && !line.startsWith('#') && !result.specialThanks) {
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
        }
        currentSection = 'explanation';
        continue;
      }

      // Skip redundant headings
      if (line.startsWith('### Algorithm Explanation') || 
          line.startsWith('### Implementation') ||
          line.startsWith('### Early Termination with Sentinel') ||
          line.startsWith('### Pre-sorting + Binary Search')) {
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

  // Parse and render content with images
  const parseContentWithImages = (content) => {
    if (!content) return [];

    const lines = content.split('\n');
    const elements = [];
    let currentTextBlock = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for HTML img tags
      const imgMatch = line.match(/<img\s+src=["']([^"']+)["'][^>]*(?:style=["']([^"']+)["'])?[^>]*\/?>/i);
      
      if (imgMatch) {
        // Add any accumulated text before the image
        if (currentTextBlock.trim()) {
          elements.push({
            type: 'text',
            content: currentTextBlock,
            key: `text-${elements.length}`
          });
          currentTextBlock = '';
        }

        // Add the image
        const [, src, style] = imgMatch;
        elements.push({
          type: 'image',
          src: src,
          style: style || '',
          key: `image-${elements.length}`
        });
      } else if (line) {
        // Add line to current text block
        currentTextBlock += line + '\n';
      } else {
        // Empty line - preserve it in text
        currentTextBlock += '\n';
      }
    }

    // Add any remaining text
    if (currentTextBlock.trim()) {
      elements.push({
        type: 'text',
        content: currentTextBlock,
        key: `text-${elements.length}`
      });
    }

    return elements;
  };

  // Handle image load errors
  const handleImageError = (imageKey) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [imageKey]: true
    }));
  };

  // Render content elements (text + images)
  const renderContentElements = (elements) => {
    return elements.map(element => {
      if (element.type === 'image') {
        const imageKey = `${element.src}-${element.key}`;
        const hasError = imageLoadErrors[imageKey];

        if (hasError) {
          return (
            <div 
              key={element.key}
              className="my-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center space-x-3"
            >
              <FaImage className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-700 dark:text-red-400 font-medium">Failed to load image</p>
                <p className="text-red-600 dark:text-red-500 text-sm break-all">{element.src}</p>
              </div>
            </div>
          );
        }

        // Parse inline styles
        const inlineStyles = {};
        if (element.style) {
          element.style.split(';').forEach(style => {
            const [property, value] = style.split(':').map(s => s.trim());
            if (property && value) {
              // Convert CSS property to camelCase for React
              const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
              inlineStyles[camelProperty] = value;
            }
          });
        }

        return (
          <div key={element.key} className="my-6 flex justify-center">
            <div className="relative inline-block">
              <img
                src={element.src}
                alt="Editorial illustration"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  ...inlineStyles
                }}
                onError={() => handleImageError(imageKey)}
                className="border border-slate-200 dark:border-slate-600"
              />
            </div>
          </div>
        );
      } else {
        // Render text content
        return element.content.split('\n').map((line, lineIndex) => (
          line.trim() && (
            <p key={`${element.key}-${lineIndex}`} className="text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg mb-4">
              {line}
            </p>
          )
        ));
      }
    });
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  // Render Special Thanks section matching the image design
  const renderSpecialThanks = () => {
    if (!editorialData?.specialThanks) return null;

    return (
      <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
        <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          Special thanks to{' '}
          <a
            href={editorialData.specialThanks.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
          >
            {editorialData.specialThanks.name}
          </a>
          {editorialData.specialThanks.additionalText && (
            <span className="text-slate-600 dark:text-slate-400">
              {' '}{editorialData.specialThanks.additionalText}
            </span>
          )}
        </p>
      </div>
    );
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
      // console.error('Failed to copy code:', err);
    }
  };

  const formatComplexity = (complexity) => {
    return complexity.replace(/O\$(.*?)\$/g, '<code class="complexity-code">O($1)</code>');
  };

  const getApproachBadgeStyle = (approachName) => {
    const name = approachName.toLowerCase();
    if (name.includes('brute') || name.includes('naive')) {
      return 'bg-gradient-to-r from-red-100 to-red-50 dark:from-red-500/20 dark:to-red-400/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30';
    } else if (name.includes('better') || name.includes('improved')) {
      return 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-500/20 dark:to-amber-400/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30';
    } else if (name.includes('optimal') || name.includes('efficient')) {
      return 'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-500/20 dark:to-green-400/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30';
    }
    return 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-400/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30';
  };

  const handleSaveEditorial = async () => {
    if (!problem) return;

    setSaving(true);
    try {
      setEditorial(editorialContent);
      setIsEditing(false);
      alert('Editorial saved successfully!');
    } catch (error) {
      // console.error('Error saving editorial:', error);
      alert('Failed to save editorial: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditorialContent(editorial);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#a855f7]/10 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <FaSpinner className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Loading Editorial
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Please wait while we fetch the solution...</p>
            {/* <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Problem ID: {problemId}</p> */}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950/50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8 sm:p-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-6">
              <FaExclamationTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Editorial Not Found
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              {error}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-8">
              Problem ID: {problemId}
            </p>
            <button 
              onClick={() => window.close()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#a855f7]/10 dark:bg-slate-900">
      
      {/* Elegant Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            
            {/* Title Section with Back Button */}
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={() => window.close()}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0"
                title="Close window"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
              </button>
              
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                  <FaBook className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-900 via-indigo-700 to-purple-600 bg-clip-text text-transparent dark:from-white dark:via-indigo-300 dark:to-purple-300 truncate">
                    {editorialData?.title || problem?.title || 'Problem Editorial'}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium hidden sm:block">
                    Comprehensive solution guide with multiple approaches
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100/60 dark:bg-slate-800/60 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 backdrop-blur-sm w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('editorial')}
                className={`px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex-1 sm:flex-initial ${
                  activeTab === 'editorial'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" />
                Editorial
              </button>
              
              <button
                onClick={() => setActiveTab('video')}
                className={`px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex-1 sm:flex-initial ${
                  activeTab === 'video'
                    ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-lg shadow-red-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <FaYoutube className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" />
                Video
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {activeTab === 'editorial' && (
          <div>
            {!editorial && !loading && (
              <div className="flex items-center justify-center h-64 sm:h-96">
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r bg-purple-500/10 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      No Editorial Available
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm sm:text-base px-4">
                      The editorial for this problem is not available at the moment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {editorialData && !loading && !error && (
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                {/* Problem Description with Images */}
                {editorialData.description && (
                  <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-900/5">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shrink-0">
                        <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Problem Overview</h2>
                    </div>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      {renderContentElements(parseContentWithImages(editorialData.description))}
                    </div>
                  </div>
                )}

                {/* Solution Approaches */}
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {editorialData.approaches.map((approach, index) => (
                    <div
                      key={approach.id}
                      className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-900/5 overflow-hidden"
                    >
                      {/* Approach Header */}
                      <div
                        onClick={() => toggleSection(approach.id)}
                        className="cursor-pointer p-4 sm:p-6 lg:p-8 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all duration-300 border-b border-slate-200/30 dark:border-slate-700/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
                            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                              {expandedSections[approach.id] ? (
                                <ChevronDownLucide className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-slate-400 dark:text-slate-500" />
                              )}
                              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                <span className="text-white font-bold text-sm sm:text-base lg:text-lg">{index + 1}</span>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">
                                {approach.name}
                              </h3>
                              <span className={`inline-block px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${getApproachBadgeStyle(approach.name)}`}>
                                Solution Approach
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Approach Content */}
                      {expandedSections[approach.id] && (
                        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
                          {/* Explanation Section with Images */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-indigo-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-200/30 dark:border-indigo-500/20">
                            <h4 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center">
                              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3 text-indigo-600 dark:text-indigo-400" />
                              Algorithm Explanation
                            </h4>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                              {renderContentElements(parseContentWithImages(approach.explanation))}
                            </div>
                          </div>

                          {/* Implementation Section */}
                          {approach.code && approach.code.length > 0 && (
                            <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-600/30 overflow-hidden">
                              {/* Implementation Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-700/30 border-b border-slate-200/30 dark:border-slate-600/30 space-y-3 sm:space-y-0">
                                <h4 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white flex items-center">
                                  <Code className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3 text-purple-600 dark:text-purple-400" />
                                  Implementation
                                </h4>
                                
                                {/* Language Tabs */}
                                {approach.code.length > 1 && (
                                  <div className="flex flex-wrap gap-1 bg-white/70 dark:bg-slate-800/70 rounded-lg sm:rounded-xl p-1">
                                    {approach.code.map((codeItem) => (
                                      <button
                                        key={codeItem.language}
                                        onClick={() => changeLanguage(approach.id, codeItem.language)}
                                        className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                                          selectedLanguages[approach.id] === codeItem.language
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                                        }`}
                                      >
                                        {codeItem.language}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Code Block */}
                              {approach.code
                                .filter(codeItem => codeItem.language === selectedLanguages[approach.id])
                                .map((codeItem, codeIndex) => (
                                <div key={codeIndex} className="relative">
                                  <pre className="p-3 sm:p-6 lg:p-8 overflow-x-auto bg-slate-900 dark:bg-black/80 text-slate-100 text-xs sm:text-sm leading-relaxed font-mono">
                                    <code className={`language-${codeItem.language.toLowerCase()}`}>{codeItem.code}</code>
                                  </pre>
                                  
                                  {/* Copy Button */}
                                  <button
                                    onClick={() => copyCode(codeItem.code, approach.id, codeItem.language)}
                                    className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/10"
                                  >
                                    {copiedCode[`${approach.id}-${codeItem.language}`] ? (
                                      <FaCheck className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-400" />
                                    ) : (
                                      <FaCopy className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Complexity Analysis */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Time Complexity */}
                            {approach.complexity.time && (
                              <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-emerald-200/50 dark:border-emerald-500/20">
                                <h5 className="text-sm sm:text-base lg:text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-3 sm:mb-4 flex items-center">
                                  <Timer className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                                  Time Complexity
                                </h5>
                                <div 
                                  className="text-emerald-700 dark:text-emerald-200 text-base sm:text-lg lg:text-xl font-semibold"
                                  dangerouslySetInnerHTML={{
                                    __html: formatComplexity(approach.complexity.time)
                                  }}
                                />
                              </div>
                            )}

                            {/* Space Complexity */}
                            {approach.complexity.space && (
                              <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-violet-200/50 dark:border-violet-500/20">
                                <h5 className="text-sm sm:text-base lg:text-lg font-bold text-violet-800 dark:text-violet-300 mb-3 sm:mb-4 flex items-center">
                                  <Database className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                                  Space Complexity
                                </h5>
                                <div 
                                  className="text-violet-700 dark:text-violet-200 text-base sm:text-lg lg:text-xl font-semibold"
                                  dangerouslySetInnerHTML={{
                                    __html: formatComplexity(approach.complexity.space)
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Special Thanks Section - Simple text matching the image */}
                {renderSpecialThanks()}
              </div>
            )}

            {/* Fallback to simple markdown if structured data is not available */}
            {editorial && !editorialData && !loading && !error && (
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-900/5">
                {isEditing ? (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Edit Editorial Content
                    </h2>
                    <textarea
                      value={editorialContent}
                      onChange={(e) => setEditorialContent(e.target.value)}
                      className="w-full h-96 p-4 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm resize-vertical"
                      placeholder="Enter editorial content in Markdown format..."
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEditorial}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={tomorrow}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {editorial}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Video Tab - Embedded YouTube Video */}
        {activeTab === 'video' && (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-900/5">
            {problem?.youtubeLink && getYouTubeVideoId(problem.youtubeLink) ? (
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <div className="text-red-600 dark:text-red-500">
                    <FaYoutube className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Video Tutorial</h2>
                </div>
                
                {/* Embedded YouTube Video - Fixed height for large screens */}
                <div 
                  className="video-responsive relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-lg"
                  style={{ 
                    paddingBottom: '56.25%', 
                    height: 0 
                  }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(problem.youtubeLink)}?rel=0&modestbranding=1`}
                    title={`${problem?.title} - Video Tutorial`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                  />
                </div>
                
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl sm:rounded-2xl border border-blue-200/30 dark:border-blue-500/20">
                  <p className="text-slate-600 dark:text-slate-400 text-center text-sm sm:text-base">
                    Watch the comprehensive video explanation with step-by-step walkthrough of the solution approaches.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 lg:p-12 text-center space-y-6 sm:space-y-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-400 to-slate-500 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                  <FaYoutube className="w-8 h-8 sm:w-10 sm:h-10 text-white opacity-60" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                    Video Not Available
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base sm:text-lg px-4">
                    A video explanation for this problem is not currently available.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .complexity-code {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
          padding: 6px 12px;
          border-radius: 10px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 1.1em;
          font-weight: 600;
          border: 1px solid rgba(99, 102, 241, 0.2);
          color: #6366f1;
          display: inline-block;
          margin: 2px;
        }
        
        .dark .complexity-code {
          color: #a5b4fc;
          border-color: rgba(165, 180, 252, 0.3);
        }

        /* Responsive video adjustments - Fixed overflow on large screens */
        @media (max-width: 767px) {
          .video-responsive {
            padding-bottom: 56.25% !important;
            height: 0 !important;
          }
        }

        @media (min-width: 768px) {
          .video-responsive {
            max-height: 70vh !important;
            height: 70vh !important;
            padding-bottom: 0 !important;
          }
          
          .video-responsive iframe {
            height: 100% !important;
          }
        }

        @media (min-width: 1024px) {
          .video-responsive {
            max-height: 65vh !important;
            height: 65vh !important;
          }
        }

        @media (min-width: 1440px) {
          .video-responsive {
            max-height: 60vh !important;
            height: 60vh !important;
          }
        }

        /* Responsive text scaling */
        @media (max-width: 640px) {
          .complexity-code {
            font-size: 0.9em;
            padding: 4px 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default EditorialPage;
