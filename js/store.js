/**
 * PRODUCTIV LIFE OS - STATE STORE & REACTIVE ENGINE
 * Manages all JSON state, LocalStorage persistence, and Web Audio synthesis.
 */

const STORAGE_KEY = 'PRODUCTIV_LIFE_OS_V2_DATA';

class Store {
  constructor() {
    this.subscribers = [];
    this.data = this.loadData();
    this.activeView = 'today';
    this.selectedTaskId = null;
    this.selectedProjectId = null;
    this.taskFilter = 'all'; // all, today, upcoming, overdue, completed
    this.taskViewMode = 'list'; // list, kanban
    this.calendarViewMode = 'week'; // day, week, month
    this.routineFilter = 'today'; // today, habits, schedule
    
    // Timer state in memory
    this.timer = {
      isRunning: false,
      mode: 'pomodoro', // pomodoro, stopwatch, ambient
      secondsRemaining: 25 * 60,
      initialSeconds: 25 * 60,
      intervalId: null,
      ambientAudioNode: null,
      audioCtx: null
    };

    // Auto-save on window unload
    window.addEventListener('beforeunload', () => {
      this.saveData();
    });
  }

  loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse localStorage data:', e);
    }
    return window.INITIAL_PRODUCTIV_DATA || this.getDefaultData();
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  exportJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `productiv_os_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.tasks && parsed.user) {
        this.data = parsed;
        this.saveData();
        this.notify('DATA_IMPORTED');
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(window.INITIAL_PRODUCTIV_DATA || this.getDefaultData()));
    this.saveData();
    this.notify('DATA_RESET');
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(event, payload) {
    this.saveData();
    this.subscribers.forEach(cb => cb(event, payload, this.data));
  }

  // --- NAVIGATION ---
  setView(viewName) {
    this.activeView = viewName;
    this.notify('VIEW_CHANGED', viewName);
  }

  // --- AUDIO SYNTHESIZER ---
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playBeep(freq = 587.33, type = 'sine', duration = 0.12) {
    try {
      if (!this.data.settings.soundEffects) return;
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  }

  playSuccessChime() {
    try {
      if (!this.data.settings.soundEffects) return;
      this.initAudio();
      if (!this.audioCtx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playBeep(freq, 'triangle', 0.25);
        }, idx * 110);
      });
    } catch (e) {}
  }

  toggleBinauralBeats(enable) {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      if (!enable) {
        if (this.binauralNodes) {
          this.binauralNodes.oscLeft.stop();
          this.binauralNodes.oscRight.stop();
          this.binauralNodes = null;
        }
        this.data.focus.ambientPlaying = false;
        this.notify('FOCUS_AMBIENT_TOGGLED');
        return;
      }

      if (this.binauralNodes) return;

      const merger = this.audioCtx.createChannelMerger(2);
      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime((this.data.focus.volume || 50) / 400, this.audioCtx.currentTime);

      const oscLeft = this.audioCtx.createOscillator();
      const oscRight = this.audioCtx.createOscillator();

      // 210Hz Left, 220Hz Right => 10Hz Alpha differential
      oscLeft.type = 'sine';
      oscLeft.frequency.setValueAtTime(210, this.audioCtx.currentTime);

      oscRight.type = 'sine';
      oscRight.frequency.setValueAtTime(220, this.audioCtx.currentTime);

      oscLeft.connect(merger, 0, 0);
      oscRight.connect(merger, 0, 1);
      merger.connect(masterGain);
      masterGain.connect(this.audioCtx.destination);

      oscLeft.start();
      oscRight.start();

      this.binauralNodes = { oscLeft, oscRight, masterGain };
      this.data.focus.ambientPlaying = true;
      this.notify('FOCUS_AMBIENT_TOGGLED');
    } catch (e) {
      console.warn('Audio synthesis issue:', e);
    }
  }

  // --- TASK ACTIONS ---
  getTasks() {
    return this.data.tasks || [];
  }

  getFilteredTasks() {
    const tasks = this.getTasks();
    if (this.taskFilter === 'today') return tasks.filter(t => t.status === 'today' || (t.due && t.due.toLowerCase().includes('today')));
    if (this.taskFilter === 'upcoming') return tasks.filter(t => t.status === 'upcoming' || !t.completed);
    if (this.taskFilter === 'overdue') return tasks.filter(t => t.status === 'overdue');
    if (this.taskFilter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
  }

  toggleTask(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      if (task.completed) {
        task.status = 'completed';
        this.playSuccessChime();
      } else {
        task.status = 'today';
        this.playBeep(440, 'sine', 0.1);
      }
      this.notify('TASK_UPDATED', task);
    }
  }

  addTask(taskData) {
    const newTask = {
      id: 't-' + Date.now(),
      title: taskData.title || 'Untitled Task',
      project: taskData.project || 'General',
      priority: taskData.priority || 'med',
      est: taskData.est || '1h est',
      due: taskData.due || 'Today',
      status: taskData.status || 'today',
      completed: false,
      timeSpent: '0m',
      tags: taskData.tags || ['#Inbox'],
      notes: taskData.notes || '',
      subtasks: taskData.subtasks || []
    };
    this.data.tasks.unshift(newTask);
    this.playBeep(659.25, 'sine', 0.15);
    this.notify('TASK_ADDED', newTask);
    return newTask;
  }

  updateTask(taskId, updates) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
      this.notify('TASK_UPDATED', task);
    }
  }

  deleteTask(taskId) {
    this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
    if (this.selectedTaskId === taskId) {
      this.selectedTaskId = null;
    }
    this.playBeep(330, 'sawtooth', 0.15);
    this.notify('TASK_DELETED', taskId);
  }

  addSubtask(taskId, title) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task && title.trim()) {
      if (!task.subtasks) task.subtasks = [];
      task.subtasks.push({
        id: 'st-' + Date.now(),
        title: title.trim(),
        done: false
      });
      this.notify('TASK_UPDATED', task);
    }
  }

  toggleSubtask(taskId, subtaskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const sub = task.subtasks.find(s => s.id === subtaskId);
      if (sub) {
        sub.done = !sub.done;
        this.playBeep(sub.done ? 784 : 440, 'sine', 0.08);
        this.notify('TASK_UPDATED', task);
      }
    }
  }

  // --- ROUTINES ACTIONS ---
  toggleRoutine(routineId) {
    const r = this.data.routines.find(item => item.id === routineId);
    if (r) {
      r.doneToday = !r.doneToday;
      if (r.doneToday) {
        r.streak = (r.streak || 0) + 1;
        this.playSuccessChime();
      } else {
        r.streak = Math.max(0, (r.streak || 1) - 1);
        this.playBeep(440, 'sine', 0.1);
      }
      this.notify('ROUTINE_UPDATED', r);
    }
  }

  addRoutine(routineData) {
    const newRoutine = {
      id: 'r-' + Date.now(),
      title: routineData.title || 'New Protocol',
      block: routineData.block || 'morning',
      time: routineData.time || '07:00',
      streak: 1,
      doneToday: false,
      tag: routineData.tag || 'Discipline',
      desc: routineData.desc || 'Custom user routine'
    };
    this.data.routines.push(newRoutine);
    this.notify('ROUTINE_ADDED', newRoutine);
    return newRoutine;
  }

  // --- FINANCE ACTIONS ---
  addTransaction(txData) {
    const newTx = {
      id: 'f-' + Date.now(),
      title: txData.title || 'Expense',
      category: txData.category || 'General',
      amount: Number(txData.amount) || 0,
      type: txData.type || 'expense',
      date: txData.date || new Date().toISOString().slice(0,10),
      time: new Date().toTimeString().slice(0,5),
      icon: txData.icon || (txData.type === 'income' ? 'payments' : 'shopping_bag'),
      notes: txData.notes || ''
    };

    if (newTx.type === 'expense') {
      this.data.finance.liquidBalance -= newTx.amount;
    } else {
      this.data.finance.liquidBalance += newTx.amount;
    }

    this.data.finance.transactions.unshift(newTx);
    this.playBeep(newTx.type === 'income' ? 880 : 520, 'sine', 0.15);
    this.notify('TRANSACTION_ADDED', newTx);
    return newTx;
  }

  getTodayExpenses() {
    const todayStr = new Date().toISOString().slice(0,10);
    return this.data.finance.transactions
      .filter(t => (t.date === todayStr || t.date === '2026-09-25') && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  }

  // --- PROJECT ACTIONS ---
  addProject(projData) {
    const newProj = {
      id: 'proj-' + Date.now(),
      name: projData.name || 'New Project',
      tagline: projData.tagline || 'Project Scope',
      description: projData.description || '',
      category: projData.category || 'General',
      status: 'active',
      progress: 0,
      color: projData.color || 'emerald',
      lead: this.data.user.name,
      milestones: projData.milestones || []
    };
    this.data.projects.push(newProj);
    this.notify('PROJECT_ADDED', newProj);
    return newProj;
  }

  toggleMilestone(projId, milestoneId) {
    const proj = this.data.projects.find(p => p.id === projId);
    if (proj && proj.milestones) {
      const ms = proj.milestones.find(m => m.id === milestoneId);
      if (ms) {
        ms.done = !ms.done;
        // recalculate progress
        const doneCount = proj.milestones.filter(m => m.done).length;
        proj.progress = Math.round((doneCount / proj.milestones.length) * 100);
        this.notify('PROJECT_UPDATED', proj);
      }
    }
  }

  // --- CALENDAR ACTIONS ---
  addCalendarEvent(eventData) {
    const newEv = {
      id: 'ev-' + Date.now(),
      title: eventData.title || 'New Event',
      category: eventData.category || 'Schedule',
      location: eventData.location || 'Local',
      startTime: eventData.startTime || '10:00',
      endTime: eventData.endTime || '11:00',
      date: eventData.date || '2026-09-25',
      done: false,
      color: eventData.color || 'emerald'
    };
    this.data.calendar.push(newEv);
    this.notify('CALENDAR_UPDATED', newEv);
    return newEv;
  }

  toggleCalendarEvent(eventId) {
    const ev = this.data.calendar.find(e => e.id === eventId);
    if (ev) {
      ev.done = !ev.done;
      this.playBeep(ev.done ? 784 : 440, 'sine', 0.08);
      this.notify('CALENDAR_UPDATED', ev);
    }
  }

  // --- REVIEW ACTIONS ---
  addReviewEntry(entryData) {
    const newReview = {
      id: 'rev-' + Date.now(),
      date: entryData.date || new Date().toISOString().slice(0,10),
      period: entryData.period || 'daily',
      win: entryData.win || '',
      friction: entryData.friction || '',
      decision: entryData.decision || '',
      productivityRating: Number(entryData.productivityRating) || 8,
      energyLevel: entryData.energyLevel || 'High',
      cognitiveScore: Number(entryData.cognitiveScore) || 85
    };
    if (!this.data.review.history) this.data.review.history = [];
    this.data.review.history.unshift(newReview);
    this.playSuccessChime();
    this.notify('REVIEW_SAVED', newReview);
    return newReview;
  }

  // --- MIRROR AI ACTIONS ---
  sendAiMessage(userText) {
    if (!userText.trim()) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      time: new Date().toTimeString().slice(0,5),
      text: userText.trim()
    };

    if (!this.data.mirrorAi.chatHistory) this.data.mirrorAi.chatHistory = [];
    this.data.mirrorAi.chatHistory.push(userMsg);
    this.notify('AI_MESSAGE_SENT', userMsg);

    // Context-aware AI response calculation
    setTimeout(() => {
      const aiReply = this.generateAiResponse(userText);
      const aiMsg = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'ai',
        time: new Date().toTimeString().slice(0,5),
        text: aiReply
      };
      this.data.mirrorAi.chatHistory.push(aiMsg);
      this.playBeep(659.25, 'triangle', 0.2);
      this.notify('AI_REPLY_RECEIVED', aiMsg);
    }, 450);
  }

  generateAiResponse(prompt) {
    const p = prompt.toLowerCase();
    const tasks = this.getTasks();
    const pendingTasks = tasks.filter(t => !t.completed);
    const routines = this.data.routines || [];
    const doneRoutines = routines.filter(r => r.doneToday);
    const todayExpenses = this.getTodayExpenses();
    const balance = this.data.finance.liquidBalance;

    if (p.includes('task') || p.includes('tugas') || p.includes('kerjaan')) {
      return `Telemetry check: You have ${pendingTasks.length} pending tasks (${tasks.filter(t => t.completed).length} completed). Highest priority: "${pendingTasks[0]?.title || 'None'}". I suggest allocating your next 25-minute Pomodoro block to tackle this.`;
    }

    if (p.includes('finance') || p.includes('uang') || p.includes('duit') || p.includes('budget') || p.includes('ledger')) {
      return `Financial telemetry: Today's spend is Rp ${todayExpenses.toLocaleString('id-ID')} (${Math.round((todayExpenses/this.data.finance.dailyTarget)*100)}% of Rp ${this.data.finance.dailyTarget.toLocaleString('id-ID')} target). Liquid capital reserve is Rp ${balance.toLocaleString('id-ID')}. Status: Safe & Disciplined.`;
    }

    if (p.includes('routine') || p.includes('kebiasaan') || p.includes('habit')) {
      return `Habit engine status: ${doneRoutines.length}/${routines.length} routines logged today. Longest active streak is "${routines.sort((a,b)=>b.streak-a.streak)[0]?.title}" at ${routines.sort((a,b)=>b.streak-a.streak)[0]?.streak} days unbroken.`;
    }

    if (p.includes('focus') || p.includes('timer') || p.includes('pomodoro')) {
      return `Focus metrics: You completed ${this.data.focus.sessionsCompletedToday} focus sessions today (total ${Math.round(this.data.focus.totalSecondsToday/60)} minutes). Cognitive load is 78.4/100. Ready to initiate next flow block.`;
    }

    if (p.includes('halo') || p.includes('hi') || p.includes('hello') || p.includes('assalamu')) {
      return `Greetings Fadil. Terminal is operating at nominal parameters. Systems synced: 8 Modules live, LocalStorage indexed, side navbar removed as requested. What protocol shall we execute?`;
    }

    return `Telemetry processed for: "${prompt}". System recommends maintaining deep focus on your top active sprint and reviewing evening habits at 21:00.`;
  }

  // --- TIMER CONTROLLER ---
  startTimer() {
    if (this.timer.isRunning) return;
    this.timer.isRunning = true;
    this.playBeep(523.25, 'sine', 0.15);

    this.timer.intervalId = setInterval(() => {
      if (this.timer.secondsRemaining > 0) {
        this.timer.secondsRemaining--;
        this.notify('TIMER_TICK', this.timer.secondsRemaining);
      } else {
        this.completeTimerSession();
      }
    }, 1000);

    this.notify('TIMER_STARTED');
  }

  pauseTimer() {
    if (!this.timer.isRunning) return;
    this.timer.isRunning = false;
    clearInterval(this.timer.intervalId);
    this.playBeep(440, 'sawtooth', 0.1);
    this.notify('TIMER_PAUSED');
  }

  resetTimer() {
    this.pauseTimer();
    this.timer.secondsRemaining = this.timer.initialSeconds;
    this.notify('TIMER_RESET', this.timer.secondsRemaining);
  }

  addTimerMinutes(mins = 5) {
    this.timer.secondsRemaining += mins * 60;
    this.timer.initialSeconds += mins * 60;
    this.playBeep(659.25, 'sine', 0.1);
    this.notify('TIMER_TICK', this.timer.secondsRemaining);
  }

  setTimerPreset(mins = 25) {
    this.pauseTimer();
    this.timer.initialSeconds = mins * 60;
    this.timer.secondsRemaining = mins * 60;
    this.data.focus.presetMinutes = mins;
    this.notify('TIMER_PRESET_CHANGED', mins);
  }

  completeTimerSession() {
    this.pauseTimer();
    this.playSuccessChime();
    this.data.focus.sessionsCompletedToday = (this.data.focus.sessionsCompletedToday || 0) + 1;
    this.data.focus.totalSecondsToday = (this.data.focus.totalSecondsToday || 0) + this.timer.initialSeconds;
    
    // Add to history
    this.data.focus.history.unshift({
      id: 'foc-' + Date.now(),
      task: this.data.focus.targetTaskTitle || 'Deep Work Session',
      duration: Math.round(this.timer.initialSeconds / 60),
      time: new Date().toTimeString().slice(0,5),
      date: new Date().toISOString().slice(0,10)
    });

    this.timer.secondsRemaining = this.timer.initialSeconds;
    this.notify('TIMER_COMPLETED');
  }

  getDefaultData() {
    return {
      user: { name: "Fadil", role: "Executive Terminal", cognitiveCapacity: 88 },
      tasks: [],
      projects: [],
      calendar: [],
      focus: { presetMinutes: 25, sessionsCompletedToday: 0, totalSecondsToday: 0 },
      routines: [],
      finance: { liquidBalance: 2000000, dailyTarget: 100000, transactions: [] },
      review: { history: [] },
      mirrorAi: { chatHistory: [] },
      settings: { theme: 'obsidian-dark', soundEffects: true }
    };
  }
}

// Global instance
window.ProductivStore = new Store();
