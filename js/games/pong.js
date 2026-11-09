'use strict';
function pong(api) {
  const W = 800, H = 500, PH = 90, PW = 12, TARGET = 5, z = bag();
  const cv = el('canvas', 'pong'); api.root.append(cv);
  const ctx = hiDPI(cv, W, H);
  const pad = [{ y: H / 2 - PH / 2, v: 0 }, { y: H / 2 - PH / 2, v: 0 }];
  const keys = {}; let sc = [0, 0], ball, raf, last = 0, pause = 1.0, over = false, trail = [], botErr = 0;
  const speedP = 520, botSpeed = [250, 340, 470, 1100][api.lv], ERR = [.45, .35, .22, 0][api.lv];
  const newErr = () => api.lv === 3 ? 0 : rand(-PH * ERR, PH * ERR);
  function serve(dir) {
    const a = rand(-0.4, 0.4); ball = { x: W / 2, y: H / 2, vx: Math.cos(a) * 340 * dir, vy: Math.sin(a) * 340, r: 9 }; trail = []; pause = 0.9; botErr = newErr();
  }
  serve(api.round % 2 ? -1 : 1);
  z.on(window, 'keydown', e => { keys[e.key.toLowerCase()] = true; if (['arrowup', 'arrowdown', ' '].includes(e.key.toLowerCase())) e.preventDefault(); });
  z.on(window, 'keyup', e => { keys[e.key.toLowerCase()] = false; });
  const touches = new Map();
  function tpos(e) { const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height * H; return { side: api.bot ? 0 : (x < .5 ? 0 : 1), y }; }
  z.on(cv, 'pointerdown', e => { cv.setPointerCapture(e.pointerId); const t = tpos(e); touches.set(e.pointerId, t); pad[t.side].y = t.y - PH / 2; });
  z.on(cv, 'pointermove', e => { if (!touches.has(e.pointerId)) return; const t = tpos(e); const s = touches.get(e.pointerId).side; pad[s].y = t.y - PH / 2; });
  z.on(cv, 'pointerup', e => touches.delete(e.pointerId));
  api.status(`First to ${TARGET} · ${api.bot ? 'W/S or drag' : 'P1: W/S · P2: ↑/↓'}`);
  function update(dt) {
    // paddles
    if (keys.w) pad[0].y -= speedP * dt; if (keys.s) pad[0].y += speedP * dt;
    if (api.bot) {
      if (keys.arrowup) pad[0].y -= speedP * dt; if (keys.arrowdown) pad[0].y += speedP * dt;
      if (ball.vx > 0 || Math.abs(ball.x - W / 2) < 150) {
        const target = (ball.vx > 0 ? ball.y : H / 2) + botErr - PH / 2, d = target - pad[1].y, m = botSpeed * dt;
        pad[1].y += Math.abs(d) < m ? d : Math.sign(d) * m;
      }
    } else { if (keys.arrowup) pad[1].y -= speedP * dt; if (keys.arrowdown) pad[1].y += speedP * dt; }
    pad.forEach(p => p.y = Math.max(0, Math.min(H - PH, p.y)));
    if (pause > 0) { pause -= dt; return; }
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -1; } if (ball.y > H - ball.r) { ball.y = H - ball.r; ball.vy *= -1; }
    // paddle collisions
    const px = [26, W - 26 - PW];
    for (let i = 0; i < 2; i++) {
      const left = i === 0, x0 = px[i];
      if (ball.x + ball.r > x0 && ball.x - ball.r < x0 + PW && ball.y > pad[i].y - 4 && ball.y < pad[i].y + PH + 4 && (left ? ball.vx < 0 : ball.vx > 0) && !(api.rigged && left)) {
        const rel = (ball.y - (pad[i].y + PH / 2)) / (PH / 2), sp = Math.min(Math.hypot(ball.vx, ball.vy) * 1.07, 900), ang = rel * 0.9;
        ball.vx = Math.cos(ang) * sp * (left ? 1 : -1); ball.vy = Math.sin(ang) * sp; ball.x = left ? x0 + PW + ball.r : x0 - ball.r;
        botErr = newErr();
      }
    }
    if (ball.x < -20 || ball.x > W + 20) {
      const w = ball.x < 0 ? 1 : 0; sc[w]++; api.status(`${api.names[w]} scores! ${sc[0]}:${sc[1]}`, w);
      if (sc[w] >= TARGET) { over = true; api.status(`${api.names[w]} wins ${sc[0]}:${sc[1]}!`, w); api.finish(w); return; }
      serve(w === 0 ? 1 : -1);
    }
  }
  function draw() {
    ctx.fillStyle = '#101010'; ctx.fillRect(0, 0, W, H);
    ctx.setLineDash([12, 14]); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '700 72px "JetBrains Mono",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(211,245,44,.4)'; ctx.fillText(sc[0], W / 2 - 90, 86); ctx.fillStyle = 'rgba(241,241,241,.4)'; ctx.fillText(sc[1], W / 2 + 90, 86);
    trail.forEach((t, i) => { ctx.fillStyle = `rgba(255,255,255,${i / trail.length * .25})`; ctx.beginPath(); ctx.arc(t.x, t.y, ball.r * (i / trail.length), 0, 7); ctx.fill(); });
    const col = ['#d3f52c', '#f1f1f1'];
    pad.forEach((p, i) => { ctx.fillStyle = col[i]; const x = i ? W - 26 - PW : 26; ctx.beginPath(); ctx.roundRect(x, p.y, PW, PH, 4); ctx.fill(); });
    ctx.fillStyle = '#f1f1f1'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
  }
  function loop(t) {
    const dt = Math.min((t - last) / 1000 || 0, 0.05); last = t;
    if (!over) { for (let rem = dt; rem > 0;) { const s = Math.min(rem, 1 / 180); update(s); rem -= s; } trail.push({ x: ball.x, y: ball.y }); if (trail.length > 14) trail.shift(); } // small physics steps stop fast balls skipping through paddles
    draw(); raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  return () => { over = true; cancelAnimationFrame(raf); z.dispose(); };
}
