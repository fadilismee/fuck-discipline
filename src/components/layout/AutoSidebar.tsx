import React, { useRef } from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';
import { ViewKey } from '../../types';

export const AutoSidebar: React.FC = () => {
  const isSidebarOpen = useLifeOSStore((state) => state.isSidebarOpen);
  const activeView = useLifeOSStore((state) => state.activeView);
  const setActiveView = useLifeOSStore((state) => state.setActiveView);
  const openSidebar = useLifeOSStore((state) => state.openSidebar);
  const closeSidebar = useLifeOSStore((state) => state.closeSidebar);
  const toggleSidebar = useLifeOSStore((state) => state.toggleSidebar);

  const activeTasksCount = useLifeOSStore(
    (state) => state.data.tasks.filter((t) => !t.completed).length
  );
  const activeProjectsCount = useLifeOSStore(
    (state) => state.data.projects.filter((p) => p.status === 'active').length
  );
  const routines = useLifeOSStore((state) => state.data.routines);
  const doneRoutinesCount = routines.filter((r) => r.doneToday).length;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    openSidebar();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      closeSidebar();
    }, 400);
  };

  const navItems: { key: ViewKey; label: string; icon: string; badge?: string | number }[] = [
    { key: 'today', label: 'Today', icon: 'wb_sunny' },
    { key: 'tasks', label: 'Tasks', icon: 'check_box', badge: activeTasksCount },
    { key: 'projects', label: 'Projects', icon: 'grid_view', badge: activeProjectsCount },
    { key: 'calendar', label: 'Calendar', icon: 'calendar_today' },
    { key: 'finance', label: 'Finance', icon: 'credit_card' },
    { key: 'routines', label: 'Routines', icon: 'repeat', badge: `${doneRoutinesCount}/${routines.length}` },
  ];

  const deepWorkItems: { key: ViewKey; label: string; icon: string; badge?: string }[] = [
    { key: 'focus', label: 'Focus', icon: 'adjust', badge: 'Live' },
    { key: 'review', label: 'Review', icon: 'check_circle' },
    { key: 'mirror', label: 'Mirror', icon: 'auto_awesome', badge: 'AI' },
  ];

  return (
    <>
      {/* 1. Invisible Left-Edge Hover Trigger Zone */}
      <div
        id="sidebar-hover-zone"
        onMouseEnter={handleMouseEnter}
        className="fixed left-0 top-0 bottom-0 w-4 z-40 cursor-pointer"
        title="Hover to show sidebar"
      />

      {/* 2. Floating Pill Arrow Toggle Button ( > ) */}
      <button
        id="sidebar-toggle-btn"
        onClick={(e) => {
          e.stopPropagation();
          toggleSidebar();
        }}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-surface-container-high/90 hover:bg-surface-container-highest border border-outline-variant/40 text-tertiary-fixed rounded-r-lg px-1.5 py-3 shadow-2xl transition-all duration-200 cursor-pointer flex items-center justify-center group"
        title="Toggle Navigation Sidebar"
      >
        <span
          className="material-symbols-outlined text-[16px] group-hover:scale-125 transition-transform"
          id="sidebar-toggle-arrow"
        >
          {isSidebarOpen ? 'chevron_left' : 'chevron_right'}
        </span>
      </button>

      {/* 3. Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-surface-container-lowest/60 backdrop-blur-[2px] z-40 transition-opacity duration-300"
        />
      )}

      {/* 4. Auto-Hide Sidebar Drawer */}
      <aside
        id="app-sidebar"
        onMouseEnter={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }}
        onMouseLeave={handleMouseLeave}
        className={`fixed left-0 top-0 h-full w-[240px] bg-surface-container-low border-r border-outline-variant/30 flex flex-col justify-between py-space-md z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-space-md">
          {/* Polished Brand Header */}
          <div
            onClick={() => setActiveView('today')}
            className="flex items-center justify-between px-space-md py-space-xs mx-space-xs rounded-xl hover:bg-surface-container/40 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="relative flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/30 shadow-inner group-hover:border-outline/50 transition-colors">
                <img
                  alt="PRODUCTIV App Logo"
                  className="h-5 w-auto object-contain"
                  src="https://lh3.googleusercontent.com/aida/AEtjO1XBh2iHKfTMnJu_MCyhBdZWvPsyuVuzJIhvujJeTCSXg0dT7XI5Ww0TeuVHrv-QZc_AAEHQPHjtqvtargM8-QmuWL5Kp52MI0_9Nho8F0OILvB_hw3jhxZcX7GLJ6eTpW29dkRZmX1NH1h0FkJZDb8IGzjKIKSws68t6K3wPWIxefvxxcw12WAHemUp7uaF50OBCJBY9-jLfy_p7kxY22926B57DlLl5SzCahio7_64LMMh2IR1tCctYEM"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-[14px] text-primary font-semibold tracking-tight leading-snug truncate">
                  PRODUCTIV
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed"></span>
                  <span className="font-label-sm text-[10px] text-outline font-medium tracking-wide uppercase">
                    v2.4 Pro
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeSidebar();
              }}
              className="w-6 h-6 flex items-center justify-center text-outline-variant hover:text-primary rounded transition-colors"
              title="Close Sidebar"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
          </div>

          <div className="mx-space-md h-[1px] bg-outline-variant/30"></div>

          {/* Nav List */}
          <div className="px-space-xs overflow-y-auto">
            <nav className="flex flex-col gap-1">
              {/* Section: System */}
              <div className="px-space-sm pt-2 pb-1 text-[11px] font-semibold text-outline uppercase tracking-wider select-none font-mono">
                System
              </div>

              {navItems.map((item) => {
                const isActive = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveView(item.key)}
                    className={`w-full text-left flex items-center justify-between px-space-sm h-8 rounded-lg transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-surface-container-high text-primary font-medium border border-outline-variant/40 shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`material-symbols-outlined text-[17px] ${
                          isActive ? 'text-tertiary-fixed' : 'text-outline group-hover:text-on-surface'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="font-body-default text-body-default">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="font-label-sm text-[11px] px-1.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Section: Deep Work & Insights */}
              <div className="px-space-sm pt-4 pb-1 text-[11px] font-semibold text-outline uppercase tracking-wider select-none font-mono">
                Deep Work &amp; Insights
              </div>

              {deepWorkItems.map((item) => {
                const isActive = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveView(item.key)}
                    className={`w-full text-left flex items-center justify-between px-space-sm h-8 rounded-lg transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-surface-container-high text-primary font-medium border border-outline-variant/40 shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`material-symbols-outlined text-[17px] ${
                          isActive ? 'text-tertiary-fixed' : 'text-outline group-hover:text-on-surface'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="font-body-default text-body-default">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="flex items-center gap-1 font-label-sm text-[10px] px-1.5 py-0.5 rounded-md bg-tertiary-fixed/10 text-tertiary-fixed border border-tertiary-fixed/20 font-mono">
                        {item.key === 'focus' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse"></span>
                        )}
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Utility / Settings */}
        <div className="px-space-xs pt-space-xs border-t border-outline-variant/30">
          <button
            onClick={() => setActiveView('settings')}
            className={`w-full text-left flex items-center justify-between px-space-sm h-8 rounded-lg transition-all duration-150 cursor-pointer ${
              activeView === 'settings'
                ? 'bg-surface-container-high text-primary font-medium border border-outline-variant/40 shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[17px] text-outline">settings</span>
              <span className="font-body-default text-body-default">Settings</span>
            </div>
            <kbd className="font-kbd text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-outline font-mono">
              ⌘,
            </kbd>
          </button>
        </div>
      </aside>
    </>
  );
};
