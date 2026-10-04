import { getSettings } from './storage.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const pad = (n) => String(n).padStart(2, '0');

export const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const titleHtml = (title, right = '') =>
  `<div class="title"><span>${escapeHtml(title)}</span><span>${escapeHtml(right)}</span></div>`;

export function fmtDate(ts) {
  const d = new Date(ts);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
}

export function fmtTime(ts) {
  const d = new Date(ts);
  const h = d.getHours();
  if (getSettings().timeFormat === '12') return `${h % 12 || 12}:${pad(d.getMinutes())}${h < 12 ? 'am' : 'pm'}`;
  return `${pad(h)}:${pad(d.getMinutes())}`;
}

export function fmtHM(hm) {
  const [h, m] = hm.split(':').map(Number);
  if (getSettings().timeFormat === '12') return `${h % 12 || 12}:${pad(m)}${h < 12 ? 'am' : 'pm'}`;
  return `${pad(h)}:${pad(m)}`;
}

export const fmtDuration = (sec) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;

export function wrapLines(text, width = 19) {
  const lines = [];
  String(text).split('\n').forEach((paragraph) => {
    let line = '';
    paragraph.split(' ').forEach((word) => {
      let rest = word;
      while (rest.length > width) {
        if (line) {
          lines.push(line);
          line = '';
        }
        lines.push(rest.slice(0, width));
        rest = rest.slice(width);
      }
      if (!line) line = rest;
      else if (line.length + 1 + rest.length <= width) line += ` ${rest}`;
      else {
        lines.push(line);
        line = rest;
      }
    });
    lines.push(line);
  });
  return lines;
}

export function createList(visible = 3) {
  const state = { index: 0, offset: 0, visible };
  const fit = () => {
    if (state.index < state.offset) state.offset = state.index;
    else if (state.index >= state.offset + visible) state.offset = state.index - visible + 1;
  };
  return {
    state,
    reset() {
      state.index = 0;
      state.offset = 0;
    },
    move(delta, count) {
      if (!count) return;
      state.index = (state.index + delta + count) % count;
      fit();
    },
    clamp(count) {
      state.index = Math.max(0, Math.min(state.index, count - 1));
      state.offset = Math.max(0, Math.min(state.offset, count - visible));
      fit();
    },
  };
}

export function listHtml(labels, list, numbered = true) {
  const { index, offset, visible } = list.state;
  const total = labels.length;
  const rows = labels.slice(offset, offset + visible).map((label, i) => {
    const n = offset + i;
    return `<li class="${n === index ? 'sel' : ''}">${numbered ? `${n + 1}. ` : ''}${escapeHtml(label)}</li>`;
  }).join('');
  const thumb = `top:${(offset / total) * 100}%;height:${(Math.min(visible, total) / total) * 100}%`;
  return `<div class="listwrap"><ul class="list">${rows}</ul><div class="scroll"><i style="${thumb}"></i></div></div>`;
}
