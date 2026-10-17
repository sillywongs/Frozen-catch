// Procedural generator for Endless Expedition. Every emitted board is checked
// by the real solver before it is returned, so endless levels are always
// winnable within the slot limit.
import { solve } from './solver.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateLevel(options) {
  const rng = mulberry32(options.seed);
  const rows = options.rows;
  const cols = options.cols;
  const squads = options.squads;
  const slotCap = options.slots ?? 5;
  const attempts = options.attempts ?? 160;
  const maxNodes = options.maxNodes ?? 30000;
  const counts = new Array(8).fill(0);
  for (const squad of squads) counts[squad.color] += squad.quota;
  const total = counts.reduce((sum, value) => sum + value, 0);
  if (total > rows * cols) return null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const grid = Array.from({ length: rows }, () => new Array(cols).fill(null));
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([r, c]);
    const order = shuffled(cells, rng);
    let index = 0;
    for (let color = 0; color < 8; color++) {
      for (let n = 0; n < counts[color]; n++) {
        const [r, c] = order[index++];
        const cell = { c: color };
        if (options.mysteryChance && rng() < options.mysteryChance) cell.m = true;
        if (options.lockedChance && r > 0 && rng() < options.lockedChance) cell.l = true;
        grid[r][c] = cell;
      }
    }
    const level = {
      id: options.id ?? -1,
      name: options.name ?? 'Endless Expedition',
      rows,
      cols,
      igloos: options.igloos,
      slots: slotCap,
      squads,
      grid,
    };
    const result = solve(level, { slotCap, maxNodes });
    if (result.solvable) {
      return { ...level, difficulty: result.difficulty, solverNodes: result.nodes };
    }
  }
  return null;
}

export function generateEndless(seed, levelNumber) {
  const rng = mulberry32(seed * 7919 + levelNumber * 104729);
  const size = 5 + Math.min(3, Math.floor(levelNumber / 15));
  const colorCount = Math.min(8, 3 + Math.floor(levelNumber / 8));
  const squadCount = 3 + Math.min(4, Math.floor(levelNumber / 10));
  const squads = [];
  for (let i = 0; i < squadCount; i++) {
    const color = Math.floor(rng() * colorCount);
    squads.push({ color, quota: 1 + Math.floor(rng() * 2) });
  }
  const igloos = [{ r: size - 1, c: Math.floor(size / 2) }];
  return generateLevel({
    seed: Math.floor(rng() * 1e9),
    rows: size,
    cols: size,
    squads,
    igloos,
    slots: 5,
    mysteryChance: levelNumber >= 8 ? 0.15 : 0,
    lockedChance: levelNumber >= 12 ? 0.12 : 0,
    attempts: 60,
    maxNodes: 20000,
  });
}
