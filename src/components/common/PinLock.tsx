import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLifeOSStore } from '../../store/useLifeOSStore';
import { useWebAudio } from '../../hooks/useWebAudio';
import { APP_PIN } from '../../security/pin';

const PIN_LEN = APP_PIN.length;

export const PinLock: React.FC = () => {
  const isLocked = useLifeOSStore((s) => s.isLocked);
  const unlock = useLifeOSStore((s) => s.unlock);
  const { playBeep, playSuccessChime } = useWebAudio();

  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
  useEffect(() => clearTimers, []);

  const tryUnlock = useCallback(
    (pin: string) => {
      if (pin.length !== PIN_LEN) return;
      if (unlock(pin)) {
        setError(false);
        setSuccess(true);
        playSuccessChime();
        timerRef.current = setTimeout(() => {
          setDigits('');
          setSuccess(false);
        }, 600);
      } else {
        setError(true);
        playBeep(220, 'sawtooth', 0.2);
        timerRef.current = setTimeout(() => {
          setDigits('');
          setError(false);
        }, 600);
      }
    },
    [unlock, playBeep, playSuccessChime]
  );

  const press = useCallback(
    (d: string) => {
      if (!isLocked || success) return;
      playBeep(520, 'sine', 0.05);
      setDigits((prev) => {
        if (prev.length >= PIN_LEN) return prev;
        const next = prev + d;
        if (next.length === PIN_LEN) {
          timerRef.current = setTimeout(() => tryUnlock(next), 120);
        }
        return next;
      });
    },
    [isLocked, success, playBeep, tryUnlock]
  );

  const backspace = useCallback(() => {
    setDigits((prev) => prev.slice(0, -1));
    playBeep(330, 'sine', 0.05);
  }, [playBeep]);

  useEffect(() => {
    if (!isLocked) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        press(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isLocked, press, backspace]);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-surface-container-lowest flex items-center justify-center p-4 animate-fade-in">
      <div
        className={`w-full max-w-xs flex flex-col items-center gap-6 ${error ? 'animate-shake' : ''}`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-tertiary-fixed shadow-2xl">
            <span className="material-symbols-outlined text-[28px]">terminal</span>
          </div>
          <h1 className="font-mono font-bold text-primary tracking-widest text-[15px] mt-1">
            PRODUCTIV
          </h1>
          <p className="font-mono text-[11px] text-outline uppercase tracking-widest flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[13px]">lock</span>
            Terminal locked
          </p>
        </div>

        <div className="flex items-center gap-3" aria-label="PIN dots">
          {Array.from({ length: PIN_LEN }).map((_, i) => (
            <span
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                i < digits.length
                  ? success
                    ? 'bg-tertiary-fixed border-tertiary-fixed shadow-[0_0_8px_rgba(111,251,190,0.7)]'
                    : error
                    ? 'bg-error border-error'
                    : 'bg-primary border-primary'
                  : 'border-outline-variant bg-transparent'
              }`}
            />
          ))}
        </div>

        {error ? (
          <p className="font-mono text-[12px] text-error animate-fade-in">PIN salah. Coba lagi.</p>
        ) : success ? (
          <p className="font-mono text-[12px] text-tertiary-fixed animate-fade-in">Unlocked ✓</p>
        ) : (
          <p className="font-mono text-[11px] text-outline">Masukkan 6-digit PIN</p>
        )}

        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => press(d)}
              className="h-14 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-primary font-mono font-bold text-[18px] border border-outline-variant/30"
            >
              {d}
            </button>
          ))}
          <span />
          <button
            onClick={() => press('0')}
            className="h-14 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-primary font-mono font-bold text-[18px] border border-outline-variant/30"
          >
            0
          </button>
          <button
            onClick={backspace}
            aria-label="Hapus digit"
            className="h-14 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-on-surface-variant border border-outline-variant/30 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">backspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
