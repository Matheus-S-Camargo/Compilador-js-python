/**
 * Compilador JS -> Python: Motor da Aplicação Interativa (Refinado em 3 Loops)
 * - Loop 1: Integridade, renderizador de tabelas Markdown e inventário completo
 * - Loop 2: Syntax Highlighting real, TOC dinâmico contextual e visualizador in-app de .md
 * - Loop 3: Navegação por teclado na busca, acessibilidade e prevenção de regressões
 */

(function () {
  'use strict';

  // State
  const state = {
    currentTab: 'home',
    currentFile: 'src/ast.c',
    selectedLine: null,
    searchQuery: '',
    searchSelectedIndex: 0,
    searchResults: [],
    theme: localStorage.getItem('theme') || 'light'
  };

  // DOM Elements
  const els = {
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    startTourBtn: document.getElementById('start-tour-btn'),
    globalSearchInput: document.getElementById('global-search-input'),
    searchModalBackdrop: document.getElementById('search-modal-backdrop'),
    modalSearchInput: document.getElementById('modal-search-input'),
    searchResultsList: document.getElementById('search-results-list'),
    breadcrumbCurrent: document.getElementById('breadcrumb-current'),
    navTabBtns: document.querySelectorAll('.nav-tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    fileTreeContainer: document.getElementById('file-tree-container'),
    toast: document.getElementById('toast-msg'),
    dynamicTocList: document.getElementById('dynamic-toc-list'),
    dynamicTocTitle: document.getElementById('dynamic-toc-title')
  };

  // Initialize
  function init() {
    applyTheme(state.theme);
    setupEvents();
    renderFileTree();
    renderHomeView();
    renderArchitectureGraph();
    renderLearnTabs();
    updateDynamicToc();
    
    // Parse Initial Hash
    handleHashChange();
  }

  // Theme Management
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const icon = els.themeToggleBtn.querySelector('.theme-icon');
    if (icon) {
      icon.innerHTML = theme === 'dark' 
        ? '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        : '<path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>';
    }
    renderArchitectureGraph();
  }

  // Event Handlers
  function setupEvents() {
    els.themeToggleBtn.addEventListener('click', () => {
      applyTheme(state.theme === 'light' ? 'dark' : 'light');
    });

    els.startTourBtn.addEventListener('click', () => {
      startGuidedTour();
    });

    els.navTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        setTab(tab);
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== els.globalSearchInput && document.activeElement !== els.modalSearchInput) {
        e.preventDefault();
        openSearchModal();
      } else if (e.key === 'Escape' && els.searchModalBackdrop.classList.contains('active')) {
        closeSearchModal();
      } else if (els.searchModalBackdrop.classList.contains('active')) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          moveSearchSelection(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          moveSearchSelection(-1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          selectCurrentSearchResult();
        }
      }
    });

    els.globalSearchInput.addEventListener('click', openSearchModal);
    els.modalSearchInput.addEventListener('input', (e) => {
      performSearch(e.target.value);
    });

    els.searchModalBackdrop.addEventListener('click', (e) => {
      if (e.target === els.searchModalBackdrop) {
        closeSearchModal();
      }
    });

    window.addEventListener('hashchange', handleHashChange);
  }

  // Hash Navigation Handler
  function handleHashChange() {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) {
      setTab('home', false);
      return;
    }
    const params = new URLSearchParams(hash);
    const tab = params.get('tab') || 'home';
    const file = params.get('file');
    const line = params.get('line') ? parseInt(params.get('line'), 10) : null;
    const learnTopic = params.get('topic');

    if (file && PROJECT_DATA.files[file]) {
      state.currentFile = file;
    }
    if (line) {
      state.selectedLine = line;
    }

    setTab(tab, false);

    if (tab === 'code') {
      renderCodeExplorer(state.currentFile, state.selectedLine);
    } else if (tab === 'learn' && learnTopic) {
      selectLearnTopic(learnTopic);
    }
  }

  function updateHash() {
    const params = new URLSearchParams();
    params.set('tab', state.currentTab);
    if (state.currentTab === 'code' && state.currentFile) {
      params.set('file', state.currentFile);
      if (state.selectedLine) {
        params.set('line', state.selectedLine);
      }
    }
    window.location.hash = params.toString();
  }

  // Tab Switcher
  function setTab(tabName, shouldUpdateHash = true) {
    state.currentTab = tabName;
    els.navTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    els.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabName}`);
    });

    const tabTitles = {
      home: 'Home · Visão Geral',
      code: `Código-fonte · ${state.currentFile || 'Explorador'}`,
      arch: 'Arquitetura & Fluxos',
      learn: 'Aprender · Laboratório de Compiladores'
    };
    els.breadcrumbCurrent.textContent = tabTitles[tabName] || tabName;

    if (tabName === 'code') {
      renderCodeExplorer(state.currentFile, state.selectedLine);
    }

    updateDynamicToc();

    if (shouldUpdateHash) {
      updateHash();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Dynamic Contextual TOC (Right Sidebar)
  function updateDynamicToc() {
    if (!els.dynamicTocList || !els.dynamicTocTitle) return;

    if (state.currentTab === 'home') {
      els.dynamicTocTitle.textContent = 'Nesta página';
      els.dynamicTocList.innerHTML = `
        <li class="toc-item"><a href="javascript:void(0)" onclick="window.scrollToSection('section-intro')">O que é o projeto?</a></li>
        <li class="toc-item"><a href="javascript:void(0)" onclick="window.scrollToSection('section-pipeline')">Como funciona?</a></li>
        <li class="toc-item"><a href="javascript:void(0)" onclick="window.scrollToSection('section-modules')">Principais módulos</a></li>
        <li class="toc-item"><a href="javascript:void(0)" onclick="window.scrollToSection('section-tech')">Tecnologias</a></li>
        <li class="toc-item"><a href="javascript:void(0)" onclick="window.scrollToSection('section-paths')">Caminhos de aprendizado</a></li>
      `;
    } else if (state.currentTab === 'code') {
      const file = PROJECT_DATA.files[state.currentFile];
      els.dynamicTocTitle.textContent = 'Explorador de Código';
      const annotationsList = file && file.annotations ? Object.entries(file.annotations).map(([ln, ann]) => `
        <li class="toc-item"><a href="javascript:void(0)" onclick="window.jumpToLine(${ln})">Linha ${ln}: ${ann.title.substring(0, 24)}...</a></li>
      `).join('') : '';

      els.dynamicTocList.innerHTML = `
        <li class="toc-item"><a href="javascript:void(0)" onclick="window.scrollToTop()">Início do Arquivo</a></li>
        ${annotationsList}
      `;
    } else if (state.currentTab === 'arch') {
      els.dynamicTocTitle.textContent = 'Arquitetura';
      els.dynamicTocList.innerHTML = `
        <li class="toc-item"><a href="javascript:void(0)" onclick="window.scrollToSection('section-diagram')">Grafo de Componentes</a></li>
        <li class="toc-item"><a href="javascript:void(0)" onclick="window.scrollToSection('section-facts')">Demarcação Factual</a></li>
      `;
    } else if (state.currentTab === 'learn') {
      els.dynamicTocTitle.textContent = 'Laboratórios Teóricos';
      els.dynamicTocList.innerHTML = PROJECT_DATA.learningTopics.map(t => `
        <li class="toc-item"><a href="javascript:void(0)" onclick="window.selectTopicDirect('${t.id}')">${t.title}</a></li>
      `).join('');
    }
  }

  window.scrollToSection = function(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  window.scrollToTop = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.jumpToLine = function(lineNum) {
    if (state.currentTab !== 'code') setTab('code');
    const file = PROJECT_DATA.files[state.currentFile];
    if (file) selectLine(lineNum, file);
    const lineEl = document.querySelector(`.code-line[data-line="${lineNum}"]`);
    if (lineEl) lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  window.selectTopicDirect = function(topicId) {
    if (state.currentTab !== 'learn') setTab('learn');
    selectLearnTopic(topicId);
  };

  // Render Sidebar Tree View
  function renderFileTree() {
    const container = els.fileTreeContainer;
    const fileEntries = Object.keys(PROJECT_DATA.files);

    const srcFiles = fileEntries.filter(f => f.startsWith('src/'));
    const rootFiles = fileEntries.filter(f => !f.includes('/'));

    container.innerHTML = `
      <li class="tree-node tree-node-folder" data-folder="src">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        src/
      </li>
      ${srcFiles.map(filePath => {
        const fileName = filePath.replace('src/', '');
        const isActive = state.currentFile === filePath;
        return `
          <li class="tree-node tree-indent-1 ${isActive ? 'active' : ''}" data-file="${filePath}">
            <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ${fileName}
          </li>
        `;
      }).join('')}

      <li class="tree-node tree-node-folder" data-folder="docs">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        docs/
      </li>
      <li class="tree-node tree-indent-1" onclick="window.openInAppDoc('cronograma.md')">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
        cronograma.md
      </li>
      <li class="tree-node tree-indent-1" onclick="window.openInAppDoc('estrutura_documento_inicial.md')">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
        estrutura_documento_inicial.md
      </li>

      ${rootFiles.map(filePath => `
        <li class="tree-node ${state.currentFile === filePath ? 'active' : ''}" data-file="${filePath}">
          <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
          ${filePath}
        </li>
      `).join('')}
    `;

    container.querySelectorAll('[data-file]').forEach(el => {
      el.addEventListener('click', () => {
        const filePath = el.getAttribute('data-file');
        selectFile(filePath);
      });
    });
  }

  window.openInAppDoc = function(docName) {
    setTab('learn');
    const contentContainer = document.getElementById('learn-content-container');
    contentContainer.innerHTML = `
      <div class="learn-card">
        <span class="explanation-badge">Documento Preservado: docs/${docName}</span>
        <h2 style="font-size: 22px; font-weight: 800; color: var(--text-main); margin-bottom: 8px;">${docName}</h2>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 16px;">
          Este arquivo markdown foi mantido intacto no repositório. Você pode acessá-lo diretamente pelo link abaixo:
        </p>
        <a href="${docName}" target="_blank" class="btn-primary" style="display: inline-flex; margin-bottom: 16px;">
          Abrir ${docName} em nova aba
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
        </a>
      </div>
    `;
  };

  function selectFile(filePath) {
    state.currentFile = filePath;
    state.selectedLine = null;
    renderFileTree();
    setTab('code');
  }

  // Render Home View
  function renderHomeView() {
    const stepperContainer = document.getElementById('pipeline-stepper-container');
    if (stepperContainer) {
      stepperContainer.innerHTML = PROJECT_DATA.pipeline.map((stage, i) => `
        <div class="stepper-card" onclick="window.location.hash='tab=arch'">
          <div class="stepper-icon-wrapper ${stage.color}">
            <span style="font-weight: 800; font-size: 13px;">${i + 1}</span>
          </div>
          <div class="stepper-name">${stage.name}</div>
          <div class="stepper-detail">${stage.desc}</div>
        </div>
        ${i < PROJECT_DATA.pipeline.length - 1 ? '<svg class="stepper-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>' : ''}
      `).join('');
    }

    const modulesContainer = document.getElementById('modules-grid-container');
    if (modulesContainer) {
      modulesContainer.innerHTML = PROJECT_DATA.modules.map(mod => `
        <div class="module-card ${mod.color}" onclick="window.location.hash='tab=code&file=${mod.path}'">
          <div class="module-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          </div>
          <div class="module-title">${mod.name}</div>
          <div class="module-desc">${mod.desc}</div>
          <div class="module-link">
            Explorar código
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      `).join('');
    }

    const techContainer = document.getElementById('tech-badges-container');
    if (techContainer) {
      techContainer.innerHTML = PROJECT_DATA.technologies.map(tech => `
        <div class="tech-badge" title="${tech.desc}">
          <div class="tech-badge-icon ${tech.class}">${tech.class.toUpperCase()}</div>
          ${tech.name}
        </div>
      `).join('');
    }
  }

  // High-Contrast Syntax Highlighting Engine (Token-Safe & Multilingual)
  function highlightSyntax(rawLine, lang) {
    if (!rawLine) return '';
    let escaped = escapeHtml(rawLine);

    const placeholders = [];
    function stash(content, className) {
      const id = `__STASH_${placeholders.length}__`;
      placeholders.push({ id, html: `<span class="${className}">${content}</span>` });
      return id;
    }

    const l = (lang || '').toLowerCase();

    // 1. Comments Stashing
    if (l === 'makefile' || l === 'make') {
      escaped = escaped.replace(/(#[^\n]*)/g, (_, m) => stash(m, 'tok-comment'));
    } else {
      escaped = escaped.replace(/(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/g, (_, m) => stash(m, 'tok-comment'));
    }

    // 2. Strings Stashing (&quot;...&quot; or '...')
    escaped = escaped.replace(/(&quot;[^&]*&quot;|'[^']*')/g, (_, m) => stash(m, 'tok-str'));

    // 3. Language-Specific Highlighting
    if (l === 'c' || l === 'yacc' || l === 'bison' || l === 'y' || l === 'lex' || l === 'flex' || l === 'l') {
      // Preprocessor
      escaped = escaped.replace(/(#(?:include|define|ifndef|endif|ifdef|pragma))\b/g, '<span class="tok-preproc">$1</span>');

      // Bison directives (%token, %union, %left, %right, %type, %start, %%, %{, %})
      escaped = escaped.replace(/(%(?:token|union|left|right|type|start|destructor|pure-parser|locations)|%%|%\{|%\})/g, '<span class="tok-bison">$1</span>');

      // C Keywords
      escaped = escaped.replace(/\b(int|char|void|float|double|struct|typedef|static|extern|const|return|if|else|while|for|sizeof|switch|case|default|break|continue)\b/g, '<span class="tok-kwd">$1</span>');

      // Compiler & Memory Functions
      escaped = escaped.replace(/\b(malloc|free|strdup|realloc|criar_no|liberar_ast|gerar_codigo|imprimir_ast|yyerror|yylex|yyparse|printf|fprintf|exit|fopen|fclose)\b/g, '<span class="tok-fn">$1</span>');

      // Core Types
      escaped = escaped.replace(/\b(No|TabelaSimbolos|Simbolo|FILE|AST|size_t)\b/g, '<span class="tok-type">$1</span>');

      // Uppercase tokens (Bison token identifiers: LET, NUMERO, ID, IF, ELSE, etc.)
      escaped = escaped.replace(/\b([A-Z][A-Z0-9_]{1,})\b/g, '<span class="tok-macro">$1</span>');

      // Numbers
      escaped = escaped.replace(/\b(\d+)\b/g, '<span class="tok-num">$1</span>');
    } else if (l === 'javascript' || l === 'js') {
      // JS Keywords
      escaped = escaped.replace(/\b(function|let|const|var|if|else|for|while|return|true|false|null|undefined|new|class|this|typeof|instanceof)\b/g, '<span class="tok-kwd">$1</span>');

      // JS Functions / Objects
      escaped = escaped.replace(/\b(console|log|push|pop|shift|unshift|slice|splice|map|filter|reduce|forEach|document|window)\b/g, '<span class="tok-fn">$1</span>');

      // Numbers
      escaped = escaped.replace(/\b(\d+)\b/g, '<span class="tok-num">$1</span>');
    } else if (l === 'makefile' || l === 'make') {
      // Targets (word before colon at start of line)
      escaped = escaped.replace(/^([a-zA-Z0-9_.\-%$]+)\s*:/gm, '<span class="tok-fn">$1</span>:');

      // Make Variables ($(VAR) or ${VAR})
      escaped = escaped.replace(/(\$[\(\{][a-zA-Z0-9_]+[\)\}])/g, '<span class="tok-macro">$1</span>');

      // Make Directives & Variables Assignment
      escaped = escaped.replace(/\b(CC|CFLAGS|LDFLAGS|RM|LEX|YACC|all|clean)\b/g, '<span class="tok-kwd">$1</span>');

      // Numbers
      escaped = escaped.replace(/\b(\d+)\b/g, '<span class="tok-num">$1</span>');
    } else {
      // Generic fallback
      escaped = escaped.replace(/\b(\d+)\b/g, '<span class="tok-num">$1</span>');
    }

    // 4. Restore Placeholders in reverse order
    for (let i = placeholders.length - 1; i >= 0; i--) {
      const p = placeholders[i];
      escaped = escaped.replace(p.id, p.html);
    }

    return escaped;
  }

  // Auxiliares para o painel de explicações e conexões
  function getDependenciesHtml(file) {
    if (!file.dependencies || !file.dependencies.length) {
      return '<span class="link-pill dep-none">Nenhuma (nódulo base)</span>';
    }
    return file.dependencies.map(dep => {
      if (dep.startsWith('src/')) {
        return `<button class="link-pill dep-local" onclick="window.openFileCode('${dep}')" title="Abrir ${dep} no explorador">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          ${dep} →
        </button>`;
      }
      return `<span class="link-pill dep-sys" title="Biblioteca padrão do sistema">${dep}</span>`;
    }).join(' ');
  }

  function getDependentsHtml(file) {
    if (!file.dependents || !file.dependents.length) {
      return '<span class="link-pill dep-none">Nenhum</span>';
    }
    return file.dependents.map(dep => {
      if (dep.startsWith('src/') || dep.startsWith('tests/')) {
        return `<button class="link-pill consumer-local" onclick="window.openFileCode('${dep}')" title="Abrir módulo dependente ${dep}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${dep} →
        </button>`;
      }
      return `<span class="link-pill consumer-bin" title="Artefato final">${dep}</span>`;
    }).join(' ');
  }

  function getRelatedTopicLinksHtml(file) {
    if (!PROJECT_DATA.learningTopics) return '';
    const map = {
      ast: 'ast-nodos',
      tabela: 'escopos-simbolos',
      gerador: 'geracao-codigo',
      core: file.name.includes('.l') ? 'tokens' : 'lalr-shift-reduce'
    };
    const topicId = map[file.module];
    const topic = topicId ? PROJECT_DATA.learningTopics.find(t => t.id === topicId) : null;
    if (!topic) return '';
    return `
      <div class="drawer-learn-topic-box">
        <span class="drawer-learn-label">Conceito Teórico na Aba Aprender:</span>
        <button class="link-pill learn-topic-pill" onclick="window.selectTopicDirect('${topic.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          ${topic.title} →
        </button>
      </div>
    `;
  }

  // Render Split-View Code Explorer
  function renderCodeExplorer(filePath, targetLine = null) {
    const file = PROJECT_DATA.files[filePath];
    if (!file) return;

    document.getElementById('code-file-title').textContent = file.path;
    document.getElementById('code-file-summary').textContent = file.summary;
    document.getElementById('code-lines-count').textContent = `${file.linesCount} linhas`;
    document.getElementById('code-file-author').textContent = `Autor: ${file.author}`;

    const tagEl = document.querySelector('.file-tag');
    if (tagEl) {
      tagEl.textContent = file.language.toUpperCase();
      tagEl.className = `file-tag ${file.language}`;
    }

    const linesContainer = document.getElementById('code-lines-container');
    linesContainer.innerHTML = file.code.map((lineText, idx) => {
      const lineNum = idx + 1;
      const isAnnotated = !!(file.annotations && file.annotations[lineNum]);
      const isActive = targetLine === lineNum;
      const highlightedContent = highlightSyntax(lineText, file.language);

      return `
        <div class="code-line ${isActive ? 'active' : ''} ${isAnnotated ? 'has-annotation' : 'non-interactive'}" data-line="${lineNum}" ${isAnnotated ? 'title="Linha anotada: clique para ver explicação na gaveta"' : ''}>
          <span class="line-number">${lineNum}</span>
          <span class="line-content">${highlightedContent}</span>
        </div>
      `;
    }).join('');

    // APENAS linhas anotadas recebem listener de clique!
    // Linhas sem anotação NÃO são clicáveis (zero guesswork, sem simulação).
    linesContainer.querySelectorAll('.code-line.has-annotation').forEach(lineEl => {
      lineEl.addEventListener('click', () => {
        const lineNum = parseInt(lineEl.getAttribute('data-line'), 10);
        selectLine(lineNum, file);
      });
    });

    if (targetLine && file.annotations && file.annotations[targetLine]) {
      selectLine(targetLine, file);
    } else {
      const firstAnnotated = file.annotations ? Object.keys(file.annotations)[0] : null;
      if (firstAnnotated) {
        selectLine(parseInt(firstAnnotated, 10), file);
      } else {
        renderFileOverviewExplanation(file);
      }
    }
  }

  function selectLine(lineNum, file) {
    state.selectedLine = lineNum;

    document.querySelectorAll('.code-line').forEach(el => {
      el.classList.toggle('active', parseInt(el.getAttribute('data-line'), 10) === lineNum);
    });

    const annotation = file.annotations ? file.annotations[lineNum] : null;
    const explanationBody = document.getElementById('explanation-body-container');
    const explanationTitle = document.getElementById('explanation-header-title');

    explanationTitle.innerHTML = `Linha ${lineNum} · <code>${file.name}</code>`;

    // Linha de código real em formato bruto e com highlight
    const rawLine = file.code[lineNum - 1] || '';
    const highlightedSnippet = highlightSyntax(rawLine, file.language);

    // Lista de anotações do arquivo para navegação sequencial
    const annKeys = file.annotations ? Object.keys(file.annotations).map(Number).sort((a, b) => a - b) : [];
    const currIndex = annKeys.indexOf(lineNum);
    const totalAnns = annKeys.length;

    if (annotation) {
      explanationBody.innerHTML = `
        <!-- 1. Linha do Código em cima (Alto Contraste) -->
        <div class="drawer-code-card">
          <div class="drawer-code-header">
            <div class="drawer-code-header-left">
              <span class="drawer-code-badge">Linha ${lineNum}</span>
              <span class="drawer-file-tag ${file.language}">${file.name}</span>
            </div>
            <button class="btn-copy-mini" onclick="window.copyCodeSnippet(decodeURIComponent('${encodeURIComponent(rawLine)}'))" title="Copiar esta linha">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copiar linha
            </button>
          </div>
          <div class="drawer-code-snippet">
            <span class="drawer-snippet-num">${lineNum}</span>
            <code class="drawer-snippet-code">${highlightedSnippet}</code>
          </div>
        </div>

        <!-- 2. Gaveta de Explicação em baixo -->
        <div class="drawer-explanation-card">
          <div class="drawer-heading-group">
            <span class="explanation-badge">Anotação Didática</span>
            <h4 class="explanation-heading">${annotation.title}</h4>
          </div>
          <div class="explanation-text">
            ${annotation.text}
          </div>

          <!-- Seção de Link: Linha aponta para outro arquivo do projeto -->
          ${annotation.linkFile ? `
            <div class="drawer-target-link-card">
              <div class="drawer-target-link-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                <span>Aponta para outro arquivo do projeto</span>
              </div>
              <p class="drawer-target-link-desc">
                Esta instrução referencia diretamente a interface de <code>${annotation.linkFile}</code>. Clique para inspecionar o código do arquivo referenciado:
              </p>
              <button class="btn-open-target-file" onclick="window.openFileCode('${annotation.linkFile}')">
                <span>📄 Abrir <strong>${annotation.linkFile}</strong> no Explorador</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          ` : ''}

          <!-- Conceito Teórico Subjacente -->
          ${annotation.theory ? `
            <div class="concept-box">
              <strong>Conceito Teórico Subjacente:</strong>
              ${annotation.theory}
            </div>
          ` : ''}

          <!-- Conexões: Dependências e Consumidores -->
          <div class="context-card" style="margin-top: 10px;">
            <div class="context-card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              Conexões do Módulo ${file.name}
            </div>
            <div class="context-card-desc">
              <div style="margin-bottom: 8px;"><strong>Depende de:</strong> ${getDependenciesHtml(file)}</div>
              <div><strong>Consumido por:</strong> ${getDependentsHtml(file)}</div>
            </div>
          </div>

          <!-- Tópico da Aba Aprender Relacionado -->
          ${getRelatedTopicLinksHtml(file)}

          <!-- Barra de Navegação Sequencial entre Anotações -->
          <div class="drawer-nav-bar">
            <button class="btn-nav-ann" onclick="window.navigateAnnotation(-1)" ${currIndex <= 0 ? 'disabled' : ''} title="Anotação anterior">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
              Anterior
            </button>
            <span class="drawer-nav-counter">Anotação ${currIndex >= 0 ? currIndex + 1 : 1} de ${totalAnns}</span>
            <button class="btn-nav-ann" onclick="window.navigateAnnotation(1)" ${currIndex >= totalAnns - 1 ? 'disabled' : ''} title="Próxima anotação">
              Próxima
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button class="btn-nav-overview" onclick="window.showFileOverview()" title="Ver índice completo e visão geral deste arquivo">
              Índice
            </button>
          </div>
        </div>
      `;
    } else {
      // Caso de salvaguarda (se acessado via URL com linha não anotada)
      explanationBody.innerHTML = `
        <div class="drawer-code-card">
          <div class="drawer-code-header">
            <span class="drawer-code-badge">Linha ${lineNum}</span>
            <span class="drawer-file-tag ${file.language}">${file.name}</span>
          </div>
          <div class="drawer-code-snippet">
            <span class="drawer-snippet-num">${lineNum}</span>
            <code class="drawer-snippet-code">${highlightedSnippet}</code>
          </div>
        </div>
        <div class="drawer-explanation-card">
          <div class="explanation-text">
            Esta linha não possui decisões conceituais específicas anotadas. A maioria do código executa rotinas utilitárias.
          </div>
          <button class="btn-primary" onclick="window.showFileOverview()" style="margin-top: 12px; display: inline-flex;">
            Ver índice de anotações deste arquivo
          </button>
        </div>
      `;
    }
  }

  function renderFileOverviewExplanation(file) {
    const explanationBody = document.getElementById('explanation-body-container');
    const explanationTitle = document.getElementById('explanation-header-title');
    explanationTitle.innerHTML = `Visão Geral · <code>${file.name}</code>`;

    const annKeys = file.annotations ? Object.keys(file.annotations).map(Number).sort((a, b) => a - b) : [];

    const annCardsHtml = annKeys.length ? annKeys.map(ln => {
      const ann = file.annotations[ln];
      const rawLine = (file.code[ln - 1] || '').trim();
      return `
        <div class="ann-index-card" onclick="window.jumpToLine(${ln})">
          <div class="ann-index-top">
            <span class="ann-index-badge">Linha ${ln}</span>
            ${ann.linkFile ? `<span class="ann-link-pill">🔗 Aponta para ${ann.linkFile}</span>` : ''}
          </div>
          <div class="ann-index-title">${ann.title}</div>
          <div class="ann-index-code"><code>${escapeHtml(rawLine)}</code></div>
          <div class="ann-index-arrow">Examinar linha na gaveta de explicação →</div>
        </div>
      `;
    }).join('') : '<p style="color: var(--text-muted); font-size: 13px;">Nenhuma anotação cadastrada para este arquivo.</p>';

    explanationBody.innerHTML = `
      <div class="file-overview-card">
        <div>
          <span class="explanation-badge">Módulo ${file.module.toUpperCase()}</span>
          <h4 class="explanation-heading">${file.name}</h4>
        </div>
        <div class="explanation-text">
          ${file.summary}
        </div>
        <div class="concept-box">
          <strong>Atribuição no Cronograma:</strong> ${file.author} é o desenvolvedor responsável por este módulo.
        </div>

        <div class="file-annotations-index">
          <div class="annotations-index-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Linhas com Decisões Arquiteturais Anotadas (${annKeys.length})</span>
          </div>
          <p class="annotations-index-subtitle">
            A maioria das linhas contém rotinas estruturais. Clique nos cards abaixo para inspecionar os pontos-chave com explicação e conexões:
          </p>
          <div class="annotations-index-list">
            ${annCardsHtml}
          </div>
        </div>

        <div class="context-card" style="margin-top: 14px;">
          <div class="context-card-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            Conexões do Módulo ${file.name}
          </div>
          <div class="context-card-desc">
            <div style="margin-bottom: 8px;"><strong>Depende de:</strong> ${getDependenciesHtml(file)}</div>
            <div><strong>Consumido por:</strong> ${getDependentsHtml(file)}</div>
          </div>
        </div>

        ${getRelatedTopicLinksHtml(file)}
      </div>
    `;
  }

  window.openFileCode = function(filePath, lineNum = null) {
    if (!PROJECT_DATA.files[filePath]) return;
    state.currentFile = filePath;
    state.selectedLine = lineNum;
    renderFileTree();
    setTab('code');
    if (lineNum) {
      setTimeout(() => {
        window.jumpToLine(lineNum);
      }, 80);
    }
  };

  window.showFileOverview = function() {
    state.selectedLine = null;
    document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));
    const file = PROJECT_DATA.files[state.currentFile];
    if (file) {
      renderFileOverviewExplanation(file);
    }
    updateHash();
  };

  window.navigateAnnotation = function(step) {
    const file = PROJECT_DATA.files[state.currentFile];
    if (!file || !file.annotations) return;
    const lines = Object.keys(file.annotations).map(Number).sort((a, b) => a - b);
    if (!lines.length) return;
    let idx = lines.indexOf(state.selectedLine);
    if (idx === -1) {
      idx = step > 0 ? 0 : lines.length - 1;
    } else {
      idx = (idx + step + lines.length) % lines.length;
    }
    window.jumpToLine(lines[idx]);
  };

  window.copyCodeSnippet = function(codeText) {
    if (!codeText) return;
    navigator.clipboard.writeText(codeText).then(() => {
      showToast('Linha de código copiada para a área de transferência!');
    });
  };

  window.copyCurrentFileCode = function () {
    const file = PROJECT_DATA.files[state.currentFile];
    if (file) {
      navigator.clipboard.writeText(file.code.join('\n')).then(() => {
        showToast(`Código de ${file.name} copiado com sucesso!`);
      });
    }
  };

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    setTimeout(() => {
      els.toast.classList.remove('show');
    }, 2500);
  }

  // Render Architecture Diagram (High Contrast in Light & Dark Mode)
  function renderArchitectureGraph() {
    const container = document.getElementById('architecture-diagram-container');
    if (!container) return;

    const isDark = state.theme === 'dark';

    // Theme palettes (High Contrast WCAG AAA)
    const p = isDark ? {
      bg: '#0e1526',
      arrow: '#818cf8',
      arrowDash: '#cbd5e1',
      blueBox: { fill: '#0c1b33', stroke: '#38bdf8', title: '#ffffff', sub: '#7dd3fc' },
      purpleBox: { fill: '#1f1338', stroke: '#c084fc', title: '#ffffff', sub: '#d8b4fe' },
      greenBox: { fill: '#0a2618', stroke: '#34d399', title: '#ffffff', sub: '#6ee7b7' },
      amberBox: { fill: '#2e1c07', stroke: '#fbbf24', title: '#ffffff', sub: '#fde047' }
    } : {
      bg: '#ffffff',
      arrow: '#4f46e5',
      arrowDash: '#475569',
      blueBox: { fill: '#eff6ff', stroke: '#1d4ed8', title: '#0f172a', sub: '#1d4ed8' },
      purpleBox: { fill: '#f5f3ff', stroke: '#6d28d9', title: '#0f172a', sub: '#6d28d9' },
      greenBox: { fill: '#ecfdf5', stroke: '#047857', title: '#0f172a', sub: '#047857' },
      amberBox: { fill: '#fffbeb', stroke: '#b45309', title: '#0f172a', sub: '#92400e' }
    };

    container.innerHTML = `
      <svg viewBox="0 0 880 340" width="100%" height="340" style="background: ${p.bg}; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="${p.arrow}" />
          </marker>
          <marker id="arrowDash" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="${p.arrowDash}" />
          </marker>
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12"/>
          </filter>
        </defs>

        <path d="M 120 70 L 170 70" stroke="${p.arrow}" stroke-width="2.5" marker-end="url(#arrow)"/>
        <path d="M 310 70 L 360 70" stroke="${p.arrow}" stroke-width="2.5" marker-end="url(#arrow)"/>
        <path d="M 500 70 L 550 70" stroke="${p.arrow}" stroke-width="2.5" marker-end="url(#arrow)"/>
        <path d="M 690 70 L 740 70" stroke="${p.arrow}" stroke-width="2.5" marker-end="url(#arrow)"/>
        
        <path d="M 430 110 L 430 200" stroke="${p.arrowDash}" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrowDash)"/>
        <path d="M 620 110 L 620 200" stroke="${p.arrowDash}" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrowDash)"/>

        <!-- Nó 1: Entrada JS -->
        <g class="arch-node" onclick="window.location.hash='tab=code&file=src/1o_codigo.js'">
          <rect x="20" y="40" width="100" height="60" rx="10" fill="${p.blueBox.fill}" stroke="${p.blueBox.stroke}" stroke-width="2" filter="url(#shadow)"/>
          <text x="70" y="66" text-anchor="middle" font-weight="800" font-size="12" fill="${p.blueBox.title}">Entrada JS</text>
          <text x="70" y="82" text-anchor="middle" font-weight="700" font-size="11" fill="${p.blueBox.sub}">*.js</text>
        </g>

        <!-- Nó 2: Flex (lexico.l) -->
        <g class="arch-node" onclick="window.location.hash='tab=code&file=src/lexico.l'">
          <rect x="170" y="40" width="140" height="60" rx="10" fill="${p.purpleBox.fill}" stroke="${p.purpleBox.stroke}" stroke-width="2" filter="url(#shadow)"/>
          <text x="240" y="66" text-anchor="middle" font-weight="800" font-size="12" fill="${p.purpleBox.title}">Léxico (Flex)</text>
          <text x="240" y="82" text-anchor="middle" font-weight="700" font-size="11" fill="${p.purpleBox.sub}">src/lexico.l</text>
        </g>

        <!-- Nó 3: Bison (grammar.y) -->
        <g class="arch-node" onclick="window.location.hash='tab=code&file=src/grammar.y'">
          <rect x="360" y="40" width="140" height="60" rx="10" fill="${p.greenBox.fill}" stroke="${p.greenBox.stroke}" stroke-width="2" filter="url(#shadow)"/>
          <text x="430" y="66" text-anchor="middle" font-weight="800" font-size="12" fill="${p.greenBox.title}">Sintático (Bison)</text>
          <text x="430" y="82" text-anchor="middle" font-weight="700" font-size="11" fill="${p.greenBox.sub}">src/grammar.y</text>
        </g>

        <!-- Nó 4: AST (ast.c / ast.h) -->
        <g class="arch-node" onclick="window.location.hash='tab=code&file=src/ast.c'">
          <rect x="550" y="40" width="140" height="60" rx="10" fill="${p.purpleBox.fill}" stroke="${p.purpleBox.stroke}" stroke-width="2" filter="url(#shadow)"/>
          <text x="620" y="66" text-anchor="middle" font-weight="800" font-size="12" fill="${p.purpleBox.title}">Árvore Sintática</text>
          <text x="620" y="82" text-anchor="middle" font-weight="700" font-size="11" fill="${p.purpleBox.sub}">struct No (ast.c)</text>
        </g>

        <!-- Nó 5: Saída Python -->
        <g class="arch-node">
          <rect x="740" y="40" width="110" height="60" rx="10" fill="${p.greenBox.fill}" stroke="${p.greenBox.stroke}" stroke-width="2" filter="url(#shadow)"/>
          <text x="795" y="66" text-anchor="middle" font-weight="800" font-size="12" fill="${p.greenBox.title}">Saída Python</text>
          <text x="795" y="82" text-anchor="middle" font-weight="700" font-size="11" fill="${p.greenBox.sub}">stdout / *.py</text>
        </g>

        <!-- Nó 6: Gerador (gerador.c) -->
        <g class="arch-node" onclick="window.location.hash='tab=code&file=src/gerador.c'">
          <rect x="540" y="200" width="160" height="64" rx="10" fill="${p.amberBox.fill}" stroke="${p.amberBox.stroke}" stroke-width="2" filter="url(#shadow)"/>
          <text x="620" y="226" text-anchor="middle" font-weight="800" font-size="12" fill="${p.amberBox.title}">Gerador de Código</text>
          <text x="620" y="244" text-anchor="middle" font-weight="700" font-size="11" fill="${p.amberBox.sub}">src/gerador.c</text>
        </g>

        <!-- Nó 7: Tabela de Símbolos (tabela.c) -->
        <g class="arch-node" onclick="window.location.hash='tab=code&file=src/tabela.c'">
          <rect x="350" y="200" width="160" height="64" rx="10" fill="${p.blueBox.fill}" stroke="${p.blueBox.stroke}" stroke-width="2" filter="url(#shadow)"/>
          <text x="430" y="226" text-anchor="middle" font-weight="800" font-size="12" fill="${p.blueBox.title}">Tabela de Símbolos</text>
          <text x="430" y="244" text-anchor="middle" font-weight="700" font-size="11" fill="${p.blueBox.sub}">src/tabela.c</text>
        </g>
      </svg>
    `;
  }

  // Render Learn Tabs
  function renderLearnTabs() {
    const pillsContainer = document.getElementById('learn-pills-container');
    const contentContainer = document.getElementById('learn-content-container');
    if (!pillsContainer || !contentContainer) return;

    pillsContainer.innerHTML = PROJECT_DATA.learningTopics.map((topic, i) => `
      <button class="learn-pill-btn ${i === 0 ? 'active' : ''}" data-topic="${topic.id}">
        ${topic.title}
      </button>
    `).join('');

    pillsContainer.querySelectorAll('.learn-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectLearnTopic(btn.getAttribute('data-topic'));
      });
    });

    selectLearnTopic(PROJECT_DATA.learningTopics[0].id);
  }

  function selectLearnTopic(topicId) {
    const topic = PROJECT_DATA.learningTopics.find(t => t.id === topicId);
    if (!topic) return;

    document.querySelectorAll('.learn-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-topic') === topicId);
    });

    const contentContainer = document.getElementById('learn-content-container');
    contentContainer.innerHTML = `
      <div class="learn-card">
        <span class="explanation-badge">Origem: ${topic.sourceDoc}</span>
        <h2 style="font-size: 22px; font-weight: 800; color: var(--text-main); margin-bottom: 8px;">${topic.title}</h2>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">${topic.desc}</p>
        <div class="markdown-rendered-body">
          ${formatMarkdown(topic.content)}
        </div>
      </div>
    `;
  }

  // Enhanced Markdown Formatter with Table Support & High-Contrast Code Highlighting
  function formatMarkdown(text) {
    if (!text) return '';
    // 1. Process Code Blocks with Syntax Highlighting and Copy Button
    const codeBlocks = [];
    text = text.replace(/```([a-z0-9_-]*)\r?\n([\s\S]*?)```/gim, (_, lang, code) => {
      const idx = codeBlocks.length;
      const detectedLang = (lang || 'c').trim().toLowerCase();
      const codeLines = code.trim().split('\n');
      const highlighted = codeLines.map(line => highlightSyntax(line, detectedLang)).join('\n');
      const langLabel = detectedLang ? detectedLang.toUpperCase() : 'CÓDIGO';
      const rawText = escapeHtml(code.trim());

      codeBlocks.push(`
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span class="code-block-lang">${langLabel}</span>
            <button class="btn-copy-code" onclick="copySnippet(this)" data-code="${rawText}" aria-label="Copiar trecho de código">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copiar
            </button>
          </div>
          <pre class="ast-preview-box"><code>${highlighted}</code></pre>
        </div>
      `);
      return `%%CODEBLOCK_${idx}%%`;
    });

    // 2. Process Tables (| col | col |)
    const lines = text.split('\n');
    const processedLines = [];
    let inTable = false;
    let tableRows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        inTable = true;
        tableRows.push(line);
      } else {
        if (inTable) {
          processedLines.push(renderHtmlTable(tableRows));
          tableRows = [];
          inTable = false;
        }
        processedLines.push(lines[i]);
      }
    }
    if (inTable) {
      processedLines.push(renderHtmlTable(tableRows));
    }

    let out = processedLines.join('\n');

    // 3. Headings & High-Contrast Inline Code
    out = out
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 17px; font-weight: 700; margin: 20px 0 10px; color: var(--text-main);">$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4 style="font-size: 14px; font-weight: 700; margin: 16px 0 8px; color: var(--text-main);">$1</h4>')
      .replace(/\`([^\`]+)\`/gim, '<code class="inline-code">$1</code>')
      .replace(/\n\n/g, '<br><br>');

    // 4. Restore Code Blocks
    codeBlocks.forEach((block, idx) => {
      out = out.replace(`%%CODEBLOCK_${idx}%%`, block);
    });

    return out;
  }

  window.copySnippet = function (btn) {
    const raw = btn.getAttribute('data-code');
    if (!raw) return;
    const txt = document.createElement('textarea');
    txt.innerHTML = raw;
    navigator.clipboard.writeText(txt.value).then(() => {
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Copiado!
      `;
      setTimeout(() => {
        btn.innerHTML = originalHtml;
      }, 2000);
      showToast('Trecho de código copiado!');
    });
  };

  function renderHtmlTable(rows) {
    if (rows.length < 2) return '';
    const parseRow = r => r.split('|').slice(1, -1).map(c => c.trim());
    const headerCols = parseRow(rows[0]);
    // Row 1 is delimiter (|---|---|)
    const bodyRows = rows.slice(2).map(parseRow);

    return `
      <table class="token-table">
        <thead>
          <tr>
            ${headerCols.map(c => `<th>${c}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${bodyRows.map(r => `
            <tr>
              ${r.map(c => `<td>${c}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Global Search Modal with Keyboard Navigation (Loop 3 Fix)
  function openSearchModal() {
    els.searchModalBackdrop.classList.add('active');
    els.modalSearchInput.value = '';
    els.modalSearchInput.focus();
    performSearch('');
  }

  function closeSearchModal() {
    els.searchModalBackdrop.classList.remove('active');
  }

  function moveSearchSelection(delta) {
    if (state.searchResults.length === 0) return;
    state.searchSelectedIndex = (state.searchSelectedIndex + delta + state.searchResults.length) % state.searchResults.length;
    updateSearchSelectionVisuals();
  }

  function updateSearchSelectionVisuals() {
    const items = els.searchResultsList.querySelectorAll('.search-result-item');
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === state.searchSelectedIndex);
      if (idx === state.searchSelectedIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function selectCurrentSearchResult() {
    if (state.searchResults[state.searchSelectedIndex]) {
      state.searchResults[state.searchSelectedIndex].action();
    }
  }

  function performSearch(query) {
    query = query.toLowerCase().trim();
    const results = [];
    state.searchSelectedIndex = 0;

    Object.values(PROJECT_DATA.files).forEach(file => {
      if (file.name.toLowerCase().includes(query) || file.path.toLowerCase().includes(query) || file.summary.toLowerCase().includes(query)) {
        results.push({
          type: 'Arquivo',
          title: file.path,
          sub: file.summary,
          action: () => {
            selectFile(file.path);
            closeSearchModal();
          }
        });
      }

      if (file.annotations) {
        Object.entries(file.annotations).forEach(([line, ann]) => {
          if (ann.title.toLowerCase().includes(query) || ann.text.toLowerCase().includes(query)) {
            results.push({
              type: `Linha ${line} · ${file.name}`,
              title: ann.title,
              sub: ann.text.substring(0, 80) + '...',
              action: () => {
                selectFile(file.path);
                selectLine(parseInt(line, 10), file);
                closeSearchModal();
              }
            });
          }
        });
      }
    });

    PROJECT_DATA.learningTopics.forEach(topic => {
      if (topic.title.toLowerCase().includes(query) || topic.desc.toLowerCase().includes(query)) {
        results.push({
          type: 'Conceito Teórico',
          title: topic.title,
          sub: topic.desc,
          action: () => {
            setTab('learn');
            selectLearnTopic(topic.id);
            closeSearchModal();
          }
        });
      }
    });

    state.searchResults = results;

    els.searchResultsList.innerHTML = results.length > 0
      ? results.map((res, i) => `
        <li class="search-result-item ${i === 0 ? 'selected' : ''}" data-index="${i}">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--primary);">${res.type}</span>
          <div class="result-title">${res.title}</div>
          <div class="result-sub">${res.sub}</div>
        </li>
      `).join('')
      : '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">Nenhum resultado encontrado no compilador.</div>';

    els.searchResultsList.querySelectorAll('.search-result-item').forEach((item, idx) => {
      item.addEventListener('click', () => {
        results[idx].action();
      });
    });
  }

  function startGuidedTour() {
    showToast('Iniciando Tour: 1. Visão Geral do Pipeline');
    setTab('home');
    setTimeout(() => {
      showToast('2. Explorando a Árvore Sintática (src/ast.c)');
      selectFile('src/ast.c');
      setTimeout(() => {
        selectLine(6, PROJECT_DATA.files['src/ast.c']);
      }, 500);
    }, 1800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
