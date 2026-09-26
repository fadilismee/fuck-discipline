import React from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';
import { Modal } from './Modal';

export const ConfirmModal: React.FC = () => {
  const confirmState = useLifeOSStore((s) => s.confirmState);
  const closeConfirm = useLifeOSStore((s) => s.closeConfirm);
  const confirmDialog = useLifeOSStore((s) => s.confirmDialog);

  return (
    <Modal
      open={!!confirmState}
      onClose={closeConfirm}
      title={confirmState?.title || 'Konfirmasi'}
      maxWidth="max-w-sm"
    >
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 shrink-0 rounded-lg bg-error/15 text-error flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">warning</span>
        </span>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed pt-1">
          {confirmState?.message}
        </p>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={closeConfirm}
          className="h-10 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-body-sm font-medium transition-colors min-w-[96px]"
        >
          Batal
        </button>
        <button
          onClick={confirmDialog}
          autoFocus
          className="h-10 px-space-md rounded-lg bg-error text-white font-body-sm font-semibold hover:brightness-110 active:scale-95 transition-all min-w-[96px]"
        >
          {confirmState?.confirmLabel || 'Hapus'}
        </button>
      </div>
    </Modal>
  );
};
