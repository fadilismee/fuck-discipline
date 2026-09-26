import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { useWebAudio } from '../hooks/useWebAudio';
import { BASE_TODAY_ISO } from '../utils/date';

export const MirrorAIPage: React.FC = () => {
  const mirrorAi = useLifeOSStore((state) => state.data.mirrorAi);
  const user = useLifeOSStore((state) => state.data.user);
  const tasks = useLifeOSStore((state) => state.data.tasks);
  const routines = useLifeOSStore((state) => state.data.routines);
  const focus = useLifeOSStore((state) => state.data.focus);
  const calendar = useLifeOSStore((state) => state.data.calendar);
  const finance = useLifeOSStore((state) => state.data.finance);
  const sendAiMessage = useLifeOSStore((state) => state.sendAiMessage);
  const moveTask = useLifeOSStore((s) => s.moveTask);
  const openDrawer = useLifeOSStore((s) => s.openDrawer);
  const showToast = useLifeOSStore((s) => s.showToast);
  const { playBeep } = useWebAudio();

  const [inputPrompt, setInputPrompt] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // === Metrik REAL dari JSON (bukan angka statis) ===
  const pending = tasks.filter((t) => !t.completed);
  const overdue = tasks.filter((t) => !t.completed && t.status === 'overdue');
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const velocityPct = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;
  const overduePct = tasks.length > 0 ? Math.round((overdue.length / tasks.length) * 100) : 0;
  const pendingPct = Math.max(0, 100 - velocityPct - overduePct);
  const focusMinutes = Math.round(focus.totalSecondsToday / 60);
  const focusH = Math.floor(focusMinutes / 60);
  const focusM = focusMinutes % 60;
  const routineAdherence =
    routines.length > 0
      ? Math.round((routines.filter((r) => r.history?.[BASE_TODAY_ISO] ?? r.doneToday).length / routines.length) * 100)
      : 0;
  const spendToday = finance.transactions
    .filter((t) => t.date === BASE_TODAY_ISO && t.type === 'expense')
    .reduce((a, t) => a + t.amount, 0);

  // Cognitive load 0–100 dari beban real
  const cognitiveLoad = Math.min(
    99,
    Math.round(
      pending.length * 6 +
        overdue.length * 12 +
        Math.min(20, focusMinutes / 12) +
        (100 - routineAdherence) * 0.15
    )
  );
  const frictionIndex = `+${Math.min(99, overdue.length * 9 + Math.max(0, pending.length - 3) * 2)}%`;

  // Outlier real: overdue dulu, else high-priority tertunda
  const outlier =
    overdue[0] ||
    pending
      .slice()
      .sort((a, b) => (a.priority === 'high' ? 0 : 1) - (b.priority === 'high' ? 0 : 1))[0] ||
    null;

  const rescheduleToday = () => {
    if (!outlier) return;
    moveTask(outlier.id, 'today', BASE_TODAY_ISO);
    showToast(`"${outlier.title}" dipindah ke Today`, 'success');
    playBeep(659.25, 'triangle', 0.15);
  };

  // Heatmap REAL: densitas sesi fokus + event kalender per jam 08–23
  const heat = useMemo(() => {
    const slots = new Array(16).fill(0);
    const pushHour = (hhmm: string | undefined, weight = 1) => {
      if (!hhmm) return;
      const h = Number(hhmm.slice(0, 2));
      const idx = h - 8;
      if (idx >= 0 && idx < 16) slots[idx] += weight;
    };
    for (const h of focus.history) pushHour(h.time, 1);
    for (const ev of calendar) {
      pushHour(ev.startTime, 0.7);
      pushHour(ev.endTime, 0.4);
    }
    const max = Math.max(...slots, 1);
    return slots.map((v) => Math.round((v / max) * 100));
  }, [focus.history, calendar]);

  const heatClass = (v: number) =>
    v >= 90
      ? 'bg-tertiary-fixed shadow-sm'
      : v >= 70
      ? 'bg-tertiary-fixed/70'
      : v >= 50
      ? 'bg-tertiary-fixed/40'
      : v >= 30
      ? 'bg-surface-container-highest'
      : v >= 10
      ? 'bg-surface-container-highest/60'
      : 'bg-surface-container-lowest';

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mirrorAi.chatHistory]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;

    sendAiMessage(inputPrompt.trim());
    setInputPrompt('');
    playBeep(659.25, 'triangle', 0.15);
  };

  return (
    <div className="flex flex-col gap-space-md w-full animate-fade-in">
      {/* Telemetry Pipeline Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest px-space-md py-space-xs rounded-xl border border-outline-variant/20 shadow-sm font-mono text-label-sm">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-ping"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed -ml-2.5"></span>
            <span className="text-on-surface uppercase font-semibold font-mono">
              Live Telemetry Pipeline
            </span>
          </div>
          <span className="text-outline-variant/60">/</span>
          <div className="flex items-center gap-1 text-on-surface-variant font-mono">
            <span className="material-symbols-outlined text-[14px] text-outline">date_range</span>
            <span>
              Window: <span className="text-on-surface font-medium">21–25 Sep 2026</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-lg font-mono">
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="text-outline">Confidence:</span>
            <span className="text-tertiary-fixed font-semibold bg-tertiary-fixed/10 px-1.5 py-0.5 rounded">
              {mirrorAi.systemConfidence}
            </span>
          </div>
          <div className="flex items-center gap-1 text-outline">
            <span className="material-symbols-outlined text-[13px]">sync</span>
            <span>Synced real-time</span>
          </div>
        </div>
      </div>

      {/* Protocol Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-space-xs">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-display text-display text-primary tracking-tight font-semibold">
              MIRROR AI
            </h1>
            <span className="font-kbd text-kbd px-2 py-0.5 rounded bg-surface-container-high text-tertiary-fixed uppercase font-semibold font-mono">
              Autonomous System Analyst v2.4
            </span>
          </div>
          <p className="font-body-default text-body-default text-on-surface-variant">
            Deep telemetry synthesis from your tasks, calendar, time-tracking, and routines. AI acts on human approval only.
          </p>
        </div>

          <div className="flex items-center gap-space-xs self-start md:self-auto font-mono">
            <div className="flex flex-col px-space-md py-space-xs bg-surface-container rounded-lg shadow-sm border border-outline-variant/20" title="Dihitung dari task pending, overdue, jam fokus & routine">
              <span className="font-label-sm text-[10px] text-outline">COGNITIVE LOAD</span>
              <span className="font-headline-sm text-headline-sm text-primary font-semibold">
                {cognitiveLoad}
                <span className="font-label-sm text-outline font-normal">/100</span>
              </span>
            </div>
            <div className="flex flex-col px-space-md py-space-xs bg-surface-container rounded-lg shadow-sm border border-outline-variant/20" title="Dihitung dari task overdue & backlog">
              <span className="font-label-sm text-[10px] text-outline">FRICTION INDEX</span>
              <span className="font-headline-sm text-headline-sm text-error font-semibold">
                {frictionIndex}
              </span>
            </div>
          </div>
      </div>

      {/* SECTION 1: OBSERVATION SUITE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md mt-space-xs">
        {/* Velocity Card */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/20 shadow-sm">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                  Metric 01
                </span>
                <h2 className="font-headline-md text-headline-md text-primary font-semibold">
                  Task Completion Velocity
                </h2>
              </div>
              <span className="font-label-default text-label-default px-2 py-0.5 rounded bg-surface-container-high text-tertiary-fixed font-mono">
                {velocityPct}% Realized
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-space-sm font-mono">
              <span className="font-display text-display text-primary font-bold">
                {completedTasksCount}
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface-variant font-medium font-sans">
                of {tasks.length} Planned Tasks Shipped
              </span>
            </div>

            <div className="flex flex-col gap-1.5 font-mono">
              <div className="flex justify-between font-label-sm text-label-sm text-outline">
                <span>{completedTasksCount} of {tasks.length} tasks</span>
                <span className={overdue.length > 0 ? 'text-error font-medium' : 'text-tertiary-fixed font-medium'}>
                  {overdue.length > 0 ? `${overdue.length} overdue — action needed` : 'No overdue 🎉'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${velocityPct}%` }}
                ></div>
                <div className="h-full bg-error/70 transition-all duration-500" style={{ width: `${overduePct}%` }}></div>
                <div className="h-full bg-outline-variant/30 transition-all duration-500" style={{ width: `${pendingPct}%` }}></div>
              </div>
              <div className="flex items-center gap-space-md font-label-sm text-[10px] text-outline pt-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary"></span> {completedTasksCount} Shipped
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-error/70"></span> {overdue.length} Overdue
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-outline-variant/40"></span> {pending.length} Pending
                </span>
              </div>
            </div>
          </div>

          <div className="mt-space-md pt-space-md bg-surface-container/50 -mx-space-lg -mb-space-lg p-space-md rounded-b-xl flex items-center justify-between gap-space-sm text-body-sm text-on-surface-variant">
            <span>
              <strong className="text-primary font-medium font-mono">{focusH}h {focusM}m</strong> logged in deep focus · {routineAdherence}% routines · Rp {spendToday.toLocaleString('id-ID')} spent today.
            </span>
            <span className="material-symbols-outlined text-outline text-[20px] shrink-0">
              trending_up
            </span>
          </div>
        </div>

        {/* High Friction Outlier Card — REAL outlier dari data */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/20 shadow-sm">
          {outlier ? (
            <>
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-start justify-between font-mono gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-label-sm text-label-sm text-error uppercase tracking-wider font-semibold">
                      Anomalous Resistance
                    </span>
                    <h2 className="font-headline-md text-headline-md text-primary font-semibold font-sans truncate">
                      {outlier.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-error-container text-error font-label-sm text-label-sm font-semibold shrink-0">
                    <span className="material-symbols-outlined text-[13px]">warning</span>
                    <span>{outlier.status === 'overdue' ? 'Overdue' : outlier.priority.toUpperCase()}</span>
                  </div>
                </div>

                <div className="bg-surface-container p-space-sm rounded-lg text-body-sm text-on-surface-variant flex flex-col gap-1 font-mono text-[12px]">
                  <div className="flex justify-between text-outline">
                    <span>Project:</span>
                    <span className="text-on-surface">{outlier.project}</span>
                  </div>
                  <div className="flex justify-between text-error font-medium">
                    <span>Due:</span>
                    <span>{outlier.due}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold font-mono">
                    Behavioral Diagnosis
                  </span>
                  <p className="font-body-default text-body-default text-on-surface-variant">
                    {outlier.status === 'overdue'
                      ? 'Task ini melewati due date — pola penundaan struktural, bukan motivasi. Reschedule ke slot Today agar kembali ke radar.'
                      : 'High-priority item tertahan di backlog. Eksekusi dalam 1 blok fokus 25 menit berikutnya.'}
                  </p>
                </div>
              </div>

              <div className="mt-space-md pt-space-xs flex flex-wrap items-center gap-2">
                <button
                  onClick={rescheduleToday}
                  className="flex-1 min-w-[150px] h-10 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed text-[13px] font-semibold hover:bg-tertiary-fixed-dim active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">today</span>
                  Reschedule ke Today
                </button>
                <button
                  onClick={() => openDrawer(outlier.id)}
                  className="h-10 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-[13px] font-medium transition-colors"
                >
                  Open
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <span className="material-symbols-outlined text-[32px] text-tertiary-fixed">check_circle</span>
              <p className="font-headline-sm text-primary font-semibold">Zero resistance detected</p>
              <p className="text-[12px] text-outline">Tidak ada task pending. Sistem bersih. 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: CIRCADIAN ENERGY HEATMAP */}
      <div className="bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-md">
        <div className="flex items-center justify-between font-mono">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-primary font-semibold font-sans">
              Focus Quality &amp; Energy Topology
            </h3>
            <p className="font-body-sm text-body-sm text-outline font-sans">
              Computed live dari {focus.history.length} sesi fokus + {calendar.length} event kalender
            </p>
          </div>
          <div className="flex items-center gap-space-md font-label-sm text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-tertiary-fixed"></span> Peak (90-100%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-surface-container-highest"></span> Baseline (50-80%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-error/50"></span> Collapse (&lt;35%)
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 font-mono">
          <div className="grid grid-cols-8 font-label-sm text-[10px] text-outline px-1">
            <span>08:00</span>
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00</span>
            <span>20:00</span>
            <span className="text-right">22:00</span>
          </div>

          <div className="grid grid-cols-16 gap-1 h-9 bg-surface-container-lowest p-1 rounded-lg">
            {heat.map((v, i) => (
              <div key={i} className={`${heatClass(v)} rounded-sm transition-all`} title={`${String(i + 8).padStart(2, '0')}:00 — activity ${v}%`} />
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: INTERACTIVE CHAT TERMINAL & DIRECTIVES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Chat Box */}
        <div className="lg:col-span-8 bg-surface-container-low rounded-xl border border-outline-variant/20 shadow-sm flex flex-col h-[520px] overflow-hidden">
          <div className="p-space-sm border-b border-surface-container-highest flex items-center justify-between bg-surface-container-lowest/60 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-ping"></span>
              <span className="font-label-sm text-label-sm uppercase text-primary font-semibold">
                Live Context Stream
              </span>
            </div>
            <span className="font-mono text-label-sm text-outline">Indexed in LocalStorage</span>
          </div>

          {/* Messages stream */}
          <div className="flex-1 p-space-md overflow-y-auto flex flex-col gap-space-md">
            {mirrorAi.chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 text-label-sm text-outline mb-0.5 font-mono">
                  <span>{msg.sender === 'user' ? user.name : 'Mirror AI Engine'}</span>
                  <span>•</span>
                  <span>{msg.time}</span>
                </div>
                <div
                  className={`max-w-xl p-space-md rounded-xl shadow-sm text-body-default font-sans ${
                    msg.sender === 'user'
                      ? 'bg-primary text-on-primary font-medium'
                      : 'bg-surface-container text-on-surface border border-outline-variant/20'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Prompt Form */}
          <form
            onSubmit={handleSend}
            className="p-space-sm border-t border-surface-container-highest bg-surface-container-lowest flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask Mirror AI about tasks, habits, finance, or timeboxing..."
              className="flex-1 bg-surface-container-high px-space-md py-2.5 rounded-lg text-primary font-body-default outline-none focus:ring-1 focus:ring-tertiary-fixed"
            />
            <button
              type="submit"
              className="h-10 px-space-md bg-tertiary-fixed text-on-tertiary-fixed rounded-lg font-headline-sm font-semibold hover:bg-tertiary-fixed-dim transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </div>

        {/* Right Directives */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-sm">
            <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-mono">
              Active Behavioral Directives
            </span>
            <div className="flex flex-col gap-2 mt-1">
              {mirrorAi.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-space-sm rounded-lg bg-surface-container text-body-sm text-on-surface-variant flex items-start gap-2"
                >
                  <span className="font-mono text-tertiary-fixed font-bold">0{i + 1}</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
