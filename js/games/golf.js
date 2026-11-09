'use strict';
const GOLF_HOLES = [
  { tee: [90, 250], hole: [710, 250], walls: [[390, 170, 22, 160]] },
  { tee: [80, 440], hole: [720, 60], walls: [[260, 20, 24, 300], [520, 180, 24, 300]] },
  { tee: [80, 250], hole: [720, 250], walls: [[250, 90, 30, 130], [250, 280, 30, 130], [480, 190, 30, 120]] }
];
/* Take turns putting. Drag back from your ball and let go. Fewest strokes over three holes wins. */
function miniGolf(api) {
  const W = 800, H = 500, BR = 8, HR = 15, M = 20, CAP = 7, MAXV = 740, z = bag();
  const cv = el('canvas', 'pong'); api.root.append(cv); const ctx = hiDPI(cv, W, H);
  let hi = 0, turn = api.round % 2, over = false, tot = [0, 0], phase = 'aim', course, balls, aim = null, mouse = null, raf, last = 0;
  const hole = () => course.hole;

  function startHole() {
    course = GOLF_HOLES[hi];
    balls = [0, 1].map(i => ({ x: course.tee[0], y: course.tee[1] + (i ? 14 : -14), vx: 0, vy: 0, sunk: false, strokes: 0, ghost: false }));
    phase = 'aim'; nextTurn(true);
  }
  function say() { api.status(`Hole ${hi + 1} of 3 · ${api.names[turn]}'s putt · strokes ${tot[0]}:${tot[1]}`, turn); }
  function nextTurn(first) {
    if (!first) { const o = 1 - turn; turn = balls[o].sunk ? turn : o; }
    phase = 'aim'; say();
    if (api.bot && turn === 1) z.after(botShot, 800);
  }

  function step(b, dt, ghost) { // shared by live play and the bot's practice swings
    b.x += b.vx * dt; b.y += b.vy * dt; const f = Math.pow(.35, dt); b.vx *= f; b.vy *= f;
    if (!ghost) {
      if (b.x < M + BR) { b.x = M + BR; b.vx = Math.abs(b.vx) * .85; } if (b.x > W - M - BR) { b.x = W - M - BR; b.vx = -Math.abs(b.vx) * .85; }
      if (b.y < M + BR) { b.y = M + BR; b.vy = Math.abs(b.vy) * .85; } if (b.y > H - M - BR) { b.y = H - M - BR; b.vy = -Math.abs(b.vy) * .85; }
      for (const [x, y, w, h] of course.walls) {
        const cx = Math.max(x, Math.min(b.x, x + w)), cy = Math.max(y, Math.min(b.y, y + h)), dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy);
        if (d >= BR) continue;
        if (d === 0) { b.y = y - BR; b.vy = -Math.abs(b.vy); continue; }
        const nx = dx / d, ny = dy / d; b.x = cx + nx * BR; b.y = cy + ny * BR;
        const dot = b.vx * nx + b.vy * ny; if (dot < 0) { b.vx -= 1.85 * dot * nx; b.vy -= 1.85 * dot * ny; }
      }
    }
    const sp = Math.hypot(b.vx, b.vy);
    if (Math.hypot(b.x - hole()[0], b.y - hole()[1]) < HR && (sp < 420 || ghost)) { b.sunk = true; b.x = hole()[0]; b.y = hole()[1]; b.vx = b.vy = 0; return; }
    if (sp < 9) b.vx = b.vy = 0;
  }
  function shoot(i, vx, vy, ghost) {
    const b = balls[i]; b.vx = vx; b.vy = vy; b.ghost = !!ghost; b.strokes++; tot[i]++; phase = 'roll'; api.status(`${api.names[i]} putts…`, i);
  }
  function endShot() {
    const b = balls[turn]; b.ghost = false;
    if (!b.sunk && b.strokes >= CAP) b.sunk = true; // pick up after seven
    if (balls[0].sunk && balls[1].sunk) return endHole();
    nextTurn(false);
  }
  function endHole() {
    phase = 'between'; api.status(`Hole ${hi + 1}: ${balls[0].strokes} vs ${balls[1].strokes} strokes`);
    z.after(() => {
      if (++hi < GOLF_HOLES.length) return startHole();
      over = true; const w = tot[0] < tot[1] ? 0 : tot[1] < tot[0] ? 1 : (api.rigged ? 1 : -1);
      api.status(w < 0 ? `Tied on ${tot[0]} strokes` : `${api.names[w]} wins ${tot[0]}:${tot[1]} strokes`, w); api.finish(w);
    }, 1500);
  }

  // bot: practice swings on a copy of the ball, keep the best
  function sim(b0, vx, vy) {
    const b = { x: b0.x, y: b0.y, vx, vy, sunk: false };
    for (let t = 0; t < 420; t++) { step(b, 1 / 60, false); if (b.sunk || (!b.vx && !b.vy)) break; }
    return { sunk: b.sunk, d: Math.hypot(b.x - hole()[0], b.y - hole()[1]) };
  }
  function botShot() {
    if (over || phase !== 'aim' || turn !== 1) return;
    const b = balls[1], dx = hole()[0] - b.x, dy = hole()[1] - b.y, dist = Math.hypot(dx, dy), base = Math.atan2(dy, dx), need = Math.min(MAXV, dist * 1.05 + 230);
    if (api.rigged) return shoot(1, Math.cos(base) * Math.min(need, MAXV), Math.sin(base) * Math.min(need, MAXV), true); // ignores walls, always drops
    const noise = [.32, .07, .02][api.lv] * (Math.random() + Math.random() - 1) * 2, pw = 1 + [.3, .1, .03][api.lv] * (Math.random() * 2 - 1);
    if (api.lv === 0) return shoot(1, Math.cos(base + noise) * need * pw, Math.sin(base + noise) * need * pw);
    const nA = api.lv === 1 ? 11 : 31, span = api.lv === 1 ? .3 : .11; let best = null;
    for (let k = 0; k < nA; k++) for (const p of [.45, .6, .75, .9, 1]) {
      const a = base + (k - (nA - 1) / 2) * span, v = MAXV * p, r = sim(b, Math.cos(a) * v, Math.sin(a) * v), score = r.sunk ? -1e6 : r.d;
      if (!best || score < best.score) best = { score, a, v };
    }
    shoot(1, Math.cos(best.a + noise) * best.v, Math.sin(best.a + noise) * best.v);
  }

  // human aiming: drag back from the ball, release to putt
  const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (W / (r.width || W)), (e.clientY - r.top) * (H / (r.height || H))]; };
  z.on(cv, 'pointerdown', e => { if (phase === 'aim' && !(api.bot && turn === 1)) { aim = pt(e); mouse = aim; } });
  z.on(window, 'pointermove', e => { if (aim) mouse = pt(e); });
  z.on(window, 'pointerup', e => {
    if (!aim) return; const m = pt(e), b = balls[turn]; aim = null;
    const dx = b.x - m[0], dy = b.y - m[1], len = Math.hypot(dx, dy); if (len < 12 || phase !== 'aim') return;
    const pw = Math.min(len, 150) / 150; shoot(turn, dx / len * pw * MAXV, dy / len * pw * MAXV);
  });

  function frame(t) {
    const dt = Math.min((t - last) / 1000 || 0, .05); last = t;
    if (phase === 'roll') {
      const b = balls[turn];
      for (let rem = dt; rem > 0 && phase === 'roll';) { const s = Math.min(rem, 1 / 180); step(b, s, b.ghost); rem -= s; if (b.sunk || (!b.vx && !b.vy)) { endShot(); } }
    }
    draw();
  }
  function draw() {
    ctx.fillStyle = '#101010'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2e2e2e'; ctx.lineWidth = 6; ctx.strokeRect(M - 3, M - 3, W - 2 * M + 6, H - 2 * M + 6);
    ctx.fillStyle = '#2e2e2e'; course.walls.forEach(([x, y, w, h]) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, 5); ctx.fill(); });
    const [hx, hy] = hole(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(hx, hy, HR, 0, 7); ctx.fill(); ctx.strokeStyle = '#d3f52c'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = '#f1f1f1'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx, hy - 42); ctx.stroke(); ctx.fillStyle = '#d3f52c'; ctx.beginPath(); ctx.moveTo(hx, hy - 42); ctx.lineTo(hx + 20, hy - 35); ctx.lineTo(hx, hy - 28); ctx.fill();
    if (aim && mouse && phase === 'aim') { // pull-back line and shot direction
      const b = balls[turn], dx = b.x - mouse[0], dy = b.y - mouse[1], len = Math.hypot(dx, dy), pw = Math.min(len, 150) / 150;
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(mouse[0], mouse[1]); ctx.stroke();
      if (len > 1) { ctx.setLineDash([]); ctx.strokeStyle = turn ? '#f1f1f1' : '#d3f52c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + dx / len * pw * 120, b.y + dy / len * pw * 120); ctx.stroke(); }
      ctx.setLineDash([]);
    }
    balls.forEach((b, i) => { if (b.sunk) return; ctx.fillStyle = i ? '#f1f1f1' : '#d3f52c'; ctx.beginPath(); ctx.arc(b.x, b.y, BR, 0, 7); ctx.fill(); if (i === turn && phase === 'aim') { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, BR + 5, 0, 7); ctx.stroke(); } });
  }
  z.frame(frame);
  startHole();
  return () => { over = true; z.dispose(); };
}
