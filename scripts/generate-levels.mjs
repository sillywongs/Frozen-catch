// Builds levels/levels.json and src/levels-data.js from handcrafted picture
// layouts, then verifies every board with the real solver.
import { writeFileSync, mkdirSync } from 'node:fs';
import { solve } from '../src/logic/solver.js';
import { mulberry32 } from '../src/logic/generator.js';

const THEMES = [
  { name: 'Aurora', art: ['0123012', '0123012', '0123012', '0123012', '0123012', '0123012', '0123012'] },
  { name: 'Whale', art: ['...0...', '..111..', '.11111.', '1111111', '.11111.', '..111..', '.......'] },
  { name: 'Lighthouse', art: ['...0...', '...2...', '...0...', '...2...', '..222..', '.00000.', '...0...'] },
  { name: 'Bear', art: ['..3.3..', '..333..', '.33333.', '3333333', '3333333', '.33.33.', '.......'] },
  { name: 'Snowflake', art: ['1..1..1', '.1.1.1.', '..111..', '1111111', '..111..', '.1.1.1.', '1..1..1'] },
  { name: 'Fish', art: ['.......', '..222..', '.22222.', '2222221', '.22222.', '..222..', '.......'] },
  { name: 'Wave', art: ['.......', '.111...', '11111..', '.11111.', '..11111', '...111.', '.......'] },
  { name: 'Star', art: ['...0...', '...0...', '.00000.', '..000..', '.00.00.', '.......', '.......'] },
  { name: 'Heart', art: ['.00.00.', '0000000', '0000000', '.00000.', '..000..', '...0...', '.......'] },
  { name: 'Pine', art: ['...1...', '..111..', '.11111.', '1111111', '...2...', '...2...', '.......'] },
  { name: 'Moon', art: ['..000..', '.000...', '000....', '000....', '000....', '.000...', '..000..'] },
  { name: 'Comet', art: ['....2..', '...2...', '..2....', '.2.....', '20.....', '0......', '.......'] },
];

function parseArt(art, paletteSize, mapping) {
  const grid = art.map((row) => row.split('').map((char) => (char === '.' ? null : { c: mapping[Number(char)] })));
  return grid;
}

function counts(grid) {
  const counts = new Array(8).fill(0);
  for (const row of grid) for (const cell of row) if (cell) counts[cell.c]++;
  return counts;
}

function tier(id) {
  if (id <= 7) return { colors: 3 + (id % 2), mystery: 0, locked: 0, igloos: 1 };
  if (id <= 17) return { colors: 4 + (id % 2), mystery: 0.16, locked: 0, igloos: 1 };
  if (id <= 30) return { colors: 5, mystery: 0.15, locked: 0.13, igloos: id >= 18 ? 2 : 1 };
  if (id <= 39) return { colors: 6, mystery: 0.15, locked: 0.13, igloos: 2 };
  return { colors: 7, mystery: 0.15, locked: 0.13, igloos: 2 };
}

function makeLevel(id, seed) {
  const rng = mulberry32(seed);
  const theme = THEMES[(id - 1) % THEMES.length];
  const params = tier(id);
  const digits = [...new Set(theme.art.join('').split('').filter((char) => char !== '.').map(Number))];
  for (let attempt = 0; attempt < 120; attempt++) {
    const mapping = {};
    const palette = shuffled([...Array(params.colors).keys()], rng);
    digits.forEach((digit, index) => {
      mapping[digit] = palette[index % palette.length];
    });
    let grid = parseArt(theme.art, params.colors, mapping);
    const igloos = params.igloos === 2
      ? [{ r: 6, c: 1 }, { r: 6, c: 5 }]
      : [{ r: 6, c: 3 }];
    for (const igloo of igloos) grid[igloo.r][igloo.c] = null;
    grid = grid.map((row) => row.map((cell) => {
      if (!cell) return null;
      const copy = { ...cell };
      if (params.mystery && rng() < params.mystery) copy.m = true;
      if (params.locked && rng() < params.locked) copy.l = true;
      return copy;
    }));
    const squads = counts(grid)
      .map((quota, color) => ({ color, quota }))
      .filter((squad) => squad.quota > 0)
      .map((squad) => ({ color: squad.color, quota: squad.quota }));
    const level = {
      id,
      name: theme.name + ' ' + id,
      rows: 7,
      cols: 7,
      igloos,
      slots: 5,
      squads,
      grid,
    };
    const result = solve(level, { maxNodes: 120000 });
    if (result.solvable) {
      return { ...level, difficulty: result.difficulty, solverNodes: result.nodes };
    }
  }
  throw new Error('Could not build a solvable level for id ' + id);
}

function shuffled(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const levels = [];
for (let id = 1; id <= 60; id++) {
  levels.push(makeLevel(id, id * 7919));
}

mkdirSync('levels', { recursive: true });
writeFileSync('levels/levels.json', JSON.stringify({ levels }, null, 2));
writeFileSync('src/levels-data.js', 'export const LEVELS = ' + JSON.stringify(levels, null, 2) + ';\n');
console.log('Generated and verified ' + levels.length + ' levels.');
