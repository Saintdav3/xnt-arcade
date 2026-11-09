'use strict';
/* Visitor + live-player counters, using the free counterapi.dev (no account, no server).
   - Visits: +1 once per browser session. Unique visitors: +1 once per browser (localStorage).
   - Active players: each open tab pings one 2-minute bucket once; the bucket count = players seen. */
(function () {
  const NS = 'xnt-arcade-7f3a', API = 'https://api.counterapi.dev/v1/' + NS + '/';
  const BUCKET = 120000, PING_EVERY = 60000;
  const box = document.getElementById('liveStats');
  if (!box) return;
  const $visits = document.getElementById('statVisits');
  const $active = document.getElementById('statActive');
  const call = (key, up) => fetch(API + key + (up ? '/up' : ''), { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject()).then(j => +j.count || 0);
  const get = (s, k) => { try { return s.getItem(k); } catch (e) { return null; } };
  const set = (s, k, v) => { try { s.setItem(k, v); } catch (e) {} };
  const fmt = n => n.toLocaleString('en-US');
  const show = (el, n) => { el.textContent = fmt(n); box.hidden = false; };

  // visits and unique visitors
  const newSession = !get(sessionStorage, 'xnt_seen');
  set(sessionStorage, 'xnt_seen', '1');
  call('visits', newSession).then(n => show($visits, n)).catch(() => {});
  if (!get(localStorage, 'xnt_unique')) { set(localStorage, 'xnt_unique', '1'); call('unique', true).catch(() => {}); }

  // active players
  const bucket = () => Math.floor(Date.now() / BUCKET);
  let pinged = -1;
  async function tick() {
    if (document.hidden) return;
    const b = bucket();
    try {
      let cur;
      if (pinged !== b) { pinged = b; cur = await call('active-' + b, true); }
      else cur = await call('active-' + b, false).catch(() => 0);
      const prev = await call('active-' + (b - 1), false).catch(() => 0);
      show($active, Math.max(cur, prev, 1));
    } catch (e) {}
  }
  tick(); setInterval(tick, PING_EVERY);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
})();
