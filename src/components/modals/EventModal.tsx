import React, { useEffect, useState } from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';
import { Modal } from '../common/Modal';

export const EventModal: React.FC = () => {
  const open = useLifeOSStore((s) => s.isEventModalOpen);
  const onClose = useLifeOSStore((s) => s.closeEventModal);
  const addCalendarEvent = useLifeOSStore((s) => s.addCalendarEvent);
  const updateCalendarEvent = useLifeOSStore((s) => s.updateCalendarEvent);
  const editingEventId = useLifeOSStore((s) => s.editingEventId);
  const events = useLifeOSStore((s) => s.data.calendar);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [location, setLocation] = useState('Local');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [date, setDate] = useState('2026-09-26');

  useEffect(() => {
    if (open && editingEventId) {
      const ev = events.find((e) => e.id === editingEventId);
      if (ev) {
        setTitle(ev.title);
        setCategory(ev.category);
        setLocation(ev.location);
        setStartTime(ev.startTime);
        setEndTime(ev.endTime);
        setDate(ev.date);
      }
    } else if (open) {
      setTitle('');
      setCategory('General');
      setLocation('Local');
      setStartTime('10:00');
      setEndTime('11:00');
      setDate('2026-09-26');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingEventId]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEventId) {
      updateCalendarEvent(editingEventId, {
        title: title.trim(),
        category,
        location: location.trim() || 'Local',
        startTime,
        endTime,
        date,
      });
      onClose();
      return;
    }
    const r = addCalendarEvent({ title, category, location, startTime, endTime, date });
    if (r) {
      setTitle(''); setLocation('Local');
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editingEventId ? 'Edit Calendar Event' : 'New Calendar Event'}>
      <form onSubmit={submit} className="flex flex-col gap-space-sm">
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-[11px] uppercase text-outline">Title *</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Design Review" className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none focus:ring-1 focus:ring-tertiary-fixed min-h-[40px]" />
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none min-h-[40px]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none min-h-[40px]">
              <option>General</option><option>Engineering</option><option>Academics</option><option>Health</option><option>Learning</option><option>Review</option><option>Break</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">Start</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none min-h-[40px]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">End</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none min-h-[40px]" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-[11px] uppercase text-outline">Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Zoom / Desk / Gym" className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none min-h-[40px]" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-space-md h-10 text-on-surface-variant hover:text-primary min-w-[80px]">Cancel</button>
          <button type="submit" className="px-space-md h-10 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg font-semibold hover:bg-tertiary-fixed-dim active:scale-95 min-w-[120px]">
            {editingEventId ? 'Save Changes' : 'Save Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
