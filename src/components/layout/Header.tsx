import React, { useEffect, useRef } from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';

export const Header: React.FC = () => {
  const toggleSidebar = useLifeOSStore((state) => state.toggleSidebar);
  const openCmdk = useLifeOSStore((state) => state.openCmdk);
  const openTaskModal = useLifeOSStore((state) => state.openTaskModal);
  const setActiveView = useLifeOSStore((state) => state.setActiveView);
  const dateStr = useLifeOSStore((state) => state.data.user.dateStr);
  const isNotifOpen = useLifeOSStore((s) => s.isNotifOpen);
  const setNotifOpen = useLifeOSStore((s) => s.setNotifOpen);
  const tasks = useLifeOSStore((s) => s.data.tasks);
  const routines = useLifeOSStore((s) => s.data.routines);
  const openDrawer = useLifeOSStore((s) => s.openDrawer);
  const lock = useLifeOSStore((s) => s.lock);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isNotifOpen) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setNotifOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [isNotifOpen, setNotifOpen]);

  const overdue = tasks.filter((t) => t.status === 'overdue' && !t.completed);
  const todayPending = tasks.filter((t) => !t.completed && (t.status === 'today' || t.due?.toLowerCase().includes('today')));
  const undoneRoutines = routines.filter((r) => !r.doneToday);
  const notifCount = overdue.length + todayPending.length;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 z-30 flex items-center justify-between px-3 sm:px-space-xl gap-2">
      <div className="flex items-center gap-space-sm min-w-0">
        <button
          onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
          className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest text-tertiary-fixed border border-outline-variant/30 transition-colors cursor-pointer"
          title="Open Navigation Menu" aria-label="Menu"
        >
          <span className="material-symbols-outlined text-[18px]">menu</span>
        </button>
        <span className="font-label-default text-label-default text-outline uppercase font-mono hidden sm:inline">WORKSPACE /</span>
        <span className="font-body-default text-body-default text-on-surface font-medium truncate text-[13px] sm:text-[14px]">
          {(() => {
            const full = dateStr ? dateStr.split('—')[0].trim() : 'Saturday, 26 September 2026';
            const parts = full.replace(',', '').split(' ');
            // Mobile: "Sat, 26 Sep" — Desktop: full string
            const short = parts.length >= 4 ? `${parts[0].slice(0, 3)}, ${parts[1]} ${parts[2].slice(0, 3)}` : full;
            return <><span className="sm:hidden">{short}</span><span className="hidden sm:inline">{full}</span></>;
          })()}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-space-md shrink-0">
        <button onClick={openCmdk} className="flex items-center gap-space-md h-9 px-2 sm:px-space-md bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface-variant hover:border-outline transition-colors cursor-pointer" type="button" aria-label="Search">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant hidden md:inline">Search or type...</span>
          </div>
          <kbd className="font-kbd text-kbd px-1 py-0.5 bg-surface-container-high text-on-surface rounded font-mono hidden sm:inline">⌘K</kbd>
        </button>

        <button onClick={openTaskModal} className="flex items-center gap-1 h-9 px-2 sm:px-space-sm bg-primary text-on-primary rounded-lg hover:bg-primary-fixed transition-colors font-body-sm text-body-sm font-medium cursor-pointer shadow-sm active:scale-95 min-w-[36px] justify-center" type="button" aria-label="New task">
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden sm:inline">Capture</span>
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setNotifOpen(!isNotifOpen)}
            className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors cursor-pointer ${isNotifOpen ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
            type="button" title="System Notifications" aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center border border-surface font-mono">{notifCount > 9 ? '9+' : notifCount}</span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-11 w-[320px] max-w-[85vw] bg-surface-container-low border border-outline-variant/40 rounded-xl shadow-2xl overflow-hidden animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-surface-container-highest flex items-center justify-between">
                <span className="font-headline-sm font-semibold text-primary text-[14px]">Notifications</span>
                <span className="font-mono text-[11px] text-tertiary-fixed">{notifCount} unread</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto flex flex-col">
                {overdue.map((t) => (
                  <button key={t.id} onClick={() => { openDrawer(t.id); setNotifOpen(false); setActiveView('tasks'); }} className="text-left px-4 py-3 hover:bg-surface-container-high border-b border-surface-container-highest/50 flex gap-2 items-start">
                    <span className="material-symbols-outlined text-error text-[18px] mt-0.5">warning</span>
                    <span><span className="block text-[13px] text-primary font-medium truncate">{t.title}</span><span className="block text-[11px] text-error font-mono">Overdue • {t.due}</span></span>
                  </button>
                ))}
                {todayPending.slice(0, 4).map((t) => (
                  <button key={t.id} onClick={() => { openDrawer(t.id); setNotifOpen(false); }} className="text-left px-4 py-3 hover:bg-surface-container-high border-b border-surface-container-highest/50 flex gap-2 items-start">
                    <span className="material-symbols-outlined text-tertiary-fixed text-[18px] mt-0.5">radio_button_unchecked</span>
                    <span><span className="block text-[13px] text-primary font-medium truncate">{t.title}</span><span className="block text-[11px] text-outline font-mono">Due {t.due} • {t.project}</span></span>
                  </button>
                ))}
                {undoneRoutines.slice(0, 2).map((r) => (
                  <button key={r.id} onClick={() => { setNotifOpen(false); setActiveView('routines'); }} className="text-left px-4 py-3 hover:bg-surface-container-high flex gap-2 items-start">
                    <span className="material-symbols-outlined text-secondary-fixed text-[18px] mt-0.5">repeat</span>
                    <span><span className="block text-[13px] text-primary font-medium truncate">{r.title}</span><span className="block text-[11px] text-outline font-mono">Routine • {r.time} • {r.streak}d streak</span></span>
                  </button>
                ))}
                {notifCount === 0 && (
                  <div className="px-4 py-8 text-center text-outline text-[13px]">All clear. No pending alerts 🎉</div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={lock}
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors cursor-pointer"
          type="button" title="Lock Terminal" aria-label="Lock terminal"
        >
          <span className="material-symbols-outlined text-[20px]">lock</span>
        </button>

        <div onClick={() => setActiveView('settings')} className="flex items-center gap-space-sm pl-2 sm:pl-space-xs border-l border-outline-variant/30 cursor-pointer" title="Go to Settings">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-surface-container-highest text-primary font-bold border border-outline-variant/50 text-[14px]">
            <span>F</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-tertiary-fixed border-2 border-surface"></span>
          </div>
        </div>
      </div>
    </header>
  );
};
