import { escapeHtml } from './navigation.js';
import { isBengali } from './i18n.js';

const KEYS = {
  1: ".,?!'-@1", 2: 'abc2', 3: 'def3', 4: 'ghi4', 5: 'jkl5',
  6: 'mno6', 7: 'pqrs7', 8: 'tuv8', 9: 'wxyz9', 0: ' 0',
};
const KEYS_BN = {
  1: '।,?!\'-@1', 2: 'অআইঈউঊঋএঐওঔ', 3: 'ািীুূৃেৈোৌ', 4: 'কখগঘঙ', 5: 'চছজঝঞ',
  6: 'টঠডঢণ', 7: 'তথদধন', 8: 'পফবভম', 9: 'যরলশষসহ', 0: ' ্0', '*': 'ংঃঁৎড়ঢ়য়',
};
const BN_MODE = 'বাং';
const MODES = ['Abc', 'abc', 'ABC', '123', BN_MODE];
const PENDING_MS = 900;

export function createTyper({ initial = '', max = 160, numeric = false, onChange = () => {} } = {}) {
  let text = initial;
  let pending = '';
  let lastKey = null;
  let index = 0;
  let timer = null;
  let mode = numeric ? '123' : isBengali() ? BN_MODE : 'Abc';

  const casing = (ch) => {
    if (mode === BN_MODE) return ch;
    if (mode === 'ABC') return ch.toUpperCase();
    if (mode === 'Abc' && (text === '' || /[.!?]\s+$/.test(text))) return ch.toUpperCase();
    return ch.toLowerCase();
  };

  function commit() {
    clearTimeout(timer);
    timer = null;
    text += pending;
    pending = '';
    lastKey = null;
    index = 0;
  }

  function press(key) {
    if (key === '#' && !numeric) {
      commit();
      mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      onChange();
      return true;
    }
    if (mode === '123') {
      if (!/^[0-9*#]$/.test(key)) return false;
      commit();
      if (text.length < max) text += key;
      onChange();
      return true;
    }
    const chars = (mode === BN_MODE ? KEYS_BN : KEYS)[key];
    if (!chars) return false;
    if (key === lastKey && pending) {
      index = (index + 1) % chars.length;
      pending = casing(chars[index]);
    } else {
      commit();
      if (text.length >= max) return true;
      lastKey = key;
      index = 0;
      pending = casing(chars[0]);
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      commit();
      onChange();
    }, PENDING_MS);
    onChange();
    return true;
  }

  function del() {
    if (pending) {
      clearTimeout(timer);
      pending = '';
      lastKey = null;
      index = 0;
    } else if (text) {
      text = text.slice(0, -1);
    } else {
      return false;
    }
    onChange();
    return true;
  }

  return {
    press,
    del,
    commit,
    value: () => text + pending,
    mode: () => mode,
    html: () => {
      const shown = pending === ' ' ? '&nbsp;' : escapeHtml(pending);
      return `${escapeHtml(text)}${pending ? `<u>${shown}</u>` : ''}<span class="caret">_</span>`;
    },
  };
}
