import * as THREE from 'three';
import { createTriStars } from './tristars.js';

const textureLoader = new THREE.TextureLoader();

function loadTexture(path) {
  const tex = textureLoader.load(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Soft radial-gradient texture shared by the sun glows and nebulae.
function makeGlowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildDeck(cfg) {
  const deck = new THREE.Group();
  deck.name = 'deck';

  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(cfg.radius, cfg.radius * 1.02, 2, 96),
    new THREE.MeshStandardMaterial({ color: cfg.color, metalness: 0.15, roughness: 0.85 })
  );
  floor.position.y = -1;
  deck.add(floor);

  const grid = new THREE.PolarGridHelper(cfg.radius, 16, 8, 96, cfg.gridColor, cfg.gridColor);
  grid.position.y = 0.05;
  grid.material.transparent = true;
  grid.material.opacity = 0.4;
  deck.add(grid);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(cfg.radius, 0.5, 12, 160),
    new THREE.MeshBasicMaterial({ color: cfg.rimColor })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.4;
  deck.add(rim);

  const postGeo = new THREE.CylinderGeometry(0.25, 0.25, 3, 8);
  const postMat = new THREE.MeshBasicMaterial({ color: cfg.rimColor });
  for (let i = 0; i < cfg.postCount; i++) {
    const a = (i / cfg.postCount) * Math.PI * 2;
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(Math.cos(a) * (cfg.radius - 2), 1.5, Math.sin(a) * (cfg.radius - 2));
    deck.add(post);
  }

  // Central holographic beacon.
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 3, 1.2, 32),
    new THREE.MeshStandardMaterial({ color: 0x0d1424, metalness: 0.8, roughness: 0.3 })
  );
  pedestal.position.y = 0.6;
  deck.add(pedestal);

  const holo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3, 2),
    new THREE.MeshBasicMaterial({
      color: cfg.rimColor,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  holo.name = 'hologram';
  holo.position.y = 7;
  deck.add(holo);

  return deck;
}

function buildStars(cfg) {
  const positions = new Float32Array(cfg.count * 3);
  const colors = new Float32Array(cfg.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < cfg.count; i++) {
    // Random point on a thick spherical shell.
    const r = cfg.radius * (0.75 + Math.random() * 0.25);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const tint = Math.random();
    if (tint < 0.75) color.setHSL(0, 0, 0.7 + Math.random() * 0.3);
    else if (tint < 0.9) color.setHSL(0.6, 0.6, 0.75);
    else color.setHSL(0.09, 0.7, 0.75);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: cfg.size,
    vertexColors: true,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const stars = new THREE.Points(geo, mat);
  stars.name = 'stars';
  return stars;
}

// Ring geometry with UVs remapped radially so ring-strip textures
// (like Saturn's) wrap correctly.
function makeRingGeometry(inner, outer) {
  const geo = new THREE.RingGeometry(inner, outer, 128, 1);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
  }
  return geo;
}

function buildPlanet(p) {
  const group = new THREE.Group();
  group.name = p.name;
  group.position.fromArray(p.position);
  if (p.tilt) group.rotation.z = p.tilt;

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(p.radius, 48, 48),
    p.texture
      ? new THREE.MeshStandardMaterial({ map: loadTexture(p.texture), roughness: 1, metalness: 0 })
      : new THREE.MeshStandardMaterial({
          color: p.color ?? 0x888888,
          emissive: p.emissive ?? 0x000000,
          roughness: p.roughness ?? 0.9,
          metalness: 0.05,
        })
  );
  body.name = `${p.name}-body`;
  group.add(body);

  let clouds = null;
  if (p.clouds) {
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(p.radius * 1.015, 48, 48),
      new THREE.MeshStandardMaterial({
        map: loadTexture(p.clouds),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        roughness: 1,
      })
    );
    group.add(clouds);
  }

  if (p.rings) {
    const mat = p.rings.texture
      ? new THREE.MeshBasicMaterial({
          map: loadTexture(p.rings.texture),
          transparent: true,
          opacity: p.rings.opacity ?? 1,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      : new THREE.MeshBasicMaterial({
          color: p.rings.color,
          transparent: true,
          opacity: p.rings.opacity ?? 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
    const ring = new THREE.Mesh(makeRingGeometry(p.rings.inner, p.rings.outer), mat);
    ring.rotation.x = -Math.PI / 2 + (p.rings.tilt ?? 0);
    group.add(ring);
  }

  const moonPivots = [];
  for (const m of p.moons ?? []) {
    const pivot = new THREE.Object3D();
    pivot.rotation.y = Math.random() * Math.PI * 2;
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(m.radius, 24, 24),
      m.texture
        ? new THREE.MeshStandardMaterial({ map: loadTexture(m.texture), roughness: 1 })
        : new THREE.MeshStandardMaterial({ color: m.color ?? 0x9aa3b5, roughness: 0.95 })
    );
    moon.position.x = m.distance;
    pivot.add(moon);
    group.add(pivot);
    moonPivots.push({ pivot, speed: m.speed });
  }

  return { group, body, clouds, spin: p.spin ?? 0, moonPivots, config: p };
}

function buildNebulae(list, glowTexture) {
  const group = new THREE.Group();
  group.name = 'nebulae';
  for (const n of list) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: n.color,
        transparent: true,
        opacity: n.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    sprite.position.fromArray(n.position);
    sprite.scale.setScalar(n.scale);
    group.add(sprite);
  }
  return group;
}

function buildAsteroidBelt(cfg) {
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 1 });
  const belt = new THREE.InstancedMesh(geo, mat, cfg.count);
  belt.name = 'asteroidBelt';
  const dummy = new THREE.Object3D();
  for (let i = 0; i < cfg.count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = cfg.innerRadius + Math.random() * (cfg.outerRadius - cfg.innerRadius);
    dummy.position.set(Math.cos(a) * r, (Math.random() - 0.5) * cfg.ySpread, Math.sin(a) * r);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    const s = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
    dummy.scale.set(s, s * (0.6 + Math.random() * 0.8), s);
    dummy.updateMatrix();
    belt.setMatrixAt(i, dummy.matrix);
  }
  return belt;
}

function buildDriftRocks(cfg) {
  const group = new THREE.Group();
  group.name = 'driftRocks';
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 1 });
  const rocks = [];
  for (let i = 0; i < cfg.count; i++) {
    const rock = new THREE.Mesh(geo, mat);
    const a = Math.random() * Math.PI * 2;
    const r = cfg.minRadius + Math.random() * (cfg.maxRadius - cfg.minRadius);
    const y = cfg.minY + Math.random() * (cfg.maxY - cfg.minY);
    rock.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    rock.scale.setScalar(cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize));
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    group.add(rock);
    rocks.push({ rock, baseY: y, phase: Math.random() * Math.PI * 2, spin: 0.1 + Math.random() * 0.3 });
  }
  return { group, rocks };
}

// Builds the whole scene from the given config and returns handles +
// an update loop. The config shape is defined in config.js.
export function createWorld(scene, config) {
  const glowTexture = makeGlowTexture();

  scene.background = new THREE.Color(config.space.background);
  scene.add(new THREE.AmbientLight(config.ambientLight.color, config.ambientLight.intensity));

  const deck = buildDeck(config.deck);
  scene.add(deck);

  scene.add(buildStars(config.stars));
  scene.add(buildNebulae(config.nebulae, glowTexture));

  const tri = createTriStars(config.triSystem, glowTexture, loadTexture(config.triSystem.texture));
  scene.add(tri.group);

  const planets = config.planets.map((p) => {
    const built = buildPlanet(p);
    scene.add(built.group);
    return built;
  });

  // The landable planet (Earth) gets a generous invisible hit sphere
  // so it's easy to click from the deck.
  const landable = planets.find((p) => p.config.landable);
  let earth = null;
  if (landable) {
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(landable.config.radius * 1.8, 16, 16),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.name = 'earth-hit';
    landable.group.add(hit);
    earth = {
      group: landable.group,
      body: landable.body,
      hit,
      radius: landable.config.radius,
      position: new THREE.Vector3().fromArray(landable.config.position),
    };
  }

  const belt = buildAsteroidBelt(config.asteroids);
  scene.add(belt);

  const drift = buildDriftRocks(config.driftRocks);
  scene.add(drift.group);

  const hologram = deck.getObjectByName('hologram');
  let elapsed = 0;

  return {
    planets,
    deck,
    earth,
    tri,
    update(dt) {
      elapsed += dt;
      tri.update(dt);
      for (const p of planets) {
        p.body.rotation.y += p.spin * dt;
        if (p.clouds) p.clouds.rotation.y += p.spin * 1.3 * dt;
        for (const m of p.moonPivots) m.pivot.rotation.y += m.speed * dt;
      }
      belt.rotation.y += config.asteroids.beltSpeed * dt;
      hologram.rotation.y += 0.4 * dt;
      hologram.rotation.x += 0.15 * dt;
      for (const d of drift.rocks) {
        d.rock.position.y = d.baseY + Math.sin(elapsed * config.driftRocks.bobSpeed + d.phase) * 1.5;
        d.rock.rotation.y += d.spin * dt;
      }
    },
  };
}
