import React, { useMemo, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { useWebAudio } from '../hooks/useWebAudio';
import type { Task } from '../types';

type KanbanCol = 'upcoming' | 'today' | 'completed';

export const TasksPage: React.FC = () => {
  const tasks = useLifeOSStore((state) => state.data.tasks);
  const taskFilter = useLifeOSStore((state) => state.taskFilter);
  const taskViewMode = useLifeOSStore((state) => state.taskViewMode);
  const setTaskFilter = useLifeOSStore((state) => state.setTaskFilter);
  const setTaskViewMode = useLifeOSStore((state) => state.setTaskViewMode);
  const toggleTask = useLifeOSStore((state) => state.toggleTask);
  const moveTask = useLifeOSStore((state) => state.moveTask);
  const openDrawer = useLifeOSStore((state) => state.openDrawer);
  const openTaskModal = useLifeOSStore((state) => state.openTaskModal);

  const { playSuccessChime, playBeep } = useWebAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [dragOverCol, setDragOverCol] = useState<KanbanCol | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [mobileKanbanCol, setMobileKanbanCol] = useState<KanbanCol>('today');

  const projectOptions = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.project))).sort(),
    [tasks]
  );

  // Satu pipeline filter dipakai List & Kanban (parity penuh)
  const visibleTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q) {
        const hay = `${t.title} ${t.project} ${t.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedProject !== 'all' && t.project !== selectedProject) return false;
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
      if (taskFilter === 'today') return t.status === 'today' || (t.due && t.due.toLowerCase().includes('today'));
      if (taskFilter === 'upcoming') return t.status === 'upcoming' || (!t.completed && t.status !== 'today');
      if (taskFilter === 'overdue') return t.status === 'overdue';
      if (taskFilter === 'completed') return t.completed;
      return true;
    });
  }, [tasks, searchQuery, selectedProject, selectedPriority, taskFilter]);

  const filtersActive =
    searchQuery.trim() !== '' || selectedProject !== 'all' || selectedPriority !== 'all' || taskFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedProject('all');
    setSelectedPriority('all');
    setTaskFilter('all');
  };

  const todayGroup = visibleTasks.filter((t) => t.status === 'today' || (t.due && t.due.toLowerCase().includes('today')));
  const upcomingGroup = visibleTasks.filter((t) => t.status !== 'today' && !t.completed);

  const kanbanCols: { key: KanbanCol; label: string; items: Task[]; accent: string }[] = [
    {
      key: 'upcoming',
      label: 'To Do',
      items: visibleTasks.filter((t) => t.status === 'upcoming' && !t.completed),
      accent: 'text-on-surface',
    },
    {
      key: 'today',
      label: 'Doing',
      items: visibleTasks.filter((t) => t.status === 'today' && !t.completed),
      accent: 'text-tertiary-fixed',
    },
    {
      key: 'completed',
      label: 'Done',
      items: visibleTasks.filter((t) => t.completed),
      accent: 'text-outline',
    },
  ];

  const onDropTo = (e: React.DragEvent, col: KanbanCol) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggingId(null);
    const id = e.dataTransfer.getData('text/productiv-task');
    if (!id) return;
    moveTask(id, col);
    playBeep(659.25, 'sine', 0.12);
  };

  const toggleWithSound = (t: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTask(t.id);
    if (!t.completed) playSuccessChime();
    else playBeep(440, 'sine', 0.1);
  };

  const tabBtn = (
    key: typeof taskFilter,
    label: React.ReactNode
  ) => (
    <button
      onClick={() => setTaskFilter(key)}
      className={`px-space-sm h-7 rounded-lg font-label-default text-label-default whitespace-nowrap cursor-pointer ${
        taskFilter === key
          ? 'bg-surface-container-highest text-primary'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-space-lg w-full animate-fade-in">
      {/* Command Toolbar & View Metrics */}
      <div className="flex flex-col gap-space-md mb-space-xs">
        {/* Top Action Row */}
        <div className="flex items-center justify-between gap-space-md flex-wrap">
          <div className="flex items-baseline gap-space-sm font-mono">
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-sans font-semibold">
              TASKS
            </h1>
            <span className="font-label-default text-label-default px-space-xs py-0.5 rounded-lg bg-surface-container-high text-on-surface-variant font-medium">
              {tasks.filter((t) => !t.completed).length} active
            </span>
          </div>

          <div className="flex items-center gap-space-sm">
            <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant/20">
              <button
                onClick={() => setTaskViewMode('list')}
                className={`flex items-center gap-1.5 px-space-sm h-7 rounded font-label-default text-label-default shadow-sm transition-all cursor-pointer ${
                  taskViewMode === 'list'
                    ? 'bg-surface-container-high text-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">view_list</span>
                <span>List</span>
              </button>
              <button
                onClick={() => setTaskViewMode('kanban')}
                className={`flex items-center gap-1.5 px-space-sm h-7 rounded font-label-default text-label-default transition-all cursor-pointer ${
                  taskViewMode === 'kanban'
                    ? 'bg-surface-container-high text-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">view_kanban</span>
                <span>Kanban</span>
              </button>
            </div>

            <button
              onClick={openTaskModal}
              className="flex items-center gap-1.5 h-8 px-space-md bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm text-headline-sm rounded-lg hover:bg-tertiary-fixed-dim transition-all shadow-md active:scale-95 font-medium cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Task</span>
              <kbd className="font-kbd text-kbd px-1 py-0.2 rounded bg-on-tertiary-fixed/15 text-on-tertiary-fixed ml-1 font-mono">
                N
              </kbd>
            </button>
          </div>
        </div>

        {/* Filter & Segmentation Bar */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-center bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/20 font-mono">
          {/* State Tabs */}
          <div className="xl:col-span-5 flex items-center gap-1 overflow-x-auto">
            {tabBtn('all', <>All <span className="text-on-surface-variant ml-1 font-label-sm">{tasks.length}</span></>)}
            {tabBtn('today', <>Today <span className="text-tertiary-fixed font-medium ml-1">{tasks.filter((t) => t.status === 'today').length}</span></>)}
            {tabBtn('upcoming', <>Upcoming <span className="text-on-surface-variant ml-1 font-label-sm">{tasks.filter((t) => t.status === 'upcoming').length}</span></>)}
            {tabBtn('overdue', <span className="text-error">Overdue <span className="font-medium ml-1">{tasks.filter((t) => t.status === 'overdue').length}</span></span>)}
            {tabBtn('completed', <>Done <span className="text-tertiary-fixed font-medium ml-1">{tasks.filter((t) => t.completed).length}</span></>)}
          </div>

          {/* Live Search Box */}
          <div className="xl:col-span-4 relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-outline">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-8 bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-sm font-body-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-tertiary-fixed transition-all font-sans"
              placeholder="Search tasks (or press /)..."
              type="text"
            />
            <kbd className="font-kbd text-kbd absolute right-2.5 top-1/2 -translate-y-1/2 text-outline bg-surface-container px-1 py-0.5 rounded">
              /
            </kbd>
          </div>

          {/* Filter Dropdowns (dinamis dari data) */}
          <div className="xl:col-span-3 flex items-center justify-end gap-1.5 font-sans">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="h-7 px-space-xs rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer outline-none font-mono max-w-[150px]"
              aria-label="Filter project"
            >
              <option value="all">Project: All</option>
              {projectOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-7 px-space-xs rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer outline-none font-mono"
              aria-label="Filter priority"
            >
              <option value="all">Priority: All</option>
              <option value="high">High</option>
              <option value="med">Medium</option>
              <option value="low">Low</option>
            </select>

            {filtersActive && (
              <button
                onClick={resetFilters}
                className="h-7 px-2 rounded-lg bg-surface-container-highest text-tertiary-fixed font-label-sm text-label-sm hover:bg-surface-container-high transition-colors cursor-pointer whitespace-nowrap"
                title="Reset semua filter"
              >
                Reset ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main View: List or Kanban */}
      {taskViewMode === 'list' ? (
        <div className="flex flex-col gap-space-lg">
          {/* Group: TODAY */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between px-space-xs py-1">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">
                  today
                </span>
                <span className="font-label-default text-label-default text-primary uppercase tracking-wider font-semibold font-mono">
                  Today
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                  {todayGroup.length} tasks
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline font-mono">
                {todayGroup.filter((t) => !t.completed).length} open
              </span>
            </div>

            <div className="flex flex-col bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/20">
              {todayGroup.map((t) => (
                <div
                  key={t.id}
                  onClick={() => openDrawer(t.id)}
                  className={`group flex items-center justify-between px-space-md h-12 hover:bg-surface-container border-b border-surface-container-highest last:border-0 transition-colors cursor-pointer relative ${
                    t.completed ? 'opacity-50' : ''
                  }`}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary-fixed"></div>
                  <div className="flex items-center gap-space-sm min-w-0">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={(e) => toggleWithSound(t, e as unknown as React.MouseEvent)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 rounded bg-surface-container-lowest accent-tertiary-fixed cursor-pointer"
                    />
                    <span
                      className={`font-headline-sm text-headline-sm truncate font-medium ${
                        t.completed ? 'line-through text-outline' : 'text-primary'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-mono">
                      {t.project}
                    </span>
                  </div>

                  <div className="flex items-center gap-space-md shrink-0 font-mono">
                    <span
                      className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded font-medium ${
                        t.priority === 'high'
                          ? 'bg-error/15 text-error'
                          : t.priority === 'med'
                          ? 'bg-secondary-container/40 text-secondary-fixed'
                          : 'bg-surface-container text-outline'
                      }`}
                    >
                      {t.priority.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 font-label-sm text-label-sm text-tertiary-fixed">
                      <span className="material-symbols-outlined text-[14px]">timer</span>
                      <span>
                        {t.timeSpent} / {t.est}
                      </span>
                    </div>
                    {t.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded hidden sm:inline"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {todayGroup.length === 0 && (
                <p className="text-[12px] text-outline py-4 text-center">Kosong untuk filter ini.</p>
              )}
            </div>
          </div>

          {/* Group: UPCOMING */}
          {upcomingGroup.length > 0 && (
            <div className="flex flex-col gap-space-xs pt-space-xs">
              <div className="flex items-center justify-between px-space-xs py-1">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[16px] text-outline">
                    event_upcoming
                  </span>
                  <span className="font-label-default text-label-default text-on-surface uppercase tracking-wider font-semibold font-mono">
                    Upcoming
                  </span>
                  <span className="font-label-sm text-label-sm text-outline font-mono">
                    This Week
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-outline font-mono">
                  {upcomingGroup.length} tasks
                </span>
              </div>

              <div className="flex flex-col bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/20">
                {upcomingGroup.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => openDrawer(t.id)}
                    className="group flex items-center justify-between px-space-md h-11 hover:bg-surface-container border-b border-surface-container-highest last:border-0 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-space-sm min-w-0">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={(e) => toggleWithSound(t, e as unknown as React.MouseEvent)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded bg-surface-container-lowest accent-tertiary-fixed cursor-pointer"
                      />
                      <span className="font-body-default text-body-default text-on-surface truncate">
                        {t.title}
                      </span>
                      <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-mono">
                        {t.project}
                      </span>
                    </div>

                    <div className="flex items-center gap-space-md shrink-0 font-mono">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {t.due}
                      </span>
                      <div className="flex items-center gap-1 font-label-sm text-label-sm text-outline">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span>{t.est}</span>
                      </div>
                      {t.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded hidden sm:inline"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {todayGroup.length === 0 && upcomingGroup.length === 0 && (
            <div className="p-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant/40 text-outline text-[13px]">
              Tidak ada task untuk filter ini. Klik <span className="text-tertiary-fixed font-semibold">New Task</span> atau tekan <span className="font-mono">N</span>.
            </div>
          )}
        </div>
      ) : (
        /* KANBAN VIEW — drag & drop antar kolom */
        <div>
          <p className="font-label-sm text-label-sm text-outline font-mono mb-2 hidden md:block">
            Tip: drag kartu antar kolom untuk pindah status (tersimpan otomatis ke JSON).
          </p>
          {/* Mobile: tampil 1 kolom + switcher */}
          <div className="md:hidden mb-2 sticky top-14 z-20 -mx-3 px-3 py-2 bg-surface/90 backdrop-blur-xl">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-low border border-outline-variant/30">
              {kanbanCols.map((col) => (
                <button
                  key={col.key}
                  onClick={() => setMobileKanbanCol(col.key)}
                  className={`flex-1 h-9 rounded-lg font-body-sm font-medium transition-all text-[13px] ${
                    mobileKanbanCol === col.key
                      ? 'bg-surface-container-high text-primary shadow-sm'
                      : 'text-on-surface-variant'
                  }`}
                >
                  {col.label} ({col.items.length})
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {kanbanCols.map((col) => (
              <div
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverCol(col.key);
                }}
                onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
                onDrop={(e) => onDropTo(e, col.key)}
                className={`${mobileKanbanCol === col.key ? 'flex' : 'hidden'} md:flex flex-col gap-space-sm bg-surface-container-low p-space-sm rounded-xl border min-h-[400px] transition-colors ${
                  dragOverCol === col.key
                    ? 'border-tertiary-fixed/70 bg-surface-container'
                    : 'border-outline-variant/20'
                }`}
              >
                <div className="flex items-center justify-between px-space-xs py-1">
                  <span className={`font-label-default text-label-default uppercase font-semibold font-mono ${col.accent}`}>
                    {col.label} ({col.items.length})
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-outline">more_horiz</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  {col.items.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/productiv-task', t.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggingId(t.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverCol(null);
                      }}
                      onClick={() => openDrawer(t.id)}
                      className={`p-space-sm rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-surface-container-high transition-all border ${
                        col.key === 'today'
                          ? 'bg-surface-container-high border-tertiary-fixed/20'
                          : 'bg-surface-container border-transparent'
                      } ${draggingId === t.id ? 'opacity-40 scale-[0.98]' : ''} ${
                        t.completed ? 'opacity-70' : ''
                      }`}
                    >
                      <span className={`font-label-sm text-label-sm font-mono ${col.key === 'today' ? 'text-tertiary-fixed font-medium' : 'text-outline'}`}>
                        {t.project}
                      </span>
                      <p className={`font-body-default text-body-default mt-1 font-medium ${t.completed ? 'text-outline line-through' : 'text-on-surface'}`}>
                        {t.title}
                      </p>
                      <div className="flex items-center justify-between mt-space-sm text-outline font-label-sm text-label-sm font-mono">
                        <span>{t.due}</span>
                        <span>{t.est}</span>
                      </div>
                    </div>
                  ))}
                  {col.items.length === 0 && (
                    <div className={`p-4 text-center rounded-lg border border-dashed text-[12px] font-mono ${dragOverCol === col.key ? 'border-tertiary-fixed text-tertiary-fixed' : 'border-outline-variant/30 text-outline'}`}>
                      {dragOverCol === col.key ? 'Lepas di sini ⬇' : 'Kosong — drag kartu ke sini'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
