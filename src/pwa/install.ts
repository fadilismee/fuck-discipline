// Shared holder untuk beforeinstallprompt agar bisa dipicu dari mana saja
// (banner otomatis maupun tombol manual di Settings).

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function saveInstallPrompt(e: Event) {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
  notify();
}

export function clearInstallPrompt() {
  deferred = null;
  notify();
}

export function canInstall(): boolean {
  return deferred !== null;
}

export function onInstallAvailabilityChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function requestInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  await deferred.prompt();
  const choice = await deferred.userChoice;
  if (choice.outcome === 'accepted') {
    deferred = null;
    notify();
  }
  return choice.outcome;
}
