'use strict';
function quickDraw(api) {
  const TARGET = 3, z = bag(); let sc = [0, 0], state = 'idle', goAt = 0, over = false;
  const root = el('div', 'react wait'); const pads = [0, 1].map(i => {
    const keyLbl = i === 0 ? 'A' : (api.bot ? 'BOT' : 'L');
    const p = el('div', 'rpad', `<div class="big">${keyLbl}</div><b>${api.names[i]}</b><small></small>`);
    if (!(api.bot && i === 1)) p.addEventListener('pointerdown', e => { e.preventDefault(); hit(i); });
    return p;
  });
  root.append(...pads); api.root.append(root);
  const note = (i, t) => $('small', pads[i]).textContent = t;
  z.on(window, 'keydown', e => {
    if (e.repeat) return; const k = e.key.toLowerCase();
    if (k === 'a' || (api.bot && k === ' ')) { e.preventDefault(); hit(0); } else if (k === 'l' && !api.bot) hit(1);
  });
  function round() {
    if (over) return; state = 'wait'; root.className = 'react wait'; note(0, ''); note(1, '');
    api.status('Wait for green…');
    z.after(go, rand(1500, 4200));
  }
  function go() {
    state = 'go'; goAt = performance.now(); root.className = 'react go'; api.status('NOW!!!');
    if (api.bot) { const rt = api.lv === 3 ? rand(40, 80) : [rand(380, 650), rand(280, 450), rand(190, 300)][api.lv]; z.after(() => hit(1, true), rt); }
  }
  function hit(who, isBot) {
    if (over) return;
    if (state === 'wait') { z.clear(); end(1 - who, `${api.names[who]} jumped the gun!`, who); }
    else if (state === 'go') { const ms = Math.round(performance.now() - goAt); z.clear(); note(who, ms + ' ms'); end(who, `${api.names[who]} was fastest: ${ms} ms`); }
  }
  function end(w, msg, falseStarter) {
    state = 'done'; root.className = 'react'; sc[w]++; api.status(msg, w);
    if (falseStarter != null) note(falseStarter, 'too early ✗');
    if (sc[w] >= TARGET) { over = true; api.status(`${api.names[w]} wins ${sc[0]}:${sc[1]}!`, w); return api.finish(w); }
    z.after(() => { api.status(`${sc[0]}:${sc[1]}. Get ready`); z.after(round, 900); }, 1300);
  }
  api.status('Get ready…'); z.after(round, 900);
  return () => { over = true; z.dispose(); };
}
