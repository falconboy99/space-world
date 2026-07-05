import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import './style.css';
import { CONFIG } from './config.js';
import { createWorld } from './world.js';
import { createPlayerControls } from './controls.js';
import { createCinematics } from './cinematics.js';
import { createRecorder } from './recorder.js';
import { createUI } from './ui.js';
import { createEarthView } from './earthview.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 6000);

const world = createWorld(scene);
const player = createPlayerControls(camera, renderer.domElement);
const cinematics = createCinematics(camera);
const recorder = createRecorder(renderer.domElement);
const ui = createUI({ player, cinematics, recorder });

const earthView = createEarthView({
  camera,
  player,
  earth: world.earth,
  triCenter: world.tri.center,
  onStateChange: (state) => ui.onEarthState(state),
});
ui.attachEarthView(earthView);

// ---- Click / aim handling for visiting Earth ----
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function earthHitAt(x, y) {
  if (player.controls.isLocked) ndc.set(0, 0);
  else ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObject(world.earth.hit, false).length > 0;
}

renderer.domElement.addEventListener('click', (e) => {
  if (cinematics.playing || earthView.active) return;
  if (earthHitAt(e.clientX, e.clientY)) {
    e.stopPropagation(); // don't let the HUD re-lock the pointer
    earthView.enter();
  }
});

renderer.domElement.addEventListener('mousemove', (e) => {
  if (cinematics.playing || earthView.active || player.controls.isLocked) {
    renderer.domElement.style.cursor = '';
    return;
  }
  renderer.domElement.style.cursor = earthHitAt(e.clientX, e.clientY) ? 'pointer' : '';
});

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(
  new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    CONFIG.bloom.strength,
    CONFIG.bloom.radius,
    CONFIG.bloom.threshold
  )
);
composer.addPass(new OutputPass());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

const timer = new THREE.Timer();
renderer.setAnimationLoop(() => {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);
  world.update(dt);
  if (!cinematics.update(dt) && !earthView.update(dt)) {
    player.update(dt);
    if (player.controls.isLocked) ui.setAimingAtEarth(earthHitAt(0, 0));
  }
  composer.render();
});

// Live handle for inspection and future prompted redesigns.
window.SpaceWorld = {
  THREE,
  scene,
  camera,
  world,
  player,
  cinematics,
  recorder,
  ui,
  earthView,
  config: CONFIG,
};
