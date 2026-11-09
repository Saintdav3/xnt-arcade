'use strict';
const LEVELS = ['easy', 'medium', 'hard', 'ragebait'];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

function bag() {
  const timers = new Set(), ints = new Set(), offs = [], rafs = [];
  return {
    after(fn, ms) { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; },
    every(fn, ms) { const t = setInterval(fn, ms); ints.add(t); return t; },
    frame(fn) { let run = true, id = requestAnimationFrame(function loop(t) { if (!run) return; fn(t); id = requestAnimationFrame(loop); }); rafs.push(() => { run = false; cancelAnimationFrame(id); }); },
    on(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); offs.push(() => target.removeEventListener(ev, fn, opt)); },
    clear() { timers.forEach(clearTimeout); timers.clear(); ints.forEach(clearInterval); ints.clear(); },
    dispose() { this.clear(); offs.forEach(f => f()); offs.length = 0; rafs.forEach(f => f()); rafs.length = 0; }
  };
}

/* Fixed-step logic with a smooth render every display frame: draw(alpha) gets 0..1 between ticks. */
function ticker(z, ms, tick, draw) {
  let last = performance.now(), acc = 0;
  z.frame(() => {
    const now = performance.now(); acc += Math.min(now - last, 100); last = now;
    while (acc >= ms) { acc -= ms; tick(); }
    draw(acc / ms);
  });
}
/* Crisp canvas on high-DPI screens. Draw in logical w x h units. */
function hiDPI(cv, w, h) {
  const d = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * d); cv.height = Math.round(h * d);
  const ctx = cv.getContext('2d'); ctx.scale(d, d); return ctx;
}
