'use strict';
function blackjack(api) {
  const TARGET = 3, z = bag(); let sc = [0, 0], hands = [[], []], hidden = false, over = false;
  const draw = () => ({ r: 1 + Math.floor(Math.random() * 13), s: pick(SUITS) });
  const val = c => (c.r === 1 ? 11 : Math.min(c.r, 10));
  const total = h => { let t = h.reduce((s, c) => s + val(c), 0), a = h.filter(c => c.r === 1).length; while (t > 21 && a-- > 0) t -= 10; return t; };
  const root = el('div', 'bj', [0, 1].map(i => `<div class="bjside p${i}"><b>${api.names[i]}</b><div class="bjcards" id="c${i}"></div><div class="bjtot" id="t${i}"></div>
    <div class="row-btns"><button class="btn primary sm" id="hit${i}">Hit</button><button class="btn ghost sm" id="stand${i}">Stand</button></div></div>`).join(''));
  api.root.append(root);
  const btns = (i, on) => { $('#hit' + i, root).disabled = !on; $('#stand' + i, root).disabled = !on; };
  function render() {
    [0, 1].forEach(i => {
      $('#c' + i, root).innerHTML = hands[i].map((c, k) => (i === 1 && api.bot && hidden && k > 0 ? '<div class="pcard back"><b>?</b></div>' : cardHTML(c.r, c.s))).join('');
      $('#t' + i, root).textContent = i === 1 && api.bot && hidden ? '?' : (hands[i].length ? total(hands[i]) : '');
    });
  }
  function deal() {
    hands = [[draw(), draw()], [draw(), draw()]]; hidden = true; render(); turn(0);
  }
  function turn(i) {
    btns(0, false); btns(1, false);
    if (total(hands[i]) >= 21) return stand(i);
    api.status(`${api.names[i]}: hit or stand? ${sc[0]}:${sc[1]}`, i); btns(i, !(api.bot && i === 1));
  }
  $('#hit0', root).onclick = () => hit(0); $('#stand0', root).onclick = () => stand(0);
  $('#hit1', root).onclick = () => hit(1); $('#stand1', root).onclick = () => stand(1);
  function hit(i) { if (over) return; hands[i].push(draw()); render(); turn(i); }
  function stand(i) {
    btns(0, false); btns(1, false);
    if (i === 0) { if (api.bot) { hidden = false; render(); z.after(botPlay, 700); } else { hidden = false; turn(1); } } else { hidden = false; render(); z.after(resolve, 500); }
  }
  function botPlay() {
    const H = total(hands[0]);
    if (api.rigged && H <= 21) { // its hidden cards are swapped for exactly enough to beat or tie you (ties go to the bot)
      const T = Math.min(21, H + (H < 21 ? 1 : 0)), a = Math.max(2, T - 11) + Math.floor(Math.random() * (Math.min(11, T - 2) - Math.max(2, T - 11) + 1)), b = T - a;
      const mk = v => ({ r: v === 11 ? 1 : v === 10 ? 10 + Math.floor(Math.random() * 4) : v, s: pick(SUITS) });
      hands[1] = [mk(a), mk(b)]; render(); return z.after(resolve, 900);
    }
    const lim = [13, 16, 17, 17][api.lv];
    (function step() {
      const t = total(hands[1]), want = api.lv >= 2 && H <= 21 ? t < H && t < 21 : t < lim;
      if (want) { hands[1].push(draw()); render(); z.after(step, 750); } else z.after(resolve, 500);
    })();
  }
  function resolve() {
    const t0 = total(hands[0]), t1 = total(hands[1]); let w;
    if (t0 > 21 && t1 > 21) w = api.rigged ? 1 : -1;
    else if (t0 > 21) w = 1; else if (t1 > 21) w = 0;
    else w = t0 > t1 ? 0 : t1 > t0 ? 1 : (api.rigged ? 1 : -1);
    if (w < 0) { api.status('Push. Dealing again'); return z.after(deal, 1500); }
    sc[w]++; api.status(`${api.names[w]} wins the hand (${t0} vs ${t1}). ${sc[0]}:${sc[1]}`, w);
    if (sc[w] >= TARGET) { over = true; api.status(`${api.names[w]} wins ${sc[0]}:${sc[1]}`, w); return api.finish(w); }
    z.after(deal, 1800);
  }
  deal();
  return () => { over = true; z.dispose(); };
}
