import { render, back, navigate } from './router.js';
import { titleHtml } from './navigation.js';
import { getHighScore, submitScore } from './storage.js';
import { effect } from './sound.js';
import { t } from './i18n.js';

const COLS = 24;
const ROWS = 8;
const ROUNDS = 5;
const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const KEY_DIR = { up: 'up', down: 'down', left: 'left', right: 'right', 2: 'up', 8: 'down', 4: 'left', 6: 'right' };
const SNAKE_LABELS = { ready: 'Start', running: 'Pause', paused: 'Resume', over: 'Retry' };
const SNAKE_MESSAGES = { ready: 'Press OK', paused: 'Paused' };

export const gamesParams = () => ({
  title: 'Games',
  items: () => {
    const best = getHighScore('reaction');
    return [
      { label: t('Snake (Hi {n})', { n: getHighScore('snake') }), keep: true, run: () => navigate('snake') },
      { label: best ? t('Reaction ({n}ms)', { n: best }) : t('Reaction'), keep: true, run: () => navigate('reaction') },
    ];
  },
});

function placeFood(p) {
  const free = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (!p.snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
    }
  }
  return free.length ? free[Math.floor(Math.random() * free.length)] : null;
}

function resetSnake(p) {
  clearTimeout(p.timer);
  p.snake = [{ x: 6, y: 4 }, { x: 5, y: 4 }, { x: 4, y: 4 }];
  p.dir = 'right';
  p.next = 'right';
  p.score = 0;
  p.newBest = false;
  p.state = 'ready';
  p.food = placeFood(p);
}

function schedule(p) {
  clearTimeout(p.timer);
  p.timer = setTimeout(() => tick(p), Math.max(70, 190 - p.score * 4));
}

function startSnake(p) {
  p.state = 'running';
  schedule(p);
  render();
}

function endSnake(p) {
  clearTimeout(p.timer);
  p.state = 'over';
  p.newBest = submitScore('snake', p.score);
  effect(200, 0.3);
  render();
}

function tick(p) {
  p.dir = p.next;
  const head = { x: p.snake[0].x + DIRS[p.dir].x, y: p.snake[0].y + DIRS[p.dir].y };
  const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
  if (hitWall || p.snake.slice(0, -1).some((s) => s.x === head.x && s.y === head.y)) {
    endSnake(p);
    return;
  }
  p.snake.unshift(head);
  if (p.food && head.x === p.food.x && head.y === p.food.y) {
    p.score += 1;
    p.food = placeFood(p);
    effect(900, 0.05);
    if (!p.food) {
      endSnake(p);
      return;
    }
  } else {
    p.snake.pop();
  }
  render();
  schedule(p);
}

const cell = (c) => `<rect x="${c.x}" y="${c.y}" width="1" height="1"/>`;

export const snakeScreen = {
  enter(p) {
    if (!p.snake) resetSnake(p);
  },

  leave(p) {
    clearTimeout(p.timer);
    if (p.state === 'running') p.state = 'paused';
  },

  render(p) {
    const best = Math.max(getHighScore('snake'), p.score);
    const message = p.state === 'over'
      ? `${t('Game over')}<br>${t('Score {n}', { n: p.score })}${p.newBest ? `<br>${t('New best!')}` : ''}`
      : t(SNAKE_MESSAGES[p.state] || '');
    const food = p.food ? `<rect x="${p.food.x + 0.2}" y="${p.food.y + 0.2}" width="0.6" height="0.6" fill="none" stroke="currentColor" stroke-width="0.25"/>` : '';
    const svg = `<svg viewBox="-0.15 -0.15 ${COLS + 0.3} ${ROWS + 0.3}" fill="currentColor" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="${COLS}" height="${ROWS}" fill="none" stroke="currentColor" stroke-width="0.14"/>${p.snake.map(cell).join('')}${food}</svg>`;
    return {
      body: `${titleHtml('Snake', `${p.score} ${t('Hi')}${best}`)}<div class="field">${svg}${message ? `<div class="field-msg">${message}</div>` : ''}</div>`,
      left: SNAKE_LABELS[p.state],
      right: 'Back',
    };
  },

  key(key, p) {
    const dir = KEY_DIR[key];
    if (dir) {
      if (p.state === 'over') return true;
      if (dir !== OPPOSITE[p.dir]) p.next = dir;
      if (p.state !== 'running') startSnake(p);
      return true;
    }
    if (key === 'ok' || key === 'soft-left' || key === '5') {
      if (p.state === 'running') {
        clearTimeout(p.timer);
        p.state = 'paused';
        render();
      } else {
        if (p.state === 'over') resetSnake(p);
        startSnake(p);
      }
      return true;
    }
    if (key === 'soft-right') {
      back();
      return true;
    }
    return false;
  },
};

function resetReaction(p) {
  clearTimeout(p.timer);
  Object.assign(p, { state: 'ready', times: [], last: 0, avg: 0, newBest: false });
}

function beginRound(p) {
  clearTimeout(p.timer);
  p.state = 'wait';
  p.timer = setTimeout(() => {
    p.state = 'go';
    p.goAt = performance.now();
    effect(880, 0.08);
    render();
  }, 1000 + Math.random() * 2500);
  render();
}

function reactionPress(p) {
  if (p.state === 'ready' || p.state === 'early' || p.state === 'result') {
    beginRound(p);
    return;
  }
  if (p.state === 'wait') {
    clearTimeout(p.timer);
    p.state = 'early';
  } else if (p.state === 'go') {
    p.last = Math.round(performance.now() - p.goAt);
    p.times.push(p.last);
    if (p.times.length >= ROUNDS) {
      p.avg = Math.round(p.times.reduce((sum, t) => sum + t, 0) / ROUNDS);
      p.newBest = submitScore('reaction', p.avg, true);
      p.state = 'final';
    } else {
      p.state = 'result';
    }
  } else {
    resetReaction(p);
  }
  render();
}

const REACTION_LABELS = { ready: 'Start', wait: 'Hit', go: 'Hit', early: 'Retry', result: 'Next', final: 'Again' };

function reactionText(p) {
  const best = getHighScore('reaction');
  switch (p.state) {
    case 'wait': return t('Wait...');
    case 'go': return t('PRESS NOW!');
    case 'early': return `${t('Too soon!')}<br>${t('OK to retry')}`;
    case 'result': return `${p.last} ms<br>${t('OK for next')}`;
    case 'final': return `${t('Average {n} ms', { n: p.avg })}<br>${p.newBest ? t('New best!') : t('Best {n} ms', { n: best })}`;
    default: return `${t('5 rounds')}<br>${t('OK to start')}${best ? `<br>${t('Best {n} ms', { n: best })}` : ''}`;
  }
}

export const reactionScreen = {
  enter(p) {
    if (!p.state) resetReaction(p);
  },

  leave(p) {
    clearTimeout(p.timer);
  },

  render(p) {
    return {
      body: `${titleHtml('Reaction', `${p.times.length}/${ROUNDS}`)}<div class="note${p.state === 'go' ? ' invert' : ''}">${reactionText(p)}</div>`,
      left: REACTION_LABELS[p.state],
      right: 'Back',
    };
  },

  key(key, p) {
    if (key === 'ok' || key === 'soft-left' || key === '5') {
      reactionPress(p);
      return true;
    }
    if (key === 'soft-right') {
      back();
      return true;
    }
    return false;
  },
};
