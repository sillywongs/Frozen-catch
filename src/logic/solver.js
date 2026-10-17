// Depth-first solver with memoization. Uses the real game rules, so a
// solution returned here is guaranteed to win in the actual game loop.
import { gridKey } from './board.js';
import { createGame, cloneState, placeSquad } from './game.js';

function difficultyLabel(nodes, branching) {
  if (nodes < 60 && branching < 1.6) return 'gentle';
  if (nodes < 600) return 'easy';
  if (nodes < 6000) return 'moderate';
  return 'tricky';
}

export function solve(level, options = {}) {
  const maxNodes = options.maxNodes ?? 60000;
  const slotCap = options.slotCap ?? level.slots ?? 5;
  const start = cloneState(createGame(level, { slotCap }));
  const memo = new Map();
  let nodes = 0;
  let branches = 0;
  let decisionPoints = 0;
  let solution = null;

  function key(state) {
    const active = state.active.map((s) => s.color + ':' + s.remaining).sort().join(',');
    const available = state.available.map((s) => s.color + ':' + s.quota).sort().join(',');
    return gridKey(state.grid) + '#' + active + '#' + available + '#' + state.slotCap;
  }

  function dfs(state) {
    if (solution) return true;
    if (!state.grid.some((row) => row.some((cell) => cell))) {
      solution = [];
      return true;
    }
    const stateKey = key(state);
    if (memo.has(stateKey)) return memo.get(stateKey);
    if (nodes >= maxNodes) {
      memo.set(stateKey, false);
      return false;
    }
    nodes++;
    decisionPoints++;
    const tried = new Set();
    let result = false;
    for (const squad of state.available) {
      const signature = squad.color + ':' + squad.quota;
      if (tried.has(signature)) continue;
      tried.add(signature);
      const next = cloneState(state);
      const placed = placeSquad(next, squad.id);
      if (!placed.ok) continue;
      if (next.status === 'lost') continue;
      branches++;
      if (dfs(next)) {
        solution = [squad.color, ...solution];
        result = true;
        break;
      }
    }
    memo.set(stateKey, result);
    return result;
  }

  const solvable = dfs(start);
  const branching = decisionPoints ? branches / decisionPoints : 0;
  return {
    solvable,
    solution,
    nodes,
    branchingFactor: Number(branching.toFixed(3)),
    difficulty: difficultyLabel(nodes, branching),
  };
}
