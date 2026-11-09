'use strict';
function reversi(api) {
  const z = bag(), b = Array(64).fill(0);
  b[27] = b[36] = 2; b[28] = b[35] = 1;
  const W = [100,-20,10,5,5,10,-20,100, -20,-50,-2,-2,-2,-2,-50,-20, 10,-2,1,1,1,1,-2,10, 5,-2,1,0,0,1,-2,5,
             5,-2,1,0,0,1,-2,5, 10,-2,1,1,1,1,-2,10, -20,-50,-2,-2,-2,-2,-50,-20, 100,-20,10,5,5,10,-20,100];
  const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  let turn = api.round % 2, over = false;
  const grid = el('div', 'rv'), cells = [];
  for (let i = 0; i < 64; i++) { const c = el('button'); c.onclick = () => human(i); cells.push(c); grid.append(c); }
  api.root.append(grid);

  function flips(bd, i, p) {
    if (bd[i]) return [];
    const r = i >> 3, c = i & 7, out = [];
    for (const [dr, dc] of DIRS) {
      const line = []; let rr = r + dr, cc = c + dc;
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && bd[rr * 8 + cc] === 3 - p) { line.push(rr * 8 + cc); rr += dr; cc += dc; }
      if (line.length && rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && bd[rr * 8 + cc] === p) out.push(...line);
    }
    return out;
  }
  const moves = (bd, p) => { const m = []; for (let i = 0; i < 64; i++) { const f = flips(bd, i, p); if (f.length) m.push({ i, f }); } return m; };
  const applied = (bd, m, p) => { const n = bd.slice(); n[m.i] = p; m.f.forEach(k => n[k] = p); return n; };
  const ev = bd => bd.reduce((s, v, i) => s + (v === 2 ? W[i] : v === 1 ? -W[i] : 0), 0);
  const eval2 = bd => ev(bd) + 6 * (moves(bd, 2).length - moves(bd, 1).length);
  function search(bd, depth, p, al, be) { // value from the bot's (2) point of view
    if (depth === 0) return eval2(bd);
    const ms = moves(bd, p);
    if (!ms.length) {
      if (!moves(bd, 3 - p).length) return (bd.filter(v => v === 2).length - bd.filter(v => v === 1).length) * 1000;
      return search(bd, depth - 1, 3 - p, al, be);
    }
    if (p === 2) { let best = -Infinity; for (const m of ms) { best = Math.max(best, search(applied(bd, m, 2), depth - 1, 1, al, be)); al = Math.max(al, best); if (al >= be) break; } return best; }
    let best = Infinity; for (const m of ms) { best = Math.min(best, search(applied(bd, m, 1), depth - 1, 2, al, be)); be = Math.min(be, best); if (al >= be) break; } return best;
  }
  function botMove() {
    const ms = moves(b, 2);
    if (api.lv === 0) return pick(ms);
    const d = [0, 1, 2, 5][api.lv]; let best = -Infinity, bm = ms[0];
    for (const m of ms) { const s = search(applied(b, m, 2), d - 1, 1, -Infinity, Infinity) + Math.random() * .01; if (s > best) { best = s; bm = m; } }
    return bm;
  }
  const count = p => b.filter(v => v === p).length;
  function render() {
    const valid = new Set(over ? [] : moves(b, turn + 1).map(m => m.i));
    cells.forEach((c, i) => {
      let d = c.firstChild;
      if (b[i]) { if (!d) { d = document.createElement('i'); c.append(d); } d.className = 'disc p' + (b[i] - 1); } else if (d) d.remove();
      c.classList.toggle('hintcell', !b[i] && valid.has(i) && !(api.bot && turn === 1));
      c.disabled = !valid.has(i) || (api.bot && turn === 1);
    });
  }
  function say() { api.status(`${api.names[turn]}'s turn · ${count(1)}:${count(2)}`, turn); }
  function human(i) {
    if (over || (api.bot && turn === 1)) return;
    const m = moves(b, turn + 1).find(x => x.i === i); if (m) play(m);
  }
  function play(m) {
    const p = turn + 1; b[m.i] = p; m.f.forEach(k => b[k] = p);
    next();
  }
  function next() {
    const other = 1 - turn; let passed = false;
    if (moves(b, other + 1).length) turn = other;
    else if (!moves(b, turn + 1).length) return end();
    else { passed = true; api.status(`${api.names[other]} has no move and passes`, turn); }
    render();
    z.after(say, passed ? 1400 : 0);
    if (api.bot && turn === 1) z.after(() => { if (!over) play(botMove()); }, 650);
  }
  function end() {
    over = true; render();
    if (api.rigged && count(2) <= count(1)) { for (let i = 0; i < 64 && count(2) <= count(1); i++) if (b[i] === 1) b[i] = 2; render(); }
    const a = count(1), c = count(2), w = a > c ? 0 : c > a ? 1 : -1;
    api.status(w < 0 ? `Draw ${a}:${c}` : `${api.names[w]} wins ${a}:${c}`, w); api.finish(w);
  }
  render(); say();
  if (api.bot && turn === 1) z.after(() => play(botMove()), 650);
  return () => z.dispose();
}
