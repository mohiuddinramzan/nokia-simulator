const DIGITS = [
  ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
  ['*', ''], ['0', 'SPC'], ['#', ''],
];
const SPOKEN = { '*': 'Star', '#': 'Hash' };

const KEYS = [
  { key: 'soft-left', cls: 'soft', glyph: 'bar', label: 'Left soft key' },
  { key: 'up', cls: 'nav', glyph: 'up', label: 'Up' },
  { key: 'soft-right', cls: 'soft', glyph: 'bar', label: 'Right soft key' },
  { key: 'left', cls: 'nav', glyph: 'left', label: 'Left' },
  { key: 'ok', cls: 'nav', glyph: 'dot', label: 'OK' },
  { key: 'right', cls: 'nav', glyph: 'right', label: 'Right' },
  { key: 'call', cls: 'call', text: 'CALL', label: 'Call' },
  { key: 'down', cls: 'nav', glyph: 'down', label: 'Down' },
  { key: 'end', cls: 'end', text: 'END', label: 'End / Power' },
  ...DIGITS.map(([num, letters]) => ({
    key: num,
    cls: 'digit',
    num,
    letters,
    label: letters ? `${num} ${letters}` : SPOKEN[num] || num,
  })),
];

const KEYMAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  Enter: 'ok', Escape: 'back', Backspace: 'back',
  F1: 'soft-left', F2: 'soft-right', End: 'end',
  q: 'soft-left', w: 'soft-right', c: 'call', e: 'end',
  '*': '*', '#': '#',
};
for (let d = 0; d <= 9; d += 1) KEYMAP[String(d)] = String(d);

function buildKey(def) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `key ${def.cls}`;
  btn.dataset.key = def.key;
  btn.setAttribute('aria-label', def.label);
  if (def.num) {
    btn.innerHTML = `<span class="k-num">${def.num}</span><span class="k-let">${def.letters}</span>`;
  } else if (def.glyph) {
    btn.innerHTML = `<i class="glyph glyph-${def.glyph}" aria-hidden="true"></i>`;
  } else {
    btn.innerHTML = `<span class="k-txt">${def.text}</span>`;
  }
  return btn;
}

export function initKeypad(root, onKey) {
  root.append(...KEYS.map(buildKey));

  const release = () => root.querySelectorAll('.pressed').forEach((b) => b.classList.remove('pressed'));
  const keyOf = (event) => event.target.closest('[data-key]');

  let lastPointerAt = -Infinity;

  root.addEventListener('pointerdown', (event) => {
    const btn = keyOf(event);
    if (!btn) return;
    event.preventDefault();
    lastPointerAt = performance.now();
    btn.classList.add('pressed');
    onKey(btn.dataset.key);
  });

  root.addEventListener('click', (event) => {
    const btn = keyOf(event);
    if (btn && performance.now() - lastPointerAt > 800) onKey(btn.dataset.key);
  });

  root.addEventListener('contextmenu', (event) => event.preventDefault());
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  window.addEventListener('blur', release);

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = KEYMAP[event.key] || KEYMAP[event.key.toLowerCase()];
    if (!key) return;
    event.preventDefault();
    const btn = root.querySelector(`[data-key="${key}"]`);
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 90);
    }
    onKey(key);
  });
}
