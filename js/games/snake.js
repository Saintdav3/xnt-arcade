'use strict';
function snakeDuel(api) {
  const C = 30, R = 20, S = 20, z = bag();
  const cv = el('canvas', 'maze'); api.root.append(cv); const ctx = hiDPI(cv, C * S, R * S);
  const sn = [{ b: [[5, 10], [4, 10], [3, 10]], d: [1, 0], nd: [1, 0] }, { b: [[24, 10], [25, 10], [26, 10]], d: [-1, 0], nd: [-1, 0] }];
  let food = null, inset = 0, ticks = 0, over = false, prevB = sn.map(k => k.b.slice());
  const occupied = () => { const s = new Set(); sn.forEach(k => k.b.forEach(([x, y]) => s.add(x + ',' + y))); return s; };
  function spawnFood() { const occ = occupied(); for (let t = 0; t < 500; t++) { const f = [1 + Math.floor(Math.random() * (C - 2)), 1 + Math.floor(Math.random() * (R - 2))]; if (!occ.has(f[0] + ',' + f[1])) return f; } return [15, 10]; }
  food = spawnFood();
  const setDir = (i, d) => { if (d[0] !== -sn[i].d[0] || d[1] !== -sn[i].d[1]) sn[i].nd = d; };
  const U = [0, -1], Dn = [0, 1], L = [-1, 0], Rt = [1, 0];
  const keymap = { w: () => setDir(0, U), s: () => setDir(0, Dn), a: () => setDir(0, L), d: () => setDir(0, Rt) };
  const arrows = { arrowup: U, arrowdown: Dn, arrowleft: L, arrowright: Rt };
  for (const k in arrows) keymap[k] = () => setDir(api.bot ? 0 : 1, arrows[k]);
  bindKeys(z, keymap);
  let sx = 0, sy = 0;
  z.on(cv, 'pointerdown', e => { sx = e.clientX; sy = e.clientY; });
  z.on(cv, 'pointerup', e => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; setDir(0, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? Rt : L) : (dy > 0 ? Dn : U)); });
  api.status(api.bot ? 'WASD, arrows or swipe. Last snake alive wins' : 'P1: WASD. P2: arrows. Last snake alive wins');

  function flood(x, y, occ) { const seen = new Set([x + ',' + y]), q = [[x, y]]; let n = 0; while (q.length && n < 90) { const [cx, cy] = q.shift(); n++; for (const [dx, dy] of [U, Dn, L, Rt]) { const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= C || ny >= R || occ.has(k) || seen.has(k)) continue; seen.add(k); q.push([nx, ny]); } } return n; }
  function botSteer() {
    const me = sn[1], hd = me.b[0], foe = sn[0];
    if (api.rigged) { // invulnerable hunter: aim at where your head is going
      const tx = foe.b[0][0] + foe.d[0] * 3, ty = foe.b[0][1] + foe.d[1] * 3; let best = null, bs = Infinity;
      for (const d of [U, Dn, L, Rt]) { if (d[0] === -me.d[0] && d[1] === -me.d[1]) continue; const nx = hd[0] + d[0], ny = hd[1] + d[1]; if (nx < 0 || ny < 0 || nx >= C || ny >= R) continue; const s = Math.abs(nx - tx) + Math.abs(ny - ty); if (s < bs) { bs = s; best = d; } }
      if (best) me.nd = best; return;
    }
    const occ = occupied(), opts = [];
    for (const d of [U, Dn, L, Rt]) {
      if (d[0] === -me.d[0] && d[1] === -me.d[1]) continue;
      const nx = hd[0] + d[0], ny = hd[1] + d[1]; if (nx < 0 || ny < 0 || nx >= C || ny >= R || occ.has(nx + ',' + ny)) continue;
      const dist = Math.abs(nx - food[0]) + Math.abs(ny - food[1]);
      opts.push({ d, dist, room: api.lv >= 2 ? flood(nx, ny, occ) : 99 });
    }
    if (!opts.length) return;
    if (Math.random() < [.3, .1, 0][api.lv]) { me.nd = pick(opts).d; return; }
    const need = me.b.length + 4; opts.sort((a, b) => (b.room >= need) - (a.room >= need) || a.dist - b.dist); me.nd = opts[0].d;
  }
  function step() {
    if (over) return; ticks++;
    if (api.rigged && ticks % 26 === 0 && inset < 8) inset++;
    if (api.bot) botSteer();
    prevB = sn.map(k => k.b.slice());
    const heads = sn.map(k => { k.d = k.nd; return [k.b[0][0] + k.d[0], k.b[0][1] + k.d[1]]; });
    const grew = heads.map(h => h[0] === food[0] && h[1] === food[1]);
    const occ = new Set(); sn.forEach((k, i) => k.b.forEach(([x, y], j) => { if (j === k.b.length - 1 && !grew[i]) return; occ.add(x + ',' + y); }));
    const dead = heads.map((h, i) => {
      if (api.rigged && i === 1) return false; // the bot cannot die
      const ins = api.rigged && i === 0 ? inset : 0; // the closing walls only ever hurt you
      const wall = h[0] < ins || h[1] < ins || h[0] >= C - ins || h[1] >= R - ins;
      return wall || occ.has(h[0] + ',' + h[1]) || (heads[0][0] === heads[1][0] && heads[0][1] === heads[1][1]);
    });
    if (api.rigged && heads[0][0] === heads[1][0] && heads[0][1] === heads[1][1]) dead[0] = true;
    if (dead[0] || dead[1]) {
      over = true; prevB = sn.map(k => k.b.slice());
      const w = dead[0] && dead[1] ? -1 : dead[0] ? 1 : 0;
      api.status(w < 0 ? 'Both crashed. Draw' : `${api.names[w]} wins!`, w); return api.finish(w);
    }
    sn.forEach((k, i) => { k.b.unshift(heads[i]); if (!grew[i]) k.b.pop(); });
    if (grew[0] || grew[1]) food = spawnFood();
  }
  function draw(a) {
    a = over ? 1 : a;
    ctx.fillStyle = '#101010'; ctx.fillRect(0, 0, C * S, R * S);
    if (inset) { ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, 0, C * S, inset * S); ctx.fillRect(0, (R - inset) * S, C * S, inset * S); ctx.fillRect(0, 0, inset * S, R * S); ctx.fillRect((C - inset) * S, 0, inset * S, R * S); }
    ctx.fillStyle = '#f1f1f1'; ctx.beginPath(); ctx.arc(food[0] * S + S / 2, food[1] * S + S / 2, S / 3, 0, 7); ctx.fill();
    ['#d3f52c', '#f1f1f1'].forEach((col, i) => {
      const body = sn[i].b, old = prevB[i];
      body.forEach(([x, y], j) => { // every segment glides from where it was to where it is now
        const [ox, oy] = old[Math.min(j, old.length - 1)], px = ox + (x - ox) * a, py = oy + (y - oy) * a;
        ctx.fillStyle = col; ctx.globalAlpha = j === 0 ? 1 : .82; ctx.beginPath(); ctx.roundRect(px * S + 1, py * S + 1, S - 2, S - 2, j === 0 ? 8 : 6); ctx.fill();
      });
    });
    ctx.globalAlpha = 1;
  }
  ticker(z, [150, 125, 105, 100][api.lv], step, draw);
  return () => { over = true; z.dispose(); };
}
