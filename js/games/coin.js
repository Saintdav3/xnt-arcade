'use strict';
function coinDuel(api) {
  const TARGET = 3, z = bag(); let sc = [0, 0], caller = api.round % 2, spins = 0, busy = false;
  const wrap = el('div', 'duel'); api.root.append(wrap);
  function ui() {
    busy = false; wrap.innerHTML = `<div class="coin-wrap"><div class="coin" id="coin"><div class="heads">H</div><div class="tails">T</div></div></div><div class="picks" id="cp"></div>`;
    const cp = $('#cp', wrap);
    const botCalls = api.bot && caller === 1;
    ['Heads', 'Tails'].forEach(s => { const b = el('button', 'pick', `<div>${icon(s.toLowerCase())}<small>${s}</small></div>`); b.disabled = botCalls; b.onclick = () => flip(s); cp.append(b); });
    api.status(botCalls ? `${api.names[1]} is calling…` : `${api.names[caller]}, call it! · ${sc[0]}:${sc[1]} (first to ${TARGET})`, caller);
    if (botCalls) z.after(() => flip(pick(['Heads', 'Tails'])), 900);
  }
  function flip(call) {
    if (busy) return; busy = true; $$('.pick', wrap).forEach(b => b.disabled = true);
    let res = Math.random() < .5 ? 'Heads' : 'Tails';
    if (api.rigged) res = caller === 1 ? call : (call === 'Heads' ? 'Tails' : 'Heads'); const coin = $('#coin', wrap);
    spins += 5; const end = spins * 180 + (res === 'Heads' ? 0 : 180);
    coin.style.setProperty('--spin', (end - 360) + 'deg'); coin.style.setProperty('--end', end + 'deg'); coin.classList.add('flip');
    api.status(`${api.names[caller]} calls ${call}…`, caller);
    z.after(() => {
      const w = res === call ? caller : 1 - caller; sc[w]++;
      coin.style.transform = `rotateY(${end}deg)`;
      api.status(`It's ${res}! ${api.names[w]} scores`, w);
      if (sc[w] >= TARGET) { api.status(`${api.names[w]} wins ${sc[0]}:${sc[1]}!`, w); return api.finish(w); }
      caller = 1 - caller; z.after(() => ui(), 1600);
    }, 1700);
  }
  ui();
  return () => z.dispose();
}
