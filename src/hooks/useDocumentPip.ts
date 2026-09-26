import { useCallback, useEffect, useRef, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';

function fmt(totalSecs: number) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface PipApi {
  pipOpen: boolean;
  pipSupported: boolean;
  openPip: (auto?: boolean) => Promise<void>;
  closePip: () => void;
}

// Document Picture-in-Picture: jendela OS-level yang selalu di atas semua aplikasi.
// Support: Chrome/Edge 116+. Firefox/Safari belum mendukung.
export function useDocumentPip(): PipApi {
  const [pipOpen, setPipOpen] = useState(false);
  const pipWinRef = useRef<Window | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const pipSupported =
    typeof window !== 'undefined' &&
    'documentPictureInPicture' in window;

  const cleanup = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
    pipWinRef.current = null;
    setPipOpen(false);
  }, []);

  const closePip = useCallback(() => {
    try {
      pipWinRef.current?.close();
    } catch {
      /* abaikan */
    }
    cleanup();
  }, [cleanup]);

  const render = useCallback((win: Window) => {
    const st = useLifeOSStore.getState();
    const { timerState, data } = st;
    const isStopwatch = timerState.mode === 'stopwatch';
    const secs = isStopwatch ? timerState.stopwatchSeconds : timerState.secondsRemaining;
    const progress = isStopwatch
      ? 100
      : Math.round(((timerState.initialSeconds - timerState.secondsRemaining) / timerState.initialSeconds) * 100);

    const doc = win.document;
    const setText = (id: string, text: string) => {
      const el = doc.getElementById(id);
      if (el) el.textContent = text;
    };
    setText('pip-time', fmt(secs));
    setText('pip-label', isStopwatch ? 'STOPWATCH' : 'FLOW INTERVAL');
    setText('pip-task', data.focus.targetTaskTitle || 'Deep Work Session');
    setText(
      'pip-status',
      `${isStopwatch ? 'STOPWATCH' : 'TIMER'} • ${timerState.isRunning ? 'LIVE' : 'PAUSED'}${isStopwatch ? '' : ` • ${progress}%`}`
    );
    const C = 678.58;
    const ring = doc.getElementById('pip-ring') as unknown as SVGCircleElement | null;
    if (ring) ring.setAttribute('stroke-dashoffset', String(C - (C * progress) / 100));
    const dot = doc.getElementById('pip-dot') as HTMLElement | null;
    if (dot) {
      dot.style.background = timerState.isRunning ? '#6ffbbe' : '#8e9193';
      dot.style.animation = timerState.isRunning ? 'pipblink 1s infinite' : 'none';
    }
    const live = doc.getElementById('pip-live') as HTMLElement | null;
    if (live) {
      live.textContent = timerState.isRunning ? '● LIVE' : '❚❚ PAUSED';
      live.style.color = timerState.isRunning ? '#6ffbbe' : '#8e9193';
    }
    const toggleBtn = doc.getElementById('pip-toggle') as HTMLElement | null;
    if (toggleBtn) toggleBtn.textContent = timerState.isRunning ? '⏸ Pause' : '▶ Resume';
    const audioBtn = doc.getElementById('pip-audio') as HTMLElement | null;
    if (audioBtn) {
      const on = data.focus.ambientPlaying;
      audioBtn.textContent = on ? '🎧 ALPHA WAVES: ON' : '🎧 ALPHA WAVES: OFF';
      audioBtn.style.color = on ? '#6ffbbe' : '#8e9193';
      audioBtn.style.borderColor = on ? '#6ffbbe' : '#444749';
    }
  }, []);

  // `auto=true` = dibuka otomatis saat timer jalan (tanpa klik). Gagal diam-diam
  // kalau browser menolak (mis. tanpa user-gesture) supaya tidak spam toast.
  const autoFailNotified = useRef(false);
  const openPip = useCallback(async (auto = false) => {
    const st = useLifeOSStore.getState();
    if (!pipSupported) {
      if (!auto) st.showToast('Browser tidak mendukung Pop-out. Pakai Chrome / Edge terbaru.', 'info');
      return;
    }
    if (pipWinRef.current && !pipWinRef.current.closed) {
      try {
        pipWinRef.current.focus();
      } catch {
        /* abaikan */
      }
      return;
    }
    try {
      const pipWin = await (window as unknown as {
        documentPictureInPicture: { requestWindow: (opts?: { width?: number; height?: number }) => Promise<Window> };
      }).documentPictureInPicture.requestWindow({ width: 340, height: 450 });
      pipWinRef.current = pipWin;
      autoFailNotified.current = false;

      const doc = pipWin.document;
      doc.title = 'Productiv Timer';
      // Salin stylesheet yang bisa diakses (same-origin) agar font ikut
      try {
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            const rules = Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
            const styleEl = doc.createElement('style');
            styleEl.textContent = rules;
            doc.head.appendChild(styleEl);
          } catch {
            /* skip stylesheet cross-origin */
          }
        }
      } catch {
        /* abaikan */
      }
      // Animasi blink + font fallback (inline agar tidak tergantung CSS app)
      const anim = doc.createElement('style');
      anim.textContent = `@keyframes pipblink{0%,100%{opacity:1}50%{opacity:.25}}`;
      doc.head.appendChild(anim);

      doc.body.style.margin = '0';
      doc.body.style.background = '#131315';
      doc.body.style.color = '#e5e1e4';
      doc.body.style.fontFamily = "'JetBrains Mono', 'Geist', monospace, sans-serif";
      // Tampilan ring melingkar persis gaya halaman /#focus (Zen Ring)
      doc.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 14px;min-height:100vh;box-sizing:border-box;background:#131315;color:#e5e1e4;">
          <div style="display:flex;align-items:center;gap:6px;width:100%;font-size:10px;letter-spacing:.12em;font-weight:700;color:#8e9193;">
            <span id="pip-dot" style="width:8px;height:8px;border-radius:9999px;background:#8e9193;display:inline-block;"></span>
            <span>PRODUCTIV</span>
            <span id="pip-status" style="margin-left:auto;color:#6ffbbe;">TIMER</span>
          </div>
          <div id="pip-task" style="font-size:12px;color:#e5e1e4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">Deep Work Session</div>
          <div style="position:relative;width:196px;height:196px;flex:none;">
            <svg viewBox="0 0 240 240" width="196" height="196" style="transform:rotate(-90deg);display:block;">
              <circle cx="120" cy="120" r="108" fill="transparent" stroke="#2a2a2c" stroke-width="10"></circle>
              <circle id="pip-ring" cx="120" cy="120" r="108" fill="transparent" stroke="#6ffbbe" stroke-width="10" stroke-linecap="round" stroke-dasharray="678.58" stroke-dashoffset="678.58" style="transition:stroke-dashoffset 1s linear;filter:drop-shadow(0 0 12px rgba(111,251,190,0.45));"></circle>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
              <span id="pip-label" style="font-size:9px;letter-spacing:.22em;color:#8e9193;">FLOW INTERVAL</span>
              <span id="pip-time" style="font-size:36px;font-weight:700;line-height:1.1;color:#ffffff;font-variant-numeric:tabular-nums;">25:00</span>
              <span id="pip-live" style="font-size:9px;letter-spacing:.14em;color:#8e9193;">❚❚ PAUSED</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;width:100%;margin-top:2px;">
            <button id="pip-toggle" style="flex:1;height:40px;border:none;border-radius:8px;background:#6ffbbe;color:#002113;font-weight:700;font-size:13px;cursor:pointer;">⏸ Pause</button>
            <button id="pip-reset" title="Reset" style="height:40px;padding:0 14px;border:1px solid #444749;border-radius:8px;background:#201f22;color:#e5e1e4;font-size:15px;cursor:pointer;">↺</button>
            <button id="pip-close" title="Tutup" style="height:40px;padding:0 14px;border:1px solid #444749;border-radius:8px;background:#201f22;color:#e5e1e4;font-size:13px;cursor:pointer;">✕</button>
          </div>
          <button id="pip-audio" title="Alpha Waves 10Hz" style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;height:34px;border:1px solid #444749;border-radius:8px;background:#201f22;color:#8e9193;font-size:11px;letter-spacing:.1em;cursor:pointer;">🎧 ALPHA WAVES: OFF</button>
        </div>`;

      const store = useLifeOSStore.getState();
      doc.getElementById('pip-toggle')?.addEventListener('click', () => {
        const s = useLifeOSStore.getState();
        if (s.timerState.isRunning) s.pauseTimer();
        else s.startTimer();
      });
      doc.getElementById('pip-reset')?.addEventListener('click', () => {
        useLifeOSStore.getState().resetTimer();
      });
      doc.getElementById('pip-close')?.addEventListener('click', () => closePip());
      doc.getElementById('pip-audio')?.addEventListener('click', () => {
        const s = useLifeOSStore.getState();
        const next = !s.data.focus.ambientPlaying;
        // via engine global agar langsung bunyi walau beda window
        import('../audio/engine').then(({ audioEngine }) => {
          audioEngine.setBinaural(next, s.data.focus.volume ?? 50);
        });
        s.setAmbientPlaying(next);
      });

      // Update tiap ada perubahan state (tick tiap detik ikut ke-update otomatis)
      unsubRef.current = useLifeOSStore.subscribe(() => render(pipWin));
      render(pipWin);

      pipWin.addEventListener('pagehide', cleanup);
      setPipOpen(true);
      if (!auto) store.showToast('Timer di-pop-out. Jendela nempel di atas semua aplikasi.', 'success');
    } catch (err) {
      // User membatalkan / browser menolak (mis. tanpa user-gesture saat auto-open)
      cleanup();
      if (auto && !autoFailNotified.current) {
        autoFailNotified.current = true;
        useLifeOSStore
          .getState()
          .showToast('Auto pop-out diblokir browser. Klik ikon PiP di popup timer sekali saja.', 'info');
      }
    }
  }, [pipSupported, render, cleanup]);

  useEffect(() => {
    return () => {
      unsubRef.current?.();
      try {
        pipWinRef.current?.close();
      } catch {
        /* abaikan */
      }
    };
  }, []);

  return { pipOpen, pipSupported, openPip, closePip };
}
