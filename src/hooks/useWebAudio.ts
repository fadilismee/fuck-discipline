import { useLifeOSStore } from '../store/useLifeOSStore';
import { audioEngine } from '../audio/engine';

export function useWebAudio() {
  const soundEffects = useLifeOSStore((state) => state.data.settings.soundEffects);

  const playBeep = (freq = 587.33, type: OscillatorType = 'sine', duration = 0.1) => {
    audioEngine.beep(freq, type, duration, soundEffects);
  };

  const playSuccessChime = () => {
    audioEngine.chime(soundEffects);
  };

  const toggleBinauralBeats = (enable: boolean, volume = 50) => {
    audioEngine.setBinaural(enable, volume);
    // sinkron ke store agar persisten antar halaman + ikut popup/PiP
    useLifeOSStore.getState().setAmbientPlaying(enable, volume);
  };

  return {
    playBeep,
    playSuccessChime,
    toggleBinauralBeats,
    isBinauralOn: () => audioEngine.isBinauralOn(),
  };
}
