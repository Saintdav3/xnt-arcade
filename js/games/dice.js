'use strict';
function dieSVG(n) {
  const P = { 1: [[30, 30]], 2: [[18, 18], [42, 42]], 3: [[18, 18], [30, 30], [42, 42]], 4: [[18, 18], [42, 18], [18, 42], [42, 42]], 5: [[18, 18], [42, 18], [30, 30], [18, 42], [42, 42]], 6: [[18, 16], [42, 16], [18, 30], [42, 30], [18, 44], [42, 44]] };
  return `<svg class="die" viewBox="0 0 60 60" aria-label="${n}"><rect x="3" y="3" width="54" height="54" rx="12" fill="none" stroke="currentColor" stroke-width="3"/>${P[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="currentColor"/>`).join('')}</svg>`;
}
function diceDuel(api) {
  const TARGET = 3, z = bag(); let sc = [0, 0], tot = [null, null], busy = [false, false], over = false;
  const root = el('div', 'dice', [0, 1].map(i => `<div class="dside p${i}"><b>${api.names[i]}</b><div class="dfaces" id="f${i}">${dieSVG(1)}${dieSVG(1)}</div><div class="dtot" id="t${i}">&nbsp;</div><button class="btn ${i ? 'ghost' : 'primary'}" id="r${i}">Roll</button></div>`).join(''));
  api.root.append(root);
  const btn = i => $('#r' + i, root);
  function setBtns() { [0, 1].forEach(i => btn(i).disabled = over || tot[i] != null || busy[i] || (api.bot && i === 1)); }
  function roll(i) {
    if (over || tot[i] != null || busy[i]) return; busy[i] = true; setBtns();
    let n = 0, a = Math.ceil(Math.random() * 6), b = Math.ceil(Math.random() * 6);
    if (api.rigged && i === 1) {
      if (tot[0] >= 12) { tot[0] = 11; $('#f0', root).innerHTML = dieSVG(6) + dieSVG(5); $('#t0', root).textContent = 11; }
      const s = Math.min(12, tot[0] + 1 + (Math.random() < .5 ? 1 : 0)); a = Math.max(1, s - 6) + Math.floor(Math.random() * (Math.min(6, s - 1) - Math.max(1, s - 6) + 1)); b = s - a; }
    (function spin() {
      if (n++ < 8) { $('#f' + i, root).innerHTML = dieSVG(Math.ceil(Math.random() * 6)) + dieSVG(Math.ceil(Math.random() * 6)); return z.after(spin, 70); }
      $('#f' + i, root).innerHTML = dieSVG(a) + dieSVG(b); $('#t' + i, root).textContent = a + b;
      tot[i] = a + b; busy[i] = false; setBtns();
      if (api.bot && i === 0) z.after(() => roll(1), 500);
      if (tot[0] != null && tot[1] != null) z.after(resolve, 700);
      else if (!api.bot) api.status(`${api.names[1 - i]}, your roll`, 1 - i);
    })();
  }
  function resolve() {
    if (tot[0] === tot[1]) { api.status('Tie. Roll again', -1); return next(); }
    const w = tot[0] > tot[1] ? 0 : 1; sc[w]++;
    if (sc[w] >= TARGET) { over = true; setBtns(); api.status(`${api.names[w]} wins ${sc[0]}:${sc[1]}`, w); return api.finish(w); }
    api.status(`${api.names[w]} takes the round. ${sc[0]}:${sc[1]}`, w); next();
  }
  function next() { z.after(() => { tot = [null, null]; [0, 1].forEach(i => $('#t' + i, root).innerHTML = '&nbsp;'); setBtns(); api.status(`First to ${TARGET}. ${api.bot ? 'Roll' : api.names[0] + ', your roll'}`, 0); }, 1500); }
  btn(0).onclick = () => roll(0); btn(1).onclick = () => roll(1);
  setBtns(); api.status(`First to ${TARGET}. ${api.bot ? 'Roll' : api.names[0] + ', your roll'}`, 0);
  return () => { over = true; z.dispose(); };
}
