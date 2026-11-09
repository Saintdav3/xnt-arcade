'use strict';
/* Music and win/lose sounds are real CC0 files (see assets/audio/CREDITS.txt).
   A small synth is kept for the startup chime, an extra sour layer on a loss, and as a fallback. */
const sound = (() => {
  let ctx, sfxBus, muted = store.get('xnt-muted', false), chimed = false, musicOn = false;
  const MUSIC_VOL = .28;
  const music = new Audio('assets/audio/music.mp3'); music.loop = true; music.volume = MUSIC_VOL; music.preload = 'auto';
  const winClip = new Audio('assets/audio/win.mp3'), loseClip = new Audio('assets/audio/lose.m4a');
  [winClip, loseClip].forEach(a => a.preload = 'auto');
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);

  function initCtx() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); sfxBus = ctx.createGain(); sfxBus.gain.value = muted ? 0 : .5; sfxBus.connect(ctx.destination); return true;
  }
  function tone(freq, t, dur, type, vol, slideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + .03); return o;
  }
  function clip(a, seconds, vol, fallback) {
    a.pause(); a.currentTime = 0; a.volume = vol; a.muted = muted;
    const p = a.play(); if (p) p.catch(() => fallback && fallback());
    // duck the music, fade the clip out at `seconds`
    music.volume = MUSIC_VOL * .2;
    const t0 = performance.now(), iv = setInterval(() => {
      const left = seconds - (performance.now() - t0) / 1000;
      if (left < .5) a.volume = Math.max(0, vol * left / .5);
      if (left <= 0) { clearInterval(iv); a.pause(); music.volume = MUSIC_VOL; }
    }, 40);
  }
  function synthWin() {
    if (!initCtx()) return; ctx.resume(); const t = ctx.currentTime + .05;
    [72, 76, 79, 84].forEach((n, i) => tone(hz(n), t + i * .11, .25, 'square', .25));
  }
  function synthLose() { // sour wobbling buzzer
    if (!initCtx()) return; ctx.resume(); const t = ctx.currentTime + .05;
    tone(95, t, .45, 'square', .3);
    [[311, 0], [293, .36], [277, .72]].forEach(([f, d]) => tone(f, t + d, .32, 'sawtooth', .25, f * .8));
    const o = tone(233, t + 1.08, 1.2, 'sawtooth', .3, 110);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 11; lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t + 1.08); lfo.stop(t + 2.4);
  }
  function applyMute() { music.muted = muted; winClip.muted = muted; loseClip.muted = muted; if (sfxBus) sfxBus.gain.value = muted ? 0 : .5; }
  applyMute();

  return {
    // Browsers only allow sound after a user gesture, so this finishes on the first click or key press.
    unlock() {
      if (!musicOn) { const p = music.play(); if (p) p.then(() => { musicOn = true; }).catch(() => {}); }
      if (!chimed && initCtx()) {
        const go = () => { if (chimed) return; chimed = true; const t = ctx.currentTime + .05; [67, 72, 76, 79].forEach((n, i) => tone(hz(n), t + i * .09, .16, 'square', .22)); };
        if (ctx.state === 'running') go(); else ctx.resume().then(go).catch(() => {});
      }
    },
    win() { clip(winClip, 4.5, .8, synthWin); },
    lose() { clip(loseClip, 4, 1, null); synthLose(); },
    draw() { if (!initCtx()) return; ctx.resume(); const t = ctx.currentTime + .05; tone(hz(64), t, .18, 'square', .22); tone(hz(64), t + .22, .3, 'square', .22); },
    toggle() { muted = !muted; store.set('xnt-muted', muted); applyMute(); return muted; },
    isMuted: () => muted
  };
})();
