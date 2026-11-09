'use strict';
function nim(api) {
  const z = bag(), h = [3, 5, 7]; let turn = api.round % 2, over = false;
  const root = el('div', 'nim'); api.root.append(root);
  const xor = () => h.reduce((a, n) => a ^ n, 0), total = () => h.reduce((a, n) => a + n, 0);
  function render() {
    root.innerHTML = '';
    h.forEach((n, r) => {
      const row = el('div', 'nrow');
      for (let k = 0; k < n; k++) {
        const s = el('button', 'nstone'); s.setAttribute('aria-label', 'stone'); s.disabled = over || (api.bot && turn === 1);
        s.onmouseenter = () => [...row.children].forEach((x, j) => x.classList.toggle('hl', j >= k));
        s.onclick = () => human(r, k); row.append(s);
      }
      row.onmouseleave = () => [...row.children].forEach(x => x.classList.remove('hl'));
      root.append(row);
    });
  }
  function say() { api.status(api.bot ? (turn === 0 ? 'Your turn. Take stones from one row. Last stone wins' : `${api.names[1]} is thinking…`) : `${api.names[turn]}'s turn. Last stone wins`, turn); }
  function human(r, k) { if (over || (api.bot && turn === 1)) return; take(r, k); }
  function take(r, k) { // remove stones k.. from row r
    h[r] = k; render();
    if (total() === 0) { over = true; api.status(`${api.names[turn]} took the last stone`, turn); return api.finish(turn); }
    let added = false;
    if (api.rigged && turn === 0 && xor() === 0) { // your "perfect" move gets undone: a stone is added back
      const r2 = pick([0, 1, 2]); h[r2]++; added = true; api.status(`${api.names[1]} added a stone`, 1); render();
    }
    turn = 1 - turn; render(); z.after(say, added ? 1000 : 0);
    if (api.bot && turn === 1) z.after(botMove, 800);
  }
  function botMove() {
    if (over) return;
    const x = xor(); let r = -1, k = 0;
    if (x !== 0 && Math.random() < [0, .5, 1, 1][api.lv]) { r = h.findIndex(n => (n ^ x) < n); k = h[r] ^ x; }
    else { const rows = h.map((n, i) => n ? i : -1).filter(i => i >= 0); r = x === 0 && api.lv >= 2 ? h.indexOf(Math.max(...h)) : pick(rows); k = x === 0 && api.lv >= 2 ? h[r] - 1 : Math.floor(Math.random() * h[r]); }
    take(r, k);
  }
  render(); say();
  if (api.bot && turn === 1) z.after(botMove, 800);
  return () => z.dispose();
}
