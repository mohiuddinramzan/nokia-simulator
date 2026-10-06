import { navigate, back, render } from './router.js';
import { createList, listHtml, titleHtml, escapeHtml, wrapLines } from './navigation.js';
import { createTyper } from './multitap.js';
import { t } from './i18n.js';

const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

const resolve = (value, params) => (typeof value === 'function' ? value(params) : value);

export const openOptions = (title, items) => navigate('options', { title, items });
export const openEditor = (config) => navigate('editor', config);
export const confirmAction = (title, text, onYes) => navigate('confirm', { title, text, onYes });

const closeOnSoftRight = (key) => {
  if (key !== 'soft-right') return false;
  back();
  return true;
};

export const stubScreen = {
  render({ title, phase }) {
    return {
      body: `${titleHtml(title)}<div class="note">Available in Phase ${escapeHtml(phase)}</div>`,
      left: '',
      right: 'Back',
    };
  },
  key: closeOnSoftRight,
};

export const aboutScreen = {
  render() {
    return {
      body: `${titleHtml('About')}<div class="note about">${t('Retro Phone Simulator')}<br>${t('Version {v}', { v: VERSION })}<br>${t('Original retro design')}</div>`,
      left: '',
      right: 'Back',
    };
  },
  key: closeOnSoftRight,
};

export const optionsScreen = {
  enter(params) {
    if (!params.list) params.list = createList(3);
  },

  render(params) {
    const items = resolve(params.items);
    const { list } = params;
    list.clamp(items.length);
    return {
      body: titleHtml(params.title, `${list.state.index + 1}/${items.length}`) + listHtml(items.map((item) => item.label), list, false),
      left: 'Select',
      right: 'Back',
    };
  },

  key(key, params) {
    const items = resolve(params.items);
    if (key === 'up' || key === 'down') {
      params.list.move(key === 'up' ? -1 : 1, items.length);
      render();
      return true;
    }
    if (key === 'ok' || key === 'soft-left') {
      const item = items[params.list.state.index];
      if (!item) return true;
      if (!item.keep) back();
      item.run();
      render();
      return true;
    }
    return closeOnSoftRight(key);
  },
};

export const confirmScreen = {
  render({ title, text }) {
    return {
      body: `${titleHtml(title)}<div class="note">${escapeHtml(t(text))}</div>`,
      left: 'Yes',
      right: 'No',
    };
  },

  key(key, params) {
    if (key === 'ok' || key === 'soft-left') {
      back();
      params.onYes();
      render();
      return true;
    }
    return closeOnSoftRight(key);
  },
};

export const editorScreen = {
  enter(params) {
    if (params.typer) return;
    params.typer = createTyper({
      initial: params.value || '',
      max: params.max || 160,
      numeric: params.numeric,
      onChange: render,
    });
  },

  leave(params) {
    params.typer?.commit();
  },

  render(params) {
    const typer = params.typer;
    const value = typer.value();
    return {
      body: `${titleHtml(params.title, `${typer.mode()} ${value.length}/${params.max || 160}`)}<div class="edit"><div>${typer.html()}</div></div>`,
      left: 'OK',
      right: value ? 'Clear' : 'Back',
    };
  },

  key(key, params) {
    const typer = params.typer;
    if (key === 'ok' || key === 'soft-left') {
      typer.commit();
      const value = typer.value();
      back();
      params.onDone?.(value);
      render();
    } else if (key === 'soft-right' || key === 'back') {
      if (!typer.del()) back();
    } else if (/^[0-9*#]$/.test(key)) {
      typer.press(key);
    }
    return true;
  },
};

export function makeListScreen({ title, items, label, empty = 'Empty', left = 'Options', emptyLeft, numbered = false, onOk, onLeft }) {
  const listOf = (params) => {
    if (!params.list) params.list = createList(3);
    return params.list;
  };

  return {
    render(params) {
      const all = items(params);
      const heading = resolve(title, params);
      if (!all.length) {
        return {
          body: `${titleHtml(heading)}<div class="note">${escapeHtml(t(empty))}</div>`,
          left: emptyLeft ? emptyLeft.label : '',
          right: 'Back',
        };
      }
      const list = listOf(params);
      list.clamp(all.length);
      return {
        body: titleHtml(heading, `${list.state.index + 1}/${all.length}`) + listHtml(all.map(label), list, numbered),
        left: resolve(left, params),
        right: 'Back',
      };
    },

    key(key, params) {
      const all = items(params);
      const list = listOf(params);
      list.clamp(all.length);
      const current = all[list.state.index];
      if (key === 'up' || key === 'down') {
        list.move(key === 'up' ? -1 : 1, all.length);
        render();
      } else if (key === 'ok') {
        if (current) onOk?.(current, params);
        render();
      } else if (key === 'soft-left') {
        if (current) onLeft?.(current, params);
        else emptyLeft?.run(params);
        render();
      } else {
        return closeOnSoftRight(key);
      }
      return true;
    },
  };
}

export function makeInfoScreen({ title, lines, left = 'Options', onLeft, onOk, onEnter }) {
  const VISIBLE = 3;

  return {
    enter: (params) => onEnter?.(params),

    render(params) {
      const all = lines(params).flatMap((line) => wrapLines(line));
      const top = Math.min(params.top || 0, Math.max(0, all.length - VISIBLE));
      params.top = top;
      const rows = all.slice(top, top + VISIBLE).map((line) => `<div class="ln">${escapeHtml(line) || '&nbsp;'}</div>`).join('');
      const position = all.length > VISIBLE ? `${top + 1}/${all.length}` : '';
      return {
        body: `${titleHtml(resolve(title, params), position)}<div class="lines">${rows}</div>`,
        left,
        right: 'Back',
      };
    },

    key(key, params) {
      if (key === 'up' || key === 'down') {
        params.top = Math.max(0, (params.top || 0) + (key === 'up' ? -1 : 1));
        render();
        return true;
      }
      if (key === 'ok') {
        onOk?.(params);
        return true;
      }
      if (key === 'soft-left') {
        onLeft?.(params);
        return true;
      }
      return closeOnSoftRight(key);
    },
  };
}
