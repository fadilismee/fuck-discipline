/**
 * PRODUCTIV LIFE OS - COMPLETE APPLICATION CONTROLLER
 * 100% Exact Verbatim Page Loader + Auto-Hide Sidebar (Hover & Arrow Toggle) + Reactive JSON Store
 */

(function () {
  const store = window.ProductivStore;

  // DOM Elements
  let mainContent;
  let appSidebar;
  let sidebarToggleBtn;
  let sidebarHoverZone;
  let sidebarBackdrop;
  let taskDrawer;
  let commandPaletteModal;
  let quickExpenseModal;
  let quickTaskModal;
  let toastContainer;
  let headerDate;

  document.addEventListener('DOMContentLoaded', () => {
    initDomReferences();
    initGlobalEventListeners();
    initSidebar();
    initCommandPalette();
    initModals();

    // Check initial hash
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && window.RAW_PAGES_DATA && window.RAW_PAGES_DATA[initialHash]) {
      store.activeView = initialHash;
    }

    window.addEventListener('hashchange', () => {
      const h = window.location.hash.replace('#', '');
      if (h && h !== store.activeView && window.RAW_PAGES_DATA && window.RAW_PAGES_DATA[h]) {
        store.setView(h);
      }
    });

    // Subscribe to Store updates
    store.subscribe((event, payload, data) => {
      if (event === 'VIEW_CHANGED') {
        window.location.hash = payload;
        loadExactPageView(payload);
      }
      updateSidebarBadges();
      if (event === 'TIMER_TICK' || event === 'TIMER_STARTED' || event === 'TIMER_PAUSED') {
        updateFocusClockDisplays();
      }
    });

    // Initial Render
    updateSidebarBadges();
    loadExactPageView(store.activeView);
  });

  function initDomReferences() {
    mainContent = document.getElementById('main-content');
    appSidebar = document.getElementById('app-sidebar');
    sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    sidebarHoverZone = document.getElementById('sidebar-hover-zone');
    sidebarBackdrop = document.getElementById('sidebar-backdrop');
    taskDrawer = document.getElementById('task-detail-drawer');
    commandPaletteModal = document.getElementById('command-palette-modal');
    quickExpenseModal = document.getElementById('quick-expense-modal');
    quickTaskModal = document.getElementById('quick-task-modal');
    toastContainer = document.getElementById('toast-container');
    headerDate = document.getElementById('header-date');

    if (headerDate && store.data.user && store.data.user.dateStr) {
      headerDate.textContent = store.data.user.dateStr.split('—')[0].trim();
    }
  }

  // Toast Notification
  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    const colorClass = type === 'success' ? 'text-tertiary-fixed border-tertiary-fixed/30' : 'text-primary border-outline-variant/40';
    toast.className = `flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-high border ${colorClass} shadow-2xl font-label-default text-label-default transition-all duration-300 transform translate-y-2 opacity-0 font-mono z-50`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-[16px]">${type === 'success' ? 'check_circle' : 'info'}</span>
      <span class="font-sans text-[13px]">${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // =========================================================================
  // AUTO-HIDE SIDEBAR LOGIC (HOVER TRIGGER & ARROW > TOGGLE)
  // =========================================================================
  let isSidebarOpen = false;
  let sidebarTimeout = null;

  function initSidebar() {
    const closeBtn = document.getElementById('sidebar-close-btn');
    const menuBtn = document.getElementById('header-menu-btn');

    // Sidebar navigation clicks
    const navLinks = document.querySelectorAll('#sidebar-nav-container [data-path], aside [data-path]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const path = link.getAttribute('data-path');
        store.setView(path);
        store.playBeep(440, 'sine', 0.05);
        closeSidebar();
      });
    });

    // Hover trigger zone on left edge
    if (sidebarHoverZone) {
      sidebarHoverZone.addEventListener('mouseenter', () => {
        clearTimeout(sidebarTimeout);
        openSidebar();
      });
    }

    // Toggle button ( > )
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isSidebarOpen) closeSidebar();
        else openSidebar();
      });
    }

    if (menuBtn) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isSidebarOpen) closeSidebar();
        else openSidebar();
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

    // Keep sidebar open while hovering it, close when mouse leaves
    if (appSidebar) {
      appSidebar.addEventListener('mouseenter', () => {
        clearTimeout(sidebarTimeout);
      });
      appSidebar.addEventListener('mouseleave', () => {
        sidebarTimeout = setTimeout(() => {
          closeSidebar();
        }, 400);
      });
    }

    // Header Quick Buttons
    const headerSearchBtn = document.getElementById('header-search-btn');
    if (headerSearchBtn) headerSearchBtn.addEventListener('click', () => openCommandPalette());

    const headerCaptureBtn = document.getElementById('header-capture-btn');
    if (headerCaptureBtn) headerCaptureBtn.addEventListener('click', () => openQuickTaskModal());
  }

  function openSidebar() {
    isSidebarOpen = true;
    if (appSidebar) {
      appSidebar.classList.remove('-translate-x-full');
      appSidebar.classList.add('translate-x-0');
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.remove('hidden');
      setTimeout(() => sidebarBackdrop.classList.remove('opacity-0'), 10);
    }
    const arrow = document.getElementById('sidebar-toggle-arrow');
    if (arrow) arrow.textContent = 'chevron_left';
  }

  function closeSidebar() {
    isSidebarOpen = false;
    if (appSidebar) {
      appSidebar.classList.add('-translate-x-full');
      appSidebar.classList.remove('translate-x-0');
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.add('opacity-0');
      setTimeout(() => sidebarBackdrop.classList.add('hidden'), 300);
    }
    const arrow = document.getElementById('sidebar-toggle-arrow');
    if (arrow) arrow.textContent = 'chevron_right';
  }

  function updateSidebarBadges() {
    const navLinks = document.querySelectorAll('#sidebar-nav-container [data-path], aside [data-path]');
    navLinks.forEach(link => {
      const path = link.getAttribute('data-path');
      if (path === store.activeView) {
        link.className = 'nav-item relative flex items-center justify-between px-space-sm h-8 rounded-lg bg-surface-container-high text-primary font-medium border border-outline-variant/40 shadow-sm transition-all cursor-pointer';
      } else {
        link.className = 'nav-item group flex items-center justify-between px-space-sm h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all duration-150 cursor-pointer';
      }
    });

    const activeTasks = store.getTasks().filter(t => !t.completed).length;
    const taskBadge = document.getElementById('sidebar-tasks-count');
    if (taskBadge) taskBadge.textContent = activeTasks;

    const activeProjects = (store.data.projects || []).filter(p => p.status === 'active').length;
    const projBadge = document.getElementById('sidebar-projects-count');
    if (projBadge) projBadge.textContent = activeProjects;

    const routines = store.data.routines || [];
    const doneRoutines = routines.filter(r => r.doneToday).length;
    const routineBadge = document.getElementById('sidebar-routines-count');
    if (routineBadge) routineBadge.textContent = `${doneRoutines}/${routines.length}`;
  }

  // Keyboard Shortcuts
  function initGlobalEventListeners() {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommandPalette();
      }
      if (e.key.toLowerCase() === 'n' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        openQuickTaskModal();
      }
      if (e.key === 'Escape') closeAllModals();
      if (e.altKey && !isNaN(parseInt(e.key))) {
        const index = parseInt(e.key) - 1;
        const views = ['today', 'tasks', 'calendar', 'projects', 'focus', 'routines', 'finance', 'review', 'mirror', 'settings'];
        if (views[index]) {
          e.preventDefault();
          store.setView(views[index]);
        }
      }
    });
  }

  // =========================================================================
  // LOAD 100% VERBATIM PAGE HTML
  // =========================================================================
  function loadExactPageView(viewKey) {
    if (!mainContent) return;

    const pageData = window.RAW_PAGES_DATA && window.RAW_PAGES_DATA[viewKey];
    if (pageData && pageData.html) {
      // Render 100% untouched raw HTML
      mainContent.innerHTML = pageData.html;
      // Bind interactive logic for this page
      bindInteractiveComponents(viewKey);
    } else {
      mainContent.innerHTML = `<div class="p-12 text-center text-outline font-mono">Page ${viewKey} not loaded.</div>`;
    }
  }

  // =========================================================================
  // BIND INTERACTIVE LOGIC FOR VERBATIM PAGES
  // =========================================================================
  function bindInteractiveComponents(viewKey) {
    // 1. Task Checkboxes & Row clicks (Works across Today, Tasks, and drawer)
    const taskRows = mainContent.querySelectorAll('.task-row, [onclick*="openDrawer"]');
    taskRows.forEach(row => {
      row.addEventListener('click', (e) => {
        const checkBtn = row.querySelector('.task-checkbox, input[type="checkbox"], button');
        const checkMark = row.querySelector('.check-mark, .material-symbols-outlined');
        const title = row.querySelector('.task-title, span.text-primary, span.text-on-surface');

        if (e.target.closest('button') || e.target.type === 'checkbox') {
          // Toggle completion
          const isDone = row.classList.contains('opacity-50') || (checkMark && !checkMark.classList.contains('opacity-0'));
          if (isDone) {
            row.classList.remove('opacity-50', 'bg-surface-container-lowest/40');
            if (checkMark) checkMark.classList.add('opacity-0');
            if (checkBtn) {
              checkBtn.className = "task-checkbox mt-0.5 w-4 h-4 rounded-sm bg-surface-container-highest flex items-center justify-center text-primary";
            }
            if (title) title.classList.remove('line-through', 'text-outline');
            store.playBeep(440, 'sine', 0.1);
          } else {
            row.classList.add('opacity-50', 'bg-surface-container-lowest/40');
            if (checkMark) checkMark.classList.remove('opacity-0');
            if (checkBtn) {
              checkBtn.className = "task-checkbox mt-0.5 w-4 h-4 rounded-sm bg-primary text-on-primary flex items-center justify-center";
            }
            if (title) title.classList.add('line-through', 'text-outline');
            store.playSuccessChime();
          }
        } else {
          // Open drawer for this task
          const taskName = (title && title.textContent.trim()) || 'Finish Productiv UI';
          openTaskDrawerByName(taskName);
        }
      });
    });

    // 2. Today Quick Task Input
    const quickAddForm = mainContent.querySelector('#task-quick-add');
    const quickInput = mainContent.querySelector('#task-input-field');
    const tasksContainer = mainContent.querySelector('#tasks-container');

    if (quickAddForm && quickInput && tasksContainer) {
      quickAddForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = quickInput.value.trim();
        if (!val) return;

        const newRow = document.createElement('div');
        newRow.className = "task-row group flex items-start gap-space-sm p-space-xs rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer";
        newRow.innerHTML = `
          <button type="button" class="task-checkbox mt-0.5 w-4 h-4 rounded-sm bg-surface-container-highest flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <span class="material-symbols-outlined text-[12px] opacity-0 check-mark">check</span>
          </button>
          <div class="flex flex-col flex-1 min-w-0">
            <div class="flex items-center justify-between gap-space-xs">
              <span class="task-title font-body-default text-body-default text-primary truncate">${val}</span>
              <span class="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container text-outline flex items-center gap-1 shrink-0 font-mono">Normal</span>
            </div>
            <div class="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm mt-0.5 font-mono">
              <span class="text-tertiary-fixed">Inbox</span>
              <span class="text-outline">•</span>
              <span>Just added</span>
            </div>
          </div>
        `;
        tasksContainer.insertBefore(newRow, tasksContainer.firstChild);
        quickInput.value = '';
        store.playBeep(659.25, 'sine', 0.15);

        newRow.addEventListener('click', (evt) => {
          const checkMark = newRow.querySelector('.check-mark');
          const checkbox = newRow.querySelector('.task-checkbox');
          const title = newRow.querySelector('.task-title');
          const isChecked = !checkMark.classList.contains('opacity-0');

          if (isChecked) {
            checkMark.classList.add('opacity-0');
            checkbox.className = "task-checkbox mt-0.5 w-4 h-4 rounded-sm bg-surface-container-highest flex items-center justify-center text-primary";
            title.className = "task-title font-body-default text-body-default text-primary truncate";
            newRow.classList.remove('opacity-50', 'bg-surface-container-lowest/40');
            store.playBeep(440, 'sine', 0.1);
          } else {
            checkMark.classList.remove('opacity-0');
            checkbox.className = "task-checkbox mt-0.5 w-4 h-4 rounded-sm bg-primary text-on-primary flex items-center justify-center";
            title.className = "task-title font-body-default text-body-default line-through text-outline truncate";
            newRow.classList.add('opacity-50', 'bg-surface-container-lowest/40');
            store.playSuccessChime();
          }
        });
      });
    }

    // 3. New Detailed Task Trigger button
    const detailedTaskBtn = mainContent.querySelector('#add-task-trigger-btn, [id*="New Task"], button:has(.material-symbols-outlined:contains("add"))');
    if (detailedTaskBtn) detailedTaskBtn.addEventListener('click', openQuickTaskModal);

    // 4. Routines Check-off Toggle
    const routineItems = mainContent.querySelectorAll('.routine-item, [data-done]');
    routineItems.forEach(item => {
      item.addEventListener('click', () => {
        const isDone = item.getAttribute('data-done') === 'true';
        const indicator = item.querySelector('div > div, button');
        const title = item.querySelector('span');

        if (isDone) {
          item.setAttribute('data-done', 'false');
          if (indicator) {
            indicator.className = "w-4 h-4 rounded-full bg-surface-container-highest flex items-center justify-center text-primary";
            indicator.innerHTML = "";
          }
          if (title) title.className = "font-body-default text-body-default text-primary";
          store.playBeep(440, 'sine', 0.08);
        } else {
          item.setAttribute('data-done', 'true');
          if (indicator) {
            indicator.className = "w-4 h-4 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed font-bold";
            indicator.innerHTML = '<span class="material-symbols-outlined text-[12px] font-bold">check</span>';
          }
          if (title) title.className = "font-body-default text-body-default text-outline line-through";
          store.playSuccessChime();
        }
      });
    });

    // 5. Focus Timer Toggle (Today widget and Main Focus Station)
    const focusToggleBtn = mainContent.querySelector('#focus-toggle-btn, #toggleBtn');
    const focusClock = mainContent.querySelector('#focus-clock-display, #timerDisplay');
    const focusModeCycle = mainContent.querySelector('#focus-mode-cycle');

    if (focusToggleBtn) {
      focusToggleBtn.addEventListener('click', () => {
        if (store.timer.isRunning) {
          store.pauseTimer();
          focusToggleBtn.innerHTML = `
            <span class="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>START FOCUS</span>
          `;
          focusToggleBtn.className = "flex-1 flex items-center justify-center gap-2 h-9 bg-primary text-on-primary rounded-lg font-headline-sm text-headline-sm font-semibold hover:bg-primary-fixed active:scale-[0.99] transition-all font-mono";
        } else {
          store.startTimer();
          focusToggleBtn.innerHTML = `
            <span class="material-symbols-outlined text-[18px]">pause</span>
            <span>PAUSE FOCUS</span>
          `;
          focusToggleBtn.className = "flex-1 flex items-center justify-center gap-2 h-9 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg font-headline-sm text-headline-sm font-semibold hover:bg-tertiary-fixed-dim active:scale-[0.99] transition-all font-mono";
        }
      });
    }

    if (focusModeCycle) {
      focusModeCycle.addEventListener('click', () => {
        const presets = [25, 50, 15];
        const next = presets[(presets.indexOf(store.data.focus.presetMinutes) + 1) % presets.length];
        store.setTimerPreset(next);
        focusModeCycle.textContent = `${next}m`;
        updateFocusClockDisplays();
      });
    }

    // 6. Focus View Specific Controls (+5 min, skip, reset, binaural)
    const add5Btn = mainContent.querySelector('button[title="Add 5 Minutes"], #focus-add-5-btn');
    if (add5Btn) add5Btn.addEventListener('click', () => store.addTimerMinutes(5));

    const skipBtn = mainContent.querySelector('button[title="Skip Session"], #focus-skip-btn');
    if (skipBtn) skipBtn.addEventListener('click', () => store.completeTimerSession());

    const resetBtn = mainContent.querySelector('button[title="Reset Session"], #focus-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', () => store.resetTimer());

    // 7. Finance Quick Modal Trigger
    const quickExpenseTrigger = mainContent.querySelector('#quick-expense-btn, [id*="Add Transaction"], button:has(.material-symbols-outlined:contains("add_card"))');
    if (quickExpenseTrigger) quickExpenseTrigger.addEventListener('click', openQuickExpenseModal);

    // 8. Finance Tabs
    const financeTabs = mainContent.querySelectorAll('.finance-tab-btn');
    financeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        financeTabs.forEach(t => {
          t.classList.remove('bg-surface-container-high', 'text-primary');
          t.classList.add('text-on-surface-variant');
        });
        tab.classList.add('bg-surface-container-high', 'text-primary');
        tab.classList.remove('text-on-surface-variant');
      });
    });

    // 9. Tasks View List vs Kanban Switcher
    const viewListBtn = mainContent.querySelector('#viewListBtn');
    const viewKanbanBtn = mainContent.querySelector('#viewKanbanBtn');
    const taskListView = mainContent.querySelector('#taskListView');
    const taskKanbanView = mainContent.querySelector('#taskKanbanView');

    if (viewListBtn && viewKanbanBtn && taskListView && taskKanbanView) {
      viewListBtn.addEventListener('click', () => {
        viewListBtn.className = "flex items-center gap-1.5 px-space-sm h-7 rounded bg-surface-container-high text-primary font-label-default text-label-default shadow-sm transition-all";
        viewKanbanBtn.className = "flex items-center gap-1.5 px-space-sm h-7 rounded text-on-surface-variant hover:text-primary font-label-default text-label-default transition-all";
        taskListView.classList.remove('hidden');
        taskKanbanView.classList.add('hidden');
      });

      viewKanbanBtn.addEventListener('click', () => {
        viewKanbanBtn.className = "flex items-center gap-1.5 px-space-sm h-7 rounded bg-surface-container-high text-primary font-label-default text-label-default shadow-sm transition-all";
        viewListBtn.className = "flex items-center gap-1.5 px-space-sm h-7 rounded text-on-surface-variant hover:text-primary font-label-default text-label-default transition-all";
        taskListView.classList.add('hidden');
        taskKanbanView.classList.remove('hidden');
      });
    }

    // 10. Review Journal Form
    const reviewForm = mainContent.querySelector('#review-journal-form, form:has(textarea)');
    if (reviewForm && viewKey === 'review') {
      reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const textareas = reviewForm.querySelectorAll('textarea');
        const win = textareas[0] ? textareas[0].value : '';
        const friction = textareas[1] ? textareas[1].value : '';
        const decision = textareas[2] ? textareas[2].value : '';
        store.addReviewEntry({ win, friction, decision });
        showToast('Saved Retrospective Reflection', 'success');
      });
    }

    // 11. Mirror AI Chat Form
    const aiForm = mainContent.querySelector('#ai-chat-form, form:has(input[type="text"])');
    const aiInput = mainContent.querySelector('#ai-prompt-input, input[placeholder*="Ask"]');
    const aiChatBox = mainContent.querySelector('#ai-chat-messages, .overflow-y-auto');

    if (aiForm && aiInput && viewKey === 'mirror') {
      aiForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = aiInput.value.trim();
        if (!val) return;

        store.sendAiMessage(val);
        aiInput.value = '';

        if (aiChatBox) {
          const userBubble = document.createElement('div');
          userBubble.className = "flex flex-col items-end";
          userBubble.innerHTML = `
            <div class="flex items-center gap-1 text-label-sm text-outline mb-0.5 font-mono">
              <span>${store.data.user.name}</span><span>•</span><span>Just now</span>
            </div>
            <div class="max-w-xl p-space-md rounded-xl bg-primary text-on-primary font-medium text-body-default shadow-sm">
              ${val}
            </div>
          `;
          aiChatBox.appendChild(userBubble);
          aiChatBox.scrollTop = aiChatBox.scrollHeight;

          setTimeout(() => {
            const reply = store.generateAiResponse(val);
            const aiBubble = document.createElement('div');
            aiBubble.className = "flex flex-col items-start";
            aiBubble.innerHTML = `
              <div class="flex items-center gap-1 text-label-sm text-outline mb-0.5 font-mono">
                <span>Mirror AI Engine</span><span>•</span><span>Just now</span>
              </div>
              <div class="max-w-xl p-space-md rounded-xl bg-surface-container text-on-surface border border-outline-variant/20 text-body-default shadow-sm font-sans">
                ${reply}
              </div>
            `;
            aiChatBox.appendChild(aiBubble);
            aiChatBox.scrollTop = aiChatBox.scrollHeight;
          }, 450);
        }
      });
    }

    // 12. Settings Actions (Export/Import/Reset)
    const exportBtn = mainContent.querySelector('#set-export-btn, button:contains("Export"), button:has(.material-symbols-outlined:contains("file_download"))');
    if (exportBtn && viewKey === 'settings') {
      exportBtn.addEventListener('click', () => store.exportJson());
    }

    const settingsResetBtn = mainContent.querySelector('#set-reset-btn, button:has(.material-symbols-outlined:contains("restart_alt"))');
    if (settingsResetBtn && viewKey === 'settings') {
      settingsResetBtn.addEventListener('click', () => {
        if (confirm('Reset all data to default demo state?')) {
          store.resetToDefault();
          showToast('Data reset to default', 'info');
          loadExactPageView('settings');
        }
      });
    }
  }

  function updateFocusClockDisplays() {
    const displays = document.querySelectorAll('#focus-clock-display, #timerDisplay, #focus-clock-big');
    const m = Math.floor(store.timer.secondsRemaining / 60);
    const s = store.timer.secondsRemaining % 60;
    displays.forEach(d => {
      d.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    });
  }

  // =========================================================================
  // MODALS & COMMAND PALETTE
  // =========================================================================
  function initModals() {
    // Quick Expense Modal
    const closeExpBtn = document.getElementById('close-expense-modal');
    const cancelExpBtn = document.getElementById('cancel-expense-btn');
    const expForm = document.getElementById('quick-expense-form');

    if (closeExpBtn) closeExpBtn.addEventListener('click', closeQuickExpenseModal);
    if (cancelExpBtn) cancelExpBtn.addEventListener('click', closeQuickExpenseModal);
    if (quickExpenseModal) {
      quickExpenseModal.addEventListener('click', (e) => {
        if (e.target === quickExpenseModal) closeQuickExpenseModal();
      });
    }

    if (expForm) {
      expForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = document.getElementById('expense-amount-input').value;
        const title = document.getElementById('expense-desc-input').value;
        const category = document.getElementById('expense-category-input').value;
        if (!amount || !title) return;

        store.addTransaction({
          title,
          category,
          amount: parseFloat(amount),
          type: 'expense'
        });
        showToast(`Logged Rp ${parseFloat(amount).toLocaleString('id-ID')} for ${title}`, 'success');
        closeQuickExpenseModal();
        if (store.activeView === 'finance' || store.activeView === 'today') {
          loadExactPageView(store.activeView);
        }
      });
    }

    // Quick Task Modal
    const closeTaskBtn = document.getElementById('close-task-modal');
    const cancelTaskBtn = document.getElementById('cancel-task-btn');
    const taskForm = document.getElementById('quick-task-form');

    if (closeTaskBtn) closeTaskBtn.addEventListener('click', closeQuickTaskModal);
    if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', closeQuickTaskModal);
    if (quickTaskModal) {
      quickTaskModal.addEventListener('click', (e) => {
        if (e.target === quickTaskModal) closeQuickTaskModal();
      });
    }

    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title-input').value;
        const project = document.getElementById('task-project-input').value;
        const priority = document.getElementById('task-priority-input').value;
        const est = document.getElementById('task-est-input').value;
        const due = document.getElementById('task-due-input').value;
        const notes = document.getElementById('task-notes-input').value;
        if (!title) return;

        store.addTask({
          title,
          project,
          priority,
          est: est || '1h est',
          due: due || 'Today',
          status: 'today',
          notes
        });

        showToast(`Created task: "${title}"`, 'success');
        closeQuickTaskModal();
        if (store.activeView === 'tasks' || store.activeView === 'today') {
          loadExactPageView(store.activeView);
        }
      });
    }

    // Task Drawer Close
    const closeDrawerBtn = document.getElementById('close-task-drawer');
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeTaskDrawer);
  }

  function openQuickExpenseModal() {
    if (!quickExpenseModal) return;
    document.getElementById('expense-amount-input').value = '';
    document.getElementById('expense-desc-input').value = '';
    quickExpenseModal.classList.remove('hidden');
    setTimeout(() => {
      quickExpenseModal.classList.remove('opacity-0');
      document.getElementById('expense-amount-input').focus();
    }, 10);
  }

  function closeQuickExpenseModal() {
    if (!quickExpenseModal) return;
    quickExpenseModal.classList.add('opacity-0');
    setTimeout(() => quickExpenseModal.classList.add('hidden'), 200);
  }

  function openQuickTaskModal() {
    if (!quickTaskModal) return;
    document.getElementById('task-title-input').value = '';
    document.getElementById('task-notes-input').value = '';
    quickTaskModal.classList.remove('hidden');
    setTimeout(() => {
      quickTaskModal.classList.remove('opacity-0');
      document.getElementById('task-title-input').focus();
    }, 10);
  }

  function closeQuickTaskModal() {
    if (!quickTaskModal) return;
    quickTaskModal.classList.add('opacity-0');
    setTimeout(() => quickTaskModal.classList.add('hidden'), 200);
  }

  function closeAllModals() {
    closeCommandPalette();
    closeQuickExpenseModal();
    closeQuickTaskModal();
    closeTaskDrawer();
    closeSidebar();
  }

  function openTaskDrawerByName(title) {
    let task = store.getTasks().find(t => t.title.toLowerCase() === title.toLowerCase()) || store.getTasks()[0];
    if (!task) return;
    store.selectedTaskId = task.id;
    renderTaskDrawerContent(task);
    if (taskDrawer) taskDrawer.classList.remove('translate-x-full');
  }

  function closeTaskDrawer() {
    store.selectedTaskId = null;
    if (taskDrawer) taskDrawer.classList.add('translate-x-full');
  }

  function renderTaskDrawerContent(task) {
    const content = document.getElementById('task-drawer-content');
    if (!content) return;

    content.innerHTML = `
      <div class="flex items-center justify-between pb-space-sm border-b border-surface-container-highest">
        <div class="flex items-center gap-2">
          <input type="checkbox" ${task.completed ? 'checked' : ''} class="w-4 h-4 rounded bg-surface-container-lowest accent-tertiary-fixed cursor-pointer" id="drawer-task-checkbox">
          <span class="font-label-sm text-label-sm uppercase text-tertiary-fixed font-mono">${task.project} / ${task.id}</span>
        </div>
        <div class="flex items-center gap-1">
          <button class="p-1 text-outline hover:text-error rounded transition-colors" id="drawer-delete-task-btn" title="Delete Task">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="font-label-sm text-[11px] uppercase text-outline">Task Title</label>
        <input type="text" value="${task.title}" id="drawer-task-title" class="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary font-headline-sm font-semibold outline-none focus:ring-1 focus:ring-tertiary-fixed">
      </div>

      <div class="grid grid-cols-2 gap-space-sm bg-surface-container-lowest p-space-sm rounded-xl font-mono">
        <div>
          <span class="font-label-sm text-[10px] uppercase text-outline">Priority</span>
          <select id="drawer-task-priority" class="w-full bg-surface-container-high text-primary rounded px-2 py-1 text-label-sm font-medium mt-1 outline-none">
            <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
            <option value="med" ${task.priority === 'med' ? 'selected' : ''}>Medium</option>
            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
          </select>
        </div>
        <div>
          <span class="font-label-sm text-[10px] uppercase text-outline">Due Date</span>
          <input type="text" value="${task.due || 'Today'}" id="drawer-task-due" class="w-full bg-surface-container-high text-primary rounded px-2 py-1 text-label-sm font-medium mt-1 outline-none">
        </div>
        <div>
          <span class="font-label-sm text-[10px] uppercase text-outline">Estimate</span>
          <input type="text" value="${task.est || '1h'}" id="drawer-task-est" class="w-full bg-surface-container-high text-primary rounded px-2 py-1 text-label-sm font-medium mt-1 outline-none">
        </div>
        <div>
          <span class="font-label-sm text-[10px] uppercase text-outline">Time Spent</span>
          <span class="block text-tertiary-fixed font-mono font-medium text-label-sm mt-1 px-1">${task.timeSpent || '0m'}</span>
        </div>
      </div>

      <div class="flex flex-col gap-space-xs">
        <div class="flex items-center justify-between">
          <span class="font-label-sm text-label-sm uppercase text-outline">Subtasks (${(task.subtasks || []).filter(s => s.done).length}/${(task.subtasks || []).length})</span>
        </div>
        <div class="flex flex-col gap-1" id="drawer-subtasks-list">
          ${(task.subtasks || []).map(s => `
            <div class="flex items-center justify-between p-1.5 rounded bg-surface-container hover:bg-surface-container-high">
              <div class="flex items-center gap-2">
                <input type="checkbox" ${s.done ? 'checked' : ''} data-subid="${s.id}" class="drawer-subtask-check w-3.5 h-3.5 rounded bg-surface-container-lowest accent-tertiary-fixed cursor-pointer">
                <span class="text-body-sm ${s.done ? 'line-through text-outline' : 'text-primary'}">${s.title}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <form class="flex items-center gap-2 mt-1" id="drawer-add-subtask-form">
          <input type="text" placeholder="Add subtask..." id="drawer-new-subtask-input" class="flex-1 bg-surface-container-lowest px-2 py-1 rounded text-body-sm text-primary outline-none focus:bg-surface-container">
          <button type="submit" class="px-2 py-1 bg-surface-container-high hover:bg-surface-container-highest text-primary text-label-sm rounded font-medium font-mono">Add</button>
        </form>
      </div>

      <div class="flex flex-col gap-1">
        <label class="font-label-sm text-[11px] uppercase text-outline">Deep Context & Notes</label>
        <textarea rows="4" id="drawer-task-notes" placeholder="Add notes, specifications, or code snippets..." class="bg-surface-container-lowest p-3 rounded-lg text-on-surface text-body-sm outline-none focus:ring-1 focus:ring-tertiary-fixed resize-none">${task.notes || ''}</textarea>
      </div>

      <button class="w-full py-2.5 bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm text-headline-sm rounded-lg font-semibold hover:bg-tertiary-fixed-dim transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 mt-space-sm" id="drawer-focus-task-btn">
        <span class="material-symbols-outlined text-[18px]">play_circle</span>
        <span>Initiate Focus Session</span>
      </button>
    `;

    const checkbox = document.getElementById('drawer-task-checkbox');
    if (checkbox) checkbox.addEventListener('change', () => store.toggleTask(task.id));

    const titleInput = document.getElementById('drawer-task-title');
    if (titleInput) titleInput.addEventListener('change', () => store.updateTask(task.id, { title: titleInput.value.trim() }));

    const prioritySelect = document.getElementById('drawer-task-priority');
    if (prioritySelect) prioritySelect.addEventListener('change', () => store.updateTask(task.id, { priority: prioritySelect.value }));

    const dueInput = document.getElementById('drawer-task-due');
    if (dueInput) dueInput.addEventListener('change', () => store.updateTask(task.id, { due: dueInput.value.trim() }));

    const estInput = document.getElementById('drawer-task-est');
    if (estInput) estInput.addEventListener('change', () => store.updateTask(task.id, { est: estInput.value.trim() }));

    const notesText = document.getElementById('drawer-task-notes');
    if (notesText) notesText.addEventListener('change', () => store.updateTask(task.id, { notes: notesText.value }));

    const delBtn = document.getElementById('drawer-delete-task-btn');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        if (confirm(`Delete task "${task.title}"?`)) {
          store.deleteTask(task.id);
          closeTaskDrawer();
        }
      });
    }

    const subForm = document.getElementById('drawer-add-subtask-form');
    if (subForm) {
      subForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('drawer-new-subtask-input');
        if (input && input.value.trim()) {
          store.addSubtask(task.id, input.value.trim());
          input.value = '';
          renderTaskDrawerContent(store.getTasks().find(t => t.id === task.id));
        }
      });
    }

    content.querySelectorAll('.drawer-subtask-check').forEach(ck => {
      ck.addEventListener('change', () => {
        const subId = ck.getAttribute('data-subid');
        store.toggleSubtask(task.id, subId);
      });
    });

    const focusBtn = document.getElementById('drawer-focus-task-btn');
    if (focusBtn) {
      focusBtn.addEventListener('click', () => {
        store.data.focus.targetTaskId = task.id;
        store.data.focus.targetTaskTitle = task.title;
        store.data.focus.targetProject = task.project;
        store.setView('focus');
        store.startTimer();
        closeTaskDrawer();
      });
    }
  }

  // Command Palette
  function initCommandPalette() {
    const input = document.getElementById('cmdk-input');
    const closeBtn = document.getElementById('cmdk-close');
    if (closeBtn) closeBtn.addEventListener('click', closeCommandPalette);
    if (input) input.addEventListener('input', () => filterCommandPalette(input.value.trim()));
    if (commandPaletteModal) {
      commandPaletteModal.addEventListener('click', (e) => {
        if (e.target === commandPaletteModal) closeCommandPalette();
      });
    }
  }

  function openCommandPalette() {
    if (!commandPaletteModal) return;
    commandPaletteModal.classList.remove('hidden');
    setTimeout(() => {
      commandPaletteModal.classList.remove('opacity-0');
      const input = document.getElementById('cmdk-input');
      if (input) {
        input.value = '';
        input.focus();
        filterCommandPalette('');
      }
    }, 10);
  }

  function closeCommandPalette() {
    if (!commandPaletteModal) return;
    commandPaletteModal.classList.add('opacity-0');
    setTimeout(() => commandPaletteModal.classList.add('hidden'), 200);
  }

  function filterCommandPalette(query) {
    const list = document.getElementById('cmdk-results');
    if (!list) return;

    const commands = [
      { type: 'view', title: 'Go to Today Dashboard', icon: 'wb_sunny', action: () => store.setView('today') },
      { type: 'view', title: 'Go to Tasks Workstream', icon: 'check_box', action: () => store.setView('tasks') },
      { type: 'view', title: 'Go to Calendar Schedule', icon: 'calendar_month', action: () => store.setView('calendar') },
      { type: 'view', title: 'Go to Projects Matrix', icon: 'grid_view', action: () => store.setView('projects') },
      { type: 'view', title: 'Go to Focus Workspace & Timer', icon: 'timer', action: () => store.setView('focus') },
      { type: 'view', title: 'Go to Routines & Habit Tracker', icon: 'repeat', action: () => store.setView('routines') },
      { type: 'view', title: 'Go to Finance & Ledger', icon: 'credit_card', action: () => store.setView('finance') },
      { type: 'view', title: 'Go to Review & Reflection Journal', icon: 'insights', action: () => store.setView('review') },
      { type: 'view', title: 'Go to Mirror AI Intelligence', icon: 'smart_toy', action: () => store.setView('mirror') },
      { type: 'view', title: 'Go to System Settings & Backups', icon: 'settings', action: () => store.setView('settings') },
      { type: 'action', title: 'Create New Detailed Task', icon: 'add_task', action: () => openQuickTaskModal() },
      { type: 'action', title: 'Log Daily Expense', icon: 'add_card', action: () => openQuickExpenseModal() },
      { type: 'action', title: store.timer.isRunning ? 'Pause Focus Timer' : 'Start Focus Timer', icon: 'play_circle', action: () => { if (store.timer.isRunning) store.pauseTimer(); else store.startTimer(); } },
      { type: 'action', title: 'Export JSON Backup File', icon: 'download', action: () => store.exportJson() },
      { type: 'action', title: 'Toggle Binaural Alpha Waves (10Hz)', icon: 'headphones', action: () => store.toggleBinauralBeats(!store.data.focus.ambientPlaying) }
    ];

    store.getTasks().forEach(t => {
      commands.push({
        type: 'task',
        title: `Task: ${t.title} [${t.project}]`,
        icon: t.completed ? 'task_alt' : 'radio_button_unchecked',
        action: () => {
          store.setView('tasks');
          openTaskDrawerByName(t.title);
        }
      });
    });

    const filtered = commands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));
    list.innerHTML = filtered.map((c, i) => `
      <div class="cmdk-item flex items-center justify-between px-space-md py-2.5 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface ${i === 0 ? 'bg-surface-container' : ''}" data-idx="${i}">
        <div class="flex items-center gap-space-sm">
          <span class="material-symbols-outlined text-[18px] text-tertiary-fixed">${c.icon}</span>
          <span class="font-body-default text-body-default text-primary font-sans">${c.title}</span>
        </div>
        <span class="font-label-sm text-label-sm uppercase text-outline font-mono">${c.type}</span>
      </div>
    `).join('') || '<div class="p-space-md text-center text-outline font-label-default font-mono">No matching commands found.</div>';

    list.querySelectorAll('.cmdk-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-idx'));
        if (filtered[idx]) {
          closeCommandPalette();
          filtered[idx].action();
        }
      });
    });
  }

  // Global helper for opening drawer from inline onclick
  window.openDrawer = function (taskTitle) {
    openTaskDrawerByName(taskTitle);
  };

})();
