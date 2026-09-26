import React, { useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { useWebAudio } from '../hooks/useWebAudio';
import { Modal } from '../components/common/Modal';
import { BASE_TODAY_ISO, last7 } from '../utils/date';
import type { Routine } from '../types';

export const RoutinesPage: React.FC = () => {
  const routines = useLifeOSStore((state) => state.data.routines);
  const toggleRoutine = useLifeOSStore((state) => state.toggleRoutine);
  const toggleRoutineForDate = useLifeOSStore((s) => s.toggleRoutineForDate);
  const deleteRoutine = useLifeOSStore((s) => s.deleteRoutine);
  const updateRoutine = useLifeOSStore((s) => s.updateRoutine);
  const openRoutineModal = useLifeOSStore((s) => s.openRoutineModal);
  const { playSuccessChime, playBeep } = useWebAudio();

  const [editing, setEditing] = useState<Routine | null>(null);
  const [eTitle, setETitle] = useState('');
  const [eBlock, setEBlock] = useState<Routine['block']>('morning');
  const [eTime, setETime] = useState('07:00');
  const [eTag, setETag] = useState('');
  const [eDesc, setEDesc] = useState('');

  const doneCount = routines.filter((r) => r.doneToday).length;
  const morning = routines.filter((r) => r.block === 'morning');
  const afternoon = routines.filter((r) => r.block === 'afternoon');
  const evening = routines.filter((r) => r.block === 'evening');
  const weekDays = last7(BASE_TODAY_ISO);

  const handleNewRoutine = () => openRoutineModal();

  const openEdit = (r: Routine) => {
    setEditing(r);
    setETitle(r.title);
    setEBlock(r.block);
    setETime(r.time);
    setETag(r.tag);
    setEDesc(r.desc);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!eTitle.trim()) return;
    updateRoutine(editing.id, {
      title: eTitle.trim(),
      block: eBlock,
      time: eTime,
      tag: eTag.trim() || editing.tag,
      desc: eDesc.trim(),
    });
    setEditing(null);
  };

  const renderRoutineCard = (r: (typeof routines)[0]) => (
    <div
      key={r.id}
      onClick={() => {
        toggleRoutine(r.id);
        if (!r.doneToday) playSuccessChime();
        else playBeep(440, 'sine', 0.08);
      }}
      className={`group flex items-center justify-between px-space-md py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer ${
        r.doneToday ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-space-md min-w-0">
        <button
          type="button"
          className={`w-4 h-4 rounded flex items-center justify-center transition-transform active:scale-90 ${
            r.doneToday ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-primary'
          }`}
        >
          {r.doneToday && (
            <span className="material-symbols-outlined text-[13px] font-bold">check</span>
          )}
        </button>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-body-default text-body-default truncate ${
                r.doneToday ? 'line-through text-outline' : 'text-on-surface font-medium'
              }`}
            >
              {r.title}
            </span>
            <span className="font-label-sm text-[10px] text-tertiary-fixed font-mono flex items-center gap-0.5">
              <span
                className="material-symbols-outlined text-[12px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              {r.streak}d
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-outline font-mono">
            {r.time} · {r.desc}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="font-label-sm text-label-sm text-outline-variant hidden sm:inline font-mono">{r.tag}</span>
        <button
          onClick={(e) => { e.stopPropagation(); openEdit(r); }}
          aria-label={`Edit ${r.title}`}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-outline sm:opacity-0 sm:group-hover:opacity-100 hover:text-primary hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (window.confirm(`Hapus routine "${r.title}"?`)) deleteRoutine(r.id); }}
          aria-label="Delete routine"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-outline sm:opacity-0 sm:group-hover:opacity-100 hover:text-error hover:bg-error/10"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-space-lg w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mb-space-xs pb-space-sm font-mono">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
            <span className="text-tertiary-fixed font-semibold tracking-wider uppercase">
              Protocol Engine
            </span>
            <span>/</span>
            <span className="text-outline">AUTONOMOUS CADENCE</span>
          </div>
          <div className="flex items-baseline gap-space-md">
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold font-sans">
              ROUTINES &amp; HABITS
            </h1>
            <span className="font-label-sm text-label-sm text-tertiary-fixed bg-surface-container-high px-space-xs py-0.5 rounded-sm">
              {doneCount}/{routines.length} COMPLETED TODAY
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xl font-sans">
            Algorithmic daily sequences, micro-habits, and telemetry tracking optimized for uninterrupted flow.
          </p>
        </div>
        <div className="flex items-center gap-space-md font-sans">
          <button
            onClick={handleNewRoutine}
            className="flex items-center gap-1.5 h-8 px-space-md bg-primary text-on-primary rounded-lg hover:bg-primary-fixed transition-colors font-body-sm text-body-sm font-medium shadow-sm active:scale-95 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Routine</span>
          </button>
        </div>
      </div>

      {/* 7-Day Consistency Matrix */}
      <div className="bg-surface-container-low rounded-xl p-space-md sm:p-space-lg shadow-sm border border-outline-variant/20 flex flex-col gap-space-sm overflow-x-auto">
        <div className="flex items-center justify-between gap-2 min-w-[520px]">
          <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-sans flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-outline">calendar_view_month</span>
            7-Day Consistency
          </span>
          <span className="font-mono text-[11px] text-outline">Klik dot untuk tandai hari lalu</span>
        </div>
        <div className="min-w-[520px] flex flex-col gap-1.5">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'minmax(140px,1fr) repeat(7, 28px)' }}>
            <span />
            {weekDays.map((d) => (
              <span key={d} className="text-center font-mono text-[10px] text-outline">
                {d.slice(8)}
              </span>
            ))}
          </div>
          {routines.map((r) => (
            <div key={r.id} className="grid gap-1.5 items-center" style={{ gridTemplateColumns: 'minmax(140px,1fr) repeat(7, 28px)' }}>
              <span className="text-[12px] text-on-surface-variant truncate">{r.title}</span>
              {weekDays.map((d) => {
                const on = r.history?.[d] ?? (d === BASE_TODAY_ISO ? r.doneToday : false);
                const isToday = d === BASE_TODAY_ISO;
                return (
                  <button
                    key={d}
                    onClick={() => {
                      toggleRoutineForDate(r.id, d);
                      playBeep(on ? 440 : 659.25, 'sine', 0.08);
                    }}
                    title={`${r.title} — ${d}`}
                    aria-label={`${r.title} ${d} ${on ? 'done' : 'not done'}`}
                    className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center transition-all border ${
                      on
                        ? 'bg-tertiary-fixed border-tertiary-fixed text-on-tertiary-fixed'
                        : isToday
                        ? 'border-dashed border-outline hover:border-tertiary-fixed text-transparent'
                        : 'border-outline-variant/40 hover:border-outline text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Grid of Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg items-start">
        {/* Morning Block */}
        <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col gap-space-md">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-highest">
            <div className="flex items-center gap-space-sm">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-container-highest text-tertiary-fixed">
                <span className="material-symbols-outlined text-[18px]">wb_twilight</span>
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight font-semibold">
                  Morning Block
                </h2>
                <p className="font-label-sm text-label-sm text-outline font-mono">
                  06:00 — 09:00 · PRIME DISCIPLINE
                </p>
              </div>
            </div>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-highest text-tertiary-fixed font-medium font-mono">
              {morning.filter((r) => r.doneToday).length}/{morning.length} DONE
            </span>
          </div>
          <div className="flex flex-col gap-2">{morning.map(renderRoutineCard)}</div>
        </div>

        {/* Afternoon Block */}
        <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col gap-space-md">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-highest">
            <div className="flex items-center gap-space-sm">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-container-highest text-tertiary-fixed">
                <span className="material-symbols-outlined text-[18px]">wb_sunny</span>
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight font-semibold">
                  Afternoon Block
                </h2>
                <p className="font-label-sm text-label-sm text-outline font-mono">
                  12:00 — 17:00 · CADENCE
                </p>
              </div>
            </div>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-highest text-tertiary-fixed font-medium font-mono">
              {afternoon.filter((r) => r.doneToday).length}/{afternoon.length} DONE
            </span>
          </div>
          <div className="flex flex-col gap-2">{afternoon.map(renderRoutineCard)}</div>
        </div>

        {/* Evening Block */}
        <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col gap-space-md">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-highest">
            <div className="flex items-center gap-space-sm">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-container-highest text-tertiary-fixed">
                <span className="material-symbols-outlined text-[18px]">bedtime</span>
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight font-semibold">
                  Evening Reset
                </h2>
                <p className="font-label-sm text-label-sm text-outline font-mono">
                  18:00 — 23:00 · WINDDOWN
                </p>
              </div>
            </div>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-highest text-tertiary-fixed font-medium font-mono">
              {evening.filter((r) => r.doneToday).length}/{evening.length} DONE
            </span>
          </div>
          <div className="flex flex-col gap-2">{evening.map(renderRoutineCard)}</div>
        </div>
      </div>

      {/* Edit routine modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Routine">
        <form onSubmit={saveEdit} className="flex flex-col gap-space-sm">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">Title *</label>
            <input autoFocus value={eTitle} onChange={(e) => setETitle(e.target.value)} required className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none focus:ring-1 focus:ring-tertiary-fixed min-h-[44px]" />
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline">Block</label>
              <select value={eBlock} onChange={(e) => setEBlock(e.target.value as Routine['block'])} className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none min-h-[44px]">
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline">Time</label>
              <input type="time" value={eTime} onChange={(e) => setETime(e.target.value)} className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none min-h-[44px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline">Tag</label>
              <input value={eTag} onChange={(e) => setETag(e.target.value)} className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none min-h-[44px]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase text-outline">Note</label>
              <input value={eDesc} onChange={(e) => setEDesc(e.target.value)} className="bg-surface-container-lowest px-3 py-2.5 rounded-lg text-primary outline-none min-h-[44px]" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="h-11 px-4 text-on-surface-variant hover:text-primary">Cancel</button>
            <button type="submit" className="h-11 px-5 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg font-semibold hover:bg-tertiary-fixed-dim active:scale-95">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
