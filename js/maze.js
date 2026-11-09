'use strict';
/* Shared maze helpers for Pac-Man Chase and Flag Run. 1 = wall, 0 = open. */
const MAZE_R = 13, MAZE_C = 21, MAZE_T = 36;
const DIRS4 = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // [dr, dc]
function makeMaze() {
  const g = [];
  for (let r = 0; r < MAZE_R; r++) {
    g.push([]);
    for (let c = 0; c < MAZE_C; c++) g[r].push(r === 0 || c === 0 || r === MAZE_R - 1 || c === MAZE_C - 1 || (r % 2 === 0 && c % 2 === 0) ? 1 : 0);
  }
  g[6][10] = 0; // open centre
  return g;
}
const mazeOpen = (g, r, c) => r >= 0 && r < MAZE_R && c >= 0 && c < MAZE_C && !g[r][c];
function mazeNext(g, from, to) { // first step of a shortest path, or null
  if (from[0] === to[0] && from[1] === to[1]) return null;
  const key = (r, c) => r * MAZE_C + c, prev = new Map([[key(...from), null]]), q = [from];
  while (q.length) {
    const [r, c] = q.shift();
    for (const [dr, dc] of DIRS4) {
      const nr = r + dr, nc = c + dc, k = key(nr, nc);
      if (!mazeOpen(g, nr, nc) || prev.has(k)) continue;
      prev.set(k, [r, c]);
      if (nr === to[0] && nc === to[1]) {
        let cur = [nr, nc];
        while (prev.get(key(...cur)) && (prev.get(key(...cur))[0] !== from[0] || prev.get(key(...cur))[1] !== from[1])) cur = prev.get(key(...cur));
        return cur;
      }
      q.push([nr, nc]);
    }
  }
  return null;
}
function drawMaze(ctx, g) {
  const T = MAZE_T;
  ctx.fillStyle = '#101010'; ctx.fillRect(0, 0, MAZE_C * T, MAZE_R * T);
  ctx.fillStyle = '#262626';
  for (let r = 0; r < MAZE_R; r++) for (let c = 0; c < MAZE_C; c++) if (g[r][c]) { ctx.beginPath(); ctx.roundRect(c * T + 2, r * T + 2, T - 4, T - 4, 6); ctx.fill(); }
}
function bindKeys(z, map) { // map: { key: fn }
  z.on(window, 'keydown', e => { const f = map[e.key.toLowerCase()]; if (f) { e.preventDefault(); f(); } });
}

function pathPos(path, a) { // [r,c] a fraction a (0..1) of the way along a list of tiles
  const n = path.length - 1; if (n <= 0) return path[0];
  const f = Math.min(a, .9999) * n, i = Math.floor(f), t = f - i;
  return [path[i][0] + (path[i + 1][0] - path[i][0]) * t, path[i][1] + (path[i + 1][1] - path[i][1]) * t];
}
