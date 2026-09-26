import React, { useEffect, useRef, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { canInstall, onInstallAvailabilityChange, requestInstall } from '../pwa/install';

export const SettingsPage: React.FC = () => {
  const settings = useLifeOSStore((state) => state.data.settings);
  const user = useLifeOSStore((state) => state.data.user);
  const finance = useLifeOSStore((state) => state.data.finance);
  const updateSettings = useLifeOSStore((state) => state.updateSettings);
  const updateUser = useLifeOSStore((state) => state.updateUser);
  const setDailyTarget = useLifeOSStore((state) => state.setDailyTarget);
  const exportJson = useLifeOSStore((state) => state.exportJson);
  const exportSingleJson = useLifeOSStore((s) => s.exportSingleJson);
  const importJson = useLifeOSStore((state) => state.importJson);
  const resetToDefault = useLifeOSStore((state) => state.resetToDefault);
  const requestConfirm = useLifeOSStore((s) => s.requestConfirm);
  const showToast = useLifeOSStore((s) => s.showToast);
  const lock = useLifeOSStore((s) => s.lock);
  const [, bump] = useState(0);

  useEffect(() => onInstallAvailabilityChange(() => bump((n) => n + 1)), []);

  const handleInstall = async () => {
    const outcome = await requestInstall();
    if (outcome === 'unavailable') {
      showToast('Buka lewat Chrome/Edge di HP lalu pilih "Add to Home screen"', 'info');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      showToast('File harus berformat .json', 'info');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('File terlalu besar (max 5MB)', 'info');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const str = evt.target?.result as string;
      const success = importJson(str);
      if (!success) showToast('Format JSON tidak valid (butuh tasks+user)', 'info');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-space-lg w-full animate-fade-in">
      {/* Status Bar */}
      <div className="flex items-center justify-between py-space-sm px-space-md bg-surface-container-low rounded-xl border border-outline-variant/20 font-mono text-label-sm">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs text-on-surface">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed shadow-sm"></span>
            <span className="text-tertiary-fixed font-semibold tracking-wider">SYSTEM CONFIG</span>
          </div>
          <span className="text-outline">|</span>
          <span className="text-on-surface-variant uppercase tracking-widest">
            Target: Node-01 (Hydra Core)
          </span>
        </div>
        <div className="flex items-center gap-space-md">
          <span className="text-outline">
            LATENCY: <span className="text-tertiary-fixed">4ms</span>
          </span>
          <span className="text-outline">
            STORE: <span className="text-on-surface">LocalStorage JSON Store</span>
          </span>
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-kbd">
            REVISION 8C4E2
          </span>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start mt-space-xs">
        <div className="lg:col-span-8 flex flex-col gap-space-md">
          {/* User Profile */}
          <div className="bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-md">
            <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-mono">
              User Profile &amp; Node Identity
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-[11px] uppercase text-outline font-mono">
                  Display Name
                </label>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => updateUser({ name: e.target.value })}
                  className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary font-body-default outline-none focus:ring-1 focus:ring-tertiary-fixed"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-[11px] uppercase text-outline font-mono">
                  Role / Title
                </label>
                <input
                  type="text"
                  value={user.title}
                  onChange={(e) => updateUser({ title: e.target.value })}
                  className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary font-body-default outline-none focus:ring-1 focus:ring-tertiary-fixed"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-md font-mono">
            <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-sans">
              Timer &amp; Sound Preferences
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-[11px] uppercase text-outline">
                  Pomodoro Standard (Minutes)
                </label>
                <input
                  type="number"
                  value={settings.pomodoroDuration}
                  onChange={(e) => updateSettings({ pomodoroDuration: Number(e.target.value) || 25 })}
                  className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none focus:ring-1 focus:ring-tertiary-fixed"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-[11px] uppercase text-outline">
                  Daily Spending Cap (IDR)
                </label>
                <input
                  type="number"
                  value={finance.dailyTarget}
                  onChange={(e) => setDailyTarget(Number(e.target.value) || 100000)}
                  className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none focus:ring-1 focus:ring-tertiary-fixed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-surface-container-highest font-sans gap-3">
              <span className="text-body-default text-primary text-[14px]">Web Audio Synthesizer Effects</span>
              <button onClick={() => updateSettings({ soundEffects: !settings.soundEffects })} role="switch" aria-checked={settings.soundEffects} className={`w-12 h-7 shrink-0 rounded-full p-1 transition-colors ${settings.soundEffects ? 'bg-tertiary-fixed' : 'bg-surface-container-highest'}`}>
                <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.soundEffects ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-surface-container-highest font-sans gap-3">
              <span className="text-body-default text-primary text-[14px]">Telemetry & Analytics</span>
              <button onClick={() => updateSettings({ telemetryEnabled: !settings.telemetryEnabled })} role="switch" aria-checked={settings.telemetryEnabled} className={`w-12 h-7 shrink-0 rounded-full p-1 transition-colors ${settings.telemetryEnabled ? 'bg-tertiary-fixed' : 'bg-surface-container-highest'}`}>
                <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.telemetryEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-surface-container-highest font-sans gap-3">
              <span className="text-body-default text-primary text-[14px]">Notifications</span>
              <button onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })} role="switch" aria-checked={settings.notificationsEnabled} className={`w-12 h-7 shrink-0 rounded-full p-1 transition-colors ${settings.notificationsEnabled ? 'bg-tertiary-fixed' : 'bg-surface-container-highest'}`}>
                <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-surface-container-highest font-sans gap-3">
              <div className="flex flex-col">
                <span className="text-body-default text-primary text-[14px]">Lock Terminal (PIN)</span>
                <span className="font-mono text-[11px] text-outline">Kunci app sekarang, buka pakai PIN</span>
              </div>
              <button onClick={lock} className="h-9 px-3 shrink-0 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-body-sm font-medium transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                Lock
              </button>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-surface-container-highest font-sans gap-3">
              <div className="flex flex-col">
                <span className="text-body-default text-primary text-[14px]">Install App (PWA)</span>
                <span className="font-mono text-[11px] text-outline">Jadi app HP fullscreen + offline</span>
              </div>
              <button
                onClick={handleInstall}
                disabled={!canInstall()}
                title={canInstall() ? 'Install ke HP' : 'Buka lewat browser HP untuk install'}
                className="h-9 px-3 shrink-0 rounded-lg bg-tertiary-fixed/15 text-tertiary-fixed hover:bg-tertiary-fixed hover:text-on-tertiary-fixed font-body-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[16px]">install_mobile</span>
                Install
              </button>
            </div>
          </div>

          {/* Data Persistence & JSON Backups */}
          <div className="bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-md">
            <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-mono">
              Data Persistence &amp; Backups
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant font-sans">
              All your tasks, routines, finance ledger, and focus history are preserved in LocalStorage. You can export or import the entire JSON state at any time.
            </p>

            <div className="flex flex-wrap items-center gap-space-sm pt-2 font-sans">
              <button onClick={exportJson} className="h-10 px-space-md bg-primary text-on-primary font-medium rounded-lg text-body-sm hover:bg-primary-fixed transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95">
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Export All JSON</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="h-10 px-space-md bg-surface-container-high hover:bg-surface-container-highest text-primary font-medium rounded-lg text-body-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95">
                <span className="material-symbols-outlined text-[16px]">file_upload</span>
                <span>Import JSON</span>
              </button>
              <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => requestConfirm({ title: 'Reset semua data?', message: 'Seluruh data akan dikembalikan ke bawaan file JSON seed. Export backup dulu bila perlu.', confirmLabel: 'Reset', onConfirm: () => resetToDefault() })} className="h-10 px-space-md bg-error/20 text-error hover:bg-error/30 font-medium rounded-lg text-body-sm transition-colors flex items-center gap-1.5 cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Reset</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {(['tasks', 'projects', 'routines', 'finance', 'calendar', 'review', 'focus', 'settings', 'user', 'mirrorAi'] as const).map((k) => (
                <button key={k} onClick={() => exportSingleJson(k)} className="h-9 px-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant hover:text-primary text-[11px] font-mono border border-outline-variant/20 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">download</span>{k}.json
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info */}
        <div className="lg:col-span-4 bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-sm font-mono text-label-sm">
          <span className="text-tertiary-fixed font-bold uppercase">System Telemetry</span>
          <div className="flex justify-between py-1 border-b border-surface-container-highest text-outline">
            <span>Framework</span>
            <span className="text-primary font-sans">Vite + React (TypeScript)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-surface-container-highest text-outline">
            <span>State Engine</span>
            <span className="text-tertiary-fixed">Zustand + LocalStorage</span>
          </div>
          <div className="flex justify-between py-1 border-b border-surface-container-highest text-outline">
            <span>Sidebar Mode</span>
            <span className="text-tertiary-fixed">Auto-Hide Hover &amp; Arrow Toggle</span>
          </div>
          <div className="flex justify-between py-1 text-outline">
            <span>Status</span>
            <span className="text-tertiary-fixed">Optimal (100%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
