import { SHOTS } from './cinematics.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Wires the HUD: start overlay, pointer-lock state, Earth-visit
// prompts, the cinematics panel, and the PostgreSQL world library.
// All listeners are tracked so dispose() can unwire them — the HUD DOM
// persists across world reboots.
export function createUI({ player, cinematics, recorder, config, reboot, opts = {} }) {
  const $ = (id) => document.getElementById(id);
  const overlay = $('start-overlay');
  const crosshair = $('crosshair');
  const hintBar = $('hint-bar');
  const shotSelect = $('shot-select');
  const status = $('cine-status');
  const recDot = $('rec-dot');
  const leaveBtn = $('leave-btn');
  const worldName = $('world-name');
  const worldSelect = $('world-select');
  const worldStatus = $('world-status');

  const disposers = [];
  const on = (target, event, fn) => {
    target.addEventListener(event, fn);
    disposers.push(() => target.removeEventListener(event, fn));
  };

  // Set after construction (earthView needs the UI callback too).
  let earthView = null;

  shotSelect.innerHTML = '';
  for (const shot of SHOTS) {
    const opt = document.createElement('option');
    opt.value = shot.id;
    opt.textContent = `${shot.name} (${shot.duration}s)`;
    shotSelect.appendChild(opt);
  }

  const setStatus = (html) => (status.innerHTML = html);
  const setWorldStatus = (html) => (worldStatus.innerHTML = html);
  const setBusy = (busy) => {
    for (const id of ['play-btn', 'record-btn', 'record-all-btn']) $(id).disabled = busy;
  };

  on($('enter-btn'), 'click', () => player.controls.lock());

  // Clicking the scene re-locks the pointer once the intro overlay is
  // gone — including while standing on Earth (to look around).
  on($('app'), 'click', () => {
    const earthBusy = earthView?.active && earthView.state !== 'standing';
    if (!cinematics.playing && !earthBusy && overlay.classList.contains('hidden') && !player.controls.isLocked) {
      player.controls.lock();
    }
  });

  const onLock = () => {
    overlay.classList.add('hidden');
    document.body.classList.add('walking');
    crosshair.hidden = false;
    hintBar.hidden = true;
  };
  const onUnlock = () => {
    document.body.classList.remove('walking');
    crosshair.hidden = true;
    if (!cinematics.playing && !earthView?.active) hintBar.hidden = false;
  };
  player.controls.addEventListener('lock', onLock);
  player.controls.addEventListener('unlock', onUnlock);
  disposers.push(() => {
    player.controls.removeEventListener('lock', onLock);
    player.controls.removeEventListener('unlock', onUnlock);
  });

  // ---- Cinematics ----
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
    setStatus(`${record ? 'Recording' : 'Playing'}: <b>${esc(shot.name)}</b>…`);
    cinematics.play(shotId, async () => {
      if (record) {
        const file = await recorder.stop(`stellaris-${shotId}`);
        recDot.hidden = true;
        setStatus(`Saved <b>${esc(file)}</b> to your downloads.`);
      } else {
        setStatus(`Finished <b>${esc(shot.name)}</b>.`);
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
        setStatus(`Saved full set as <b>${esc(file)}</b>.`);
        setBusy(false);
        return;
      }
      setStatus(`Recording set: <b>${esc(shot.name)}</b> (${SHOTS.length - queue.length}/${SHOTS.length})…`);
      cinematics.play(shot.id, next);
    };
    next();
  }

  on($('play-btn'), 'click', () => runShot(shotSelect.value, { record: false }));
  on($('record-btn'), 'click', () => runShot(shotSelect.value, { record: true }));
  on($('record-all-btn'), 'click', runFullSet);

  // ---- World library (PostgreSQL via /api/worlds) ----
  async function refreshWorlds(selectId) {
    let res;
    try {
      res = await fetch('/api/worlds');
    } catch {
      setWorldStatus('Could not reach the world library.');
      return;
    }
    if (!res.ok) {
      setWorldStatus(
        res.status === 503
          ? 'No database configured — set DATABASE_URL to enable saving.'
          : 'World library error.'
      );
      return;
    }
    const { worlds } = await res.json();
    worldSelect.innerHTML = '';
    for (const w of worlds) {
      const opt = document.createElement('option');
      opt.value = String(w.id);
      opt.textContent = w.name;
      worldSelect.appendChild(opt);
    }
    if (selectId) worldSelect.value = String(selectId);
    if (!opts.worldStatus) {
      setWorldStatus(
        worlds.length
          ? `${worlds.length} saved world${worlds.length === 1 ? '' : 's'} in PostgreSQL.`
          : 'No saved worlds yet — name one and save it.'
      );
    }
  }

  async function saveWorld() {
    const name = worldName.value.trim();
    if (!name) {
      setWorldStatus('Give the world a name first.');
      worldName.focus();
      return;
    }
    setWorldStatus('Saving…');
    let res;
    try {
      res = await fetch('/api/worlds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config }),
      });
    } catch {
      setWorldStatus('Could not reach the world library.');
      return;
    }
    if (!res.ok) {
      setWorldStatus(
        res.status === 503
          ? 'No database configured — set DATABASE_URL to enable saving.'
          : 'Save failed.'
      );
      return;
    }
    const { world } = await res.json();
    await refreshWorlds(world.id);
    setWorldStatus(`Saved <b>${esc(world.name)}</b> to PostgreSQL.`);
  }

  async function loadWorld() {
    const id = worldSelect.value;
    if (!id) return;
    setWorldStatus('Loading…');
    let res;
    try {
      res = await fetch(`/api/worlds/${id}`);
    } catch {
      setWorldStatus('Could not reach the world library.');
      return;
    }
    if (!res.ok) {
      setWorldStatus('Load failed.');
      return;
    }
    const { world } = await res.json();
    // Rebuilds the entire scene from the saved config.
    reboot(world.config, `Loaded <b>${esc(world.name)}</b> from PostgreSQL.`);
  }

  async function deleteWorld() {
    const id = worldSelect.value;
    if (!id) return;
    const name = worldSelect.selectedOptions[0]?.textContent ?? 'world';
    if (!window.confirm(`Delete "${name}" from the library?`)) return;
    const res = await fetch(`/api/worlds/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setWorldStatus('Delete failed.');
      return;
    }
    await refreshWorlds();
    setWorldStatus(`Deleted <b>${esc(name)}</b>.`);
  }

  on($('save-world-btn'), 'click', saveWorld);
  on($('load-world-btn'), 'click', loadWorld);
  on($('delete-world-btn'), 'click', deleteWorld);

  if (opts.worldStatus) setWorldStatus(opts.worldStatus);
  refreshWorlds();

  // ---- Earth visit ----
  function onEarthState(state) {
    document.body.classList.toggle('earthview', state !== 'idle');
    leaveBtn.hidden = state !== 'standing';
    if (state === 'entering') {
      hintBar.hidden = false;
      hintBar.textContent = 'Descending to Earth…';
    } else if (state === 'standing') {
      hintBar.hidden = false;
      hintBar.textContent =
        'Standing on Earth beneath the three suns · Click to look around · Esc, then Leave Earth to return';
    } else if (state === 'leaving') {
      hintBar.textContent = 'Returning to the deck…';
    } else {
      hintBar.textContent = 'Click Earth to stand beneath the three suns · Esc opens the cinematics panel';
      hintBar.hidden = player.controls.isLocked;
    }
  }

  on(leaveBtn, 'click', () => earthView?.leave());
  on(document, 'keydown', (e) => {
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
    setWorldStatus,
    refreshWorlds,
    onEarthState,
    setAimingAtEarth,
    attachEarthView(ev) {
      earthView = ev;
    },
    dispose() {
      for (const off of disposers) off();
      disposers.length = 0;
    },
  };
}
