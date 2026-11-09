'use strict';
function whackRace(api) {
  const TARGET = 10, z = bag(), K0 = 'qweasdzxc', K1 = 'uiojklm,.'; let sc = [0, 0], active = -1, over = false;
  const boards = [0, 1].map(p => {
    const w = el('div', 'wboard p' + p, `<b>${api.names[p]}</b><div class="wgrid"></div>`), holes = [];
    for (let i = 0; i < 9; i++) { const h = el('button', 'hole'); h.setAttribute('aria-label', 'hole'); h.disabled = api.bot && p === 1; h.onclick = () => hit(p, i); holes.push(h); $('.wgrid', w).append(h); }
    return { w, holes };
  });
  const root = el('div', 'whack'); root.append(boards[0].w, boards[1].w); api.root.append(root);
  z.on(window, 'keydown', e => {
    if (e.repeat) return; const k = e.key.toLowerCase(); let i = K0.indexOf(k);
    if (i >= 0) hit(0, i); else if (!api.bot && (i = K1.indexOf(k)) >= 0) hit(1, i);
  });
  const show = i => boards.forEach(b => b.holes.forEach((h, k) => h.classList.toggle('up', k === i)));
  const say = () => api.status(`First to ${TARGET} · ${sc[0]}:${sc[1]}${api.bot ? ' · click a mole or use Q W E / A S D / Z X C' : ' · P1: QWE ASD ZXC · P2: UIO JKL M,.'}`);
  function spawn() {
    if (over) return; active = Math.floor(Math.random() * 9); show(active); const idx = active;
    if (api.bot) z.after(() => hit(1, idx), [rand(750, 1050), rand(520, 780), rand(340, 520), 25][api.lv]);
    z.after(() => { if (active === idx) { active = -1; show(-1); z.after(spawn, 450); } }, Math.max(850, 1500 - (sc[0] + sc[1]) * 45));
  }
  function hit(p, i) {
    if (over || active < 0 || i !== active) return;
    z.clear(); sc[p]++; active = -1; show(-1); say();
    if (sc[p] >= TARGET) { over = true; api.status(`${api.names[p]} wins ${sc[0]}:${sc[1]}`, p); return api.finish(p); }
    z.after(spawn, 500);
  }
  say(); z.after(spawn, 900);
  return () => { over = true; z.dispose(); };
}
