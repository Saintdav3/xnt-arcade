'use strict';
function battleship(api) {
  const N = 8, LENS = [4, 3, 3, 2], z = bag(); let turn = api.round % 2, over = false;
  function fleet() {
    const ship = Array(N * N).fill(-1);
    LENS.forEach((len, id) => {
      for (;;) {
        const h = Math.random() < .5, r = Math.floor(Math.random() * (h ? N : N - len + 1)), c = Math.floor(Math.random() * (h ? N - len + 1 : N));
        const cells = Array.from({ length: len }, (_, k) => (h ? r * N + c + k : (r + k) * N + c));
        if (cells.every(i => ship[i] < 0)) { cells.forEach(i => ship[i] = id); break; }
      }
    });
    return { ship, shots: Array(N * N).fill(0), left: LENS.reduce((a, b) => a + b, 0) }; // shots: 1 miss, 2 hit
  }
  const F = [fleet(), fleet()]; // F[p] = the fleet owned by player p
  const root = el('div', 'bs'); api.root.append(root);
  const queue = []; // bot follow-up targets

  function boardHTML(owner, showShips, clickable) {
    const f = F[owner];
    return `<div class="bgrid${clickable ? ' live' : ''}" data-o="${owner}">${f.shots.map((s, i) =>
      `<button class="bcell${s === 1 ? ' miss' : s === 2 ? ' hit' : ''}${showShips && f.ship[i] >= 0 && s !== 2 ? ' ship' : ''}" data-i="${i}" ${clickable && !s ? '' : 'disabled'} aria-label="cell"></button>`).join('')}</div>`;
  }
  function render() {
    if (api.bot) {
      root.innerHTML = `<div class="bside"><b>Enemy waters</b>${boardHTML(1, false, !over && turn === 0)}</div><div class="bside"><b>Your fleet</b>${boardHTML(0, true, false)}</div>`;
    } else {
      root.innerHTML = `<div class="bside"><b>${api.names[turn]}, fire at ${api.names[1 - turn]}</b>${boardHTML(1 - turn, false, !over)}</div>`;
    }
    $$('.bgrid.live .bcell', root).forEach(c => c.onclick = () => fire(turn, +c.dataset.i));
  }
  function fire(p, i) {
    if (over) return; const tgt = F[1 - p]; if (tgt.shots[i]) return;
    let hit = tgt.ship[i] >= 0;
    if (api.rigged && p === 0 && hit) { hit = false; api.status(`${api.names[1]} moved the ship`, 1); } // your hits are dodged
    tgt.shots[i] = hit ? 2 : 1; if (hit) tgt.left--;
    if (hit && p === 1 && api.lv >= 1) [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => { const r = (i / N | 0) + dr, c = i % N + dc; if (r >= 0 && r < N && c >= 0 && c < N) queue.push(r * N + c); });
    if (tgt.left <= 0) { over = true; render(); api.status(`${api.names[p]} sank the fleet!`, p); return api.finish(p); }
    turn = 1 - p;
    if (api.bot) { render(); z.after(say, hit || (api.rigged && p === 0) ? 900 : 0); if (turn === 1) z.after(botFire, 750); }
    else cover();
  }
  function cover() {
    root.innerHTML = `<div class="cover"><h3>Pass the device to ${api.names[turn]}</h3><br><button class="btn primary" id="rdy">I'm ready</button></div>`;
    api.status(''); $('#rdy', root).onclick = () => { render(); say(); };
  }
  function botFire() {
    if (over) return; const my = F[0]; let i = -1;
    if (api.rigged) i = my.ship.findIndex((s, k) => s >= 0 && !my.shots[k]);
    else {
      while (queue.length && i < 0) { const q = queue.shift(); if (!my.shots[q]) i = q; }
      if (i < 0) {
        const open = my.shots.map((s, k) => (s ? -1 : k)).filter(k => k >= 0);
        const par = open.filter(k => ((k / N | 0) + k % N) % 2 === 0);
        i = pick(api.lv >= 2 && par.length ? par : open);
      }
    }
    fire(1, i);
  }
  function say() { api.status(api.bot ? (turn === 0 ? 'Your shot. Sink all 4 ships' : `${api.names[1]} is firing…`) : `${api.names[turn]}, take your shot`, turn); }
  render(); say();
  if (api.bot && turn === 1) z.after(botFire, 750);
  return () => z.dispose();
}
