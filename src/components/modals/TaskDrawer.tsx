import React, { useState } from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';
import { useWebAudio } from '../../hooks/useWebAudio';

export const TaskDrawer: React.FC = () => {
  const isDrawerOpen = useLifeOSStore((state) => state.isDrawerOpen);
  const selectedTaskId = useLifeOSStore((state) => state.selectedTaskId);
  const closeDrawer = useLifeOSStore((state) => state.closeDrawer);
  const tasks = useLifeOSStore((state) => state.data.tasks);
  const updateTask = useLifeOSStore((state) => state.updateTask);
  const deleteTask = useLifeOSStore((state) => state.deleteTask);
  const toggleTask = useLifeOSStore((state) => state.toggleTask);
  const addSubtask = useLifeOSStore((state) => state.addSubtask);
  const toggleSubtask = useLifeOSStore((state) => state.toggleSubtask);
  const setActiveView = useLifeOSStore((state) => state.setActiveView);
  const startTimer = useLifeOSStore((state) => state.startTimer);
  const setFocusTarget = useLifeOSStore((state) => state.setFocusTarget);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteSubtask = useLifeOSStore((s) => s.deleteSubtask);
  const { playSuccessChime, playBeep } = useWebAudio();

  const task = tasks.find((t) => t.id === selectedTaskId);

  if (!isDrawerOpen || !task) return null;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    playBeep(659.25, 'sine', 0.1);
  };

  const handleInitiateFocus = () => {
    setFocusTarget(task.id, task.title, task.project);
    setActiveView('focus');
    startTimer();
    closeDrawer();
  };

  return (
    <>
      <div
        onClick={closeDrawer}
        className="fixed inset-0 bg-surface-container-lowest/40 backdrop-blur-[1px] z-50 transition-opacity duration-200"
      />

      <aside className="fixed top-14 right-0 bottom-0 w-full sm:w-[460px] bg-surface-container-low border-l border-outline-variant/30 shadow-2xl z-50 transform translate-x-0 transition-transform duration-200 ease-in-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-space-md py-space-sm border-b border-surface-container-highest bg-surface-container">
          <span className="font-mono text-label-sm uppercase text-outline">Task Inspector</span>
          <button
            onClick={closeDrawer}
            className="w-7 h-7 flex items-center justify-center text-outline hover:text-primary rounded transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-space-md overflow-y-auto flex flex-col gap-space-md">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-highest">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => {
                  toggleTask(task.id);
                  if (!task.completed) playSuccessChime();
                  else playBeep(440, 'sine', 0.1);
                }}
                className="w-4 h-4 rounded bg-surface-container-lowest accent-tertiary-fixed cursor-pointer"
              />
              <span className="font-label-sm text-label-sm uppercase text-tertiary-fixed font-mono">
                {task.project} / {task.id}
              </span>
            </div>
            {confirmDelete ? (
              <div className="flex items-center gap-1.5 animate-scale-in">
                <span className="text-[11px] text-error font-mono">Hapus?</span>
                <button onClick={() => deleteTask(task.id)} className="h-8 px-2.5 rounded-lg bg-error text-white text-[12px] font-semibold">Yes</button>
                <button onClick={() => setConfirmDelete(false)} className="h-8 px-2.5 rounded-lg bg-surface-container-high text-primary text-[12px]">No</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="w-9 h-9 flex items-center justify-center text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer" title="Delete Task" aria-label="Delete task">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            )}
          </div>

          {/* Title input */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">Task Title</label>
            <input
              type="text"
              value={task.title}
              onChange={(e) => updateTask(task.id, { title: e.target.value })}
              className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary font-headline-sm font-semibold outline-none focus:ring-1 focus:ring-tertiary-fixed"
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-space-sm bg-surface-container-lowest p-space-sm rounded-xl font-mono">
            <div className="col-span-2">
              <span className="font-label-sm text-[10px] uppercase text-outline">Board Status (sama kayak kolom Kanban)</span>
              <select
                value={task.completed ? 'completed' : task.status}
                onChange={(e) => {
                  const v = e.target.value as 'today' | 'upcoming' | 'completed';
                  useLifeOSStore.getState().moveTask(task.id, v);
                }}
                className="w-full bg-surface-container-high text-primary rounded px-2 py-1.5 text-label-sm font-medium mt-1 outline-none"
              >
                <option value="upcoming">To Do</option>
                <option value="today">Doing (Today)</option>
                <option value="completed">Done</option>
              </select>
            </div>
            <div>
              <span className="font-label-sm text-[10px] uppercase text-outline">Priority</span>
              <select
                value={task.priority}
                onChange={(e) => updateTask(task.id, { priority: e.target.value as any })}
                className="w-full bg-surface-container-high text-primary rounded px-2 py-1 text-label-sm font-medium mt-1 outline-none"
              >
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <span className="font-label-sm text-[10px] uppercase text-outline">Due Date</span>
              <input
                type="text"
                value={task.due}
                onChange={(e) => updateTask(task.id, { due: e.target.value })}
                className="w-full bg-surface-container-high text-primary rounded px-2 py-1 text-label-sm font-medium mt-1 outline-none"
              >
              </input>
            </div>
            <div>
              <span className="font-label-sm text-[10px] uppercase text-outline">Estimate</span>
              <input
                type="text"
                value={task.est}
                onChange={(e) => updateTask(task.id, { est: e.target.value })}
                className="w-full bg-surface-container-high text-primary rounded px-2 py-1 text-label-sm font-medium mt-1 outline-none"
              />
            </div>
            <div>
              <span className="font-label-sm text-[10px] uppercase text-outline">Time Spent</span>
              <span className="block text-tertiary-fixed font-mono font-medium text-label-sm mt-1 px-1">
                {task.timeSpent || '0m'}
              </span>
            </div>
          </div>

          {/* Subtasks */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-outline font-mono">
                Subtasks ({(task.subtasks || []).filter((s) => s.done).length}/
                {(task.subtasks || []).length})
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {(task.subtasks || []).map((s) => (
                <div key={s.id} className="group/sub flex items-center justify-between p-1.5 rounded bg-surface-container hover:bg-surface-container-high transition-colors gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <input type="checkbox" checked={s.done} onChange={() => { toggleSubtask(task.id, s.id); if (!s.done) playBeep(784, 'sine', 0.08); }} className="w-5 h-5 shrink-0 rounded bg-surface-container-lowest accent-tertiary-fixed cursor-pointer" />
                    <span className={`text-body-sm truncate ${s.done ? 'line-through text-outline' : 'text-primary'}`}>{s.title}</span>
                  </div>
                  <button onClick={() => deleteSubtask(task.id, s.id)} aria-label="Delete subtask" className="w-8 h-8 shrink-0 rounded-lg flex sm:hidden sm:group-hover/sub:flex items-center justify-center text-outline hover:text-error hover:bg-error/10">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
              {(task.subtasks || []).length === 0 && <p className="text-[12px] text-outline py-1">Belum ada subtask.</p>}
            </div>
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                placeholder="Add subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 bg-surface-container-lowest px-2 py-1 rounded text-body-sm text-primary outline-none focus:bg-surface-container"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-surface-container-high hover:bg-surface-container-highest text-primary text-label-sm rounded font-medium font-mono cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">
              Deep Context & Notes
            </label>
            <textarea
              rows={4}
              value={task.notes}
              onChange={(e) => updateTask(task.id, { notes: e.target.value })}
              placeholder="Add notes, specifications, or code snippets..."
              className="bg-surface-container-lowest p-3 rounded-lg text-on-surface text-body-sm outline-none focus:ring-1 focus:ring-tertiary-fixed resize-none"
            />
          </div>

          {/* CTA */}
          <button
            onClick={handleInitiateFocus}
            className="w-full py-2.5 bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm text-headline-sm rounded-lg font-semibold hover:bg-tertiary-fixed-dim transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 mt-space-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            <span>Initiate Focus Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
