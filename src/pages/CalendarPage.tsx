import React, { useMemo, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const BASE_MONDAY = new Date(2026, 8, 21); // 21 Sep 2026 (Monday)
const TODAY_ISO = '2026-09-26';
const GRID_START = 8 * 60; // 08:00
const GRID_END = 20 * 60; // 20:00
const GRID_PX_PER_MIN = 0.9; // 12h * 60 * 0.9 = 648px height

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}
function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}
function monthLabel(offset: number) {
  const base = new Date(2026, 8, 1);
  base.setMonth(base.getMonth() + offset);
  return base.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

const COLOR_BAR: Record<string, string> = {
  emerald: 'bg-tertiary-fixed',
  sky: 'bg-sky-400',
  violet: 'bg-violet-400',
  slate: 'bg-outline',
};

export const CalendarPage: React.FC = () => {
  const tasks = useLifeOSStore((state) => state.data.tasks);
  const events = useLifeOSStore((state) => state.data.calendar);
  const openDrawer = useLifeOSStore((state) => state.openDrawer);
  const openEventModal = useLifeOSStore((s) => s.openEventModal);
  const toggleCalendarEvent = useLifeOSStore((s) => s.toggleCalendarEvent);
  const deleteCalendarEvent = useLifeOSStore((s) => s.deleteCalendarEvent);
  const requestConfirm = useLifeOSStore((s) => s.requestConfirm);
  const openEventModalForEdit = useLifeOSStore((s) => s.openEventModalForEdit);
  const weekOffset = useLifeOSStore((s) => s.weekOffset);
  const shiftWeek = useLifeOSStore((s) => s.shiftWeek);
  const resetWeek = useLifeOSStore((s) => s.resetWeek);
  const calendarViewMode = useLifeOSStore((s) => s.calendarViewMode);
  const setCalendarViewMode = useLifeOSStore((s) => s.setCalendarViewMode);

  const [selectedDayISO, setSelectedDayISO] = useState(TODAY_ISO);

  const weekDays = useMemo(() => {
    const monday = addDays(BASE_MONDAY, weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      return { date: d, iso: toISO(d), dayNum: d.getDate(), name: DAY_NAMES[i] };
    });
  }, [weekOffset]);

  const monthCells = useMemo(() => {
    const first = new Date(2026, 8 + weekOffset, 1);
    const startDay = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: ({ iso: string; num: number; inMonth: boolean } | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let n = 1; n <= daysInMonth; n++) {
      const d = new Date(first.getFullYear(), first.getMonth(), n);
      cells.push({ iso: toISO(d), num: n, inMonth: true });
    }
    return cells;
  }, [weekOffset]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {};
    for (const ev of events) {
      (map[ev.date] ||= []).push(ev);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    return map;
  }, [events]);

  const selectedEvents = eventsByDate[selectedDayISO] || [];
  const handleNewEvent = () => openEventModal();
  const handleToday = () => {
    resetWeek();
    setSelectedDayISO(TODAY_ISO);
  };

  const renderEventCard = (ev: (typeof events)[number]) => {
    const start = Math.max(toMinutes(ev.startTime), GRID_START);
    const end = Math.min(toMinutes(ev.endTime), GRID_END);
    const top = (start - GRID_START) * GRID_PX_PER_MIN;
    const height = Math.max((end - start) * GRID_PX_PER_MIN, 52);
    const short = height < 80;
    return (
      <div
        key={ev.id}
        onClick={() => toggleCalendarEvent(ev.id)}
        title={`${ev.title} (${ev.startTime}–${ev.endTime}) — klik untuk toggle done`}
        className={`absolute left-1 right-1 rounded-lg p-1.5 flex flex-col overflow-hidden shadow-sm cursor-pointer border transition-colors ${
          ev.done
            ? 'bg-surface-container-low opacity-70 hover:opacity-100 border-outline-variant/20'
            : 'bg-surface-container-high hover:bg-surface-container-highest border-outline-variant/30'
        }`}
        style={{ top, height }}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${COLOR_BAR[ev.color] || 'bg-tertiary-fixed'}`} />
        <div className="flex flex-col gap-0.5 pl-2 min-w-0 font-sans">
          <span className={`font-mono text-[10px] leading-none truncate ${ev.done ? 'text-outline' : 'text-tertiary-fixed'}`}>
            {ev.startTime} - {ev.endTime}
          </span>
          <span className={`text-[12px] font-medium leading-tight truncate ${ev.done ? 'text-outline line-through' : 'text-primary'}`}>
            {ev.title}
          </span>
          {!short && !ev.done && (
            <span className="font-mono text-[10px] text-outline truncate">{ev.location}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-space-lg w-full animate-fade-in">
      {/* Top Utility Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-xs">
        <div className="flex flex-wrap items-center gap-space-md">
          <div className="flex items-center gap-space-sm font-mono">
            <span className="font-kbd text-label-sm text-outline/70 tracking-widest uppercase">VIEW</span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold font-sans">CALENDAR</h1>
          </div>

          <div className="flex items-center gap-space-xs bg-surface-container-low px-space-xs py-1 rounded-lg border border-outline-variant/20 font-mono">
            <button
              aria-label="Previous week"
              onClick={() => shiftWeek(-1)}
              className="flex items-center justify-center w-9 h-9 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="font-label-default text-label-default text-on-surface px-space-sm font-semibold tracking-wide min-w-[150px] text-center text-[13px]">
              {calendarViewMode === 'month' ? monthLabel(weekOffset) : weekOffset === 0 ? 'September 2026' : weekOffset > 0 ? `+${weekOffset} week${weekOffset > 1 ? 's' : ''}` : `${weekOffset} week${weekOffset < -1 ? 's' : ''}`}
            </span>
            <button
              aria-label="Next week"
              onClick={() => shiftWeek(1)}
              className="flex items-center justify-center w-9 h-9 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
            <div className="w-px h-4 bg-surface-container-highest mx-0.5" />
            <button
              onClick={handleToday}
              className="px-space-sm min-h-[36px] font-label-sm text-label-sm text-tertiary-fixed bg-surface-container hover:bg-surface-container-high rounded transition-colors cursor-pointer"
              type="button"
            >
              TODAY
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-md">
          <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant/20" role="tablist" aria-label="Calendar view">
            {(['day', 'week', 'month'] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={calendarViewMode === m}
                onClick={() => setCalendarViewMode(m)}
                className={`px-space-md h-9 rounded font-body-sm text-body-sm transition-colors cursor-pointer capitalize min-w-[64px] ${
                  calendarViewMode === m ? 'bg-surface-container-high text-primary font-medium shadow-sm' : 'text-on-surface-variant hover:text-primary'
                }`}
                type="button"
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={handleNewEvent}
            className="flex items-center gap-1.5 h-10 px-space-md bg-primary text-on-primary rounded-lg hover:bg-primary-fixed active:scale-95 transition-all shadow-sm cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[17px] font-semibold">add</span>
            <span className="font-body-sm text-body-sm font-medium">New Event</span>
            <kbd className="font-kbd text-kbd px-1 py-0.5 bg-on-primary/10 text-on-primary rounded ml-1 font-mono hidden sm:inline">N</kbd>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg w-full items-start">
        <div className="xl:col-span-9 flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-xl border border-outline-variant/20 min-w-0">
          {calendarViewMode === 'month' ? (
            /* ============ MONTH VIEW ============ */
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-7 gap-1 mb-1 font-mono">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-[11px] text-outline py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthCells.map((cell, i) =>
                  cell === null ? (
                    <div key={`e-${i}`} className="min-h-[64px] sm:min-h-[84px] rounded-lg bg-surface-container-lowest/50" />
                  ) : (
                    <button
                      key={cell.iso}
                      onClick={() => {
                        setSelectedDayISO(cell.iso);
                        setCalendarViewMode('day');
                      }}
                      className={`min-h-[64px] sm:min-h-[84px] rounded-lg p-1.5 text-left border transition-colors cursor-pointer flex flex-col gap-1 ${
                        cell.iso === TODAY_ISO && weekOffset === 0
                          ? 'bg-surface-container-high border-tertiary-fixed/50'
                          : cell.iso === selectedDayISO
                          ? 'bg-surface-container border-outline'
                          : 'bg-surface-container-low border-outline-variant/20 hover:border-outline-variant/60'
                      }`}
                    >
                      <span className={`font-mono text-[12px] ${cell.iso === TODAY_ISO && weekOffset === 0 ? 'text-tertiary-fixed font-bold' : 'text-on-surface'}`}>
                        {cell.num}
                      </span>
                      <span className="flex flex-wrap gap-1">
                        {(eventsByDate[cell.iso] || []).slice(0, 3).map((ev) => (
                          <span key={ev.id} title={ev.title} className={`w-2 h-2 rounded-full ${COLOR_BAR[ev.color] || 'bg-tertiary-fixed'}`} />
                        ))}
                      </span>
                      {(eventsByDate[cell.iso] || []).length > 0 && (
                        <span className="font-mono text-[10px] text-outline truncate">{eventsByDate[cell.iso].length} event{eventsByDate[cell.iso].length > 1 ? 's' : ''}</span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : calendarViewMode === 'day' ? (
            /* ============ DAY VIEW (agenda list, no overlap) ============ */
            <div className="flex flex-col">
              <div className="flex items-center gap-2 overflow-x-auto px-3 sm:px-4 py-3 bg-surface-container-low border-b border-outline-variant/20">
                {weekDays.map((d) => {
                  const active = d.iso === selectedDayISO;
                  const isToday = d.iso === TODAY_ISO && weekOffset === 0;
                  return (
                    <button
                      key={d.iso}
                      onClick={() => setSelectedDayISO(d.iso)}
                      className={`flex flex-col items-center justify-center min-w-[56px] px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        active ? 'bg-surface-container-highest/70 text-primary' : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <span className={`font-mono text-[10px] uppercase ${isToday ? 'text-tertiary-fixed font-bold' : 'text-outline'}`}>{d.name}</span>
                      <span className={`font-headline-sm font-semibold text-[15px] ${active ? 'text-primary' : 'text-on-surface'}`}>{d.dayNum}</span>
                      {isToday && <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse mt-0.5" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-2 p-3 sm:p-4">
                {selectedEvents.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-outline text-[13px]">Tidak ada event di {selectedDayISO}.</p>
                    <button onClick={handleNewEvent} className="mt-3 h-10 px-4 rounded-lg bg-surface-container-high text-primary text-[13px] font-medium hover:bg-surface-container-highest">
                      + Tambah event hari ini
                    </button>
                  </div>
                ) : (
                  selectedEvents.map((ev) => (
                    <div key={ev.id} className={`flex items-center gap-3 p-3 rounded-xl border ${ev.done ? 'opacity-60 bg-surface-container-low' : 'bg-surface-container-high/60 border-outline-variant/30'}`}>
                      <div className="flex flex-col items-center shrink-0 w-[64px]">
                        <span className="font-mono text-[13px] font-bold text-tertiary-fixed">{ev.startTime}</span>
                        <span className="font-mono text-[11px] text-outline">{ev.endTime}</span>
                      </div>
                      <div className={`w-1 self-stretch rounded-full ${COLOR_BAR[ev.color] || 'bg-tertiary-fixed'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-medium truncate ${ev.done ? 'line-through text-outline' : 'text-primary'}`}>{ev.title}</p>
                        <p className="font-mono text-[11px] text-outline truncate">{ev.category} • {ev.location}</p>
                      </div>
                      <button onClick={() => openEventModalForEdit(ev.id)} aria-label={`Edit ${ev.title}`} className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-high">
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                      <button onClick={() => toggleCalendarEvent(ev.id)} className={`h-9 px-3 rounded-lg text-[12px] font-medium shrink-0 ${ev.done ? 'bg-surface-container-highest text-outline' : 'bg-tertiary-fixed/15 text-tertiary-fixed hover:bg-tertiary-fixed hover:text-on-tertiary-fixed'}`}>
                        {ev.done ? 'Done' : 'Mark done'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* ============ WEEK VIEW (data-driven grid) ============ */
            <>
              <div className="hidden md:grid grid-cols-8 bg-surface-container-low py-space-sm pl-2 pr-4 sticky top-14 z-20 font-mono">
                <div className="flex items-center justify-center font-kbd text-label-sm text-outline/60">UTC+1</div>
                {weekDays.map((d) => {
                  const isToday = d.iso === TODAY_ISO && weekOffset === 0;
                  const active = d.iso === selectedDayISO;
                  return (
                    <button
                      key={d.iso}
                      onClick={() => { setSelectedDayISO(d.iso); setCalendarViewMode('day'); }}
                      className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors cursor-pointer ${isToday ? 'bg-surface-container-highest/60' : active ? 'bg-surface-container-high/50' : 'hover:bg-surface-container'}`}
                      title={`Lihat ${d.iso}`}
                    >
                      <span className={`font-label-sm text-label-sm tracking-wider uppercase ${isToday ? 'text-tertiary-fixed font-semibold' : 'text-outline'}`}>{d.name}</span>
                      <span className="flex items-center gap-1">
                        <span className={`font-headline-sm text-headline-sm font-semibold ${isToday ? 'text-primary font-bold' : 'text-on-surface'}`}>{d.dayNum}</span>
                        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile: agenda list per day (no absolute overlap) */}
              <div className="md:hidden flex flex-col divide-y divide-outline-variant/20">
                {weekDays.map((d) => {
                  const isToday = d.iso === TODAY_ISO && weekOffset === 0;
                  const list = eventsByDate[d.iso] || [];
                  return (
                    <div key={d.iso} className={`px-3 py-3 ${isToday ? 'bg-surface-container-low/60' : ''}`}>
                      <button onClick={() => { setSelectedDayISO(d.iso); setCalendarViewMode('day'); }} className="flex items-center gap-2 w-full text-left">
                        <span className={`font-mono text-[11px] uppercase ${isToday ? 'text-tertiary-fixed font-bold' : 'text-outline'}`}>{d.name}</span>
                        <span className={`font-headline-sm font-semibold text-[15px] ${isToday ? 'text-primary' : 'text-on-surface'}`}>{d.dayNum}</span>
                        {isToday && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-tertiary-fixed/15 text-tertiary-fixed font-bold">TODAY</span>}
                        <span className="ml-auto font-mono text-[11px] text-outline">{list.length > 0 ? `${list.length} event${list.length > 1 ? 's' : ''}` : '—'}</span>
                      </button>
                      {list.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-2">
                          {list.map((ev) => (
                            <button key={ev.id} onClick={() => toggleCalendarEvent(ev.id)} className="flex items-center gap-2 p-2 rounded-lg bg-surface-container text-left">
                              <span className={`font-mono text-[11px] shrink-0 ${ev.done ? 'text-outline line-through' : 'text-tertiary-fixed font-bold'}`}>{ev.startTime}</span>
                              <span className={`w-1 self-stretch rounded-full shrink-0 ${COLOR_BAR[ev.color] || 'bg-tertiary-fixed'}`} />
                              <span className={`text-[13px] truncate flex-1 ${ev.done ? 'text-outline line-through' : 'text-primary'}`}>{ev.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop: absolute time grid, positioned from JSON times */}
              <div className="relative w-full overflow-y-auto overflow-x-hidden bg-surface-container-lowest font-mono hidden md:block" style={{ height: (GRID_END - GRID_START) * GRID_PX_PER_MIN + 16 }}>
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-2">
                  {Array.from({ length: 13 }).map((_, i) => (
                    <div key={i} className="w-full h-px bg-surface-container-high/40" />
                  ))}
                </div>
                <div className="grid grid-cols-8 h-full relative pl-2 pr-4">
                  <div className="flex flex-col justify-between py-2 text-right pr-3 select-none pointer-events-none text-outline/70 text-label-sm">
                    {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].map((t) => (<span key={t}>{t}</span>))}
                  </div>
                  {weekDays.map((d) => {
                    const isToday = d.iso === TODAY_ISO && weekOffset === 0;
                    const list = eventsByDate[d.iso] || [];
                    return (
                      <div key={d.iso} className={`relative h-full px-1 ${isToday ? 'bg-surface-container-low/40' : ''}`}>
                        {isToday && (
                          <div className="absolute left-0 right-0 z-30 flex items-center pointer-events-none" style={{ top: (11 * 60 + 45 - GRID_START) * GRID_PX_PER_MIN }}>
                            <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed -ml-1 shadow-sm" />
                            <div className="w-full h-0.5 bg-tertiary-fixed shadow-sm" />
                          </div>
                        )}
                        {list.length === 0 ? null : list.map(renderEventCard)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Side */}
        <div className="xl:col-span-3 flex flex-col gap-space-md min-w-0">
          <div className="bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-sm font-mono">
            <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-sans">Timebox Allocator</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant font-sans">Allocated 6.5 hours of deep cognitive focus today. 2h buffer remaining.</p>
            <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-1.5 text-label-sm">
              <div className="flex justify-between text-outline"><span>Deep Work</span><span className="text-tertiary-fixed font-bold">4.0h</span></div>
              <div className="flex justify-between text-outline"><span>Academics</span><span className="text-primary font-bold">1.5h</span></div>
              <div className="flex justify-between text-outline"><span>Health &amp; Reset</span><span className="text-tertiary-fixed font-bold">1.0h</span></div>
            </div>
          </div>

          <div className="bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-sm">
            <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-mono">Backlog Queue</span>
            <div className="flex flex-col gap-1.5">
              {tasks.filter((t) => !t.completed).slice(0, 4).map((t) => (
                <div key={t.id} onClick={() => openDrawer(t.id)} className="p-2.5 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer text-body-sm flex justify-between items-center transition-colors min-h-[44px] gap-2">
                  <span className="text-primary truncate text-[13px]">{t.title}</span>
                  <span className="text-tertiary-fixed font-mono text-[11px] shrink-0 ml-1">{t.est}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real JSON events — full CRUD usable */}
      <div className="bg-surface-container-low rounded-xl p-space-md sm:p-space-lg border border-outline-variant/20 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-headline-sm font-semibold text-primary text-[15px]">My Events (JSON)</span>
          <button onClick={handleNewEvent} className="h-10 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-[13px] font-medium flex items-center gap-1.5 min-w-[44px] justify-center">
            <span className="material-symbols-outlined text-[16px]">add</span> Add Event
          </button>
        </div>
        {events.length === 0 ? (
          <p className="text-outline text-[13px] py-4 text-center">Belum ada event. Klik Add Event.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((ev) => (
              <div key={ev.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${ev.done ? 'opacity-55 bg-surface-container-lowest border-outline-variant/20' : 'bg-surface-container border-outline-variant/30 hover:border-outline'}`}>
                <button onClick={() => toggleCalendarEvent(ev.id)} aria-label="Toggle done" className={`w-9 h-9 shrink-0 rounded-md flex items-center justify-center border ${ev.done ? 'bg-tertiary-fixed border-tertiary-fixed text-on-tertiary-fixed' : 'border-outline-variant text-transparent hover:text-tertiary-fixed'}`}>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium truncate ${ev.done ? 'line-through text-outline' : 'text-primary'}`}>{ev.title}</p>
                  <p className="text-[11px] text-outline font-mono truncate">{ev.date} • {ev.startTime}–{ev.endTime} • {ev.category} • {ev.location}</p>
                </div>
                <button onClick={() => openEventModalForEdit(ev.id)} aria-label={`Edit ${ev.title}`} className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-[17px]">edit</span>
                </button>
                <button onClick={() => requestConfirm({ title: 'Hapus event?', message: `"${ev.title}" (${ev.date} • ${ev.startTime}–${ev.endTime}) akan dihapus.`, onConfirm: () => deleteCalendarEvent(ev.id) })} aria-label="Delete event" className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-outline hover:text-error hover:bg-error/10">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
