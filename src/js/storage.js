const PREFIX = 'rps:';

export const DEFAULTS = {
  settings: { theme: 'classic', sound: true, vibration: true, timeFormat: '24', language: 'en', glow: true, grid: true },
  contacts: [],
  messages: [],
  callLogs: [],
  highScores: {},
  alarms: [],
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

let settingsCache = null;

function isValid(key, value) {
  return Array.isArray(DEFAULTS[key]) ? Array.isArray(value) : isPlainObject(value);
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[storage] could not save "${key}"`, err);
    return false;
  }
}

export function load(key) {
  if (!(key in DEFAULTS)) {
    console.error(`[storage] unknown key "${key}"`);
    return null;
  }
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return clone(DEFAULTS[key]);
    const value = JSON.parse(raw);
    if (!isValid(key, value)) throw new Error('unexpected data shape');
    if (Array.isArray(value)) return value.filter(isPlainObject);
    return key === 'settings' ? { ...DEFAULTS.settings, ...value } : value;
  } catch (err) {
    console.error(`[storage] "${key}" is unreadable, restoring defaults`, err);
    const fallback = clone(DEFAULTS[key]);
    save(key, fallback);
    return fallback;
  }
}

export function getSettings() {
  if (!settingsCache) settingsCache = load('settings');
  return settingsCache;
}

export function setSetting(name, value) {
  settingsCache = { ...getSettings(), [name]: value };
  save('settings', settingsCache);
  return settingsCache;
}

export function resetAll() {
  Object.keys(DEFAULTS).forEach((key) => {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (err) {
      console.error(`[storage] could not clear "${key}"`, err);
    }
  });
  settingsCache = null;
}

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function addItem(key, item) {
  const items = load(key);
  const entry = { id: newId(), ...item };
  items.push(entry);
  save(key, items);
  return entry;
}

export function updateItem(key, id, patch) {
  const items = load(key);
  const target = items.find((item) => item.id === id);
  if (!target) return null;
  Object.assign(target, patch);
  save(key, items);
  return target;
}

export function removeItem(key, id) {
  save(key, load(key).filter((item) => item.id !== id));
}

export const contactName = (number) => String((load('contacts').find((c) => c.number === number) || {}).name || '');

export const randomNumber = () => '017' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');

export function randomCaller() {
  const contacts = load('contacts').filter((c) => c.number);
  if (contacts.length && Math.random() < 0.5) return String(contacts[Math.floor(Math.random() * contacts.length)].number);
  return randomNumber();
}

export const getHighScore = (game) => Number(load('highScores')[game]) || 0;

export function submitScore(game, score, lowerIsBetter = false) {
  const scores = load('highScores');
  const old = Number(scores[game]) || 0;
  const better = lowerIsBetter ? old === 0 || score < old : score > old;
  if (better) {
    scores[game] = score;
    save('highScores', scores);
  }
  return better;
}
