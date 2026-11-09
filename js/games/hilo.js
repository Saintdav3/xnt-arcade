'use strict';
const SUITS = ['♠', '♥', '♦', '♣'], RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const cardHTML = (v, s) => `<div class="pcard"><b>${RANKS[v]}</b><span>${s}</span></div>`;
function hiLo(api) {
  const TARGET = 3, z = bag(); let sc = [0, 0], caller = api.round % 2, cur = 1 + Math.floor(Math.random() * 13), curS = pick(SUITS), busy = false;
  const root = el('div', 'hilo'); api.root.append(root);
  function ui() {
    busy = false; const botCalls = api.bot && caller === 1;
    root.innerHTML = `<div class="hcards">${cardHTML(cur, curS)}<div class="pcard back" id="nextc"><b>?</b></div></div>
      <div class="picks"><button class="pick" id="hi" ${botCalls ? 'disabled' : ''}><div>${icon('up')}<small>Higher</small></div></button><button class="pick" id="lo" ${botCalls ? 'disabled' : ''}><div>${icon('down')}<small>Lower</small></div></button></div>`;
    $('#hi', root).onclick = () => call('hi'); $('#lo', root).onclick = () => call('lo');
    api.status(botCalls ? `${api.names[1]} is calling…` : `${api.names[caller]}: higher or lower? Ties lose. ${sc[0]}:${sc[1]}`, caller);
    if (botCalls) z.after(() => call(cur < 7 ? 'hi' : cur > 7 ? 'lo' : pick(['hi', 'lo'])), 900);
  }
  function call(c) {
    if (busy) return; busy = true; $$('.pick', root).forEach(b => b.disabled = true);
    let next = 1 + Math.floor(Math.random() * 13);
    if (api.rigged) { // the card always goes against you and for the bot
      const wantHi = caller === 1 ? c === 'hi' : c !== 'hi';
      next = wantHi ? (cur < 13 ? cur + 1 + Math.floor(Math.random() * (13 - cur)) : cur) : (cur > 1 ? 1 + Math.floor(Math.random() * (cur - 1)) : cur);
    }
    const nextS = pick(SUITS);
    z.after(() => {
      $('#nextc', root).outerHTML = cardHTML(next, nextS);
      const ok = c === 'hi' ? next > cur : next < cur, w = ok ? caller : 1 - caller; sc[w]++;
      api.status(next === cur ? `Tie, caller loses. ${api.names[w]} scores` : `${api.names[w]} scores`, w);
      cur = next; curS = nextS;
      if (sc[w] >= TARGET) { api.status(`${api.names[w]} wins ${sc[0]}:${sc[1]}`, w); return api.finish(w); }
      caller = 1 - caller; z.after(ui, 1600);
    }, 600);
  }
  ui();
  return () => z.dispose();
}
