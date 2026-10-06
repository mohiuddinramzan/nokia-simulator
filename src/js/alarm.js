import { navigate, back, notify } from './router.js';
import { load, addItem, updateItem, removeItem, getSettings } from './storage.js';
import { makeListScreen, openOptions, openEditor } from './screens.js';
import { escapeHtml, fmtHM, pad } from './navigation.js';
import { beep } from './sound.js';
import { t } from './i18n.js';
import { timerDue } from './clock.js';

const SNOOZE_MS = 5 * 60 * 1000;
const MAX_RING_SECONDS = 40;
const fired = new Map();
const snoozes = [];
let ringing = false;

function parseTime(input) {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 3) return null;
  const padded = digits.padStart(4, '0');
  const h = Number(padded.slice(0, 2));
  const m = Number(padded.slice(2));
  return h < 24 && m < 60 ? `${pad(h)}:${pad(m)}` : null;
}

function askTime(onTime) {
  openEditor({
    title: 'Time HHMM',
    max: 4,
    numeric: true,
    onDone: (value) => {
      const time = parseTime(value);
      if (time) onTime(time);
      else if (value) notify('Invalid time');
    },
  });
}

const addAlarm = () => askTime((time) => {
  addItem('alarms', { time, enabled: true });
  notify('Alarm set');
});

const toggleAlarm = (a) => updateItem('alarms', a.id, { enabled: !a.enabled });

export const alarmScreen = makeListScreen({
  title: 'Alarm',
  items: () => load('alarms').filter((a) => typeof a.time === 'string').sort((a, b) => a.time.localeCompare(b.time)),
  label: (a) => `${fmtHM(a.time)} ${t(a.enabled ? 'ON' : 'off')}`,
  empty: 'No alarms',
  emptyLeft: { label: 'Add', run: addAlarm },
  onOk: toggleAlarm,
  onLeft: (a) => openOptions(fmtHM(a.time), [
    { label: a.enabled ? 'Turn off' : 'Turn on', run: () => toggleAlarm(a) },
    { label: 'Edit time', run: () => askTime((time) => updateItem('alarms', a.id, { time })) },
    { label: 'Delete', run: () => removeItem('alarms', a.id) },
    { label: 'Add alarm', run: addAlarm },
  ]),
});

function alert() {
  const { sound, vibration } = getSettings();
  if (sound) {
    beep(1000, 0.15, 0.1);
    setTimeout(() => beep(1000, 0.15, 0.1), 250);
  }
  if (vibration) globalThis.navigator?.vibrate?.([300, 150, 300]);
}

export const ringScreen = {
  enter(p) {
    ringing = true;
    p.seconds = 0;
    clearInterval(p.t);
    p.t = setInterval(() => {
      p.seconds += 1;
      if (p.seconds >= MAX_RING_SECONDS) back();
      else alert();
    }, 1000);
    alert();
  },

  leave(p) {
    clearInterval(p.t);
    p.t = null;
    ringing = false;
  },

  render(p) {
    return {
      body: `<div class="call"><div class="call-status">${escapeHtml(t(p.title))}</div><div class="call-num big">${escapeHtml(t(p.text))}</div></div>`,
      left: 'Stop',
      right: p.snooze ? 'Snooze' : '',
    };
  },

  key(key, p) {
    if (key === 'soft-left' || key === 'ok') {
      back();
    } else if (key === 'soft-right' && p.snooze) {
      snoozes.push({ at: Date.now() + SNOOZE_MS, title: p.title, text: p.text });
      back();
    } else if (key === 'back') {
      return false;
    }
    return true;
  },
};

function checkDue() {
  try {
    if (ringing) return;
    if (timerDue()) {
      navigate('ring', { title: 'Timer', text: "Time's up!" });
      return;
    }
    const now = new Date();
    const due = snoozes.findIndex((s) => s.at <= now.getTime());
    if (due >= 0) {
      const [s] = snoozes.splice(due, 1);
      navigate('ring', { title: s.title, text: s.text, snooze: true });
      return;
    }
    const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const stamp = `${now.toDateString()} ${hm}`;
    const alarm = load('alarms').find((a) => a.enabled && a.time === hm && fired.get(a.id) !== stamp);
    if (alarm) {
      fired.set(alarm.id, stamp);
      navigate('ring', { title: 'Alarm', text: fmtHM(alarm.time), snooze: true });
    }
  } catch (err) {
    console.error('[alarm] scheduler error', err);
  }
}

export function startScheduler() {
  setInterval(checkDue, 500);
}
