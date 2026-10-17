import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  placeSquad,
  undoLastTap,
  shuffleSquads,
  extraSlot,
  computeStars,
  chooseIgloo,
  resolveCollections,
} from '../src/logic/game.js';
import { mulberry32 } from '../src/logic/generator.js';

function level(overrides = {}) {
  return {
    id: 1,
    name: 'Test',
    rows: 3,
    cols: 3,
    igloos: [{ r: 2, c: 1 }],
    slots: 5,
    squads: [{ color: 0, quota: 1 }],
    grid: [[null, null, null], [null, null, null], [null, { c: 0 }, null]],
    ...overrides,
  };
}

test('a squad collects its quota and leaves', () => {
  const state = createGame(level());
  const result = placeSquad(state, 0);
  assert.equal(result.ok, true);
  assert.equal(state.status, 'won');
  assert.equal(state.active.length, 0);
  assert.equal(computeStars(state), 3);
});

test('a squad with no reachable fish loses when it fills the last slot', () => {
  const testLevel = level({
    slots: 1,
    squads: [{ color: 0, quota: 1 }, { color: 1, quota: 2 }],
    grid: [
      [{ c: 0 }, { c: 1 }, null],
      [{ c: 1 }, { c: 1 }, null],
      [null, null, null],
    ],
  });
  const state = createGame(testLevel, { slotCap: 1 });
  const result = placeSquad(state, 0);
  assert.equal(result.ok, true);
  assert.equal(state.status, 'lost');
});

test('mystery fish reveals a mismatch then can be collected by the right squad', () => {
  const testLevel = level({
    squads: [{ color: 0, quota: 1 }, { color: 1, quota: 1 }],
    grid: [[null, null, null], [null, { c: 1, m: true }, null], [null, null, null]],
  });
  const state = createGame(testLevel);
  placeSquad(state, 0);
  assert.equal(state.grid[1][1].m, false);
  assert.equal(state.status, 'playing');
  placeSquad(state, 1);
  assert.equal(state.status, 'won');
});

test('undo restores the previous placement and marks a booster used', () => {
  const state = createGame(level());
  placeSquad(state, 0);
  const result = undoLastTap(state);
  assert.equal(result.ok, true);
  assert.equal(result.state.available.length, 1);
  assert.equal(result.state.status, 'playing');
  assert.deepEqual(result.state.boostersUsed, ['undo']);
});

test('shuffle keeps the same squads in a different order', () => {
  const testLevel = level({
    squads: [{ color: 0, quota: 1 }, { color: 1, quota: 1 }, { color: 2, quota: 1 }],
  });
  const state = createGame(testLevel);
  const before = state.available.map((squad) => squad.color).join(',');
  shuffleSquads(state, mulberry32(7));
  const after = state.available.map((squad) => squad.color).join(',');
  assert.equal(state.available.length, 3);
  assert.notEqual(before, after);
});

test('extra slot raises the cap to seven', () => {
  const state = createGame(level());
  extraSlot(state);
  assert.equal(state.slotCap, 7);
  assert.deepEqual(state.boostersUsed, ['extraSlot']);
  assert.equal(computeStars({ ...state, status: 'won' }), 2);
});

test('stars fall to one after a restart', () => {
  const state = createGame(level(), { restarted: true });
  placeSquad(state, 0);
  assert.equal(computeStars(state), 1);
});

test('penguins use the nearer of two igloos', () => {
  const state = createGame(level({
    igloos: [{ r: 2, c: 0 }, { r: 2, c: 2 }],
  }));
  const left = chooseIgloo(state, 0, 0);
  const right = chooseIgloo(state, 0, 2);
  assert.equal(left.igloo.c, 0);
  assert.equal(right.igloo.c, 2);
});

test('resolveCollections wins when the final fish is collected', () => {
  const state = createGame(level());
  state.available = [];
  state.active.push({ id: 0, color: 0, remaining: 1, slot: 0 });
  resolveCollections(state);
  assert.equal(state.status, 'won');
});
