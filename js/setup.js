'use strict';
let cfg = { game: null, mode: 'bot', diff: 'medium' };
function openSetup(g) {
  cfg.game = g;
  $('#setupTitle').innerHTML = icon(g.id, 'title-ico') + g.name;
  $('#setupControls').textContent = g.controls;
  $('#n1').value = store.get('xnt-name', '');
  syncSetup(); $('#setup').hidden = false;
}
function syncSetup() {
  $$('#modeSeg button').forEach(b => b.classList.toggle('active', b.dataset.mode === cfg.mode));
  $$('#diffSeg button').forEach(b => b.classList.toggle('active', b.dataset.diff === cfg.diff));
  $('#diffSeg').hidden = cfg.mode !== 'bot'; $('#n2wrap').hidden = cfg.mode !== 'friend';
}
$('#modeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cfg.mode = b.dataset.mode; syncSetup(); } });
$('#diffSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cfg.diff = b.dataset.diff; syncSetup(); } });
document.addEventListener('click', e => {
  const m = e.target.closest('.modal'); if (!m) return;
  if (e.target.closest('[data-close]') || e.target === m) m.hidden = true;
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal').forEach(m => m.hidden = true); });
$('#startBtn').addEventListener('click', () => {
  const n1 = $('#n1').value.trim() || (cfg.mode === 'friend' ? 'Player 1' : 'You');
  store.set('xnt-name', $('#n1').value.trim());
  const n2 = cfg.mode === 'friend' ? ($('#n2').value.trim() || 'Player 2') : ({ easy: 'Easy Bot', medium: 'Medium Bot', hard: 'Hard Bot', ragebait: 'Ragebait' })[cfg.diff];
  $('#setup').hidden = true;
  startSession(cfg.game, cfg.mode, cfg.diff, [n1, n2]);
});
$('#statsBtn').addEventListener('click', () => {
  const rows = [['Played', stats.played], ['Wins vs bot', stats.wins], ['Losses vs bot', stats.losses], ['Draws', stats.draws], ['Friend matches', stats.friend], ['Best streak', stats.best]];
  $('#statGrid').innerHTML = rows.map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('');
  $('#statsModal').hidden = false;
});
$('#resetStats').addEventListener('click', () => { stats = blank(); store.set('xnt-stats', stats); renderNavStats(); $('#statsModal').hidden = true; });
