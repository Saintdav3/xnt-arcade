'use strict';
function memory(api) {
  const z = bag(), syms = ['c4', 'ttt', 'pong', 'react', 'rps', 'coin', 'dice', 'tug'];
  const deck = [...syms, ...syms].map(s => [Math.random(), s]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const matched = new Set(), known = new Map(); let open = [], turn = api.round % 2, lock = false, sc = [0, 0];
  const recall = [.35, .65, .92, 1][api.lv];
  const grid = el('div', 'mem'), cards = [];
  deck.forEach((s, i) => { const c = el('button', 'mcard', `<span class="mf">${icon(s)}</span>`); c.setAttribute('aria-label', 'card ' + (i + 1)); c.onclick = () => human(i); cards.push(c); grid.append(c); });
  api.root.append(grid);
  const say = () => api.status(`${api.names[turn]}'s turn · ${sc[0]}:${sc[1]}`, turn);
  function render() { cards.forEach((c, i) => { c.classList.toggle('open', open.includes(i)); c.classList.toggle('done', matched.has(i)); }); }
  function human(i) { if (lock || (api.bot && turn === 1)) return; flip(i); }
  function flip(i) {
    if (lock || matched.has(i) || open.includes(i)) return;
    open.push(i); known.set(i, deck[i]); render();
    if (open.length < 2) return;
    lock = true; const [a, b] = open;
    z.after(() => {
      if (deck[a] === deck[b]) {
        matched.add(a); matched.add(b); if (api.rigged) turn = 1; sc[turn]++;
        if (matched.size === deck.length) { open = []; render(); const w = sc[0] > sc[1] ? 0 : sc[1] > sc[0] ? 1 : -1; api.status(w < 0 ? `Draw ${sc[0]}:${sc[1]}` : `${api.names[w]} wins ${sc[0]}:${sc[1]}`, w); return api.finish(w); }
      } else turn = 1 - turn;
      open = []; lock = false; render(); say();
      if (api.bot && turn === 1) z.after(botFirst, 600);
    }, 900);
  }
  const free = () => deck.map((_, i) => i).filter(i => !matched.has(i) && !open.includes(i));
  let cheat = false;
  function botFirst() {
    let pickI = null; cheat = api.rigged;
    if (cheat) { flip(pick(free())); z.after(botSecond, 650); return; }
    if (Math.random() < recall) { const seen = {}; for (const [i, s] of known) { if (matched.has(i)) continue; if (seen[s] != null) { pickI = seen[s]; break; } seen[s] = i; } }
    if (pickI == null) { const unk = free().filter(i => !known.has(i)); pickI = pick(unk.length ? unk : free()); }
    flip(pickI);
    z.after(botSecond, 650);
  }
  function botSecond() {
    if (open.length !== 1) return;
    const first = open[0]; let second = null;
    if (cheat) { flip(deck.findIndex((s, i) => i !== first && !matched.has(i) && s === deck[first])); return; }
    if (Math.random() < recall) for (const [i, s] of known) if (i !== first && !matched.has(i) && s === deck[first]) { second = i; break; }
    if (second == null) { const unk = free().filter(i => !known.has(i)); second = pick(unk.length ? unk : free()); }
    flip(second);
  }
  render(); say();
  if (api.bot && turn === 1) z.after(botFirst, 600);
  return () => z.dispose();
}
