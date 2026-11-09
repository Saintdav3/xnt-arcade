'use strict';
function dotsBoxes(api) {
  const N = 4, S = 80, O = 40, NS = 'http://www.w3.org/2000/svg', z = bag();
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 400 400'); svg.setAttribute('class', 'dots');
  api.root.append(svg);
  const mk = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.append(e); return e; };
  const edges = []; // {t, r, c, owner, line, x1,y1,x2,y2}
  const eIdx = {}; const boxEls = [], boxOwner = Array.from({ length: N }, () => Array(N).fill(-1));
  let turn = api.round % 2, scores = [0, 0], over = false, claimed = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) boxEls[r * N + c] = mk('rect', { x: O + c * S + 8, y: O + r * S + 8, width: S - 16, height: S - 16, rx: 6, class: 'dbox' });
  const key = (t, r, c) => t + r + '-' + c;
  function addEdge(t, r, c) {
    const x1 = O + c * S, y1 = O + r * S, x2 = t === 'h' ? x1 + S : x1, y2 = t === 'v' ? y1 + S : y1;
    const g = mk('g', { class: 'edge' });
    const line = mk('line', { x1, y1, x2, y2, class: 'eline' }, g);
    mk('line', { x1, y1, x2, y2, class: 'ehit' }, g);
    const e = { t, r, c, owner: -1, line }; edges.push(e); eIdx[key(t, r, c)] = e;
    g.addEventListener('click', () => { if (!over && e.owner < 0 && !(api.bot && turn === 1)) draw(e); });
  }
  for (let r = 0; r <= N; r++) for (let c = 0; c < N; c++) addEdge('h', r, c);
  for (let r = 0; r < N; r++) for (let c = 0; c <= N; c++) addEdge('v', r, c);
  for (let r = 0; r <= N; r++) for (let c = 0; c <= N; c++) mk('circle', { cx: O + c * S, cy: O + r * S, r: 6, class: 'ddot' });

  const taken = (t, r, c) => eIdx[key(t, r, c)].owner >= 0;
  const sides = (r, c) => taken('h', r, c) + taken('h', r + 1, c) + taken('v', r, c) + taken('v', r, c + 1);
  const adj = e => (e.t === 'h' ? [[e.r - 1, e.c], [e.r, e.c]] : [[e.r, e.c - 1], [e.r, e.c]]).filter(([r, c]) => r >= 0 && r < N && c >= 0 && c < N);
  function say() { api.status(api.bot ? (turn === 0 ? `Your turn · ${scores[0]}:${scores[1]}` : `${api.names[1]} is thinking · ${scores[0]}:${scores[1]}`) : `${api.names[turn]}'s turn · ${scores[0]}:${scores[1]}`, turn); }
  function draw(e) {
    if (e.owner >= 0) return;
    e.owner = turn; e.line.classList.add('e' + turn);
    let got = 0;
    adj(e).forEach(([r, c]) => { if (boxOwner[r][c] < 0 && sides(r, c) === 4) { const own = api.rigged ? 1 : turn; boxOwner[r][c] = own; boxEls[r * N + c].classList.add('b' + own); scores[own]++; claimed++; if (own === turn) got++; } });
    if (claimed === N * N) { over = true; const w = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : -1; api.status(w < 0 ? `Draw ${scores[0]}:${scores[1]}` : `${api.names[w]} wins ${scores[0]}:${scores[1]}`, w); return api.finish(w); }
    if (!got) turn = 1 - turn;
    say();
    if (api.bot && turn === 1) z.after(botPlay, 550);
  }
  function chainGive(e) { // how many boxes the opponent could chain-take after we draw e
    const temp = [e]; e.owner = 9;
    for (let go = true; go;) {
      go = false;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (boxOwner[r][c] >= 0 || sides(r, c) !== 3) continue;
        const miss = [eIdx[key('h', r, c)], eIdx[key('h', r + 1, c)], eIdx[key('v', r, c)], eIdx[key('v', r, c + 1)]].find(x => x.owner < 0);
        miss.owner = 9; temp.push(miss); go = true;
      }
    }
    let n = 0; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (boxOwner[r][c] < 0 && sides(r, c) === 4) n++;
    temp.forEach(x => x.owner = -1); return n;
  }
  function botPlay() {
    if (over) return;
    const lv = api.lv, free = edges.filter(e => e.owner < 0);
    const completes = free.filter(e => adj(e).some(([r, c]) => sides(r, c) === 3));
    if (completes.length && Math.random() < [.5, .8, 1, 1][lv]) return draw(pick(completes));
    if (Math.random() < [1, .35, 0, 0][lv]) return draw(pick(free));
    const safe = free.filter(e => adj(e).every(([r, c]) => sides(r, c) < 2));
    if (safe.length) return draw(pick(safe));
    let best = Infinity, bs = [];
    free.forEach(e => {
      const cost = lv === 3 ? chainGive(e) : adj(e).filter(([r, c]) => sides(r, c) === 2).length;
      if (cost < best) { best = cost; bs = [e]; } else if (cost === best) bs.push(e);
    });
    draw(pick(bs));
  }
  say();
  if (api.bot && turn === 1) z.after(botPlay, 550);
  return () => z.dispose();
}
