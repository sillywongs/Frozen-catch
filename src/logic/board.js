// Pure board helpers: no DOM access.
export const COLOR_NAMES = ['Coral','Teal','Sun','Violet','Mint','Rose','Sky','Amber'];

export function cloneGrid(grid) {
  return grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function gridKey(grid) {
  return grid
    .map((row) => row.map((cell) => (cell ? String(cell.c) + (cell.m ? 'm' : '') + (cell.l ? 'l' : '') : '.')).join(''))
    .join('|');
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

// Water connected to the bottom edge of the board.
export function waterRegion(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const water = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const queue = [];
  for (let c = 0; c < cols; c++) {
    if (!grid[rows - 1][c]) {
      water[rows - 1][c] = true;
      queue.push([rows - 1, c]);
    }
  }
  while (queue.length) {
    const [r, c] = queue.pop();
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc] && !water[nr][nc]) {
        water[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }
  return water;
}

// Fish that a penguin could reach right now: touches bottom-connected open
// water, and locked fish are only targetable once the cell above is clear.
export function reachableTargets(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const water = waterRegion(grid);
  const targets = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      if (cell.l && r > 0 && grid[r - 1][c]) continue;
      let touch = r === rows - 1;
      if (!touch) {
        for (const [dr, dc] of DIRS) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && water[nr][nc]) {
            touch = true;
            break;
          }
        }
      }
      if (touch) targets.push({ r, c, cell });
    }
  }
  return targets;
}

export function countFish(grid) {
  let total = 0;
  for (const row of grid) for (const cell of row) if (cell) total++;
  return total;
}
