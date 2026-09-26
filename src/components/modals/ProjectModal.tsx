import React, { useState } from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';
import { Modal } from '../common/Modal';

export const ProjectModal: React.FC = () => {
  const open = useLifeOSStore((s) => s.isProjectModalOpen);
  const onClose = useLifeOSStore((s) => s.closeProjectModal);
  const addProject = useLifeOSStore((s) => s.addProject);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Software');

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = addProject({ name, tagline: tagline || 'Strategic Scope', description, category });
    if (r) { setName(''); setTagline(''); setDescription(''); onClose(); }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Project">
      <form onSubmit={submit} className="flex flex-col gap-space-sm">
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-[11px] uppercase text-outline">Project Name *</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mobile App v2" className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none focus:ring-1 focus:ring-tertiary-fixed min-h-[40px]" />
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">Tagline</label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="v1 Scope" className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none min-h-[40px]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase text-outline">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-surface-container-lowest px-3 py-2 rounded-lg text-primary outline-none min-h-[40px]">
              <option>Software</option><option>Education</option><option>Health</option><option>Finance</option><option>General</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-[11px] uppercase text-outline">Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tujuan & scope project..." className="bg-surface-container-lowest p-3 rounded-lg text-primary outline-none resize-none" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-space-md h-10 text-on-surface-variant hover:text-primary min-w-[80px]">Cancel</button>
          <button type="submit" className="px-space-md h-10 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg font-semibold hover:bg-tertiary-fixed-dim active:scale-95 min-w-[120px]">Create</button>
        </div>
      </form>
    </Modal>
  );
};
