import React, { useMemo, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { useWebAudio } from '../hooks/useWebAudio';
import { BASE_TODAY_ISO, addDaysISO, last7 } from '../utils/date';

export const ReviewPage: React.FC = () => {
  const review = useLifeOSStore((state) => state.data.review);
  const tasks = useLifeOSStore((s) => s.data.tasks);
  const routines = useLifeOSStore((s) => s.data.routines);
  const focus = useLifeOSStore((s) => s.data.focus);
  const addReviewEntry = useLifeOSStore((state) => state.addReviewEntry);
  const deleteReviewEntry = useLifeOSStore((s) => s.deleteReviewEntry);
  const requestConfirm = useLifeOSStore((s) => s.requestConfirm);
  const exportSingleJson = useLifeOSStore((s) => s.exportSingleJson);
  const reviewPeriod = useLifeOSStore((s) => s.reviewPeriod);
  const setReviewPeriod = useLifeOSStore((s) => s.setReviewPeriod);
  const { playSuccessChime } = useWebAudio();

  const [win, setWin] = useState('');
  const [friction, setFriction] = useState('');
  const [decision, setDecision] = useState('');
  const [score, setScore] = useState(9);
  const [energy, setEnergy] = useState('High');

  // === Telemetri REAL sesuai periode aktif ===
  const scopeDays = useMemo(() => {
    if (reviewPeriod === 'daily') return [BASE_TODAY_ISO];
    if (reviewPeriod === 'weekly') return last7(BASE_TODAY_ISO);
    const out: string[] = [];
    for (let d = 1; d <= 30; d++) out.push(`2026-09-${String(d).padStart(2, '0')}`);
    return out;
  }, [reviewPeriod]);

  const inScope = (iso?: string) => !!iso && scopeDays.includes(iso);
  const taskDateOf = (t: (typeof tasks)[number]) => t.date || BASE_TODAY_ISO;
  const doneInScope = tasks.filter((t) => t.completed && inScope(t.completedAt || taskDateOf(t))).length;
  const totalInScope = tasks.filter((t) => inScope(taskDateOf(t)) || (t.completed && inScope(t.completedAt))).length;
  const velocity = totalInScope > 0 ? Math.round((doneInScope / totalInScope) * 100) : 0;

  const routineAdherence = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const r of routines) {
      for (const d of scopeDays) {
        total++;
        if (r.history?.[d] ?? (d === BASE_TODAY_ISO ? r.doneToday : false)) done++;
      }
    }
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [routines, scopeDays]);

  const focusMinutes = Math.round(
    focus.history
      .filter((h) => inScope(h.date))
      .reduce((a, h) => a + h.duration, 0)
  );
  const focusSessions = focus.history.filter((h) => inScope(h.date)).length;

  const trendDays = last7(BASE_TODAY_ISO);
  const trend = trendDays.map(
    (d) => tasks.filter((t) => t.completed && (t.completedAt || taskDateOf(t)) === d).length
  );
  const trendMax = Math.max(...trend, 1);

  const scopeEntries = review.history.filter((r) =>
    reviewPeriod === 'daily' ? r.period === 'daily' : reviewPeriod === 'weekly' ? r.period !== 'monthly' : true
  );
  const avgScore =
    scopeEntries.length > 0
      ? (scopeEntries.reduce((a, r) => a + r.productivityRating, 0) / scopeEntries.length).toFixed(1)
      : '—';
  const integrity = Math.round(velocity * 0.5 + routineAdherence.pct * 0.3 + (scopeEntries.length > 0 ? 20 : 5));

  const filteredHistory = scopeEntries;

  const autofill = () => {
    const topTask = tasks.filter((t) => t.completed && inScope(t.completedAt || taskDateOf(t)))[0];
    const pending = tasks.filter((t) => !t.completed && inScope(taskDateOf(t)));
    setWin(
      win ||
        (topTask
          ? `Shipped "${topTask.title}" + ${Math.max(0, doneInScope - 1)} task lain (${velocity}% velocity).`
          : `${doneInScope}/${totalInScope} task selesai (${velocity}% velocity).`)
    );
    setFriction(
      friction ||
        (pending.length > 0
          ? `${pending.length} task belum selesai, prioritas tertahan: "${pending[0].title}".`
          : 'Tidak ada friksi tercatat — semua task scope selesai.')
    );
    setDecision(
      decision ||
        (pending.length > 0
          ? `Blok 90 menit besok pagi khusus "${pending[0].title}", notifikasi mati.`
          : 'Pertahankan blok deep-work yang sama besok.')
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = addReviewEntry({ win, friction, decision, productivityRating: score, energyLevel: energy, period: reviewPeriod });
    if (r) {
      playSuccessChime();
      setWin(''); setFriction(''); setDecision('');
    }
  };

  return (
    <div className="flex flex-col gap-space-lg w-full animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg pb-space-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-xs text-outline font-label-sm uppercase tracking-widest font-mono">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary-fixed"></span>
            <span>Telemetry Protocol / Phase 04</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold font-sans">
            REVIEW &amp; REFLECTION
          </h1>
          <p className="font-body-default text-body-default text-on-surface-variant max-w-xl font-sans">
            Turn telemetry data into concrete weekly decisions. No endless journals — raw execution delta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm font-mono">
          <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-xl border border-outline-variant/20 shadow-sm">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button key={p} onClick={() => setReviewPeriod(p)} className={`px-space-md h-9 rounded-lg font-body-sm font-medium transition-colors capitalize min-w-[80px] ${reviewPeriod === p ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:text-primary'}`} type="button">
                {p === 'daily' ? 'Daily (26 Sep)' : p === 'weekly' ? 'Weekly (W39)' : 'Monthly (Sep)'}
              </button>
            ))}
          </div>
          <button onClick={() => exportSingleJson('review')} className="h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-primary text-[12px] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">download</span> review.json
          </button>
        </div>
      </div>

      {/* Main 2-Column Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start mt-space-md">
        {/* LEFT COLUMN: Telemetry Delta & Synthesis Form */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          {/* Day Throughput Delta Strip */}
          <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm border border-outline-variant/20 font-mono">
            <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-outline uppercase tracking-wider">
                  {reviewPeriod === 'daily' ? 'Day 26' : reviewPeriod === 'weekly' ? 'Week 39' : 'September'} Throughput Delta
                </span>
                <span className="font-kbd text-[10px] text-tertiary-fixed bg-surface-container-highest px-1.5 py-0.5 rounded">
                  EXEC_SYNCED
                </span>
              </div>
              <span className="font-label-default text-tertiary-fixed text-[11px]">
                {integrity}% System Integrity
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
              <div className="bg-surface-container rounded-lg p-space-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-[10px] uppercase">Tasks Complete</span>
                  <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">task_alt</span>
                </div>
                <div className="mt-2">
                  <div className="font-label-default text-headline-sm text-primary font-semibold">
                    {doneInScope} <span className="text-outline text-body-sm font-normal">/ {totalInScope}</span>
                  </div>
                  <div className="font-label-sm text-[10px] text-tertiary-fixed mt-0.5">{velocity}% velocity</div>
                </div>
              </div>

              <div className="bg-surface-container rounded-lg p-space-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-[10px] uppercase">Deep Work</span>
                  <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">timer</span>
                </div>
                <div className="mt-2">
                  <div className="font-label-default text-headline-sm text-primary font-semibold">{(focusMinutes / 60).toFixed(1)}h</div>
                  <div className="font-label-sm text-[10px] text-tertiary-fixed mt-0.5">{focusSessions} sessions</div>
                </div>
              </div>

              <div className="bg-surface-container rounded-lg p-space-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-[10px] uppercase">Routines</span>
                  <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">repeat</span>
                </div>
                <div className="mt-2">
                  <div className="font-label-default text-headline-sm text-primary font-semibold">
                    {routineAdherence.done} <span className="text-outline text-body-sm font-normal">/ {routineAdherence.total}</span>
                  </div>
                  <div className="font-label-sm text-[10px] text-tertiary-fixed mt-0.5">{routineAdherence.pct}% adherence</div>
                </div>
              </div>

              <div className="bg-surface-container rounded-lg p-space-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-[10px] uppercase">Energy Index</span>
                  <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">battery_charging_full</span>
                </div>
                <div className="mt-2">
                  <div className="font-label-default text-headline-sm text-primary font-semibold">{energy}</div>
                  <div className="font-label-sm text-[10px] text-tertiary-fixed mt-0.5">avg score {avgScore}/10</div>
                </div>
              </div>
            </div>

            {/* 7-day completion trend (real) */}
            <div className="flex items-end gap-1.5 h-16 pt-1" title={`Completed per day: ${trend.join(', ')}`}>
              {trend.map((v, i) => (
                <div key={trendDays[i]} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${trendDays[i].slice(5)}: ${v} done`}>
                  <div
                    className={`w-full rounded-sm transition-all ${v > 0 ? 'bg-tertiary-fixed/80' : 'bg-surface-container-highest'}`}
                    style={{ height: `${Math.max(8, Math.round((v / trendMax) * 100))}%` }}
                  />
                  <span className="font-mono text-[9px] text-outline">{trendDays[i].slice(8)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guided Retrospective Form */}
          <div className="bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between gap-2">
              <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-mono">
                Log {reviewPeriod === 'daily' ? 'Daily' : reviewPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Retrospective
              </span>
              <button
                type="button"
                onClick={autofill}
                className="h-8 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-tertiary-fixed text-[12px] font-medium transition-colors flex items-center gap-1.5 shrink-0"
                title="Isi draft otomatis dari data real"
              >
                <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                Autofill
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-space-md font-sans">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-[11px] uppercase text-outline font-mono">
                  Key Win / Deliverable
                </label>
                <textarea
                  rows={2}
                  value={win}
                  onChange={(e) => setWin(e.target.value)}
                  placeholder="What major outcome did you deliver today?"
                  className="bg-surface-container-lowest p-3 rounded-lg text-on-surface text-body-sm outline-none focus:ring-1 focus:ring-tertiary-fixed resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-[11px] uppercase text-outline font-mono">
                  Friction / Bottleneck
                </label>
                <textarea
                  rows={2}
                  value={friction}
                  onChange={(e) => setFriction(e.target.value)}
                  placeholder="What caused cognitive drag or distraction?"
                  className="bg-surface-container-lowest p-3 rounded-lg text-on-surface text-body-sm outline-none focus:ring-1 focus:ring-tertiary-fixed resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-[11px] uppercase text-outline font-mono">
                  Concrete Action Decision
                </label>
                <textarea
                  rows={2}
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder="What is your structural rule for tomorrow?"
                  className="bg-surface-container-lowest p-3 rounded-lg text-on-surface text-body-sm outline-none focus:ring-1 focus:ring-tertiary-fixed resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-md font-mono">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-[11px] uppercase text-outline">
                    Productivity Rating (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary font-mono outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-[11px] uppercase text-outline">Energy Level</label>
                  <select
                    value={energy}
                    onChange={(e) => setEnergy(e.target.value)}
                    className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary text-body-sm outline-none font-sans"
                  >
                    <option value="High">High (Flow state)</option>
                    <option value="Medium">Medium (Steady)</option>
                    <option value="Low">Low (Fatigued)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary-fixed transition-colors active:scale-95 shadow-md cursor-pointer"
              >
                Save Retrospective Log
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Historical Retrospectives */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          <div className="flex items-center justify-between font-mono">
            <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-sans">
              Historical Audit Logs
            </span>
            <span className="text-label-sm text-outline">{review.history.length} entries</span>
          </div>

          <div className="flex flex-col gap-space-sm">
            {filteredHistory.length === 0 && <p className="text-outline text-[13px] py-6 text-center">Belum ada log {reviewPeriod}. Isi form di kiri.</p>}
            {filteredHistory.map((r) => (
              <div key={r.id} className="bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-2 group">
                <div className="flex items-center justify-between border-b border-surface-container-highest pb-1 font-mono text-label-sm gap-2">
                  <span className="text-tertiary-fixed font-bold">{r.date} • {r.period}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-primary font-medium">Score: {r.productivityRating}/10 • {r.energyLevel}</span>
                    <button onClick={() => requestConfirm({ title: 'Hapus review?', message: `Catatan tanggal ${r.date} (${r.period}) akan dihapus permanen.`, onConfirm: () => deleteReviewEntry(r.id) })} aria-label="Delete review" className="w-8 h-8 rounded-lg flex items-center justify-center text-outline sm:opacity-0 sm:group-hover:opacity-100 hover:text-error hover:bg-error/10">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </span>
                </div>
                <div className="text-body-sm text-primary"><strong>Win:</strong> {r.win}</div>
                {r.friction && <div className="text-body-sm text-on-surface-variant"><strong>Friction:</strong> {r.friction}</div>}
                {r.decision && <div className="text-body-sm text-tertiary-fixed-dim"><strong>Rule:</strong> {r.decision}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
