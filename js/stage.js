'use strict';
let session = null, cleanup = null;
function startSession(game, mode, diff, names) {
  session = { game, mode, diff, names, scores: [0, 0], round: 0, losses: 0, used: new Set(), lastStyle: -1 };
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
  $('#result').hidden = true; resetResultCard(); if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch {} } $('#arena').innerHTML = ''; setStatus('');
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
    resetResultCard();
    if (session.mode === 'bot' && session.diff === 'ragebait' && winner === 1) ragebaitTaunt();
    $('#result').hidden = false;
  }, 650);
}
/* Ragebait loss screen: every loss gets a new taunt, look, animation and laugh, and they get meaner as losses pile up. */
const TAUNTS = [
  [ // 1-2 losses: smug
    'Oh no. Did you really think you had that?', 'Cute attempt. Truly.', 'That was adorable. Try again.',
    'Is that your best? Oh. It is.', 'I barely noticed you were playing.', 'Close! Just kidding, it was not close.'
  ],
  [ // 3-4 losses: mocking
    'You are not smart. Just accept it.', 'Even my loading screen plays better than you.', 'Hahaha! Your strategy is a coin flip with extra steps.',
    'Have you considered a game for toddlers?', 'Your brain called. It said it is on vacation.', 'I would explain what you did wrong, but we would be here all day.',
    'Fun fact: you are not as clever as you think.'
  ],
  [ // 5+ losses: brutal
    'You are NOT smart. Stop pretending.', 'Loss number {n}. Do you enjoy this? Be honest.', 'I have lost count of your failures. Okay, it is {n}.',
    'A houseplant would have lasted longer. And a houseplant has no brain.', 'Wow. Still here? Dedication to being wrong is impressive.',
    'Hahahaha! {n} losses! Frame this one!', 'Genius move, as always. Said no one ever.', 'Maybe the game is too hard. For you. Specifically.'
  ]
];
const TAUNT_TITLES = ['LOL. You lost.', 'HAHAHA!', 'Skill issue.', 'Embarrassing.', 'Ouch. Again?', 'You lose. Shocking.', 'Not smart.', 'L + ratio', 'Typical.', 'GG (for me)'];
const TAUNT_STYLES = [
  { bg: '#3b0d0d', fg: '#ff6b6b', anim: 'shake' }, { bg: '#2a0d3b', fg: '#d98cff', anim: 'wobble' },
  { bg: '#3b2f0d', fg: '#ffd84d', anim: 'bounce' }, { bg: '#0d3b2a', fg: '#5dffb0', anim: 'spin' },
  { bg: '#0d243b', fg: '#6bc4ff', anim: 'pulse' }, { bg: '#3b0d2a', fg: '#ff6bd0', anim: 'shake' }
];
function laugh(n) {
  try {
    if (sound.isMuted() || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(pick(['ha ha ha ha ha', 'hahahahaha', 'ho ho ho ho', 'bwahahaha']));
    u.rate = rand(1.1, 1.8); u.pitch = rand(0.4, 2); u.volume = 1;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch {}
}
function ragebaitTaunt() {
  session.losses++;
  const n = session.losses, tier = n <= 2 ? 0 : n <= 4 ? 1 : 2;
  // Pull from this tier and below, never repeating a line until the pool runs dry.
  let pool = TAUNTS.slice(0, tier + 1).flat().map(t => t);
  let fresh = pool.filter(t => !session.used.has(t));
  if (!fresh.length) { session.used.clear(); fresh = pool; }
  const line = pick(fresh); session.used.add(line);
  let si; do { si = Math.floor(Math.random() * TAUNT_STYLES.length); } while (si === session.lastStyle);
  session.lastStyle = si;
  const st = TAUNT_STYLES[si], card = $('.result-card');
  // The laugh gets longer and louder the more you lose.
  const ha = Array(Math.min(2 + n, 7)).fill('HA').join(' ') + '!';
  card.dataset.anim = st.anim;
  card.style.background = st.bg; card.style.borderColor = st.fg; card.style.color = st.fg;
  card.style.setProperty('--tilt', rand(-4, 4).toFixed(1) + 'deg');
  card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
  $('#rTitle').textContent = pick(TAUNT_TITLES);
  $('#rSub').textContent = `${line.replace('{n}', n)}\nSession score ${session.scores[0]} : ${session.scores[1]}.`;
  $('#rLaugh').textContent = ha;
  $('#rSub').style.whiteSpace = 'pre-line'; $('#rSub').style.color = 'inherit';
  $('#rematch').textContent = pick(['Embarrass me again', 'Try again, genius', 'One more loss?', 'I can win (I cannot)', 'Again']);
  laugh(n);
  if (navigator.vibrate) { try { navigator.vibrate([80, 40, 80, 40, 200]); } catch {} }
}
function resetResultCard() {
  const card = $('.result-card');
  card.removeAttribute('data-anim'); card.style.cssText = '';
  $('#rLaugh').textContent = ''; $('#rSub').style.cssText = ''; $('#rematch').textContent = 'Again';
}
function leave() {
  if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch {} }
  resetResultCard();
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  $('#stage').hidden = true; $('#result').hidden = true; document.body.style.overflow = ''; session = null;
}
$('#backBtn').addEventListener('click', leave);
$('#toLobby').addEventListener('click', leave);
$('#rematch').addEventListener('click', launch);
