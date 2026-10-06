import { navigate, home, notify, render } from './router.js';
import { getSettings, setSetting, resetAll } from './storage.js';
import { confirmAction, makeInfoScreen } from './screens.js';
import { effect } from './sound.js';
import { t } from './i18n.js';
import { REAL_AVAILABLE, isNative, requestPhonePermissions, phoneStatus, noteError, getLastError } from './phone.js';

const THEMES = [['classic', 'Classic Green'], ['mono', 'Monochrome'], ['dark', 'Dark Retro']];
const PROFILES = [
  ['General', { sound: true, vibration: true }],
  ['Silent', { sound: false, vibration: false }],
  ['Vibrate only', { sound: false, vibration: true }],
];

const onOff = (value) => t(value ? 'ON' : 'OFF');
const mark = (active) => (active ? '* ' : '  ');

export function applySettings() {
  const { theme, glow, grid, language } = getSettings();
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.lang = language === 'bn' ? 'bn' : 'en';
  root.dataset.glow = glow ? 'on' : 'off';
  root.dataset.grid = grid ? 'on' : 'off';
}

function toggle(name) {
  setSetting(name, !getSettings()[name]);
  applySettings();
}

async function enableReal() {
  setSetting('realMode', true);
  try {
    const p = await requestPhonePermissions();
    const ok = (name) => t(p[name] === 'granted' ? 'OK' : 'no');
    notify(t('Call {c} SMS {s}', { c: ok('call'), s: ok('sendSms') }));
  } catch (err) {
    console.error('[settings] permission request failed', err);
    noteError(err);
    notify('Real mode on');
  }
}

function toggleReal() {
  if (getSettings().realMode) {
    setSetting('realMode', false);
    notify('Simulation mode');
  } else if (!isNative()) {
    notify('Android app only');
  } else {
    confirmAction('Real mode', 'Real calls and SMS may cost money. Turn on?', enableReal);
  }
}

function loadStatus(params) {
  params.status = null;
  phoneStatus().then((status) => {
    params.status = status;
    render();
  });
}

export const phoneStatusScreen = makeInfoScreen({
  title: 'Phone status',
  left: 'Recheck',
  onEnter: loadStatus,
  onLeft: loadStatus,
  lines: ({ status }) => {
    if (!status) return ['Checking...'];
    const rows = [
      `Android app: ${status.native ? 'yes' : 'no'}`,
      `Real mode: ${getSettings().realMode ? 'ON' : 'OFF'}`,
      `Plugin: ${status.plugin}`,
      `Call: ${status.call}`,
      `SMS send: ${status.sendSms}`,
    ];
    const error = getLastError();
    return error ? [...rows, `Error: ${error}`] : rows;
  },
});

const openParams = (params) => () => navigate('options', params());

const displayParams = () => ({
  title: 'Display',
  items: () => {
    const { grid, glow } = getSettings();
    return [
      { label: t('Pixel grid: {v}', { v: onOff(grid) }), keep: true, run: () => toggle('grid') },
      { label: t('Screen glow: {v}', { v: onOff(glow) }), keep: true, run: () => toggle('glow') },
    ];
  },
});

const themeParams = () => ({
  title: 'Theme',
  items: () => THEMES.map(([id, name]) => ({
    label: `${mark(getSettings().theme === id)}${t(name)}`,
    keep: true,
    run: () => {
      setSetting('theme', id);
      applySettings();
    },
  })),
});

const LANGUAGES = [['en', 'English'], ['bn', 'বাংলা']];

const languageParams = () => ({
  title: 'Language',
  items: () => LANGUAGES.map(([id, name]) => ({
    label: `${mark(getSettings().language === id)}${name}`,
    keep: true,
    run: () => {
      setSetting('language', id);
      applySettings();
    },
  })),
});

export const settingsParams = () => ({
  title: 'Settings',
  items: () => {
    const { sound, vibration, timeFormat, realMode } = getSettings();
    return [
      ...(REAL_AVAILABLE ? [
        { label: t('Real mode: {v}', { v: onOff(realMode) }), keep: true, run: toggleReal },
        { label: 'Phone status', keep: true, run: () => navigate('phonestatus') },
      ] : []),
      { label: 'Display', keep: true, run: openParams(displayParams) },
      { label: 'Theme', keep: true, run: openParams(themeParams) },
      {
        label: t('Sound: {v}', { v: onOff(sound) }),
        keep: true,
        run: () => {
          toggle('sound');
          effect(700, 0.08);
        },
      },
      {
        label: t('Vibration: {v}', { v: onOff(vibration) }),
        keep: true,
        run: () => {
          toggle('vibration');
          if (getSettings().vibration) globalThis.navigator?.vibrate?.(40);
        },
      },
      {
        label: t('Time format: {v}', { v: `${timeFormat}h` }),
        keep: true,
        run: () => setSetting('timeFormat', timeFormat === '24' ? '12' : '24'),
      },
      { label: 'Language', keep: true, run: openParams(languageParams) },
      {
        label: 'Reset app',
        keep: true,
        run: () => confirmAction('Reset app', 'Erase all data?', () => {
          resetAll();
          applySettings();
          home();
          notify('App reset');
        }),
      },
    ];
  },
});

export const profilesParams = () => ({
  title: 'Profiles',
  items: () => {
    const { sound, vibration } = getSettings();
    return PROFILES.map(([name, values]) => ({
      label: `${mark(values.sound === sound && values.vibration === vibration)}${t(name)}`,
      run: () => {
        setSetting('sound', values.sound);
        setSetting('vibration', values.vibration);
        notify(t('{name} on', { name: t(name) }));
      },
    }));
  },
});
