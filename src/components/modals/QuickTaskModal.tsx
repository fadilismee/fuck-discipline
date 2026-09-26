import React, { useState } from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';
import { useWebAudio } from '../../hooks/useWebAudio';

export const QuickTaskModal: React.FC = () => {
  const isTaskModalOpen = useLifeOSStore((state) => state.isTaskModalOpen);
  const closeTaskModal = useLifeOSStore((state) => state.closeTaskModal);
  const addTask = useLifeOSStore((state) => state.addTask);
  const { playBeep } = useWebAudio();

  const [title, setTitle] = useState('');
  const [project, setProject] = useState('Productiv');
  const [priority, setPriority] = useState<'high' | 'med' | 'low'>('med');
  const [est, setEst] = useState('1h est');
  const [due, setDue] = useState('Today');
  const [notes, setNotes] = useState('');

  if (!isTaskModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      project,
      priority,
      est: est || '1h est',
      due: due || 'Today',
      status: 'today',
      notes,
    });

    playBeep(659.25, 'sine', 0.15);
    setTitle('');
    setNotes('');
    setEst('1h est');
    setDue('Today');
    closeTaskModal();
  };

  return (
    <div
      onClick={closeTaskModal}
      className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container-low rounded-xl p-space-lg w-full max-w-md border border-outline-variant/40 shadow-2xl flex flex-col gap-space-md"
      >
        <div className="flex items-center justify-between border-b border-surface-container-highest pb-space-xs">
          <span className="font-headline-sm text-headline-sm text-primary font-bold">
            New Detailed Task
          </span>
          <button
            onClick={closeTaskModal}
            className="text-outline hover:text-primary cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">
              Task Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement API route handler"
              className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary text-body-default outline-none focus:ring-1 focus:ring-tertiary-fixed"
            />
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline">Project</label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary text-body-sm outline-none"
              >
                <option value="Productiv">Productiv</option>
                <option value="Learning">Learning</option>
                <option value="Health">Health</option>
                <option value="Finance">Finance</option>
                <option value="Inbox">Inbox</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary text-body-sm outline-none"
              >
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline">Estimate</label>
              <input
                type="text"
                value={est}
                onChange={(e) => setEst(e.target.value)}
                placeholder="e.g. 1h est"
                className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary text-body-sm outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline">Due</label>
              <input
                type="text"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                placeholder="e.g. Today 23:59"
                className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary text-body-sm outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">
              Notes / Context
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="bg-surface-container-lowest p-2.5 rounded-lg text-primary text-body-sm outline-none focus:ring-1 focus:ring-tertiary-fixed resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-space-xs">
            <button
              type="button"
              onClick={closeTaskModal}
              className="px-space-md h-8 text-on-surface-variant hover:text-primary text-body-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-space-md h-8 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg text-body-sm font-semibold hover:bg-tertiary-fixed-dim cursor-pointer active:scale-95 transition-transform"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
