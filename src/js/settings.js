import { navigate, home, notify } from './router.js';
import { getSettings, setSetting, resetAll } from './storage.js';
import { confirmAction } from './screens.js';
import { effect } from './sound.js';

const THEMES = [['classic', 'Classic Green'], ['mono', 'Monochrome'], ['dark', 'Dark Retro']];
const PROFILES = [
  ['General', { sound: true, vibration: true }],
  ['Silent', { sound: false, vibration: false }],
  ['Vibrate only', { sound: false, vibration: true }],
];

const onOff = (value) => (value ? 'ON' : 'OFF');
const mark = (active) => (active ? '* ' : '  ');

export function applySettings() {
  const { theme, glow, grid } = getSettings();
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.glow = glow ? 'on' : 'off';
  root.dataset.grid = grid ? 'on' : 'off';
}

function toggle(name) {
  setSetting(name, !getSettings()[name]);
  applySettings();
}

const openParams = (params) => () => navigate('options', params());

const displayParams = () => ({
  title: 'Display',
  items: () => {
    const { grid, glow } = getSettings();
    return [
      { label: `Pixel grid: ${onOff(grid)}`, keep: true, run: () => toggle('grid') },
      { label: `Screen glow: ${onOff(glow)}`, keep: true, run: () => toggle('glow') },
    ];
  },
});

const themeParams = () => ({
  title: 'Theme',
  items: () => THEMES.map(([id, name]) => ({
    label: `${mark(getSettings().theme === id)}${name}`,
    keep: true,
    run: () => {
      setSetting('theme', id);
      applySettings();
    },
  })),
});

const languageParams = () => ({
  title: 'Language',
  items: [{ label: '* English', keep: true, run: () => notify('More languages later') }],
});

export const settingsParams = () => ({
  title: 'Settings',
  items: () => {
    const { sound, vibration, timeFormat } = getSettings();
    return [
      { label: 'Display', keep: true, run: openParams(displayParams) },
      { label: 'Theme', keep: true, run: openParams(themeParams) },
      {
        label: `Sound: ${onOff(sound)}`,
        keep: true,
        run: () => {
          toggle('sound');
          effect(700, 0.08);
        },
      },
      {
        label: `Vibration: ${onOff(vibration)}`,
        keep: true,
        run: () => {
          toggle('vibration');
          if (getSettings().vibration) globalThis.navigator?.vibrate?.(40);
        },
      },
      {
        label: `Time format: ${timeFormat}h`,
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
      label: `${mark(values.sound === sound && values.vibration === vibration)}${name}`,
      run: () => {
        setSetting('sound', values.sound);
        setSetting('vibration', values.vibration);
        notify(`${name} on`);
      },
    }));
  },
});
