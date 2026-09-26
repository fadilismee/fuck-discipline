// Global audio singleton — hidup selama app berjalan, tidak mati saat ganti halaman.
// Binaural Alpha Waves (10Hz): osc kiri 210Hz, kanan 220Hz.

interface BinauralNodes {
  oscLeft: OscillatorNode;
  oscRight: OscillatorNode;
  masterGain: GainNode;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private binaural: BinauralNodes | null = null;

  getContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  beep(freq = 587.33, type: OscillatorType = 'sine', duration = 0.1, enabled = true) {
    try {
      if (!enabled) return;
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      /* abaikan */
    }
  }

  chime(enabled = true) {
    if (!enabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.beep(f, 'triangle', 0.2, enabled), i * 100);
    });
  }

  isBinauralOn(): boolean {
    return this.binaural !== null;
  }

  setBinaural(on: boolean, volume = 50) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (!on) {
        if (this.binaural) {
          try {
            this.binaural.oscLeft.stop();
            this.binaural.oscRight.stop();
          } catch {
            /* sudah berhenti */
          }
          this.binaural.masterGain.disconnect();
          this.binaural = null;
        }
        return;
      }
      if (this.binaural) {
        this.binaural.masterGain.gain.setValueAtTime(volume / 500, ctx.currentTime);
        return;
      }
      const merger = ctx.createChannelMerger(2);
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume / 500, ctx.currentTime);
      const oscLeft = ctx.createOscillator();
      const oscRight = ctx.createOscillator();
      oscLeft.type = 'sine';
      oscLeft.frequency.setValueAtTime(210, ctx.currentTime);
      oscRight.type = 'sine';
      oscRight.frequency.setValueAtTime(220, ctx.currentTime);
      oscLeft.connect(merger, 0, 0);
      oscRight.connect(merger, 0, 1);
      merger.connect(masterGain);
      masterGain.connect(ctx.destination);
      oscLeft.start();
      oscRight.start();
      this.binaural = { oscLeft, oscRight, masterGain };
    } catch {
      /* abaikan */
    }
  }

  setVolume(volume: number) {
    try {
      if (this.binaural && this.ctx) {
        this.binaural.masterGain.gain.setValueAtTime(volume / 500, this.ctx.currentTime);
      }
    } catch {
      /* abaikan */
    }
  }
}

export const audioEngine = new AudioEngine();
