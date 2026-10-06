import { t } from './i18n.js';

const screens = new Map();
let stack = [];
let refs = null;
let toastTimer = null;
let afterRender = null;

const top = () => stack[stack.length - 1];
const screenOf = (entry) => screens.get(entry.name);

export const depth = () => stack.length;

export function registerScreen(name, screen) {
  screens.set(name, screen);
}

export function setRenderHook(fn) {
  afterRender = fn;
}

export function mount(elements) {
  refs = elements;
}

export function notify(message, ms = 1400) {
  if (!refs) return;
  refs.toast.textContent = t(message);
  refs.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    refs.toast.hidden = true;
  }, ms);
}

function runHook() {
  try {
    afterRender?.();
  } catch (err) {
    console.error('[router] render hook failed', err);
  }
}

export function render() {
  const entry = top();
  if (!entry || !refs) return;
  try {
    const view = screenOf(entry).render(entry.params);
    refs.body.innerHTML = view.body;
    refs.left.textContent = t(view.left || '');
    refs.right.textContent = t(view.right || '');
    runHook();
  } catch (err) {
    console.error(`[router] render failed for "${entry.name}"`, err);
    notify('Error');
    if (entry.name !== 'home') home();
  }
}

function activate(entry) {
  try {
    screenOf(entry).enter?.(entry.params);
  } catch (err) {
    console.error(`[router] enter failed for "${entry.name}"`, err);
  }
  render();
}

function deactivate(entry) {
  if (!entry) return;
  try {
    screenOf(entry).leave?.(entry.params);
  } catch (err) {
    console.error(`[router] leave failed for "${entry.name}"`, err);
  }
}

export function navigate(name, params = {}) {
  if (!screens.has(name)) {
    console.error(`[router] unknown screen "${name}"`);
    notify('Not available');
    return;
  }
  deactivate(top());
  stack.push({ name, params });
  activate(top());
}

export function replace(name, params = {}) {
  if (!screens.has(name)) {
    console.error(`[router] unknown screen "${name}"`);
    notify('Not available');
    return;
  }
  deactivate(stack.pop());
  stack.push({ name, params });
  activate(top());
}

export function back() {
  if (stack.length < 2) return false;
  deactivate(stack.pop());
  activate(top());
  return true;
}

export function home() {
  deactivate(top());
  stack = [{ name: 'home', params: {} }];
  activate(top());
}

export function handleKey(key) {
  if (key === 'end') {
    home();
    return;
  }
  const entry = top();
  if (!entry) return;
  let handled = false;
  try {
    handled = screenOf(entry).key?.(key, entry.params) === true;
  } catch (err) {
    console.error(`[router] key "${key}" failed on "${entry.name}"`, err);
    notify('Error');
    return;
  }
  if (!handled && key === 'back') back();
}
