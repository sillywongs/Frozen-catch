import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reachableTargets, waterRegion } from '../src/logic/board.js';

function emptyGrid(rows, cols) {
  return Array.from({ length: rows }, () => new Array(cols).fill(null));
}

test('bottom row fish touch open water below the board', () => {
  const grid = emptyGrid(3, 3);
  grid[2][1] = { c: 0 };
  const targets = reachableTargets(grid);
  assert.deepEqual(targets.map((t) => [t.r, t.c]), [[2, 1]]);
});

test('buried fish are unreachable until neighbours open', () => {
  const grid = [
    [{ c: 0 }, { c: 1 }, { c: 2 }],
    [{ c: 1 }, { c: 0 }, { c: 1 }],
    [{ c: 2 }, { c: 0 }, { c: 2 }],
  ];
  const before = reachableTargets(grid).map((t) => t.r + ',' + t.c).sort();
  assert.deepEqual(before, ['2,0', '2,1', '2,2']);
  grid[2][1] = null;
  assert.equal(reachableTargets(grid).some((t) => t.r === 1 && t.c === 1), true);
});

test('water region spreads through connected open cells', () => {
  const grid = emptyGrid(3, 3);
  grid[1][1] = { c: 0 };
  const water = waterRegion(grid);
  assert.equal(water[2][0], true);
  assert.equal(water[1][0], true);
  assert.equal(water[0][0], true);
  assert.equal(water[1][1], false);
});

test('locked fish cannot be targeted while a fish sits above', () => {
  const grid = emptyGrid(3, 3);
  grid[0][1] = { c: 0 };
  grid[1][1] = { c: 1, l: true };
  grid[2][1] = { c: 2 };
  assert.equal(reachableTargets(grid).some((t) => t.r === 1), false);
  grid[0][1] = null;
  grid[2][1] = null;
  assert.equal(reachableTargets(grid).some((t) => t.r === 1), true);
});
