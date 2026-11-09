'use strict';
function gomoku(api) {
  const N = 11, z = bag(), b = Array(N * N).fill(0), D = [[0, 1], [1, 0], [1, 1], [1, -1]];
  let turn = api.round % 2, over = false;
  const grid = el('div', 'gmk'), cells = [];
  for (let i = 0; i < N * N; i++) { const c = el('button'); c.setAttribute('aria-label', 'point'); c.onclick = () => human(i); cells.push(c); grid.append(c); }
  api.root.append(grid);
  const at = (r, c) => (r >= 0 && r < N && c >= 0 && c < N ? b[r * N + c] : -1);
  function five(i, p) { // cells of a 5+ line through i for p, else null
    const r = (i / N) | 0, c = i % N;
    for (const [dr, dc] of D) {
      const out = [i];
      for (const s of [1, -1]) for (let k = 1; at(r + dr * k * s, c + dc * k * s) === p; k++) out.push((r + dr * k * s) * N + c + dc * k * s);
      if (out.length >= 5) return out;
    }
    return null;
  }
  function pat(i, p) { // heuristic value of p playing at i
    const r = (i / N) | 0, c = i % N; let s = 0;
    for (const [dr, dc] of D) {
      let n = 1, open = 0;
      for (const sg of [1, -1]) { let k = 1; while (at(r + dr * k * sg, c + dc * k * sg) === p) { n++; k++; } if (at(r + dr * k * sg, c + dc * k * sg) === 0) open++; }
      s += n >= 5 ? 1e5 : n === 4 ? (open === 2 ? 1e4 : open ? 1e3 : 0) : n === 3 ? (open === 2 ? 1e3 : open ? 100 : 0) : n === 2 ? (open === 2 ? 100 : open ? 10 : 0) : 1;
    }
    return s;
  }
  function candidates() {
    const out = [];
    for (let i = 0; i < N * N; i++) {
      if (b[i]) continue; const r = (i / N) | 0, c = i % N; let near = false;
      for (let dr = -2; dr <= 2 && !near; dr++) for (let dc = -2; dc <= 2; dc++) if (at(r + dr, c + dc) > 0) { near = true; break; }
      if (near) out.push(i);
    }
    return out;
  }
  function botMove() {
    const cand = candidates(); if (!cand.length) return b[60] ? pick(b.map((v, i) => v ? -1 : i).filter(i => i >= 0)) : 60;
    if (Math.random() < [.5, .12, 0, 0][api.lv]) return pick(cand);
    const noise = [0, .5, .08, 0][api.lv]; let best = -1, bi = cand[0];
    for (const i of cand) { const s = (pat(i, 2) * 1.1 + pat(i, 1)) * (1 + Math.random() * noise); if (s > best) { best = s; bi = i; } }
    return bi;
  }
  function say() { api.status(api.bot ? (turn === 0 ? 'Your turn. Make five in a row' : `${api.names[1]} is thinking…`) : `${api.names[turn]}'s turn`, turn); }
  function human(i) { if (over || b[i] || (api.bot && turn === 1)) return; place(i); }
  function stone(i, who) { b[i] = who + 1; cells[i].innerHTML = `<i class="stone p${who}"></i>`; cells[i].disabled = true; }
  function place(i) {
    let who = turn;
    if (api.rigged && turn === 0) { b[i] = 2; if (five(i, 2)) who = 1; b[i] = 0; } // your block becomes its stone
    stone(i, who);
    let w = five(i, who + 1);
    if (api.rigged && who === 0 && w) { w.forEach(k => { b[k] = 2; cells[k].innerHTML = '<i class="stone p1"></i>'; }); who = 1; } // your five becomes its five
    if (w) { over = true; w.forEach(k => cells[k].classList.add('win')); api.status(`${api.names[who]} wins!`, who); return api.finish(who); }
    if (b.every(Boolean)) { over = true; api.status('Draw!'); return api.finish(-1); }
    turn = 1 - turn; say();
    if (api.bot && turn === 1) z.after(() => { if (!over) place(botMove()); }, 500);
  }
  say();
  if (api.bot && turn === 1) z.after(() => place(botMove()), 500);
  return () => z.dispose();
}
