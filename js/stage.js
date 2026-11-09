'use strict';
let session = null, cleanup = null;
function startSession(game, mode, diff, names) {
  session = { game, mode, diff, names, scores: [0, 0], round: 0 };
  $('#nm0').textContent = names[0]; $('#nm1').textContent = names[1];
  $('#stageTitle').textContent = game.name;
  $('#stage').hidden = false; document.body.style.overflow = 'hidden';
  launch();
}
function updateScore() {
  [0, 1].forEach(i => { $('#sc' + i).textContent = session.scores[i]; });
}
function launch() {
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  $('#result').hidden = true; $('#arena').innerHTML = ''; setStatus('');
  updateScore();
  const api = {
    root: $('#arena'), mode: session.mode, diff: session.diff, lv: Math.max(0, LEVELS.indexOf(session.diff)), names: session.names, round: session.round,
    status: setStatus, bot: session.mode === 'bot'
  };
  // Ragebait always wins: any result that is not a bot win is flipped.
  api.rigged = api.bot && api.lv === 3;
  api.finish = w => {
    if (api.rigged && w !== 1) { setStatus(`${session.names[1]} wins. It always does.`, 1); w = 1; }
    finishMatch(w);
  };
  cleanup = session.game.fn(api) || null;
}
function setStatus(t, who) {
  const s = $('#status'); s.textContent = t;
  s.style.color = who === 0 ? 'var(--p0)' : who === 1 ? 'var(--p1)' : 'var(--text)';
}
function finishMatch(winner) {
  setTimeout(() => {
    if (!session) return;
    if (winner >= 0) session.scores[winner]++;
    session.round++; updateScore(); recordResult(session.mode, winner);
    const n = session.names; let title, sub;
    if (winner < 0) { title = 'Draw'; sub = 'Nobody won.'; }
    else if (session.mode === 'bot') { title = winner === 0 ? 'You win' : 'You lost'; sub = winner === 0 ? `You beat ${n[1]}.` : `${n[1]} won this one.`; }
    else { title = `${n[winner]} wins`; sub = 'Play again to settle it.'; }
    if (winner < 0) sound.draw(); else if (session.mode === 'bot' && winner === 1) sound.lose(); else sound.win();
    $('#rTitle').textContent = title; $('#rSub').textContent = `${sub} Session score ${session.scores[0]} : ${session.scores[1]}.`;
    $('#result').hidden = false;
  }, 650);
}
function leave() {
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  $('#stage').hidden = true; $('#result').hidden = true; document.body.style.overflow = ''; session = null;
}
$('#backBtn').addEventListener('click', leave);
$('#toLobby').addEventListener('click', leave);
$('#rematch').addEventListener('click', launch);
