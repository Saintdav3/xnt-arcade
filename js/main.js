'use strict';
buildLobby(); renderNavStats();

/* sound: starts on the first click or key press (browser rule), with a mute button */
const muteBtn = $('#muteBtn');
function syncMute() {
  muteBtn.innerHTML = icon(sound.isMuted() ? 'mute' : 'sound');
  muteBtn.setAttribute('aria-label', sound.isMuted() ? 'Unmute sound' : 'Mute sound');
}
muteBtn.addEventListener('click', () => { sound.toggle(); syncMute(); });
syncMute();
const unlock = () => { sound.unlock(); ['pointerdown', 'keydown'].forEach(ev => window.removeEventListener(ev, unlock)); };
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, unlock));
sound.unlock(); // works straight away if the browser already allows audio
