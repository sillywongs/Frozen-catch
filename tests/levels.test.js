import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels-data.js';
import { solve } from '../src/logic/solver.js';
import { countFish } from '../src/logic/board.js';

test('ships at least 60 verified story levels', () => {
  assert.ok(LEVELS.length >= 60, 'expected at least 60 levels, got ' + LEVELS.length);
});

test('every level matches the schema and is solvable', () => {
  for (const level of LEVELS) {
    assert.ok(Number.isInteger(level.id), 'level id must be an integer');
    assert.ok(level.rows > 0 && level.cols > 0, 'level needs a board');
    assert.ok(level.igloos.length >= 1, 'level needs an igloo');
    assert.equal(level.grid.length, level.rows, 'grid rows must match');
    const quotaTotal = level.squads.reduce((sum, squad) => sum + squad.quota, 0);
    assert.equal(countFish(level.grid), quotaTotal, 'level ' + level.id + ' fish must match quotas');
    const result = solve(level, { maxNodes: 120000 });
    assert.equal(result.solvable, true, 'level ' + level.id + ' must be solvable');
  }
});

test('progressive mechanics appear in the intended ranges', () => {
  const mystery = LEVELS.filter((level) => level.grid.some((row) => row.some((cell) => cell && cell.m)));
  const locked = LEVELS.filter((level) => level.grid.some((row) => row.some((cell) => cell && cell.l)));
  const twoIgloos = LEVELS.filter((level) => level.igloos.length >= 2);
  assert.ok(mystery.some((level) => level.id >= 8));
  assert.ok(locked.some((level) => level.id >= 12));
  assert.ok(twoIgloos.some((level) => level.id >= 18));
});
