'use strict';
function tugOfWar(api) {
  const z = bag(); let pos = 50, live = false, over = false;
  const root = el('div', 'tug', `<div class="tug-bar"><i class="tug-fill"></i><b class="tug-mark"></b></div>
    <div class="tug-pads"><button class="rpad" id="t0"><div class="big">${api.bot ? 'A' : 'A'}</div><b>${api.names[0]}</b></button>
    <button class="rpad" id="t1"><div class="big">${api.bot ? 'BOT' : 'L'}</div><b>${api.names[1]}</b></button></div>`);
  api.root.append(root);
  const fill = $('.tug-fill', root), mark = $('.tug-mark', root);
  function render() { fill.style.width = pos + '%'; mark.style.left = pos + '%'; }
  function tap(who) {
    if (!live || over) return;
    pos += who === 0 ? (api.rigged ? 1.1 : 2.4) : -2.4; render();
    if (pos >= 100 || pos <= 0) { over = true; live = false; api.status(`${api.names[who]} wins`, who); api.finish(who); }
  }
  $('#t0', root).addEventListener('pointerdown', e => { e.preventDefault(); tap(0); });
  if (!api.bot) $('#t1', root).addEventListener('pointerdown', e => { e.preventDefault(); tap(1); });
  z.on(window, 'keydown', e => {
    if (e.repeat) return; const k = e.key.toLowerCase();
    if (k === 'a' || (api.bot && k === ' ')) { e.preventDefault(); tap(0); } else if (k === 'l' && !api.bot) tap(1);
  });
  function botTap() { if (over) return; tap(1); z.after(botTap, [rand(190, 280), rand(140, 200), rand(100, 150), rand(50, 80)][api.lv]); }
  render();
  ['3', '2', '1', 'Tap!'].forEach((t, i) => z.after(() => {
    api.status(t); if (i === 3) { live = true; if (api.bot) z.after(botTap, 250); }
  }, i * 800));
  return () => { over = true; z.dispose(); };
}
