// Snippet Vault (vanilla JS)
// Features: Create / Read / Update / Delete snippets, copy, download, search, filter, localStorage persistent

(() => {
  const LS_KEY = 'snippetVault_v1';
  // DOM
  const snippetListEl = document.getElementById('snippetList');
  const emptyStateEl = document.getElementById('emptyState');
  const viewerTitle = document.getElementById('viewerTitle');
  const viewerMeta = document.getElementById('viewerMeta');
  const viewerCode = document.getElementById('viewerCode');
  const viewerPre = document.getElementById('viewerPre');

  const addBtn = document.getElementById('addBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const editBtn = document.getElementById('editBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  const searchInput = document.getElementById('searchInput');
  const filterLang = document.getElementById('filterLang');
  const themeBtn = document.getElementById('themeBtn');

  // Modal
  const editorModal = document.getElementById('editorModal');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const snippetForm = document.getElementById('snippetForm');
  const modalTitle = document.getElementById('modalTitle');

  const titleInput = document.getElementById('titleInput');
  const langInput = document.getElementById('langInput');
  const tagsInput = document.getElementById('tagsInput');
  const contentInput = document.getElementById('contentInput');

  const toastEl = document.getElementById('toast');

  let snippets = [];
  let activeId = null;
  let editingId = null;

  // UTILITIES
  const uid = () => 's_' + Math.random().toString(36).slice(2, 9);
  function nowISO(){ return new Date().toISOString(); }
  function showToast(text, ms = 2200){
    toastEl.textContent = text;
    toastEl.style.display = 'block';
    setTimeout(()=> toastEl.style.display = 'none', ms);
  }

  // STORAGE
  function loadSnippets(){
    try {
      const raw = localStorage.getItem(LS_KEY);
      snippets = raw ? JSON.parse(raw) : [];
    } catch(e){
      console.error('Failed to load snippets', e);
      snippets = [];
    }
  }
  function saveSnippets(){
    localStorage.setItem(LS_KEY, JSON.stringify(snippets));
  }

  // RENDER
  function renderList(){
    snippetListEl.innerHTML = '';
    const q = (searchInput.value || '').toLowerCase().trim();
    const langFilter = filterLang.value;

    const filtered = snippets.filter(s => {
      if(langFilter && s.lang !== langFilter) return false;
      if(!q) return true;
      return s.title.toLowerCase().includes(q) ||
             (s.tags||'').toLowerCase().includes(q) ||
             s.content.toLowerCase().includes(q);
    });

    if(filtered.length === 0){
      emptyStateEl.style.display = 'block';
    } else {
      emptyStateEl.style.display = 'none';
    }

    filtered.forEach(s => {
      const li = document.createElement('li');
      li.className = 'snippet-item' + (s.id === activeId ? ' active' : '');
      li.dataset.id = s.id;

      const meta = document.createElement('div');
      meta.className = 'snippet-meta';

      const title = document.createElement('div');
      title.className = 'snippet-title';
      title.textContent = s.title;

      const sub = document.createElement('div');
      sub.className = 'snippet-sub';
      const tags = s.tags ? s.tags.split(',').map(t=>t.trim()).filter(Boolean) : [];
      sub.textContent = `${s.lang.toUpperCase()} · ${tags.join(', ') || 'no tags'}`;

      meta.appendChild(title);
      meta.appendChild(sub);

      li.appendChild(meta);

      li.addEventListener('click', () => {
        setActive(s.id);
      });

      snippetListEl.appendChild(li);
    });
  }

  function setActive(id){
    activeId = id;
    const s = snippets.find(x => x.id === id);
    if(!s){
      viewerTitle.textContent = 'Select a snippet';
      viewerCode.textContent = '';
      viewerMeta.textContent = '';
      disableViewerActions(true);
      renderList();
      return;
    }

    viewerTitle.textContent = s.title;
    viewerMeta.innerHTML = `<span class="tag">${s.lang.toUpperCase()}</span> ${s.tags ? s.tags.split(',').map(t=>`<span class="tag">${t.trim()}</span>`).join(' ') : ''} <span style="color:var(--muted); margin-left:10px; font-size:0.9rem">Saved ${new Date(s.updatedAt).toLocaleString()}</span>`;

    // show content as-is. Preserve whitespace.
    viewerCode.textContent = s.content;
    viewerPre.scrollTop = 0;
    disableViewerActions(false);
    renderList();
  }

  function disableViewerActions(disable){
    [copyBtn, downloadBtn, editBtn, deleteBtn].forEach(b => {
      b.disabled = disable;
      b.style.opacity = disable ? 0.6 : 1;
    });
  }

  // CRUD
  function openModal(newOrEdit = 'new', id=null){
    editorModal.classList.remove('hidden');
    editorModal.setAttribute('aria-hidden','false');
    if(newOrEdit === 'new'){
      modalTitle.textContent = 'New Snippet';
      snippetForm.reset();
      titleInput.value = '';
      langInput.value = 'js';
      tagsInput.value = '';
      contentInput.value = '';
      editingId = null;
    } else {
      modalTitle.textContent = 'Edit Snippet';
      const s = snippets.find(x => x.id === id);
      if(!s) return;
      editingId = id;
      titleInput.value = s.title;
      langInput.value = s.lang;
      tagsInput.value = s.tags || '';
      contentInput.value = s.content;
    }
    // focus
    setTimeout(()=> titleInput.focus(), 80);
  }
  function closeEditor(){
    editorModal.classList.add('hidden');
    editorModal.setAttribute('aria-hidden','true');
    editingId = null;
  }

  function saveFromForm(e){
    e.preventDefault();
    const t = titleInput.value.trim();
    const lang = langInput.value;
    const tags = tagsInput.value.split(',').map(s=>s.trim()).filter(Boolean).join(',');
    const content = contentInput.value;

    if(!t || !content){ showToast('Title and content are required'); return; }

    if(editingId){
      const idx = snippets.findIndex(s => s.id === editingId);
      if(idx === -1) return;
      snippets[idx] = {
        ...snippets[idx],
        title: t,
        lang,
        tags,
        content,
        updatedAt: nowISO()
      };
      showToast('Snippet updated');
      setActive(snippets[idx].id);
    } else {
      const newS = {
        id: uid(),
        title: t,
        lang,
        tags,
        content,
        createdAt: nowISO(),
        updatedAt: nowISO()
      };
      snippets.unshift(newS); // show recent first
      showToast('Snippet saved');
      setActive(newS.id);
    }
    saveSnippets();
    closeEditor();
    renderList();
  }

  function deleteActive(){
    if(!activeId) return;
    if(!confirm('Delete this snippet? This cannot be undone.')) return;
    snippets = snippets.filter(s => s.id !== activeId);
    activeId = null;
    saveSnippets();
    renderList();
    setActive(null);
    showToast('Snippet deleted');
  }

  async function copyActive(){
    if(!activeId) return;
    const s = snippets.find(x => x.id === activeId);
    if(!s) return;
    try {
      await navigator.clipboard.writeText(s.content);
      showToast('Copied to clipboard ✔️');
    } catch(err){
      // fallback
      const ta = document.createElement('textarea');
      ta.value = s.content;
      document.body.appendChild(ta);
      ta.select();
      try{
        document.execCommand('copy');
        showToast('Copied to clipboard ✔️');
      }catch(e){
        showToast('Copy failed — try manually');
      }
      ta.remove();
    }
  }

  function downloadActive(){
    if(!activeId) return;
    const s = snippets.find(x => x.id === activeId);
    if(!s) return;
    const ext = s.lang === 'js' ? 'js' : s.lang === 'html' ? 'html' : s.lang === 'css' ? 'css' : 'txt';
    const filename = `${s.title.replace(/[^\w\d-_]/g,'_') || 'snippet'}.${ext}`;
    const blob = new Blob([s.content], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Download started');
  }

  // EVENTS
  addBtn.addEventListener('click', () => openModal('new'));
  closeModal.addEventListener('click', closeEditor);
  cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closeEditor(); });
  snippetForm.addEventListener('submit', saveFromForm);

  copyBtn.addEventListener('click', copyActive);
  downloadBtn.addEventListener('click', downloadActive);
  deleteBtn.addEventListener('click', deleteActive);
  editBtn.addEventListener('click', () => {
    if(!activeId) return;
    openModal('edit', activeId);
  });

  searchInput.addEventListener('input', renderList);
  filterLang.addEventListener('change', renderList);

  // theme toggle (persist)
  function applyTheme(dark){
    if(!dark){
      document.documentElement.style.setProperty('--bg', '#ffffff');
      document.documentElement.style.setProperty('--panel', '#ffffff');
      document.body.style.color = '#07101a';
      themeBtn.textContent = '🌙';
    } else {
      // reset to defaults in css
      document.body.style.color = '';
      themeBtn.textContent = '☀️';
    }
    localStorage.setItem('snippet_vault_theme_dark', !!dark);
  }
  themeBtn.addEventListener('click', ()=>{
    const currently = localStorage.getItem('snippet_vault_theme_dark') === 'true';
    applyTheme(!currently);
  });
  // load theme
  if(localStorage.getItem('snippet_vault_theme_dark') === null){
    applyTheme(true);
  } else {
    applyTheme(localStorage.getItem('snippet_vault_theme_dark') === 'true');
  }

  // keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ // focus search
      e.preventDefault(); searchInput.focus();
    } else if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n'){
      e.preventDefault(); openModal('new');
    } else if(e.key === 'Escape'){
      closeEditor();
    }
  });

  // initial load
  loadSnippets();
  renderList();
  // if we have any, select the first
  if(snippets.length) setActive(snippets[0].id);

  // expose a tiny API for dev console (optional)
  window.SnippetVault = {
    getAll: () => snippets,
    saveAll: () => saveSnippets(),
    clearAll: () => { localStorage.removeItem(LS_KEY); snippets = []; renderList(); setActive(null); }
  };

})();