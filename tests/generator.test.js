import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateEndless } from '../src/logic/generator.js';
import { solve } from '../src/logic/solver.js';

test('generator emits solvable boards across 500 seeds', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const levelNumber = (seed % 10) + 1;
    const level = generateEndless(seed, levelNumber);
    assert.ok(level, 'seed ' + seed + ' should generate a level');
    const result = solve(level, { maxNodes: 20000 });
    assert.equal(result.solvable, true, 'seed ' + seed + ' should be solvable');
  }
});
