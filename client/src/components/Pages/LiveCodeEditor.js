import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Monitor, Smartphone, Tablet, RefreshCw, Download, Code, Eye, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Editor, { useMonaco } from '@monaco-editor/react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';

// Emmet for HTML/CSS abbreviations (optional)
import { emmetHTML, emmetCSS } from 'emmet-monaco-es';

const DEVICE_PRESETS = [
  { id: 'small',  w: 375,  h: 667,  icon: Smartphone, label: 'Mobile' },
  { id: 'medium', w: 768,  h: 1024, icon: Tablet,   label: 'Tablet' },
  { id: 'large',  w: 1920, h: 1080, icon: Monitor,  label: 'Desktop' },
];

// DEFAULT CODE
const DEFAULT_HTML = '<div class="container">\n  <h1>Hello World!</h1>\n  <p>Start coding amazing things!</p>\n</div>';
const DEFAULT_CSS = `body {
  font-family: 'Inter', system-ui, -apple-system, Segoe UI, Arial, sans-serif;
  padding: 24px;
  margin: 0;
  background: #ffffff;
}
.container { max-width: 720px; }
h1 { color: #1f2937; margin: 0 0 8px 0; }
p  { color: #4b5563; }`;
const DEFAULT_JS = '// Write JavaScript here\n// Example: document.querySelector("h1").style.color = "#6366f1";';

const LiveCodeEditor = () => {
  const monaco = useMonaco();
  const navigate = useNavigate();

  // Responsive detection - no limits
  const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const initialHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const [isSmallScreen, setIsSmallScreen] = useState(initialWidth < 768);
  const [windowSize, setWindowSize] = useState({ width: initialWidth, height: initialHeight });

  // Mobile view mode: 'editor', 'preview', 'console'
  const [mobileView, setMobileView] = useState('editor');

  // Code state with refs for smooth typing
  const contentRef = useRef({ html: DEFAULT_HTML, css: DEFAULT_CSS, js: DEFAULT_JS });
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);

  // Preview + console
  const [srcDoc, setSrcDoc] = useState('');
  const [activeTab, setActiveTab] = useState('html');
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [device, setDevice] = useState(DEVICE_PRESETS[2]);
  const [previewKey, setPreviewKey] = useState(0);

  // Refs
  const iframeRef = useRef(null);
  const canvasRef = useRef(null);
  const jsModelRef = useRef(null);
  const bridgeArmedRef = useRef(false);
  const updateTimeoutRef = useRef(null);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      setIsSmallScreen(width < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Load code from URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('code');
      if (encoded) {
        const json = JSON.parse(decodeURIComponent(escape(window.atob(decodeURIComponent(encoded)))));
        if (json?.html || json?.css || json?.js) {
          const newHtml = String(json.html ?? DEFAULT_HTML);
          const newCss = String(json.css ?? DEFAULT_CSS);
          const newJs = String(json.js ?? DEFAULT_JS);
          
          setHtml(newHtml);
          setCss(newCss);
          setJs(newJs);
          
          contentRef.current = { html: newHtml, css: newCss, js: newJs };
        }
      }
    } catch {}
  }, []);

  // COMPREHENSIVE ERROR SUPPRESSION
  useEffect(() => {
    const handleRejection = (event) => {
      try {
        const r = event.reason;
        
        if (r && typeof r === 'object' && (r.type === 'cancelation' || r.type === 'cancellation')) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        
        let msg = '';
        try {
          if (typeof r === 'string') {
            msg = r.toLowerCase();
          } else if (r && typeof r === 'object') {
            msg = (r.message || r.msg || '').toString().toLowerCase();
          }
        } catch {
          msg = '';
        }
        
        const type = (r?.name || r?.type || '').toString().toLowerCase();
        
        if (
          msg.includes('cancel') || type.includes('cancel') ||
          msg.includes('inmemory://model') || msg.includes('could not find source file') ||
          msg.includes('worker') || msg.includes('monaco') ||
          msg.includes('disposed') || msg.includes('timeout') || msg.includes('aborted') ||
          msg.includes('operation is manually canceled')
        ) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      } catch {}
    };

    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = function(...args) {
      try {
        const firstArg = args[0];
        
        if (
          typeof firstArg === 'string' && 
          (firstArg.includes('Error: Uncaught') || firstArg.includes('The above error occurred'))
        ) {
          originalError.apply(console, args);
          return;
        }

        let msg = '';
        try {
          msg = args
            .map(a => {
              if (typeof a === 'string') return a;
              if (a && typeof a === 'object') {
                if (a.type === 'cancelation') return 'cancelation';
                if (a.message) return a.message;
              }
              return '';
            })
            .join(' ')
            .toLowerCase();
        } catch {
          originalError.apply(console, args);
          return;
        }
        
        if (
          msg.includes('monaco') || msg.includes('worker') || msg.includes('cancel') ||
          msg.includes('disposed') || msg.includes('inmemory') ||
          msg.includes('operation is manually canceled') ||
          msg.includes('sandbox') || msg.includes('iframe') ||
          msg.includes('allow-scripts') || msg.includes('allow-same-origin')
        ) {
          return;
        }
        
        originalError.apply(console, args);
      } catch {
        originalError.apply(console, args);
      }
    };

    console.warn = function(...args) {
      try {
        let msg = '';
        try {
          msg = args
            .map(a => {
              if (typeof a === 'string') return a;
              if (a && typeof a === 'object' && a.message) return a.message;
              return '';
            })
            .join(' ')
            .toLowerCase();
        } catch {
          originalWarn.apply(console, args);
          return;
        }
        
        if (
          msg.includes('monaco') || msg.includes('worker') || msg.includes('cancel') ||
          msg.includes('disposed') || 
          msg.includes('sandbox') || msg.includes('iframe') ||
          msg.includes('allow-scripts') || msg.includes('allow-same-origin') ||
          msg.includes('escape') || msg.includes('sandboxing')
        ) {
          return;
        }
        
        originalWarn.apply(console, args);
      } catch {
        originalWarn.apply(console, args);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Init Monaco + Emmet
  useEffect(() => {
    if (!monaco) return;
    try {
      const htmlLang = monaco.languages.html;
      htmlLang?.htmlDefaults?.setOptions?.({ 
        autoClosingTags: true, 
        suggest: { html5: true } 
      });

      const ts = monaco.languages.typescript;
      if (ts?.javascriptDefaults) {
        ts.javascriptDefaults.setCompilerOptions({
          allowJs: true,
          target: ts.ScriptTarget.ES2020,
          checkJs: false,
          noLib: true,
          allowNonTsExtensions: true,
          lib: [],
        });
        ts.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: true,
          noSuggestionDiagnostics: true,
          diagnosticCodesToIgnore: [1108, 1005, 1109, 1434],
        });
        ts.javascriptDefaults.setEagerModelSync(false);
        ts.javascriptDefaults.setMaximumWorkerIdleTime(0);
        
        try {
          ts.javascriptDefaults.setWorkerOptions({ customWorkerPath: '' });
        } catch {}
      }

      emmetHTML?.(monaco);
      emmetCSS?.(monaco);
    } catch {}
  }, [monaco]);

  useEffect(() => {
    if (!monaco) return;
    return () => { 
      try { 
        jsModelRef.current?.dispose?.(); 
        jsModelRef.current = null; 
      } catch {} 
    };
  }, [monaco, activeTab]);

  useEffect(() => { AOS.init({ once: false, duration: 800 }); }, []);

  // Messaging
  useEffect(() => {
    const onMsg = (event) => {
      const d = event.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === 'iframe-ready') {
        bridgeArmedRef.current = true;
        event.source?.postMessage({ type: 'parent-armed' }, '*');
        return;
      }
      if (!bridgeArmedRef.current) return;
      if (d.type === 'log' && Array.isArray(d.data)) setConsoleOutput((p) => [...p, { type:'log', message: d.data.join(' '), time: new Date().toLocaleTimeString() }]);
      else if (d.type === 'error') {
        const msg = (typeof d.message === 'string' && d.message) || (Array.isArray(d.data) ? d.data.join(' ') : 'Unknown error');
        setConsoleOutput((p) => [...p, { type:'error', message: msg, time: new Date().toLocaleTimeString() }]);
      } else if (d.type === 'warn' && Array.isArray(d.data)) setConsoleOutput((p) => [...p, { type:'warn', message: d.data.join(' '), time: new Date().toLocaleTimeString() }]);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Iframe load sync
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => { bridgeArmedRef.current = false; iframe.contentWindow?.postMessage({ type: 'parent-ready' }, '*'); };
    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, [srcDoc]);

  // Smooth typing handlers
  const handleHtmlChange = (value) => {
    const newValue = value || '';
    contentRef.current.html = newValue;
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setHtml(newValue);
    }, 150);
  };

  const handleCssChange = (value) => {
    const newValue = value || '';
    contentRef.current.css = newValue;
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setCss(newValue);
    }, 150);
  };

  const handleJsChange = (value) => {
    const newValue = value || '';
    contentRef.current.js = newValue;
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setJs(newValue);
    }, 150);
  };

  // Build srcDoc - DEBOUNCED
  useEffect(() => {
    setConsoleOutput([]);
    
    const id = setTimeout(() => {
      const doc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <base href="about:blank">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>html, body { background:#fff; margin:0; padding:0; } ${css}</style>
</head>
<body>
  ${html}
  <script>
    (function() {
      let parentArmed = false;
      let messageQueue = [];
      
      function safeSerialize(arg) {
        try {
          if (arg === null) return 'null';
          if (arg === undefined) return 'undefined';
          if (arg instanceof Error) return arg.message;
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return '[object]';
            }
          }
          return String(arg);
        } catch (e) {
          return '[unserializable]';
        }
      }
      
      function post(type, payload) {
        var message = {type: type};
        for (var key in payload) {
          if (payload.hasOwnProperty(key)) {
            message[key] = payload[key];
          }
        }
        
        if (!parentArmed) {
          messageQueue.push(message);
          return;
        }
        
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(message, '*');
          }
        } catch (err) {}
      }
      
      window.addEventListener('message', function(e) {
        if (!e || !e.data) return;
        
        if (e.data.type === 'parent-ready') {
          try {
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({type: 'iframe-ready'}, '*');
            }
          } catch (err) {}
        }
        
        if (e.data.type === 'parent-armed') {
          parentArmed = true;
          
          while (messageQueue.length > 0) {
            var msg = messageQueue.shift();
            try {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage(msg, '*');
              }
            } catch (err) {}
          }
        }
      });
      
      window.addEventListener('error', function(e) {
        post('error', {
          message: (e && e.message) ? e.message : 'Unknown error',
          line: e && e.lineno,
          col: e && e.colno
        });
        return false;
      });
      
      var oldLog = console.log;
      var oldError = console.error;
      var oldWarn = console.warn;
      
      console.log = function() {
        var args = Array.prototype.slice.call(arguments);
        post('log', {data: args.map(safeSerialize)});
      };
      
      console.error = function() {
        var args = Array.prototype.slice.call(arguments);
        post('error', {data: args.map(safeSerialize)});
      };
      
      console.warn = function() {
        var args = Array.prototype.slice.call(arguments);
        post('warn', {data: args.map(safeSerialize)});
      };
      
      setTimeout(function runUserJS() {
        try {
          ${js}
        } catch (err) {
          console.error('Runtime Error: ' + (err && err.message ? err.message : String(err)));
        }
      }, 100);
    })();
  <\/script>
</body>
</html>`;
      setSrcDoc(doc);
    }, 800);
    
    return () => clearTimeout(id);
  }, [html, css, js, previewKey]);

  const handleReset = () => {
    setHtml(DEFAULT_HTML);
    setCss(DEFAULT_CSS);
    setJs(DEFAULT_JS);
    contentRef.current = { html: DEFAULT_HTML, css: DEFAULT_CSS, js: DEFAULT_JS };
    setConsoleOutput([]);
    setPreviewKey((k) => k + 1);
  };

  const handleResetPreview = () => { setConsoleOutput([]); setPreviewKey((k) => k + 1); };
  const clearConsole = () => setConsoleOutput([]);
  const handleBack = () => navigate('/');

  const editorOptions = useMemo(() => ({
    minimap: { enabled: windowSize.width >= 1536 },
    fontSize: isSmallScreen ? 13 : 14,
    lineNumbers: 'on',
    roundedSelection: true,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    formatOnPaste: true,
    formatOnType: true,
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    suggestOnTriggerCharacters: true,
    quickSuggestions: { other: true, comments: false, strings: true },
    snippetSuggestions: 'inline',
    parameterHints: { enabled: true },
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',
  }), [windowSize.width, isSmallScreen]);

  // Device preview scaling
  const [frameStyle, setFrameStyle] = useState({ w: 1920, h: 1080, scale: 1, x: 0, y: 0 });
  useEffect(() => {
    const calc = () => {
      const el = canvasRef.current;
      if (!el) return;
      const W = el.clientWidth, H = el.clientHeight;
      if (device.id === 'large') {
        setFrameStyle({ w: 1920, h: 1080, scale: Math.min(W/1920, H/1080, 1), x: 0, y: 0 });
        return;
      }
      const s = Math.min(W / device.w, H / device.h, 1);
      const w = device.w * s, h = device.h * s;
      setFrameStyle({ w: device.w, h: device.h, scale: s, x: (W - w)/2, y: (H - h)/2 });
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [device]);

  const isLargeDevice = device.id === 'large';

  // Screenshot helpers
  const waitTwoFrames = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
  const capturePreviewCanvas = async () => {
    const wrapper = canvasRef.current;
    const iframe = iframeRef.current;
    if (!wrapper) throw new Error('Preview wrapper not found');
    await waitTwoFrames();

    try {
      if (iframe?.contentWindow?.document) {
        const doc = iframe.contentWindow.document;
        const target = doc.body || doc.documentElement;
        const canvas = await html2canvas(target, {
          useCORS: true,
          backgroundColor: null,
          scale: window.devicePixelRatio || 1,
          imageTimeout: 3000,
          logging: false,
          removeContainer: true,
          width: target.scrollWidth || target.clientWidth,
          height: target.scrollHeight || target.clientHeight,
        });
        return canvas;
      }
    } catch {}

    const prevBg = wrapper.style.backgroundColor;
    const computedBg = getComputedStyle(wrapper).backgroundColor || '#ffffff';
    wrapper.style.backgroundColor = computedBg;
    const canvas = await html2canvas(wrapper, {
      useCORS: true,
      backgroundColor: null,
      scale: window.devicePixelRatio || 1,
      imageTimeout: 3000,
      logging: false,
      removeContainer: true,
    });
    wrapper.style.backgroundColor = prevBg;
    return canvas;
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    zip.file('index.html', html);
    zip.file('styles.css', css);
    zip.file('script.js', js);
    const runner = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>LiveCode Export</title>
<link rel="stylesheet" href="./styles.css" />
</head>
<body>
${html}
<script src="./script.js"></script>
</body>
</html>`;
    zip.file('run.html', runner);

    const shots = zip.folder('screenshots');
    try {
      const canvas = await capturePreviewCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      shots.file(`preview_${device.id}.png`, base64, { base64: true });
    } catch {
      shots.file('README.txt', 'Screenshot not captured. Browsers block rendering cross-origin iframes or assets without CORS.\nOpen run.html to view the output.');
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'livecode_export.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-[#030014] dark:via-slate-900 dark:to-purple-900">
      {/* Header */}
      <div className="relative z-10 bg-white/90 dark:bg-white/5 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={handleBack} className="p-1.5 sm:p-2 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" title="Go Back">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold" style={{ backgroundImage: 'linear-gradient(45deg, #6366f1 10%, #a855f7 93%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Design & Develop
            </h1>
          </div>

          <button
            onClick={handleDownloadZip}
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
            title="Download ZIP"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Export</span> ZIP
          </button>
        </div>
      </div>

      {/* Mobile View Switcher */}
      {isSmallScreen && (
        <div className="bg-white/80 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 px-2 py-2 flex gap-1">
          <button 
            onClick={() => setMobileView('editor')} 
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${mobileView === 'editor' ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}
          >
            <Code className="w-3.5 h-3.5 inline mr-1" /> Editor
          </button>
          <button 
            onClick={() => setMobileView('preview')} 
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${mobileView === 'preview' ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" /> Preview
          </button>
          <button 
            onClick={() => setMobileView('console')} 
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${mobileView === 'console' ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}
          >
            <Terminal className="w-3.5 h-3.5 inline mr-1" /> Console
          </button>
        </div>
      )}

      {/* Main Content */}
      {isSmallScreen ? (
        // Mobile Layout
        <div className="h-[calc(100vh-120px)]">
          {/* Editor View */}
          {mobileView === 'editor' && (
            <div className="h-full flex flex-col">
              <div className="flex border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm overflow-x-auto">
                {[
                  { id: 'html', label: 'HTML', color: 'from-orange-500 to-red-500' },
                  { id: 'css', label: 'CSS', color: 'from-blue-500 to-cyan-500' },
                  { id: 'js', label: 'JS', color: 'from-yellow-500 to-amber-500' },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 px-4 py-2 font-semibold text-xs uppercase tracking-wider transition relative whitespace-nowrap ${activeTab === tab.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {tab.label}
                    {activeTab === tab.id && <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${tab.color}`} />}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-hidden">
                {monaco && activeTab === 'html' && (
                  <Editor height="100%" language="html" value={contentRef.current.html} onChange={handleHtmlChange} theme="vs-dark" options={editorOptions} />
                )}
                {monaco && activeTab === 'css' && (
                  <Editor height="100%" language="css" value={contentRef.current.css} onChange={handleCssChange} theme="vs-dark" options={editorOptions} />
                )}
                {monaco && activeTab === 'js' && (
                  <Editor height="100%" language="javascript" value={contentRef.current.js} onChange={handleJsChange} theme="vs-dark" options={editorOptions} onMount={(editor) => { jsModelRef.current = editor.getModel(); }} />
                )}
                {!monaco && <div className="h-full flex items-center justify-center text-gray-500">Loading editor…</div>}
              </div>
            </div>
          )}

          {/* Preview View */}
          {mobileView === 'preview' && (
            <div className="h-full flex flex-col">
              <div className="px-3 py-2 bg-white/80 dark:bg-white/5 backdrop-blur-sm border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">Preview</h3>
                <div className="flex items-center gap-1">
                  <button onClick={handleResetPreview} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400" title="Reset">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  {DEVICE_PRESETS.map((p) => {
                    const Icon = p.icon;
                    const active = device.id === p.id;
                    return (
                      <button key={p.id} onClick={() => setDevice(p)} className={`p-1.5 rounded-lg transition ${active ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`} title={p.label}>
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div ref={canvasRef} className="flex-1 relative overflow-hidden bg-white">
                <iframe
                  key={previewKey}
                  ref={iframeRef}
                  srcDoc={srcDoc}
                  title="preview"
                  sandbox="allow-scripts allow-same-origin"
                  style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#ffffff' }}
                  frameBorder="0"
                />
              </div>
            </div>
          )}

          {/* Console View */}
          {mobileView === 'console' && (
            <div className="h-full flex flex-col bg-gray-900">
              <div className="px-3 py-2 bg-gray-800 flex items-center justify-between">
                <h3 className="font-semibold text-gray-300 uppercase text-xs tracking-wider">Console</h3>
                <button onClick={clearConsole} className="text-xs text-gray-400 hover:text-white transition px-2 py-1 rounded bg-gray-700">Clear</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1">
                {consoleOutput.length === 0 ? (
                  <div className="text-gray-500 text-xs">Console output will appear here...</div>
                ) : (
                  consoleOutput.map((log, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="text-gray-500 text-[10px]">{log.time}</span>
                      <span className={log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-blue-400'}>
                        {log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : '▶'}
                      </span>
                      <span className={log.type === 'error' ? 'text-red-300' : log.type === 'warn' ? 'text-yellow-300' : 'text-gray-300'}>{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Desktop/Tablet Layout
        <div className="relative z-10 h-[calc(100vh-80px)] flex">
          {/* Editors */}
          <div className="w-1/2 border-r border-gray-200 dark:border-white/10 flex flex-col bg-white/50 dark:bg-white/5">
            <div className="flex border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm">
              {[
                { id: 'html', label: 'HTML', color: 'from-orange-500 to-red-500' },
                { id: 'css', label: 'CSS', color: 'from-blue-500 to-cyan-500' },
                { id: 'js', label: 'JavaScript', color: 'from-yellow-500 to-amber-500' },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 px-6 py-3 font-semibold text-sm uppercase tracking-wider transition relative ${activeTab === tab.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                  {tab.label}
                  {activeTab === tab.id && <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${tab.color}`} />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-hidden">
              {monaco && activeTab === 'html' && (
                <Editor height="100%" language="html" value={contentRef.current.html} onChange={handleHtmlChange} theme="vs-dark" options={editorOptions} />
              )}
              {monaco && activeTab === 'css' && (
                <Editor height="100%" language="css" value={contentRef.current.css} onChange={handleCssChange} theme="vs-dark" options={editorOptions} />
              )}
              {monaco && activeTab === 'js' && (
                <Editor height="100%" language="javascript" value={contentRef.current.js} onChange={handleJsChange} theme="vs-dark" options={editorOptions} onMount={(editor) => { jsModelRef.current = editor.getModel(); }} />
              )}
              {!monaco && <div className="h-full flex items-center justify-center text-gray-500">Loading editor…</div>}
            </div>
          </div>

          {/* Preview + Console */}
          <div className="w-1/2 flex flex-col">
            <div className="h-2/3 border-b border-gray-200 dark:border-white/10 flex flex-col">
              <div className="px-6 py-3 bg-white/80 dark:bg-white/5 backdrop-blur-sm border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 uppercase text-sm tracking-wider">Preview</h3>
                <div className="flex items-center gap-2">
                  <button onClick={handleResetPreview} className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" title="Reset Preview">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  {DEVICE_PRESETS.map((p) => {
                    const Icon = p.icon;
                    const active = device.id === p.id;
                    return (
                      <button key={p.id} onClick={() => setDevice(p)} className={`p-2 rounded-lg transition ${active ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white shadow-lg' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`} title={p.label}>
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div ref={canvasRef} className={`flex-1 relative overflow-hidden ${isLargeDevice ? 'bg-white' : 'bg-black'}`} style={{ margin: 0, padding: 0 }}>
                {isLargeDevice ? (
                  <div style={{ position: 'absolute', left: 0, top: 0, width: `${frameStyle.w}px`, height: `${frameStyle.h}px`, transform: `scale(${frameStyle.scale})`, transformOrigin: 'top left', margin: 0, padding: 0, background: '#fff' }}>
                    <iframe
                      key={previewKey}
                      ref={iframeRef}
                      srcDoc={srcDoc}
                      title="preview"
                      sandbox="allow-scripts allow-same-origin"
                      style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#ffffff' }}
                      frameBorder="0"
                    />
                  </div>
                ) : (
                  <div style={{ position: 'absolute', left: frameStyle.x, top: frameStyle.y, width: `${frameStyle.w}px`, height: `${frameStyle.h}px`, transform: `scale(${frameStyle.scale})`, transformOrigin: 'top left', background: '#ffffff', boxShadow: '0 0 0 1px #111', overflow: 'hidden', margin: 0, padding: 0 }}>
                    <iframe
                      key={previewKey}
                      ref={iframeRef}
                      srcDoc={srcDoc}
                      title="preview"
                      sandbox="allow-scripts allow-same-origin"
                      style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#ffffff' }}
                      frameBorder="0"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="h-1/3 flex flex-col bg-gray-900">
              <div className="px-6 py-3 bg-gray-800 flex items-center justify-between">
                <h3 className="font-semibold text-gray-300 uppercase text-sm tracking-wider">Console</h3>
                <button onClick={clearConsole} className="text-xs text-gray-400 hover:text-white transition px-3 py-1 rounded bg-gray-700 hover:bg-gray-600">Clear</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1">
                {consoleOutput.length === 0 ? (
                  <div className="text-gray-500 text-xs">Console output will appear here...</div>
                ) : (
                  consoleOutput.map((log, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="text-gray-500">{log.time}</span>
                      <span className={log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-blue-400'}>
                        {log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : '▶'}
                      </span>
                      <span className={log.type === 'error' ? 'text-red-300' : log.type === 'warn' ? 'text-yellow-300' : 'text-gray-300'}>{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCodeEditor;
