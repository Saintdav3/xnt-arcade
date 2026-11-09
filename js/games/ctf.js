'use strict';
/* Grab the flag from the centre and carry it back to your corner. Touch the carrier to send them home. */
function flagRun(api) {
  const g = makeMaze(), T = MAZE_T, z = bag();
  const cv = el('canvas', 'maze'); api.root.append(cv); const ctx = hiDPI(cv, MAZE_C * T, MAZE_R * T);
  const HOME = [[11, 1], [1, 19]], FLAG0 = [6, 10];
  const p = [{ r: 11, c: 1, d: [0, 1], nd: [0, 1], path: [[11, 1]] }, { r: 1, c: 19, d: [0, -1], nd: [0, -1], path: [[1, 19]] }];
  let carrier = -1, over = false;
  const U = [-1, 0], Dn = [1, 0], L = [0, -1], Rt = [0, 1];
  const km = { w: () => p[0].nd = U, s: () => p[0].nd = Dn, a: () => p[0].nd = L, d: () => p[0].nd = Rt };
  const arrows = { arrowup: U, arrowdown: Dn, arrowleft: L, arrowright: Rt };
  for (const k in arrows) km[k] = () => { p[api.bot ? 0 : 1].nd = arrows[k]; };
  bindKeys(z, km);
  let sx = 0, sy = 0;
  z.on(cv, 'pointerdown', e => { sx = e.clientX; sy = e.clientY; });
  z.on(cv, 'pointerup', e => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; p[0].nd = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? Rt : L) : (dy > 0 ? Dn : U); });
  const say = () => api.status(carrier < 0 ? 'Grab the flag in the middle' : `${api.names[carrier]} has the flag. Get it home, or tag them`, carrier < 0 ? undefined : carrier);
  function walk(a) { for (const d of [a.nd, a.d]) if (mazeOpen(g, a.r + d[0], a.c + d[1])) { a.d = d; a.r += d[0]; a.c += d[1]; a.path.push([a.r, a.c]); return; } }
  function botWalk() {
    const me = p[1], foe = p[0]; let target;
    if (carrier === 1) target = HOME[1]; else if (carrier === 0) target = [foe.r, foe.c]; else target = FLAG0;
    let nxt = Math.random() < [.4, .15, .05, 0][api.lv] ? null : mazeNext(g, [me.r, me.c], target);
    if (!nxt) nxt = pick(DIRS4.map(([dr, dc]) => [me.r + dr, me.c + dc]).filter(([r, c]) => mazeOpen(g, r, c)));
    me.r = nxt[0]; me.c = nxt[1]; me.path.push([me.r, me.c]);
  }
  function resolve(prev) {
    if (carrier < 0) for (const i of [0, 1]) if (p[i].r === FLAG0[0] && p[i].c === FLAG0[1]) { carrier = i; break; }
    if (carrier >= 0 && p[carrier].r === HOME[carrier][0] && p[carrier].c === HOME[carrier][1]) { over = true; api.status(`${api.names[carrier]} scored!`, carrier); return api.finish(carrier); }
    const touch = (p[0].r === p[1].r && p[0].c === p[1].c) || (p[0].r === prev[1][0] && p[0].c === prev[1][1] && p[1].r === prev[0][0] && p[1].c === prev[0][1]);
    if (touch && carrier >= 0 && !(api.rigged && carrier === 1)) { const c = carrier; carrier = -1; p[c].r = HOME[c][0]; p[c].c = HOME[c][1]; p[c].path.push([p[c].r, p[c].c]); }
  }
  function tick() {
    if (over) return;
    p.forEach(a => { a.path = [[a.r, a.c]]; });
    const prev = p.map(a => [a.r, a.c]);
    walk(p[0]); if (!api.bot) walk(p[1]);
    resolve(prev); if (over) return;
    if (api.bot) {
      const skip = [.5, .2, 0, 0][api.lv], steps = api.rigged ? 2 : 1;
      if (Math.random() >= skip) for (let s = 0; s < steps && !over; s++) { const pv = p.map(a => [a.r, a.c]); botWalk(); resolve(pv); }
    }
    if (!over) say();
  }
  function draw(a) {
    a = over ? 1 : a;
    drawMaze(ctx, g);
    HOME.forEach((h, i) => { ctx.strokeStyle = i ? '#f1f1f1' : '#d3f52c'; ctx.lineWidth = 3; ctx.strokeRect(h[1] * T + 4, h[0] * T + 4, T - 8, T - 8); });
    const pos = p.map(x => pathPos(x.path, a));
    const [fr, fc] = carrier >= 0 ? pos[carrier] : FLAG0, fx = fc * T + T / 2, fy = fr * T + T / 2 - (carrier >= 0 ? 8 : 0);
    ctx.strokeStyle = '#f1f1f1'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx - 4, fy + 11); ctx.lineTo(fx - 4, fy - 12); ctx.stroke();
    ctx.fillStyle = '#d3f52c'; ctx.beginPath(); ctx.moveTo(fx - 4, fy - 12); ctx.lineTo(fx + 12, fy - 6); ctx.lineTo(fx - 4, fy); ctx.closePath(); ctx.fill();
    ['#d3f52c', '#f1f1f1'].forEach((col, i) => { const x = pos[i][1] * T + T / 2, y = pos[i][0] * T + T / 2; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, T / 2 - 6, 0, 7); ctx.fill(); ctx.fillStyle = '#101010'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); });
  }
  say(); ticker(z, 170, tick, draw);
  return () => { over = true; z.dispose(); };
}
