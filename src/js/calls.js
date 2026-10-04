import { navigate, replace, back, notify, render } from './router.js';
import { addItem, updateItem, removeItem, save, load, contactName, randomCaller, getSettings } from './storage.js';
import { makeListScreen, makeInfoScreen, openOptions, confirmAction } from './screens.js';
import { escapeHtml, fmtDate, fmtTime, fmtDuration } from './navigation.js';
import { beep } from './sound.js';
import { compose } from './messages.js';

const MAX_DIGITS = 15;
const CONNECT_TICKS = 8;
const RING_TICKS = 10;
const TYPE_TITLES = { missed: 'Missed calls', received: 'Received calls', dialled: 'Dialled numbers' };
const TYPE_NAMES = { missed: 'Missed', received: 'Received', dialled: 'Dialled' };

const logCall = (type, number) => addItem('callLogs', { type, number, ts: Date.now(), duration: 0 });
const who = (number) => contactName(number) || number;
const findLog = (id) => load('callLogs').find((l) => l.id === id);

function callView(status, number) {
  const name = contactName(number);
  return `<div class="call"><div class="call-status">${status}</div>${name ? `<div class="call-name">${escapeHtml(name)}</div>` : ''}<div class="call-num">${escapeHtml(number)}</div></div>`;
}

export function startCall(number, replaceTop = false) {
  if (!number) return;
  const entry = logCall('dialled', number);
  (replaceTop ? replace : navigate)('calling', { number, logId: entry.id, tick: 0, seconds: 0, connected: false });
}

export function simulateIncoming() {
  navigate('incoming', { number: randomCaller() });
}

export function simulateMissed() {
  logCall('missed', randomCaller());
  notify('Missed call');
}

function ring() {
  const { sound, vibration } = getSettings();
  if (sound) {
    beep(880, 0.12, 0.08);
    setTimeout(() => beep(660, 0.12, 0.08), 180);
  }
  if (vibration) globalThis.navigator?.vibrate?.([200, 100, 200]);
}

function step(p) {
  p.tick += 1;
  if (!p.connected && p.tick >= CONNECT_TICKS) {
    p.connected = true;
    p.connectedAt = Date.now();
  }
  if (p.connected) p.seconds = Math.floor((Date.now() - p.connectedAt) / 1000);
  render();
}

export const callingScreen = {
  enter(p) {
    if (!p.timer) p.timer = setInterval(() => step(p), 500);
  },

  leave(p) {
    clearInterval(p.timer);
    p.timer = null;
    if (p.connected && p.logId) updateItem('callLogs', p.logId, { duration: p.seconds });
  },

  render(p) {
    const dots = p.tick % 4;
    const status = p.connected
      ? fmtDuration(p.seconds)
      : `Calling${'.'.repeat(dots)}<span class="ghost">${'.'.repeat(3 - dots)}</span>`;
    return { body: callView(status, p.number), left: '', right: p.connected ? 'End' : 'Cancel' };
  },

  key(key) {
    if (key !== 'soft-right') return false;
    back();
    return true;
  },
};

function accept(p) {
  p.resolved = true;
  const entry = logCall('received', p.number);
  replace('calling', { number: p.number, logId: entry.id, tick: 0, seconds: 0, connected: true, connectedAt: Date.now() });
}

export const incomingScreen = {
  enter(p) {
    if (p.timer) return;
    p.ticks = 0;
    ring();
    p.timer = setInterval(() => {
      p.ticks += 1;
      if (p.ticks >= RING_TICKS) back();
      else ring();
    }, 1200);
  },

  leave(p) {
    clearInterval(p.timer);
    p.timer = null;
    if (p.resolved) return;
    p.resolved = true;
    logCall('missed', p.number);
    notify('Missed call');
  },

  render(p) {
    return { body: callView('Incoming Call', p.number), left: 'Accept', right: 'Reject' };
  },

  key(key, p) {
    if (key === 'soft-left' || key === 'call' || key === 'ok') accept(p);
    else if (key === 'soft-right') back();
    else return false;
    return true;
  },
};

export const dialScreen = {
  render(p) {
    const name = contactName(p.number);
    return {
      body: `<div class="call"><div class="call-num big">${escapeHtml(p.number)}</div><div class="call-name">${escapeHtml(name)}&nbsp;</div></div>`,
      left: p.number ? 'Call' : '',
      right: p.number ? 'Clear' : 'Back',
    };
  },

  key(key, p) {
    if (/^[0-9*#]$/.test(key)) {
      if (p.number.length < MAX_DIGITS) p.number += key;
      render();
    } else if (key === 'soft-right' || key === 'back') {
      if (p.number) {
        p.number = p.number.slice(0, -1);
        render();
      } else {
        back();
      }
    } else if (key === 'soft-left' || key === 'ok' || key === 'call') {
      startCall(p.number, true);
    }
    return true;
  },
};

function logActions(l, fromDetail) {
  return [
    { label: 'Call', run: () => startCall(l.number) },
    { label: 'Send message', run: () => compose({ number: l.number }) },
    {
      label: 'Delete',
      run: () => confirmAction('Delete', 'Delete this entry?', () => {
        removeItem('callLogs', l.id);
        if (fromDetail) back();
      }),
    },
  ];
}

export const callLogParams = () => ({
  title: 'Call Log',
  items: [
    { label: 'Missed calls', keep: true, run: () => navigate('logs', { type: 'missed' }) },
    { label: 'Received calls', keep: true, run: () => navigate('logs', { type: 'received' }) },
    { label: 'Dialled numbers', keep: true, run: () => navigate('logs', { type: 'dialled' }) },
    { label: 'Clear all', keep: true, run: () => confirmAction('Clear log', 'Delete all calls?', () => save('callLogs', [])) },
    { label: 'Simulate incoming', keep: true, run: simulateIncoming },
    { label: 'Simulate missed', keep: true, run: simulateMissed },
  ],
});

export const logsScreen = makeListScreen({
  title: (p) => TYPE_TITLES[p.type] || 'Calls',
  items: (p) => load('callLogs').filter((l) => l.type === p.type).sort((a, b) => b.ts - a.ts),
  label: (l) => `${fmtDate(l.ts)} ${who(l.number)}`,
  empty: 'No calls',
  onOk: (l) => navigate('logdetail', { id: l.id }),
  onLeft: (l) => openOptions(who(l.number), logActions(l, false)),
});

export const logDetailScreen = makeInfoScreen({
  title: ({ id }) => TYPE_NAMES[(findLog(id) || {}).type] || 'Call',
  lines: ({ id }) => {
    const l = findLog(id);
    if (!l) return ['Not found'];
    const name = contactName(l.number);
    return [name, l.number, `${fmtDate(l.ts)} ${fmtTime(l.ts)}`, l.duration ? `Time ${fmtDuration(l.duration)}` : ''].filter(Boolean);
  },
  onLeft: ({ id }) => {
    const l = findLog(id);
    if (l) openOptions(who(l.number), logActions(l, true));
  },
  onOk: ({ id }) => {
    const l = findLog(id);
    if (l) startCall(l.number);
  },
});
