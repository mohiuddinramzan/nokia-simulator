import { render, back } from './router.js';
import { titleHtml } from './navigation.js';
import { t, isBengali } from './i18n.js';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS_BN = ['র', 'সো', 'ম', 'বু', 'বৃ', 'শু', 'শ'];

function showToday(p) {
  const now = new Date();
  p.year = now.getFullYear();
  p.month = now.getMonth();
}

function shiftMonth(p, delta) {
  const d = new Date(p.year, p.month + delta, 1);
  p.year = d.getFullYear();
  p.month = d.getMonth();
}

export const calendarScreen = {
  enter(p) {
    if (p.year === undefined) showToday(p);
  },

  render(p) {
    const firstDay = new Date(p.year, p.month, 1).getDay();
    const days = new Date(p.year, p.month + 1, 0).getDate();
    const now = new Date();
    const todayDate = now.getFullYear() === p.year && now.getMonth() === p.month ? now.getDate() : 0;
    const cells = (isBengali() ? WEEKDAYS_BN : WEEKDAYS).map((w) => `<b>${w}</b>`);
    for (let i = 0; i < firstDay; i += 1) cells.push('<i></i>');
    for (let d = 1; d <= days; d += 1) cells.push(`<span${d === todayDate ? ' class="today"' : ''}>${d}</span>`);
    return {
      body: `${titleHtml(`${t(MONTH_NAMES[p.month])} ${p.year}`)}<div class="cal">${cells.join('')}</div>`,
      left: 'Today',
      right: 'Back',
    };
  },

  key(key, p) {
    if (key === 'left') shiftMonth(p, -1);
    else if (key === 'right') shiftMonth(p, 1);
    else if (key === 'up') p.year -= 1;
    else if (key === 'down') p.year += 1;
    else if (key === 'soft-left' || key === 'ok') showToday(p);
    else if (key === 'soft-right') {
      back();
      return true;
    } else return false;
    render();
    return true;
  },
};
