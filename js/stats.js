'use strict';
const blank = () => ({ played: 0, wins: 0, losses: 0, draws: 0, friend: 0, streak: 0, best: 0 });
let stats = Object.assign(blank(), store.get('xnt-stats', {}));
function renderNavStats() { $('#navStats').textContent = `${stats.wins} W · ${stats.losses} L`; }
function recordResult(mode, winner) {
  stats.played++;
  if (mode === 'friend') stats.friend++;
  else if (winner === 0) { stats.wins++; stats.streak++; stats.best = Math.max(stats.best, stats.streak); }
  else if (winner === 1) { stats.losses++; stats.streak = 0; }
  else stats.draws++;
  store.set('xnt-stats', stats); renderNavStats();
}
