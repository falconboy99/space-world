import * as THREE from 'three';

// Click Earth → fly down and stand on its surface, facing the three
// suns. While standing you can click to grab the mouse and look
// around; the Leave button (or Esc) flies you back to the deck.
const TRANSIT_SECONDS = 4;

const ease = (x) => x * x * (3 - 2 * x);

export function createEarthView({ camera, player, earth, triCenter, onStateChange }) {
  let state = 'idle'; // idle | entering | standing | leaving
  let t = 0;

  const fromPos = new THREE.Vector3();
  const fromQuat = new THREE.Quaternion();
  const standPos = new THREE.Vector3();
  const targetQuat = new THREE.Quaternion();
  const returnPos = new THREE.Vector3();
  const returnQuat = new THREE.Quaternion();
  const m = new THREE.Matrix4();

  // Stand on the side of Earth that faces the trisolar barycenter.
  function computeStandPoint(out) {
    const dir = triCenter.clone().sub(earth.position).normalize();
    return out.copy(earth.position).addScaledVector(dir, earth.radius + 2);
  }

  function setState(next) {
    state = next;
    onStateChange?.(state);
  }

  function enter() {
    if (state !== 'idle') return false;
    returnPos.copy(camera.position);
    returnQuat.copy(camera.quaternion);
    fromPos.copy(camera.position);
    fromQuat.copy(camera.quaternion);
    computeStandPoint(standPos);
    m.lookAt(standPos, triCenter, THREE.Object3D.DEFAULT_UP);
    targetQuat.setFromRotationMatrix(m);
    t = 0;
    player.controls.unlock();
    setState('entering');
    return true;
  }

  function leave() {
    if (state !== 'standing') return false;
    fromPos.copy(camera.position);
    fromQuat.copy(camera.quaternion);
    t = 0;
    player.controls.unlock();
    setState('leaving');
    return true;
  }

  function update(dt) {
    if (state === 'idle') return false;

    if (state === 'entering' || state === 'leaving') {
      t += dt / TRANSIT_SECONDS;
      const e = ease(Math.min(t, 1));
      const destPos = state === 'entering' ? standPos : returnPos;
      const destQuat = state === 'entering' ? targetQuat : returnQuat;
      camera.position.lerpVectors(fromPos, destPos, e);
      camera.quaternion.slerpQuaternions(fromQuat, destQuat, e);
      if (t >= 1) setState(state === 'entering' ? 'standing' : 'idle');
      return true;
    }

    // Standing: hold position. When the pointer is locked the player
    // looks around freely; otherwise keep gazing at the three suns.
    camera.position.copy(standPos);
    if (!player.controls.isLocked) camera.quaternion.slerp(targetQuat, 1 - Math.pow(0.02, dt));
    return true;
  }

  return {
    enter,
    leave,
    update,
    get active() {
      return state !== 'idle';
    },
    get state() {
      return state;
    },
  };
}
