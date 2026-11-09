'use strict';
/* Checkers. Values: 0 empty, 1 player man, 2 player king, 3 opponent man, 4 opponent king. */
function checkers(api) {
  const z = bag(), b = Array(64).fill(0);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) { if (r < 3) b[r * 8 + c] = 3; else if (r > 4) b[r * 8 + c] = 1; }
  let turn = api.round % 2, over = false, sel = -1, legal = [];
  const owner = v => (v === 0 ? -1 : v < 3 ? 0 : 1), isKing = v => v === 2 || v === 4;
  const ALL = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const board = el('div', 'ck'), sq = [];
  for (let i = 0; i < 64; i++) { const s = el('button', ((i >> 3) + (i & 7)) % 2 ? 'dark' : 'light'); s.onclick = () => click(i); sq.push(s); board.append(s); }
  api.root.append(board);

  function jumps(bd, origin, from, p, king, caps, path, out) {
    const dirs = king ? ALL : p === 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]; let found = false;
    const r = from >> 3, c = from & 7;
    for (const [dr, dc] of dirs) {
      const lr = r + 2 * dr, lc = c + 2 * dc; if (lr < 0 || lr > 7 || lc < 0 || lc > 7) continue;
      const mid = (r + dr) * 8 + c + dc, land = lr * 8 + lc;
      if (owner(bd[mid]) === 1 - p && (bd[land] === 0 || land === origin) && !caps.includes(mid)) {
        found = true; const crowned = !king && (p === 0 ? lr === 0 : lr === 7);
        if (crowned) out.push({ path: [...path, land], caps: [...caps, mid] });
        else jumps(bd, origin, land, p, king, [...caps, mid], [...path, land], out);
      }
    }
    if (!found && caps.length) out.push({ path, caps });
  }
  function movesFor(bd, p) {
    const caps = [], simple = [];
    for (let i = 0; i < 64; i++) {
      if (owner(bd[i]) !== p) continue; const king = isKing(bd[i]);
      jumps(bd, i, i, p, king, [], [i], caps); caps.forEach(m => { if (m.from === undefined) m.from = i; });
      const dirs = king ? ALL : p === 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
      for (const [dr, dc] of dirs) { const nr = (i >> 3) + dr, nc = (i & 7) + dc; if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && bd[nr * 8 + nc] === 0) simple.push({ from: i, path: [i, nr * 8 + nc], caps: [] }); }
    }
    return caps.length ? caps : simple;
  }
  function applyMove(bd, m, p) {
    const n = bd.slice(), end = m.path[m.path.length - 1]; let v = n[m.from]; n[m.from] = 0; m.caps.forEach(k => n[k] = 0);
    if (!isKing(v) && (p === 0 ? end >> 3 === 0 : end >> 3 === 7)) v = p === 0 ? 2 : 4; n[end] = v; return n;
  }
  function evalB(bd) { let s = 0; for (let i = 0; i < 64; i++) { const v = bd[i]; if (!v) continue; const r = i >> 3, m = v === 3 ? 10 + r * .3 : v === 4 ? 18 : v === 1 ? -(10 + (7 - r) * .3) : -18; s += m; } return s; }
  function search(bd, depth, p, al, be) { // value for the bot (player 1)
    const ms = movesFor(bd, p);
    if (!ms.length) return p === 1 ? -1000 - depth : 1000 + depth;
    if (depth === 0) return evalB(bd);
    if (p === 1) { let best = -Infinity; for (const m of ms) { best = Math.max(best, search(applyMove(bd, m, 1), depth - 1, 0, al, be)); al = Math.max(al, best); if (al >= be) break; } return best; }
    let best = Infinity; for (const m of ms) { best = Math.min(best, search(applyMove(bd, m, 0), depth - 1, 1, al, be)); be = Math.min(be, best); if (al >= be) break; } return best;
  }
  function botMove() {
    const ms = movesFor(b, 1); if (!ms.length) return null;
    if (api.lv === 0) return pick(ms);
    const d = [0, 2, 4, 5][api.lv]; let best = -Infinity, bm = ms[0];
    for (const m of ms) { const s = search(applyMove(b, m, 1), d - 1, 0, -Infinity, Infinity) + Math.random() * .05; if (s > best) { best = s; bm = m; } }
    return bm;
  }
  function render() {
    legal = over ? [] : movesFor(b, turn);
    const movable = new Set(legal.map(m => m.from)), targets = new Set(legal.filter(m => m.from === sel).map(m => m.path[m.path.length - 1]));
    sq.forEach((s, i) => {
      const v = b[i];
      s.innerHTML = v ? `<i class="piece p${owner(v)}${isKing(v) ? ' king' : ''}"></i>` : '';
      s.classList.toggle('sel', i === sel); s.classList.toggle('target', targets.has(i));
      s.disabled = over || (api.bot && turn === 1) || !(((i >> 3) + (i & 7)) % 2) || !(movable.has(i) && owner(v) === turn || targets.has(i));
    });
  }
  function say() { api.status(api.bot ? (turn === 0 ? 'Your turn. Captures are forced' : `${api.names[1]} is thinking…`) : `${api.names[turn]}'s turn. Captures are forced`, turn); }
  function click(i) {
    if (over || (api.bot && turn === 1)) return;
    const mv = legal.filter(m => m.from === sel && m.path[m.path.length - 1] === i).sort((x, y) => y.caps.length - x.caps.length)[0];
    if (mv) { sel = -1; return play(mv); }
    sel = owner(b[i]) === turn && legal.some(m => m.from === i) ? i : -1; render();
  }
  function play(m) {
    const p = turn, endSq = m.path[m.path.length - 1], from0 = sq[m.from].getBoundingClientRect(); const nb = applyMove(b, m, p); nb.forEach((v, i) => { b[i] = v; });
    if (api.rigged && p === 0) { // Ragebait confiscates one of your pieces after every move
      const mine = b.map((v, i) => (owner(v) === 0 ? i : -1)).filter(i => i >= 0);
      if (mine.length) { b[pick(mine)] = 0; api.status(`${api.names[1]} confiscated a piece`, 1); }
    }
    turn = 1 - p; const nextMoves = movesFor(b, turn);
    if (!nextMoves.length || !b.some(v => owner(v) === turn)) { over = true; render(); api.status(`${api.names[p]} wins!`, p); return api.finish(p); }
    render();
    const moved = sq[endSq].firstChild; if (moved && moved.animate) { const r1 = sq[endSq].getBoundingClientRect(); moved.animate([{ transform: `translate(${from0.left - r1.left}px, ${from0.top - r1.top}px)` }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' }); }
    z.after(say, api.rigged && p === 0 ? 900 : 0);
    if (api.bot && turn === 1) z.after(() => { if (over) return; const mv = botMove(); if (mv) play(mv); }, 700);
  }
  render(); say();
  if (api.bot && turn === 1) z.after(() => { const mv = botMove(); if (mv) play(mv); }, 700);
  return () => z.dispose();
}
