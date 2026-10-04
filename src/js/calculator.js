import { render, back } from './router.js';
import { titleHtml, escapeHtml } from './navigation.js';

const MAX_DIGITS = 12;
const KEY_OP = { up: '+', down: '-', left: '×', right: '÷' };
const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '×': (a, b) => a * b,
  '÷': (a, b) => (b === 0 ? NaN : a / b),
};

function fmt(n) {
  if (!Number.isFinite(n)) return 'Error';
  const s = String(Number(n.toPrecision(10)));
  return s.includes('e') ? 'Error' : s;
}

function reset(p) {
  Object.assign(p, { acc: null, op: null, cur: '0', fresh: true });
}

function compute(p) {
  return OPS[p.op](p.acc, Number(p.cur));
}

function operator(p, op) {
  if (p.op && !p.fresh) {
    p.cur = fmt(compute(p));
    if (p.cur === 'Error') {
      p.op = null;
      return;
    }
    p.acc = Number(p.cur);
  } else if (!p.op) {
    p.acc = Number(p.cur);
  }
  p.op = op;
  p.fresh = true;
}

function equals(p) {
  if (!p.op) return;
  p.cur = fmt(compute(p));
  p.acc = null;
  p.op = null;
  p.fresh = true;
}

function percent(p) {
  const value = Number(p.cur);
  p.cur = fmt(p.op && p.acc !== null ? (p.acc * value) / 100 : value / 100);
  p.fresh = false;
}

function digit(p, d) {
  if (p.fresh || p.cur === '0') p.cur = d;
  else if (p.cur.length < MAX_DIGITS) p.cur += d;
  p.fresh = false;
}

function point(p) {
  if (p.fresh) {
    p.cur = '0.';
    p.fresh = false;
  } else if (!p.cur.includes('.')) {
    p.cur += '.';
  }
}

export const calculatorScreen = {
  enter(p) {
    if (p.cur === undefined) reset(p);
  },

  render(p) {
    const expr = p.op ? `${fmt(p.acc)} ${p.op}` : '';
    return {
      body: `${titleHtml('Calculator')}<div class="calc"><div class="calc-expr">${escapeHtml(expr)}&nbsp;</div><div class="calc-val">${escapeHtml(p.cur)}</div><div class="calc-hint">↑+ ↓- ←× →÷ *% #. OK=</div></div>`,
      left: 'Clear',
      right: 'Back',
    };
  },

  key(key, p) {
    if (key === 'soft-right') {
      back();
      return true;
    }
    if (key === 'back' && (p.fresh || p.cur.length <= 1)) return false;
    if (p.cur === 'Error') reset(p);
    if (/^[0-9]$/.test(key)) digit(p, key);
    else if (key === '#') point(p);
    else if (KEY_OP[key]) operator(p, KEY_OP[key]);
    else if (key === 'ok') equals(p);
    else if (key === '*') percent(p);
    else if (key === 'soft-left') reset(p);
    else if (key === 'back') p.cur = p.cur.slice(0, -1) || '0';
    else return false;
    render();
    return true;
  },
};
