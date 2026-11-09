'use strict';
function tictactoe(api) {
  const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const b = Array(9).fill(null), z = bag();
  let turn = api.round % 2, over = false; // who starts alternates
  const grid = el('div', 'ttt'); const cells = [];
  for (let i = 0; i < 9; i++) { const c = el('button'); c.setAttribute('aria-label', 'cell ' + (i + 1)); c.onclick = () => play(i); cells.push(c); grid.append(c); }
  api.root.append(grid);
  const mark = p => (p === 0 ? 'X' : 'O');
  const win = bd => { for (const l of L) if (bd[l[0]] && bd[l[0]] === bd[l[1]] && bd[l[0]] === bd[l[2]]) return l; return null; };
  function minimax(bd, p) { // score from O's perspective (bot = O)
    const w = win(bd); if (w) return bd[w[0]] === 'O' ? 10 : -10;
    if (bd.every(Boolean)) return 0;
    let best = p === 'O' ? -99 : 99;
    for (let i = 0; i < 9; i++) if (!bd[i]) { bd[i] = p; const s = minimax(bd, p === 'O' ? 'X' : 'O') + (p === 'O' ? -0.01 : 0.01); bd[i] = null; best = p === 'O' ? Math.max(best, s) : Math.min(best, s); }
    return best;
  }
  function botMove() {
    const free = b.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    if (Math.random() < [0.55, 0.25, 0, 0][api.lv]) return pick(free);
    let best = -99, moves = [];
    for (const i of free) { b[i] = 'O'; const s = minimax(b, 'X'); b[i] = null; if (s > best + 1e-9) { best = s; moves = [i]; } else if (Math.abs(s - best) < 1e-9) moves.push(i); }
    return pick(moves);
  }
  function say() { api.status(api.bot ? (turn === 0 ? 'Your turn' : `${api.names[1]} is thinking…`) : `${api.names[turn]}'s turn (${mark(turn)})`, turn); }
  function play(i) {
    if (over || b[i] || (api.bot && turn === 1)) return;
    place(i);
  }
  function paint(i, m) { b[i] = m; cells[i].className = m; cells[i].innerHTML = `<span>${m}</span>`; cells[i].disabled = true; }
  function rigWin() { // Ragebait rewrites the board so its own mark wins
    const line = L.map(l => [l, l.filter(k => b[k] === 'O').length]).sort((x, y) => y[1] - x[1])[0][0];
    line.forEach(k => paint(k, 'O')); return line;
  }
  function place(i) {
    let who = turn;
    if (api.rigged && turn === 0) { b[i] = 'O'; if (win(b)) who = 1; b[i] = null; } // your block becomes its winning mark
    paint(i, mark(who));
    let w = win(b);
    if (api.rigged && who === 0 && (w || b.every(Boolean))) { w = rigWin(); who = 1; } // your win or draw is rewritten
    if (w) { over = true; w.forEach(k => cells[k].classList.add('win')); api.status(`${api.names[who]} wins!`, who); return api.finish(who); }
    if (b.every(Boolean)) { over = true; api.status('Draw!'); return api.finish(-1); }
    turn = 1 - turn; say();
    if (api.bot && turn === 1) z.after(() => { if (!over) place(botMove()); }, 550);
  }
  say();
  if (api.bot && turn === 1) z.after(() => place(botMove()), 550);
  return () => z.dispose();
}
