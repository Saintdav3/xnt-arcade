'use strict';
function airHockey(api) {
  const W = 800, H = 500, MR = 28, PR = 15, GOAL = 170, TARGET = 5, z = bag();
  const cv = el('canvas', 'pong'); api.root.append(cv);
  const ctx = hiDPI(cv, W, H);
  const m = [{ x: 110, y: H / 2, px: 110, py: H / 2 }, { x: W - 110, y: H / 2, px: W - 110, py: H / 2 }];
  const mv = [{ vx: 0, vy: 0 }, { vx: 0, vy: 0 }];
  let puck, sc = [0, 0], pause = 0.9, over = false, raf, last = 0; const keys = {};
  function serve(dir) { puck = { x: W / 2, y: H / 2, vx: dir * 140, vy: rand(-70, 70) }; pause = .9; }
  serve(api.round % 2 ? -1 : 1);
  z.on(window, 'keydown', e => { keys[e.key.toLowerCase()] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); });
  z.on(window, 'keyup', e => { keys[e.key.toLowerCase()] = false; });
  const touches = new Map();
  function toLocal(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
  function steer(e) { const p = toLocal(e); const side = api.bot ? 0 : (p.x < W / 2 ? 0 : 1); m[side].x = p.x; m[side].y = p.y; }
  z.on(cv, 'pointerdown', e => { cv.setPointerCapture(e.pointerId); touches.set(e.pointerId, 1); steer(e); });
  z.on(cv, 'pointermove', e => { if (touches.has(e.pointerId) || (api.bot && e.pointerType === 'mouse')) steer(e); });
  z.on(cv, 'pointerup', e => touches.delete(e.pointerId));
  api.status(`First to ${TARGET}. ${api.bot ? 'Move the mouse, drag, or use WASD' : 'P1: WASD. P2: arrow keys'}`);
  const clampM = () => {
    m[0].x = Math.max(MR, Math.min(W / 2 - MR, m[0].x)); m[1].x = Math.max(W / 2 + MR, Math.min(W - MR, m[1].x));
    m.forEach(k => k.y = Math.max(MR, Math.min(H - MR, k.y)));
  };
  function update(dt) {
    const sp = 460 * dt;
    if (keys.a) m[0].x -= sp; if (keys.d) m[0].x += sp; if (keys.w) m[0].y -= sp; if (keys.s) m[0].y += sp;
    if (api.bot) {
      const bs = [230, 320, 420, 760][api.lv] * dt;
      let tx, ty;
      if (puck.x > W / 2 - 10) { tx = puck.x + 26; ty = puck.y; if (puck.vx > 250 && puck.x > m[1].x) { tx = W - 90; ty = H / 2; } }
      else { tx = W - 90; ty = H / 2 + (puck.y - H / 2) * .35; }
      const dx = tx - m[1].x, dy = ty - m[1].y, d = Math.hypot(dx, dy) || 1, mvd = Math.min(d, bs);
      m[1].x += dx / d * mvd; m[1].y += dy / d * mvd;
    } else { if (keys.arrowleft) m[1].x -= sp; if (keys.arrowright) m[1].x += sp; if (keys.arrowup) m[1].y -= sp; if (keys.arrowdown) m[1].y += sp; }
    clampM();
    if (pause > 0) { pause -= dt; return; }
    if (api.rigged) { puck.vx -= 520 * dt; puck.vy += (H / 2 - puck.y) * 2 * dt; }
    puck.x += puck.vx * dt; puck.y += puck.vy * dt;
    const f = Math.pow(.55, dt); puck.vx *= f; puck.vy *= f;
    if (puck.y < PR) { puck.y = PR; puck.vy = Math.abs(puck.vy); } if (puck.y > H - PR) { puck.y = H - PR; puck.vy = -Math.abs(puck.vy); }
    const inGoal = Math.abs(puck.y - H / 2) < GOAL / 2 - PR / 2;
    if (!inGoal || (api.rigged && puck.x > W / 2)) { if (puck.x < PR) { puck.x = PR; puck.vx = Math.abs(puck.vx); } if (puck.x > W - PR) { puck.x = W - PR; puck.vx = -Math.abs(puck.vx); } }
    m.forEach((k, i) => {
      if (api.rigged && i === 0) return; // Ragebait: your mallet cannot touch the puck
      const dx = puck.x - k.x, dy = puck.y - k.y, d = Math.hypot(dx, dy), min = MR + PR;
      if (d < min && d > 0) {
        const nx = dx / d, ny = dy / d; puck.x = k.x + nx * min; puck.y = k.y + ny * min;
        const rvx = puck.vx - mv[i].vx, rvy = puck.vy - mv[i].vy, dot = rvx * nx + rvy * ny;
        if (dot < 0) { puck.vx -= 2 * dot * nx; puck.vy -= 2 * dot * ny; }
        const s = Math.hypot(puck.vx, puck.vy); if (s < 260) { puck.vx += nx * 260; puck.vy += ny * 260; }
      }
    });
    const s = Math.hypot(puck.vx, puck.vy); if (s > 1100) { puck.vx *= 1100 / s; puck.vy *= 1100 / s; }
    if (puck.x < -PR || puck.x > W + PR) {
      const w = puck.x < 0 ? 1 : 0; sc[w]++; api.status(`${api.names[w]} scores. ${sc[0]}:${sc[1]}`, w);
      if (sc[w] >= TARGET) { over = true; api.status(`${api.names[w]} wins ${sc[0]}:${sc[1]}`, w); api.finish(w); return; }
      serve(w === 0 ? 1 : -1);
    }
  }
  function draw() {
    ctx.fillStyle = '#101010'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 70, 0, 7); ctx.stroke();
    ctx.lineWidth = 8; ctx.strokeStyle = '#d3f52c'; ctx.beginPath(); ctx.moveTo(2, H / 2 - GOAL / 2); ctx.lineTo(2, H / 2 + GOAL / 2); ctx.stroke();
    ctx.strokeStyle = '#f1f1f1'; ctx.beginPath(); ctx.moveTo(W - 2, H / 2 - GOAL / 2); ctx.lineTo(W - 2, H / 2 + GOAL / 2); ctx.stroke();
    ctx.font = '700 64px "JetBrains Mono",monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(211,245,44,.35)'; ctx.fillText(sc[0], W / 2 - 80, 80); ctx.fillStyle = 'rgba(241,241,241,.35)'; ctx.fillText(sc[1], W / 2 + 80, 80);
    ['#d3f52c', '#f1f1f1'].forEach((c, i) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(m[i].x, m[i].y, MR, 0, 7); ctx.fill();
      ctx.fillStyle = '#101010'; ctx.beginPath(); ctx.arc(m[i].x, m[i].y, MR * .45, 0, 7); ctx.fill();
    });
    ctx.fillStyle = '#f1f1f1'; ctx.beginPath(); ctx.arc(puck.x, puck.y, PR, 0, 7); ctx.fill();
  }
  function loop(t) {
    const dt = Math.min((t - last) / 1000 || 0.016, 0.05); last = t;
    if (!over) {
      for (let rem = dt; rem > 0;) { const s = Math.min(rem, 1 / 180); update(s); rem -= s; }
      m.forEach((k, i) => { mv[i].vx = (k.x - k.px) / dt; mv[i].vy = (k.y - k.py) / dt; k.px = k.x; k.py = k.y; }); // mallet speed measured per frame
    }
    draw(); raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  return () => { over = true; cancelAnimationFrame(raf); z.dispose(); };
}
