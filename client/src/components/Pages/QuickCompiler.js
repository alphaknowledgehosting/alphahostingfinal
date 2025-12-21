import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft, RotateCcw, Settings, Copy, Download, Upload,
  FileCode2, FilePlus2, Wand2, BookOpen, Sparkles, Zap,
  TerminalSquare, Share2, X, ChevronDown, Monitor, Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Editor, { useMonaco } from '@monaco-editor/react';

const PISTON_API = 'https://emkc.org/api/v2/piston';

const BASE_LANGS = [
  { id: 'cpp', name: 'C++', version: '10.2.0', ext: 'cpp', main: 'main.cpp',
    template: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    cout << "Hello World!\\n";\n    return 0;\n}` },
  { id: 'c', name: 'C', version: '10.2.0', ext: 'c', main: 'main.c',
    template: `#include <stdio.h>\n\nint main() {\n    printf("Hello World!\\n");\n    return 0;\n}` },
  { id: 'java', name: 'Java', version: '15.0.2', ext: 'java', main: 'Main.java',
    template: `import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        System.out.println("Hello World!");\n    }\n}` },
  { id: 'python', name: 'Python', version: '3.10.0', ext: 'py', main: 'main.py',
    template: `print("Hello World!")` },
  { id: 'javascript', name: 'JavaScript', version: '18.15.0', ext: 'js', main: 'main.js',
    template: `console.log("Hello World!");` },
  { id: 'csharp', name: 'C#', version: '6.12.0', ext: 'cs', main: 'main.cs',
    template: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello World!");\n    }\n}` },
];

const EDITOR_THEMES = [
  { id: 'vs-dark', name: 'Dark (Default)' },
  { id: 'vs', name: 'Light' },
  { id: 'hc-black', name: 'High Contrast' },
  { id: 'neon-dark', name: 'Neon Dark' },
];

const CODE_FONTS = [
  { id: 'jetbrains', label: 'JetBrains Mono', css: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  { id: 'fira', label: 'Fira Code', css: '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  { id: 'cascadia', label: 'Cascadia Code', css: '"Cascadia Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  { id: 'source', label: 'Source Code Pro', css: '"Source Code Pro", ui-monospace, monospace' },
  { id: 'inconsolata', label: 'Inconsolata', css: '"Inconsolata", ui-monospace, monospace' },
  { id: 'roboto', label: 'Roboto Mono', css: '"Roboto Mono", ui-monospace, monospace' },
  { id: 'ubuntu', label: 'Ubuntu Mono', css: '"Ubuntu Mono", ui-monospace, monospace' },
  { id: 'monaco', label: 'Monaco', css: 'Monaco, Menlo, Consolas, monospace' },
  { id: 'courier', label: 'Courier New', css: '"Courier New", Courier, monospace' },
];

const STORAGE_KEYS = {
  editorTheme: 'qcmp.editorTheme',
  fontSize: 'qcmp.fontSize',
  fontFamily: 'qcmp.fontFamily',
  ligatures: 'qcmp.ligatures',
  tabs: 'qcmp.tabs',
  activeTab: 'qcmp.activeTab',
  stdin: 'qcmp.stdin',
  args: 'qcmp.args',
  splitPos: 'qcmp.splitPos',
  viewMode: 'qcmp.viewMode',
};

const defaultLang = BASE_LANGS[0];

const QuickCompiler = () => {
  const navigate = useNavigate();
  const monaco = useMonaco();
  const editorRef = useRef(null);
  const changeTimeoutRef = useRef(null);
  const splitContainerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Device detection - no screen size restrictions
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  // View mode for mobile/tablet: 'editor', 'io', 'output'
  const [mobileView, setMobileView] = useState('editor');
  
  // Split pane position (percentage)
  const [splitPosition, setSplitPosition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.splitPos);
    return saved ? Number(saved) : 60;
  });

  // Error suppression effect
  useEffect(() => {
    const handleRejection = (event) => {
      try {
        const reason = event.reason;
        
        if (reason && typeof reason === 'object') {
          if (reason.type === 'cancelation' || reason.type === 'cancellation') {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
          }
        }
        
        let msg = '';
        try {
          if (typeof reason === 'string') {
            msg = reason.toLowerCase();
          } else if (reason && typeof reason === 'object') {
            msg = String(reason.message || reason.msg || '').toLowerCase();
          }
        } catch {
          return;
        }
        
        if (
          msg.includes('cancel') || 
          msg.includes('operation is manually canceled') ||
          msg.includes('inmemory://') || 
          msg.includes('monaco') ||
          msg.includes('worker') || 
          msg.includes('disposed')
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      } catch {}
    };

    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = function(...args) {
      try {
        const str = args.map(a => {
          if (typeof a === 'string') return a;
          if (a && typeof a === 'object') {
            if (a.type === 'cancelation') return 'cancelation';
            if (a.message) return String(a.message);
          }
          return '';
        }).join(' ').toLowerCase();
        
        if (str.includes('cancel') || str.includes('monaco') || str.includes('worker')) {
          return;
        }
      } catch {}
      originalError.apply(console, args);
    };

    console.warn = function(...args) {
      try {
        const str = args.map(a => typeof a === 'string' ? a : '').join(' ').toLowerCase();
        if (str.includes('cancel') || str.includes('monaco')) {
          return;
        }
      } catch {}
      originalWarn.apply(console, args);
    };

    window.addEventListener('unhandledrejection', handleRejection, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection, true);
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Dynamic resize handler - works for all screen sizes
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      setIsSmallScreen(width < 768); // Breakpoint for mobile/tablet layout
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tabs with per-file language
  const [tabs, setTabs] = useState([{
    id: 'main',
    name: defaultLang.main,
    content: defaultLang.template,
    dirty: false,
    languageId: defaultLang.id
  }]);
  const [activeTabId, setActiveTabId] = useState('main');

  // IO + execution
  const [stdin, setStdin] = useState('');
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [args, setArgs] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [runCode, setRunCode] = useState(0);

  // Editor settings
  const [editorTheme, setEditorTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.editorTheme);
    return saved || 'vs-dark';
  });
  
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.fontSize);
    return saved ? Number(saved) : (windowSize.width < 768 ? 13 : 15);
  });
  
  const [fontFamilyId, setFontFamilyId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.fontFamily);
    return saved || 'jetbrains';
  });
  
  const [ligatures, setLigatures] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ligatures);
    return saved === 'true';
  });

  // UI state
  const [showEditorSettings, setShowEditorSettings] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [showShare, setShowShare] = useState(false);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.editorTheme, editorTheme);
  }, [editorTheme]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.fontSize, String(fontSize));
  }, [fontSize]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.fontFamily, fontFamilyId);
  }, [fontFamilyId]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ligatures, String(ligatures));
  }, [ligatures]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.splitPos, String(splitPosition));
  }, [splitPosition]);

  // Load from localStorage
  useEffect(() => {
    const savedTabs = localStorage.getItem(STORAGE_KEYS.tabs);
    const savedActiveTab = localStorage.getItem(STORAGE_KEYS.activeTab);
    const savedStdin = localStorage.getItem(STORAGE_KEYS.stdin);
    const savedArgs = localStorage.getItem(STORAGE_KEYS.args);

    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs);
        if (parsed.length > 0) {
          setTabs(parsed);
          setActiveTabId(savedActiveTab || parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse saved tabs', e);
      }
    }
    
    if (savedStdin) setStdin(savedStdin);
    if (savedArgs) setArgs(savedArgs);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tabs, JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeTab, activeTabId);
  }, [activeTabId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.stdin, stdin);
  }, [stdin]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.args, args);
  }, [args]);

  // Define custom neon theme
  useEffect(() => {
    if (!monaco) return;
    monaco.editor.defineTheme('neon-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc', fontStyle: 'bold' },
        { token: 'string', foreground: 'a7f3d0' },
        { token: 'number', foreground: 'fca5a5' },
        { token: 'type', foreground: '93c5fd' },
      ],
      colors: {
        'editor.background': '#0b0f1a',
        'editor.lineHighlightBackground': '#11182790',
        'editorLineNumber.foreground': '#475569',
        'editorCursor.foreground': '#22d3ee',
        'editor.selectionBackground': '#33415580',
        'editor.selectionHighlightBackground': '#33415555',
        'editorBracketMatch.border': '#7c3aed',
      },
    });
  }, [monaco]);

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0], [tabs, activeTabId]);
  const codeFont = useMemo(() => CODE_FONTS.find(f => f.id === fontFamilyId)?.css, [fontFamilyId]);

  // Map Monaco language IDs
  const getMonacoLanguage = (langId) => {
    const mapping = {
      'cpp': 'cpp',
      'c': 'c',
      'java': 'java',
      'python': 'python',
      'javascript': 'javascript',
      'csharp': 'csharp'
    };
    return mapping[langId] || 'plaintext';
  };

  // Update Monaco language when active tab changes
  useEffect(() => {
    if (!monaco || !editorRef.current) return;
    const model = editorRef.current.getModel?.();
    if (!model || !activeTab) return;
    
    const monacoLang = getMonacoLanguage(activeTab.languageId);
    monaco.editor.setModelLanguage(model, monacoLang);
  }, [monaco, activeTab?.id, activeTab?.languageId]);

  // Debounced content update
  const setTabContent = useCallback((id, content) => {
    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }
    
    setTabs(prev => prev.map(t => t.id === id ? { ...t, content, dirty: true } : t));
  }, []);

  // Update file extension when language changes
  const updateFileExtension = (name, languageId) => {
    const lang = BASE_LANGS.find(l => l.id === languageId);
    if (!lang) return name;
    
    const parts = name.split('.');
    if (parts.length > 1) {
      parts[parts.length - 1] = lang.ext;
      return parts.join('.');
    }
    return `${name}.${lang.ext}`;
  };

  // Change tab language
  const setTabLanguage = (id, languageId) => {
    const newLang = BASE_LANGS.find(l => l.id === languageId);
    if (!newLang) return;

    setTabs(prev => prev.map(t => {
      if (t.id === id) {
        const newName = updateFileExtension(t.name, languageId);
        const shouldUpdateTemplate = !t.dirty || t.content.trim() === '';
        return { 
          ...t, 
          languageId, 
          name: newName, 
          content: shouldUpdateTemplate ? newLang.template : t.content,
          dirty: false 
        };
      }
      return t;
    }));
  };

  const addNewTab = () => {
    const base = defaultLang;
    const idx = tabs.length + 1;
    const name = `file${idx}.${base.ext}`;
    const id = `tab-${Date.now()}`;
    setTabs(prev => [...prev, { id, name, content: base.template, dirty: false, languageId: base.id }]);
    setActiveTabId(id);
  };

  const renameActiveTab = (newName) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? ({ ...t, name: newName }) : t));
  };

  const closeTab = (id) => {
    if (tabs.length === 1) return;
    const idx = tabs.findIndex(t => t.id === id);
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      const next = newTabs[Math.max(0, idx - 1)];
      setActiveTabId(next.id);
    }
  };

  // Resizable split pane handler (desktop only)
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !splitContainerRef.current) return;
      
      const container = splitContainerRef.current;
      const rect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      
      if (newPosition >= 30 && newPosition <= 80) {
        setSplitPosition(newPosition);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleRun = async () => {
    if (!activeTab) return;
    setIsRunning(true);
    setStdout('');
    setStderr('');
    setExecutionTime(null);
    setRunCode(0);

    const tabLang = BASE_LANGS.find(l => l.id === activeTab.languageId) || defaultLang;
    const start = performance.now();
    try {
      const entryName = activeTab.name || tabLang.main;
      const files = [{ name: entryName, content: activeTab.content ?? '' }];

      const payload = {
        language: tabLang.id,
        version: tabLang.version,
        files,
        stdin,
        args: args.trim() ? args.trim().split(' ') : [],
        compile_timeout: 10000,
        run_timeout: 4000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      };

      const res = await fetch(`${PISTON_API}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Piston error ${res.status}: ${text}`);
      }

      const result = await res.json();
      const end = performance.now();
      setExecutionTime(Math.round(end - start));

      const run = result?.run || {};
      const cstderr = result?.compile?.stderr || '';
      setStdout(run.stdout || '');
      setStderr([run.stderr || '', cstderr].filter(Boolean).join('\n'));
      setRunCode(typeof run.code === 'number' ? run.code : 0);
      
      // Auto-switch to output view on mobile after running
      if (isSmallScreen) {
        setMobileView('output');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);
      setStderr(`Error: ${message}`);
      if (isSmallScreen) {
        setMobileView('output');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    const currentLang = BASE_LANGS.find(l => l.id === activeTab?.languageId) || defaultLang;
    setTabs(prev => prev.map(t => 
      t.id === activeTabId 
        ? { ...t, content: currentLang.template, dirty: false } 
        : t
    ));
    toast('Code reset to template');
  };

  const toast = (msg) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 1400);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeTab?.content || '');
    toast('Code copied');
  };

  const handleCopyOutput = () => {
    const text = [stdout, stderr].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    toast('Output copied');
  };

  const handleDownloadCode = () => {
    const name = activeTab?.name || 'code.txt';
    const blob = new Blob([activeTab?.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 200);
    toast('File downloaded');
  };

  const buildShareData = () => {
    const subject = encodeURIComponent(`Share Code (${activeTab?.name || 'code'})`);
    const body = encodeURIComponent(`${activeTab?.name || 'code'}\n\n${activeTab?.content || ''}`);
    const mail = `mailto:?subject=${subject}&body=${body}`;
    const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${activeTab?.name || 'code'}\n\n${activeTab?.content || ''}`)}`;
    const blob = new Blob([activeTab?.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(url);
        toast('Share link copied');
      } catch (e) {
        toast(`Copy failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    };

    return { mail, whatsapp, url, copyLink };
  };

  // Keyboard shortcut for Run
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, stdin, args]);

  const currentLang = BASE_LANGS.find(l => l.id === activeTab?.languageId) || defaultLang;

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 text-slate-200 flex flex-col" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system' }}>
      {/* Header */}
      <div className="relative z-10 bg-slate-900/70 backdrop-blur-xl border-b border-white/10 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 flex-shrink-0">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-3">
            <button onClick={() => navigate('/')} className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-800/60 text-slate-300 hover:text-white transition-all">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold" style={{ backgroundImage: 'linear-gradient(45deg, #6366f1 10%, #a855f7 93%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Code & Conquer
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => setShowShare(s => !s)} className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-800/60 text-slate-300 hover:text-white transition-all" title="Share code">
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile View Switcher */}
      {isSmallScreen && (
        <div className="bg-slate-900/60 border-b border-white/10 px-2 py-2 flex gap-1 flex-shrink-0">
          <button 
            onClick={() => setMobileView('editor')} 
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${mobileView === 'editor' ? 'bg-fuchsia-600 text-white' : 'bg-slate-800/60 text-slate-300'}`}
          >
            <FileCode2 className="w-3.5 h-3.5 inline mr-1" /> Editor
          </button>
          <button 
            onClick={() => setMobileView('io')} 
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${mobileView === 'io' ? 'bg-fuchsia-600 text-white' : 'bg-slate-800/60 text-slate-300'}`}
          >
            <TerminalSquare className="w-3.5 h-3.5 inline mr-1" /> Input
          </button>
          <button 
            onClick={() => setMobileView('output')} 
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${mobileView === 'output' ? 'bg-fuchsia-600 text-white' : 'bg-slate-800/60 text-slate-300'}`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1" /> Output
          </button>
        </div>
      )}

      {/* Main Content */}
      {isSmallScreen ? (
        // Mobile/Tablet Layout - Single View
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor View */}
          {mobileView === 'editor' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="px-2 py-1.5 bg-slate-900/60 border-b border-white/10 flex items-center justify-between flex-shrink-0 overflow-x-auto">
                <div className="flex items-center gap-1 overflow-auto scrollbar-hide">
                  {tabs.map(tab => (
                    <div key={tab.id} className={`group flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors text-xs ${tab.id === activeTabId ? 'bg-slate-800/80 text-white' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                      onClick={() => setActiveTabId(tab.id)}>
                      <FileCode2 className="w-3 h-3" />
                      <span className="whitespace-nowrap">{tab.name}</span>
                      {tab.dirty && <span className="text-fuchsia-300 text-xs">●</span>}
                      {tabs.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-white ml-0.5 text-sm">×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addNewTab} className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 flex-shrink-0 transition-colors text-xs">
                    <FilePlus2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="px-2 py-1.5 bg-slate-900/60 border-b border-white/10 flex items-center gap-1 flex-shrink-0 overflow-x-auto">
                <select
                  value={activeTab?.languageId || defaultLang.id}
                  onChange={(e) => setTabLanguage(activeTabId, e.target.value)}
                  className="appearance-none bg-slate-800/70 text-slate-200 text-xs font-medium rounded-lg pl-2 pr-6 py-1.5 cursor-pointer hover:bg-slate-800 focus:outline-none"
                >
                  {BASE_LANGS.map((lang) => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
                <button onClick={handleCopyCode} className="p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-300" title="Copy">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowEditorSettings(true)} className="p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-300" title="Settings">
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleDownloadCode} className="p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-300" title="Download">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-300" title="Reset">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-xs font-semibold shadow-lg transition-all disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" /> {isRunning ? 'Running...' : 'Run'}
                </button>
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  language={getMonacoLanguage(activeTab?.languageId || defaultLang.id)}
                  value={activeTab?.content || ''}
                  onChange={(value) => setTabContent(activeTabId, value || '')}
                  theme={editorTheme}
                  options={{
                    minimap: { enabled: false },
                    fontSize: fontSize,
                    fontFamily: codeFont,
                    fontLigatures: ligatures,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                  onMount={(editor) => { 
                    editorRef.current = editor;
                    editor.focus();
                  }}
                />
              </div>
            </div>
          )}

          {/* Input View */}
          {mobileView === 'io' && (
            <div className="flex-1 flex flex-col bg-slate-900/40 overflow-hidden">
              <div className="px-3 py-2 bg-slate-900/60 border-b border-white/10 flex-shrink-0">
                <h3 className="text-xs font-semibold tracking-wide text-slate-300">INPUT</h3>
              </div>
              <div className="p-2 flex flex-col gap-2 border-b border-white/10 bg-slate-900/40 flex-shrink-0">
                <input
                  value={args}
                  onChange={(e) => setArgs(e.target.value)}
                  placeholder="Runtime arguments (space-separated)"
                  className="w-full px-3 py-2 bg-slate-800/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  style={{ fontFamily: codeFont }}
                />
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                className="flex-1 w-full p-3 bg-slate-950/60 text-slate-200 text-sm resize-none focus:outline-none placeholder-slate-500 custom-scrollbar"
                placeholder="Enter stdin..."
                style={{ fontFamily: codeFont }}
              />
              <div className="p-2 bg-slate-900/60 border-t border-white/10 flex gap-2">
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" /> {isRunning ? 'Running...' : 'Run Code'}
                </button>
              </div>
            </div>
          )}

          {/* Output View */}
          {mobileView === 'output' && (
            <div className="flex-1 flex flex-col bg-slate-900/40 overflow-hidden">
              <div className="px-3 py-2 bg-slate-900/60 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-slate-300">OUTPUT</h3>
                  {executionTime != null && (
                    <p className={`text-[10px] mt-0.5 ${runCode === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Exit {runCode} · {executionTime}ms</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={handleCopyOutput} className="px-2 py-1 rounded-lg hover:bg-slate-800/60 text-xs text-slate-300" title="Copy">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setStdout(''); setStderr(''); }} className="px-2 py-1 rounded-lg hover:bg-slate-800/60 text-xs text-slate-300">
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 bg-slate-950/60 text-sm custom-scrollbar" style={{ fontFamily: codeFont }}>
                {!stdout && !stderr && !isRunning && (
                  <div className="text-slate-500 text-xs">Output will appear here after running your code…</div>
                )}
                {isRunning && (
                  <div className="text-amber-300 animate-pulse text-sm">⏳ Executing code…</div>
                )}
                {stdout && (
                  <pre className="text-emerald-300 whitespace-pre-wrap break-words text-xs sm:text-sm">{stdout}</pre>
                )}
                {stderr && (
                  <pre className="text-rose-300 whitespace-pre-wrap break-words mt-2 text-xs sm:text-sm">{stderr}</pre>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Desktop Layout - Split View
        <div ref={splitContainerRef} className="relative flex-1 flex overflow-hidden">
          {/* Left: Editor */}
          <div className="flex flex-col overflow-hidden" style={{ width: `${splitPosition}%` }}>
            {/* Tabs */}
            <div className="px-3 py-2 bg-slate-900/60 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1 overflow-auto scrollbar-hide">
                {tabs.map(tab => (
                  <div key={tab.id} className={`group flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer mr-1 transition-colors ${tab.id === activeTabId ? 'bg-slate-800/80 text-white' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                    onClick={() => setActiveTabId(tab.id)}>
                    <FileCode2 className="w-4 h-4" />
                    <span className="text-sm whitespace-nowrap">{tab.name}</span>
                    {tab.dirty && <span className="text-fuchsia-300 text-xs">●</span>}
                    {tabs.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-white ml-1">×</button>
                    )}
                  </div>
                ))}
                <button onClick={addNewTab} className="ml-1 inline-flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 flex-shrink-0 transition-colors">
                  <FilePlus2 className="w-4 h-4" /> New
                </button>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative">
                  <select
                    value={activeTab?.languageId || defaultLang.id}
                    onChange={(e) => setTabLanguage(activeTabId, e.target.value)}
                    className="appearance-none bg-slate-800/70 text-slate-200 text-sm font-medium rounded-lg pl-3 pr-8 py-2 cursor-pointer hover:bg-slate-800 focus:outline-none"
                  >
                    {BASE_LANGS.map((lang) => (
                      <option key={lang.id} value={lang.id}>{lang.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button onClick={handleCopyCode} className="p-2 rounded-lg hover:bg-slate-800/60 text-slate-300 hover:text-white transition-colors" title="Copy code">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => setShowEditorSettings(true)} className="p-2 rounded-lg hover:bg-slate-800/60 text-slate-300 hover:text-white transition-colors" title="Editor settings">
                  <Settings className="w-4 h-4" />
                </button>
                <button onClick={handleDownloadCode} className="p-2 rounded-lg hover:bg-slate-800/60 text-slate-300 hover:text-white transition-colors" title="Download file">
                  <Download className="w-4 h-4" />
                </button>
                <label className="p-2 rounded-lg hover:bg-slate-800/60 text-slate-300 hover:text-white transition-colors cursor-pointer" title="Upload file">
                  <Upload className="w-4 h-4" />
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const ext = (file.name.split('.').pop() || '').toLowerCase();
                        const mapExtToLang = { 
                          cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', c: 'c',
                          java: 'java', py: 'python', js: 'javascript', cs: 'csharp'
                        };
                        const langId = mapExtToLang[ext] || defaultLang.id;
                        const id = `tab-${Date.now()}`;
                        setTabs(prev => [...prev, { id, name: file.name, content: String(evt.target?.result || ''), dirty: false, languageId: langId }]);
                        setActiveTabId(id);
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }
                  }} accept=".cpp,.c,.cc,.cxx,.hpp,.java,.py,.js,.cs,.txt" />
                </label>
                <button onClick={() => {
                  const newName = prompt('Rename current file:', activeTab?.name || '');
                  if (newName?.trim()) renameActiveTab(newName.trim());
                }} className="p-2 rounded-lg hover:bg-slate-800/60 text-slate-300 hover:text-white transition-colors" title="Rename file">
                  <Wand2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={getMonacoLanguage(activeTab?.languageId || defaultLang.id)}
                value={activeTab?.content || ''}
                onChange={(value) => setTabContent(activeTabId, value || '')}
                theme={editorTheme}
                options={{
                  minimap: { enabled: windowSize.width >= 1536 },
                  fontSize,
                  fontFamily: codeFont,
                  fontLigatures: ligatures,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true,
                }}
                onMount={(editor) => { 
                  editorRef.current = editor;
                  editor.focus();
                }}
              />
            </div>

            {/* Status bar */}
            <div className="h-8 bg-slate-900/70 border-t border-white/10 text-xs px-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <TerminalSquare className={`w-4 h-4 ${runCode === 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                <span>{currentLang.name}</span>
                <span className="text-slate-400">v{currentLang.version}</span>
                {executionTime != null && <span>· {executionTime}ms</span>}
                {activeTab && <span>· {activeTab.name}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span>{editorTheme}</span>
                <span>{fontSize}px</span>
              </div>
            </div>
          </div>

          {/* Resizer */}
          <div 
            className="w-1 bg-slate-800/40 hover:bg-slate-700/60 cursor-col-resize transition-colors relative group flex-shrink-0 flex items-center justify-center"
            onMouseDown={handleMouseDown}
          >
            <div className="flex flex-col gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
              <div className="w-1 h-1 rounded-full bg-slate-500 group-hover:bg-fuchsia-400"></div>
              <div className="w-1 h-1 rounded-full bg-slate-500 group-hover:bg-fuchsia-400"></div>
              <div className="w-1 h-1 rounded-full bg-slate-500 group-hover:bg-fuchsia-400"></div>
            </div>
          </div>

          {/* Right: IO & Output */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Controls */}
            <div className="px-4 py-2 bg-slate-900/60 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-fuchsia-400" />
                <span className="text-sm font-medium text-slate-300">Running: {activeTab?.name || 'untitled'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" /> {isRunning ? 'Running...' : 'Run'}
                </button>
                <button onClick={handleReset} className="px-3 py-2 hover:bg-slate-800/60 text-slate-300 hover:text-white rounded-lg transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* INPUT */}
            <div className="h-[30%] border-b border-white/10 flex flex-col bg-slate-900/40 flex-shrink-0">
              <div className="px-4 py-2 bg-slate-900/60 border-b border-white/10 flex-shrink-0">
                <h3 className="text-xs font-semibold tracking-wide text-slate-300">INPUT</h3>
              </div>
              <div className="p-2 flex items-center gap-2 border-b border-white/10 bg-slate-900/40 flex-shrink-0">
                <input
                  value={args}
                  onChange={(e) => setArgs(e.target.value)}
                  placeholder="Runtime arguments (space-separated)"
                  className="flex-1 px-3 py-1.5 bg-slate-800/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  style={{ fontFamily: codeFont }}
                />
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                className="flex-1 w-full p-4 bg-slate-950/60 text-slate-200 text-sm resize-none focus:outline-none placeholder-slate-500 custom-scrollbar"
                placeholder="Enter stdin..."
                style={{ fontFamily: codeFont }}
              />
            </div>

            {/* OUTPUT */}
            <div className="flex-1 flex flex-col bg-slate-900/40 overflow-hidden">
              <div className="px-4 py-2 bg-slate-900/60 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-slate-300">OUTPUT</h3>
                  {executionTime != null && (
                    <p className={`text-[11px] mt-0.5 ${runCode === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Exit {runCode} · {executionTime}ms</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopyOutput} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800/60 text-xs text-slate-300 hover:text-white transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                  <button onClick={() => { setStdout(''); setStderr(''); }} className="px-2 py-1.5 rounded-lg hover:bg-slate-800/60 text-xs text-slate-300 hover:text-white transition-colors">
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-slate-950/60 text-sm custom-scrollbar" style={{ fontFamily: codeFont }}>
                {!stdout && !stderr && !isRunning && (
                  <div className="text-slate-500 text-xs">Output will appear here after running your code…</div>
                )}
                {isRunning && (
                  <div className="text-amber-300 animate-pulse">⏳ Executing code…</div>
                )}
                {stdout && (
                  <pre className="text-emerald-300 whitespace-pre-wrap break-words">{stdout}</pre>
                )}
                {stderr && (
                  <pre className="text-rose-300 whitespace-pre-wrap break-words mt-2">{stderr}</pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Settings Modal */}
      {showEditorSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowEditorSettings(false)} />
          <div className="relative z-10 w-full max-w-lg bg-slate-900 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-base font-semibold tracking-wide text-slate-200">Editor Settings</h3>
              </div>
              <button onClick={() => setShowEditorSettings(false)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <X className="w-4 h-4 text-slate-300" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Editor Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {EDITOR_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setEditorTheme(t.id)}
                      className={`px-4 py-3 rounded-lg transition-all text-sm ${
                        editorTheme === t.id
                          ? 'bg-fuchsia-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Code Font</label>
                <div className="relative">
                  <select
                    value={fontFamilyId}
                    onChange={(e) => setFontFamilyId(e.target.value)}
                    className="appearance-none w-full bg-slate-800 text-slate-100 font-medium rounded-lg pl-3 pr-8 py-3 cursor-pointer hover:bg-slate-700 focus:outline-none text-sm"
                  >
                    {CODE_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Font Size: {fontSize}px</label>
                <input type="range" min="12" max="22" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                <input type="checkbox" checked={ligatures} onChange={(e) => setLigatures(e.target.checked)} className="w-4 h-4 rounded accent-fuchsia-500" />
                Enable Font Ligatures
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowEditorSettings(false)} className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white rounded-lg font-medium transition hover:scale-105">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Menu */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShare(false)} />
          <div className="relative z-10 w-full max-w-md bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-semibold tracking-wide text-slate-200">Share Code</h3>
              </div>
              <button onClick={() => setShowShare(false)} className="p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors">
                <X className="w-4 h-4 text-slate-300" />
              </button>
            </div>
            {(() => {
              const { mail, whatsapp, copyLink } = buildShareData();
              return (
                <div className="space-y-3">
                  <a href={whatsapp} target="_blank" rel="noreferrer" className="block w-full text-center px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium shadow-lg transition hover:scale-105 text-sm">Share on WhatsApp</a>
                  <a href={mail} className="block w-full text-center px-4 py-3 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-medium shadow-lg transition hover:scale-105 text-sm">Share via Email</a>
                  <button onClick={copyLink} className="w-full px-4 py-3 rounded-lg hover:bg-slate-800/60 text-slate-100 hover:text-white font-medium transition-colors text-sm">Copy Share Link</button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 px-3 sm:px-4 py-2 sm:py-3 bg-slate-900/95 border border-white/20 text-slate-100 rounded-lg shadow-2xl backdrop-blur-xl text-sm">
          {showToast}
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(168, 85, 247, 0.3) transparent;
        }
      `}</style>
    </div>
  );
};

export default QuickCompiler;
