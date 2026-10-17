import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve } from '../src/logic/solver.js';
import { createGame, placeSquad } from '../src/logic/game.js';

test('solver finds and replays a winning sequence', () => {
  const level = {
    id: 1,
    name: 'Solver',
    rows: 3,
    cols: 3,
    igloos: [{ r: 2, c: 1 }],
    slots: 5,
    squads: [{ color: 0, quota: 1 }, { color: 1, quota: 1 }],
    grid: [[null, { c: 0 }, null], [null, { c: 1 }, null], [null, null, null]],
  };
  const result = solve(level);
  assert.equal(result.solvable, true);
  assert.ok(result.solution.length >= 2);
  const state = createGame(level);
  for (const color of result.solution) {
    const squad = state.available.find((item) => item.color === color);
    const placed = placeSquad(state, squad.id);
    assert.equal(placed.ok, true);
  }
  assert.equal(state.status, 'won');
});

test('solver rejects a level that cannot be completed', () => {
  const level = {
    id: 2,
    name: 'Impossible',
    rows: 3,
    cols: 3,
    igloos: [{ r: 2, c: 1 }],
    slots: 1,
    squads: [{ color: 0, quota: 1 }, { color: 1, quota: 1 }],
    grid: [
      [{ c: 0 }, { c: 1 }, { c: 1 }],
      [{ c: 1 }, { c: 1 }, { c: 1 }],
      [null, null, null],
    ],
  };
  const result = solve(level);
  assert.equal(result.solvable, false);
});

test('solver respects a one-slot limit', () => {
  const level = {
    id: 3,
    name: 'One Slot',
    rows: 3,
    cols: 3,
    igloos: [{ r: 2, c: 1 }],
    slots: 1,
    squads: [{ color: 0, quota: 1 }, { color: 1, quota: 1 }],
    grid: [[null, null, null], [null, { c: 0 }, null], [null, { c: 1 }, null]],
  };
  const result = solve(level);
  assert.equal(result.solvable, true);
  assert.ok(result.branchingFactor > 0);
});
