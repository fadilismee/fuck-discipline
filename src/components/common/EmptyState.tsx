import React from 'react';

export const EmptyState: React.FC<{ icon: string; title: string; desc?: string; actionLabel?: string; onAction?: () => void }> = ({ icon, title, desc, actionLabel, onAction }) => (
  <div className="p-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant/40 flex flex-col items-center gap-2 animate-fade-in">
    <span className="material-symbols-outlined text-[32px] text-outline">{icon}</span>
    <p className="font-headline-sm text-primary font-semibold">{title}</p>
    {desc && <p className="font-body-sm text-body-sm text-outline max-w-sm">{desc}</p>}
    {actionLabel && onAction && (
      <button onClick={onAction} className="mt-2 px-space-md h-9 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg text-body-sm font-semibold hover:bg-tertiary-fixed-dim active:scale-95 transition-all">
        {actionLabel}
      </button>
    )}
  </div>
);
