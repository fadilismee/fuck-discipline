import React, { useEffect, useRef, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { useWebAudio } from '../hooks/useWebAudio';
import { compressImage } from '../utils/image';
import type { Project } from '../types';

export const ProjectsPage: React.FC = () => {
  const projects = useLifeOSStore((state) => state.data.projects);
  const tasks = useLifeOSStore((state) => state.data.tasks);
  const toggleMilestone = useLifeOSStore((state) => state.toggleMilestone);
  const deleteProject = useLifeOSStore((s) => s.deleteProject);
  const requestConfirm = useLifeOSStore((s) => s.requestConfirm);
  const openProjectModal = useLifeOSStore((s) => s.openProjectModal);
  const updateProjectNotes = useLifeOSStore((s) => s.updateProjectNotes);
  const addProjectImage = useLifeOSStore((s) => s.addProjectImage);
  const deleteProjectImage = useLifeOSStore((s) => s.deleteProjectImage);
  const openDrawer = useLifeOSStore((s) => s.openDrawer);
  const toggleTask = useLifeOSStore((s) => s.toggleTask);
  const showToast = useLifeOSStore((s) => s.showToast);
  const selectedProjectId = useLifeOSStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useLifeOSStore((s) => s.setSelectedProjectId);
  const { playSuccessChime, playBeep } = useWebAudio();

  const [notesDraft, setNotesDraft] = useState('');
  const [notesSavedTick, setNotesSavedTick] = useState(0);
  const [previewImg, setPreviewImg] = useState<{ dataUrl: string; name: string } | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedProj: Project =
    projects.find((p) => p.id === selectedProjectId) ||
    projects[0] || {
      id: 'proj-1',
      name: 'Productiv',
      tagline: 'Personal OS v2.4',
      description: 'High-agency executive dashboard and digital craftsmanship operating system for power users.',
      category: 'Software',
      status: 'active' as const,
      progress: 72,
      color: 'emerald',
      lead: 'Fadil',
      milestones: [],
      notes: '',
      images: [],
    };
  const activeProjects = projects.filter((p) => p.status === 'active');

  const handleNewProject = () => openProjectModal();

  // Sinkron draft notes setiap ganti project
  useEffect(() => {
    const p = projects.find((x) => x.id === selectedProjectId);
    setNotesDraft(p?.notes || '');
  }, [selectedProjectId, projects]);

  const linkedTasks = selectedProj
    ? tasks.filter((t) => t.project.toLowerCase() === selectedProj.name.toLowerCase())
    : [];

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedProj) return;
    setCompressing(true);
    try {
      const out = await compressImage(file, 89);
      addProjectImage(selectedProj.id, {
        id: 'img-' + Date.now(),
        name: out.name,
        dataUrl: out.dataUrl,
        sizeKB: out.sizeKB,
        createdAt: new Date().toISOString().slice(0, 10),
      });
      playBeep(659.25, 'sine', 0.12);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal memproses gambar', 'info');
    } finally {
      setCompressing(false);
    }
  };

  const handleSaveNotes = () => {
    if (!selectedProj) return;
    updateProjectNotes(selectedProj.id, notesDraft);
    setNotesSavedTick(Date.now());
    playBeep(659.25, 'sine', 0.1);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-space-lg w-full animate-fade-in">
      {/* LEFT: PROJECTS NAVIGATOR LIST (320px) */}
      <aside className="w-full lg:w-[320px] lg:shrink-0 flex flex-col gap-space-md">
        <div className="flex items-center justify-between px-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-wider font-semibold font-mono">
              Projects
            </span>
            <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium font-mono">
              {projects.length}
            </span>
          </div>
          <button
            onClick={handleNewProject}
            className="flex items-center gap-1 h-7 px-space-sm bg-surface-container-high hover:bg-surface-container-highest text-primary rounded text-label-sm font-label-sm transition-colors shadow-sm cursor-pointer font-mono"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>New</span>
          </button>
        </div>

        {/* Active Projects */}
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between px-space-xs py-space-2xs text-outline font-label-sm uppercase tracking-wider font-mono">
            <span>Active ({activeProjects.length})</span>
            <span className="material-symbols-outlined text-[14px]">unfold_more</span>
          </div>

          {activeProjects.map((p) => {
            const isSelected = p.id === selectedProjectId;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`p-space-md rounded-xl text-on-surface flex flex-col gap-space-sm relative overflow-hidden cursor-pointer shadow-sm transition-all duration-150 ${
                  isSelected
                    ? 'bg-surface-container border border-tertiary-fixed/30'
                    : 'bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary-fixed"></div>
                <div className="flex items-start justify-between gap-space-xs">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[16px]">terminal</span>
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold">
                        {p.name}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant truncate font-mono">
                        {p.tagline}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label-sm font-label-sm bg-tertiary-fixed/10 text-tertiary-fixed font-medium font-mono shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed"></span> On Track
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 pt-space-xs font-mono">
                  <div className="flex justify-between items-baseline font-label-sm text-label-sm text-on-surface-variant">
                    <span>Progress</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-medium">
                      {p.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
                    <div
                      className="h-full bg-tertiary-fixed rounded-full transition-all duration-500"
                      style={{ width: `${p.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-label-sm font-label-sm text-outline pt-1">
                    <span>
                      {(p.milestones || []).filter((m) => m.done).length} /{' '}
                      {(p.milestones || []).length} milestones
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">event</span>
                      12 Oct 2026
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Archived Section */}
        <div className="flex flex-col gap-space-xs mt-space-sm font-mono">
          <div className="flex items-center justify-between px-space-xs py-space-2xs text-outline font-label-sm uppercase tracking-wider">
            <span>Archived (4)</span>
            <span className="material-symbols-outlined text-[14px]">folder_open</span>
          </div>
          <div className="flex flex-col gap-1 text-label-sm text-outline">
            <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
              <span>Design System Tokens v1</span>
              <span>Aug 2026</span>
            </div>
            <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
              <span>Q2 Financial Audit</span>
              <span>Jul 2026</span>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT: MAIN PROJECT DETAIL CANVAS */}
      <section className="flex-1 flex flex-col gap-space-lg min-w-0">
        <div className="flex flex-col gap-space-md p-space-xl bg-surface-container-low rounded-xl shadow-md border border-outline-variant/20">
          <div className="flex items-center justify-between flex-wrap gap-space-sm">
            <nav className="flex items-center gap-space-xs font-label-default text-label-default font-mono">
              <span className="text-outline">PROJECTS</span>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-medium">{selectedProj.name}</span>
            </nav>
            <div className="flex items-center gap-space-xs">
              <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded bg-tertiary-fixed/10 text-tertiary-fixed font-label-default text-label-default font-mono">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
                In Progress
              </span>
              <button onClick={() => requestConfirm({ title: 'Hapus project?', message: `"${selectedProj.name}" beserta milestone, notes, dan galerinya akan dihapus permanen.`, confirmLabel: 'Hapus Project', onConfirm: () => deleteProject(selectedProj.id) })} aria-label="Delete project" className="w-9 h-9 rounded-lg flex items-center justify-center text-outline hover:text-error hover:bg-error/10 border border-outline-variant/30">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shadow-sm">
                <span className="material-symbols-outlined text-[24px]">terminal</span>
              </div>
              <h1 className="font-display text-display text-primary tracking-tight font-semibold">
                {selectedProj.name}
              </h1>
            </div>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
              {selectedProj.description}
            </p>
          </div>

          {/* Meta Bar Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm pt-space-xs font-mono">
            <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Progress
              </span>
              <span className="font-headline-md text-headline-md text-primary font-semibold">
                {selectedProj.progress}%
              </span>
              <span className="font-label-sm text-label-sm text-tertiary-fixed">On schedule</span>
            </div>
            <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Milestones
              </span>
              <span className="font-headline-md text-headline-md text-primary font-semibold">
                {(selectedProj.milestones || []).filter((m) => m.done).length} /{' '}
                {(selectedProj.milestones || []).length} done
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Nominal</span>
            </div>
            <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Time Spent
              </span>
              <span className="font-headline-md text-headline-md text-primary font-semibold">
                21h 15m
              </span>
              <span className="font-label-sm text-label-sm text-outline">Target: 30h</span>
            </div>
            <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Deadline
              </span>
              <span className="font-headline-md text-headline-md text-primary font-semibold">
                12 Oct 2026
              </span>
              <span className="font-label-sm text-label-sm text-tertiary-fixed">
                17 days remaining
              </span>
            </div>
          </div>
        </div>

        {/* Milestones Roadmap List */}
        <div className="bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-md">
          <div className="flex items-center justify-between font-mono">
            <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-sans">
              Strategic Milestones &amp; Deliverables
            </span>
            <span className="text-label-sm text-tertiary-fixed">
              {(selectedProj.milestones || []).filter((m) => m.done).length}/
              {(selectedProj.milestones || []).length} Completed
            </span>
          </div>

          <div className="flex flex-col gap-2 font-mono">
            {(selectedProj.milestones || []).map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  toggleMilestone(selectedProj.id, m.id);
                  if (!m.done) playSuccessChime();
                }}
                className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={m.done}
                    onChange={() => {}}
                    className="w-4 h-4 rounded bg-surface-container-lowest accent-tertiary-fixed cursor-pointer pointer-events-none"
                  />
                  <span
                    className={`text-body-default font-sans font-medium ${
                      m.done ? 'line-through text-outline' : 'text-primary'
                    }`}
                  >
                    {m.name}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-outline font-mono">
                  {m.due || 'Q3'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Notes */}
        <div className="bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-sans flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-outline">edit_note</span>
              Project Notes
            </span>
            <div className="flex items-center gap-2">
              {notesSavedTick > 0 && (
                <span key={notesSavedTick} className="font-mono text-[11px] text-tertiary-fixed animate-fade-in">
                  Tersimpan ✓
                </span>
              )}
              <button
                onClick={handleSaveNotes}
                className="h-8 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-[12px] font-medium transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            rows={6}
            placeholder="Tulis detail, spesifikasi, keputusan, link penting… (mendukung ## heading & - list)"
            className="w-full bg-surface-container-lowest p-3 rounded-lg text-on-surface text-[13px] font-mono outline-none focus:ring-1 focus:ring-tertiary-fixed resize-y min-h-[140px] leading-relaxed"
          />
        </div>

        {/* Image Gallery (auto-kompres ≤89KB) */}
        <div className="bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-sans flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-outline">photo_library</span>
              Gallery ({(selectedProj.images || []).length})
            </span>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={compressing}
              className="h-8 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">add_a_photo</span>
              {compressing ? 'Compressing…' : 'Add Image'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          </div>
          <p className="font-mono text-[11px] text-outline">
            Otomatis dikompres ke JPEG ≤ 89KB langsung di browser sebelum disimpan ke JSON.
          </p>
          {(selectedProj.images || []).length === 0 ? (
            <p className="text-[12px] text-outline py-2">Belum ada gambar. Upload mockup / screenshot / referensi.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(selectedProj.images || []).map((img) => (
                <div key={img.id} className="group relative rounded-lg overflow-hidden border border-outline-variant/30 bg-surface-container-lowest">
                  <button onClick={() => setPreviewImg({ dataUrl: img.dataUrl, name: img.name })} className="block w-full" title="Preview fullscreen">
                    <img src={img.dataUrl} alt={img.name} className="w-full h-28 object-cover hover:scale-[1.03] transition-transform" loading="lazy" />
                  </button>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="font-mono text-[10px] text-outline truncate">{img.name} · {img.sizeKB}KB</span>
                    <button
                      onClick={() => requestConfirm({ title: 'Hapus gambar?', message: `"${img.name}" (${img.sizeKB}KB) akan dihapus dari galeri.`, onConfirm: () => deleteProjectImage(selectedProj.id, img.id) })}
                      aria-label={`Delete ${img.name}`}
                      className="w-7 h-7 rounded flex items-center justify-center text-outline hover:text-error hover:bg-error/10 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked Tasks */}
        <div className="bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-sm">
          <span className="font-label-default text-label-default uppercase text-on-surface font-semibold font-sans flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-outline">link</span>
            Linked Tasks ({linkedTasks.length})
          </span>
          {linkedTasks.length === 0 ? (
            <p className="text-[12px] text-outline">Tidak ada task dengan project “{selectedProj.name}”.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {linkedTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
                  onClick={() => openDrawer(t.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(t.id);
                      if (!t.completed) playSuccessChime();
                    }}
                    aria-label={t.completed ? 'Reopen task' : 'Complete task'}
                    className={`w-5 h-5 shrink-0 rounded flex items-center justify-center ${t.completed ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-primary'}`}
                  >
                    {t.completed && <span className="material-symbols-outlined text-[13px] font-bold">check</span>}
                  </button>
                  <span className={`text-[13px] truncate flex-1 ${t.completed ? 'line-through text-outline' : 'text-primary'}`}>
                    {t.title}
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant shrink-0">
                    {t.priority.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Fullscreen image preview */}
      {previewImg && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImg(null)}
        >
          <div className="max-w-4xl w-full flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] text-on-surface-variant truncate">{previewImg.name}</span>
              <button
                onClick={() => setPreviewImg(null)}
                className="w-9 h-9 rounded-lg bg-surface-container-high text-primary flex items-center justify-center hover:bg-surface-container-highest"
                aria-label="Tutup preview"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <img src={previewImg.dataUrl} alt={previewImg.name} className="w-full max-h-[80vh] object-contain rounded-xl border border-outline-variant/30" />
          </div>
        </div>
      )}
    </div>
  );
};
