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
  ArrowLeft,
  GraduationCap
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
  const [contentType, setContentType] = useState('solution'); // 'editorial' or 'solution'

  useEffect(() => {
    if (problemId) {
      loadProblemAndEditorial();
    }
  }, [problemId]);

  // Add this useEffect for editorial code block language initialization
  useEffect(() => {
    if (contentType === 'editorial' && editorial) {
      const parsedEditorial = parseEditorialMarkdown(editorial);
      
      // Initialize selected languages for code blocks
      const initialLanguages = {};
      parsedEditorial.content.forEach(block => {
        if (block.type === 'code' && block.code && block.code.length > 0) {
          if (!selectedLanguages[block.id]) {
            initialLanguages[block.id] = block.code[0].language;
          }
        }
      });
      
      if (Object.keys(initialLanguages).length > 0) {
        setSelectedLanguages(prev => ({ ...prev, ...initialLanguages }));
      }
    }
  }, [editorial, contentType]);
// Enhanced Google Drive URL converter
const convertGoogleDriveUrl = (url) => {
  if (!url) return url;
  
  // Handle different Google Drive URL formats
  const drivePatterns = [
    // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/,
    // https://drive.google.com/file/d/FILE_ID/view (without parameters)
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view$/,
    // https://drive.google.com/open?id=FILE_ID
    /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    // Already converted format
    /https:\/\/drive\.google\.com\/uc\?export=view&id=([a-zA-Z0-9_-]+)/,
    // Direct file ID extraction
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of drivePatterns) {
    const match = url.match(pattern);
    if (match) {
      const fileId = match[1];
      // Use the direct download format which works better for images
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }
  
  return url;
};


// Enhanced image proxy function with CORS handling
const createImageProxy = async (originalUrl) => {
  try {
    // Convert Google Drive URLs first
    const convertedUrl = convertGoogleDriveUrl(originalUrl);
    
    // For Google Drive, try multiple approaches
    if (originalUrl.includes('drive.google.com')) {
      const fileId = originalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
      if (fileId) {
        // Try different Google Drive access methods
        const driveUrls = [
          `https://drive.google.com/uc?export=download&id=${fileId}`,
          `https://drive.google.com/uc?export=view&id=${fileId}`,
          `https://lh3.googleusercontent.com/d/${fileId}`,
          `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000-h2000`
        ];
        
        for (const driveUrl of driveUrls) {
          try {
            const response = await fetch(driveUrl, {
              mode: 'cors',
              method: 'GET',
            });
            
            if (response.ok) {
              const blob = await response.blob();
              if (blob.size > 0) {
                const blobUrl = URL.createObjectURL(blob);
                return blobUrl;
              }
            }
          } catch (err) {
            console.log(`Failed to fetch from ${driveUrl}:`, err.message);
            continue;
          }
        }
      }
    }
    
    // Fallback for other URLs or if Drive methods fail
    const response = await fetch(convertedUrl, {
      mode: 'cors',
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    return blobUrl;
  } catch (error) {
    console.error('Error creating image proxy:', error);
    // Return the converted URL as fallback
    return convertGoogleDriveUrl(originalUrl);
  }
};


// Universal secure image component for all image sources
const SecureImage = ({ src, alt, className, style, onError, ...props }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState('');
  
  useEffect(() => {
    let mounted = true;
    let timeoutId = null;
    
    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        setLoadingMethod('Processing...');
        
        if (!src) {
          throw new Error('No source provided');
        }
        
        let processedSrc = src.trim();
        
        // Step 1: Convert various URL formats to direct access URLs
        processedSrc = convertToDirectUrl(processedSrc);
        setLoadingMethod('Converting URL...');
        
        // Step 2: Try multiple loading methods in order of security preference
        const loadingMethods = [
          () => loadAsDataUrl(processedSrc),
          () => loadViaCanvas(processedSrc),
          () => loadViaProxy(processedSrc),
          () => loadDirect(processedSrc)
        ];
        
        for (let i = 0; i < loadingMethods.length; i++) {
          if (!mounted) break;
          
          try {
            setLoadingMethod(`Method ${i + 1}/4...`);
            const result = await Promise.race([
              loadingMethods[i](),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 10000)
              )
            ]);
            
            if (result && mounted) {
              setImageSrc(result);
              setLoadingMethod('');
              return;
            }
          } catch (methodError) {
            console.log(`Loading method ${i + 1} failed:`, methodError.message);
            continue;
          }
        }
        
        throw new Error('All loading methods failed');
        
      } catch (error) {
        console.error('Error loading secure image:', error);
        if (mounted) {
          setHasError(true);
          setLoadingMethod('');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Convert various URL formats to direct access URLs
    const convertToDirectUrl = (url) => {
      // Google Drive URLs
      if (url.includes('drive.google.com')) {
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
          const fileId = fileIdMatch[1] || fileIdMatch[2];
          return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
      }
      
      // GitHub URLs - convert to raw format
      if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
        if (url.includes('/blob/')) {
          return url
            .replace('github.com', 'raw.githubusercontent.com')
            .replace('/blob/', '/');
        }
      }
      
      // Dropbox URLs
      if (url.includes('dropbox.com') && !url.includes('dl=1')) {
        return url.replace('dl=0', 'dl=1').replace(/\?.*/, '') + '?dl=1';
      }
      
      // OneDrive URLs
      if (url.includes('1drv.ms') || url.includes('onedrive.live.com')) {
        // Convert OneDrive share links to direct download
        if (url.includes('1drv.ms')) {
          // For short links, we'll use a proxy service
          return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        }
      }
      
      return url;
    };
    
    // Method 1: Load as Data URL (most secure)
    const loadAsDataUrl = async (url) => {
      const response = await fetch(url, {
        mode: 'cors',
        method: 'GET',
        headers: {
          'Accept': 'image/*,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; SecureImageLoader/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Empty response');
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(blob);
      });
    };
    
    // Method 2: Load via Canvas (secure, bypasses some CORS issues)
    const loadViaCanvas = async (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png', 0.9);
            resolve(dataUrl);
          } catch (canvasError) {
            reject(canvasError);
          }
        };
        
        img.onerror = () => reject(new Error('Image load failed'));
        
        // Set a timeout
        setTimeout(() => reject(new Error('Canvas load timeout')), 8000);
        
        img.src = url;
      });
    };
    
    // Method 3: Load via Proxy Services
    const loadViaProxy = async (url) => {
      const proxyServices = [
        `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=2000&h=2000`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://cors-anywhere.herokuapp.com/${url}`,
        `https://thingproxy.freeboard.io/fetch/${url}`
      ];
      
      for (const proxyUrl of proxyServices) {
        try {
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: { 'Accept': 'image/*' }
          });
          
          if (response.ok) {
            const blob = await response.blob();
            if (blob.size > 0) {
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('FileReader failed'));
                reader.readAsDataURL(blob);
              });
            }
          }
        } catch (proxyError) {
          continue;
        }
      }
      
      throw new Error('All proxy services failed');
    };
    
    // Method 4: Load Direct (fallback, less secure)
    const loadDirect = async (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Direct load failed'));
        
        // Test if the URL actually loads
        img.src = url;
        
        setTimeout(() => reject(new Error('Direct load timeout')), 5000);
      });
    };
    
    if (src) {
      loadImage();
    }
    
    // Cleanup timeout on unmount
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [src]);
  
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  
  const handleKeyDown = (e) => {
    // Disable developer tools shortcuts
    const blockedKeys = [
      'F12',
      { ctrl: true, shift: true, key: 'I' },
      { ctrl: true, shift: true, key: 'C' },
      { ctrl: true, shift: true, key: 'J' },
      { ctrl: true, key: 'U' },
      { ctrl: true, key: 'S' },
      { meta: true, alt: true, key: 'I' }, // Mac
      { meta: true, alt: true, key: 'C' }, // Mac
    ];
    
    const isBlocked = blockedKeys.some(blocked => {
      if (typeof blocked === 'string') {
        return e.key === blocked;
      }
      return (
        (!blocked.ctrl || e.ctrlKey) &&
        (!blocked.shift || e.shiftKey) &&
        (!blocked.meta || e.metaKey) &&
        (!blocked.alt || e.altKey) &&
        e.key === blocked.key
      );
    });
    
    if (isBlocked) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };
  
  const handleError = () => {
    setHasError(true);
    onError && onError();
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600/30">
        <div className="text-center max-w-xs">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium">
            Loading secure image...
          </p>
          {loadingMethod && (
            <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
              {loadingMethod}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  if (hasError || !imageSrc) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-500/30">
        <div className="text-center max-w-xs">
          <FaImage className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
          <p className="text-amber-700 dark:text-amber-400 text-xs sm:text-sm font-medium mb-1">
            Image temporarily unavailable
          </p>
          <p className="text-amber-600 dark:text-amber-500 text-xs leading-tight">
            The image couldn't be loaded securely. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{ outline: 'none' }}
      className="focus:outline-none"
      onContextMenu={handleContextMenu}
    >
      <img
        {...props}
        src={imageSrc}
        alt={alt}
        className={className}
        style={{
          ...style,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserDrag: 'none',
          KhtmlUserSelect: 'none',
          pointerEvents: 'auto'
        }}
        onError={handleError}
        onContextMenu={handleContextMenu}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onSelectStart={(e) => e.preventDefault()}
        onMouseDown={(e) => {
          if (e.detail > 1) {
            e.preventDefault();
          }
        }}
      />
    </div>
  );
};



  const loadProblemAndEditorial = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to find the problem in all sheets
      const sheetsResponse = await sheetAPI.getAll();
      const sheets = sheetsResponse.data?.sheets || [];
      
      let foundProblem = null;
      let foundSheet = null;
      
      for (const sheet of sheets) {
        for (const section of sheet.sections || []) {
          for (const subsection of section.subsections || []) {
            const problem = subsection.problems?.find(p => p.id === problemId);
            if (problem) {
              foundProblem = problem;
              foundSheet = sheet;
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

      // Determine content type based on editorialLink filename, problem title, or ID
      let fileName = '';
      if (foundProblem.editorialLink) {
        try {
          const url = foundProblem.editorialLink.trim();
          const urlParts = url.split('?')[0].split('#')[0].split('/');
          fileName = urlParts[urlParts.length - 1].toLowerCase();
        } catch {
          fileName = '';
        }
      }

      const isEditorialContent = fileName.includes('-editorial') ||
                                 (foundProblem.title && foundProblem.title.toLowerCase().includes('-editorial')) ||
                                 (problemId && problemId.toLowerCase().includes('-editorial'));
      
      const isSolutionContent = fileName.endsWith('-solution.md') ||
                                (foundProblem.title && foundProblem.title.toLowerCase().endsWith('-solution')) ||
                                (problemId && problemId.toLowerCase().endsWith('-solution'));
      
      if (isEditorialContent) {
        setContentType('editorial');
      } else if (isSolutionContent) {
        setContentType('solution');
      } else {
        // Default to solution for backward compatibility
        setContentType('solution');
      }

      // Load editorial content
      if (foundProblem.editorialLink && foundProblem.editorialLink.trim()) {
        try {
          let editorialUrl = foundProblem.editorialLink.trim();
          
          // Convert GitHub URLs to raw content URLs
          if (editorialUrl.includes('github.com') && !editorialUrl.includes('raw.githubusercontent.com')) {
            if (editorialUrl.includes('/blob/')) {
              editorialUrl = editorialUrl
                .replace('github.com', 'raw.githubusercontent.com')
                .replace('/blob/', '/');
            }
          }

          const response = await fetch(editorialUrl);
          
          if (response.ok) {
            const content = await response.text();
            setEditorial(content);
            setEditorialContent(content);
            
            // Only parse for solution content (not editorial)
            if (contentType === 'solution') {
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
            }
          } else {
            throw new Error(`Failed to fetch editorial content (${response.status})`);
          }
        } catch (fetchError) {
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
        const noEditorialContent = `# No ${contentType === 'editorial' ? 'Editorial' : 'Solution'} Available

This ${contentType === 'editorial' ? 'concept' : 'problem'} **"${foundProblem.title}"** does not have ${contentType === 'editorial' ? 'an editorial' : 'a solution'} yet.

**${contentType === 'editorial' ? 'Concept' : 'Problem'} ID:** ${problemId}
**Sheet:** ${foundSheet?.name || 'Unknown'}

If you're an admin or mentor, you can add ${contentType === 'editorial' ? 'an editorial' : 'a solution'} link from the ${contentType === 'editorial' ? 'concept' : 'problem'} management interface.`;
        
        setEditorial(noEditorialContent);
        setEditorialContent(noEditorialContent);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Enhanced markdown parser - for solution content only
  const parseMarkdown = (markdown) => {
    const lines = markdown.split('\n');
    const result = {
      title: '',
      description: '',
      approaches: [],
      videoExplanation: '',
      specialThanks: null
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

      // Check for special thanks pattern
      const specialThanksMatch = line.match(/Special thanks to \[([^\]]+)\]\(([^)]+)\)(.*)/);
      if (specialThanksMatch) {
        const [, name, url, restOfText] = specialThanksMatch;
        result.specialThanks = {
          name: name,
          url: url,
          additionalText: restOfText.trim()
        };
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
        };
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
      if (line.startsWith('```')){
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

  // Enhanced markdown parser for editorial content - UPDATED
  const parseEditorialMarkdown = (markdown) => {
    const lines = markdown.split('\n');
    const result = {
      title: '',
      content: [], // Array of content blocks (text, code, image)
    };

    let currentTextBlock = '';
    let codeBlock = null;
    let inCodeBlock = false;
    let codeBlocksFound = {};
    let currentLanguages = {}; // Track multiple languages for same code block

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Parse title (# Title)
      if (line.startsWith('# ') && !result.title) {
        result.title = line.substring(2).trim();
        continue;
      }

      // Parse code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Starting code block
          if (currentTextBlock.trim()) {
            result.content.push({
              type: 'text',
              content: currentTextBlock.trim(),
              id: `text-${result.content.length}`
            });
            currentTextBlock = '';
          }

          inCodeBlock = true;
          const language = line.substring(3).trim() || 'javascript';
          const blockId = `code-block-${Object.keys(codeBlocksFound).length}`;
          
          // Check if this is a continuation of previous code block with different language
          const prevBlock = result.content[result.content.length - 1];
          if (prevBlock && prevBlock.type === 'code' && !currentTextBlock.trim()) {
            // This is likely a multi-language code block
            codeBlock = prevBlock;
            codeBlock.code.push({ language: language, code: '' });
            codeBlock.languages.push(language);
          } else {
            // New code block
            codeBlock = {
              type: 'code',
              id: blockId,
              languages: [language],
              code: [{ language: language, code: '' }]
            };
            codeBlocksFound[blockId] = true;
          }
        } else {
          // Ending code block
          inCodeBlock = false;
          if (codeBlock && !result.content.includes(codeBlock)) {
            result.content.push(codeBlock);
          }
          codeBlock = null;
        }
        continue;
      }

      // Add content to current section
      if (inCodeBlock && codeBlock) {
        const currentCodeItem = codeBlock.code[codeBlock.code.length - 1];
        currentCodeItem.code += line + '\n';
      } else {
        // Check for HTML img tags
        const imgMatch = line.match(/<img\s+src=["']([^"']+)["'][^>]*(?:style=["']([^"']+)["'])?[^>]*\/?>/i);
        
        if (imgMatch) {
          // Add any accumulated text before the image
          if (currentTextBlock.trim()) {
            result.content.push({
              type: 'text',
              content: currentTextBlock.trim(),
              id: `text-${result.content.length}`
            });
            currentTextBlock = '';
          }

          // Add the image
          const [, src, style] = imgMatch;
          result.content.push({
            type: 'image',
            src: src,
            style: style || '',
            id: `image-${result.content.length}`
          });
        } else {
          currentTextBlock += line + '\n';
        }
      }
    }

    // Add any remaining text
    if (currentTextBlock.trim()) {
      result.content.push({
        type: 'text',
        content: currentTextBlock.trim(),
        id: `text-${result.content.length}`
      });
    }

    return result;
  };

  // Enhanced content renderer for editorial - UPDATED
  const renderEditorialContentBlock = (block) => {
    switch (block.type) {
      case 'text':
        return (
          <div key={block.id} className="prose prose-slate dark:prose-invert prose-lg max-w-none mb-6">
            <ReactMarkdown
              components={{
                // Headings
                h1: ({ children }) => (
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-200 dark:border-slate-700">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mt-8 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mt-6 mb-3">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                    {children}
                  </h4>
                ),
                h5: ({ children }) => (
                  <h5 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 dark:text-white mt-3 mb-2">
                    {children}
                  </h5>
                ),
                h6: ({ children }) => (
                  <h6 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-700 dark:text-slate-300 mt-2 mb-1">
                    {children}
                  </h6>
                ),
                // Paragraphs
                p: ({ children }) => (
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg mb-4 lg:mb-6">
                    {children}
                  </p>
                ),
                // Lists
                ul: ({ children }) => (
                  <ul className="text-slate-700 dark:text-slate-300 list-disc list-inside mb-4 lg:mb-6 space-y-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="text-slate-700 dark:text-slate-300 list-decimal list-inside mb-4 lg:mb-6 space-y-2">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-slate-700 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
                    {children}
                  </li>
                ),
                // Blockquotes
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic text-slate-600 dark:text-slate-400 my-4 lg:my-6 bg-slate-50 dark:bg-slate-800/50 py-2 rounded-r">
                    {children}
                  </blockquote>
                ),
                // Strong and emphasis
                strong: ({ children }) => (
                  <strong className="font-bold text-slate-900 dark:text-white">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-slate-800 dark:text-slate-200">
                    {children}
                  </em>
                ),
                // Links
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 transition-colors duration-200"
                  >
                    {children}
                  </a>
                ),
                // Inline code
                code: ({ children, ...props }) => (
                  <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-sm font-mono border border-slate-200 dark:border-slate-600" {...props}>
                    {children}
                  </code>
                ),
                // Tables
                table: ({ children }) => (
                  <div className="my-4 lg:my-6 overflow-x-auto">
                    <table className="min-w-full border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="bg-white dark:bg-slate-900">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                    {children}
                  </td>
                ),
                // Horizontal rule
                hr: () => (
                  <hr className="my-6 lg:my-8 border-t-2 border-slate-200 dark:border-slate-700" />
                ),
              }}
            >
              {block.content}
            </ReactMarkdown>
          </div>
        );

      case 'code':
  return (
    <div key={block.id} className="my-6 lg:my-8">
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-600/30 overflow-hidden">
        {/* Code Header - Exactly matching solution style */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-700/30 border-b border-slate-200/30 dark:border-slate-600/30 space-y-3 sm:space-y-0">
          <h4 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <Code className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3 text-purple-600 dark:text-purple-400" />
            Code Example
          </h4>
          
          {/* Language Tabs - Exactly matching solution style */}
          {block.code.length > 1 && (
            <div className="flex flex-wrap gap-1 bg-white/70 dark:bg-slate-800/70 rounded-lg sm:rounded-xl p-1">
              {block.code.map((codeItem) => (
                <button
                  key={codeItem.language}
                  onClick={() => changeLanguage(block.id, codeItem.language)}
                  className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    selectedLanguages[block.id] === codeItem.language
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

        {/* Code Block with Fixed Height and Scrolling */}
        {block.code
          .filter(codeItem => codeItem.language === (selectedLanguages[block.id] || block.code[0].language))
          .map((codeItem, codeIndex) => (
          <div key={codeIndex} className="relative">
            <div className="bg-slate-900 dark:bg-black/80">
              <div className="flex justify-between items-center px-4 py-2 bg-slate-800 dark:bg-slate-700/50">
                <span className="text-slate-300 text-sm font-medium">
                  {codeItem.language.toUpperCase()}
                </span>
                <button
                  onClick={() => copyCode(codeItem.code, `${block.id}-${codeItem.language}`)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/10"
                >
                  {copiedCode[`${block.id}-${codeItem.language}`] ? (
                    <FaCheck className="w-3 h-3 text-green-400" />
                  ) : (
                    <FaCopy className="w-3 h-3" />
                  )}
                </button>
              </div>
              
              {/* Fixed Height Container with Scrolling */}
              <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500">
                <SyntaxHighlighter
                  style={tomorrow}
                  language={codeItem.language.toLowerCase()}
                  PreTag="div"
                  className="text-sm"
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    background: 'transparent',
                    minHeight: 'auto'
                  }}
                >
                  {codeItem.code.trim()}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

      case 'image':
  const imageKey = `editorial-${block.src}-${block.id}`;
  const hasError = imageLoadErrors[imageKey];

  if (hasError) {
    return (
      <div key={block.id} className="my-6 lg:my-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center space-x-3">
        <FaImage className="w-5 h-5 text-red-500" />
        <div>
          <p className="text-red-700 dark:text-red-400 font-medium">Failed to load image</p>
          <p className="text-red-600 dark:text-red-500 text-sm break-all">{block.src}</p>
        </div>
      </div>
    );
  }

  // Parse inline styles
  const inlineStyles = {};
  if (block.style) {
    block.style.split(';').forEach(style => {
      const [property, value] = style.split(':').map(s => s.trim());
      if (property && value) {
        const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        inlineStyles[camelProperty] = value;
      }
    });
  }

  return (
  <SecureImage
    key={block.id}
    src={block.src}
    alt="Editorial illustration"
    className="w-full-bleed h-auto block"
    style={{
      ...inlineStyles
    }}
    onError={() => handleImageError(imageKey)}
  />
);
      default:
        return null;
    }
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
  <SecureImage
    key={element.key}
    src={element.src}
    alt="Editorial illustration"
    className="w-full-bleed h-auto block"
    style={{
      ...inlineStyles
    }}
    onError={() => handleImageError(imageKey)}
  />
);
}

 else {
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

  // Copy code function
  const copyCode = async (code, key) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedCode(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  // Render Special Thanks section
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
      console.error('Error saving editorial:', error);
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
              Loading {contentType === 'editorial' ? 'Editorial' : 'Solution'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Please wait while we fetch the {contentType === 'editorial' ? 'concept explanation' : 'solution'}...
            </p>
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
              {contentType === 'editorial' ? 'Editorial' : 'Solution'} Not Found
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              {error}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-8">
              {contentType === 'editorial' ? 'Concept' : 'Problem'} ID: {problemId}
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
      {/* Elegant Header - UPDATED EDITORIAL RESPONSIVE SECTION */}
<div className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
  <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
      
      {/* Title Section with Back Button - UPDATED FOR EDITORIAL RESPONSIVENESS */}
      <div className="flex items-start sm:items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
        <button
          onClick={() => window.close()}
          className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 mt-1 sm:mt-0"
          title="Close window"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
        </button>
        
        <div className="flex items-start sm:items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ${
            contentType === 'editorial' 
              ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500' 
              : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
            } rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ${
            contentType === 'editorial' ? 'shadow-emerald-500/25' : 'shadow-indigo-500/25'
            } shrink-0 mt-1 sm:mt-0`}>
            {contentType === 'editorial' ? (
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
            ) : (
              <FaBook className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            )}
          </div>
          
          {/* UPDATED: Enhanced responsive title container for editorial */}
          <div className="min-w-0 flex-1">
            {contentType === 'editorial' ? (
              // Editorial-specific responsive header
              <>
               <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-emerald-700 via-green-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-300 dark:via-green-300 dark:to-teal-300 leading-normal pb-1 break-words">
                {editorialData?.title || problem?.title || 'Concept Editorial'}
              </h1>

                <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium mt-1 sm:mt-2 break-words leading-relaxed">
                  Comprehensive concept explanation and theory
                </p>

              </>
            ) : (
              // Solution header (unchanged)
              <>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-900 via-indigo-700 to-purple-600 bg-clip-text text-transparent dark:from-white dark:via-indigo-300 dark:to-purple-300 truncate">
                  {editorialData?.title || problem?.title || 'Problem Solution'}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium hidden sm:block">
                  Comprehensive solution guide with multiple approaches
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Enhanced responsiveness for editorial */}
      <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100/60 dark:bg-slate-800/60 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 backdrop-blur-sm w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('editorial')}
          className={`px-2 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex-1 sm:flex-initial flex items-center justify-center space-x-1 sm:space-x-2 ${
            activeTab === 'editorial'
              ? contentType === 'editorial'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10'
                : 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          {contentType === 'editorial' ? (
            <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
          <span className="hidden xs:inline sm:inline">
            {contentType === 'editorial' ? 'Editorial' : 'Solution'}
          </span>
          <span className="inline xs:hidden sm:hidden">
            {contentType === 'editorial' ? 'Editorial' : 'Solution'}
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab('video')}
          className={`px-2 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex-1 sm:flex-initial flex items-center justify-center space-x-1 sm:space-x-2 ${
            activeTab === 'video'
              ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-lg shadow-red-500/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <FaYoutube className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline sm:inline">Video</span>
          <span className="inline xs:hidden sm:hidden">Video</span>
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
                      No {contentType === 'editorial' ? 'Editorial' : 'Solution'} Available
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm sm:text-base px-4">
                      The {contentType === 'editorial' ? 'editorial' : 'solution'} for this {contentType === 'editorial' ? 'concept' : 'problem'} is not available at the moment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Render Editorial Content as Single Page */}
            {contentType === 'editorial' && editorial && !loading && !error && (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-900/5">
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
                  (() => {
                    const parsedEditorial = parseEditorialMarkdown(editorial);
                    
                    return (
                      <div className="space-y-6">
                        {/* Editorial Title */}
                        {parsedEditorial.title && (
                          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-200 dark:border-slate-700">
                            {parsedEditorial.title}
                          </h1>
                        )}
                        
                        {/* Render all content blocks */}
                        {parsedEditorial.content.map(block => renderEditorialContentBlock(block))}
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* Render Solution Content (Structured with Approaches) - UNCHANGED */}
            {contentType === 'solution' && editorialData && !loading && !error && (
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

                              {/* Code Block with Fixed Height */}
{approach.code
  .filter(codeItem => codeItem.language === selectedLanguages[approach.id])
  .map((codeItem, codeIndex) => (
  <div key={codeIndex} className="relative">
    {/* Fixed Height Container with Scrolling */}
    <div className="max-h-96 overflow-y-auto bg-slate-900 dark:bg-black/80 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500">
      <pre className="p-3 sm:p-6 lg:p-8 text-slate-100 text-xs sm:text-sm leading-relaxed font-mono min-h-0">
        <code className={`language-${codeItem.language.toLowerCase()}`}>{codeItem.code}</code>
      </pre>
    </div>
    
    {/* Copy Button */}
    <button
      onClick={() => copyCode(codeItem.code, `${approach.id}-${codeItem.language}`)}
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

                {/* Special Thanks Section */}
                {renderSpecialThanks()}
              </div>
            )}

            {/* Fallback to simple markdown if structured data is not available but it's solution type */}
            {contentType === 'solution' && editorial && !editorialData && !loading && !error && (
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-900/5">
                {isEditing ? (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Edit Solution Content
                    </h2>
                    <textarea
                      value={editorialContent}
                      onChange={(e) => setEditorialContent(e.target.value)}
                      className="w-full h-96 p-4 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm resize-vertical"
                      placeholder="Enter solution content in Markdown format..."
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
                              language={match && match[1]}
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
                
                {/* Embedded YouTube Video */}
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
                    Watch the comprehensive video explanation with step-by-step walkthrough of the {contentType === 'editorial' ? 'concept' : 'solution approaches'}.
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
                    A video explanation for this {contentType === 'editorial' ? 'concept' : 'problem'} is not currently available.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
  .w-full-bleed {
    width: calc(100% + 2rem);
    height: auto;
    display: block;
    margin-left: -1rem;
    margin-right: -1rem;
    padding: 0;
  }

  @media (min-width: 640px) {
    .w-full-bleed {
      width: calc(100% + 3rem);
      margin-left: -1.5rem;
      margin-right: -1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .w-full-bleed {
      width: calc(100% + 4rem);
      margin-left: -2rem;
      margin-right: -2rem;
    }
  }

  /* Custom Scrollbar Styles for Code Blocks */
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  
  .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb {
    background-color: #475569;
    border-radius: 4px;
  }
  
  .scrollbar-track-slate-800::-webkit-scrollbar-track {
    background-color: #1e293b;
  }
  
  .hover\:scrollbar-thumb-slate-500:hover::-webkit-scrollbar-thumb {
    background-color: #64748b;
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  /* For Firefox */
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: #475569 #1e293b;
  }

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

  /* Responsive video adjustments */
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
    
    /* Smaller max height on mobile */
    .max-h-96 {
      max-height: 20rem;
    }
  }

  @media (min-width: 768px) {
    .max-h-96 {
      max-height: 24rem;
    }
  }
`}</style>

    </div>
  );
};

export default EditorialPage;
