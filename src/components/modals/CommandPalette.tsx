import React, { useState, useEffect, useRef } from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';
import { ViewKey } from '../../types';

export const CommandPalette: React.FC = () => {
  const isCmdkOpen = useLifeOSStore((state) => state.isCmdkOpen);
  const closeCmdk = useLifeOSStore((state) => state.closeCmdk);
  const setActiveView = useLifeOSStore((state) => state.setActiveView);
  const openTaskModal = useLifeOSStore((state) => state.openTaskModal);
  const openExpenseModal = useLifeOSStore((state) => state.openExpenseModal);
  const openDrawer = useLifeOSStore((state) => state.openDrawer);
  const exportJson = useLifeOSStore((state) => state.exportJson);
  const startTimer = useLifeOSStore((state) => state.startTimer);
  const pauseTimer = useLifeOSStore((state) => state.pauseTimer);
  const isTimerRunning = useLifeOSStore((state) => state.timerState.isRunning);
  const tasks = useLifeOSStore((state) => state.data.tasks);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCmdkOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCmdkOpen]);

  if (!isCmdkOpen) return null;

  interface CommandItem {
    type: string;
    title: string;
    icon: string;
    action: () => void;
  }

  const baseCommands: CommandItem[] = [
    { type: 'view', title: 'Go to Today Dashboard', icon: 'wb_sunny', action: () => setActiveView('today') },
    { type: 'view', title: 'Go to Tasks Workstream', icon: 'check_box', action: () => setActiveView('tasks') },
    { type: 'view', title: 'Go to Calendar Schedule', icon: 'calendar_month', action: () => setActiveView('calendar') },
    { type: 'view', title: 'Go to Projects Matrix', icon: 'grid_view', action: () => setActiveView('projects') },
    { type: 'view', title: 'Go to Focus Workspace & Timer', icon: 'timer', action: () => setActiveView('focus') },
    { type: 'view', title: 'Go to Routines & Habit Tracker', icon: 'repeat', action: () => setActiveView('routines') },
    { type: 'view', title: 'Go to Finance & Ledger', icon: 'credit_card', action: () => setActiveView('finance') },
    { type: 'view', title: 'Go to Review & Reflection Journal', icon: 'insights', action: () => setActiveView('review') },
    { type: 'view', title: 'Go to Mirror AI Intelligence', icon: 'smart_toy', action: () => setActiveView('mirror') },
    { type: 'view', title: 'Go to System Settings & Backups', icon: 'settings', action: () => setActiveView('settings') },
    { type: 'action', title: 'Create New Detailed Task', icon: 'add_task', action: () => openTaskModal() },
    { type: 'action', title: 'Log Daily Expense', icon: 'add_card', action: () => openExpenseModal() },
    { type: 'action', title: isTimerRunning ? 'Pause Focus Timer' : 'Start Focus Timer', icon: 'play_circle', action: () => (isTimerRunning ? pauseTimer() : startTimer()) },
    { type: 'action', title: 'Export JSON Backup File', icon: 'download', action: () => exportJson() },
  ];

  const taskCommands: CommandItem[] = tasks.map((t) => ({
    type: 'task',
    title: `Task: ${t.title} [${t.project}]`,
    icon: t.completed ? 'task_alt' : 'radio_button_unchecked',
    action: () => {
      setActiveView('tasks');
      openDrawer(t.id);
    },
  }));

  const allCommands = [...baseCommands, ...taskCommands];
  const filtered = allCommands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );
  const safeIndex = filtered.length === 0 ? 0 : Math.min(selectedIndex, filtered.length - 1);

  const runCommand = (cmd: CommandItem) => {
    closeCmdk();
    cmd.action();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[safeIndex];
      if (cmd) runCommand(cmd);
    }
  };

  return (
    <div
      onClick={closeCmdk}
      className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4 transition-opacity duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container-low rounded-xl w-full max-w-2xl border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center px-space-md py-3 border-b border-surface-container-highest bg-surface-container">
          <span className="material-symbols-outlined text-[20px] text-tertiary-fixed mr-2">
            terminal
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command or search tasks, routines, finance..."
            className="flex-1 bg-transparent text-primary placeholder:text-outline font-body-default outline-none text-base"
          />
          <button
            onClick={closeCmdk}
            className="text-outline hover:text-primary cursor-pointer"
          >
            <kbd className="font-kbd text-[10px] px-1.5 py-0.5 bg-surface-container-highest rounded text-outline font-mono">
              ESC
            </kbd>
          </button>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2 flex flex-col gap-1">
          {filtered.length > 0 ? (
            filtered.map((cmd, i) => (
              <div
                key={i}
                onClick={() => runCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`flex items-center justify-between px-space-md py-2.5 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface ${
                  i === safeIndex ? 'bg-surface-container' : ''
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">
                    {cmd.icon}
                  </span>
                  <span className="font-body-default text-body-default text-primary">
                    {cmd.title}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm uppercase text-outline font-mono">
                  {cmd.type}
                </span>
              </div>
            ))
          ) : (
            <div className="p-space-md text-center text-outline font-label-default font-mono">
              No matching commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
