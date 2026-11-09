'use strict';
/* Player 1 is Pac-Man (eat every dot). Player 2 is the ghost (catch Pac-Man). */
function pacChase(api) {
  const g = makeMaze(), T = MAZE_T, z = bag();
  const cv = el('canvas', 'maze'); api.root.append(cv); const ctx = hiDPI(cv, MAZE_C * T, MAZE_R * T);
  const pac = { r: 11, c: 1, d: [0, 1], nd: [0, 1], path: [[11, 1]], face: 0 }, gh = { r: 1, c: 19, d: [0, -1], nd: [0, -1], path: [[1, 19]] };
  const dots = new Set(); for (let r = 0; r < MAZE_R; r++) for (let c = 0; c < MAZE_C; c++) if (!g[r][c]) dots.add(r + ',' + c);
  dots.delete('11,1'); dots.delete('1,19');
  let over = false;
  const U = [-1, 0], Dn = [1, 0], L = [0, -1], Rt = [0, 1];
  const km = { w: () => pac.nd = U, s: () => pac.nd = Dn, a: () => pac.nd = L, d: () => pac.nd = Rt };
  const arrows = { arrowup: U, arrowdown: Dn, arrowleft: L, arrowright: Rt };
  for (const k in arrows) km[k] = () => { if (api.bot) pac.nd = arrows[k]; else gh.nd = arrows[k]; };
  bindKeys(z, km);
  let sx = 0, sy = 0;
  z.on(cv, 'pointerdown', e => { sx = e.clientX; sy = e.clientY; });
  z.on(cv, 'pointerup', e => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; pac.nd = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? Rt : L) : (dy > 0 ? Dn : U); });
  const say = () => api.status(`${api.bot ? 'You are Pac-Man. Eat every dot' : 'P1 Pac-Man: WASD. P2 ghost: arrows'} · dots left ${dots.size}`, 0);
  function stepActor(a) { // try the queued direction, else keep going
    for (const d of [a.nd, a.d]) if (mazeOpen(g, a.r + d[0], a.c + d[1])) { a.d = d; a.r += d[0]; a.c += d[1]; a.path.push([a.r, a.c]); return; }
  }
  function ghostAI() {
    const moves = api.rigged ? 2 : 1, skip = [.5, .2, 0, 0][api.lv], wander = [.4, .15, .05, 0][api.lv];
    if (Math.random() < skip) return;
    for (let s = 0; s < moves && !over; s++) {
      let nxt = Math.random() < wander ? null : mazeNext(g, [gh.r, gh.c], [pac.r, pac.c]);
      if (!nxt) nxt = pick(DIRS4.map(([dr, dc]) => [gh.r + dr, gh.c + dc]).filter(([r, c]) => mazeOpen(g, r, c)));
      gh.r = nxt[0]; gh.c = nxt[1]; gh.path.push([gh.r, gh.c]); if (gh.r === pac.r && gh.c === pac.c) return caught();
    }
  }
  function caught() { over = true; api.status(`${api.names[1]} caught Pac-Man!`, 1); api.finish(1); }
  function tick() {
    if (over) return;
    pac.path = [[pac.r, pac.c]]; gh.path = [[gh.r, gh.c]];
    const pr = pac.r, pc = pac.c, gr = gh.r, gc = gh.c;
    stepActor(pac); dots.delete(pac.r + ',' + pac.c);
    if (pac.r === gh.r && pac.c === gh.c) return caught();
    if (!dots.size) { over = true; api.status('Pac-Man ate every dot!', 0); return api.finish(0); }
    if (api.bot) ghostAI(); else stepActor(gh);
    if (!over && ((pac.r === gh.r && pac.c === gh.c) || (pac.r === gr && pac.c === gc && gh.r === pr && gh.c === pc))) return caught();
    if (!over) say();
  }
  function draw(a) {
    a = over ? 1 : a;
    drawMaze(ctx, g);
    ctx.fillStyle = '#f1f1f1'; dots.forEach(k => { const [r, c] = k.split(',').map(Number); ctx.beginPath(); ctx.arc(c * T + T / 2, r * T + T / 2, 3.5, 0, 7); ctx.fill(); });
    const [pr, pc] = pathPos(pac.path, a), px = pc * T + T / 2, py = pr * T + T / 2;
    const target = Math.atan2(pac.d[0], pac.d[1]); let dAng = target - pac.face; dAng = Math.atan2(Math.sin(dAng), Math.cos(dAng)); pac.face += dAng * .35; // eased turning
    const m = .08 + .5 * Math.abs(Math.sin(performance.now() / 90));
    ctx.fillStyle = '#d3f52c'; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, T / 2 - 3, pac.face + m, pac.face - m + Math.PI * 2); ctx.closePath(); ctx.fill();
    const [gr, gc] = pathPos(gh.path, a), gx = gc * T + T / 2, gy = gr * T + T / 2, wob = Math.sin(performance.now() / 120) * 1.5; ctx.fillStyle = '#f1f1f1';
    ctx.beginPath(); ctx.arc(gx, gy - 2, T / 2 - 3, Math.PI, 0); ctx.lineTo(gx + T / 2 - 3, gy + T / 2 - 4 + wob); ctx.lineTo(gx - T / 2 + 3, gy + T / 2 - 4 - wob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#101010'; ctx.beginPath(); ctx.arc(gx - 5 + gh.d[1] * 2, gy - 3 + gh.d[0] * 2, 3, 0, 7); ctx.arc(gx + 5 + gh.d[1] * 2, gy - 3 + gh.d[0] * 2, 3, 0, 7); ctx.fill();
  }
  say(); ticker(z, 170, tick, draw);
  return () => { over = true; z.dispose(); };
}
