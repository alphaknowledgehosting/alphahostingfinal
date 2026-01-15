import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sheetAPI } from '../../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { 
  FaSpinner, FaExclamationTriangle, FaCheck, FaImage, FaCopy, 
  FaChevronLeft, FaChevronRight, FaPause, FaPlay
} from 'react-icons/fa';
import { 
  ChevronDown as ChevronDownLucide, BookOpen, PlayCircle, 
  ArrowUp, ArrowLeft, Timer, Terminal, GraduationCap, Code2, ChevronRight 
} from 'lucide-react';
import { FaYoutube } from 'react-icons/fa6';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const THEME = {
  light: {
    bg: 'bg-white',
    surface: 'bg-gray-100',
    surfaceAlt: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-800',
    muted: 'text-gray-500',
    accent: 'text-indigo-600',
    accentBg: 'bg-indigo-600',
    accentSoft: 'bg-indigo-500/10',
    codeBg: 'bg-[#f8f9ff]',
    codeBorder: 'border-indigo-200',
    tableHead: 'bg-indigo-50',
    controlHover: 'hover:bg-indigo-100'
  },
  dark: {
    bg: 'bg-[#030014]',
    surface: 'bg-[#0c0c1a]',
    surfaceAlt: 'bg-[#121224]',
    border: 'border-indigo-500/20',
    text: 'text-zinc-100',
    muted: 'text-zinc-400',
    accent: 'text-indigo-400',
    accentBg: 'bg-indigo-500',
    accentSoft: 'bg-indigo-500/10',
    codeBg: 'bg-[#0b0b1e]',
    codeBorder: 'border-indigo-500/30',
    tableHead: 'bg-[#121233]',
    controlHover: 'hover:bg-indigo-500/20'
  }
};



// ==========================================
// CODE BLOCK VIEWER (Fixed: Hooks run unconditionally)
// ==========================================
const CodeBlockViewer = React.memo(({
  blocks,
  id,
  complexity,
  activeTabState,
  onTabChange
}) => {
  // 1. All Hooks must run first (unconditionally)
  const [viewMode, setViewMode] = useState('code');
  const [isComplexityOpen, setIsComplexityOpen] = useState(false);
  const [localCopied, setLocalCopied] = useState(false);
  const copyTimeoutRef = React.useRef(null);

  const { normalizedBlocks, languages, outputContent, currentLang } = React.useMemo(() => {
    // Handle empty data safely inside the hook
    if (!blocks || blocks.length === 0) {
        return { normalizedBlocks: [], languages: [], outputContent: '', currentLang: '' };
    }

    const norm = blocks.map(b => ({ ...b, language: b.language || 'Code' }));
    const langs = norm.map(b => b.language);
    const lang = activeTabState && langs.includes(activeTabState) ? activeTabState : langs[0];
    
    return {
      normalizedBlocks: norm,
      languages: langs,
      currentLang: lang,
      outputContent: norm.find(b => b.output)?.output || ''
    };
  }, [blocks, activeTabState]);

  // 2. NOW it is safe to return null if empty
  if (!blocks || blocks.length === 0) return null;

  const hasOutput = Boolean(outputContent);
  const hasComplexity = complexity?.time || complexity?.space;

  // ---------- COPY ----------
  const handleCopy = () => {
    const text =
      viewMode === 'output'
        ? outputContent
        : normalizedBlocks.find(b => b.language === currentLang)?.code || '';

    navigator.clipboard.writeText(text).then(() => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setLocalCopied(true);
      copyTimeoutRef.current = setTimeout(() => setLocalCopied(false), 2000);
    });
  };

  // ---------- STYLES ----------
  const highlighterStyle = {
    margin: 0,
    padding: '1rem',
    background: 'transparent',
    fontSize: '13px',
    lineHeight: '1.5',
    overflow: 'hidden'
  };

  return (
    <div className="my-6 sm:my-8 w-full rounded-lg sm:rounded-xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden shadow-lg">

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between h-9 sm:h-12 px-2 sm:px-4 bg-[#18181b] border-b border-zinc-800 select-none">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* MAC DOTS */}
          <div className="flex gap-1 sm:gap-1.5">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500" />
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500" />
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500" />
          </div>

          {/* CODE / OUTPUT SWITCH */}
          {hasOutput && (
            <div className="flex items-center p-0.5 bg-zinc-900 rounded-lg border border-zinc-700/50">
              {['code', 'output'].map(mode => {
                const active = viewMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold uppercase rounded-md flex items-center gap-1 sm:gap-1.5 transition-colors",
                      active
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {mode === 'code' 
                      ? <Code2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 
                      : <Terminal className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    }
                    {mode}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* COPY */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-zinc-400 hover:text-white transition"
        >
          {localCopied ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
          <span className="hidden sm:inline">{localCopied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* ================= LANGUAGE TABS ================= */}
      {viewMode === 'code' && (
        <div className="bg-[#121214] border-b border-zinc-800 px-4">
          <div className="flex gap-x-4 overflow-x-auto no-scrollbar">
            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => languages.length > 1 && onTabChange(lang)}
                className={cn(
                  "py-2 text-xs font-medium border-b-2 transition-colors",
                  currentLang === lang
                    ? "border-indigo-500 text-zinc-100"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 disabled:cursor-default"
                )}
              >
                {lang === 'cpp' ? 'C++' : lang === 'py' ? 'Python' : lang}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================= CONTENT ================= */}
      <div className="relative bg-[#0c0c0e]">
        <div
          style={{
            maxHeight: window.innerWidth < 640 ? '240px' : window.innerWidth < 1024 ? '320px' : '380px',
            overflowX: 'auto',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          onScroll={(e) => { e.currentTarget.style.paddingRight = '0px'; }}
        >
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>

          {/* CODE */}
          {viewMode === 'code' && normalizedBlocks.map(block => (
            <div
              key={block.language}
              style={{
                display: block.language === currentLang ? 'block' : 'none',
                minWidth: 'max-content'
              }}
            >
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={block.language.toLowerCase()}
                showLineNumbers
                wrapLines={false}
                customStyle={{
                  background: 'transparent',
                  margin: 0,
                  padding: '1rem',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  minWidth: '100%',
                  caretColor: '#9CDCFE'
                }}
                lineNumberStyle={{
                  minWidth: '2.5em',
                  paddingRight: '1em',
                  color: '#52525b',
                  userSelect: 'none'
                }}
              >
                {block.code}
              </SyntaxHighlighter>
            </div>
          ))}

          {/* OUTPUT */}
          {viewMode === 'output' && (
            <pre
              style={{
                minWidth: 'max-content',
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.5',
                color: '#d4d4d8',
                whiteSpace: 'pre'
              }}
            >
              {outputContent}
            </pre>
          )}
        </div>
      </div>

      {/* ================= COMPLEXITY ================= */}
      {viewMode === 'code' && hasComplexity && (
        <div className="border-t border-zinc-800 bg-[#121214]">
          <button
            onClick={() => setIsComplexityOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            <span className="flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-zinc-500" />
              Complexity Analysis
            </span>
            <ChevronDownLucide
              className={cn("w-3.5 h-3.5 transition-transform", isComplexityOpen && "rotate-180")}
            />
          </button>

          {isComplexityOpen && (
            <div className="px-5 pb-5 pt-3 border-t border-zinc-800/50 space-y-3 text-[13px]">
              {complexity.time && (
                <div className="grid grid-cols-[96px_1fr] gap-4 items-start">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Time</span>
                  <span className="text-zinc-300 leading-relaxed">{complexity.time.replace(/`/g, '')}</span>
                </div>
              )}
              {complexity.space && (
                <div className="grid grid-cols-[96px_1fr] gap-4 items-start">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Space</span>
                  <span className="text-zinc-300 leading-relaxed">{complexity.space.replace(/`/g, '')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});


// ==========================================
// 2. MAIN PAGE & PARSING LOGIC
// ==========================================

const EditorialPage = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const handleBack = () => {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    window.close();
  }
};

  const [problem, setProblem] = useState(null);
  const [parsedContent, setParsedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('editorial');
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedCode, setCopiedCode] = useState({});
  const [codeTabStates, setCodeTabStates] = useState({});

  useEffect(() => {
    if (problemId) {
      loadProblemAndContent();
    }
  }, [problemId]);
// ==========================================
// 3. SECURE IMAGE & CAROUSEL (Clean UI + Synced Autoplay)
// ==========================================

// --- HELPERS (Fast Multi-Strategy Loading) ---
const convertToDirectUrl = (url) => {
  if (!url) return '';
  let cleanUrl = url.trim();

  if (cleanUrl.includes('drive.google.com')) {
    const fileIdMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1] || fileIdMatch[2];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }
  
  if (cleanUrl.includes('github.com') && !cleanUrl.includes('raw.githubusercontent.com')) {
    if (cleanUrl.includes('/blob/')) {
      return cleanUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
  }
  
  if (cleanUrl.includes('dropbox.com') && !cleanUrl.includes('dl=1')) {
    return cleanUrl.replace('dl=0', 'dl=1').replace(/\?.*/, '') + '?dl=1';
  }
  
  if (cleanUrl.includes('1drv.ms')) {
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`;
  }
  
  return cleanUrl;
};

const loadAsDataUrl = async (url) => {
  const response = await fetch(url, { mode: 'cors', method: 'GET', headers: { 'Accept': 'image/*,*/*;q=0.8' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  if (blob.size === 0) throw new Error('Empty response');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
};

const loadViaCanvas = async (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
};

const loadViaProxy = async (url) => {
  const proxyServices = [
    `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=2000&h=2000`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`
  ];
  for (const proxyUrl of proxyServices) {
    try {
      const response = await fetch(proxyUrl, { method: 'GET' });
      if (response.ok) {
        const blob = await response.blob();
        if (blob.size > 0) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
      }
    } catch (e) { continue; }
  }
  throw new Error('All proxies failed');
};

const loadDirect = async (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error('Direct load failed'));
    img.src = url;
  });
};

// --- SECURE IMAGE COMPONENT ---
const SecureImage = ({ src, alt, className, style, onLoad, ...props }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    let mounted = true;
    
    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        if (!src) throw new Error('No source');
        
        const processedSrc = convertToDirectUrl(src);
        
        // Race condition: Whichever method finishes first wins (Fastest Load)
        const loadingMethods = [
          () => loadAsDataUrl(processedSrc),
          () => loadViaCanvas(processedSrc),
          () => loadViaProxy(processedSrc),
          () => loadDirect(processedSrc)
        ];
        
        try {
            const result = await Promise.any(
                loadingMethods.map(method => 
                    method().then(res => {
                        if(!mounted) throw new Error('Unmounted');
                        return res;
                    })
                )
            );
            
            if (mounted) {
                setImageSrc(result);
                setIsLoading(false);
                if (onLoad) onLoad(); // Notify carousel that image is ready
            }
        } catch (e) {
            throw new Error('All loading methods failed');
        }
        
      } catch (error) {
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
          if (onLoad) onLoad(); // Unblock carousel even on error to prevent stalling
        }
      }
    };
    
    loadImage();
    return () => { mounted = false; };
  }, [src]);
  
  // Security Handlers
  const preventAction = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800 w-full min-h-[200px]", className)}>
        <FaSpinner className="animate-spin h-6 w-6 text-indigo-600"/>
      </div>
    );
  }
  
  if (hasError) {
    return (
      <div className="my-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center space-x-3 w-full">
        <FaImage className="w-5 h-5 text-red-500" />
        <p className="text-red-700 dark:text-red-400 font-medium">Image unavailable</p>
      </div>
    );
  }
  
  return (
    <div 
      className="relative group w-full h-full flex justify-center items-center select-none"
      onContextMenu={preventAction}
      onDragStart={preventAction}
    >
      {/* TRANSPARENT SHIELD (Prevents Inspect/Interaction) */}
      <div 
        className="absolute inset-0 z-20 bg-transparent w-full h-full"
        onContextMenu={preventAction}
        onDragStart={preventAction}
      />

      <img
        {...props}
        src={imageSrc}
        alt={alt || "Secure Content"}
        className={cn(
          "rounded-xl border-[2px] dark:border-[3.2px] border-[#6257e3] shadow-lg shadow-[#6961b5]/20 w-full sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 h-auto pointer-events-none select-none", 
          className
        )}
        style={{
          ...style,
          maxHeight: '500px',
          objectFit: 'contain',
          display: 'block',
          userSelect: 'none',
          WebkitUserDrag: 'none'
        }}
        draggable={false}
      />
    </div>
  );
};

// --- IMAGE CAROUSEL COMPONENT (Clean Controls) ---
const ImageCarousel = ({ images }) => {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isCurrentLoaded, setIsCurrentLoaded] = useState(false);
  const length = images.length;

  // Reset load state when slide changes
  useEffect(() => {
    setIsCurrentLoaded(false);
  }, [current]);

  // Autoplay Effect - Pauses logic if current image isn't loaded yet
  useEffect(() => {
    let interval;
    if (isPlaying && length > 1 && isCurrentLoaded) {
      interval = setInterval(() => {
        setCurrent((prev) => (prev === length - 1 ? 0 : prev + 1));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [length, isPlaying, isCurrentLoaded]);

  const nextSlide = () => setCurrent(current === length - 1 ? 0 : current + 1);
  const prevSlide = () => setCurrent(current === 0 ? length - 1 : current - 1);
  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleImageLoad = (index) => {
    if (index === current) {
      setIsCurrentLoaded(true);
    }
  };

  if (!Array.isArray(images) || images.length === 0) return null;

  return (
    <div className="w-full aspect-video max-w-3xl mx-auto my-6 flex flex-col rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 shadow-md select-none bg-black">
      
      <div className="relative w-full h-full flex-1 overflow-hidden group">
        {images.map((imgSrc, index) => {
          const isVisible = index === current;
          const isNext = index === (current + 1) % length;
          const isPrev = index === (current - 1 + length) % length;
          
          if (!isVisible && !isNext && !isPrev) return null;

          return (
            <div
              key={index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <SecureImage 
                src={imgSrc} 
                alt={`Slide ${index + 1}`}
                onLoad={() => handleImageLoad(index)}
                className="!w-full !h-full !object-fill !max-w-none !rounded-none !border-0 !shadow-none !m-0 !p-0"
                style={{ objectFit: 'fill', width: '100%', height: '100%', maxHeight: 'none' }} 
              />
            </div>
          );
        })}
      </div>

      <div className="h-8 bg-gray-100 dark:bg-[#121214] border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-30 relative">
        <div className="w-12 hidden sm:block"></div>
        <div className="flex items-center justify-center gap-4 sm:gap-6 flex-1">
          <button onClick={prevSlide} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors p-1" title="Previous Slide">
            <FaChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <button onClick={togglePlay} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <FaPause className="w-3.5 h-3.5" /> : <FaPlay className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          
          <button onClick={nextSlide} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors p-1" title="Next Slide">
            <FaChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="w-12 text-right">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-mono">
            {current + 1}/{length}
          </span>
        </div>
      </div>
    </div>
  );
};


 // --- MARKDOWN COMPONENT CONFIG (RESPONSIVE + INLINE CODE SAFE) ---
const MarkdownComponents = {
  hr: ({ node, ...props }) => (
    <hr 
      className="
        border-0 
        border-t 
        border-gray-200 dark:border-gray-800 
      " 
      {...props} 
    />
  ),
  h1: ({ node, ...props }) => (
    <h1
      className="
        text-lg sm:text-xl lg:text-3xl
        font-bold
        text-gray-900 dark:text-white
        mt-6 sm:mt-8
        mb-4 sm:mb-6
        border-b border-gray-200 dark:border-gray-800
        pb-2
      "
    >
      {props.children}
    </h1>
  ),

  h2: ({ node, ...props }) => (
    <h2
      className="
        text-base sm:text-lg lg:text-2xl
        font-bold
        text-gray-900 dark:text-white
        mt-6 sm:mt-8
        mb-3 sm:mb-4
      "
    >
      {props.children}
    </h2>
  ),

  /* 🔥 APPROACH HEADINGS (h3) – FIXED & RESPONSIVE */
  h3: ({ node, ...props }) => (
  <h3
    className="
      text-[15px] sm:text-lg lg:text-xl
      font-semibold
      text-gray-900 dark:text-white
      leading-snug
      mt-4 sm:mt-6
      mb-2 sm:mb-3
      break-words
    "
  >
    {props.children}
  </h3>
),



  p: ({ node, ...props }) => (
  <p
    className="
      text-gray-700 dark:text-gray-300
      text-[15px] sm:text-[15px] lg:text-[16px]
      leading-7 sm:leading-7
      mb-4
      whitespace-pre-wrap
      break-words
    "
  >
    {props.children}
  </p>
),


  ul: ({ node, ...props }) => (
    <ul
      className="
        text-gray-700 dark:text-gray-300
        text-[13px] sm:text-[15px] lg:text-[16px]
        list-disc list-outside
        ml-4 sm:ml-5
        mb-4
        space-y-1
      "
    >
      {props.children}
    </ul>
  ),

  ol: ({ node, ...props }) => (
    <ol
      className="
        text-gray-700 dark:text-gray-300
        text-[13px] sm:text-[15px] lg:text-[16px]
        list-decimal list-outside
        ml-4 sm:ml-5
        mb-4
        space-y-1
      "
    >
      {props.children}
    </ol>
  ),

  li: ({ node, ...props }) => (
    <li className="pl-1 leading-6 sm:leading-7 break-words whitespace-pre-wrap">
      {props.children}
    </li>
  ),

  blockquote: ({ node, ...props }) => (
    <blockquote
      className="
        border-l-4 border-indigo-500
        pl-4 pr-3 py-2
        italic
        text-gray-600 dark:text-gray-400
        text-[13px] sm:text-[14px]
        my-4
        bg-gray-50 dark:bg-gray-800/30
        rounded-r
      "
    >
      {props.children}
    </blockquote>
  ),

  a: ({ node, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        text-indigo-600 dark:text-indigo-400
        hover:underline
        break-all
      "
    >
      {props.children}
    </a>
  ),



  /* 🔥 MINIMALIST BORDER-ONLY TABLES */
  table: ({ node, ...props }) => (
    <div className="my-6 w-full overflow-x-auto rounded-lg border border-indigo-200 dark:border-indigo-500/30">
      <table className="w-full text-sm border-collapse text-left" {...props} />
    </div>
  ),

  thead: ({ node, ...props }) => (
    <thead className="bg-transparent text-indigo-900 dark:text-indigo-300 border-b border-indigo-200 dark:border-indigo-500/30" {...props} />
  ),

  tbody: ({ node, ...props }) => (
    <tbody className="bg-transparent" {...props} />
  ),

  tr: ({ node, ...props }) => (
    <tr 
      className="border-b border-indigo-100 dark:border-indigo-500/20 last:border-b-0" 
      {...props} 
    />
  ),

  th: ({ node, ...props }) => (
    <th 
      className="px-4 py-3 font-semibold border-r border-indigo-100 dark:border-indigo-500/20 last:border-r-0 whitespace-nowrap" 
      {...props} 
    />
  ),

  td: ({ node, ...props }) => (
    <td 
      className="px-4 py-3 border-r border-indigo-100 dark:border-indigo-500/20 last:border-r-0 align-top text-gray-700 dark:text-gray-300" 
      {...props} 
    />
  ),


  /* 🔥 INLINE CODE + BLOCK CODE – RESPONSIVE & SAFE */
  code: ({ node, inline, className, children }) => {
    const content = String(children).replace(/\n$/, '');
    const isMultiLine = content.includes('\n');

    /* INLINE CODE */
    if (inline || !isMultiLine) {
      return (
        <code
          className="
            bg-gray-100 dark:bg-gray-800
            text-gray-800 dark:text-gray-200
            px-1.5 py-0.5
            rounded
            text-[12px] sm:text-[13px] lg:text-[14px]
            font-mono
            border border-gray-200 dark:border-gray-700/50
            inline
            break-all
            whitespace-normal
          "
        >
          {children}
        </code>
      );
    }

    /* BLOCK CODE (FALLBACK) */
    return (
      <div
        className="
          my-4
          rounded-lg
          overflow-hidden
          bg-gray-100 dark:bg-[#0c0c0e]
          border border-gray-200 dark:border-zinc-800
        "
      >
        <div
          className="
            p-3 sm:p-4
            overflow-x-auto
            text-[12px] sm:text-[13px] lg:text-[14px]
            font-mono
            text-gray-800 dark:text-gray-200
          "
        >
          {children}
        </div>
      </div>
    );
  }
};


  const getYouTubeVideoId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const copyCode = async (code, key) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setCopiedCode(prev => ({ ...prev, [key]: false })), 2000);
    } catch (err) {}
  };

  const toggleSection = (id) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));

  // --- 3. DATA FETCHING ---
  const loadProblemAndContent = async () => {
    try {
      setLoading(true); setError(null);
      
      let problemData = null;
      try {
        const directProblemResponse = await fetch(`${API_BASE_URL}/api/problems/${problemId}`);
        if (directProblemResponse.ok) {
          const data = await directProblemResponse.json();
          if (data.success && data.problem) problemData = data.problem;
        }
      } catch (e) { console.warn("Direct API fetch failed, trying sheets fallback."); }
      
      if (!problemData) {
        const sheetsResponse = await sheetAPI.getAll();
        const sheets = sheetsResponse.data?.sheets;
        if (sheets) {
          for (const sheet of sheets) {
            for (const section of sheet.sections) {
              for (const subsection of section.subsections) {
                const p = subsection.problems?.find(p => p.id === problemId);
                if (p) { problemData = p; break; }
              }
              if (problemData) break;
            }
            if (problemData) break;
          }
        }
      }

      if (!problemData) throw new Error(`Problem with ID "${problemId}" not found`);
      setProblem(problemData);
      
      if (problemData.editorialLink) {
        let processedUrl = problemData.editorialLink.trim();
        if (processedUrl.includes('github.com') && !processedUrl.includes('raw.githubusercontent.com')) {
           processedUrl = processedUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }
        const response = await fetch(processedUrl);
        if (!response.ok) throw new Error('Failed to fetch content file');
        const text = await response.text();
        setParsedContent(universalParse(text));
      } else {
        setParsedContent({ title: 'No Content', sections: [] });
      }

    } catch (error) { 
        console.error("Error loading content:", error);
        setError(error.message); 
    } finally { 
        setLoading(false); 
    }
  };

  // ==========================================
  // 4. UNIVERSAL PARSER LOGIC
  // ==========================================
  
  const universalParse = (markdown) => {
    const lines = markdown.split('\n');
    const result = { title: '', sections: [] };

    const parseBlockLines = (blockLines, prefix = '') => {
        const elements = [];
        let i = 0;
        let currentText = '';

        const flushText = () => {
            if (currentText.trim()) {
                elements.push({ type: 'text', content: currentText.trim(), id: `${prefix}txt-${elements.length}` });
                currentText = '';
            }
        };

        const isOutputHeader = (line) => !!line.match(/^(\*\*Output:?\*\*|### Output|Output:|Output\s*-|\*OUTPUT)/i);

        while(i < blockLines.length) {
            const line = blockLines[i];

            if (line.trim() === '<carousel>') {
                flushText();
                const images = [];
                i++;
                while(i < blockLines.length && blockLines[i].trim() !== '</carousel>') {
                    const m = blockLines[i].match(/src=["']([^"']+)["']/);
                    if (m) images.push(m[1]);
                    i++;
                }
                if (images.length) elements.push({ type: 'carousel', images, id: `${prefix}car-${elements.length}` });
                i++; continue;
            }

            const imgM = line.match(/<img\s+src=["']([^"']+)["'][^>]*(?:style=["']([^"']+)["'])?[^>]*\/?>/i);
            if (imgM) {
                flushText();
                elements.push({ type: 'image', src: imgM[1], style: imgM[2] || '', id: `${prefix}img-${elements.length}` });
                i++; continue;
            }

            if (line.trim().startsWith('```')) {
                flushText();
                const codeGroup = [];
                const blockId = `${prefix}code-${elements.length}`;
                let complexity = { time: '', space: '' };

                while(i < blockLines.length) {
                    if (!blockLines[i].trim().startsWith('```')) break; 
                    
                    let lang = blockLines[i].substring(3).trim() || 'Code';
                    i++;
                    let codeContent = '';
                    while(i < blockLines.length && !blockLines[i].trim().startsWith('```')) {
                        codeContent += blockLines[i] + '\n';
                        i++;
                    }
                    if (i < blockLines.length) i++; 
                    
                    codeGroup.push({ language: lang, code: codeContent.trim(), output: null });

                    let peek = i;
                    while(peek < blockLines.length && blockLines[peek].trim() === '') peek++;
                    if (peek < blockLines.length && blockLines[peek].trim().startsWith('```')) {
                        i = peek; 
                        continue; 
                    } else {
                        break; 
                    }
                }

                let k = i;
                while(k < blockLines.length && blockLines[k].trim() === '') k++;

                if (k < blockLines.length && isOutputHeader(blockLines[k])) {
                    let outputText = '';
                    k++; 
                    while(k < blockLines.length) {
                        const nl = blockLines[k];
                        if (
    nl.startsWith('#') ||
    nl.startsWith('```') ||
    nl.match(/^#+\s*(Time|Space) Complexity/i) ||
    nl === '<carousel>' ||
    nl === '</carousel>' ||
    nl.startsWith('<img')
  ) break;
                        outputText += nl + '\n';
                        k++;
                    }
                    codeGroup.forEach(c => c.output = outputText.trim());
                    i = k; 
                }

                while(i < blockLines.length) {
                    const currentLine = blockLines[i];
                    if (currentLine.match(/^#+\s*Time Complexity/i)) {
                        i++;
                        let t = '';
                        while(i < blockLines.length && !blockLines[i].startsWith('#')) {
                            if(blockLines[i].trim()) t += blockLines[i] + '\n';
                            i++;
                        }
                        complexity.time = t.trim();
                    } else if (currentLine.match(/^#+\s*Space Complexity/i)) {
                        i++;
                        let s = '';
                        while(i < blockLines.length && !blockLines[i].startsWith('#')) {
                            if(blockLines[i].trim()) s += blockLines[i] + '\n';
                            i++;
                        }
                        complexity.space = s.trim();
                    } else if (currentLine.trim() === '') {
                        i++; 
                    } else {
                        break; 
                    }
                }

                elements.push({ type: 'code', code: codeGroup, complexity, id: blockId });
                continue;
            }

            if (!line.match(/^#+\s*(Time|Space) Complexity/i) && !isOutputHeader(line)) {
                if (line.startsWith('# ') && !result.title) result.title = line.substring(2);
                else currentText += line + '\n';
            }
            i++;
        }
        flushText();
        return elements;
    };

    const approachesStart = lines.findIndex(l => l.trim() === '<approaches>');
    const approachesEnd = lines.findIndex(l => l.trim() === '</approaches>');

    if (approachesStart !== -1 && approachesEnd !== -1) {
        const preLines = lines.slice(0, approachesStart);
        result.sections.push({ type: 'standard', content: parseBlockLines(preLines, 'pre-') });

        const approachLines = lines.slice(approachesStart + 1, approachesEnd);
        const approaches = [];
        let currentApp = null;
        let buffer = [];

        const saveApproach = () => {
            if (currentApp) {
                currentApp.content = parseBlockLines(buffer, `app-${currentApp.id}-`);
                approaches.push(currentApp);
            }
        };

        for (let line of approachLines) {
            if (line.trim().startsWith('## ')) {
                saveApproach();
                buffer = [];
                currentApp = { 
                    name: line.substring(3).trim(), 
                    id: `approach-${approaches.length}` 
                };
            } else {
                buffer.push(line);
            }
        }
        saveApproach(); 
        result.sections.push({ type: 'approaches', items: approaches });

        const postLines = lines.slice(approachesEnd + 1);
        if (postLines.some(l => l.trim())) {
             result.sections.push({ type: 'standard', content: parseBlockLines(postLines, 'post-') });
        }

    } else {
        result.sections.push({ type: 'standard', content: parseBlockLines(lines) });
    }

    return result;
  };

  const renderBlock = (block) => {
    switch(block.type) {
        case 'text': return <div key={block.id} className="prose prose-gray dark:prose-invert prose-lg max-w-none mb-6"><ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{block.content}</ReactMarkdown></div>;
        case 'carousel': return <ImageCarousel key={block.id} images={block.images} />;
        case 'image': return <SecureImage key={block.id} src={block.src} className="max-w-full my-6" />;
        case 'code': 
            return (
                <CodeBlockViewer 
                    key={block.id} 
                    blocks={block.code} 
                    id={block.id} 
                    complexity={block.complexity}
                    activeTabState={codeTabStates[block.id]}
                    onTabChange={(val) => setCodeTabStates(prev => ({ ...prev, [block.id]: val }))}
                    copiedState={copiedCode[`${block.id}-${codeTabStates[block.id] || (block.code[0]?.language || 'Code')}`]}
                    onCopy={copyCode}
                />
            );
        default: return null;
    }
  };

  if (loading) return (<div className="min-h-screen bg-white dark:bg-[#030014] flex items-center justify-center"><div className="flex flex-col items-center gap-4"><FaSpinner className="w-8 h-8 animate-spin text-indigo-600" /><p className="text-gray-500">Loading content...</p></div></div>);
  if (error) return (<div className="min-h-screen bg-white dark:bg-[#030014] flex items-center justify-center p-4"><div className="text-center max-w-md bg-white/50 dark:bg-gray-800/50 backdrop-blur p-8 rounded-2xl border border-gray-200 dark:border-gray-700"><FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Content Not Found</h2><p className="text-gray-500 mb-6">{error}</p><button onClick={() => navigate(-1)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Go Back</button></div></div>);

  return (
    <div className="
  min-h-screen
  bg-white dark:bg-[#030014]
  text-[14px] sm:text-[15px] lg:text-[16px]
">
      {/* ================= RESPONSIVE HEADER ================= */}
    <div
  className="
    sticky top-0 z-50
    bg-white/95 dark:bg-[#030014]/95
    backdrop-blur-xl
    border-b border-gray-200/50 dark:border-gray-800/50
  "
>
  <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 lg:py-4">

    <div className="flex items-center justify-between gap-3 lg:gap-4">

      {/* LEFT */}
      <div className="flex items-center gap-3 lg:gap-4 min-w-0">

        {/* BACK BUTTON */}
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="
            h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10
            flex items-center justify-center
            rounded-lg
            bg-gray-100 dark:bg-gray-800
            hover:bg-gray-200 dark:hover:bg-gray-700
            transition active:scale-95
          "
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-600 dark:text-gray-400" />
        </button>

        {/* TITLE */}
<div className="flex items-center gap-2 lg:gap-3 min-w-0 group">
  <h1
    className="
      text-lg sm:text-xl lg:text-2xl
      font-bold
      truncate
      max-w-[200px] sm:max-w-[400px] lg:max-w-[600px]
      
      bg-gradient-to-r from-[#6366f1] to-[#a855f7] 
      bg-clip-text text-transparent 
      group-hover:from-[#5855eb] group-hover:to-[#9333ea] 
      transition-all
    "
  >
    {parsedContent?.title || problem?.title || 'Editorial'}
  </h1>
</div>
      </div>

      {/* RIGHT : GUIDE / VIDEO */}
      <div
        className="
          flex items-center p-0.5
          bg-gray-100 dark:bg-gray-800
          rounded-lg
          border border-gray-300 dark:border-gray-700/60
        "
      >
        {[
          { key: 'editorial', label: 'Guide', icon: BookOpen },
          { key: 'video', label: 'Video', icon: FaYoutube }
        ].map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "px-3 sm:px-4 lg:px-5 py-1.5 lg:py-2",
                "text-[10px] sm:text-[11px]",
                "font-bold uppercase",
                "rounded-md flex items-center gap-1.5 transition-colors",
                active
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-300"
              )}
            >
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

    </div>
  </div>
</div>


      {/* MAIN CONTENT */}
      <div className="
  max-w-7xl mx-auto
  px-3 sm:px-4 lg:px-6
  pt-1 sm:pt-2
  pb-8
">
        {activeTab === 'editorial' && parsedContent && (
            <div className="space-y-8">
                {parsedContent.sections.map((section, idx) => {
                    if (section.type === 'standard') {
                        return <div key={idx}>{section.content.map(renderBlock)}</div>;
                    }
                    if (section.type === 'approaches') {
                        return (
                            <div key={idx} className="space-y-4">
                                {section.items.map((approach, aIdx) => (
    <div key={approach.id} className="border border-indigo-200/60 dark:border-indigo-500/30 rounded-xl overflow-hidden bg-transparent">
        <div 
            onClick={() => toggleSection(approach.id)} 
            className="cursor-pointer p-5 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-colors select-none"
        >
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-transparent border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                    {aIdx + 1}
                </div>
                <h3 className="text-[15px] sm:text-base font-semibold text-gray-900 dark:text-zinc-100 leading-snug">
                    {approach.name}
                </h3>
            </div>
            {expandedSections[approach.id] 
                ? <ChevronDownLucide className="w-5 h-5 text-indigo-600 dark:text-indigo-400 rotate-180 transition-transform" /> 
                : <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            }
        </div>
        
        <AnimatePresence>
            {expandedSections[approach.id] && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    {/* Background is explicitly transparent here */}
                    <div className="p-6 border-t border-indigo-100 dark:border-indigo-500/20 bg-transparent">
                        {approach.content.map(renderBlock)}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
))}
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        )}

        {activeTab === 'video' && (
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
                    <FaYoutube className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    Video Explanation
                  </h2>
                </div>
                
                {/* CHECK BOTH PROPERTY NAMES HERE */}
                {(problem?.youtubeLink || problem?.videoExplanation) ? (
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
                        <iframe 
                          src={`https://www.youtube.com/embed/${getYouTubeVideoId(problem.youtubeLink || problem.videoExplanation)}?rel=0`} 
                          title="Video" 
                          className="w-full h-full" 
                          allowFullScreen 
                        />
                    </div>
                ) : (
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-500 border border-gray-200 dark:border-gray-800">
                        <PlayCircle className="w-12 h-12 mb-4 opacity-50" /><p>No video explanation available</p>
                    </div>
                )}
            </div>
        )}
      </div>

      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 right-6 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-lg rounded-full text-gray-600 dark:text-gray-300 hover:text-indigo-600 border border-gray-200 dark:border-gray-700 z-50"><ArrowUp className="w-5 h-5" /></button>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .mask-gradient-right { mask-image: linear-gradient(to right, black 85%, transparent 100%); }`}</style>
    </div>
  );
};

export default EditorialPage;