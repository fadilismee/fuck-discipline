export type ViewKey = 
  | 'today' 
  | 'tasks' 
  | 'calendar' 
  | 'projects' 
  | 'focus' 
  | 'routines' 
  | 'finance' 
  | 'review' 
  | 'mirror' 
  | 'settings';

export interface User {
  name: string;
  role: string;
  title: string;
  avatar: string;
  dateStr: string;
  cognitiveCapacity: number;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  priority: 'high' | 'med' | 'low';
  est: string;
  due: string;
  /** Tanggal ISO (YYYY-MM-DD) kapan task dijadwalkan. Opsional utk data lama. */
  date?: string;
  /** Tanggal ISO kapan task diselesaikan. Diisi otomatis saat toggle complete. */
  completedAt?: string;
  status: 'today' | 'upcoming' | 'overdue' | 'completed' | 'inbox';
  completed: boolean;
  timeSpent: string;
  tags: string[];
  notes: string;
  subtasks: Subtask[];
}

export interface Milestone {
  id: string;
  name: string;
  done: boolean;
  due: string;
}

export interface ProjectImage {
  id: string;
  name: string;
  /** dataURL JPEG hasil kompres */
  dataUrl: string;
  /** ukuran KB setelah kompres */
  sizeKB: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  status: 'active' | 'archived' | 'completed';
  progress: number;
  color: string;
  lead: string;
  milestones: Milestone[];
  /** Catatan detail / spesifikasi proyek (markdown plain) */
  notes: string;
  images: ProjectImage[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  category: string;
  location: string;
  startTime: string;
  endTime: string;
  date: string;
  done: boolean;
  color: string;
}

export interface FocusHistoryItem {
  id: string;
  task: string;
  duration: number;
  time: string;
  date: string;
}

export interface FocusState {
  currentMode: 'pomodoro' | 'stopwatch' | 'ambient';
  presetMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsCompletedToday: number;
  totalSecondsToday: number;
  targetTaskId: string;
  targetTaskTitle: string;
  targetProject: string;
  ambientSound: string;
  ambientPlaying: boolean;
  volume: number;
  history: FocusHistoryItem[];
}

export interface Routine {
  id: string;
  title: string;
  block: 'morning' | 'afternoon' | 'evening';
  time: string;
  streak: number;
  doneToday: boolean;
  tag: string;
  desc: string;
  /** Riwayat centang per tanggal ISO: { '2026-09-25': true } */
  history: Record<string, boolean>;
}

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  time: string;
  icon: string;
  notes?: string;
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  cap: number;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  detail: string;
  balance: number;
  icon: string;
}

export interface PurchaseTarget {
  id: string;
  name: string;
  targetPrice: number;
  saved: number;
  priority: 'high' | 'med' | 'low';
  note: string;
  bought: boolean;
  createdAt: string;
}

export interface FinanceState {
  liquidBalance: number;
  dailyTarget: number;
  monthlyBudget: number;
  monthlySpent: number;
  currency: string;
  transactions: Transaction[];
  budgets: Budget[];
  accounts: Account[];
  targets: PurchaseTarget[];
}

export interface ReviewItem {
  id: string;
  date: string;
  period: 'daily' | 'weekly' | 'monthly';
  win: string;
  friction: string;
  decision: string;
  productivityRating: number;
  energyLevel: string;
  cognitiveScore: number;
}

export interface ReviewState {
  currentDate: string;
  throughputPercent: number;
  history: ReviewItem[];
}

export interface AiMessage {
  id: string;
  sender: 'user' | 'ai';
  time: string;
  text: string;
}

export interface MirrorAiState {
  cognitiveLoad: number;
  frictionIndex: string;
  systemConfidence: string;
  recommendations: string[];
  chatHistory: AiMessage[];
}

export interface SettingsState {
  userName: string;
  email: string;
  theme: string;
  soundEffects: boolean;
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  dailySpendLimit: number;
  telemetryEnabled: boolean;
  notificationsEnabled: boolean;
  autoSyncLocalStorage: boolean;
}

export interface LifeOSData {
  user: User;
  tasks: Task[];
  projects: Project[];
  calendar: CalendarEvent[];
  focus: FocusState;
  routines: Routine[];
  finance: FinanceState;
  review: ReviewState;
  mirrorAi: MirrorAiState;
  settings: SettingsState;
}
