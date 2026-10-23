/**
 * Compilador JS -> Python: Motor da Aplicação Interativa
 * Lógica modular: Roteamento, Árvore de Arquivos, Split-View, SVG e Busca
 */

(function () {
  'use strict';

  // State
  const state = {
    currentTab: 'home',
    currentFile: 'src/ast.c',
    selectedLine: null,
    searchQuery: '',
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
    toast: document.getElementById('toast-msg')
  };

  // Initialize
  function init() {
    applyTheme(state.theme);
    setupEvents();
    renderFileTree();
    renderHomeView();
    renderArchitectureGraph();
    renderLearnTabs();
    
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
  }

  // Setup Event Listeners
  function setupEvents() {
    // Theme toggle
    els.themeToggleBtn.addEventListener('click', () => {
      applyTheme(state.theme === 'light' ? 'dark' : 'light');
    });

    // Start Tour
    els.startTourBtn.addEventListener('click', () => {
      startGuidedTour();
    });

    // Navigation Tabs
    els.navTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        setTab(tab);
      });
    });

    // Search Shortcut (/)
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== els.globalSearchInput && document.activeElement !== els.modalSearchInput) {
        e.preventDefault();
        openSearchModal();
      } else if (e.key === 'Escape') {
        closeSearchModal();
      }
    });

    // Global Search Input
    els.globalSearchInput.addEventListener('click', openSearchModal);
    els.modalSearchInput.addEventListener('input', (e) => {
      performSearch(e.target.value);
    });

    els.searchModalBackdrop.addEventListener('click', (e) => {
      if (e.target === els.searchModalBackdrop) {
        closeSearchModal();
      }
    });

    // Hash Change
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

    // Update Breadcrumb
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

    if (shouldUpdateHash) {
      updateHash();
    }

    // Scroll to top of viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Render Sidebar Tree View
  function renderFileTree() {
    const container = els.fileTreeContainer;
    container.innerHTML = `
      <li class="tree-node tree-node-folder" data-folder="src">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        src/
      </li>
      <li class="tree-node tree-indent-1 ${state.currentFile === 'src/ast.c' ? 'active' : ''}" data-file="src/ast.c">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ast.c
      </li>
      <li class="tree-node tree-indent-1 ${state.currentFile === 'src/ast.h' ? 'active' : ''}" data-file="src/ast.h">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ast.h
      </li>
      <li class="tree-node tree-indent-1 ${state.currentFile === 'src/gerador.c' ? 'active' : ''}" data-file="src/gerador.c">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        gerador.c
      </li>
      <li class="tree-node tree-indent-1 ${state.currentFile === 'src/grammar.y' ? 'active' : ''}" data-file="src/grammar.y">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        grammar.y
      </li>
      <li class="tree-node tree-indent-1 ${state.currentFile === 'src/lexico.l' ? 'active' : ''}" data-file="src/lexico.l">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        lexico.l
      </li>
      <li class="tree-node tree-indent-1 ${state.currentFile === 'src/main.c' ? 'active' : ''}" data-file="src/main.c">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        main.c
      </li>
      <li class="tree-node tree-indent-1 ${state.currentFile === 'src/tabela.c' ? 'active' : ''}" data-file="src/tabela.c">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        tabela.c
      </li>
      <li class="tree-node tree-indent-1 ${state.currentFile === 'src/1o_codigo.js' ? 'active' : ''}" data-file="src/1o_codigo.js">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        1o_codigo.js
      </li>
      <li class="tree-node tree-node-folder" data-folder="docs">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        docs/
      </li>
      <li class="tree-node tree-indent-1" onclick="window.location.href='cronograma.md'">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
        cronograma.md
      </li>
      <li class="tree-node tree-indent-1" onclick="window.location.href='estrutura_documento_inicial.md'">
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
        estrutura_documento_inicial.md
      </li>
    `;

    // File selection clicks
    container.querySelectorAll('[data-file]').forEach(el => {
      el.addEventListener('click', () => {
        const filePath = el.getAttribute('data-file');
        selectFile(filePath);
      });
    });
  }

  function selectFile(filePath) {
    state.currentFile = filePath;
    state.selectedLine = null;
    renderFileTree();
    setTab('code');
  }

  // Render Home View
  function renderHomeView() {
    // Pipeline stepper
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

    // Modules Grid
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

    // Tech badges
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

  // Render Split-View Code Explorer
  function renderCodeExplorer(filePath, targetLine = null) {
    const file = PROJECT_DATA.files[filePath];
    if (!file) return;

    // Header info
    document.getElementById('code-file-title').textContent = file.path;
    document.getElementById('code-file-summary').textContent = file.summary;
    document.getElementById('code-lines-count').textContent = `${file.linesCount} linhas`;
    document.getElementById('code-file-author').textContent = `Autor: ${file.author}`;

    // Render Lines
    const linesContainer = document.getElementById('code-lines-container');
    linesContainer.innerHTML = file.code.map((lineText, idx) => {
      const lineNum = idx + 1;
      const isAnnotated = !!file.annotations[lineNum];
      const isActive = targetLine === lineNum;
      return `
        <div class="code-line ${isActive ? 'active' : ''} ${isAnnotated ? 'has-annotation' : ''}" data-line="${lineNum}">
          <span class="line-number">${lineNum}</span>
          <span class="line-content">${escapeHtml(lineText)}</span>
        </div>
      `;
    }).join('');

    // Attach click events on code lines
    linesContainer.querySelectorAll('.code-line').forEach(lineEl => {
      lineEl.addEventListener('click', () => {
        const lineNum = parseInt(lineEl.getAttribute('data-line'), 10);
        selectLine(lineNum, file);
      });
    });

    // Default or selected explanation
    if (targetLine && file.annotations[targetLine]) {
      selectLine(targetLine, file);
    } else {
      // Find first annotated line or show generic file overview
      const firstAnnotated = Object.keys(file.annotations)[0];
      if (firstAnnotated) {
        selectLine(parseInt(firstAnnotated, 10), file);
      } else {
        renderFileOverviewExplanation(file);
      }
    }
  }

  function selectLine(lineNum, file) {
    state.selectedLine = lineNum;

    // Update active class on lines
    document.querySelectorAll('.code-line').forEach(el => {
      el.classList.toggle('active', parseInt(el.getAttribute('data-line'), 10) === lineNum);
    });

    const annotation = file.annotations[lineNum];
    const explanationBody = document.getElementById('explanation-body-container');
    const explanationTitle = document.getElementById('explanation-header-title');

    explanationTitle.textContent = `Linha ${lineNum} · ${file.name}`;

    if (annotation) {
      explanationBody.innerHTML = `
        <div>
          <span class="explanation-badge">Anotação Didática</span>
          <h4 class="explanation-heading">${annotation.title}</h4>
        </div>
        <div class="explanation-text">
          ${annotation.text}
        </div>
        ${annotation.theory ? `
          <div class="concept-box">
            <strong>Conceito Teórico Subjacente:</strong>
            ${annotation.theory}
          </div>
        ` : ''}
        <div class="context-card" style="margin-top: 12px;">
          <div class="context-card-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            Dependências e Consumidores
          </div>
          <div class="context-card-desc">
            <strong>Depende de:</strong> ${file.dependencies.join(', ') || 'Nenhuma (nódulo base)'}<br>
            <strong>Consumido por:</strong> ${file.dependents.join(', ') || 'Nenhum'}
          </div>
        </div>
      `;
    } else {
      explanationBody.innerHTML = `
        <div>
          <span class="explanation-badge">Linha ${lineNum}</span>
          <h4 class="explanation-heading">Instrução ${file.name}</h4>
        </div>
        <div class="explanation-text">
          Esta linha faz parte da rotina de <code>${file.name}</code>. Clique nas linhas numeradas para navegar pelas explicações detalhadas das decisões arquiteturais e de controle de memória.
        </div>
        <div class="concept-box">
          <strong>Papel do Módulo:</strong>
          ${file.summary}
        </div>
      `;
    }
  }

  function renderFileOverviewExplanation(file) {
    const explanationBody = document.getElementById('explanation-body-container');
    const explanationTitle = document.getElementById('explanation-header-title');
    explanationTitle.textContent = `Visão Geral · ${file.name}`;
    explanationBody.innerHTML = `
      <div>
        <span class="explanation-badge">Módulo ${file.module.toUpperCase()}</span>
        <h4 class="explanation-heading">${file.name}</h4>
      </div>
      <div class="explanation-text">
        ${file.summary}
      </div>
      <div class="concept-box">
        <strong>Atribuição de Equipe:</strong> ${file.author} é o responsável direto por este arquivo conforme o cronograma oficial.
      </div>
    `;
  }

  // Copy Code to Clipboard
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

  // Render Architecture Diagram
  function renderArchitectureGraph() {
    const container = document.getElementById('architecture-diagram-container');
    if (!container) return;

    container.innerHTML = `
      <svg viewBox="0 0 880 340" width="100%" height="340" style="background: var(--bg-surface); border-radius: var(--radius-lg);">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="var(--primary)" />
          </marker>
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.08"/>
          </filter>
        </defs>

        <!-- Fluxo Central: Entrada -> Flex -> Bison -> AST -> Gerador -> Saída -->
        <!-- Linhas conectoras -->
        <path d="M 120 70 L 170 70" stroke="var(--primary)" stroke-width="2" marker-end="url(#arrow)"/>
        <path d="M 310 70 L 360 70" stroke="var(--primary)" stroke-width="2" marker-end="url(#arrow)"/>
        <path d="M 500 70 L 550 70" stroke="var(--primary)" stroke-width="2" marker-end="url(#arrow)"/>
        <path d="M 690 70 L 740 70" stroke="var(--primary)" stroke-width="2" marker-end="url(#arrow)"/>
        
        <!-- Conexões auxiliares: Tabela e Main -->
        <path d="M 430 110 L 430 200" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrow)"/>
        <path d="M 620 110 L 620 200" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrow)"/>
        <path d="M 240 110 L 240 170 L 430 170" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4"/>

        <!-- Nó 1: Entrada JS -->
        <g class="arch-node" onclick="window.location.hash='tab=code&file=src/1o_codigo.js'">
          <rect x="20" y="40" width="100" height="60" rx="10" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5" filter="url(#shadow)"/>
          <text x="70" y="66" text-anchor="middle" font-weight="700" font-size="12" fill="#1e3a8a">Entrada JS</text>
          <text x="70" y="82" text-anchor="middle" font-size="10" fill="#3b82f6">*.js</text>
        </g>

        <!-- Nó 2: Flex (lexico.l) -->
        <g class="arch-node" onclick="window.location.hash='tab=code&file=src/lexico.l'">
          <rect x="170" y="40" width="140" height="60" rx="10" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.5" filter="url(#shadow)"/>
          <text x="240" y="66" text-anchor="middle" font-weight="700" font-size="12" fill="#4c1d95">Léxico (Flex)</text>
          <text x="240" y="82" text-anchor="middle" font-size="10" fill="#7c3aed">src/lexico.l</text>
        </g>

        <!-- Nó 3: Bison (grammar.y) -->
        <g class="arch-node" onclick="window.location.hash='tab=code&file=src/grammar.y'">
          <rect x="360" y="40" width="140" height="60" rx="10" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5" filter="url(#shadow)"/>
          <text x="430" y="66" text-anchor="middle" font-weight="700" font-size="12" fill="#064e3b">Sintático (Bison)</text>
          <text x="430" y="82" text-anchor="middle" font-size="10" fill="#059669">src/grammar.y</text>
        </g>

        <!-- Nó 4: AST (ast.c / ast.h) -->
        <g class="arch-node" onclick="window.location.hash='tab=code&file=src/ast.c'">
          <rect x="550" y="40" width="140" height="60" rx="10" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.5" filter="url(#shadow)"/>
          <text x="620" y="66" text-anchor="middle" font-weight="700" font-size="12" fill="#4c1d95">Árvore Sintática</text>
          <text x="620" y="82" text-anchor="middle" font-size="10" fill="#7c3aed">struct No (ast.c)</text>
        </g>

        <!-- Nó 5: Saída Python -->
        <g class="arch-node">
          <rect x="740" y="40" width="110" height="60" rx="10" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5" filter="url(#shadow)"/>
          <text x="795" y="66" text-anchor="middle" font-weight="700" font-size="12" fill="#064e3b">Saída Python</text>
          <text x="795" y="82" text-anchor="middle" font-size="10" fill="#059669">stdout / *.py</text>
        </g>

        <!-- Nó 6: Gerador (gerador.c) -->
        <g class="arch-node" onclick="window.location.hash='tab=code&file=src/gerador.c'">
          <rect x="540" y="200" width="160" height="64" rx="10" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.5" filter="url(#shadow)"/>
          <text x="620" y="226" text-anchor="middle" font-weight="700" font-size="12" fill="#78350f">Gerador de Código</text>
          <text x="620" y="244" text-anchor="middle" font-size="10" fill="#b45309">src/gerador.c (Ruan & Lucas)</text>
        </g>

        <!-- Nó 7: Tabela de Símbolos (tabela.c) -->
        <g class="arch-node" onclick="window.location.hash='tab=code&file=src/tabela.c'">
          <rect x="350" y="200" width="160" height="64" rx="10" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5" filter="url(#shadow)"/>
          <text x="430" y="226" text-anchor="middle" font-weight="700" font-size="12" fill="#1e3a8a">Tabela de Símbolos</text>
          <text x="430" y="244" text-anchor="middle" font-size="10" fill="#2563eb">src/tabela.c (Jorge)</text>
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

  // Quick Markdown Formatter
  function formatMarkdown(text) {
    return text
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 17px; font-weight: 700; margin: 18px 0 8px; color: var(--text-main);">$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4 style="font-size: 14px; font-weight: 700; margin: 14px 0 6px; color: var(--text-main);">$1</h4>')
      .replace(/\`\`\`c([\s\S]*?)\`\`\`/gim, '<pre class="ast-preview-box"><code>$1</code></pre>')
      .replace(/\`\`\`([\s\S]*?)\`\`\`/gim, '<pre class="ast-preview-box"><code>$1</code></pre>')
      .replace(/\`([^\`]+)\`/gim, '<code style="background: var(--bg-surface-subtle); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 12px;">$1</code>')
      .replace(/\| (.*) \|/g, function (match) {
        // Table line converter
        return match;
      })
      .replace(/\n\n/g, '<br><br>');
  }

  // Global Search Modal
  function openSearchModal() {
    els.searchModalBackdrop.classList.add('active');
    els.modalSearchInput.value = '';
    els.modalSearchInput.focus();
    performSearch('');
  }

  function closeSearchModal() {
    els.searchModalBackdrop.classList.remove('active');
  }

  function performSearch(query) {
    query = query.toLowerCase().trim();
    const results = [];

    // Search in Files
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

      // Search inside code and annotations
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
    });

    // Search in Learning Topics
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

    // Render results
    els.searchResultsList.innerHTML = results.length > 0
      ? results.map((res, i) => `
        <li class="search-result-item" data-index="${i}">
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

  // Guided Tour
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
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', init);
})();
