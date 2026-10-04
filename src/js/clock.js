import { render, back, navigate } from './router.js';
import { titleHtml, escapeHtml, pad, DAYS, MONTHS } from './navigation.js';
import { getSettings } from './storage.js';

const sw = { running: false, startedAt: 0, base: 0 };
const timer = { total: 60000, state: 'idle', endAt: 0, remaining: 0 };
const MIN_TIMER = 10000;
const MAX_TIMER = 99 * 60000 + 59000;

const swElapsed = () => sw.base + (sw.running ? Date.now() - sw.startedAt : 0);

function timerLeft() {
  if (timer.state === 'running') return Math.max(0, timer.endAt - Date.now());
  return timer.state === 'paused' ? timer.remaining : timer.total;
}

export function timerDue() {
  if (timer.state !== 'running' || Date.now() < timer.endAt) return false;
  timer.state = 'idle';
  return true;
}

export const clockMenuParams = () => ({
  title: 'Clock',
  items: [
    { label: 'Time and date', keep: true, run: () => navigate('clockface') },
    { label: 'Stopwatch', keep: true, run: () => navigate('stopwatch') },
    { label: 'Countdown timer', keep: true, run: () => navigate('timer') },
  ],
});

function ticking(ms) {
  return {
    enter(p) {
      clearInterval(p.t);
      p.t = setInterval(render, ms);
    },
    leave(p) {
      clearInterval(p.t);
      p.t = null;
    },
  };
}

export const clockFaceScreen = {
  ...ticking(1000),

  render() {
    const d = new Date();
    const twelve = getSettings().timeFormat === '12';
    const h = twelve ? d.getHours() % 12 || 12 : pad(d.getHours());
    const suffix = twelve ? (d.getHours() < 12 ? 'AM' : 'PM') : '';
    return {
      body: `<div class="home"><div class="home-time">${h}:${pad(d.getMinutes())}<small>:${pad(d.getSeconds())} ${suffix}</small></div><div class="home-day">${DAYS[d.getDay()]}</div><div class="home-date">${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</div></div>`,
      left: '',
      right: 'Back',
    };
  },

  key(key) {
    if (key !== 'soft-right') return false;
    back();
    return true;
  },
};

const fmtStopwatch = (ms) => `${pad(Math.floor(ms / 60000) % 100)}:${pad(Math.floor(ms / 1000) % 60)}.${Math.floor(ms / 100) % 10}`;

function fmtCountdown(ms) {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  return `${h ? `${pad(h)}:` : ''}${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

function toggleStopwatch() {
  if (sw.running) {
    sw.base = swElapsed();
    sw.running = false;
  } else {
    sw.startedAt = Date.now();
    sw.running = true;
  }
}

export const stopwatchScreen = {
  ...ticking(100),

  render() {
    const canReset = !sw.running && swElapsed() > 0;
    return {
      body: `${titleHtml('Stopwatch')}<div class="call"><div class="call-num big">${fmtStopwatch(swElapsed())}</div></div>`,
      left: sw.running ? 'Stop' : 'Start',
      right: canReset ? 'Reset' : 'Back',
    };
  },

  key(key) {
    if (key === 'ok' || key === 'soft-left') {
      toggleStopwatch();
      render();
    } else if (key === 'soft-right') {
      if (!sw.running && swElapsed() > 0) {
        sw.base = 0;
        render();
      } else {
        back();
      }
    } else {
      return false;
    }
    return true;
  },
};

const ADJUST = { up: 60000, down: -60000, right: 10000, left: -10000 };

function toggleTimer() {
  if (timer.state === 'running') {
    timer.remaining = timerLeft();
    timer.state = 'paused';
  } else {
    timer.endAt = Date.now() + timerLeft();
    timer.state = 'running';
  }
}

export const timerScreen = {
  ...ticking(200),

  render() {
    const idle = timer.state === 'idle';
    return {
      body: `${titleHtml('Timer')}<div class="call"><div class="call-num big">${fmtCountdown(timerLeft())}</div>${idle ? '<div class="calc-hint">↑↓ 1 min  ←→ 10 s</div>' : ''}</div>`,
      left: timer.state === 'running' ? 'Pause' : 'Start',
      right: idle ? 'Back' : 'Reset',
    };
  },

  key(key) {
    if (ADJUST[key]) {
      if (timer.state === 'idle') {
        timer.total = Math.min(MAX_TIMER, Math.max(MIN_TIMER, timer.total + ADJUST[key]));
        render();
      }
    } else if (key === 'ok' || key === 'soft-left') {
      toggleTimer();
      render();
    } else if (key === 'soft-right') {
      if (timer.state === 'idle') {
        back();
      } else {
        timer.state = 'idle';
        render();
      }
    } else {
      return false;
    }
    return true;
  },
};
