import React, { useEffect, useMemo, useRef, useState } from 'react';

const LANGUAGES = [
  'cpp', 'java', 'python', 'javascript', 'go',
  'rust', 'typescript', 'c', 'csharp', 'kotlin',
  'swift', 'php', 'ruby'
];

function EditorialModalPage() {
  const [mode, setMode] = useState('solution');
  const [docTitle, setDocTitle] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // editor | preview | export
  const [status, setStatus] = useState({ message: 'Ready. Click inside editor → toolbar applies there.', type: 'info' });

  const [approaches, setApproaches] = useState([]);
  const [editorialCodeBlocks, setEditorialCodeBlocks] = useState([]);
  const [showLangModal, setShowLangModal] = useState(false);
  const [currentApproachId, setCurrentApproachId] = useState(null);
  const [selectedLang, setSelectedLang] = useState('cpp');

  const [markdownOutput, setMarkdownOutput] = useState('');

  // Persisted HTML snapshots (still useful for export + preview even if DOM changes)
  const [solutionIntroHTML, setSolutionIntroHTML] = useState('');
  const [editorialHTML, setEditorialHTML] = useState('');

  // refs
  const solutionIntroRef = useRef(null);
  const editorialEditorRef = useRef(null);
  const imgPickRef = useRef(null);

  // Track which editor is active for toolbar + image insert
  const activeEditorRef = useRef(null); // { type: 'solutionIntro' | 'editorial' | 'approachExplain', approachId? }

  // Tables selection
  const [selectedTableKey, setSelectedTableKey] = useState(null);

  // Keep refs for approach explanation editors
  const approachExplainRefs = useRef({}); // approachId -> ref

  // GitHub Config from env with TRIM
const ghConfig = useMemo(() => ({
  token: process.env.REACT_APP_GITHUB_TOKEN?.trim() || '',  // ADDED .trim()
  repo: process.env.REACT_APP_GITHUB_REPO?.trim() || '',    // ADDED .trim()
  branch: process.env.REACT_APP_GITHUB_BRANCH?.trim() || 'main',
  imgDir: process.env.REACT_APP_GITHUB_IMAGE_DIR?.trim() || 'images'
}), []);


  useEffect(() => {
    addApproach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = (message, type = 'info') => setStatus({ message, type });

  const slugify = (s) =>
    (s || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  // -------- capture editor HTML --------
  // Keep these for export/preview reliability.
  const syncEditorsToState = () => {
    setSolutionIntroHTML(solutionIntroRef.current?.innerHTML || '');
    setEditorialHTML(editorialEditorRef.current?.innerHTML || '');
  };

  // -------- tab switch (NO unmount) --------
  const changeTab = (nextTab) => {
    // always capture latest before switching views
    syncEditorsToState();
    setActiveTab(nextTab);
  };

  // ----- Active editor helpers -----
  const setActiveEditor = (keyObj) => {
    activeEditorRef.current = keyObj;
  };

  const getActiveEditableElement = () => {
    const k = activeEditorRef.current;
    if (!k) return null;

    if (k.type === 'solutionIntro') return solutionIntroRef.current;
    if (k.type === 'editorial') return editorialEditorRef.current;
    if (k.type === 'approachExplain') return approachExplainRefs.current[k.approachId]?.current || null;

    return null;
  };

  // ===== Formatting / execCommand toolbar =====
  const execCmd = (cmd) => {
    const el = getActiveEditableElement();
    if (!el) return updateStatus('Click inside an editor first.', 'warn');
    el.focus();
    document.execCommand(cmd, false, null);
  };

  const execBlock = (tag) => {
    const el = getActiveEditableElement();
    if (!el) return updateStatus('Click inside an editor first.', 'warn');
    el.focus();
    document.execCommand('formatBlock', false, tag);
  };

  const insertInlineCode = () => {
    const el = getActiveEditableElement();
    if (!el) return updateStatus('Click inside an editor first.', 'warn');

    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const code = document.createElement('code');
    const txt = sel.toString() || 'code';
    code.textContent = txt;

    const space = document.createTextNode('\u00A0');

    range.deleteContents();
    range.insertNode(code);
    range.setStartAfter(code);
    range.insertNode(space);
    range.setStartAfter(space);
    range.collapse(true);

    sel.removeAllRanges();
    sel.addRange(range);

    syncEditorsToState();
  };

  const insertCodeBlockWithLang = () => {
    const el = getActiveEditableElement();
    if (!el) return updateStatus('Click inside an editor first.', 'warn');

    const langSelect = document.createElement('select');
    langSelect.className = 'px-2 py-1 rounded border border-slate-300 text-sm bg-white';
    LANGUAGES.forEach((lang) => {
      const opt = document.createElement('option');
      opt.value = lang;
      opt.textContent = lang.toUpperCase();
      langSelect.appendChild(opt);
    });

    const container = document.createElement('div');
    container.className = 'code-block-wrapper my-3';
    container.innerHTML = `
      <div class="flex items-center gap-2 mb-2 p-2 bg-slate-100 rounded-lg">
        <span class="text-xs font-bold text-slate-600">Language:</span>
      </div>
      <pre class="bg-slate-900 text-slate-100 p-3 rounded-lg"><code contenteditable="true" class="block outline-none" style="min-height:60px; color:#e5e7eb;">// Type code here...</code></pre>
      <p><br></p>
    `;
    container.querySelector('div').appendChild(langSelect);

    el.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.insertNode(container);
      range.setStartAfter(container);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      el.appendChild(container);
    }

    const codeEl = container.querySelector('code');
    codeEl.dataset.lang = langSelect.value;

    langSelect.addEventListener('change', () => {
      codeEl.dataset.lang = langSelect.value;
      syncEditorsToState();
    });

    setTimeout(() => {
      codeEl.focus();
      const s2 = window.getSelection();
      const r = document.createRange();
      r.selectNodeContents(codeEl);
      r.collapse(false);
      s2?.removeAllRanges();
      s2?.addRange(r);
    }, 30);

    syncEditorsToState();
  };

  // ===== Table helpers =====
  const clearSelectedTableHighlight = () => {
    const el = getActiveEditableElement();
    if (!el) return;
    Array.from(el.querySelectorAll('table')).forEach((t) => t.classList.remove('tableSelected'));
  };

  const selectTable = (tableEl) => {
    clearSelectedTableHighlight();
    if (!tableEl) {
      setSelectedTableKey(null);
      return;
    }
    tableEl.classList.add('tableSelected');

    const editorKey = JSON.stringify(activeEditorRef.current || {});
    const el = getActiveEditableElement();
    const idx = Array.from(el.querySelectorAll('table')).indexOf(tableEl);
    setSelectedTableKey(JSON.stringify({ editorKey, idx }));

    syncEditorsToState();
  };

  const getSelectedTable = () => {
    if (!selectedTableKey) return null;
    const parsed = JSON.parse(selectedTableKey);
    const nowEditorKey = JSON.stringify(activeEditorRef.current || {});
    if (parsed.editorKey !== nowEditorKey) return null;

    const el = getActiveEditableElement();
    if (!el) return null;
    const tables = Array.from(el.querySelectorAll('table'));
    return tables[parsed.idx] || null;
  };

  const insertTableActive = () => {
    const el = getActiveEditableElement();
    if (!el) return updateStatus('Click inside an editor first.', 'warn');

    el.focus();

    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr><th contenteditable="true">Column 1</th><th contenteditable="true">Column 2</th></tr>
      </thead>
      <tbody>
        <tr><td contenteditable="true">Value 1</td><td contenteditable="true">Value 2</td></tr>
      </tbody>
    `;

    const wrap = document.createElement('div');
    wrap.appendChild(table);

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      r.deleteContents();
      r.insertNode(wrap);
    } else {
      el.appendChild(wrap);
    }

    selectTable(table);
    updateStatus('Table inserted.', 'ok');
    syncEditorsToState();
  };

  const getTableColCount = (table) => {
    const headRow = table.tHead?.rows?.[0];
    if (headRow) return headRow.cells.length;
    const bodyRow = table.tBodies?.[0]?.rows?.[0];
    return bodyRow ? bodyRow.cells.length : 0;
  };

  const tableAddRow = () => {
    const table = getSelectedTable();
    if (!table) return updateStatus('Click a table first.', 'warn');

    const tbody = table.tBodies[0] || table.appendChild(document.createElement('tbody'));
    const colCount = getTableColCount(table);
    const tr = document.createElement('tr');

    for (let i = 0; i < colCount; i++) {
      const td = document.createElement('td');
      td.contentEditable = 'true';
      td.textContent = '';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
    updateStatus('Row added.', 'ok');
    syncEditorsToState();
  };

  const tableAddCol = () => {
    const table = getSelectedTable();
    if (!table) return updateStatus('Click a table first.', 'warn');

    const colCount = getTableColCount(table);
    const headRow = table.tHead?.rows?.[0];
    if (headRow) {
      const th = document.createElement('th');
      th.contentEditable = 'true';
      th.textContent = `Column ${colCount + 1}`;
      headRow.appendChild(th);
    }

    const rows = Array.from(table.tBodies?.[0]?.rows || []);
    rows.forEach((r) => {
      const td = document.createElement('td');
      td.contentEditable = 'true';
      td.textContent = '';
      r.appendChild(td);
    });

    updateStatus('Column added.', 'ok');
    syncEditorsToState();
  };

  const tableDelRow = () => {
    const table = getSelectedTable();
    if (!table) return updateStatus('Click a table first.', 'warn');

    const tbody = table.tBodies?.[0];
    if (!tbody || tbody.rows.length === 0) return updateStatus('No body rows to delete.', 'warn');

    tbody.rows[tbody.rows.length - 1].remove();
    updateStatus('Row deleted.', 'ok');
    syncEditorsToState();
  };

  const tableDelCol = () => {
    const table = getSelectedTable();
    if (!table) return updateStatus('Click a table first.', 'warn');

    const colCount = getTableColCount(table);
    if (colCount <= 1) return updateStatus('Cannot delete last column.', 'warn');

    const idx = colCount - 1;
    const headRow = table.tHead?.rows?.[0];
    if (headRow?.cells?.[idx]) headRow.cells[idx].remove();

    const rows = Array.from(table.tBodies?.[0]?.rows || []);
    rows.forEach((r) => {
      if (r.cells[idx]) r.cells[idx].remove();
    });

    updateStatus('Column deleted.', 'ok');
    syncEditorsToState();
  };

  // ===== Approach Management =====
  const addApproach = () => {
    const id = `ap${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setApproaches((prev) => [
      ...prev,
      {
        id,
        title: '',
        explanation: '',
        langs: { cpp: '' },
        activeLang: 'cpp',
        timeComplexity: '',
        spaceComplexity: ''
      }
    ]);
    updateStatus('Approach added.', 'ok');
  };

  const removeApproach = (id) => {
    setApproaches((prev) => prev.filter((ap) => ap.id !== id));
    delete approachExplainRefs.current[id];
    updateStatus('Approach removed.', 'ok');
  };

  const updateApproach = (id, field, value) => {
    setApproaches((prev) => prev.map((ap) => (ap.id === id ? { ...ap, [field]: value } : ap)));
  };

  const addLangToApproach = (approachId, lang) => {
    setApproaches((prev) =>
      prev.map((ap) => {
        if (ap.id !== approachId) return ap;
        if (ap.langs[lang] !== undefined) {
          updateStatus('Language already exists.', 'warn');
          return { ...ap, activeLang: lang };
        }
        updateStatus(`${lang.toUpperCase()} added.`, 'ok');
        return { ...ap, langs: { ...ap.langs, [lang]: '' }, activeLang: lang };
      })
    );
  };

  const removeLangFromApproach = (approachId, lang) => {
    setApproaches((prev) =>
      prev.map((ap) => {
        if (ap.id !== approachId) return ap;
        const newLangs = { ...ap.langs };
        delete newLangs[lang];
        const remaining = Object.keys(newLangs);
        return { ...ap, langs: newLangs, activeLang: remaining[0] || null };
      })
    );
    updateStatus('Language removed.', 'ok');
  };

  const selectLang = (approachId, lang) => {
    setApproaches((prev) => prev.map((ap) => (ap.id === approachId ? { ...ap, activeLang: lang } : ap)));
  };

  const updateApproachCode = (approachId, code) => {
    setApproaches((prev) =>
      prev.map((ap) => {
        if (ap.id !== approachId || !ap.activeLang) return ap;
        return { ...ap, langs: { ...ap.langs, [ap.activeLang]: code } };
      })
    );
  };

  // ===== Editorial Code Blocks =====
  const addEditorialCodeBlock = () => {
    const id = `edc${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setEditorialCodeBlocks((prev) => [...prev, { id, lang: 'cpp', code: '' }]);
    updateStatus('Code block added.', 'ok');
  };

  const removeEditorialCodeBlock = (id) => {
    setEditorialCodeBlocks((prev) => prev.filter((b) => b.id !== id));
    updateStatus('Code block removed.', 'ok');
  };

  const updateEditorialCodeBlock = (id, field, value) => {
    setEditorialCodeBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  // ===== GitHub Image Upload =====
  const parseRepo = (repoStr) => {
    const p = (repoStr || '').trim().split('/');
    if (p.length !== 2 || !p[0] || !p[1]) return null;
    return { owner: p[0], repo: p[1] };
  };

  const uploadImageToGitHub = async (file) => {
  const pr = parseRepo(ghConfig.repo);
  
  // Trim token to remove whitespace
  const token = ghConfig.token?.trim();
  
  if (!token || !pr) {
    throw new Error('Set GitHub token & repo in .env file');
  }

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read failed'));
    reader.onload = () => resolve(String(reader.result.split(',')[1]));
    reader.readAsDataURL(file);
  });

  const titleSlug = slugify(docTitle || 'doc');
  
  // ✅ FIXED: Use same regex as HTML to preserve filename properly
  const safe = file.name.replace(/[^\w.\-]+/g, '_');
  
  // ✅ FIXED: Use same path structure as HTML
  const path = `${ghConfig.imgDir}/${titleSlug}/${Date.now()}_${safe}`;
  
  // ✅ FIXED: Proper URL encoding that preserves forward slashes
  const url = `https://api.github.com/repos/${pr.owner}/${pr.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;

  // ✅ FIXED: All headers properly quoted like HTML version
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      message: `upload image: ${safe}`,
      content: base64,
      branch: ghConfig.branch
    })
  });

  if (!res.ok) {
    let msg = `Upload failed (${res.status})`;
    try {
      const errorData = await res.json();
      msg = errorData?.message || msg;
    } catch (e) {
      // Ignore JSON parse errors
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const downloadUrl = data?.content?.download_url;
  
  if (!downloadUrl) {
    throw new Error('No download_url returned.');
  }

  return downloadUrl;
};



  const handleImageUpload = async () => {
    try {
      const targetEditor = getActiveEditableElement();
      if (!targetEditor) return updateStatus('Click inside an editor first.', 'warn');

      if (!imgPickRef.current?.files?.length) return updateStatus('Choose an image first.', 'warn');

      updateStatus('Uploading image to GitHub...', 'info');
      const url = await uploadImageToGitHub(imgPickRef.current.files[0]);

      const img = document.createElement('img');
      img.src = url;
      img.alt = 'illustration';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';

      targetEditor.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const r = sel.getRangeAt(0);
        r.insertNode(img);
      } else {
        targetEditor.appendChild(img);
      }

      imgPickRef.current.value = '';
      updateStatus('Image uploaded + inserted.', 'ok');
      syncEditorsToState();
    } catch (e) {
      updateStatus(e?.message || String(e), 'err');
    }
  };

  // ===== HTML -> Markdown =====
  const htmlToMarkdown = (htmlContentOrElement) => {
  const temp = document.createElement('div');
  if (typeof htmlContentOrElement === 'string') {
    temp.innerHTML = htmlContentOrElement;
  } else {
    temp.innerHTML = htmlContentOrElement?.innerHTML || '';
  }

  const escPipe = (s) => String(s).replace(/\|/g, '\\|').trim();

  const tableToMd = (table) => {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (!rows.length) return '';
    
    const matrix = rows.map((r) => 
      Array.from(r.children).map((c) => escPipe(c.textContent || ''))
    );
    
    const cols = Math.max(...matrix.map((r) => r.length));
    const header = (matrix[0] || []).concat(Array(Math.max(0, cols - (matrix[0]?.length || 0))).fill(''));
    const sep = Array(cols).fill('---');

    let out = `| ${header.slice(0, cols).join(' | ')} |\n| ${sep.join(' | ')} |\n`;
    for (const r of matrix.slice(1)) {
      const row = r.concat(Array(Math.max(0, cols - r.length)).fill(''));
      out += `| ${row.slice(0, cols).join(' | ')} |\n`;
    }
    return out + '\n';
  };

  const processNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue || '';
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const tag = node.tagName.toLowerCase();
    const text = node.textContent || '';
    
    // Process children recursively
    const children = Array.from(node.childNodes)
      .map(processNode)
      .join('');

    // Handle headings
    if (tag === 'h1') return `# ${text.trim()}\n\n`;
    if (tag === 'h2') return `## ${text.trim()}\n\n`;
    if (tag === 'h3') return `### ${text.trim()}\n\n`;
    
    // Handle paragraphs (preserve children for inline formatting)
    if (tag === 'p') {
      const content = children.trim();
      return content ? `${content}\n\n` : '';
    }
    
    // Handle breaks
    if (tag === 'br') return '\n';
    
    // Handle bold
    if (tag === 'strong' || tag === 'b') {
      return `**${children.trim()}**`;
    }
    
    // Handle italic
    if (tag === 'em' || tag === 'i') {
      return `*${children.trim()}*`;
    }

    // Handle inline code (NOT inside pre)
    if (tag === 'code' && node.parentElement?.tagName?.toLowerCase() !== 'pre') {
      return `\`${text.replace(/`/g, '\\`')}\``;
    }

    // Handle pre/code blocks
    if (tag === 'pre') {
      const code = node.querySelector('code');
      const lang = code?.dataset?.lang || '';
      let body = (code ? code.textContent : text).replace(/\n+$/, '');
      
      // Skip placeholder text
      if (body === '// Type code here...') body = '';
      
      return body ? `\`\`\`${lang}\n${body}\n\`\`\`\n\n` : '';
    }

    // Handle code block wrapper (from WYSIWYG editor)
    if (node.classList?.contains('code-block-wrapper')) {
      const select = node.querySelector('select');
      const code = node.querySelector('code');
      const lang = select?.value || code?.dataset?.lang || '';
      let body = (code?.textContent || '').replace(/\n+$/, '');
      
      if (body === '// Type code here...') body = '';
      
      return body ? `\`\`\`${lang}\n${body}\n\`\`\`\n\n` : '';
    }

    // Handle images
    if (tag === 'img') {
      const src = node.getAttribute('src') || '';
      const alt = node.getAttribute('alt') || 'image';
      return `![${alt}](${src})\n\n`;
    }

    // Handle unordered lists
    if (tag === 'ul') {
      const items = Array.from(node.querySelectorAll(':scope > li'));
      if (!items.length) return '';
      
      return items
        .map((li) => {
          // Process children to preserve inline formatting
          const content = Array.from(li.childNodes)
            .map(processNode)
            .join('')
            .trim();
          return `- ${content}`;
        })
        .join('\n') + '\n\n';
    }

    // Handle ordered lists
    if (tag === 'ol') {
      const items = Array.from(node.querySelectorAll(':scope > li'));
      if (!items.length) return '';
      
      return items
        .map((li, i) => {
          const content = Array.from(li.childNodes)
            .map(processNode)
            .join('')
            .trim();
          return `${i + 1}. ${content}`;
        })
        .join('\n') + '\n\n';
    }

    // Handle tables
    if (tag === 'table') {
      return tableToMd(node);
    }

    // Handle divs (commonly used as containers - process children)
    if (tag === 'div') {
      return children;
    }

    // Handle spans (process children)
    if (tag === 'span') {
      return children;
    }

    // Default: return children (preserves content from unknown tags)
    return children;
  };

  const result = processNode(temp);
  
  // Clean up excessive newlines
  return result
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
};


  const exportMarkdown = () => {
    const title = docTitle.trim() || 'untitled';

    // Always sync once at time of export so state mirrors DOM
    // (editor might contain newest changes if user didn’t blur).
    syncEditorsToState();

    if (mode === 'editorial') {
      let out = `# ${title}\n\n`;
      const body = htmlToMarkdown(editorialEditorRef.current?.innerHTML || editorialHTML || '');
      if (body.trim()) out += body + '\n';

      editorialCodeBlocks.forEach((block) => {
        if (block.code.trim()) out += `\`\`\`${block.lang}\n${block.code.trim()}\n\`\`\`\n\n`;
      });

      return out.replace(/\n{3,}/g, '\n\n').trim() + '\n';
    }

    let out = `# ${title}\n\n`;
    const intro = htmlToMarkdown(solutionIntroRef.current?.innerHTML || solutionIntroHTML || '');
    if (intro.trim()) out += intro + '\n';

    approaches.forEach((ap) => {
      if (ap.title) out += `## ${ap.title}\n\n`;

      const exp = htmlToMarkdown(ap.explanation || '');
      if (exp.trim()) out += exp + '\n';

      Object.keys(ap.langs || {}).forEach((lang) => {
        const code = (ap.langs[lang] || '').trim();
        if (code) out += `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
      });

      if (ap.timeComplexity) out += `### Time Complexity\n\n${ap.timeComplexity}\n\n`;
      if (ap.spaceComplexity) out += `### Space Complexity\n\n${ap.spaceComplexity}\n\n`;
    });

    return out.replace(/\n{3,}/g, '\n\n').trim() + '\n';
  };

  const handleExport = () => {
    const md = exportMarkdown();
    setMarkdownOutput(md);
    updateStatus('Exported markdown.', 'ok');
    changeTab('export');
  };

  const handleDownload = () => {
    const md = exportMarkdown();
    const titleSlug = slugify(docTitle) || 'untitled';
    const filename = `${titleSlug}-${mode}.md`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    updateStatus(`Downloaded ${filename}`, 'ok');
  };

  // ===== Templates =====
  const loadTemplates = () => {
    if (mode === 'editorial') {
      setDocTitle('Arrays: Complete Guide');
      const html = `
        <h1>Arrays: Complete Guide</h1>
        <p>An array stores same-type elements in contiguous memory for fast index access.</p>
        <h2>Advantages</h2>
        <ul><li>Random access O(1)</li><li>Cache locality</li></ul>
        <h2>Disadvantages</h2>
        <ul><li>Fixed size</li><li>Insertion/deletion shifts</li></ul>
      `;
      setEditorialHTML(html);
      if (editorialEditorRef.current) editorialEditorRef.current.innerHTML = html;

      setEditorialCodeBlocks([{
        id: 'edc1',
        lang: 'cpp',
        code: `int arr[5] = {1, 2, 3, 4, 5};
for(int i = 0; i < 5; i++) {
  cout << arr[i] << " ";
}`
      }]);

      updateStatus('Editorial template inserted.', 'ok');
      syncEditorsToState();
      return;
    }

    setDocTitle('Linear Search Algorithm');
    const introHtml = `
      <p>Linear search sequentially checks each element until the target is found or the array ends.</p>
      <h2>Example</h2>
      <table class="w-full border-collapse border-spacing-0 my-4 rounded-xl overflow-hidden shadow-md">
        <thead><tr><th class="border border-slate-200 px-4 py-3 text-left bg-gradient-to-r from-slate-50 to-slate-100 font-black">Input</th><th class="border border-slate-200 px-4 py-3 text-left bg-gradient-to-r from-slate-50 to-slate-100 font-black">Output</th></tr></thead>
        <tbody><tr><td class="border border-slate-200 px-4 py-3">nums=[1,2,3], target=2</td><td class="border border-slate-200 px-4 py-3">1</td></tr></tbody>
      </table>
    `;
    setSolutionIntroHTML(introHtml);
    if (solutionIntroRef.current) solutionIntroRef.current.innerHTML = introHtml;

    setApproaches([{
      id: 'ap1',
      title: 'Brute Force Approach',
      explanation: `<p>Traverse the array from left to right and compare each element with target.</p>
<h3>Algorithm Explanation</h3>
<ol><li>Start i=0</li><li>If nums[i]==target return i</li><li>Else i++</li></ol>`,
      langs: {
        cpp: `class Solution {
public:
  int search(vector<int>& nums, int target) {
    for(int i=0;i<(int)nums.size();i++) if(nums[i]==target) return i;
    return -1;
  }
};`,
        python: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        for i in range(len(nums)):
            if nums[i] == target:
                return i
        return -1`
      },
      activeLang: 'cpp',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)'
    }]);

    updateStatus('Solution template inserted.', 'ok');
    syncEditorsToState();
  };

  const clearAll = () => {
    if (!window.confirm('Clear all content?')) return;

    setDocTitle('');
    setSolutionIntroHTML('');
    setEditorialHTML('');
    if (solutionIntroRef.current) solutionIntroRef.current.innerHTML = '';
    if (editorialEditorRef.current) editorialEditorRef.current.innerHTML = '';

    setApproaches([]);
    setEditorialCodeBlocks([]);
    setMarkdownOutput('');
    setSelectedTableKey(null);

    setTimeout(() => addApproach(), 0);
    updateStatus('Cleared.', 'ok');
  };

  // ===== Preview =====
  const PreviewPanel = () => {
    // Use snapshots (safe), but also fall back to current DOM if available.
    const intro = solutionIntroRef.current?.innerHTML || solutionIntroHTML || '';
    const ed = editorialEditorRef.current?.innerHTML || editorialHTML || '';

    return (
      <div className="mt-4">
        <div className="font-extrabold text-slate-900 mb-3">Preview</div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 min-h-[420px] content">
          <h1 className="text-3xl font-black mb-4">{docTitle || 'Untitled'}</h1>

          {mode === 'editorial' ? (
            <>
              <div className="content" dangerouslySetInnerHTML={{ __html: ed }} />
              {editorialCodeBlocks.map((b) =>
                b.code.trim() ? (
                  <div key={b.id} className="mt-4">
                    <div className="inline-block px-2 py-1 rounded-md text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-indigo-500">
                      {b.lang.toUpperCase()}
                    </div>
                    <pre className="mt-2 bg-slate-900 text-slate-100 p-3 rounded-xl overflow-auto">
                      <code>{b.code}</code>
                    </pre>
                  </div>
                ) : null
              )}
            </>
          ) : (
            <>
              <div className="content" dangerouslySetInnerHTML={{ __html: intro }} />
              {approaches.map((ap) => (
                <div key={ap.id} className="mt-4 content">
                  {ap.title ? <h2>{ap.title}</h2> : null}
                  <div dangerouslySetInnerHTML={{ __html: ap.explanation || '' }} />
                  {Object.keys(ap.langs || {}).map((k) =>
                    ap.langs[k]?.trim() ? (
                      <div key={`${ap.id}_${k}`} className="mt-3">
                        <div className="inline-block px-2 py-1 rounded-md text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-indigo-500">
                          {k.toUpperCase()}
                        </div>
                        <pre className="mt-2 bg-slate-900 text-slate-100 p-3 rounded-xl overflow-auto">
                          <code>{ap.langs[k]}</code>
                        </pre>
                      </div>
                    ) : null
                  )}
                  {ap.timeComplexity ? (
                    <>
                      <h3>Time Complexity</h3>
                      <p>{ap.timeComplexity}</p>
                    </>
                  ) : null}
                  {ap.spaceComplexity ? (
                    <>
                      <h3>Space Complexity</h3>
                      <p>{ap.spaceComplexity}</p>
                    </>
                  ) : null}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 bg-slate-50 min-h-screen">
      <style>{`
        .content { color:#0f172a; }
        .content h1 { font-size: 1.85rem; font-weight: 900; margin: 16px 0 10px; }
        .content h2 { font-size: 1.35rem; font-weight: 900; margin: 16px 0 8px; }
        .content h3 { font-size: 1.1rem; font-weight: 900; margin: 12px 0 6px; }
        .content p { margin: 8px 0; line-height: 1.75; }
        .content ul { list-style: disc; padding-left: 1.4rem; margin: 8px 0; }
        .content ol { list-style: decimal; padding-left: 1.4rem; margin: 8px 0; }
        .content li { margin: 4px 0; }
        .content strong { font-weight: 900; }

        .content code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
          font-size: .9em;
          background: linear-gradient(135deg, rgb(241 245 249), rgb(248 250 252));
          border: 1px solid rgb(226 232 240);
          padding: 3px 8px;
          border-radius: 6px;
          color: rgb(79 70 229);
          font-weight: 600;
        }

        .content pre {
          background: linear-gradient(135deg, #0f172a, #1e293b);
          color: #e5e7eb;
          border: 1px solid rgba(148,163,184,.25);
          padding: 16px;
          border-radius: 14px;
          overflow: auto;
          margin: 10px 0;
          box-shadow: 0 4px 12px rgba(0,0,0,.15);
        }
        .content pre code {
          background: transparent;
          border: none;
          padding: 0;
          display: block;
          white-space: pre;
          line-height: 1.55;
          font-size: 13px;
          color: #e5e7eb;
        }

        .content img { max-width:100%; height:auto; border-radius:14px; margin: 10px 0; }

        .content table {
          width:100%;
          border-collapse:separate;
          border-spacing:0;
          margin:16px 0;
          border-radius:12px;
          overflow:hidden;
          box-shadow:0 2px 8px rgba(15,23,42,0.08);
        }
        .content th, .content td {
          border:1px solid #e2e8f0;
          padding:12px 16px;
          text-align:left;
          vertical-align: top;
        }
        .content th {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          font-weight: 900;
          color:#0f172a;
        }
        .tableSelected {
          outline: 3px solid rgba(79,70,229,.4);
          outline-offset: 3px;
          border-radius: 12px;
          box-shadow: 0 0 0 6px rgba(79,70,229,0.08);
        }
      `}</style>

      {/* Language Modal */}
      {showLangModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowLangModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-extrabold text-slate-900 mb-4">Select Language</div>
            <select
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white mb-4 text-sm focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all"
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-sm hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                onClick={() => {
                  if (currentApproachId) addLangToApproach(currentApproachId, selectedLang);
                  setShowLangModal(false);
                }}
              >
                Add
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 transition-all"
                onClick={() => setShowLangModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-md hover:shadow-xl transition-shadow p-4 md:p-5 mb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <div className="text-xl font-black text-slate-900">Editorial Creator</div>
            <div className="text-sm text-slate-600 mt-1">Solution or Editorial → export one .md | Images uploaded to GitHub</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              onClick={handleDownload}
            >
              Export + Download
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-sm hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              onClick={handleExport}
            >
              Export to box
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              onClick={() => changeTab('preview')}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="font-extrabold text-slate-900 mb-3">Mode</div>

            <label className="text-xs text-slate-600 block">Create</label>
            <select
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all"
              value={mode}
              onChange={(e) => {
                syncEditorsToState();
                setMode(e.target.value);
                updateStatus(`Mode: ${e.target.value}`, 'ok');
              }}
            >
              <option value="solution">Solution (.md)</option>
              <option value="editorial">Editorial (.md)</option>
            </select>

            <label className="text-xs text-slate-600 mt-3 block">Title</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Linear Search Algorithm"
            />

            <div className="text-xs text-slate-600 mt-3">
              Download: <span className="font-mono">title-{mode}.md</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="font-extrabold text-slate-900 mb-1">GitHub (images only)</div>
            <div className="text-xs text-slate-600 mb-2">Configured via .env file</div>
            <div className="text-xs text-slate-700 space-y-1">
              <div>Repo: {ghConfig.repo || 'Not set'}</div>
              <div>Branch: {ghConfig.branch}</div>
              <div>Image Dir: {ghConfig.imgDir}</div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="font-extrabold text-slate-900 mb-2">Status</div>
            <div className={`text-sm mt-2 font-semibold ${
              status.type === 'ok' ? 'text-emerald-700'
                : status.type === 'warn' ? 'text-amber-700'
                : status.type === 'err' ? 'text-red-600'
                : 'text-slate-700'
            }`}>{status.message}</div>
            <div className="flex gap-2 flex-wrap mt-3">
              <button
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50 transition-all"
                onClick={loadTemplates}
              >
                Insert templates
              </button>
              <button
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-xs hover:from-red-700 hover:to-red-600 transition-all"
                onClick={clearAll}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-md hover:shadow-xl transition-shadow p-4 md:p-5">
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl mb-4">
          <button
            className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'editor'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
            onClick={() => changeTab('editor')}
          >
            Editor
          </button>
          <button
            className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'preview'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
            onClick={() => changeTab('preview')}
          >
            Preview
          </button>
          <button
            className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'export'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
            onClick={() => changeTab('export')}
          >
            Export
          </button>
        </div>

        {/* =========================
            IMPORTANT: KEEP MOUNTED
            ========================= */}
        <div style={{ display: activeTab === 'editor' ? 'block' : 'none' }}>
          {/* Editor Tab content (copied from your original, but NOT conditionally rendered) */}
          <div className="mt-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
              <div className="font-extrabold text-slate-900">Toolbar</div>
              <div className="flex items-center gap-2 flex-wrap">
                <input ref={imgPickRef} type="file" accept="image/*" className="text-sm" />
                <button
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-sm hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-md"
                  onClick={handleImageUpload}
                >
                  Upload image
                </button>

                <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50"
                  onClick={insertTableActive}
                >
                  Insert table
                </button>
                <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50"
                  onClick={tableAddRow}
                >
                  + Row
                </button>
                <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50"
                  onClick={tableAddCol}
                >
                  + Col
                </button>
                <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50"
                  onClick={tableDelRow}
                >
                  - Row
                </button>
                <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50"
                  onClick={tableDelCol}
                >
                  - Col
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50" onClick={() => execCmd('bold')}>Bold</button>
              <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50" onClick={() => execCmd('italic')}>Italic</button>
              <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50" onClick={() => execCmd('insertUnorderedList')}>Bullets</button>
              <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50" onClick={() => execCmd('insertOrderedList')}>Numbered</button>

              <div className="w-px h-7 bg-slate-200 mx-1" />

              <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50" onClick={() => execBlock('h1')}>H1</button>
              <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50" onClick={() => execBlock('h2')}>H2</button>
              <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50" onClick={() => execBlock('h3')}>H3</button>
              <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50" onClick={() => execBlock('p')}>P</button>

              <div className="w-px h-7 bg-slate-200 mx-1" />

              <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50" onClick={insertInlineCode}>Inline code</button>
              <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs hover:bg-slate-50" onClick={insertCodeBlockWithLang}>Code block</button>
            </div>

            {/* Solution Mode */}
            <div style={{ display: mode === 'solution' ? 'block' : 'none' }}>
              <div className="mt-4">
                <div className="font-extrabold text-slate-900">Solution content before approaches</div>
                <div className="text-xs text-slate-600 mt-1">Use this for statement, examples, constraints, explanation, notes, etc.</div>

                <div
                  ref={solutionIntroRef}
                  className="content min-h-[420px] outline-none transition-all mt-3 p-4 rounded-2xl border border-slate-200 bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 max-w-none"
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() => setActiveEditor({ type: 'solutionIntro' })}
                  onClick={(e) => selectTable(e.target.closest?.('table'))}
                  onInput={(e) => setSolutionIntroHTML(e.currentTarget.innerHTML)}
                />

                <div className="mt-5 flex items-center justify-between flex-wrap gap-2">
                  <div className="font-extrabold text-slate-900">Approaches</div>
                  <button
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-sm hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-md"
                    onClick={addApproach}
                  >
                    + Add Approach
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {approaches.map((ap) => {
                    if (!approachExplainRefs.current[ap.id]) {
                      approachExplainRefs.current[ap.id] = React.createRef();
                    }

                    return (
                      <div key={ap.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                          <div className="font-extrabold text-slate-900">Approach</div>
                          <button
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-xs hover:from-red-700 hover:to-red-600 transition-all"
                            onClick={() => removeApproach(ap.id)}
                          >
                            Remove
                          </button>
                        </div>

                        <label className="text-xs text-slate-600 mt-3 block">Approach title (##)</label>
                        <input
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all"
                          value={ap.title}
                          onChange={(e) => updateApproach(ap.id, 'title', e.target.value)}
                          placeholder="Brute Force Approach"
                        />

                        <div className="text-xs text-slate-600 mt-3">Explanation</div>
                        <div
                          ref={approachExplainRefs.current[ap.id]}
                          className="content min-h-[200px] outline-none transition-all mt-2 p-3 rounded-2xl border border-slate-200 bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 max-w-none"
                          contentEditable
                          suppressContentEditableWarning
                          dangerouslySetInnerHTML={{ __html: ap.explanation }}
                          onFocus={() => setActiveEditor({ type: 'approachExplain', approachId: ap.id })}
                          onClick={(e) => selectTable(e.target.closest?.('table'))}
                          onBlur={(e) => updateApproach(ap.id, 'explanation', e.currentTarget.innerHTML)}
                        />

                        <div className="mt-4">
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                            <div className="font-extrabold text-slate-900 text-sm">Code (multi-language)</div>
                            <button
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-xs hover:from-indigo-700 hover:to-indigo-600 transition-all"
                              onClick={() => {
                                setCurrentApproachId(ap.id);
                                setShowLangModal(true);
                              }}
                            >
                              + Add Language
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-2 mb-2">
                            {Object.keys(ap.langs || {}).map((lang) => (
                              <div key={lang} className="flex items-center gap-2">
                                <button
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                    ap.activeLang === lang
                                      ? 'bg-slate-200 border-2 border-slate-400 text-slate-900 shadow-inner'
                                      : 'bg-white border border-slate-300 text-slate-900 hover:bg-slate-50'
                                  }`}
                                  onClick={() => selectLang(ap.id, lang)}
                                >
                                  {lang.toUpperCase()}
                                </button>
                                <button
                                  className="px-2 py-1 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-xs hover:from-red-700 hover:to-red-600 transition-all"
                                  onClick={() => removeLangFromApproach(ap.id, lang)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>

                          <textarea
                            className="w-full min-h-[150px] p-3 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs resize-y focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all"
                            value={ap.activeLang ? (ap.langs[ap.activeLang] || '') : ''}
                            onChange={(e) => updateApproachCode(ap.id, e.target.value)}
                            placeholder="// code..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                          <div>
                            <label className="text-xs text-slate-600 block">Time Complexity</label>
                            <input
                              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all"
                              value={ap.timeComplexity}
                              onChange={(e) => updateApproach(ap.id, 'timeComplexity', e.target.value)}
                              placeholder="O(n) ..."
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 block">Space Complexity</label>
                            <input
                              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all"
                              value={ap.spaceComplexity}
                              onChange={(e) => updateApproach(ap.id, 'spaceComplexity', e.target.value)}
                              placeholder="O(1) ..."
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Editorial Mode */}
            <div style={{ display: mode === 'editorial' ? 'block' : 'none' }}>
              <div className="mt-4">
                <div className="font-extrabold text-slate-900">Editorial editor</div>
                <div
                  ref={editorialEditorRef}
                  className="content min-h-[420px] outline-none transition-all mt-3 p-4 rounded-2xl border border-slate-200 bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 max-w-none"
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() => setActiveEditor({ type: 'editorial' })}
                  onClick={(e) => selectTable(e.target.closest?.('table'))}
                  onInput={(e) => setEditorialHTML(e.currentTarget.innerHTML)}
                />

                <div className="mt-5">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div className="font-extrabold text-slate-900">Code Examples</div>
                    <button
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-sm hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-md"
                      onClick={addEditorialCodeBlock}
                    >
                      + Add Code Block
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editorialCodeBlocks.map((block) => (
                      <div key={block.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                          <div className="font-extrabold text-slate-900">Code Block</div>
                          <button
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-xs hover:from-red-700 hover:to-red-600 transition-all"
                            onClick={() => removeEditorialCodeBlock(block.id)}
                          >
                            Remove
                          </button>
                        </div>

                        <label className="text-xs text-slate-600 mt-3 block">Language</label>
                        <select
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all"
                          value={block.lang}
                          onChange={(e) => updateEditorialCodeBlock(block.id, 'lang', e.target.value)}
                        >
                          {LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                          ))}
                        </select>

                        <label className="text-xs text-slate-600 mt-3 block">Code</label>
                        <textarea
                          className="mt-1 w-full min-h-[120px] p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs resize-y focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all"
                          value={block.code}
                          onChange={(e) => updateEditorialCodeBlock(block.id, 'code', e.target.value)}
                          placeholder="// paste code here..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview tab (mounted) */}
        <div style={{ display: activeTab === 'preview' ? 'block' : 'none' }}>
          <PreviewPanel />
        </div>

        {/* Export tab (mounted) */}
        <div style={{ display: activeTab === 'export' ? 'block' : 'none' }}>
          <div className="mt-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="font-extrabold text-slate-900">Markdown output</div>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-sm hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-md"
                  onClick={handleExport}
                >
                  Export
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-md"
                  onClick={handleDownload}
                >
                  Download
                </button>
              </div>
            </div>

            <textarea
              className="w-full min-h-[420px] p-3 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs resize-y"
              value={markdownOutput}
              readOnly
              placeholder="Click Export..."
            />

            <div className="text-xs text-slate-600 mt-2">
              Export keeps images as &lt;img src="..."&gt; (your renderer detects img tags).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorialModalPage;
