import React from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';

export const Toast: React.FC = () => {
  const toast = useLifeOSStore((state) => state.toast);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-3rem)]">
      <div
        className={`flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-high border shadow-2xl font-label-default text-label-default transition-all duration-300 font-mono ${
          isSuccess
            ? 'text-tertiary-fixed border-tertiary-fixed/30'
            : 'text-primary border-outline-variant/40'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">
          {isSuccess ? 'check_circle' : 'info'}
        </span>
        <span className="font-sans text-[13px]">{toast.message}</span>
      </div>
    </div>
  );
};
