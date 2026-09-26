import React, { useState } from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';
import { Modal } from '../common/Modal';
import { Routine } from '../../types';

export const RoutineModal: React.FC = () => {
  const open = useLifeOSStore((s) => s.isRoutineModalOpen);
  const onClose = useLifeOSStore((s) => s.closeRoutineModal);
  const addRoutine = useLifeOSStore((s) => s.addRoutine);
  const [title, setTitle] = useState('');
  const [block, setBlock] = useState<Routine['block']>('morning');
  const [time, setTime] = useState('07:00');
  const [desc, setDesc] = useState('');

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = addRoutine({ title, block, time, desc: desc || 'Custom habit' });
    if (r) { setTitle(''); setDesc(''); onClose(); }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Routine">
      <form onSubmit={submit} className="flex flex-col gap-space-sm">
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-[11px] uppercase text-outline">Routine Name *</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Morning run 5K" className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none focus:ring-1 focus:ring-tertiary-fixed min-h-[40px]" />
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">Block</label>
            <select value={block} onChange={(e) => setBlock(e.target.value as Routine['block'])} className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none min-h-[40px]">
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none min-h-[40px]" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-[11px] uppercase text-outline">Note</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional note" className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none min-h-[40px]" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-space-md h-10 text-on-surface-variant hover:text-primary min-w-[80px]">Cancel</button>
          <button type="submit" className="px-space-md h-10 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg font-semibold hover:bg-tertiary-fixed-dim active:scale-95 min-w-[120px]">Save</button>
        </div>
      </form>
    </Modal>
  );
};
