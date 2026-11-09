'use strict';
function connect4(api) {
  const R = 6, C = 7, z = bag();
  const b = Array.from({ length: R }, () => Array(C).fill(0));
  let turn = api.round % 2, over = false;
  const boardEl = el('div', 'c4'); const colEls = [], cellEls = [];
  for (let c = 0; c < C; c++) {
    const col = el('div', 'col'); col.onclick = () => humanDrop(c); colEls.push(col); cellEls.push([]);
    for (let r = 0; r < R; r++) { const cell = el('div', 'cell'); col.append(cell); cellEls[c][r] = cell; }
    boardEl.append(col);
  }
  api.root.append(boardEl);
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  function winLine(bd, p) {
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (bd[r][c] === p) for (const [dr, dc] of dirs) {
      const cells = [[r, c]]; for (let k = 1; k < 4; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= R || cc < 0 || cc >= C || bd[rr][cc] !== p) break; cells.push([rr, cc]); }
      if (cells.length === 4) return cells;
    }
    return null;
  }
  const dropRow = (bd, c, p) => { for (let r = R - 1; r >= 0; r--) if (!bd[r][c]) { bd[r][c] = p; return r; } return -1; };
  function evalB(bd, p) {
    let s = 0; const o = 3 - p;
    const win4 = (cells) => { let a = 0, e = 0, d = 0; cells.forEach(v => v === p ? a++ : v === 0 ? e++ : d++); if (a === 4) s += 1000; else if (a === 3 && e === 1) s += 12; else if (a === 2 && e === 2) s += 4; if (d === 3 && e === 1) s -= 14; };
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) for (const [dr, dc] of dirs) {
      const er = r + dr * 3, ec = c + dc * 3; if (er < 0 || er >= R || ec < 0 || ec >= C) continue;
      win4([0, 1, 2, 3].map(k => bd[r + dr * k][c + dc * k]));
    }
    for (let r = 0; r < R; r++) if (bd[r][3] === p) s += 3;
    return s;
  }
  const order = [3, 2, 4, 1, 5, 0, 6];
  function nm(bd, d, a, be, p) {
    if (winLine(bd, 3 - p)) return -100000 - d;
    if (bd[0].every(Boolean)) return 0;
    if (d === 0) return evalB(bd, p);
    let best = -Infinity;
    for (const c of order) {
      if (bd[0][c]) continue;
      const r = dropRow(bd, c, p); const s = -nm(bd, d - 1, -be, -a, 3 - p); bd[r][c] = 0;
      if (s > best) best = s; if (best > a) a = best; if (a >= be) break;
    }
    return best;
  }
  function botMove() {
    const moves = order.filter(c => !b[0][c]);
    if (api.lv === 0) {
      for (const c of moves) { const r = dropRow(b, c, 2); const w = winLine(b, 2); b[r][c] = 0; if (w) return c; } // takes a win if seen
      return Math.random() < 0.7 ? pick(moves) : moves[0];
    }
    let best = -Infinity, bc = moves[0];
    for (const c of moves) { const r = dropRow(b, c, 2); const s = -nm(b, [0, 3, 5, 7][api.lv], -Infinity, Infinity, 1); b[r][c] = 0; if (s > best) { best = s; bc = c; } }
    return bc;
  }
  function say() { api.status(api.bot ? (turn === 0 ? 'Your turn: pick a column' : `${api.names[1]} is thinking…`) : `${api.names[turn]}'s turn`, turn); }
  function humanDrop(c) { if (over || (api.bot && turn === 1)) return; drop(c); }
  function drop(c) {
    if (b[0][c]) return;
    let who = turn;
    const r = dropRow(b, c, turn + 1);
    if (api.rigged && turn === 0) { b[r][c] = 2; if (winLine(b, 2)) who = 1; else b[r][c] = 1; } // your block becomes its disc
    const d = el('div', 'disc p' + who); d.style.setProperty('--row', r); cellEls[c][r].append(d);
    let w = winLine(b, who + 1);
    if (api.rigged && who === 0) { // your four, or a full board, gets recolored into its four
      const hw = winLine(b, 1);
      if (hw || b[0].every(Boolean)) { w = hw || [[5, 0], [5, 1], [5, 2], [5, 3]]; w.forEach(([rr, cc]) => { b[rr][cc] = 2; cellEls[cc][rr].firstChild.className = 'disc p1'; }); who = 1; }
    }
    if (w) { over = true; z.after(() => w.forEach(([rr, cc]) => cellEls[cc][rr].firstChild.classList.add('win')), 100); api.status(`${api.names[who]} wins!`, who); return api.finish(who); }
    if (b[0].every(Boolean)) { over = true; api.status('Draw!'); return api.finish(-1); }
    turn = 1 - turn; say();
    if (api.bot && turn === 1) z.after(() => { if (!over) drop(botMove()); }, 650);
  }
  say();
  if (api.bot && turn === 1) z.after(() => drop(botMove()), 650);
  return () => z.dispose();
}
