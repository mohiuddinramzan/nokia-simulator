import { getSettings } from './storage.js';

const DIGIT_ORDER = '123456789*0#';
let ctx = null;

function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function beep(freq = 880, duration = 0.05, volume = 0.06) {
  try {
    const audio = getContext();
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch (err) {
    console.error('[sound] playback failed', err);
  }
}

export function keyTone(key) {
  const index = key.length === 1 ? DIGIT_ORDER.indexOf(key) : -1;
  beep(index >= 0 ? 520 + index * 45 : 420, 0.045);
}

export function effect(freq, duration = 0.08) {
  if (getSettings().sound) beep(freq, duration);
}
