import { SHOTS } from './cinematics.js';

// Wires the HUD: start overlay, pointer-lock state, Earth-visit
// prompts, and the cinematics panel (play / record shots or sets).
export function createUI({ player, cinematics, recorder }) {
  const overlay = document.getElementById('start-overlay');
  const enterBtn = document.getElementById('enter-btn');
  const crosshair = document.getElementById('crosshair');
  const hintBar = document.getElementById('hint-bar');
  const shotSelect = document.getElementById('shot-select');
  const playBtn = document.getElementById('play-btn');
  const recordBtn = document.getElementById('record-btn');
  const recordAllBtn = document.getElementById('record-all-btn');
  const status = document.getElementById('cine-status');
  const recDot = document.getElementById('rec-dot');
  const leaveBtn = document.getElementById('leave-btn');

  // Set after construction (earthView needs the UI callback too).
  let earthView = null;

  for (const shot of SHOTS) {
    const opt = document.createElement('option');
    opt.value = shot.id;
    opt.textContent = `${shot.name} (${shot.duration}s)`;
    shotSelect.appendChild(opt);
  }

  const setStatus = (html) => (status.innerHTML = html);
  const setBusy = (busy) => {
    playBtn.disabled = recordBtn.disabled = recordAllBtn.disabled = busy;
  };

  enterBtn.addEventListener('click', () => player.controls.lock());

  // Clicking the scene re-locks the pointer once the intro overlay is
  // gone — including while standing on Earth (to look around).
  document.getElementById('app').addEventListener('click', () => {
    const earthBusy = earthView?.active && earthView.state !== 'standing';
    if (!cinematics.playing && !earthBusy && overlay.classList.contains('hidden') && !player.controls.isLocked) {
      player.controls.lock();
    }
  });

  player.controls.addEventListener('lock', () => {
    overlay.classList.add('hidden');
    document.body.classList.add('walking');
    crosshair.hidden = false;
    hintBar.hidden = true;
  });

  player.controls.addEventListener('unlock', () => {
    document.body.classList.remove('walking');
    crosshair.hidden = true;
    if (!cinematics.playing && !earthView?.active) hintBar.hidden = false;
  });

  function runShot(shotId, { record }) {
    if (cinematics.playing || earthView?.active) return;
    player.controls.unlock();
    overlay.classList.add('hidden');
    setBusy(true);
    const shot = SHOTS.find((s) => s.id === shotId);
    if (record) {
      recorder.start();
      recDot.hidden = false;
    }
    setStatus(`${record ? 'Recording' : 'Playing'}: <b>${shot.name}</b>…`);
    cinematics.play(shotId, async () => {
      if (record) {
        const file = await recorder.stop(`stellaris-${shotId}`);
        recDot.hidden = true;
        setStatus(`Saved <b>${file}</b> to your downloads.`);
      } else {
        setStatus(`Finished <b>${shot.name}</b>.`);
      }
      setBusy(false);
    });
  }

  function runFullSet() {
    if (cinematics.playing || earthView?.active) return;
    player.controls.unlock();
    overlay.classList.add('hidden');
    setBusy(true);
    recorder.start();
    recDot.hidden = false;
    const queue = [...SHOTS];
    const next = async () => {
      const shot = queue.shift();
      if (!shot) {
        const file = await recorder.stop('stellaris-full-set');
        recDot.hidden = true;
        setStatus(`Saved full set as <b>${file}</b>.`);
        setBusy(false);
        return;
      }
      setStatus(`Recording set: <b>${shot.name}</b> (${SHOTS.length - queue.length}/${SHOTS.length})…`);
      cinematics.play(shot.id, next);
    };
    next();
  }

  playBtn.addEventListener('click', () => runShot(shotSelect.value, { record: false }));
  recordBtn.addEventListener('click', () => runShot(shotSelect.value, { record: true }));
  recordAllBtn.addEventListener('click', runFullSet);

  // ---- Earth visit ----
  function onEarthState(state) {
    document.body.classList.toggle('earthview', state !== 'idle');
    leaveBtn.hidden = state !== 'standing';
    if (state === 'entering') {
      hintBar.hidden = false;
      hintBar.textContent = 'Descending to Earth…';
    } else if (state === 'standing') {
      hintBar.hidden = false;
      hintBar.textContent = 'Standing on Earth beneath the three suns · Click to look around · Esc, then Leave Earth to return';
    } else if (state === 'leaving') {
      hintBar.textContent = 'Returning to the deck…';
    } else {
      hintBar.textContent = 'Click Earth to stand beneath the three suns · Esc opens the cinematics panel';
      hintBar.hidden = player.controls.isLocked;
    }
  }

  leaveBtn.addEventListener('click', () => earthView?.leave());
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && earthView?.state === 'standing' && !player.controls.isLocked) {
      earthView.leave();
    }
  });

  // Crosshair / hint feedback while aiming at Earth.
  function setAimingAtEarth(aiming) {
    crosshair.classList.toggle('target', aiming);
    if (player.controls.isLocked) {
      hintBar.hidden = !aiming;
      if (aiming) hintBar.textContent = 'Click to visit Earth';
    }
  }

  return {
    runShot,
    runFullSet,
    setStatus,
    onEarthState,
    setAimingAtEarth,
    attachEarthView(ev) {
      earthView = ev;
    },
  };
}
