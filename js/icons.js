'use strict';
/* Inline SVG icons. Stroke uses currentColor so CSS controls the color. */
const ICONS = {
  c4: ['0 0 48 48', '<rect x="6" y="8" width="36" height="32" rx="6"/><circle cx="17" cy="19" r="3.5"/><circle cx="31" cy="19" r="3.5" fill="currentColor"/><circle cx="17" cy="30" r="3.5" fill="currentColor"/><circle cx="31" cy="30" r="3.5"/>'],
  ttt: ['0 0 48 48', '<path d="M18 7v34M30 7v34M7 18h34M7 30h34"/><path d="M9.5 9.5l6 6m0-6l-6 6"/><circle cx="24" cy="24" r="3.5"/>'],
  pong: ['0 0 48 48', '<rect x="7" y="13" width="5" height="22" rx="2.5"/><rect x="36" y="13" width="5" height="22" rx="2.5"/><circle cx="24" cy="24" r="3.5" fill="currentColor"/>'],
  react: ['0 0 48 48', '<path d="M27 5 11 27h12l-2 16 16-22H25z"/>'],
  rps: ['0 0 48 48', '<circle cx="14" cy="35" r="5.5"/><circle cx="34" cy="35" r="5.5"/><path d="M18 31 35 8M30 31 13 8"/>'],
  coin: ['0 0 48 48', '<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="9"/>'],
  reversi: ['0 0 48 48', '<circle cx="16" cy="16" r="8"/><circle cx="32" cy="16" r="8" fill="currentColor"/><circle cx="24" cy="32" r="8" fill="currentColor"/>'],
  dots: ['0 0 48 48', '<path d="M10 10h28M10 10v14M38 10v28"/><circle cx="10" cy="10" r="3" fill="currentColor"/><circle cx="24" cy="10" r="3" fill="currentColor"/><circle cx="38" cy="10" r="3" fill="currentColor"/><circle cx="10" cy="24" r="3" fill="currentColor"/><circle cx="24" cy="24" r="3" fill="currentColor"/><circle cx="38" cy="24" r="3" fill="currentColor"/><circle cx="10" cy="38" r="3" fill="currentColor"/><circle cx="24" cy="38" r="3" fill="currentColor"/><circle cx="38" cy="38" r="3" fill="currentColor"/>'],
  memory: ['0 0 48 48', '<rect x="6" y="10" width="17" height="26" rx="3.5"/><rect x="25" y="12" width="17" height="26" rx="3.5" fill="currentColor"/><circle cx="14.5" cy="23" r="3" fill="currentColor"/>'],
  hockey: ['0 0 48 48', '<circle cx="16" cy="24" r="10"/><circle cx="16" cy="24" r="3.5" fill="currentColor"/><circle cx="36" cy="24" r="4.5" fill="currentColor"/>'],
  tug: ['0 0 48 48', '<path d="M5 32h38M24 32V12l11 5.5L24 23"/><circle cx="9" cy="32" r="3.5" fill="currentColor"/><circle cx="39" cy="32" r="3.5" fill="currentColor"/>'],
  dice: ['0 0 48 48', '<rect x="8" y="8" width="32" height="32" rx="8"/><circle cx="17" cy="17" r="2.6" fill="currentColor"/><circle cx="31" cy="17" r="2.6" fill="currentColor"/><circle cx="24" cy="24" r="2.6" fill="currentColor"/><circle cx="17" cy="31" r="2.6" fill="currentColor"/><circle cx="31" cy="31" r="2.6" fill="currentColor"/>'],
  gomoku: ['0 0 48 48', '<path d="M12 8v32M24 8v32M36 8v32M8 12h32M8 24h32M8 36h32"/><circle cx="24" cy="24" r="4.5" fill="currentColor"/><circle cx="12" cy="12" r="4.5" fill="currentColor"/><circle cx="36" cy="36" r="4.5" fill="#0a0a0a"/>'],
  nim: ['0 0 48 48', '<circle cx="12" cy="12" r="3.5"/><circle cx="24" cy="12" r="3.5"/><circle cx="36" cy="12" r="3.5"/><circle cx="12" cy="24" r="3.5" fill="currentColor"/><circle cx="24" cy="24" r="3.5" fill="currentColor"/><circle cx="12" cy="36" r="3.5" fill="currentColor"/>'],
  hilo: ['0 0 48 48', '<path d="M16 20V8M10 14l6-6 6 6M32 28v12M26 34l6 6 6-6"/>'],
  blackjack: ['0 0 48 48', '<path d="M24 8c8 8 13 12 13 18a6.5 6.5 0 0 1-11 4.5l2 8.5h-8l2-8.5A6.5 6.5 0 0 1 11 26c0-6 5-10 13-18z"/>'],
  checkers: ['0 0 48 48', '<path d="M8 36V16l10 9 6-13 6 13 10-9v20z"/><path d="M8 41h32"/>'],
  battleship: ['0 0 48 48', '<path d="M5 29h38l-6 10H11z"/><path d="M13 29V19h22v10M24 19V8"/>'],
  snake: ['0 0 48 48', '<path d="M10 38h20a7 7 0 0 0 0-14H18a7 7 0 0 1 0-14h18"/><circle cx="38" cy="10" r="3" fill="currentColor"/>'],
  pacman: ['0 0 48 48', '<path d="M24 24 40 13A19 19 0 1 0 40 35z"/><circle cx="23" cy="14" r="2.8" fill="currentColor"/>'],
  whack: ['0 0 48 48', '<ellipse cx="24" cy="36" rx="16" ry="6"/><path d="M14 36v-9a10 10 0 0 1 20 0v9"/><circle cx="20" cy="28" r="2" fill="currentColor"/><circle cx="28" cy="28" r="2" fill="currentColor"/>'],
  ctf: ['0 0 48 48', '<path d="M12 42V7M12 9h25l-7 9 7 9H12"/>'],
  up: ['0 0 24 24', '<path d="M12 19V5M5 12l7-7 7 7"/>'],
  down: ['0 0 24 24', '<path d="M12 5v14M5 12l7 7 7-7"/>'],
  golf: ['0 0 48 48', '<path d="M18 38V8l14 6-14 6"/><ellipse cx="18" cy="40" rx="12" ry="4"/><circle cx="37" cy="34" r="3.5" fill="currentColor"/>'],
  rock: ['0 0 24 24', '<path d="M4.5 15 8 7.5h8l3.5 5.5-2.5 6H8z"/>'],
  paper: ['0 0 24 24', '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7"/>'],
  scissors: ['0 0 24 24', '<circle cx="7" cy="17.5" r="2.8"/><circle cx="17" cy="17.5" r="2.8"/><path d="M9 15.5 17.5 4M15 15.5 6.5 4"/>'],
  heads: ['0 0 24 24', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>'],
  tails: ['0 0 24 24', '<circle cx="12" cy="12" r="9"/><path d="M8 9.5h8M8 12.5h8M8 15.5h8"/>'],
  sound: ['0 0 24 24', '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'],
  mute: ['0 0 24 24', '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>'],
  arrow: ['0 0 24 24', '<path d="M5 12h14M13 6l6 6-6 6"/>'],
  close: ['0 0 24 24', '<path d="M6 6l12 12M18 6 6 18"/>']
};
function icon(name, cls = '') {
  const [vb, body] = ICONS[name];
  return `<svg class="ico ${cls}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="${vb === '0 0 48 48' ? 2.5 : 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
