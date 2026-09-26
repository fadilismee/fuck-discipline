import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, maxWidth = 'max-w-md' }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-surface-container-low rounded-xl p-space-lg w-full ${maxWidth} border border-outline-variant/40 shadow-2xl flex flex-col gap-space-md animate-scale-in max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between border-b border-surface-container-highest pb-space-xs sticky top-0 bg-surface-container-low">
          <span className="font-headline-sm text-headline-sm text-primary font-bold truncate">{title}</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors shrink-0" aria-label="Close">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
