import React, { useEffect, useRef, useState } from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';
import { useDocumentPip } from '../../hooks/useDocumentPip';
import { useWebAudio } from '../../hooks/useWebAudio';

function fmt(totalSecs: number) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const FloatingTimer: React.FC = () => {
  const timerState = useLifeOSStore((s) => s.timerState);
  const targetTaskTitle = useLifeOSStore((s) => s.data.focus.targetTaskTitle);
  const startTimer = useLifeOSStore((s) => s.startTimer);
  const pauseTimer = useLifeOSStore((s) => s.pauseTimer);
  const resetTimer = useLifeOSStore((s) => s.resetTimer);
  const setActiveView = useLifeOSStore((s) => s.setActiveView);
  const ambientPlaying = useLifeOSStore((s) => s.data.focus.ambientPlaying);
  const ambientVolume = useLifeOSStore((s) => s.data.focus.volume);
  const { toggleBinauralBeats } = useWebAudio();

  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; moved: boolean } | null>(null);
  const { pipOpen, openPip, closePip } = useDocumentPip();
  const autoPipTried = useRef(false);

  // Otomatis pop-out ke jendela always-on-top begitu timer/stopwatch jalan.
  // Tanpa perlu pencet apa-apa. Gagal diam-diam kalau browser menolak.
  useEffect(() => {
    if (timerState.isRunning && !pipOpen && !autoPipTried.current) {
      autoPipTried.current = true;
      void openPip(true);
    }
    if (!timerState.isRunning) {
      autoPipTried.current = false;
    }
  }, [timerState.isRunning, pipOpen, openPip]);

  // Judul tab ikut tampilkan waktu → kelihatan walau pindah tab browser
  useEffect(() => {
    const base = 'Productiv Life OS — Executive Terminal';
    if (timerState.isRunning) {
      const secs = timerState.mode === 'stopwatch' ? timerState.stopwatchSeconds : timerState.secondsRemaining;
      document.title = `⏱ ${fmt(secs)} • ${targetTaskTitle || 'Focus'} — Productiv`;
    } else {
      document.title = base;
    }
    return () => {
      document.title = base;
    };
  }, [timerState.isRunning, timerState.secondsRemaining, timerState.stopwatchSeconds, timerState.mode, targetTaskTitle]);

  const isStopwatch = timerState.mode === 'stopwatch';
  const dirty = isStopwatch
    ? timerState.stopwatchSeconds > 0
    : timerState.secondsRemaining !== timerState.initialSeconds;
  const shouldShow = (timerState.isRunning || dirty) && !dismissed;

  // Auto re-show when timer (re)starts; auto-hide state resets on full reset
  useEffect(() => {
    if (timerState.isRunning) setDismissed(false);
  }, [timerState.isRunning]);
  useEffect(() => {
    if (!dirty && !timerState.isRunning) setDismissed(false);
  }, [dirty, timerState.isRunning]);

  const onDragStart = (e: React.PointerEvent) => {
    // Only drag with primary button / touch
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
      moved: false,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    // Clamp so popup stays roughly on screen
    const nx = Math.min(0, Math.max(-window.innerWidth + 120, d.baseX + dx));
    const ny = Math.min(0, Math.max(-window.innerHeight + 140, d.baseY + dy));
    setOffset({ x: nx, y: ny });
  };
  const onDragEnd = () => {
    dragRef.current = null;
  };

  if (!shouldShow) return null;

  const displaySecs = isStopwatch ? timerState.stopwatchSeconds : timerState.secondsRemaining;
  const progress = isStopwatch
    ? 100
    : Math.round(((timerState.initialSeconds - timerState.secondsRemaining) / timerState.initialSeconds) * 100);

  const handleHide = () => {
    pauseTimer();
    setDismissed(true);
  };
  const handleReset = () => {
    resetTimer();
    setDismissed(true);
  };
  const goFocus = () => setActiveView('focus');

  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 animate-scale-in"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      role="dialog"
      aria-label={isStopwatch ? 'Stopwatch floating' : 'Focus timer floating'}
    >
      <div className="w-[270px] max-w-[calc(100vw-2rem)] rounded-xl border border-outline-variant/40 bg-surface-container-low/95 backdrop-blur-md shadow-2xl overflow-hidden">
        {/* Drag handle bar */}
        <div
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface-container border-b border-outline-variant/20 cursor-grab active:cursor-grabbing select-none touch-none"
          title="Drag untuk pindah posisi"
        >
          <span className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-outline/60" />
            <span className="w-1 h-1 rounded-full bg-outline/60" />
            <span className="w-1 h-1 rounded-full bg-outline/60" />
          </span>
          <span className={`flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider ${timerState.isRunning ? 'text-tertiary-fixed' : 'text-outline'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${timerState.isRunning ? 'bg-tertiary-fixed animate-ping' : 'bg-outline'}`} />
            {isStopwatch ? 'Stopwatch' : 'Focus Timer'}
            {timerState.isRunning ? ' • Live' : ' • Paused'}
          </span>
          <span className="ml-auto flex items-center">
            <button
              onClick={() => setMinimized((v) => !v)}
              className="w-7 h-7 flex items-center justify-center text-outline hover:text-primary rounded transition-colors"
              aria-label={minimized ? 'Expand' : 'Minimize'}
              title={minimized ? 'Expand' : 'Minimize'}
            >
              <span className="material-symbols-outlined text-[16px]">{minimized ? 'expand_less' : 'expand_more'}</span>
            </button>
            <button
              onClick={handleHide}
              className="w-7 h-7 flex items-center justify-center text-outline hover:text-error rounded transition-colors"
              aria-label="Hide popup"
              title="Hide (timer tetap tersimpan)"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </span>
        </div>

        {minimized ? (
          <button onClick={() => setMinimized(false)} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-surface-container transition-colors text-left" aria-label="Expand timer">
            <span className={`w-2 h-2 rounded-full shrink-0 ${timerState.isRunning ? 'bg-tertiary-fixed animate-pulse' : 'bg-outline'}`} />
            <span className="font-mono text-[18px] font-bold text-primary leading-none">{fmt(displaySecs)}</span>
            <span className="font-body-sm text-[11px] text-outline truncate flex-1">{targetTaskTitle || 'Deep Work'}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                if (pipOpen) closePip();
                else void openPip();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  if (pipOpen) closePip();
                  else void openPip();
                }
              }}
              className={`material-symbols-outlined text-[16px] shrink-0 ${pipOpen ? 'text-tertiary-fixed' : 'text-outline hover:text-primary'}`}
              title={pipOpen ? 'Tutup jendela pop-out' : 'Pop-out ke atas semua aplikasi'}
            >
              picture_in_picture_alt
            </span>
            <span className="material-symbols-outlined text-[16px] text-outline">expand_less</span>
          </button>
        ) : (
          <div className="p-3 flex flex-col gap-2.5">
            <button onClick={goFocus} className="text-left group" title="Buka Focus Workspace">
              <p className="font-body-sm text-[13px] text-primary font-medium truncate group-hover:text-tertiary-fixed transition-colors">
                {targetTaskTitle || 'Deep Work Session'}
              </p>
              <p className="font-mono text-[10px] text-outline uppercase tracking-wider">
                {isStopwatch ? 'count-up • no limit' : `countdown • ${Math.round(timerState.initialSeconds / 60)}m session`}
              </p>
            </button>

            <div className="flex items-end justify-between gap-2">
              <span className="font-mono text-[34px] leading-none font-bold text-primary tabular-nums">{fmt(displaySecs)}</span>
              <span className="font-mono text-[11px] text-tertiary-fixed font-bold mb-1">
                {isStopwatch ? 'ELAPSED' : `${progress}%`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
              {isStopwatch ? (
                <div className={`h-full rounded-full bg-tertiary-fixed transition-all ${timerState.isRunning ? 'animate-pulse w-full' : 'w-full opacity-40'}`} />
              ) : (
                <div className="h-full rounded-full bg-tertiary-fixed transition-all duration-1000" style={{ width: `${progress}%` }} />
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => (timerState.isRunning ? pauseTimer() : startTimer())}
                className={`flex-1 h-10 rounded-lg font-headline-sm text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  timerState.isRunning
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed-dim'
                    : 'bg-primary text-on-primary hover:bg-primary-fixed'
                }`}
                aria-label={timerState.isRunning ? 'Pause' : 'Resume'}
              >
                <span className="material-symbols-outlined text-[18px]">{timerState.isRunning ? 'pause' : 'play_arrow'}</span>
                {timerState.isRunning ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={handleReset}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
                aria-label="Reset timer"
                title="Reset"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              </button>
              <button
                onClick={() => (pipOpen ? closePip() : openPip())}
                className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-lg transition-colors ${
                  pipOpen
                    ? 'bg-tertiary-fixed/20 text-tertiary-fixed hover:bg-tertiary-fixed/30'
                    : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                }`}
                aria-label={pipOpen ? 'Tutup jendela pop-out' : 'Pop-out: tampil di atas semua aplikasi'}
                title={pipOpen ? 'Tutup jendela pop-out' : 'Pop-out: tampil di atas semua aplikasi (Chrome/Edge)'}
              >
                <span className="material-symbols-outlined text-[18px]">picture_in_picture_alt</span>
              </button>
              <button
                onClick={goFocus}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-tertiary-fixed transition-colors"
                aria-label="Open focus workspace"
                title="Buka Focus Workspace"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_full</span>
              </button>
            </div>

            {/* Ambient audio — sinkron global, tetap bunyi pindah page */}
            <div className="flex items-center gap-2 pt-1 border-t border-outline-variant/20">
              <button
                onClick={() => toggleBinauralBeats(!ambientPlaying, ambientVolume ?? 50)}
                className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg transition-colors ${
                  ambientPlaying ? 'text-tertiary-fixed bg-tertiary-fixed/15' : 'text-outline hover:text-primary hover:bg-surface-container-high'
                }`}
                aria-label={ambientPlaying ? 'Matikan alpha waves' : 'Nyalakan alpha waves'}
                title="Alpha Waves 10Hz (tetap bunyi pindah page)"
              >
                <span className="material-symbols-outlined text-[18px]">headphones</span>
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={ambientVolume ?? 50}
                onChange={(e) => toggleBinauralBeats(true, Number(e.target.value))}
                className="flex-1 accent-[#6ffbbe] h-1.5 cursor-pointer"
                aria-label="Volume alpha waves"
              />
              <span className="font-mono text-[10px] text-outline w-8 text-right">{ambientVolume ?? 50}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
