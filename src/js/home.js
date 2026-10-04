import { render, navigate } from './router.js';
import { getSettings } from './storage.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let timer = null;

const pad = (n) => String(n).padStart(2, '0');

function clockParts(d) {
  if (getSettings().timeFormat === '12') {
    return { time: `${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`, suffix: d.getHours() < 12 ? 'AM' : 'PM' };
  }
  return { time: `${pad(d.getHours())}:${pad(d.getMinutes())}`, suffix: '' };
}

export const homeScreen = {
  enter() {
    clearInterval(timer);
    timer = setInterval(render, 1000);
  },

  leave() {
    clearInterval(timer);
    timer = null;
  },

  render() {
    const d = new Date();
    const { time, suffix } = clockParts(d);
    const small = suffix ? `<small>${suffix}</small>` : '';
    return {
      body: `<div class="home"><div class="home-time">${time}${small}</div><div class="home-day">${DAYS[d.getDay()]}</div><div class="home-date">${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</div></div>`,
      left: 'Menu',
      right: 'Names',
    };
  },

  key(key) {
    if (key === 'soft-left' || key === 'ok') navigate('menu');
    else if (key === 'soft-right') navigate('contacts');
    else if (key === 'call') navigate('logs', { type: 'dialled' });
    else if (/^[0-9*#]$/.test(key)) navigate('dial', { number: key });
    else return false;
    return true;
  },
};
