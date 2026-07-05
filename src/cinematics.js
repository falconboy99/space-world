import * as THREE from 'three';

// ============================================================
// SHOT LIBRARY — each shot is a camera path (Catmull-Rom spline
// through `path` points) plus a look target. `look` with one
// point stares at it; with several points the gaze travels too.
// Add or reshape shots here to build new video sets.
// ============================================================
export const SHOTS = [
  {
    id: 'deck-orbit',
    name: 'Deck Orbit',
    duration: 16,
    path: [
      [130, 16, 0],
      [92, 26, 92],
      [0, 34, 130],
      [-92, 28, 92],
      [-130, 20, 0],
      [-92, 26, -92],
      [0, 34, -130],
      [92, 24, -92],
      [130, 16, 0],
    ],
    look: [[0, 8, 0]],
  },
  {
    id: 'trisolar-reveal',
    name: 'Trisolar Reveal',
    duration: 12,
    path: [
      [-30, 4, 140],
      [0, 20, 60],
      [40, 80, -120],
      [110, 190, -380],
    ],
    look: [[0, 380, -1500]],
  },
  {
    id: 'among-the-suns',
    name: 'Among the Suns',
    duration: 16,
    path: [
      [380, 300, -800],
      [160, 420, -1050],
      [-140, 400, -1150],
      [-380, 330, -950],
    ],
    look: [[0, 380, -1500]],
  },
  {
    id: 'earth-moon',
    name: 'Earth & Moon',
    duration: 14,
    path: [
      [220, 70, 300],
      [190, 85, 340],
      [120, 75, 345],
      [70, 60, 290],
      [85, 50, 215],
      [150, 58, 190],
    ],
    look: [[140, 60, 260]],
  },
  {
    id: 'saturn-flyby',
    name: 'Saturn Ring Flyby',
    duration: 12,
    path: [
      [-240, 70, -140],
      [-380, 100, -230],
      [-500, 140, -290],
      [-640, 120, -390],
    ],
    look: [[-560, 110, -330]],
  },
  {
    id: 'jupiter-approach',
    name: 'Jupiter Approach',
    duration: 12,
    path: [
      [240, 50, -140],
      [360, 70, -260],
      [460, 95, -350],
      [600, 105, -480],
    ],
    look: [[540, 90, -430]],
  },
  {
    id: 'grand-tour',
    name: 'Grand Tour',
    duration: 32,
    path: [
      [0, 50, 150],
      [130, 80, 340],
      [350, 140, 500],
      [80, 150, 320],
      [-240, 60, 320],
      [-460, 120, -80],
      [-390, 150, -360],
      [-140, 190, -520],
      [20, 240, -720],
    ],
    look: [
      [140, 60, 260],
      [140, 60, 260],
      [430, 150, 530],
      [-260, 25, 230],
      [-260, 25, 230],
      [-560, 110, -330],
      [-560, 110, -330],
      [0, 380, -1500],
      [0, 380, -1500],
    ],
  },
];

const easeInOut = (t) => t * t * (3 - 2 * t);

export function createCinematics(camera) {
  let active = null; // { posCurve, lookCurve|lookPoint, duration, elapsed, onDone }
  const savedPos = new THREE.Vector3();
  const savedQuat = new THREE.Quaternion();
  const lookTarget = new THREE.Vector3();

  function toCurve(points) {
    return new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3().fromArray(p)),
      false,
      'catmullrom',
      0.5
    );
  }

  function play(shotId, onDone) {
    const shot = SHOTS.find((s) => s.id === shotId);
    if (!shot || active) return false;
    savedPos.copy(camera.position);
    savedQuat.copy(camera.quaternion);
    active = {
      shot,
      posCurve: toCurve(shot.path),
      lookCurve: shot.look.length > 1 ? toCurve(shot.look) : null,
      lookPoint: shot.look.length === 1 ? new THREE.Vector3().fromArray(shot.look[0]) : null,
      elapsed: 0,
      onDone,
    };
    document.body.classList.add('cinematic');
    return true;
  }

  function finish() {
    const done = active?.onDone;
    active = null;
    document.body.classList.remove('cinematic');
    camera.position.copy(savedPos);
    camera.quaternion.copy(savedQuat);
    done?.();
  }

  function update(dt) {
    if (!active) return false;
    active.elapsed += dt;
    const t = Math.min(active.elapsed / active.shot.duration, 1);
    const e = easeInOut(t);
    active.posCurve.getPoint(e, camera.position);
    if (active.lookCurve) active.lookCurve.getPoint(e, lookTarget);
    else lookTarget.copy(active.lookPoint);
    camera.lookAt(lookTarget);
    if (t >= 1) finish();
    return true;
  }

  return {
    play,
    stop: () => active && finish(),
    update,
    get playing() {
      return !!active;
    },
    get currentShot() {
      return active?.shot ?? null;
    },
  };
}
