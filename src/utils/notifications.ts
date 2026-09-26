// Helper Web Notifications API + Service Worker (PWA Notifications).
// Semua notifikasi bersifat lokal — tidak ada server, tidak ada data keluar.

export type NotifPermission = NotificationPermission | 'unsupported';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotifPermission(): NotifPermission {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotifPermission(): Promise<NotifPermission> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export interface LocalNotifOptions {
  body?: string;
  tag?: string;
  /** kalau true: HP getar + bunyi tiap muncul. false = update diam-diam (untuk timer ongoing). */
  alert?: boolean;
  url?: string;
  vibratePattern?: number[];
}

async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (!('serviceWorker' in navigator)) return null;
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

/** Tampilkan notifikasi OS. Prioritaskan via Service Worker agar nempel di HP. */
export async function showLocalNotification(
  title: string,
  opts: LocalNotifOptions = {}
): Promise<void> {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  const {
    body,
    tag,
    alert = true,
    url = './index.html',
    vibratePattern,
  } = opts;

  const options: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
    body,
    tag,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    silent: !alert,
    renotify: alert,
    vibrate: vibratePattern ?? (alert ? [200, 100, 200] : undefined),
    data: { url },
  };

  try {
    const reg = await getSWRegistration();
    if (reg?.showNotification) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* fallback ke Web Notification biasa */
  }

  try {
    const n = new Notification(title, {
      body,
      tag,
      icon: './icons/icon-192.png',
      silent: !alert,
    });
    if (url && url !== './index.html') {
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } else {
      n.onclick = () => {
        window.focus();
        n.close();
      };
    }
  } catch {
    /* abaikan */
  }
}

/** Tutup notifikasi bertag tertentu (mis. timer ongoing saat di-pause). */
export async function closeLocalNotification(tag: string): Promise<void> {
  try {
    const reg = await getSWRegistration();
    if (!reg?.getNotifications) return;
    const list = await reg.getNotifications({ tag });
    list.forEach((n) => n.close());
  } catch {
    /* abaikan */
  }
}

// --- Anti-spam tracker: tiap item hanya bunyi 1x per hari ---

const FIRED_KEY = 'productiv_notif_fired_v1';

function readFired(): { date: string; ids: string[] } {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.date === 'string' && Array.isArray(parsed.ids)) {
        return parsed;
      }
    }
  } catch {
    /* abaikan */
  }
  return { date: '', ids: [] };
}

/** true kalau id ini sudah pernah dibunyikan hari ini (sekaligus tandai). */
export function claimFiredOnce(id: string, todayStr: string): boolean {
  try {
    const cur = readFired();
    const ids = cur.date === todayStr ? cur.ids : [];
    if (ids.includes(id)) return false;
    ids.push(id);
    localStorage.setItem(FIRED_KEY, JSON.stringify({ date: todayStr, ids }));
    return true;
  } catch {
    return true;
  }
}

export function localTodayStr(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function localHHMM(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
