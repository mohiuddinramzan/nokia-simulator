import { navigate, back, render, notify } from './router.js';
import { createList, listHtml, titleHtml } from './navigation.js';
import { messageMenuParams } from './messages.js';
import { callLogParams } from './calls.js';
import { gamesParams } from './games.js';
import { clockMenuParams } from './clock.js';
import { settingsParams, profilesParams } from './settings.js';

export const MENU_ITEMS = [
  { label: 'Messages', screen: 'options', params: messageMenuParams },
  { label: 'Contacts', screen: 'contacts', params: () => ({}) },
  { label: 'Call Log', screen: 'options', params: callLogParams },
  { label: 'Games', screen: 'options', params: gamesParams },
  { label: 'Settings', screen: 'options', params: settingsParams },
  { label: 'Alarm', screen: 'alarms', params: () => ({}) },
  { label: 'Calculator', screen: 'calculator', params: () => ({}) },
  { label: 'Calendar', screen: 'calendar', params: () => ({}) },
  { label: 'Clock', screen: 'options', params: clockMenuParams },
  { label: 'Profiles', screen: 'options', params: profilesParams },
  { label: 'About', screen: 'about' },
];

const list = createList(3);
const count = MENU_ITEMS.length;

function open(index) {
  const item = MENU_ITEMS[index];
  if (!item) return;
  try {
    navigate(item.screen, item.params ? item.params() : { title: item.label, phase: item.phase });
  } catch (err) {
    console.error(`[menu] could not open "${item.label}"`, err);
    notify('Unavailable');
  }
}

export const menuScreen = {
  enter(params) {
    if (params.visited) return;
    list.reset();
    params.visited = true;
  },

  render() {
    return {
      body: titleHtml('Menu', `${list.state.index + 1}/${count}`) + listHtml(MENU_ITEMS.map((item) => item.label), list),
      left: 'Select',
      right: 'Back',
    };
  },

  key(key) {
    if (key === 'up' || key === 'down') {
      list.move(key === 'up' ? -1 : 1, count);
      render();
      return true;
    }
    if (key === 'ok' || key === 'soft-left') {
      open(list.state.index);
      return true;
    }
    if (key === 'soft-right') {
      back();
      return true;
    }
    if (/^[1-9]$/.test(key)) {
      const target = Number(key) - 1;
      list.move(target - list.state.index, count);
      open(target);
      return true;
    }
    return false;
  },
};
