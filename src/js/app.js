import { getSettings, load } from './storage.js';
import { initKeypad } from './keypad.js';
import { mount, registerScreen, home, handleKey, setRenderHook } from './router.js';
import { applySettings } from './settings.js';
import { initNative } from './native.js';
import { keyTone } from './sound.js';
import { homeScreen } from './home.js';
import { menuScreen } from './menu.js';
import { stubScreen, aboutScreen, optionsScreen, confirmScreen, editorScreen } from './screens.js';
import { contactsScreen, contactScreen } from './contacts.js';
import { callingScreen, incomingScreen, dialScreen, logsScreen, logDetailScreen } from './calls.js';
import { messageListScreen, messageScreen } from './messages.js';
import { snakeScreen, reactionScreen } from './games.js';
import { calculatorScreen } from './calculator.js';
import { clockFaceScreen, stopwatchScreen, timerScreen } from './clock.js';
import { alarmScreen, ringScreen, startScheduler } from './alarm.js';
import { calendarScreen } from './calendar.js';

const SCREENS = {
  home: homeScreen,
  menu: menuScreen,
  stub: stubScreen,
  about: aboutScreen,
  options: optionsScreen,
  confirm: confirmScreen,
  editor: editorScreen,
  contacts: contactsScreen,
  contact: contactScreen,
  dial: dialScreen,
  calling: callingScreen,
  incoming: incomingScreen,
  logs: logsScreen,
  logdetail: logDetailScreen,
  messagelist: messageListScreen,
  message: messageScreen,
  snake: snakeScreen,
  reaction: reactionScreen,
  calculator: calculatorScreen,
  clockface: clockFaceScreen,
  stopwatch: stopwatchScreen,
  timer: timerScreen,
  alarms: alarmScreen,
  ring: ringScreen,
  calendar: calendarScreen,
};

let lastIndicators = '';

function updateIndicators() {
  const el = document.getElementById('indicators');
  if (!el) return;
  const unread = load('messages').some((m) => m.box === 'inbox' && !m.read);
  const alarm = load('alarms').some((a) => a.enabled);
  const html = `${unread ? '<i class="ind ind-msg" title="Unread message"></i>' : ''}${alarm ? '<i class="ind ind-alarm" title="Alarm on"></i>' : ''}`;
  if (html === lastIndicators) return;
  lastIndicators = html;
  el.innerHTML = html;
}

function press(key) {
  const { sound, vibration } = getSettings();
  if (sound) keyTone(key);
  if (vibration && navigator.vibrate) navigator.vibrate(12);
  handleKey(key);
}

function initBattery() {
  const el = document.getElementById('battery');
  if (!el || !navigator.getBattery) return;
  navigator.getBattery().then((battery) => {
    const update = () => {
      el.dataset.level = String(Math.max(1, Math.ceil(battery.level * 4)));
    };
    update();
    battery.addEventListener('levelchange', update);
  }).catch((err) => console.error('[app] battery unavailable', err));
}

function boot() {
  applySettings();
  setRenderHook(updateIndicators);
  mount({
    body: document.getElementById('lcd-body'),
    left: document.getElementById('soft-left'),
    right: document.getElementById('soft-right'),
    toast: document.getElementById('lcd-toast'),
  });
  Object.entries(SCREENS).forEach(([name, screen]) => registerScreen(name, screen));
  initKeypad(document.getElementById('keypad'), press);
  initBattery();
  startScheduler();
  initNative();
  home();
}

window.addEventListener('error', (event) => console.error('[app] uncaught error', event.error || event.message));
window.addEventListener('unhandledrejection', (event) => console.error('[app] unhandled rejection', event.reason));

boot();
