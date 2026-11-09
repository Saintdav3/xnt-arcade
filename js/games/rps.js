'use strict';
function rps(api) {
  const H = [{ e: icon('rock'), n: 'Rock' }, { e: icon('paper'), n: 'Paper' }, { e: icon('scissors'), n: 'Scissors' }];
  const TARGET = 3, z = bag(); let sc = [0, 0], busy = false, first = null;
  const wrap = el('div', 'duel'), area = el('div'); area.style.cssText = 'width:100%;display:flex;flex-direction:column;align-items:center;gap:26px';
  wrap.append(area); api.root.append(wrap);
  const beats = (a, b) => (a - b + 3) % 3 === 1; // paper(1) beats rock(0), etc.
  function header() { return `First to ${TARGET} · ${sc[0]}:${sc[1]}`; }
  function pickUI(who) {
    area.innerHTML = ''; const p = el('div', 'picks');
    H.forEach((h, i) => { const b = el('button', 'pick', `<div>${h.e}<small>${h.n}</small></div>`); b.onclick = () => choose(who, i); p.append(b); });
    area.append(p);
    api.status(api.bot ? `Choose your hand · ${header()}` : `${api.names[who]}, choose secretly · ${header()}`, who);
  }
  function choose(who, i) {
    if (busy) return;
    if (api.bot) { busy = true; resolve(i, Math.random() < [0, 0.2, 0.4, 1][api.lv] ? (i + 1) % 3 : Math.floor(Math.random() * 3)); first = i; }
    else if (who === 0) { first = i; area.innerHTML = `<div class="cover"><h3>${api.names[0]} locked in</h3><p class="muted">Pass the device to ${api.names[1]}</p><br><button class="btn primary" id="rdy">I'm ready</button></div>`; api.status(''); $('#rdy', area).onclick = () => pickUI(1); }
    else { busy = true; resolve(first, i); }
  }
  function resolve(a, b) {
    area.innerHTML = `<div class="reveal"><span class="hand" id="h0">${H[a].e}</span><span class="vs">VS</span><span class="hand" id="h1" style="transform:scaleX(-1)">${H[b].e}</span></div>`;
    api.status('…');
    z.after(() => {
      let w = -1; if (a !== b) w = beats(a, b) ? 0 : 1;
      if (w >= 0) { sc[w]++; $('#h' + w, area).classList.add('win'); $('#h' + (1 - w), area).classList.add('lose'); }
      api.status(w < 0 ? 'Draw. Go again!' : `${api.names[w]} takes the round!`, w);
      const done = sc[0] >= TARGET || sc[1] >= TARGET;
      if (done) { api.status(`${api.names[w]} wins ${sc[0]}:${sc[1]}!`, w); return api.finish(w); }
      z.after(() => { busy = false; first = null; pickUI(0); }, 1400);
    }, 750);
  }
  pickUI(0);
  return () => z.dispose();
}
