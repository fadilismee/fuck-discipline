import React from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { useWebAudio } from '../hooks/useWebAudio';

const TargetTaskSelect: React.FC = () => {
  const tasks = useLifeOSStore((s) => s.data.tasks.filter((t) => !t.completed));
  const targetTaskId = useLifeOSStore((s) => s.data.focus.targetTaskId);
  const setFocusTarget = useLifeOSStore((s) => s.setFocusTarget);
  return (
    <select
      value={targetTaskId}
      onChange={(e) => {
        const t = useLifeOSStore.getState().data.tasks.find((x) => x.id === e.target.value);
        if (t) setFocusTarget(t.id, t.title, t.project);
      }}
      className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary text-[13px] outline-none focus:ring-1 focus:ring-tertiary-fixed min-h-[44px] w-full"
      aria-label="Pilih target task"
    >
      {tasks.map((t) => (<option key={t.id} value={t.id}>{t.title} — {t.project}</option>))}
    </select>
  );
};

export const FocusPage: React.FC = () => {
  const focus = useLifeOSStore((state) => state.data.focus);
  const timerState = useLifeOSStore((state) => state.timerState);
  const startTimer = useLifeOSStore((state) => state.startTimer);
  const pauseTimer = useLifeOSStore((state) => state.pauseTimer);
  const resetTimer = useLifeOSStore((state) => state.resetTimer);
  const addTimerMinutes = useLifeOSStore((state) => state.addTimerMinutes);
  const setTimerPreset = useLifeOSStore((state) => state.setTimerPreset);
  const setTimerMode = useLifeOSStore((state) => state.setTimerMode);
  const completeTimerSession = useLifeOSStore((state) => state.completeTimerSession);

  const { toggleBinauralBeats } = useWebAudio();
  // status audio diambil dari store global agar sinkron antar halaman
  const isAudioPlaying = focus.ambientPlaying;

  const isStopwatch = timerState.mode === 'stopwatch';
  const displaySecs = isStopwatch ? timerState.stopwatchSeconds : timerState.secondsRemaining;
  const m = Math.floor(displaySecs / 60);
  const s = displaySecs % 60;
  const progress = isStopwatch
    ? 100
    : Math.round(
        ((timerState.initialSeconds - timerState.secondsRemaining) / timerState.initialSeconds) * 100
      );

  const handleToggleAmbient = () => {
    toggleBinauralBeats(!isAudioPlaying, focus.volume || 50);
  };

  return (
    <div className="flex flex-col gap-space-2xl pb-space-2xl w-full animate-fade-in">
      {/* Top Workspace Controller Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-space-sm font-mono">
            <span className="font-kbd text-kbd px-1.5 py-0.5 bg-surface-container-high text-tertiary-fixed rounded">
              WORKSPACE :: CORE
            </span>
            <span className="font-label-sm text-label-sm text-outline">STATION / LIVE</span>
          </div>
          <h1 className="font-display text-display text-primary tracking-tight font-semibold mt-0.5">
            FOCUS WORKSPACE
          </h1>
        </div>

        {/* Mode & Ratio Selectors */}
        <div className="flex flex-wrap items-center gap-space-md font-mono">
          <div className="flex items-center p-0.5 bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/20" role="tablist" aria-label="Timer mode">
            <button
              role="tab"
              aria-selected={timerState.mode === 'timer'}
              onClick={() => setTimerMode('timer')}
              className={`px-space-md py-1.5 rounded-lg font-label-default text-label-default transition-all cursor-pointer flex items-center gap-1.5 ${
                timerState.mode === 'timer'
                  ? 'bg-tertiary-fixed/15 text-tertiary-fixed font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">timer</span>
              Timer
            </button>
            <button
              role="tab"
              aria-selected={timerState.mode === 'stopwatch'}
              onClick={() => setTimerMode('stopwatch')}
              className={`px-space-md py-1.5 rounded-lg font-label-default text-label-default transition-all cursor-pointer flex items-center gap-1.5 ${
                timerState.mode === 'stopwatch'
                  ? 'bg-tertiary-fixed/15 text-tertiary-fixed font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">timer_off</span>
              Stopwatch
            </button>
          </div>
          {timerState.mode === 'timer' ? (
          <div className="flex items-center p-0.5 bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/20">
            <button
              onClick={() => setTimerPreset(25)}
              className={`px-space-md py-1.5 rounded-lg font-label-default text-label-default transition-all cursor-pointer ${
                focus.presetMinutes === 25
                  ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              25 / 5 Standard
            </button>
            <button
              onClick={() => setTimerPreset(50)}
              className={`px-space-md py-1.5 rounded-lg font-label-default text-label-default transition-all cursor-pointer ${
                focus.presetMinutes === 50
                  ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              50 / 10 Deep
            </button>
            <button
              onClick={() => setTimerPreset(15)}
              className={`px-space-md py-1.5 rounded-lg font-label-default text-label-default transition-all cursor-pointer ${
                focus.presetMinutes === 15
                  ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              15m Sprint
            </button>
          </div>
          ) : (
          <div className="flex items-center gap-2 px-space-md py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 font-mono">
            <span className="material-symbols-outlined text-[15px] text-tertiary-fixed">info</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Count-up • no limit • save anytime</span>
          </div>
          )}
        </div>
      </div>

      {/* Central Focus Station Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
        {/* Main Visual Deck & Timer Station (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center p-space-2xl bg-surface-container-low rounded-xl relative overflow-hidden shadow-xl border border-outline-variant/20">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-tertiary-fixed/5 blur-3xl pointer-events-none rounded-full"></div>

          {/* Active Target Header Badge */}
          <div className="flex flex-wrap items-center justify-center gap-space-sm mb-space-xl z-10 font-mono">
            <span className="px-space-sm py-1 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold tracking-wide uppercase">
              {focus.targetTaskTitle || 'PRODUCTIV UI'}
            </span>
            <span className="text-outline font-label-sm text-label-sm">·</span>
            <span className="text-on-surface font-body-default text-body-default font-sans">
              Project:{' '}
              <span className="font-medium text-primary font-mono">{focus.targetProject || 'Productiv OS'}</span>
            </span>
            <span className="text-outline font-label-sm text-label-sm">·</span>
            <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-tertiary-fixed font-label-sm text-label-sm">
              Sprint Block #2
            </span>
          </div>

          {/* High-Contrast Zen Ring Display */}
          <div className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 flex flex-col items-center justify-center my-space-md sm:my-space-lg select-none">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
              <circle
                className="text-surface-container-highest"
                cx="120"
                cy="120"
                fill="transparent"
                r="108"
                stroke="currentColor"
                strokeWidth="5"
              ></circle>
              <circle
                className="text-tertiary-fixed transition-all duration-1000 ease-linear drop-shadow-[0_0_12px_rgba(111,251,190,0.45)]"
                cx="120"
                cy="120"
                fill="transparent"
                r="108"
                stroke="currentColor"
                strokeDasharray="678.58"
                strokeDashoffset={678.58 - (678.58 * progress) / 100}
                strokeLinecap="round"
                strokeWidth="5"
              ></circle>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-mono">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">
                {isStopwatch ? 'STOPWATCH' : 'FLOW INTERVAL'}
              </span>
              <div
                className="font-display text-[48px] sm:text-[64px] lg:text-[76px] leading-none text-primary font-semibold tracking-tighter my-2 drop-shadow-md"
                id="timerDisplay"
              >
                {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    timerState.isRunning ? 'bg-tertiary-fixed animate-ping' : 'bg-outline'
                  }`}
                ></span>
                <span className="font-label-default text-label-default text-tertiary-fixed font-medium">
                  {timerState.isRunning
                    ? isStopwatch
                      ? 'STOPWATCH RUNNING'
                      : 'DEEP FOCUS IN PROGRESS'
                    : isStopwatch
                    ? 'STOPWATCH READY'
                    : 'TIMER STANDBY'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-space-md mt-space-lg z-10 w-full max-w-md justify-center font-mono">
            <button
              onClick={() => {
                if (timerState.isRunning) pauseTimer();
                else startTimer();
              }}
              className={`w-full sm:w-auto px-space-xl h-11 rounded-lg font-headline-sm text-headline-sm font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-space-sm cursor-pointer ${
                timerState.isRunning
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed-dim'
                  : 'bg-primary text-on-primary hover:bg-primary-fixed'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] font-bold">
                {timerState.isRunning ? 'pause' : 'play_arrow'}
              </span>
              <span>{timerState.isRunning ? 'PAUSE FOCUS' : 'START FOCUS'}</span>
            </button>

            <div className="flex items-center gap-space-xs w-full sm:w-auto justify-center">
              <button
                onClick={() => addTimerMinutes(5)}
                className="h-11 px-space-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg font-label-default text-label-default font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Add 5 Minutes"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+5 Min</span>
              </button>
              <button
                onClick={completeTimerSession}
                className="h-11 px-space-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface rounded-lg font-label-default text-label-default font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Skip / Finish Session"
              >
                <span className="material-symbols-outlined text-[16px]">skip_next</span>
                <span>Skip</span>
              </button>
              <button
                onClick={resetTimer}
                className="h-11 w-11 flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface rounded-lg transition-colors cursor-pointer"
                title="Reset Session"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              </button>
            </div>
          </div>

          {/* Ambient Noise Bar */}
          <div className="mt-space-2xl pt-space-md flex flex-col gap-3 w-full border-t border-outline-variant/20 text-on-surface-variant font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-space-sm font-sans min-w-0">
                <span className="material-symbols-outlined text-[18px] text-tertiary-fixed shrink-0">headphones</span>
                <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">Binaural Alpha Waves (10Hz)</span>
                <span className="font-kbd text-[9px] px-1 py-0.5 rounded bg-surface-container-highest text-outline font-mono shrink-0">{isAudioPlaying ? 'LOOPING' : 'OFF'}</span>
              </div>
              <button onClick={handleToggleAmbient} className="h-9 px-3 bg-surface-container-high hover:bg-surface-container-highest text-primary text-label-sm font-medium rounded transition-colors cursor-pointer shrink-0">
                {isAudioPlaying ? 'Stop' : 'Play Alpha Waves'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[16px] text-outline">volume_down</span>
              <input type="range" min={0} max={100} value={focus.volume ?? 60} onChange={(e) => useLifeOSStore.getState().setFocusVolume(Number(e.target.value))} className="flex-1 accent-[#6ffbbe] h-1.5 cursor-pointer" aria-label="Ambient volume" />
              <span className="text-[11px] text-outline w-10 text-right">{focus.volume ?? 60}%</span>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline">Target Task (JSON)</label>
              <TargetTaskSelect />
            </div>
          </div>
        </div>

        {/* Right Side: Session Logs */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-sm font-mono">
            <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-sans">
              Today's Session History
            </span>
            <div className="flex flex-col gap-2 mt-1">
              {(focus.history || []).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-2 rounded bg-surface-container text-body-sm"
                >
                  <div className="flex flex-col truncate font-sans">
                    <span className="font-medium text-primary truncate">{h.task}</span>
                    <span className="text-outline text-label-sm font-mono">
                      {h.time} • {h.date}
                    </span>
                  </div>
                  <span className="font-mono text-tertiary-fixed font-bold">{h.duration}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
