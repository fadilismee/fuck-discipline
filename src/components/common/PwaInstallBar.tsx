import React, { useEffect, useState } from 'react';
import {
  saveInstallPrompt,
  clearInstallPrompt,
  onInstallAvailabilityChange,
  canInstall,
  requestInstall,
} from '../../pwa/install';

const DISMISS_KEY = 'productiv_pwa_dismiss_v1';

function isStandalone(): boolean {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

export const PwaInstallBar: React.FC = () => {
  const [, force] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1' || isStandalone()) {
        setDismissed(true);
        return;
      }
    } catch {
      /* abaikan */
    }
    const rerender = () => force((n) => n + 1);
    const offAvail = onInstallAvailabilityChange(rerender);
    const onPrompt = (e: Event) => saveInstallPrompt(e);
    const onInstalled = () => {
      setInstalled(true);
      clearInstallPrompt();
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      offAvail();
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (dismissed || installed || !canInstall()) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* abaikan */
    }
  };

  const install = async () => {
    const outcome = await requestInstall();
    if (outcome === 'dismissed') dismiss();
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] w-[calc(100%-2rem)] max-w-sm animate-scale-in">
      <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low/95 backdrop-blur-md shadow-2xl px-4 py-3">
        <span className="w-10 h-10 shrink-0 rounded-lg bg-tertiary-fixed/15 text-tertiary-fixed flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">install_mobile</span>
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-body-sm text-body-sm text-primary font-semibold leading-tight">
            Install PRODUCTIV OS
          </p>
          <p className="font-mono text-[11px] text-outline leading-tight">
            Jadi app HP • fullscreen • 100% offline
          </p>
        </div>
        <button
          onClick={install}
          className="h-9 px-3 shrink-0 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed font-body-sm font-semibold hover:bg-tertiary-fixed-dim active:scale-95 transition-all"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Tutup"
          className="w-8 h-8 shrink-0 flex items-center justify-center text-outline hover:text-primary rounded transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
};
