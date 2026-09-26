import { create } from 'zustand';
import { LifeOSData, Task, Project, ProjectImage, CalendarEvent, Routine, Transaction, ReviewItem, ViewKey, AiMessage, SettingsState, FinanceState, Budget, Account, PurchaseTarget } from '../types';
import { BASE_TODAY_ISO } from '../utils/date';

import userJson from '../data/user.json';
import tasksJson from '../data/tasks.json';
import projectsJson from '../data/projects.json';
import calendarJson from '../data/calendar.json';
import focusJson from '../data/focus.json';
import routinesJson from '../data/routines.json';
import financeJson from '../data/finance.json';
import reviewJson from '../data/review.json';
import mirrorAiJson from '../data/mirrorAi.json';
import settingsJson from '../data/settings.json';

const STORAGE_KEY = 'PRODUCTIV_LIFE_OS_V2_DATA';

const INITIAL_DATA: LifeOSData = {
  user: userJson as LifeOSData['user'],
  tasks: tasksJson as Task[],
  projects: projectsJson as Project[],
  calendar: calendarJson as CalendarEvent[],
  focus: focusJson as LifeOSData['focus'],
  routines: routinesJson as Routine[],
  finance: financeJson as FinanceState,
  review: reviewJson as LifeOSData['review'],
  mirrorAi: mirrorAiJson as LifeOSData['mirrorAi'],
  settings: settingsJson as SettingsState,
};

function loadStoredData(): LifeOSData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.tasks && parsed.user) {
        return {
          ...INITIAL_DATA,
          ...parsed,
          tasks: (parsed.tasks || []).map((t: Task) => ({
            date: BASE_TODAY_ISO,
            ...t,
          })),
          projects: (parsed.projects || []).map((p: Project) => ({
            notes: '',
            images: [],
            ...p,
          })),
          routines: (parsed.routines || []).map((r: Routine) => ({
            history: {},
            ...r,
          })),
          finance: {
            ...INITIAL_DATA.finance,
            ...(parsed.finance || {}),
            budgets: parsed.finance?.budgets || INITIAL_DATA.finance.budgets || [],
            accounts: parsed.finance?.accounts || INITIAL_DATA.finance.accounts || [],
            targets: parsed.finance?.targets || INITIAL_DATA.finance.targets || [],
          },
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse localStorage data:', e);
  }
  return INITIAL_DATA;
}

function saveStoredData(data: LifeOSData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

export function downloadJsonFile(filename: string, data: unknown) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

interface LifeOSStoreState {
  data: LifeOSData;
  activeView: ViewKey;
  isSidebarOpen: boolean;
  isCmdkOpen: boolean;
  isNotifOpen: boolean;
  isTaskModalOpen: boolean;
  isExpenseModalOpen: boolean;
  isEventModalOpen: boolean;
  isProjectModalOpen: boolean;
  isRoutineModalOpen: boolean;
  isDrawerOpen: boolean;
  selectedTaskId: string | null;
  selectedProjectId: string;
  dayOffset: number;
  weekOffset: number;
  calendarViewMode: 'day' | 'week' | 'month';
  reviewPeriod: 'daily' | 'weekly' | 'monthly';
  taskFilter: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
  taskViewMode: 'list' | 'kanban';
  toast: { message: string; type: 'info' | 'success' } | null;

  timerState: {
    isRunning: boolean;
    secondsRemaining: number;
    initialSeconds: number;
    mode: 'timer' | 'stopwatch';
    stopwatchSeconds: number;
  };

  setActiveView: (view: ViewKey) => void;
  setSelectedProjectId: (id: string) => void;
  shiftDay: (delta: number) => void;
  resetDay: () => void;
  shiftWeek: (delta: number) => void;
  resetWeek: () => void;
  setCalendarViewMode: (m: 'day' | 'week' | 'month') => void;
  setReviewPeriod: (p: 'daily' | 'weekly' | 'monthly') => void;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  openCmdk: () => void;
  closeCmdk: () => void;
  setNotifOpen: (v: boolean) => void;
  openTaskModal: () => void;
  closeTaskModal: () => void;
  openExpenseModal: () => void;
  closeExpenseModal: () => void;
  openEventModal: () => void;
  closeEventModal: () => void;
  openProjectModal: () => void;
  closeProjectModal: () => void;
  openRoutineModal: () => void;
  closeRoutineModal: () => void;
  openDrawer: (taskId?: string) => void;
  closeDrawer: () => void;
  setTaskFilter: (filter: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed') => void;
  setTaskViewMode: (mode: 'list' | 'kanban') => void;
  showToast: (message: string, type?: 'info' | 'success') => void;

  addTask: (taskData: Partial<Task>) => Task | null;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleTask: (taskId: string, dateISO?: string) => void;
  /** Pindah status task (untuk kanban drag & drop) */
  moveTask: (taskId: string, status: Task['status'], dateISO?: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subId: string) => void;
  deleteSubtask: (taskId: string, subId: string) => void;

  toggleRoutine: (routineId: string, dateISO?: string) => void;
  /** Toggle centang routine untuk tanggal ISO tertentu (matrix 7 hari) */
  toggleRoutineForDate: (routineId: string, dateISO: string) => void;
  addRoutine: (routineData: Partial<Routine>) => Routine | null;
  updateRoutine: (routineId: string, updates: Partial<Routine>) => void;
  deleteRoutine: (routineId: string) => void;

  addTransaction: (txData: Partial<Transaction>) => Transaction | null;
  updateTransaction: (txId: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (txId: string) => void;
  getTodayExpenses: () => number;
  getExpensesByDate: (iso: string) => number;
  getMonthIncome: () => number;
  getMonthExpense: () => number;

  addBudget: (b: Partial<Budget>) => Budget | null;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetSpent: (category: string) => number;
  setMonthlyBudget: (amount: number) => void;

  addAccount: (a: Partial<Account>) => Account | null;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferAccount: (fromId: string, toId: string, amount: number) => boolean;

  addProject: (projData: Partial<Project>) => Project | null;
  updateProject: (projId: string, updates: Partial<Project>) => void;
  deleteProject: (projId: string) => void;
  toggleMilestone: (projId: string, milestoneId: string) => void;
  updateProjectNotes: (projId: string, notes: string) => void;
  addProjectImage: (projId: string, img: ProjectImage) => void;
  deleteProjectImage: (projId: string, imageId: string) => void;

  addTarget: (t: Partial<PurchaseTarget>) => PurchaseTarget | null;
  updateTarget: (id: string, updates: Partial<PurchaseTarget>) => void;
  deleteTarget: (id: string) => void;
  allocateToTarget: (id: string, amount: number) => void;
  toggleTargetBought: (id: string) => void;

  addCalendarEvent: (eventData: Partial<CalendarEvent>) => CalendarEvent | null;
  updateCalendarEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (eventId: string) => void;
  toggleCalendarEvent: (eventId: string) => void;
  editingEventId: string | null;
  openEventModalForEdit: (eventId: string) => void;

  addReviewEntry: (entryData: Partial<ReviewItem>) => ReviewItem | null;
  deleteReviewEntry: (id: string) => void;

  sendAiMessage: (text: string) => void;
  generateAiResponse: (prompt: string) => string;

  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  addTimerMinutes: (mins?: number) => void;
  setTimerPreset: (mins?: number) => void;
  setTimerMode: (mode: 'timer' | 'stopwatch') => void;
  completeTimerSession: () => void;
  tickTimer: () => void;

  updateSettings: (updates: Partial<SettingsState>) => void;
  updateUser: (updates: Partial<LifeOSData['user']>) => void;
  setAmbientPlaying: (on: boolean, volume?: number) => void;
  setDailyTarget: (amount: number) => void;
  setFocusTarget: (taskId: string, title: string, project: string) => void;
  setFocusVolume: (volume: number) => void;
  exportJson: () => void;
  exportSingleJson: (key: keyof LifeOSData) => void;
  importJson: (jsonStr: string) => boolean;
  resetToDefault: () => void;
}

export const useLifeOSStore = create<LifeOSStoreState>((set, get) => ({
  data: loadStoredData(),
  activeView: (window.location.hash.replace('#', '') as ViewKey) || 'today',
  isSidebarOpen: false,
  isCmdkOpen: false,
  isNotifOpen: false,
  isTaskModalOpen: false,
  isExpenseModalOpen: false,
  isEventModalOpen: false,
  isProjectModalOpen: false,
  isRoutineModalOpen: false,
  isDrawerOpen: false,
  selectedTaskId: null,
  selectedProjectId: 'proj-1',
  dayOffset: 0,
  weekOffset: 0,
  calendarViewMode: 'week',
  reviewPeriod: 'daily',
  taskFilter: 'all',
  taskViewMode: 'list',
  toast: null,

  timerState: {
    isRunning: false,
    secondsRemaining: 25 * 60,
    initialSeconds: 25 * 60,
    mode: 'timer',
    stopwatchSeconds: 0,
  },

  setActiveView: (view) => {
    window.location.hash = view;
    set({ activeView: view, isSidebarOpen: false, isNotifOpen: false });
  },

  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  shiftDay: (delta) => set((state) => ({ dayOffset: state.dayOffset + delta })),
  resetDay: () => set({ dayOffset: 0 }),
  shiftWeek: (delta) => set((state) => ({ weekOffset: state.weekOffset + delta })),
  resetWeek: () => set({ weekOffset: 0 }),
  setCalendarViewMode: (m) => set({ calendarViewMode: m }),
  setReviewPeriod: (p) => set({ reviewPeriod: p }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),

  openCmdk: () => set({ isCmdkOpen: true }),
  closeCmdk: () => set({ isCmdkOpen: false }),
  setNotifOpen: (v) => set({ isNotifOpen: v }),

  openTaskModal: () => set({ isTaskModalOpen: true }),
  closeTaskModal: () => set({ isTaskModalOpen: false }),

  openExpenseModal: () => set({ isExpenseModalOpen: true }),
  closeExpenseModal: () => set({ isExpenseModalOpen: false }),

  openEventModal: () => set({ isEventModalOpen: true, editingEventId: null }),
  closeEventModal: () => set({ isEventModalOpen: false, editingEventId: null }),
  editingEventId: null,
  openEventModalForEdit: (eventId) => set({ isEventModalOpen: true, editingEventId: eventId }),

  openProjectModal: () => set({ isProjectModalOpen: true }),
  closeProjectModal: () => set({ isProjectModalOpen: false }),

  openRoutineModal: () => set({ isRoutineModalOpen: true }),
  closeRoutineModal: () => set({ isRoutineModalOpen: false }),

  openDrawer: (taskId) => {
    if (taskId) {
      set({ selectedTaskId: taskId, isDrawerOpen: true });
    } else {
      const firstTask = get().data.tasks[0];
      set({ selectedTaskId: firstTask ? firstTask.id : null, isDrawerOpen: true });
    }
  },
  closeDrawer: () => set({ isDrawerOpen: false, selectedTaskId: null }),

  setTaskFilter: (filter) => set({ taskFilter: filter }),
  setTaskViewMode: (mode) => set({ taskViewMode: mode }),

  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set((state) => (state.toast?.message === message ? { toast: null } : {}));
    }, 3000);
  },

  addTask: (taskData) => {
    if (!taskData.title || !taskData.title.trim()) {
      get().showToast('Judul task wajib diisi', 'info');
      return null;
    }
    const newTask: Task = {
      id: 't-' + Date.now(),
      title: taskData.title.trim(),
      project: taskData.project || 'General',
      priority: taskData.priority || 'med',
      est: taskData.est || '1h est',
      due: taskData.due || 'Today',
      date: taskData.date || BASE_TODAY_ISO,
      status: taskData.status || 'today',
      completed: false,
      timeSpent: '0m',
      tags: taskData.tags || ['#Inbox'],
      notes: taskData.notes || '',
      subtasks: taskData.subtasks || [],
    };
    const updated = { ...get().data, tasks: [newTask, ...get().data.tasks] };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast(`Created task: "${newTask.title}"`, 'success');
    return newTask;
  },

  updateTask: (taskId, updates) => {
    const tasks = get().data.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
    const updated = { ...get().data, tasks };
    saveStoredData(updated);
    set({ data: updated });
  },

  deleteTask: (taskId) => {
    const tasks = get().data.tasks.filter((t) => t.id !== taskId);
    const updated = { ...get().data, tasks };
    saveStoredData(updated);
    set({ data: updated, isDrawerOpen: false, selectedTaskId: null });
    get().showToast('Task deleted', 'info');
  },

  toggleTask: (taskId, dateISO) => {
    const stamp = dateISO || BASE_TODAY_ISO;
    const tasks = get().data.tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          status: nextCompleted ? ('completed' as const) : ('today' as const),
          completedAt: nextCompleted ? stamp : undefined,
        };
      }
      return t;
    });
    const updated = { ...get().data, tasks };
    saveStoredData(updated);
    set({ data: updated });
  },

  moveTask: (taskId, status, dateISO) => {
    const tasks = get().data.tasks.map((t) => {
      if (t.id !== taskId) return t;
      const completed = status === 'completed';
      return {
        ...t,
        status,
        completed,
        completedAt: completed ? dateISO || BASE_TODAY_ISO : undefined,
        ...(dateISO ? { date: dateISO } : {}),
      };
    });
    const updated = { ...get().data, tasks };
    saveStoredData(updated);
    set({ data: updated });
  },

  addSubtask: (taskId, title) => {
    if (!title.trim()) return;
    const tasks = get().data.tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, subtasks: [...(t.subtasks || []), { id: 'st-' + Date.now(), title: title.trim(), done: false }] };
      }
      return t;
    });
    const updated = { ...get().data, tasks };
    saveStoredData(updated);
    set({ data: updated });
  },

  toggleSubtask: (taskId, subId) => {
    const tasks = get().data.tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, subtasks: (t.subtasks || []).map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) };
      }
      return t;
    });
    const updated = { ...get().data, tasks };
    saveStoredData(updated);
    set({ data: updated });
  },

  deleteSubtask: (taskId, subId) => {
    const tasks = get().data.tasks.map((t) => {
      if (t.id === taskId) return { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subId) };
      return t;
    });
    const updated = { ...get().data, tasks };
    saveStoredData(updated);
    set({ data: updated });
  },

  toggleRoutine: (routineId, dateISO) => {
    const stamp = dateISO || BASE_TODAY_ISO;
    const routines = get().data.routines.map((r) => {
      if (r.id === routineId) {
        const nextDone = !r.doneToday;
        return {
          ...r,
          doneToday: nextDone,
          streak: nextDone ? r.streak + 1 : Math.max(0, r.streak - 1),
          history: { ...(r.history || {}), [stamp]: nextDone },
        };
      }
      return r;
    });
    const updated = { ...get().data, routines };
    saveStoredData(updated);
    set({ data: updated });
  },

  toggleRoutineForDate: (routineId, dateISO) => {
    const routines = get().data.routines.map((r) => {
      if (r.id !== routineId) return r;
      const history = { ...(r.history || {}) };
      const next = !history[dateISO];
      if (next) history[dateISO] = true;
      else delete history[dateISO];
      const patch: Partial<Routine> =
        dateISO === BASE_TODAY_ISO
          ? { doneToday: next, streak: next ? r.streak + 1 : Math.max(0, r.streak - 1) }
          : {};
      return { ...r, ...patch, history };
    });
    const updated = { ...get().data, routines };
    saveStoredData(updated);
    set({ data: updated });
  },

  addRoutine: (routineData) => {
    if (!routineData.title || !routineData.title.trim()) {
      get().showToast('Nama routine wajib diisi', 'info');
      return null;
    }
    const newRoutine: Routine = {
      id: 'r-' + Date.now(),
      title: routineData.title.trim(),
      block: routineData.block || 'morning',
      time: routineData.time || '07:00',
      streak: 0,
      doneToday: false,
      tag: routineData.tag || 'Discipline',
      desc: routineData.desc || 'Custom user routine',
      history: {},
    };
    const updated = { ...get().data, routines: [...get().data.routines, newRoutine] };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast(`Added routine: "${newRoutine.title}"`, 'success');
    return newRoutine;
  },

  deleteRoutine: (routineId) => {
    const updated = { ...get().data, routines: get().data.routines.filter((r) => r.id !== routineId) };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Routine deleted', 'info');
  },

  updateRoutine: (routineId, updates) => {
    const routines = get().data.routines.map((r) => (r.id === routineId ? { ...r, ...updates } : r));
    const updated = { ...get().data, routines };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Routine updated', 'success');
  },

  addTransaction: (txData) => {
    const amount = Number(txData.amount) || 0;
    if (amount <= 0) {
      get().showToast('Nominal harus lebih dari 0', 'info');
      return null;
    }
    if (!txData.title || !txData.title.trim()) {
      get().showToast('Deskripsi wajib diisi', 'info');
      return null;
    }
    const type = txData.type || 'expense';
    const newTx: Transaction = {
      id: 'f-' + Date.now(),
      title: txData.title.trim(),
      category: txData.category || 'General',
      amount,
      type,
      date: txData.date || new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      icon: txData.icon || (type === 'income' ? 'payments' : 'shopping_bag'),
      notes: txData.notes || '',
    };
    let liquidBalance = get().data.finance.liquidBalance;
    liquidBalance = type === 'expense' ? liquidBalance - amount : liquidBalance + amount;
    const finance = { ...get().data.finance, liquidBalance, transactions: [newTx, ...get().data.finance.transactions] };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast(`Logged Rp ${amount.toLocaleString('id-ID')} (${newTx.title})`, 'success');
    return newTx;
  },

  deleteTransaction: (txId) => {
    const tx = get().data.finance.transactions.find((t) => t.id === txId);
    if (!tx) return;
    let liquidBalance = get().data.finance.liquidBalance;
    liquidBalance = tx.type === 'expense' ? liquidBalance + tx.amount : liquidBalance - tx.amount;
    const finance = { ...get().data.finance, liquidBalance, transactions: get().data.finance.transactions.filter((t) => t.id !== txId) };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Transaction deleted & balance restored', 'info');
  },

  updateTransaction: (txId, updates) => {
    const prev = get().data.finance.transactions.find((t) => t.id === txId);
    if (!prev) return;
    const next = { ...prev, ...updates };
    // sesuaikan saldo terhadap selisih
    let liquidBalance = get().data.finance.liquidBalance;
    const prevSigned = prev.type === 'expense' ? -prev.amount : prev.amount;
    const nextSigned = (next.type || prev.type) === 'expense' ? -(Number(next.amount) || 0) : (Number(next.amount) || 0);
    liquidBalance = liquidBalance - prevSigned + nextSigned;
    next.amount = Number(next.amount) || 0;
    const finance = {
      ...get().data.finance,
      liquidBalance,
      transactions: get().data.finance.transactions.map((t) => (t.id === txId ? next : t)),
    };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Transaction updated', 'success');
  },

  getTodayExpenses: () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return get().data.finance.transactions
      .filter((t) => (t.date === todayStr || t.date === '2026-09-25') && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  },

  getExpensesByDate: (iso) => {
    return get().data.finance.transactions
      .filter((t) => t.date === iso && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  },

  getMonthIncome: () => {
    return get().data.finance.transactions
      .filter((t) => t.type === 'income' && t.date.startsWith('2026-09'))
      .reduce((acc, t) => acc + t.amount, 0);
  },

  getMonthExpense: () => {
    return get().data.finance.transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith('2026-09'))
      .reduce((acc, t) => acc + t.amount, 0);
  },

  addBudget: (b) => {
    if (!b.name?.trim()) {
      get().showToast('Nama budget wajib diisi', 'info');
      return null;
    }
    const cap = Number(b.cap) || 0;
    if (cap <= 0) {
      get().showToast('Cap harus lebih dari 0', 'info');
      return null;
    }
    const nb: Budget = {
      id: 'b-' + Date.now(),
      name: b.name.trim(),
      category: b.category || 'General',
      cap,
      color: b.color || 'tertiary-fixed',
    };
    const finance = { ...get().data.finance, budgets: [...(get().data.finance.budgets || []), nb] };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast(`Budget "${nb.name}" dibuat`, 'success');
    return nb;
  },

  updateBudget: (id, updates) => {
    const budgets = (get().data.finance.budgets || []).map((x) =>
      x.id === id ? { ...x, ...updates, cap: updates.cap !== undefined ? Number(updates.cap) || x.cap : x.cap } : x
    );
    const finance = { ...get().data.finance, budgets };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Budget updated', 'success');
  },

  deleteBudget: (id) => {
    const finance = { ...get().data.finance, budgets: (get().data.finance.budgets || []).filter((x) => x.id !== id) };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Budget deleted', 'info');
  },

  getBudgetSpent: (category) => {
    return get().data.finance.transactions
      .filter((t) => t.type === 'expense' && t.category === category && t.date.startsWith('2026-09'))
      .reduce((acc, t) => acc + t.amount, 0);
  },

  setMonthlyBudget: (amount) => {
    if (amount <= 0) {
      get().showToast('Monthly cap harus lebih dari 0', 'info');
      return;
    }
    const finance = { ...get().data.finance, monthlyBudget: amount };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Monthly budget cap updated', 'success');
  },

  addAccount: (a) => {
    if (!a.name?.trim()) {
      get().showToast('Nama account wajib diisi', 'info');
      return null;
    }
    const na: Account = {
      id: 'a-' + Date.now(),
      name: a.name.trim(),
      detail: a.detail || 'Manual ledger',
      balance: Number(a.balance) || 0,
      icon: a.icon || 'account_balance_wallet',
    };
    const finance = { ...get().data.finance, accounts: [...(get().data.finance.accounts || []), na] };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast(`Account "${na.name}" dibuat`, 'success');
    return na;
  },

  updateAccount: (id, updates) => {
    const accounts = (get().data.finance.accounts || []).map((x) =>
      x.id === id ? { ...x, ...updates, balance: updates.balance !== undefined ? Number(updates.balance) ?? x.balance : x.balance } : x
    );
    const finance = { ...get().data.finance, accounts };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Account updated', 'success');
  },

  deleteAccount: (id) => {
    const finance = { ...get().data.finance, accounts: (get().data.finance.accounts || []).filter((x) => x.id !== id) };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Account deleted', 'info');
  },

  transferAccount: (fromId, toId, amount) => {
    const amt = Number(amount) || 0;
    if (fromId === toId) {
      get().showToast('Pilih account yang berbeda', 'info');
      return false;
    }
    if (amt <= 0) {
      get().showToast('Nominal transfer harus lebih dari 0', 'info');
      return false;
    }
    const accounts = get().data.finance.accounts || [];
    const from = accounts.find((a) => a.id === fromId);
    const to = accounts.find((a) => a.id === toId);
    if (!from || !to) {
      get().showToast('Account tidak ditemukan', 'info');
      return false;
    }
    if (from.balance < amt) {
      get().showToast('Saldo sumber tidak cukup', 'info');
      return false;
    }
    const next = accounts.map((a) =>
      a.id === fromId ? { ...a, balance: a.balance - amt } : a.id === toId ? { ...a, balance: a.balance + amt } : a
    );
    const finance = { ...get().data.finance, accounts: next };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast(`Transfer Rp ${amt.toLocaleString('id-ID')} berhasil`, 'success');
    return true;
  },

  addProject: (projData) => {
    if (!projData.name || !projData.name.trim()) {
      get().showToast('Nama project wajib diisi', 'info');
      return null;
    }
    const newProj: Project = {
      id: 'proj-' + Date.now(),
      name: projData.name.trim(),
      tagline: projData.tagline || 'Strategic Scope',
      description: projData.description || '',
      category: projData.category || 'General',
      status: 'active',
      progress: 0,
      color: projData.color || 'emerald',
      lead: get().data.user.name,
      milestones: projData.milestones || [],
      notes: projData.notes || '',
      images: projData.images || [],
    };
    const updated = { ...get().data, projects: [...get().data.projects, newProj] };
    saveStoredData(updated);
    set({ data: updated, selectedProjectId: newProj.id });
    get().showToast(`Project created: "${newProj.name}"`, 'success');
    return newProj;
  },

  updateProject: (projId, updates) => {
    const projects = get().data.projects.map((p) => (p.id === projId ? { ...p, ...updates } : p));
    const updated = { ...get().data, projects };
    saveStoredData(updated);
    set({ data: updated });
  },

  updateProjectNotes: (projId, notes) => {
    const projects = get().data.projects.map((p) => (p.id === projId ? { ...p, notes } : p));
    const updated = { ...get().data, projects };
    saveStoredData(updated);
    set({ data: updated });
  },

  addProjectImage: (projId, img) => {
    const projects = get().data.projects.map((p) =>
      p.id === projId ? { ...p, images: [...(p.images || []), img] } : p
    );
    const updated = { ...get().data, projects };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Gambar ditambahkan ke project', 'success');
  },

  deleteProjectImage: (projId, imageId) => {
    const projects = get().data.projects.map((p) =>
      p.id === projId ? { ...p, images: (p.images || []).filter((i) => i.id !== imageId) } : p
    );
    const updated = { ...get().data, projects };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Gambar dihapus', 'info');
  },

  addTarget: (t) => {
    if (!t.name?.trim()) {
      get().showToast('Nama target wajib diisi', 'info');
      return null;
    }
    const targetPrice = Number(t.targetPrice) || 0;
    if (targetPrice <= 0) {
      get().showToast('Target harga harus lebih dari 0', 'info');
      return null;
    }
    const nt: PurchaseTarget = {
      id: 'pt-' + Date.now(),
      name: t.name.trim(),
      targetPrice,
      saved: Number(t.saved) || 0,
      priority: t.priority || 'med',
      note: t.note || '',
      bought: false,
      createdAt: BASE_TODAY_ISO,
    };
    const finance = { ...get().data.finance, targets: [...(get().data.finance.targets || []), nt] };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast(`Target "${nt.name}" dibuat`, 'success');
    return nt;
  },

  updateTarget: (id, updates) => {
    const targets = (get().data.finance.targets || []).map((x) =>
      x.id === id
        ? {
            ...x,
            ...updates,
            targetPrice: updates.targetPrice !== undefined ? Number(updates.targetPrice) || x.targetPrice : x.targetPrice,
            saved: updates.saved !== undefined ? Math.max(0, Number(updates.saved) || 0) : x.saved,
          }
        : x
    );
    const finance = { ...get().data.finance, targets };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
  },

  deleteTarget: (id) => {
    const updated = {
      ...get().data,
      finance: { ...get().data.finance, targets: (get().data.finance.targets || []).filter((x) => x.id !== id) },
    };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Target dihapus', 'info');
  },

  allocateToTarget: (id, amount) => {
    const amt = Number(amount) || 0;
    if (amt <= 0) {
      get().showToast('Nominal harus lebih dari 0', 'info');
      return;
    }
    if (get().data.finance.liquidBalance < amt) {
      get().showToast('Saldo tidak cukup', 'info');
      return;
    }
    const targets = (get().data.finance.targets || []).map((x) =>
      x.id === id ? { ...x, saved: Math.min(x.targetPrice, x.saved + amt) } : x
    );
    const finance = {
      ...get().data.finance,
      liquidBalance: get().data.finance.liquidBalance - amt,
      targets,
    };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast(`Rp ${amt.toLocaleString('id-ID')} dialokasikan ke target`, 'success');
  },

  toggleTargetBought: (id) => {
    const targets = (get().data.finance.targets || []).map((x) =>
      x.id === id ? { ...x, bought: !x.bought } : x
    );
    const finance = { ...get().data.finance, targets };
    const updated = { ...get().data, finance };
    saveStoredData(updated);
    set({ data: updated });
  },

  deleteProject: (projId) => {
    const updated = { ...get().data, projects: get().data.projects.filter((p) => p.id !== projId) };
    saveStoredData(updated);
    set({ data: updated, selectedProjectId: updated.projects[0]?.id || '' });
    get().showToast('Project deleted', 'info');
  },

  toggleMilestone: (projId, milestoneId) => {
    const projects = get().data.projects.map((p) => {
      if (p.id === projId) {
        const milestones = (p.milestones || []).map((m) => (m.id === milestoneId ? { ...m, done: !m.done } : m));
        const progress = Math.round((milestones.filter((m) => m.done).length / (milestones.length || 1)) * 100);
        return { ...p, milestones, progress };
      }
      return p;
    });
    const updated = { ...get().data, projects };
    saveStoredData(updated);
    set({ data: updated });
  },

  addCalendarEvent: (eventData) => {
    if (!eventData.title || !eventData.title.trim()) {
      get().showToast('Judul event wajib diisi', 'info');
      return null;
    }
    const newEv: CalendarEvent = {
      id: 'ev-' + Date.now(),
      title: eventData.title.trim(),
      category: eventData.category || 'General',
      location: eventData.location || 'Local',
      startTime: eventData.startTime || '10:00',
      endTime: eventData.endTime || '11:00',
      date: eventData.date || '2026-09-25',
      done: false,
      color: eventData.color || 'emerald',
    };
    const updated = { ...get().data, calendar: [...get().data.calendar, newEv] };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast(`Event added: "${newEv.title}"`, 'success');
    return newEv;
  },

  updateCalendarEvent: (eventId, updates) => {
    const calendar = get().data.calendar.map((e) => (e.id === eventId ? { ...e, ...updates } : e));
    const updated = { ...get().data, calendar };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Event updated', 'success');
  },

  deleteCalendarEvent: (eventId) => {
    const updated = { ...get().data, calendar: get().data.calendar.filter((e) => e.id !== eventId) };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Event deleted', 'info');
  },

  toggleCalendarEvent: (eventId) => {
    const calendar = get().data.calendar.map((e) => (e.id === eventId ? { ...e, done: !e.done } : e));
    const updated = { ...get().data, calendar };
    saveStoredData(updated);
    set({ data: updated });
  },

  addReviewEntry: (entryData) => {
    if (!entryData.win?.trim() && !entryData.decision?.trim()) {
      get().showToast('Isi win atau decision dulu', 'info');
      return null;
    }
    const newReview: ReviewItem = {
      id: 'rev-' + Date.now(),
      date: entryData.date || new Date().toISOString().slice(0, 10),
      period: entryData.period || 'daily',
      win: entryData.win || '',
      friction: entryData.friction || '',
      decision: entryData.decision || '',
      productivityRating: Number(entryData.productivityRating) || 8,
      energyLevel: entryData.energyLevel || 'High',
      cognitiveScore: Number(entryData.cognitiveScore) || 88,
    };
    const updated = { ...get().data, review: { ...get().data.review, history: [newReview, ...get().data.review.history] } };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Retrospective entry saved', 'success');
    return newReview;
  },

  deleteReviewEntry: (id) => {
    const updated = { ...get().data, review: { ...get().data.review, history: get().data.review.history.filter((r) => r.id !== id) } };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Review deleted', 'info');
  },

  sendAiMessage: (text) => {
    if (!text.trim()) return;
    const userMsg: AiMessage = { id: 'msg-' + Date.now(), sender: 'user', time: new Date().toTimeString().slice(0, 5), text: text.trim() };
    const updated = { ...get().data, mirrorAi: { ...get().data.mirrorAi, chatHistory: [...get().data.mirrorAi.chatHistory, userMsg] } };
    saveStoredData(updated);
    set({ data: updated });
    setTimeout(() => {
      const reply = get().generateAiResponse(text);
      const aiMsg: AiMessage = { id: 'msg-' + (Date.now() + 1), sender: 'ai', time: new Date().toTimeString().slice(0, 5), text: reply };
      const finalUpdated = { ...get().data, mirrorAi: { ...get().data.mirrorAi, chatHistory: [...get().data.mirrorAi.chatHistory, aiMsg] } };
      saveStoredData(finalUpdated);
      set({ data: finalUpdated });
    }, 450);
  },

  generateAiResponse: (prompt) => {
    const p = prompt.toLowerCase();
    const tasks = get().data.tasks;
    const pendingTasks = tasks.filter((t) => !t.completed);
    const routines = get().data.routines;
    const doneRoutines = routines.filter((r) => r.doneToday);
    const todayExpenses = get().getTodayExpenses();
    const balance = get().data.finance.liquidBalance;
    if (p.includes('task') || p.includes('tugas') || p.includes('kerjaan')) {
      return `Telemetry check: ${pendingTasks.length} pending, ${tasks.filter((t) => t.completed).length} selesai. Prioritas: "${pendingTasks[0]?.title || 'None'}". Alokasikan 1 blok Pomodoro 25 menit.`;
    }
    if (p.includes('finance') || p.includes('uang') || p.includes('duit') || p.includes('budget') || p.includes('ledger')) {
      return `Spend hari ini Rp ${todayExpenses.toLocaleString('id-ID')} dari target Rp ${get().data.finance.dailyTarget.toLocaleString('id-ID')}. Saldo Rp ${balance.toLocaleString('id-ID')}. Status aman.`;
    }
    if (p.includes('routine') || p.includes('kebiasaan') || p.includes('habit')) {
      return `Habit: ${doneRoutines.length}/${routines.length} selesai hari ini. Streak terpanjang "${[...routines].sort((a, b) => b.streak - a.streak)[0]?.title}".`;
    }
    if (p.includes('focus') || p.includes('timer') || p.includes('pomodoro')) {
      return `Focus: ${get().data.focus.sessionsCompletedToday} sesi (${Math.round(get().data.focus.totalSecondsToday / 60)} mnt). Siap blok berikutnya.`;
    }
    return `Diproses: "${prompt}". Rekomendasi: fokus 1 sprint aktif, review habit jam 21:00. (AI penuh menyusul)`;
  },

  startTimer: () => set((state) => ({ timerState: { ...state.timerState, isRunning: true } })),
  pauseTimer: () => set((state) => ({ timerState: { ...state.timerState, isRunning: false } })),
  resetTimer: () => set((state) => ({ timerState: { ...state.timerState, isRunning: false, secondsRemaining: state.timerState.initialSeconds, stopwatchSeconds: 0 } })),
  setTimerMode: (mode) => set((state) => ({ timerState: { ...state.timerState, mode, isRunning: false } })),
  addTimerMinutes: (mins = 5) => set((state) => ({ timerState: { ...state.timerState, secondsRemaining: state.timerState.secondsRemaining + mins * 60, initialSeconds: state.timerState.initialSeconds + mins * 60 } })),
  setTimerPreset: (mins = 25) => {
    const secs = mins * 60;
    set((state) => ({ timerState: { ...state.timerState, isRunning: false, secondsRemaining: secs, initialSeconds: secs }, data: { ...state.data, focus: { ...state.data.focus, presetMinutes: mins } } }));
  },
  completeTimerSession: () => {
    const { mode, initialSeconds, stopwatchSeconds } = get().timerState;
    const elapsed = mode === 'stopwatch' ? stopwatchSeconds : initialSeconds;
    if (mode === 'stopwatch' && elapsed < 1) {
      set((state) => ({ timerState: { ...state.timerState, isRunning: false } }));
      return;
    }
    const focus = {
      ...get().data.focus,
      sessionsCompletedToday: get().data.focus.sessionsCompletedToday + 1,
      totalSecondsToday: get().data.focus.totalSecondsToday + elapsed,
      history: [{ id: 'foc-' + Date.now(), task: get().data.focus.targetTaskTitle || 'Deep Work Session', duration: Math.max(1, Math.round(elapsed / 60)), time: new Date().toTimeString().slice(0, 5), date: new Date().toISOString().slice(0, 10) }, ...get().data.focus.history],
    };
    const updated = { ...get().data, focus };
    saveStoredData(updated);
    set((state) => ({ data: updated, timerState: { ...state.timerState, isRunning: false, secondsRemaining: state.timerState.initialSeconds, stopwatchSeconds: 0 } }));
    get().showToast('Focus session completed! Great job.', 'success');
  },
  tickTimer: () => {
    const { secondsRemaining, isRunning, mode } = get().timerState;
    if (!isRunning) return;
    if (mode === 'stopwatch') {
      set((state) => ({ timerState: { ...state.timerState, stopwatchSeconds: state.timerState.stopwatchSeconds + 1 } }));
      return;
    }
    if (secondsRemaining > 0) set((state) => ({ timerState: { ...state.timerState, secondsRemaining: state.timerState.secondsRemaining - 1 } }));
    else get().completeTimerSession();
  },

  updateSettings: (updates) => {
    const updated = { ...get().data, settings: { ...get().data.settings, ...updates } };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('Settings saved', 'success');
  },
  updateUser: (updates) => {
    const updated = { ...get().data, user: { ...get().data.user, ...updates } };
    saveStoredData(updated);
    set({ data: updated });
    get().showToast('User profile updated', 'success');
  },
  setAmbientPlaying: (on, volume) => {
    const updated = {
      ...get().data,
      focus: {
        ...get().data.focus,
        ambientPlaying: on,
        ...(volume !== undefined ? { volume } : {}),
      },
    };
    saveStoredData(updated);
    set({ data: updated });
  },
  setDailyTarget: (amount) => {
    const updated = { ...get().data, finance: { ...get().data.finance, dailyTarget: amount > 0 ? amount : 100000 } };
    saveStoredData(updated);
    set({ data: updated });
  },
  setFocusTarget: (taskId, title, project) => {
    const updated = { ...get().data, focus: { ...get().data.focus, targetTaskId: taskId, targetTaskTitle: title, targetProject: project } };
    saveStoredData(updated);
    set({ data: updated });
  },
  setFocusVolume: (volume) => {
    const updated = { ...get().data, focus: { ...get().data.focus, volume: Math.min(100, Math.max(0, volume)) } };
    saveStoredData(updated);
    set({ data: updated });
  },
  exportJson: () => {
    downloadJsonFile(`productiv_os_backup_${new Date().toISOString().slice(0, 10)}.json`, get().data);
    get().showToast('Exported JSON backup', 'success');
  },
  exportSingleJson: (key) => {
    downloadJsonFile(`productiv_${key}_${new Date().toISOString().slice(0, 10)}.json`, (get().data as unknown as Record<string, unknown>)[key]);
    get().showToast(`Exported ${key}.json`, 'success');
  },
  importJson: (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.tasks && parsed.user) {
        saveStoredData(parsed);
        set({ data: parsed });
        get().showToast('Data imported successfully!', 'success');
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  },
  resetToDefault: () => {
    saveStoredData(INITIAL_DATA);
    set({ data: INITIAL_DATA });
    get().showToast('Data reset to default demo state', 'info');
  },
}));
