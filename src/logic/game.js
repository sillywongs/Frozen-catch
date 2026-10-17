// Pure game-state logic: no DOM, no timers, fully deterministic given inputs.
import { cloneGrid, reachableTargets } from './board.js';

export function createGame(level, options = {}) {
  const slotCap = options.slotCap ?? level.slots ?? 5;
  return {
    levelId: level.id,
    rows: level.rows,
    cols: level.cols,
    igloos: level.igloos.map((igloo) => ({ ...igloo })),
    grid: cloneGrid(level.grid),
    available: level.squads.map((squad, index) => ({ id: index, color: squad.color, quota: squad.quota })),
    active: [],
    slotCap,
    boostersUsed: [],
    restarted: Boolean(options.restarted),
    status: 'playing',
    undoStack: [],
    lastEvents: [],
  };
}

export function cloneState(state) {
  return structuredClone(state);
}

export function freeSlot(state) {
  for (let slot = 0; slot < state.slotCap; slot++) {
    if (!state.active.some((squad) => squad.slot === slot)) return slot;
  }
  return -1;
}

export function canPlaceSquad(state) {
  return state.status === 'playing' && state.available.length > 0 && freeSlot(state) >= 0;
}

export function chooseIgloo(state, r, c) {
  let best = null;
  let bestDistance = Infinity;
  for (const igloo of state.igloos) {
    const distance = Math.abs(igloo.r - r) + Math.abs(igloo.c - c);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = igloo;
    }
  }
  return { igloo: best, distance: bestDistance };
}

function findTarget(state, squad) {
  const targets = reachableTargets(state.grid).filter(
    (target) => target.cell.c === squad.color || target.cell.m
  );
  if (!targets.length) return null;
  targets.sort((a, b) => chooseIgloo(state, a.r, a.c).distance - chooseIgloo(state, b.r, b.c).distance);
  return targets[0];
}

// Repeatedly send every active squad after reachable fish until no more
// progress is possible. Mystery fish are revealed on contact; a mismatch
// sends the penguin home without a fish.
export function resolveCollections(state) {
  const events = [];
  let progress = true;
  while (progress) {
    progress = false;
    for (const squad of [...state.active]) {
      while (squad.remaining > 0) {
        const target = findTarget(state, squad);
        if (!target) break;
        const cell = state.grid[target.r][target.c];
        if (cell.m) {
          cell.m = false;
          events.push({ type: 'reveal', r: target.r, c: target.c, color: cell.c });
          progress = true;
          if (cell.c !== squad.color) break;
        }
        state.grid[target.r][target.c] = null;
        squad.remaining--;
        events.push({ type: 'collect', r: target.r, c: target.c, color: cell.c, squad: squad.id });
        progress = true;
      }
    }
    for (let i = state.active.length - 1; i >= 0; i--) {
      if (state.active[i].remaining <= 0) {
        events.push({ type: 'leave', squad: state.active[i].id, color: state.active[i].color });
        state.active.splice(i, 1);
      }
    }
  }

  const fishLeft = state.grid.some((row) => row.some((cell) => cell));
  if (!fishLeft) {
    state.status = 'won';
    events.push({ type: 'win' });
  } else {
    const slotsFull = state.active.length >= state.slotCap;
    const anyCollect = state.active.some((squad) => squad.remaining > 0 && findTarget(state, squad));
    if ((slotsFull || state.available.length === 0) && !anyCollect) {
      state.status = 'lost';
      events.push({ type: 'lose' });
    }
  }
  state.lastEvents = events;
  return state;
}

export function placeSquad(state, squadId) {
  if (state.status !== 'playing') return { ok: false, error: 'The level is already over.' };
  const index = state.available.findIndex((squad) => squad.id === squadId);
  if (index < 0) return { ok: false, error: 'That squad is already on the ice.' };
  const slot = freeSlot(state);
  if (slot < 0) return { ok: false, error: 'Every slot on the ice shelf is full.' };
  state.undoStack.push(cloneState(state));
  if (state.undoStack.length > 30) state.undoStack.shift();
  const [squad] = state.available.splice(index, 1);
  state.active.push({ id: squad.id, color: squad.color, remaining: squad.quota, slot });
  resolveCollections(state);
  return { ok: true, events: state.lastEvents };
}

export function undoLastTap(state) {
  if (!state.undoStack.length) return { ok: false, error: 'Nothing to undo.' };
  const snapshot = state.undoStack.pop();
  const restored = cloneState(snapshot);
  restored.undoStack = state.undoStack;
  if (!restored.boostersUsed.includes('undo')) restored.boostersUsed.push('undo');
  restored.lastEvents = [{ type: 'undo' }];
  return { ok: true, state: restored };
}

export function shuffleSquads(state, rng = Math.random) {
  if (state.status !== 'playing') return { ok: false, error: 'The level is already over.' };
  for (let i = state.available.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [state.available[i], state.available[j]] = [state.available[j], state.available[i]];
  }
  if (!state.boostersUsed.includes('shuffle')) state.boostersUsed.push('shuffle');
  state.lastEvents = [{ type: 'shuffle' }];
  return { ok: true };
}

export function extraSlot(state) {
  if (state.status !== 'playing') return { ok: false, error: 'The level is already over.' };
  if (state.slotCap >= 7) return { ok: false, error: 'The ice shelf already has seven slots.' };
  state.slotCap = 7;
  if (!state.boostersUsed.includes('extraSlot')) state.boostersUsed.push('extraSlot');
  state.lastEvents = [{ type: 'extraSlot' }];
  return { ok: true };
}

export function computeStars(state) {
  if (state.status !== 'won') return 0;
  if (state.restarted) return 1;
  return state.boostersUsed.length ? 2 : 3;
}

export function coinReward(state) {
  return 12 + computeStars(state) * 6;
}
