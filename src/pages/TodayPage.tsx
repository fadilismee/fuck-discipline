import React, { useMemo, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { useWebAudio } from '../hooks/useWebAudio';
import { activeISO, addDaysISO, labelDay, last7, shortDay, BASE_TODAY_ISO } from '../utils/date';
import type { Task } from '../types';

/** Tanggal ISO kapan sebuah task dijadwalkan (pakai field date, fallback inferensi legacy). */
function resolveTaskDate(t: Task): string {
  if (t.date) return t.date;
  const due = (t.due || '').toLowerCase();
  if (due.includes('tomorrow')) return addDaysISO(BASE_TODAY_ISO, 1);
  if (due.includes('yesterday')) return addDaysISO(BASE_TODAY_ISO, -1);
  return BASE_TODAY_ISO;
}

/** Bangun path SVG sparkline dari 7 nilai. viewBox 100x30. */
function sparklinePaths(values: number[]): { line: string; area: string } {
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i * 100) / 6;
    const y = 28 - (v / max) * 24;
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
  return { line, area: `${line} V30 H0 Z` };
}

export const TodayPage: React.FC = () => {
  const user = useLifeOSStore((state) => state.data.user);
  const tasks = useLifeOSStore((state) => state.data.tasks);
  const routines = useLifeOSStore((state) => state.data.routines);
  const calendar = useLifeOSStore((state) => state.data.calendar);
  const finance = useLifeOSStore((state) => state.data.finance);
  const focus = useLifeOSStore((state) => state.data.focus);
  const mirrorAi = useLifeOSStore((state) => state.data.mirrorAi);
  const timerState = useLifeOSStore((state) => state.timerState);
  const dayOffset = useLifeOSStore((state) => state.dayOffset);
  const shiftDay = useLifeOSStore((state) => state.shiftDay);
  const resetDay = useLifeOSStore((state) => state.resetDay);

  const toggleTask = useLifeOSStore((state) => state.toggleTask);
  const toggleCalendarEvent = useLifeOSStore((state) => state.toggleCalendarEvent);
  const addTask = useLifeOSStore((state) => state.addTask);
  const toggleRoutine = useLifeOSStore((state) => state.toggleRoutine);
  const openDrawer = useLifeOSStore((state) => state.openDrawer);
  const openTaskModal = useLifeOSStore((state) => state.openTaskModal);
  const openExpenseModal = useLifeOSStore((state) => state.openExpenseModal);
  const startTimer = useLifeOSStore((state) => state.startTimer);
  const pauseTimer = useLifeOSStore((state) => state.pauseTimer);
  const setTimerPreset = useLifeOSStore((state) => state.setTimerPreset);
  const setActiveView = useLifeOSStore((state) => state.setActiveView);

  const { playSuccessChime, playBeep } = useWebAudio();
  const [quickTitle, setQuickTitle] = useState('');
  const [mobileTab, setMobileTab] = useState<'tasks' | 'focus' | 'rutin'>('tasks');

  const dayLabel =
    dayOffset === 0
      ? 'Today'
      : dayOffset === -1
      ? 'Yesterday'
      : dayOffset === 1
      ? 'Tomorrow'
      : `${Math.abs(dayOffset)}d ${dayOffset > 0 ? 'Ahead' : 'Ago'}`;

  // === REAL DATE-DRIVEN DATA: semua section ikut tanggal aktif ===
  const activeDate = activeISO(dayOffset);

  const dayTasks = useMemo(
    () => tasks.filter((t) => resolveTaskDate(t) === activeDate),
    [tasks, activeDate]
  );
  const completedDayCount = dayTasks.filter((t) => t.completed).length;
  const throughput =
    dayTasks.length > 0 ? Math.round((completedDayCount / dayTasks.length) * 100) : 0;

  const dayEvents = useMemo(
    () => calendar.filter((e) => e.date === activeDate).slice(0, 5),
    [calendar, activeDate]
  );

  const spentDay = useMemo(
    () =>
      finance.transactions
        .filter((t) => t.date === activeDate && t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0),
    [finance.transactions, activeDate]
  );

  const isBaseDay = activeDate === BASE_TODAY_ISO;
  const routineDoneOn = (r: (typeof routines)[number]) =>
    r.history?.[activeDate] ?? (isBaseDay ? r.doneToday : false);
  const doneRoutinesCount = routines.filter(routineDoneOn).length;

  // === Sparkline 7 hari real: task selesai per hari ===
  const weekStats = useMemo(() => {
    const days = last7(activeDate);
    const perDay = days.map(
      (d) => tasks.filter((t) => t.completed && (t.completedAt || resolveTaskDate(t)) === d).length
    );
    const total = perDay.reduce((a, b) => a + b, 0);
    const prevDays = [7, 8, 9, 10, 11, 12, 13].map((n) => addDaysISO(activeDate, -n));
    const prevTotal = prevDays.reduce(
      (acc, d) => acc + tasks.filter((t) => t.completed && (t.completedAt || resolveTaskDate(t)) === d).length,
      0
    );
    const delta = prevTotal === 0 ? (total > 0 ? 100 : 0) : Math.round(((total - prevTotal) / prevTotal) * 100);
    return { perDay, total, delta };
  }, [tasks, activeDate]);
  const spark = sparklinePaths(weekStats.perDay);

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Good morning' : hour < 15 ? 'Good afternoon' : hour < 19 ? 'Good evening' : 'Good night';

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    addTask({
      title: quickTitle.trim(),
      project: 'Inbox',
      priority: 'med',
      est: '30m',
      due: dayOffset === 0 ? 'Today' : shortDay(activeDate),
      date: activeDate,
      status: 'today',
    });
    setQuickTitle('');
    playBeep(659.25, 'sine', 0.15);
  };

  const handlePresetCycle = () => {
    const presets = [25, 50, 15];
    const next = presets[(presets.indexOf(focus.presetMinutes) + 1) % presets.length];
    setTimerPreset(next);
  };

  return (
    <div className="flex flex-col gap-space-lg w-full animate-fade-in">
      {/* Top Greeting & Orchestration Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-xs">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed shadow-[0_0_8px_rgba(111,251,190,0.6)] animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest font-mono">
              Executive Terminal
            </span>
          </div>
          <h1 className="font-display text-display text-primary tracking-tight font-semibold">
            {greeting}, {user.name}.
          </h1>
          <p className="font-body-default text-body-default text-outline">
            {labelDay(activeDate)} — Cognitive capacity steady at {user.cognitiveCapacity}%
          </p>
        </div>

        {/* Right Execution Metric Bar */}
        <div className="flex flex-wrap items-center gap-space-md">
          <div className="flex items-center bg-surface-container-low p-space-2xs rounded-lg shadow-sm border border-outline-variant/20 font-mono">
            <button
              onClick={() => {
                shiftDay(-1);
                playBeep(440, 'sine', 0.05);
              }}
              className="flex items-center justify-center w-7 h-7 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded transition-colors cursor-pointer"
              title="Previous Day"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button
              onClick={() => {
                resetDay();
                playBeep(523.25, 'sine', 0.05);
              }}
              className="flex items-center gap-1.5 px-space-sm h-7 text-on-surface font-label-default text-label-default cursor-pointer hover:text-tertiary-fixed"
            >
              <span className="material-symbols-outlined text-[14px] text-tertiary-fixed">today</span>
              <span>{dayLabel}</span>
            </button>
            <button
              onClick={() => {
                shiftDay(1);
                playBeep(440, 'sine', 0.05);
              }}
              className="flex items-center justify-center w-7 h-7 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded transition-colors cursor-pointer"
              title="Next Day"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          <div className="flex items-center gap-space-md bg-surface-container-low px-space-md py-space-xs rounded-lg shadow-sm border border-outline-variant/20 font-mono">
            <div className="flex flex-col min-w-[130px]">
              <div className="flex justify-between items-center text-label-sm font-label-sm mb-1">
                <span className="text-on-surface-variant font-sans">Daily Throughput</span>
                <span className="text-primary font-medium">{throughput}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-tertiary-fixed rounded-full transition-all duration-500"
                  style={{ width: `${throughput}%` }}
                ></div>
              </div>
            </div>
            <div className="flex flex-col text-right pl-space-xs">
              <span className="font-headline-sm text-headline-sm text-primary leading-none">
                {completedDayCount}
                <span className="text-outline text-body-sm font-normal">/{dayTasks.length}</span>
              </span>
              <span className="font-label-sm text-label-sm text-outline mt-0.5">
                {dayTasks.length - completedDayCount} pending
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Segmented Switcher (desktop tetap 3 kolom) */}
      <div className="lg:hidden sticky top-14 z-20 -mx-3 px-3 py-2 bg-surface/90 backdrop-blur-xl">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-low border border-outline-variant/30">
          {([
            { key: 'tasks', icon: 'check_circle', label: 'Tasks' },
            { key: 'focus', icon: 'timer', label: 'Focus' },
            { key: 'rutin', icon: 'repeat', label: 'Rutin' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setMobileTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg font-body-sm font-medium transition-all ${
                mobileTab === t.key
                  ? 'bg-surface-container-high text-primary shadow-sm'
                  : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{t.icon}</span>
              <span className="text-[13px]">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Cockpit Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
        {/* COLUMN 1: Task Execution Engine (5 Cols) */}
        <div className={`lg:col-span-5 flex-col gap-space-md ${mobileTab === 'tasks' ? 'flex' : 'hidden lg:flex'}`}>
          <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-md relative overflow-hidden border border-outline-variant/20">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                <span className="font-label-default text-label-default uppercase tracking-wider text-on-surface font-semibold">
                  Today's Tasks
                </span>
              </div>
              <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container text-tertiary-fixed font-mono">
                {dayTasks.length - completedDayCount} remaining • {dayTasks.length} total
              </span>
            </div>

            {/* Quick Task Input */}
            <form
              onSubmit={handleQuickAdd}
              className="flex items-center bg-surface-container-lowest rounded-lg px-space-sm py-1.5 focus-within:bg-surface-container transition-all"
            >
              <span className="material-symbols-outlined text-outline text-[16px] mr-space-xs">add</span>
              <input
                className="bg-transparent text-primary placeholder-outline font-body-default text-body-default w-full outline-none"
                placeholder="Add task to Today, press Enter..."
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
              />
              <kbd className="font-kbd text-kbd px-1 py-0.5 bg-surface-container-high text-on-surface-variant rounded ml-space-xs font-mono">
                ↵
              </kbd>
            </form>

            {/* Task Checklist Stream */}
            <div className="flex flex-col gap-1">
              {dayTasks.length === 0 && (
                <p className="text-[12px] text-outline py-2 text-center">
                  No tasks on {shortDay(activeDate)} — add one above ⏎
                </p>
              )}
              {dayTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => openDrawer(t.id)}
                  className={`task-row group flex items-start gap-space-sm p-space-xs rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer ${
                    t.completed ? 'bg-surface-container-lowest/40 opacity-50' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(t.id, activeDate);
                      if (!t.completed) playSuccessChime();
                      else playBeep(440, 'sine', 0.1);
                    }}
                    className={`mt-0.5 w-4 h-4 rounded-sm flex items-center justify-center transition-transform ${
                      t.completed
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-primary group-hover:scale-105'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[12px] ${
                        t.completed ? '' : 'opacity-0'
                      }`}
                    >
                      check
                    </span>
                  </button>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-space-xs">
                      <span
                        className={`font-body-default text-body-default truncate ${
                          t.completed ? 'line-through text-outline' : 'text-primary font-medium'
                        }`}
                      >
                        {t.title}
                      </span>
                      <span
                        className={`font-label-sm text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1 shrink-0 ${
                          t.priority === 'high'
                            ? 'bg-error-container/20 text-error'
                            : t.priority === 'med'
                            ? 'bg-secondary-container/40 text-secondary-fixed'
                            : 'bg-surface-container text-outline'
                        }`}
                      >
                        {t.priority === 'high' && <span className="w-1 h-1 rounded-full bg-error"></span>}
                        {t.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm mt-0.5 font-mono">
                      <span className="text-tertiary-fixed-dim">{t.project}</span>
                      <span className="text-outline">•</span>
                      <span>{t.est}</span>
                      <span className="text-outline">•</span>
                      <span className="text-outline">{t.due}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={openTaskModal}
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-body-sm text-body-sm transition-colors mt-space-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Detailed Task</span>
            </button>
          </section>

          {/* Weekly Velocity Card */}
          <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm flex items-center justify-between border border-outline-variant/20">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                Weekly Pace
              </span>
              <span className="font-headline-sm text-headline-sm text-primary mt-0.5 font-mono">
                {weekStats.total} Tasks Completed
              </span>
              <span
                className={`font-body-sm text-body-sm mt-1 flex items-center gap-1 font-mono ${
                  weekStats.delta >= 0 ? 'text-tertiary-fixed' : 'text-error'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {weekStats.delta >= 0 ? 'trending_up' : 'trending_down'}
                </span>{' '}
                {weekStats.delta >= 0 ? '+' : ''}
                {weekStats.delta}% vs prior 7d
              </span>
            </div>
            <div className="w-32 h-10" title={`Last 7d: ${weekStats.perDay.join(', ')}`}>
              <svg className="w-full h-full text-tertiary-fixed" fill="none" viewBox="0 0 100 30">
                <path
                  d={spark.line}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <path d={spark.area} fill="currentColor" fillOpacity="0.1" />
              </svg>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Focus Workstation & Timeline Agenda (4 Cols) */}
        <div className={`lg:col-span-4 flex-col gap-space-md ${mobileTab === 'focus' ? 'flex' : 'hidden lg:flex'}`}>
          {/* FOCUS QUICK WIDGET */}
          <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm relative overflow-hidden flex flex-col gap-space-sm border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-tertiary-fixed text-[18px]">adjust</span>
                <span className="font-label-default text-label-default uppercase tracking-wider text-on-surface font-semibold">
                  Focus Workspace
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-tertiary-fixed bg-tertiary-fixed/10 px-2 py-0.5 rounded font-mono">
                {focus.sessionsCompletedToday} sessions done
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-display text-[38px] leading-tight font-bold tracking-tight text-primary font-mono">
                    {formatSeconds(timerState.mode === 'stopwatch' ? timerState.stopwatchSeconds : timerState.secondsRemaining)}
                  </div>
                  {timerState.mode === 'stopwatch' && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-tertiary-fixed/15 text-tertiary-fixed font-bold uppercase">SW</span>
                  )}
                </div>
                <div className="font-label-sm text-label-sm text-outline flex items-center gap-1 mt-1 font-mono">
                  <span className="material-symbols-outlined text-[14px] text-tertiary-fixed">schedule</span>
                  <span>
                    Accumulated today:{' '}
                    <strong className="text-primary font-medium">
                      {Math.floor(focus.totalSecondsToday / 3600)}h{' '}
                      {Math.floor((focus.totalSecondsToday % 3600) / 60)}m
                    </strong>
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-label-sm text-label-sm text-outline">Target Work</span>
                <span className="font-label-default text-label-default text-tertiary-fixed font-medium truncate max-w-[120px]">
                  {focus.targetTaskTitle || 'Productiv UI'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs mt-space-xs">
              <button
                onClick={() => {
                  if (timerState.isRunning) pauseTimer();
                  else startTimer();
                }}
                className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg font-headline-sm text-headline-sm font-semibold transition-all cursor-pointer ${
                  timerState.isRunning
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed-dim'
                    : 'bg-primary text-on-primary hover:bg-primary-fixed'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {timerState.isRunning ? 'pause' : 'play_arrow'}
                </span>
                <span>{timerState.isRunning ? 'PAUSE FOCUS' : 'START FOCUS'}</span>
              </button>
              <button
                onClick={handlePresetCycle}
                className="h-9 px-space-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg font-label-default text-label-default transition-colors font-mono cursor-pointer"
                title="Switch preset duration"
              >
                {focus.presetMinutes}m
              </button>
            </div>
          </section>

          {/* TIMELINE / AGENDA */}
          <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-outline-variant/20">
            <div className="flex items-center justify-between mb-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-outline text-[18px]">
                  calendar_view_day
                </span>
                <span className="font-label-default text-label-default uppercase tracking-wider text-on-surface font-semibold">
                  Timeline
                </span>
              </div>
              <button
                onClick={() => setActiveView('calendar')}
                className="font-label-sm text-label-sm text-tertiary-fixed hover:underline cursor-pointer"
              >
                Auto-synced
              </button>
            </div>

            <div className="flex flex-col gap-2 font-mono">
              {dayEvents.length === 0 && (
                <p className="text-[12px] text-outline py-2 text-center font-sans">
                  No agenda on {shortDay(activeDate)}
                </p>
              )}
              {dayEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => toggleCalendarEvent(ev.id)}
                  title="Klik untuk toggle selesai"
                  className={`flex items-start gap-space-sm p-space-xs rounded-lg cursor-pointer transition-colors ${
                    ev.done ? 'opacity-60' : 'bg-surface-container-high/40 hover:bg-surface-container-high'
                  }`}
                >
                  <span
                    className={`font-label-sm text-label-sm w-12 pt-0.5 ${
                      ev.done ? 'text-outline' : 'text-tertiary-fixed font-bold'
                    }`}
                  >
                    {ev.startTime}
                  </span>
                  <div
                    className={`w-1 self-stretch rounded-full mr-1 ${
                      ev.done ? 'bg-surface-container-highest' : 'bg-tertiary-fixed'
                    }`}
                  ></div>
                  <div className="flex flex-col flex-1 font-sans">
                    <span
                      className={`font-body-default text-body-default ${
                        ev.done ? 'line-through text-on-surface' : 'text-primary font-medium'
                      }`}
                    >
                      {ev.title}
                    </span>
                    <span className="font-label-sm text-label-sm text-outline font-mono">
                      {ev.category} • {ev.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* COLUMN 3: Habits/Routines & Ledger Snapshot (3 Cols) */}
        <div className={`lg:col-span-3 flex-col gap-space-md ${mobileTab === 'rutin' ? 'flex' : 'hidden lg:flex'}`}>
          {/* ROUTINES CARD */}
          <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-outline text-[18px]">repeat</span>
                <span className="font-label-default text-label-default uppercase tracking-wider text-on-surface font-semibold">
                  Routines
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-tertiary-fixed bg-tertiary-fixed/10 px-1.5 py-0.5 rounded font-mono">
                {doneRoutinesCount}/{routines.length} Done
              </span>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              {routines.slice(0, 5).map((r) => {
                const done = routineDoneOn(r);
                return (
                <div
                  key={r.id}
                  onClick={() => {
                    toggleRoutine(r.id, activeDate);
                    if (!done) playSuccessChime();
                    else playBeep(440, 'sine', 0.08);
                  }}
                  className="routine-item flex items-center justify-between p-space-xs rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        done
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : 'bg-surface-container-highest text-primary'
                      }`}
                    >
                      {done && (
                        <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                      )}
                    </div>
                    <span
                      className={`font-body-default text-body-default truncate ${
                        done ? 'line-through text-outline' : 'text-primary'
                      }`}
                    >
                      {r.title}
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline font-mono shrink-0">
                    {r.time}
                  </span>
                </div>
                );
              })}
            </div>
          </section>

          {/* FINANCE QUICK SNAPSHOT */}
          <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-outline text-[18px]">
                  account_balance_wallet
                </span>
                <span className="font-label-default text-label-default uppercase tracking-wider text-on-surface font-semibold">
                  Finance {dayOffset === 0 ? 'Today' : shortDay(activeDate)}
                </span>
              </div>
              <button
                onClick={openExpenseModal}
                className="font-label-sm text-label-sm text-primary hover:text-primary-fixed bg-surface-container px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer font-mono"
                type="button"
              >
                <span className="material-symbols-outlined text-[13px]">add</span> Add
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-surface-container-lowest p-space-sm rounded-lg font-mono">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">Spent {shortDay(activeDate)}</span>
                <span className="font-headline-sm text-headline-sm text-error">
                  Rp {spentDay.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-label-sm text-label-sm text-outline">Liquid Balance</span>
                <span className="font-headline-sm text-headline-sm text-primary">
                  Rp {finance.liquidBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 text-label-sm font-label-sm text-outline font-mono">
              <span>Daily target: Rp {finance.dailyTarget.toLocaleString('id-ID')}</span>
              <span className="text-tertiary-fixed font-medium">
                Safe ({finance.dailyTarget > 0 ? Math.round((spentDay / finance.dailyTarget) * 100) : 0}%)
              </span>
            </div>
          </section>

          {/* Quick Productivity Mirror Quote */}
          <div className="bg-gradient-to-br from-surface-container-low to-surface-container rounded-xl p-space-md shadow-sm relative overflow-hidden flex flex-col gap-1 border border-outline-variant/20">
            <div className="flex items-center gap-1.5 text-primary text-label-sm font-label-sm">
              <span className="material-symbols-outlined text-[14px] text-tertiary-fixed">
                auto_awesome
              </span>
              <span className="font-semibold">Mirror System Note</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant italic">
              "{mirrorAi.recommendations[0] || 'Focus on completing the Productiv UI before 16:00 to protect evening cognitive reserves.'}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
