import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// First-person movement: walk on the deck (with gravity + jump),
// or press F to fly freely (E/Q for up/down).
export function createPlayerControls(camera, domElement, config) {
  const cfg = config.player;
  const deckRadius = config.deck.radius;
  const controls = new PointerLockControls(camera, domElement);

  camera.position.fromArray(cfg.spawn);

  const keys = new Set();
  let flying = false;
  let velocityY = 0;
  let onGround = true;

  const onKeyDown = (e) => {
    keys.add(e.code);
    if (e.code === 'KeyF' && controls.isLocked) {
      flying = !flying;
      velocityY = 0;
    }
    if (e.code === 'Space' && controls.isLocked && !flying && onGround) {
      velocityY = cfg.jumpVelocity;
      onGround = false;
    }
  };
  const onKeyUp = (e) => keys.delete(e.code);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  const horizontal = new THREE.Vector2();

  function update(dt) {
    if (!controls.isLocked) return;

    const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight') ? cfg.sprintMultiplier : 1;
    const speed = (flying ? cfg.flySpeed : cfg.walkSpeed) * sprint * dt;

    let forward = 0;
    let right = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) forward += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) forward -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) right += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) right -= 1;
    if (forward && right) {
      forward *= Math.SQRT1_2;
      right *= Math.SQRT1_2;
    }
    controls.moveForward(forward * speed);
    controls.moveRight(right * speed);

    const pos = camera.position;
    if (flying) {
      if (keys.has('KeyE')) pos.y += speed;
      if (keys.has('KeyQ')) pos.y -= speed;
    } else {
      // Gravity + landing on the deck.
      velocityY -= cfg.gravity * dt;
      pos.y += velocityY * dt;
      if (pos.y <= cfg.eyeHeight) {
        pos.y = cfg.eyeHeight;
        velocityY = 0;
        onGround = true;
      }
      // Keep the walker on the platform.
      horizontal.set(pos.x, pos.z);
      const maxR = deckRadius - 2;
      if (horizontal.length() > maxR) {
        horizontal.setLength(maxR);
        pos.x = horizontal.x;
        pos.z = horizontal.y;
      }
    }
  }

  return {
    controls,
    update,
    get flying() {
      return flying;
    },
    resetToSpawn() {
      camera.position.fromArray(cfg.spawn);
      velocityY = 0;
      onGround = true;
      flying = false;
    },
    dispose() {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      if (controls.isLocked) controls.unlock();
      controls.dispose?.();
    },
  };
}
