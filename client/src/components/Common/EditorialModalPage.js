import React, { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Icons
import { 
  FaSpinner, FaImage, FaCopy, FaCheck,
  FaChevronLeft, FaChevronRight, FaPause, FaPlay, FaEye, FaListOl, FaListUl, FaBold, FaItalic, FaCode, FaPlus, 
  FaCircleCheck, FaCircleXmark, FaLink, FaCloudArrowUp, FaCircleInfo, FaTrash, FaArrowTurnDown, FaGripLines, FaDownload
} from 'react-icons/fa6';
import { 
  ChevronDown as ChevronDownLucide, Timer, Terminal, Code2, ChevronRight, X 
} from 'lucide-react';

/* =========================================================================================
   1. UTILITIES & SHARED COMPONENTS
   ========================================================================================= */

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- TOAST NOTIFICATION COMPONENT ---
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] max-w-sm"
            style={{
              backgroundColor: toast.type === 'error' ? '#fef2f2' : toast.type === 'success' ? '#f0fdf4' : '#eff6ff',
              borderColor: toast.type === 'error' ? '#fecaca' : toast.type === 'success' ? '#bbf7d0' : '#bfdbfe',
            }}
          >
            <div className={cn("text-lg", 
              toast.type === 'error' ? "text-red-500" : 
              toast.type === 'success' ? "text-emerald-500" : "text-blue-500"
            )}>
              {toast.type === 'error' ? <FaCircleXmark /> : toast.type === 'success' ? <FaCircleCheck /> : <FaCircleInfo />}
            </div>
            <div className="flex-1">
              <p className={cn("text-sm font-semibold", 
                  toast.type === 'error' ? "text-red-800" : 
                  toast.type === 'success' ? "text-emerald-800" : "text-blue-800"
              )}>
                {toast.message}
              </p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- SECURE IMAGE LOGIC & HELPERS ---

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
          "rounded-xl border-[2px] dark:border-[3.2px] border-[#6257e3] shadow-lg shadow-[#6961b5]/20 w-full h-auto pointer-events-none select-none", 
          className
        )}
        style={{
          ...style,
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
          
          // Render only active, prev and next for performance
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
      <div className="flex items-center justify-between h-10 sm:h-12 px-3 sm:px-4 bg-[#18181b] border-b border-zinc-800 select-none">
        <div className="flex items-center gap-4">
          {/* MAC DOTS */}
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
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
                      "px-3 py-1 text-[11px] font-bold uppercase rounded-md flex items-center gap-1.5 transition-colors",
                      active
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {mode === 'code' ? <Code2 className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
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
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition"
        >
          {localCopied ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
          {localCopied ? 'Copied' : 'Copy'}
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

// --- MARKDOWN COMPONENTS ---
const MarkdownComponents = {
  hr: () => <hr className="my-8 border-t-2 border-gray-200 dark:border-zinc-700" />,
  h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-6 border-b border-gray-200 dark:border-gray-800 pb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">{children}</h3>,
  p: ({ children }) => (
    <p 
      className="text-gray-700 dark:text-gray-300 text-[16px] leading-7 mb-4 whitespace-pre-wrap" 
      style={{ tabSize: 4 }}
    >
      {children}
    </p>
  ),
  ul: ({ children }) => <ul className="text-gray-700 dark:text-gray-300 text-[16px] list-disc ml-5 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="text-gray-700 dark:text-gray-300 text-[16px] list-decimal ml-5 mb-4 space-y-1">{children}</ol>,
  li: ({ children }) => (
    <li 
      className="pl-1 leading-7 whitespace-pre-wrap"
      style={{ tabSize: 4 }}
    >
      {children}
    </li>
  ),
  strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-gray-100">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-800 dark:text-gray-200">{children}</em>,
  a: ({ href, children }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
    >
      {children}
    </a>
  ),
  table: (props) => <div className="my-6 w-full overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700"><table className="w-full text-sm border-collapse text-left" {...props} /></div>,
  thead: (props) => <thead className="bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-gray-100" {...props} />,
  tbody: (props) => <tbody className="bg-white dark:bg-[#0c0c0e]" {...props} />,
  tr: (props) => <tr className="border-t border-gray-300 dark:border-gray-700 even:bg-gray-50 dark:even:bg-zinc-900/30" {...props} />,
  th: (props) => <th className="px-4 py-3 font-semibold border border-gray-300 dark:border-gray-700 whitespace-nowrap" {...props} />,
  td: (props) => <td className="px-4 py-3 border border-gray-300 dark:border-gray-700 align-top text-gray-700 dark:text-gray-300" {...props} />,
  code: ({ inline, children }) => {
    const content = String(children).replace(/\n$/, '');
    if (inline || !content.includes('\n')) {
      return <code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-[14px] font-mono border border-gray-200 dark:border-gray-700/50">{children}</code>;
    }
    return <div className="my-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-[#0c0c0e] border border-gray-200 dark:border-zinc-800"><div className="p-4 overflow-x-auto text-[14px] font-mono text-gray-800 dark:text-gray-200">{children}</div></div>;
  }
};

// --- UNIVERSAL PARSE LOGIC ---
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

    while(i < blockLines.length) {
      const line = blockLines[i];
      
      // Carousel
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
      
      // Image
      const imgM = line.match(/<img\s+src=["']([^"']+)["'][^>]*(?:style=["']([^"']+)["'])?[^>]*\/?>/i);
      if (imgM) {
        flushText();
        elements.push({ type: 'image', src: imgM[1], style: imgM[2] || '', id: `${prefix}img-${elements.length}` });
        i++; continue;
      }
      
      // Code Block Group
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
            i = peek; continue; 
          } else { break; }
        }

        // Unified Output Parsing
        let k = i;
        while(k < blockLines.length && blockLines[k].trim() === '') k++;
        if (k < blockLines.length && (blockLines[k].match(/^### Output/i) || blockLines[k].match(/^Output:/i))) {
          let outputText = '';
          k++;
          while(k < blockLines.length) {
            const nl = blockLines[k];
            if (nl.startsWith('#') || nl.startsWith('```')) break;
            outputText += nl + '\n';
            k++;
          }
          codeGroup.forEach(c => c.output = outputText.trim());
          i = k;
        }

        while(i < blockLines.length) {
          const cl = blockLines[i];
          if (cl.match(/^#+\s*Time Complexity/i)) {
            i++; let t = '';
            while(i < blockLines.length && !blockLines[i].startsWith('#')) { t += blockLines[i] + '\n'; i++; }
            complexity.time = t.trim();
          } else if (cl.match(/^#+\s*Space Complexity/i)) {
            i++; let s = '';
            while(i < blockLines.length && !blockLines[i].startsWith('#')) { s += blockLines[i] + '\n'; i++; }
            complexity.space = s.trim();
          } else if (cl.trim() === '') {
            i++;
          } else { break; }
        }
        
        elements.push({ type: 'code', code: codeGroup, complexity, id: blockId });
        continue;
      }
      
      if (!line.match(/^#+\s*(Time|Space) Complexity/i) && !line.match(/^### Output/i)) {
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
        currentApp = { name: line.substring(3).trim(), id: `approach-${approaches.length}` };
      } else {
        buffer.push(line);
      }
    }
    saveApproach(); 
    result.sections.push({ type: 'approaches', items: approaches });
    
    const postLines = lines.slice(approachesEnd + 1);
    if (postLines.some(l => l.trim())) result.sections.push({ type: 'standard', content: parseBlockLines(postLines, 'post-') });
  } else {
    result.sections.push({ type: 'standard', content: parseBlockLines(lines) });
  }
  return result;
};


/* =========================================================================================
   2. REUSABLE EDITOR COMPONENTS
   ========================================================================================= */

// --- UNIFIED CODE EDITOR INTERFACE (Used in Approaches & Main Editor) ---
const CodeEditorInterface = ({ 
  langs, 
  activeLang, 
  output, 
  onLangAdd, 
  onLangRemove, 
  onLangSelect, 
  onCodeChange, 
  onOutputChange 
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">CODE SNIPPETS</div>
        <button onClick={onLangAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold transition-all shadow-sm">
          <FaPlus /> Language
        </button>
      </div>

      <div className="p-4">
        {/* Language Tabs */}
        {Object.keys(langs || {}).length > 0 ? (
          <div className="flex gap-2 mb-4 flex-wrap">
            {Object.keys(langs).map(l => (
              <button 
                key={l} 
                onClick={() => onLangSelect(l)}
                className={cn(
                  "group relative px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2", 
                  activeLang === l 
                    ? "bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-black" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                )} 
              >
                {l.toUpperCase()} 
                <span 
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity ml-1 p-0.5 rounded-full hover:bg-white/20" 
                  onClick={(e) => { e.stopPropagation(); onLangRemove(l); }}
                  title="Remove language"
                >
                  <X className="w-3 h-3"/>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-4 p-6 border-2 border-dashed border-slate-200 rounded-xl text-center">
            <p className="text-sm text-slate-500 font-medium">No languages added yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click "+ Language" to start coding.</p>
          </div>
        )}

        {/* Code Area */}
        {activeLang && (
          <div className="relative group">
            <div className="absolute top-0 right-0 p-2 opacity-50 text-[10px] font-mono text-white/50 pointer-events-none">{activeLang}</div>
            <textarea 
              className="w-full h-48 p-4 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-900 text-blue-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y leading-relaxed" 
              value={langs[activeLang]} 
              onChange={e => onCodeChange(e.target.value)} 
              placeholder={`Paste or type ${activeLang} code here...`} 
              spellCheck="false"
            />
          </div>
        )}

        {/* Output Area */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">EXPECTED OUTPUT</div>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <textarea 
            className="w-full h-24 p-3 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-colors" 
            value={output || ""} 
            onChange={e => onOutputChange(e.target.value)} 
            placeholder="e.g. [0, 1] (Common output for all languages)" 
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
};


/* =========================================================================================
   3. MAIN EDITORIAL CREATOR PAGE (UPDATED)
   ========================================================================================= */

const LANGUAGES = [
  "cpp", "java", "python", "javascript", "go", "rust", "typescript", "c", "csharp", "kotlin", "swift", "php", "ruby",
];

const STORAGE_KEY = "alpha_editorial_draft";

function EditorialModalPage() {
  // Helper to load initial state from localStorage safely
  const loadState = (key, defaultVal) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed[key] !== undefined ? parsed[key] : defaultVal;
      }
    } catch (e) { console.error("Error loading draft", e); }
    return defaultVal;
  };

  // --- PERSISTENT STATE ---
  const [docTitle, setDocTitle] = useState(() => loadState("docTitle", ""));
  const [editorialHTML, setEditorialHTML] = useState(() => loadState("editorialHTML", ""));
  const [approaches, setApproaches] = useState(() => loadState("approaches", []));
  const [footerHTML, setFooterHTML] = useState(() => loadState("footerHTML", "")); // <--- NEW
  const [inlineBlocks, setInlineBlocks] = useState(() => loadState("inlineBlocks", {}));

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState("editor"); 
  
  const [toasts, setToasts] = useState([]);
  const [showLangModal, setShowLangModal] = useState(false);
  const [langModalTarget, setLangModalTarget] = useState(null);
  const [selectedLang, setSelectedLang] = useState("cpp");
  const [uploading, setUploading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [editingInlineBlockId, setEditingInlineBlockId] = useState(null);

  // Refs
  const editorialEditorRef = useRef(null);
  const footerEditorRef = useRef(null); // <--- NEW
  const approachExplainRefs = useRef({});
  const activeEditorRef = useRef(null);
  const imgPickRef = useRef(null);
  const carouselPickRef = useRef(null);
  
  const [markdownOutput, setMarkdownOutput] = useState("");
  const [selectedTableKey, setSelectedTableKey] = useState(null);

  const ghConfig = useMemo(() => ({
    token: process.env.REACT_APP_GITHUB_TOKEN?.trim(),
    repo: process.env.REACT_APP_GITHUB_REPO?.trim(),
    branch: process.env.REACT_APP_GITHUB_BRANCH?.trim() || "main",
    imgDir: process.env.REACT_APP_GITHUB_IMAGE_DIR?.trim() || "images",
  }), []);

  // --- 1. PERSISTENCE EFFECT ---
  useEffect(() => {
    const dataToSave = {
      docTitle,
      editorialHTML,
      approaches,
      inlineBlocks,
      footerHTML // <--- NEW
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [docTitle, editorialHTML, approaches, inlineBlocks, footerHTML]);
  // --- 2. HYDRATION EFFECT FOR EDITOR DIV ---
  useEffect(() => {
    // 1. Force "Paragraph" mode. This makes Lists work correctly (splitting lines into items).
    // Note: Some browsers need a delay or user interaction, but this helps setup.
    document.execCommand('defaultParagraphSeparator', false, 'p');

    // 2. Hydrate content
    if (editorialEditorRef.current && editorialHTML) {
      if (editorialEditorRef.current.innerHTML !== editorialHTML) {
        editorialEditorRef.current.innerHTML = editorialHTML;
      }
    }
    // Hydrate Footer
    if (footerEditorRef.current && footerHTML) {
        if (footerEditorRef.current.innerHTML !== footerHTML) {
            footerEditorRef.current.innerHTML = footerHTML;
        }
    }
    if (approaches.length === 0 && !localStorage.getItem(STORAGE_KEY)) {
        addApproach();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- TOAST MANAGER ---
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const slugify = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  
  const syncEditorsToState = () => { 
    setEditorialHTML(editorialEditorRef.current?.innerHTML || ""); 
    setFooterHTML(footerEditorRef.current?.innerHTML || ""); // <--- NEW
  };
  
  const changeTab = (nextTab) => { syncEditorsToState(); setActiveTab(nextTab); };
  const setActiveEditor = (keyObj) => { activeEditorRef.current = keyObj; };

  const getActiveEditableElement = () => {
    const k = activeEditorRef.current;
    if (!k) return null;
    if (k.type === "editorial") return editorialEditorRef.current;
    if (k.type === "footer") return footerEditorRef.current; // <--- NEW
    if (k.type === "approachExplain") return approachExplainRefs.current?.[k.approachId]?.current || null;
    return null;
  };

  // --- EDITOR UTILS ---
  const validateEditorAction = () => {
    if (!docTitle || !docTitle.trim()) {
      addToast("Please enter a Solution Title first.", "error");
      return false;
    }
    const el = getActiveEditableElement();
    if (!el) {
      addToast("Please place your cursor inside an editor section first.", "error");
      return false;
    }
    return true;
  };

  const execCmd = (cmd) => {
    if (!validateEditorAction()) return;
    const el = getActiveEditableElement();
    el.focus(); document.execCommand(cmd, false, null); syncEditorsToState();
  };
  const execBlock = (tag) => {
    if (!validateEditorAction()) return;
    const el = getActiveEditableElement();
    el.focus(); document.execCommand("formatBlock", false, tag); syncEditorsToState();
  };
  
  const insertInlineCode = () => {
    if (!validateEditorAction()) return;
    const el = getActiveEditableElement();
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const code = document.createElement("code");
    code.textContent = sel.toString() || "code";
    const space = document.createTextNode("\u00A0");
    range.deleteContents(); range.insertNode(code); range.setStartAfter(code); range.insertNode(space); range.setStartAfter(space); range.collapse(true);
    sel.removeAllRanges(); sel.addRange(range); syncEditorsToState();
  };
const insertLink = () => {
    if (!validateEditorAction()) return;
    
    const url = prompt("Enter URL (e.g., https://leetcode.com):");
    if (!url) return;

    const el = getActiveEditableElement();
    el.focus();
    
    // Standard command to wrap selected text in an <a> tag
    document.execCommand("createLink", false, url);
    
    // Ensure links open in new tab (optional visual helper, handled by markdown export usually)
    const sel = window.getSelection();
    if (sel.anchorNode.parentElement.tagName === 'A') {
        sel.anchorNode.parentElement.target = "_blank";
    }
    
    syncEditorsToState();
  };
  const insertMultiLangBlock = () => {
    if (!validateEditorAction()) return;
    const el = getActiveEditableElement();
    el.focus();

    const blockId = `ibl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setInlineBlocks(prev => ({
        ...prev,
        [blockId]: { langs: { cpp: "" }, activeLang: "cpp", output: "" }
    }));

    const container = document.createElement("div");
    container.className = "inline-code-widget my-6 select-none cursor-pointer group";
    container.contentEditable = "false"; 
    container.dataset.blockId = blockId;

    // UPDATED: Removed newlines/whitespace to prevent gaps
    container.innerHTML = `<div class="border-2 border-dashed border-indigo-300 bg-indigo-50 rounded-xl p-4 flex items-center justify-between hover:bg-indigo-100 transition-colors"><div class="flex items-center gap-3"><div class="p-2 bg-indigo-600 text-white rounded-lg"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></div><div><div class="text-sm font-bold text-indigo-900">Multi-Language Code Block</div><div class="text-xs text-indigo-600 font-mono">ID: ${blockId.substring(0,8)}...</div></div></div><div class="px-3 py-1.5 bg-white text-indigo-600 text-xs font-bold rounded-lg shadow-sm border border-indigo-100 flex items-center gap-2 group-hover:scale-105 transition-transform"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="12" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Click to Edit</div></div>`;
    
    const pBefore = document.createElement("p"); pBefore.innerHTML = "<br/>";
    const pAfter = document.createElement("p"); pAfter.innerHTML = "<br/>";

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(pAfter);
      range.insertNode(container);
      range.insertNode(pBefore);
      range.setStartAfter(pAfter);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      el.appendChild(pBefore);
      el.appendChild(container);
      el.appendChild(pAfter);
    }

    syncEditorsToState();
    setEditingInlineBlockId(blockId);
    addToast("Code block inserted.", "success");
  };

  const handleEditorClick = (e) => {
      const widget = e.target.closest('.inline-code-widget');
      if (widget && widget.dataset.blockId) {
          setEditingInlineBlockId(widget.dataset.blockId);
      }

      const carouselHeader = e.target.closest('.carousel-header');
      if (carouselHeader) {
          const content = carouselHeader.nextElementSibling;
          if (content) {
              const isHidden = content.style.display === 'none';
              content.style.display = isHidden ? 'block' : 'none';
              const icon = carouselHeader.querySelector('.arrow-icon');
              if(icon) icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
              syncEditorsToState();
          }
      }

      selectTable(e.target.closest?.('table'));
  };

  const updateInlineBlock = (id, field, value) => {
      setInlineBlocks(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };
  const updateInlineBlockLang = (id, lang, code) => {
      setInlineBlocks(prev => ({
          ...prev,
          [id]: { ...prev[id], langs: { ...prev[id].langs, [lang]: code } }
      }));
  };
  const addLangToInlineBlock = (id, lang) => {
      setInlineBlocks(prev => {
          const block = prev[id];
          if(block.langs[lang] !== undefined) return prev;
          return { ...prev, [id]: { ...block, activeLang: lang, langs: { ...block.langs, [lang]: "" } } };
      });
  };
  const removeLangFromInlineBlock = (id, lang) => {
      setInlineBlocks(prev => {
        const block = prev[id];
        const newLangs = { ...block.langs }; delete newLangs[lang];
        return { ...prev, [id]: { ...block, langs: newLangs, activeLang: Object.keys(newLangs)[0] || null } };
      });
  };

  // --- TABLE UTILS ---
  const clearSelectedTableHighlight = () => {
    const el = getActiveEditableElement();
    if (!el) return;
    Array.from(el.querySelectorAll("table")).forEach((t) => t.classList.remove("tableSelected"));
  };
  const selectTable = (tableEl) => {
    clearSelectedTableHighlight();
    if (!tableEl) { setSelectedTableKey(null); return; }
    tableEl.classList.add("tableSelected");
    const editorKey = JSON.stringify(activeEditorRef.current);
    const el = getActiveEditableElement();
    const idx = Array.from(el.querySelectorAll("table")).indexOf(tableEl);
    setSelectedTableKey(JSON.stringify({ editorKey, idx }));
    syncEditorsToState();
  };
  const getSelectedTable = () => {
    if (!selectedTableKey) return null;
    const parsed = JSON.parse(selectedTableKey);
    const nowEditorKey = JSON.stringify(activeEditorRef.current);
    if (parsed.editorKey !== nowEditorKey) return null;
    const el = getActiveEditableElement();
    if (!el) return null;
    return el.querySelectorAll("table")[parsed.idx] || null;
  };
  // --- UPDATED UTILS ---
  const insertLineBreak = () => {
    if (!validateEditorAction()) return;
    const el = getActiveEditableElement();
    el.focus();
    // Use execCommand for consistent browser behavior or manual insertion
    const success = document.execCommand('insertLineBreak'); 
    if (!success) {
      // Fallback for browsers that don't support the command
      const br = document.createElement("br");
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(br);
        range.collapse(false);
      }
    }
    syncEditorsToState();
  };
const insertHorizontalRule = () => {
    if (!validateEditorAction()) return;
    const el = getActiveEditableElement();
    el.focus();
    // Insert the standard HTML Horizontal Rule
    document.execCommand('insertHorizontalRule', false, null);
    syncEditorsToState();
  };
  const insertTableActive = () => {
    if (!validateEditorAction()) return;
    const el = getActiveEditableElement();
    el.focus();
    const table = document.createElement("table");
    // Added border style inline ensuring it renders immediately visible
    table.innerHTML = `<thead><tr><th contenteditable="true">Header 1</th><th contenteditable="true">Header 2</th></tr></thead><tbody><tr><td contenteditable="true">Data 1</td><td contenteditable="true">Data 2</td></tr></tbody>`;
    
    // Wrap in div to prevent inline issues
    const wrap = document.createElement("div"); 
    wrap.className = "table-wrapper my-4";
    wrap.appendChild(table);

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) { 
      const r = sel.getRangeAt(0); 
      r.deleteContents(); 
      r.insertNode(wrap);
      // Move cursor after table
      r.setStartAfter(wrap);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    } else { 
      el.appendChild(wrap); 
    }
    selectTable(table); 
    addToast("Table inserted.", "success"); 
    syncEditorsToState();
  };

  const tableAddRow = () => {
    const table = getSelectedTable(); if (!table) return addToast("Select table first", "error");
    
    // Ensure we have a tbody
    let tbody = table.querySelector('tbody');
    if (!tbody) {
      tbody = document.createElement('tbody');
      table.appendChild(tbody);
    }

    // Determine column count based on the first row (head or body)
    const firstRow = table.rows[0];
    const colCount = firstRow ? firstRow.cells.length : 1;

    const tr = document.createElement("tr");
    for (let i = 0; i < colCount; i++) { 
      const td = document.createElement("td"); 
      td.contentEditable = true; 
      // Add a zero-width space so the cell isn't collapsed
      td.textContent = ""; 
      tr.appendChild(td); 
    }
    tbody.appendChild(tr); 
    syncEditorsToState();
  };

  const tableAddCol = () => {
    const table = getSelectedTable(); if (!table) return addToast("Select table first", "error");
    
    // Iterate over ALL rows (thead, tbody, tfoot) to ensure structural integrity
    Array.from(table.rows).forEach((row) => {
       const isHeader = row.parentNode.tagName === 'THEAD';
       const cell = document.createElement(isHeader ? "th" : "td");
       cell.contentEditable = true;
       if(isHeader) cell.textContent = "New Col";
       row.appendChild(cell);
    });
    syncEditorsToState();
  };

  const tableDelRow = () => {
    const table = getSelectedTable(); if (!table) return;
    // Remove the very last row of the table, regardless of section
    const rows = table.rows;
    if (rows.length > 1) { // Prevent deleting the last remaining row completely
       const lastRow = rows[rows.length - 1];
       lastRow.remove();
    } else {
       addToast("Cannot delete the last row.", "error");
    }
    syncEditorsToState();
  };

  const tableDelCol = () => {
    const table = getSelectedTable(); if (!table) return;
    if (table.rows.length === 0) return;

    const colCount = table.rows[0].cells.length;
    if (colCount <= 1) return addToast("Cannot delete the last column.", "error");

    // Remove the last cell from every row
    Array.from(table.rows).forEach(row => {
      if(row.cells.length > 0) {
        row.cells[row.cells.length - 1].remove();
      }
    });
    syncEditorsToState();
  };

  // --- APPROACH MANAGEMENT ---
  const addApproach = () => {
    const id = `ap-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setApproaches((prev) => [...prev, { id, title: "", explanation: "", langs: { cpp: "" }, output: "", activeLang: "cpp", timeComplexity: "", spaceComplexity: "" }]);
    addToast("Approach added.", "success");
  };
  const removeApproach = (id) => { setApproaches((prev) => prev.filter((ap) => ap.id !== id)); delete approachExplainRefs.current[id]; addToast("Approach removed", "info"); };
  const updateApproach = (id, field, value) => { setApproaches((prev) => prev.map((ap) => (ap.id === id ? { ...ap, [field]: value } : ap))); };
  
  const addLangToApproach = (approachId, lang) => {
    setApproaches((prev) => prev.map((ap) => {
      if (ap.id !== approachId) return ap;
      if (ap.langs?.[lang] !== undefined) return ap;
      return { ...ap, activeLang: lang, langs: { ...(ap.langs || {}), [lang]: "" } };
    }));
  };
  const removeLangFromApproach = (approachId, lang) => {
    setApproaches((prev) => prev.map((ap) => {
      if (ap.id !== approachId) return ap;
      const newLangs = { ...(ap.langs || {}) }; delete newLangs[lang];
      return { ...ap, langs: newLangs, activeLang: Object.keys(newLangs)[0] || null };
    }));
  };
  const selectLangApproach = (approachId, lang) => { setApproaches((prev) => prev.map((ap) => ap.id === approachId ? { ...ap, activeLang: lang } : ap)); };
  const updateApproachCode = (approachId, code) => {
    setApproaches((prev) => prev.map((ap) => (ap.id === approachId && ap.activeLang) ? { ...ap, langs: { ...ap.langs, [ap.activeLang]: code } } : ap));
  };
  const updateApproachOutput = (approachId, outputVal) => {
     setApproaches(prev => prev.map(ap => ap.id === approachId ? { ...ap, output: outputVal } : ap));
  };

  // --- IMAGE UPLOAD ---
  const uploadImageToGitHub = async (file, folderName) => {
    if(!ghConfig.token) throw new Error("Missing GitHub Token");
    const safeFolder = folderName.replace(/[^a-z0-9-]/g, ''); 
    const folderPath = safeFolder ? `${ghConfig.imgDir}/${safeFolder}` : ghConfig.imgDir;
    const reader = new FileReader();
    const base64 = await new Promise((res, rej) => { reader.onload = () => res(String(reader.result).split(",")[1]); reader.onerror = rej; reader.readAsDataURL(file); });
    const path = `${folderPath}/${Date.now()}-${file.name.replace(/\s+/g,'_')}`;
    const url = `https://api.github.com/repos/${ghConfig.repo}/contents/${path}`;
    const res = await fetch(url, {
      method: "PUT", headers: { Authorization: `Bearer ${ghConfig.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "upload", content: base64, branch: ghConfig.branch })
    });
    if(!res.ok) throw new Error("Upload Failed");
    const data = await res.json();
    return data.content.download_url;
  };
// --- PASTE HANDLER (Clean AI/Web Content) ---
  const handlePaste = (e) => {
    e.preventDefault(); // Stop default browser paste (which is often messy)

    // Get data
    const text = e.clipboardData.getData("text/plain");
    const html = e.clipboardData.getData("text/html");

    if (html) {
      // Parse the HTML to a DOM document for manipulation
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 1. Remove junk tags
      doc.querySelectorAll('style, script, meta, link, title').forEach(el => el.remove());

      // 2. Iterate over all elements to clean attributes
      doc.body.querySelectorAll('*').forEach(el => {
        // PRESERVE: Internal widgets (if copying/pasting within your own editor)
        if (el.classList.contains('inline-code-widget') || el.classList.contains('carousel-container') || el.tagName === 'IMG') {
            return;
        }

        // STRIP: Remove all inline styles (fixes dark mode backgrounds from AI)
        el.removeAttribute('style');
        
        // STRIP: Remove all classes (fixes random .css-xyz classes from AI)
        el.removeAttribute('class');
        el.removeAttribute('id');
        el.removeAttribute('data-testid'); // Common in React apps

        // FIX: Spans. AI uses <span> for syntax highlighting colors. We want plain text in the editor.
        if (el.tagName === 'SPAN') {
             // If it's just a container span, unwrap it to get text. 
             // (We use a simple approach: if it has no important attrs, it's junk)
             const parent = el.parentNode;
             while (el.firstChild) parent.insertBefore(el.firstChild, el);
             parent.removeChild(el);
        }
      });

      // 3. Fix Code Blocks
      // AI often pastes code as <pre><div class="...">...</div></pre>. 
      // We want to try and make it clean or just text.
      // For this specific editor, since you have a specific "Code Block Widget", 
      // we generally let code paste as text or paragraphs so you can put them into your widget manually.
      // However, formatting preserved for tables and bold/italics is key.

      // Insert the cleaned HTML
      document.execCommand('insertHTML', false, doc.body.innerHTML);
    } else {
      // Fallback: Paste plain text
      document.execCommand('insertText', false, text);
    }
    
    syncEditorsToState();
  };

// --- MS WORD-STYLE AUTOFORMAT ---
  const handleKeyDown = (e) => {
    if (e.key === ' ') {
       const selection = window.getSelection();
       if (!selection.rangeCount) return;
       
       const range = selection.getRangeAt(0);
       const node = range.startContainer;

       // Ensure we are working with text
       if (node.nodeType === Node.TEXT_NODE) {
         const text = node.textContent.substring(0, range.startOffset);
         
         // Pattern: "1." or "1)" at start of line
         const orderedMatch = text.match(/^(?:^|\n)(1\.|1\))$/); 
         
         // Pattern: "-" or "*" or "+" at start of line
         const unorderedMatch = text.match(/^(?:^|\n)([-*+])$/);

         if (orderedMatch || unorderedMatch) {
            e.preventDefault(); // Stop the space from actually happening
            
            // 1. Remove the trigger text (e.g., "1.")
            const cutLength = orderedMatch ? orderedMatch[0].length : unorderedMatch[0].length;
            range.setStart(node, range.startOffset - cutLength);
            range.deleteContents();

            // 2. Execute the List Command
            if (orderedMatch) {
              document.execCommand('insertOrderedList');
            } else {
              document.execCommand('insertUnorderedList');
            }
            
            syncEditorsToState();
         }
       }
    }
    
    // Allow breaking out of lists with 'Enter' if empty
    if (e.key === 'Enter') {
      const commandState = document.queryCommandState('insertOrderedList') || document.queryCommandState('insertUnorderedList');
      if (commandState) {
        const selection = window.getSelection();
        const node = selection.anchorNode;
        // If the current list item is empty (or just invisible char), double enter breaks the list
        if (node.textContent.trim() === '') {
           // Let default behavior happen (it usually breaks list), 
           // but sometimes we might want to force paragraph. 
           // For now, browser default on double enter is usually good.
        }
      }
    }
  };

  const handleImageUpload = async () => {
    try {
      if (!validateEditorAction()) {
          if(imgPickRef.current) imgPickRef.current.value = "";
          return;
      }
      const el = getActiveEditableElement();
      if (!imgPickRef.current?.files?.length) return;
      const folderSlug = slugify(docTitle);
      addToast("Uploading plase wait", "info");
      const url = await uploadImageToGitHub(imgPickRef.current.files[0], folderSlug);
      const img = document.createElement("img"); img.src = url; img.style.maxWidth = "100%";
      el.focus();
      const sel = window.getSelection(); if (sel && sel.rangeCount) sel.getRangeAt(0).insertNode(img); else el.appendChild(img);
      imgPickRef.current.value = ""; 
      addToast("Image inserted successfully.", "success"); 
      syncEditorsToState();
    } catch (e) { addToast(e.message, "error"); }
  };

  const handleCarouselUpload = async () => {
    try {
      if (!validateEditorAction()) {
          if(carouselPickRef.current) carouselPickRef.current.value = "";
          return;
      }
      const el = getActiveEditableElement();
      const files = carouselPickRef.current?.files;
      if (!files?.length) return;
      const folderSlug = slugify(docTitle);
      addToast(`Uploading ${files.length} images`, "info");
      const urls = [];
      for(let i=0; i<files.length; i++) {
        urls.push(await uploadImageToGitHub(files[i], folderSlug));
      }
      
      const div = document.createElement("div"); 
      div.className = "carousel-container"; 
      div.contentEditable = "false"; 
      
      // UPDATED: Removed newlines/whitespace to prevent gaps in pre-wrap editor
      div.innerHTML = `<div class="carousel-header"><div class="text-xs font-bold text-indigo-600 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>CAROUSEL GROUP (${urls.length} Slides)</div><svg class="arrow-icon transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></div><div class="carousel-content">${urls.map(u => `<img src="${u}" class="block mb-2 rounded border w-full shadow-sm" draggable="false"/>`).join('')}</div>`;

      const pBefore = document.createElement("p"); pBefore.innerHTML = "<br/>";
      const pAfter = document.createElement("p"); pAfter.innerHTML = "<br/>";
      el.focus(); 
      const sel = window.getSelection();
      if(sel && sel.rangeCount) { 
          const r = sel.getRangeAt(0); 
          r.deleteContents(); 
          r.insertNode(pAfter); r.insertNode(div); r.insertNode(pBefore);
          r.setStart(pAfter, 0); r.collapse(true);
          sel.removeAllRanges(); sel.addRange(r); 
      } else { 
          el.appendChild(pBefore); el.appendChild(div); el.appendChild(pAfter); 
      }
      carouselPickRef.current.value = ""; 
      addToast("Carousel inserted successfully.", "success"); 
      syncEditorsToState();
    } catch (e) { addToast(e.message, "error"); }
  };

  // --- EXPORT MARKDOWN ---
  const htmlToMarkdown = (html) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    const process = (node) => {
      if (node.nodeType === 3) return node.nodeValue;
      if (node.nodeType !== 1) return "";

      if (node.classList.contains("carousel-container")) {
        return "\n<carousel>\n" + Array.from(node.querySelectorAll("img")).map(i => `<img src="${i.src}" />`).join("\n") + "\n</carousel>\n";
      }

      if (node.classList.contains("inline-code-widget")) {
        const id = node.dataset.blockId;
        const blockData = inlineBlocks[id];
        if (!blockData) return "";
        let blockMd = "";
        Object.keys(blockData.langs || {}).forEach(lang => {
          const code = blockData.langs[lang];
          if (code && code.trim()) {
            blockMd += `\`\`\`${lang}\n${code}\n\`\`\`\n`;
          }
        });
        if (blockData.output && blockData.output.trim()) {
          blockMd += `### Output\n${blockData.output.trim()}\n`;
        }
        return "\n" + blockMd + "\n";
      }

      const tag = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes).map(process).join("");

      if (tag === 'h1') return `\n# ${children.trim()}\n`;
      if (tag === 'h2') return `\n## ${children.trim()}\n`;
      if (tag === 'h3') return `\n### ${children.trim()}\n`;
      if (tag === 'p') return `\n${children}\n`; 
      if (tag === 'hr') return `\n\n---\n\n`;
      if (tag === 'div') return `\n${children}`;
      if (tag === 'br') return `\n`;
      // 1. Bold/Italic: Trim inside to ensure *text* syntax works
      if (tag === 'strong' || tag === 'b') return ` **${children.trim()}** `;
      if (tag === 'em' || tag === 'i') return ` *${children.trim()}* `;
      
      // Lists
      if (tag === 'ol') return '\n' + Array.from(node.children).map((li, i) => `${i + 1}. ${li.textContent.trim()}`).join('\n') + '\n';
      if (tag === 'ul') return '\n' + Array.from(node.children).map(li => `- ${li.textContent.trim()}`).join('\n') + '\n';
      if (tag === 'li') return `- ${children.trim()}\n`;
      
      // Code
      if (tag === 'code') return ` \`${children.trim()}\` `;
      
      // 2. Links: Trim content so [ *text* ] becomes [*text*]
      if (tag === 'a') return ` [${children.trim()}](${node.getAttribute('href')}) `;
      if (tag === 'img') return `\n<img src="${node.src}" />\n`;
      if (tag === 'table') {
        const rows = Array.from(node.querySelectorAll("tr"));
        if (!rows.length) return "";
        const cols = rows[0].cells.length;
        const header = Array.from(rows[0].cells).map(c => c.textContent).join(" | ");
        const sep = Array(cols).fill("---").join(" | ");
        const body = rows.slice(1).map(r => Array.from(r.cells).map(c => c.textContent).join(" | ")).join("\n");
        return `\n| ${header} |\n| ${sep} |\n${body}\n`;
      }
      return children;
    };
    return process(temp).replace(/\n{3,}/g, "\n\n").trim();
  };

  const exportMarkdown = () => {
    let md = `# ${docTitle || "Untitled"}\n\n`;
    md += htmlToMarkdown(editorialEditorRef.current?.innerHTML || editorialHTML) + "\n\n";
    
    if (approaches.length) {
      md += `<approaches>\n`;
      approaches.forEach(ap => {
        md += `## ${ap.title || "Approach"}\n\n${htmlToMarkdown(ap.explanation)}\n\n`;
        Object.keys(ap.langs || {}).forEach(l => {
          if(ap.langs[l]) md += `\`\`\`${l}\n${ap.langs[l]}\n\`\`\`\n\n`;
        });
        if(ap.output && ap.output.trim()) md += `### Output\n${ap.output.trim()}\n\n`;
        if(ap.timeComplexity) md += `# Time Complexity\n${ap.timeComplexity}\n\n`;
        if(ap.spaceComplexity) md += `# Space Complexity\n${ap.spaceComplexity}\n\n`;
      });
      md += `</approaches>\n\n`;
    }

    // Append Footer Content (Summary/Thanks)
    // We add \n\n to ensure it's treated as a new paragraph block by the Markdown parser
    if (footerHTML || footerEditorRef.current?.innerHTML) {
        md += "\n\n" + htmlToMarkdown(footerEditorRef.current?.innerHTML || footerHTML) + "\n";
    }
    
    return md;
  };

  const handleExport = () => { setMarkdownOutput(exportMarkdown()); changeTab("export"); };
  const handleDownload = () => {
    const blob = new Blob([exportMarkdown()], { type: "text/markdown" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${slugify(docTitle)}.md`;
    document.body.appendChild(a); a.click(); a.remove();
    addToast("Download started.", "success");
  };

  // --- NEW: UPLOAD MD AND GET LINK ---
  const handleGitHubUpload = async () => {
    if(!ghConfig.token) {
        addToast("GitHub Token not found in config.", "error");
        return;
    }
    if(!docTitle || !docTitle.trim()) {
        addToast("Please enter a Solution Title first.", "error");
        return;
    }

    setUploading(true);
    try {
        const mdContent = exportMarkdown();
        const folderSlug = slugify(docTitle);
        // Creates a folder with the slug name, and the file inside it
        const fileName = `${folderSlug}.md`;
        const filePath = `${ghConfig.imgDir}/${folderSlug}/${fileName}`;
        const url = `https://api.github.com/repos/${ghConfig.repo}/contents/${filePath}`;

        // 1. Check if file exists to get SHA (for updating)
        let sha = null;
        const checkRes = await fetch(url, {
            method: "GET",
            headers: { Authorization: `Bearer ${ghConfig.token}` }
        });
        
        if (checkRes.ok) {
            const data = await checkRes.json();
            sha = data.sha;
        }

        // 2. Upload (PUT)
        // btoa doesn't handle UTF-8 well, so we use this encodeURIComponent trick
        const b64Content = btoa(unescape(encodeURIComponent(mdContent)));

        const res = await fetch(url, {
            method: "PUT",
            headers: { 
                Authorization: `Bearer ${ghConfig.token}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                message: `Update editorial: ${docTitle}`,
                content: b64Content,
                branch: ghConfig.branch,
                sha: sha || undefined
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || "Upload failed");
        }

        const data = await res.json();
        // data.content.html_url is the viewable link on GitHub
        setGeneratedLink(data.content.html_url);
        setShowLinkModal(true);
        addToast("Uploaded successfully!", "success");

    } catch (e) {
        addToast(`Error: ${e.message}`, "error");
    } finally {
        setUploading(false);
    }
  };

  // --- 3. CLEAR DRAFT FUNCTIONALITY ---
  const handleClearDraft = () => {
    if(!window.confirm("Are you sure you want to clear the draft? This action cannot be undone.")) return;
    
    // Clear storage
    localStorage.removeItem(STORAGE_KEY);
    
    // Reset State
    setDocTitle("");
    setEditorialHTML("");
    setApproaches([]);
    setInlineBlocks({});
    
    // Manually clear editor div
    if(editorialEditorRef.current) editorialEditorRef.current.innerHTML = "";
    
    // Add default approach back after a tiny delay to ensure state cleared
    setTimeout(() => {
        addApproach();
        addToast("Draft cleared successfully.", "success");
    }, 100);
  };


  // --- LIVE PREVIEW COMPONENT ---
  const LivePreview = ({ trigger }) => { 
    const [debouncedContent, setDebouncedContent] = useState("");
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedContent(exportMarkdown());
        }, 500); 
        return () => clearTimeout(handler);
    }, [editorialHTML, approaches, inlineBlocks]);

    const parsed = useMemo(() => universalParse(debouncedContent), [debouncedContent]);
    const [expandedSections, setExpandedSections] = useState({});
    const [codeTabStates, setCodeTabStates] = useState({});

    const toggleSection = (id) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    const renderBlock = (block) => {
      switch(block.type) {
        case 'text': return <div key={block.id} className="prose prose-gray dark:prose-invert prose-lg max-w-none mb-6"><ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{block.content}</ReactMarkdown></div>;
        case 'carousel': return <ImageCarousel key={block.id} images={block.images} />;
        case 'image': return <SecureImage key={block.id} src={block.src} className="max-w-full my-6" />;
        case 'code': return <CodeBlockViewer key={block.id} blocks={block.code} id={block.id} complexity={block.complexity} activeTabState={codeTabStates[block.id]} onTabChange={(val) => setCodeTabStates(prev => ({ ...prev, [block.id]: val }))} />;
        default: return null;
      }
    };

    return (
      <div className="bg-white dark:bg-[#030014] text-[15px] p-6 rounded-2xl border border-slate-200 h-full overflow-y-auto">
         <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{parsed.title || "Untitled Preview"}</h1>
         </div>
         {parsed.sections.map((section, idx) => {
           if (section.type === 'standard') return <div key={idx}>{section.content.map(renderBlock)}</div>;
           if (section.type === 'approaches') return (
             <div key={idx} className="space-y-4">
               {section.items.map((approach, aIdx) => (
                 <div key={approach.id} className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#0c0c0e] shadow-sm">
                   <div onClick={() => toggleSection(approach.id)} className="cursor-pointer p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors select-none">
                     <div className="flex items-center gap-3">
                       <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">{aIdx + 1}</div>
                       <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{approach.name}</h3>
                     </div>
                     {expandedSections[approach.id] ? <ChevronDownLucide className="w-4 h-4 text-indigo-500 rotate-180 transition-transform" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                   </div>
                   <AnimatePresence>
                     {expandedSections[approach.id] && (
                       <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                         <div className="p-4 border-t border-gray-100 dark:border-zinc-800/50 bg-gray-50/50 dark:bg-black/20">
                           {approach.content.map(renderBlock)}
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               ))}
             </div>
           );
           return null;
         })}
      </div>
    );
  };

  const handleLanguageAddConfirm = () => {
    if (!langModalTarget) return;
    if (langModalTarget.type === 'approach') {
        addLangToApproach(langModalTarget.id, selectedLang);
    } else if (langModalTarget.type === 'inline') {
        addLangToInlineBlock(langModalTarget.id, selectedLang);
    }
    setShowLangModal(false);
    setLangModalTarget(null);
  };

  // --- RENDER MAIN LAYOUT ---
  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col overflow-hidden relative">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <style>{`
        .content { color:#0f172a;white-space: pre-wrap; }
        .content h1 { font-size:1.85rem; font-weight:900; margin: 0.5em 0; }
        .content h2 { font-size:1.5rem; font-weight:700; margin: 0.5em 0; }
        .content h3 { font-size:1.25rem; font-weight:600; margin: 0.5em 0; }
        .content code { background:#f1f5f9; padding:2px 5px; border-radius:4px; color:#4f46e5; font-family: monospace; }
        .content table { width:100%; border-collapse: collapse; margin: 1em 0; }
        .content th, .content td { border: 1px solid #cbd5e1; padding: 8px; }
        .content th { background-color: #f8fafc; font-weight: bold; }
        /* Updated List Styling for clear indentation */
        .content ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .content li { margin-bottom: 0.25rem;list-style-position: outside; }
        /* Fix nested lists */
        .content ul ul { list-style-type: circle; margin-top: 0.25rem; }
        .content ol ol { list-style-type: lower-alpha; margin-top: 0.25rem; }
        .carousel-container { margin: 1.5rem 0; border: 1px solid #e0e7ff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .carousel-header { background: #f5f3ff; padding: 10px; cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e0e7ff; }
        .carousel-header:hover { background: #ede9fe; }
        .carousel-content { padding: 10px; background: #fff; }
        .tableSelected { outline: 3px solid rgba(79,70,229,.4); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
      {/* 2. Language Selection Modal */}
      {showLangModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Select Language</h3>
            <select className="w-full px-3 py-2 rounded-xl border mb-4 focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
              {LANGUAGES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <div className="flex gap-2">
                <button className="flex-1 bg-indigo-600 text-white rounded-xl py-2 font-bold hover:bg-indigo-700 transition" onClick={handleLanguageAddConfirm}>Add</button>
                <button className="flex-1 border rounded-xl py-2 font-bold hover:bg-slate-50 transition" onClick={() => setShowLangModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* --- UPDATED: SIMPLE LINK RESULT MODAL --- */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/20 z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c0c0e] rounded-lg border border-gray-200 dark:border-zinc-800 p-5 max-w-sm w-full">
            
            <div className="flex items-center gap-2 mb-4">
                <FaCircleCheck className="w-4 h-4 text-emerald-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Upload Complete</h3>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded px-3 py-2 mb-4 transition-colors hover:border-indigo-300">
                <FaLink className="text-gray-400 w-3 h-3 shrink-0" />
                <input 
                    readOnly 
                    value={generatedLink} 
                    className="bg-transparent w-full text-xs font-mono text-gray-600 dark:text-gray-300 outline-none selection:bg-indigo-100 selection:text-indigo-900" 
                    onClick={(e) => e.target.select()}
                />
            </div>

            <div className="flex items-center gap-3">
                <button 
                    className="flex-1 bg-indigo-600 text-white rounded px-4 py-2 text-xs font-semibold hover:bg-indigo-700 transition-colors" 
                    onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        addToast("Copied!", "success");
                    }}
                >
                    Copy Link
                </button>
                <button 
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" 
                    onClick={() => setShowLinkModal(false)}
                >
                    Close
                </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. Inline Code Block Editor Modal */}
      {editingInlineBlockId && inlineBlocks[editingInlineBlockId] && (
        <div className="fixed inset-0 bg-black/60 z-[55] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Edit Code Block</h3>
                        <p className="text-xs text-slate-500">Add languages and output for this section.</p>
                    </div>
                    <button onClick={() => { setEditingInlineBlockId(null); syncEditorsToState(); }} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800 transition">
                        <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-black/20 flex-1">
                    <CodeEditorInterface 
                        langs={inlineBlocks[editingInlineBlockId].langs}
                        activeLang={inlineBlocks[editingInlineBlockId].activeLang}
                        output={inlineBlocks[editingInlineBlockId].output}
                        onLangAdd={() => { setLangModalTarget({ type: 'inline', id: editingInlineBlockId }); setShowLangModal(true); }}
                        onLangRemove={(l) => removeLangFromInlineBlock(editingInlineBlockId, l)}
                        onLangSelect={(l) => updateInlineBlock(editingInlineBlockId, 'activeLang', l)}
                        onCodeChange={(c) => updateInlineBlockLang(editingInlineBlockId, inlineBlocks[editingInlineBlockId].activeLang, c)}
                        onOutputChange={(o) => updateInlineBlock(editingInlineBlockId, 'output', o)}
                    />
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                    <button onClick={() => { setEditingInlineBlockId(null); syncEditorsToState(); }} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition">
                        Done
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 4. Header (RESPONSIVE) */}
      <div className="bg-white border-b border-slate-200 p-3 sm:p-4 flex justify-between items-center shrink-0 sticky top-0 z-50">
         <div>
            <div className="text-sm sm:text-lg font-black text-slate-900 truncate max-w-[150px] sm:max-w-none">
                Alpha Editorial
            </div>
         </div>
         <div className="flex gap-1.5 sm:gap-2">
             <button 
                 onClick={handleClearDraft} 
                 className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 font-bold text-xs shadow-sm hover:bg-red-100 hover:text-red-700 transition-all"
                 title="Clear Draft"
             >
                 <FaTrash className="w-3.5 h-3.5"/> 
                 <span className="hidden sm:inline">Clear</span>
             </button>
             
            <button 
                onClick={handleGitHubUpload} 
                disabled={uploading} 
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Upload & Get Link"
            >
                {uploading ? <FaSpinner className="animate-spin w-3.5 h-3.5" /> : <FaCloudArrowUp className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{uploading ? "Uploading..." : "Upload"}</span>
            </button>
            
            <button 
                onClick={handleDownload} 
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow hover:bg-emerald-700 transition-all"
                title="Download Markdown"
            >
                <FaDownload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
            </button>
         </div>
      </div>

      {/* 5. Tab Navigation (Small Screens) */}
      <div className="lg:hidden p-2 bg-white border-b border-slate-100 flex gap-2">
        {[{k:'editor',l:'Editor'},{k:'preview',l:'Preview'},{k:'export',l:'Raw MD'}].map(t => (
          <button key={t.k} onClick={() => changeTab(t.k)} className={cn("flex-1 py-2 rounded-lg font-bold text-xs transition-all", activeTab === t.k ? "bg-slate-800 text-white" : "text-slate-600 bg-slate-100")}>{t.l}</button>
        ))}
      </div>

      {/* 6. Main Split Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2">
            
           {/* LEFT COLUMN: EDITOR */}
           <div className={cn("h-full overflow-y-auto p-4 lg:border-r border-slate-200", activeTab !== 'editor' && "hidden lg:block")}>
             
             {/* Document Title (No more status below it) */}
             <div className="mb-4 bg-white border rounded-xl p-4 shadow-sm">
                <label className="text-xs font-bold text-slate-500 uppercase">Solution Title</label>
                <input className="w-full mt-1 text-lg font-bold border-b border-slate-200 focus:border-indigo-500 outline-none pb-1" value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="e.g. Two Sum Solution"/>
             </div>

             {/* Toolbar */}
             <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border border-slate-200 rounded-xl p-2 mb-4 shadow-sm flex flex-wrap gap-1.5 items-center justify-start">
                 <input ref={imgPickRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                 <input ref={carouselPickRef} type="file" accept="image/*" multiple className="hidden" onChange={handleCarouselUpload}/>
                 
                 {/* Formatting Group */}
                 <div className="flex gap-1">
                    <button onClick={() => execCmd('bold')} className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700" title="Bold (Ctrl+B)"><FaBold /></button>
                    <button onClick={() => execCmd('italic')} className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center italic text-slate-700" title="Italic (Ctrl+I)"><FaItalic /></button>
                    <button onClick={insertLink} className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-700" title="Insert Link">
                        <FaLink className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => execCmd('insertUnorderedList')} className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-700" title="Bullet List"><FaListUl /></button>
                    <button onClick={() => execCmd('insertOrderedList')} className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-700" title="Numbered List"><FaListOl /></button>
                    
                    <button onClick={insertLineBreak} className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-700" title="Insert Line Break"><FaArrowTurnDown className="rotate-90" /></button>
                    <button onClick={insertHorizontalRule} className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-700" title="Horizontal Line"><FaGripLines /></button>
                 </div>
                 
                 <div className="w-px h-6 bg-slate-300 mx-1 hidden sm:block"></div>

                 {/* Headings */}
                 <div className="flex gap-1">
                    <button onClick={() => execBlock('h1')} className="px-2 h-8 rounded hover:bg-slate-100 text-xs font-bold">H1</button>
                    <button onClick={() => execBlock('h2')} className="px-2 h-8 rounded hover:bg-slate-100 text-xs font-bold">H2</button>
                    <button onClick={() => execBlock('h3')} className="px-2 h-8 rounded hover:bg-slate-100 text-xs font-bold">H3</button>
                    <button onClick={insertInlineCode} className="px-2 h-8 rounded hover:bg-slate-100 text-xs font-mono border border-slate-200 ml-1">{'< >'}</button>
                 </div>

                 <div className="w-px h-6 bg-slate-300 mx-1 hidden sm:block"></div>

                 {/* Table Controls */}
                 <div className="flex gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                    <button onClick={insertTableActive} className="px-2 h-8 rounded bg-white shadow-sm hover:bg-slate-50 text-xs font-bold">Table</button>
                    <div className="w-px h-full bg-slate-200 mx-1"></div>
                    <button onClick={tableAddRow} className="w-8 h-8 rounded hover:bg-slate-200 text-xs font-bold text-emerald-600" title="Add Row">+R</button>
                    <button onClick={tableDelRow} className="w-8 h-8 rounded hover:bg-slate-200 text-xs font-bold text-red-500" title="Remove Last Row">-R</button>
                    <div className="w-px h-full bg-slate-200 mx-1"></div>
                    <button onClick={tableAddCol} className="w-8 h-8 rounded hover:bg-slate-200 text-xs font-bold text-emerald-600" title="Add Col">+C</button>
                    <button onClick={tableDelCol} className="w-8 h-8 rounded hover:bg-slate-200 text-xs font-bold text-red-500" title="Remove Last Col">-C</button>
                 </div>

                 <div className="w-px h-6 bg-slate-300 mx-1 hidden sm:block"></div>
                 
                 {/* Insert Buttons */}
                 <div className="flex gap-1.5 flex-wrap">
                    <button onClick={insertMultiLangBlock} className="px-2 h-8 rounded bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold flex items-center gap-1"><FaCode /> Code</button>
                    
                    <button onClick={() => { if(validateEditorAction()) imgPickRef.current?.click(); }} className="px-2 h-8 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1">
                       <FaImage /> Img
                    </button>
                    
                    <button onClick={() => { if(validateEditorAction()) carouselPickRef.current?.click(); }} className="px-2 h-8 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold flex items-center gap-1">
                       <FaEye /> Carousel
                    </button>
                 </div>
             </div>

             {/* MAIN EDITORIAL EDITOR */}
             <div className="mb-8">
               <div className="text-xs font-bold text-slate-500 uppercase mb-2">Introduction & Overview</div>
               <div 
                   ref={editorialEditorRef} 
                   className="content min-h-[250px] p-4 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 ring-indigo-100 transition-all" 
                   contentEditable 
                   suppressContentEditableWarning 
                   onFocus={() => setActiveEditor({ type: "editorial" })} 
                   onClick={handleEditorClick} 
                   onInput={syncEditorsToState}
                   onPaste={handlePaste}
                   onKeyDown={handleKeyDown} // <--- ADD THIS
               />
             </div>

             {/* APPROACHES SECTION */}
             <div className="flex justify-between items-center mb-4">
               <div className="text-xs font-bold text-slate-500 uppercase">Approaches</div>
               <button onClick={addApproach} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700">+ Add Approach</button>
             </div>
             
             <div className="space-y-6 pb-20">
               {approaches.map((ap, idx) => (
                  <div key={ap.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                       <div className="flex items-center gap-2 w-full">
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">{idx+1}</span>
                          <input className="font-bold bg-transparent px-2 py-1 w-full focus:bg-white focus:outline-none rounded" value={ap.title} onChange={e => { updateApproach(ap.id, "title", e.target.value); syncEditorsToState(); }} placeholder="Approach Title (e.g. Hash Map)" />
                       </div>
                       <button onClick={() => { removeApproach(ap.id); syncEditorsToState(); }} className="text-red-500 hover:text-red-700 text-xs font-bold px-2">Delete</button>
                    </div>
                    
                    <div className="text-xs font-bold text-slate-400 mb-1">EXPLANATION</div>
                    <div 
                      ref={el => approachExplainRefs.current[ap.id] = { current: el }} 
                      className="content min-h-[120px] p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 ring-indigo-100 mb-4" 
                      contentEditable 
                      suppressContentEditableWarning 
                      dangerouslySetInnerHTML={{ __html: ap.explanation }} 
                      onFocus={() => setActiveEditor({ type: "approachExplain", approachId: ap.id })} 
                      onBlur={e => { updateApproach(ap.id, "explanation", e.currentTarget.innerHTML); syncEditorsToState(); }}
                      onClick={handleEditorClick}
                      onPaste={handlePaste}
                      onKeyDown={handleKeyDown} // <--- ADD THIS
                    />

                    {/* Unified Code Editor for Approaches */}
                    <CodeEditorInterface 
                        langs={ap.langs}
                        activeLang={ap.activeLang}
                        output={ap.output}
                        onLangAdd={() => { setLangModalTarget({ type: 'approach', id: ap.id }); setShowLangModal(true); }}
                        onLangRemove={(l) => { removeLangFromApproach(ap.id, l); syncEditorsToState(); }}
                        onLangSelect={(l) => { selectLangApproach(ap.id, l); syncEditorsToState(); }}
                        onCodeChange={(c) => { updateApproachCode(ap.id, c); syncEditorsToState(); }}
                        onOutputChange={(o) => { updateApproachOutput(ap.id, o); syncEditorsToState(); }}
                    />

                    {/* Complexity */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Time Complexity</label>
                        <input className="w-full mt-1 p-2 text-xs border rounded-lg bg-slate-50" value={ap.timeComplexity} onChange={e => { updateApproach(ap.id, "timeComplexity", e.target.value); syncEditorsToState(); }} placeholder="O(N)" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Space Complexity</label>
                        <input className="w-full mt-1 p-2 text-xs border rounded-lg bg-slate-50" value={ap.spaceComplexity} onChange={e => { updateApproach(ap.id, "spaceComplexity", e.target.value); syncEditorsToState(); }} placeholder="O(1)" />
                      </div>
                    </div>
                  </div>
               ))}
             </div>
             {/* FOOTER SECTION (Summary / Special Thanks) */}
             <div className="mt-8 border-t border-slate-200 pt-6">
               <div className="text-xs font-bold text-slate-500 uppercase mb-2">Summary & Special Thanks</div>
               <div 
                   ref={footerEditorRef} 
                   className="content min-h-[150px] p-4 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 ring-indigo-100 transition-all" 
                   contentEditable 
                   suppressContentEditableWarning 
                   onFocus={() => setActiveEditor({ type: "footer" })} 
                   onClick={handleEditorClick} 
                   onInput={syncEditorsToState}
                   onPaste={handlePaste}
                   onKeyDown={handleKeyDown}
                   placeholder="Add a summary or special thanks here..."
               />
             </div>
           </div>

           {/* RIGHT COLUMN: LIVE PREVIEW */}
           <div className={cn("h-full bg-slate-100 overflow-y-auto", activeTab === 'preview' ? "block" : "hidden lg:block")}>
              <div className="h-full p-6">
                 <div className="sticky top-6">
                    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest"><FaEye className="w-4 h-4"/> Live Preview</div>
                    <LivePreview />
                 </div>
              </div>
           </div>

           {/* EXPORT TAB CONTENT */}
           {activeTab === 'export' && (
             <div className="p-4 lg:hidden">
                <textarea className="w-full h-[80vh] p-4 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl" readOnly value={markdownOutput || exportMarkdown()} />
             </div>
           )}

        </div>
      </div>
    </div>
  );
}

export default EditorialModalPage;