import { useEffect, useRef } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import {
  showLocalNotification,
  closeLocalNotification,
  claimFiredOnce,
  localTodayStr,
  localHHMM,
} from '../utils/notifications';

function fmt(totalSecs: number) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const ONGOING_TAG = 'productiv-active-timer';

function allowed(): boolean {
  try {
    const st = useLifeOSStore.getState();
    if (!st.data.settings.notificationsEnabled) return false;
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission !== 'granted') return false;
    if (st.isLocked) return false;
    return true;
  } catch {
    return false;
  }
}

/** Cek jadwal routines + calendar yang jamnya tiba (format HH:mm). */
function checkSchedules() {
  if (!allowed()) return;
  const st = useLifeOSStore.getState();
  const now = localHHMM();
  const today = localTodayStr();

  for (const r of st.data.routines) {
    if (r.doneToday) continue;
    if ((r.time || '').slice(0, 5) !== now) continue;
    if (!claimFiredOnce(`routine:${r.id}`, today)) continue;
    void showLocalNotification(`🔔 [${r.time}] ${r.title}`, {
      body: r.desc || 'Waktunya routine. Centang di app kalau sudah.',
      tag: `productiv-routine-${r.id}-${today}`,
      url: './index.html#routines',
    });
  }

  for (const ev of st.data.calendar) {
    if (ev.done) continue;
    if (ev.date !== today) continue;
    if ((ev.startTime || '').slice(0, 5) !== now) continue;
    if (!claimFiredOnce(`event:${ev.id}`, today)) continue;
    void showLocalNotification(`⏰ [${ev.startTime}] ${ev.title}`, {
      body: `${ev.category || 'Agenda'}${ev.location ? ` • ${ev.location}` : ''}${
        ev.endTime ? ` • s/d ${ev.endTime}` : ''
      }`,
      tag: `productiv-event-${ev.id}-${today}`,
      url: './index.html#calendar',
    });
  }
}

/** Notifikasi status timer ongoing (update diam-diam, tidak getar tiap detik). */
function pushOngoingStatus() {
  if (!allowed()) return;
  const st = useLifeOSStore.getState();
  const { timerState, data } = st;
  if (!timerState.isRunning) {
    void closeLocalNotification(ONGOING_TAG);
    return;
  }
  const isStopwatch = timerState.mode === 'stopwatch';
  const secs = isStopwatch
    ? timerState.stopwatchSeconds
    : timerState.secondsRemaining;
  const label = isStopwatch ? 'Stopwatch' : 'Focus Timer';
  void showLocalNotification(`⏱️ ${fmt(secs)} • ${label}`, {
    body: data.focus.targetTaskTitle || 'Deep Work Session',
    tag: ONGOING_TAG,
    alert: false,
    url: './index.html#focus',
  });
}

/**
 * Engine notifikasi lokal:
 * - scheduler tiap 30 detik untuk jadwal routines + calendar
 * - status timer ongoing (update tiap 15 detik saat jalan)
 * - bereskan notifikasi ongoing saat timer berhenti
 */
export function useAppNotifications() {
  const wasRunning = useRef(false);
  const lastSeenCompleted = useRef<number | null>(null);

  useEffect(() => {
    checkSchedules();
    const sched = window.setInterval(checkSchedules, 30_000);
    return () => window.clearInterval(sched);
  }, []);

  useEffect(() => {
    const unsub = useLifeOSStore.subscribe((state) => {
      const running = state.timerState.isRunning;
      if (running && !wasRunning.current) {
        // baru dinyalakan → tampilkan langsung
        pushOngoingStatus();
      }
      if (!running && wasRunning.current) {
        // berhenti (pause/selesai/reset) → cabut notif ongoing
        void closeLocalNotification(ONGOING_TAG);
      }
      wasRunning.current = running;

      // sesi selesai → notifikasi prioritas tinggi + getar
      const doneAt = state.timerState.lastCompletedAt;
      if (doneAt && doneAt !== lastSeenCompleted.current) {
        lastSeenCompleted.current = doneAt;
        if (allowed()) {
          const latest = state.data.focus.history[0];
          const taskName = latest?.task || state.data.focus.targetTaskTitle || 'Deep Work Session';
          const mins = latest?.duration ?? Math.round(state.data.focus.totalSecondsToday / 60);
          void showLocalNotification('🎉 Sesi Fokus Selesai!', {
            body: `${taskName} • ${mins} menit. Kerja bagus — istirahat sejenak.`,
            tag: 'productiv-session-done',
            url: './index.html#focus',
          });
        }
      }
    });

    // refresh angka ongoing tiap 15 detik
    const refresher = window.setInterval(() => {
      if (useLifeOSStore.getState().timerState.isRunning) pushOngoingStatus();
    }, 15_000);

    return () => {
      unsub();
      window.clearInterval(refresher);
    };
  }, []);
}
