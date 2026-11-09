'use strict';
let activeFilter = 'all';
function buildLobby() {
  const tags = [...new Set(GAMES.map(g => g.tag))];
  $('#filters').innerHTML = [['all', 'All', GAMES.length], ...tags.map(t => [t, t, GAMES.filter(g => g.tag === t).length])]
    .map(([f, label, n]) => `<button class="tab${f === activeFilter ? ' active' : ''}" data-f="${f}">${label} <span>${n}</span></button>`).join('');
  const tiles = $('#tiles'); tiles.innerHTML = '';
  GAMES.filter(g => activeFilter === 'all' || g.tag === activeFilter).forEach(g => {
    const t = el('button', 'tile');
    t.innerHTML = `<div class="tile-art">${icon(g.id)}</div>
      <div class="tile-foot"><div><b>${g.name}</b><span>${g.sub}</span></div>${icon('arrow', 'go')}</div>`;
    t.addEventListener('click', () => openSetup(g));
    tiles.append(t);
  });
}
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('.tab'); if (!b) return;
  activeFilter = b.dataset.f; buildLobby();
});
