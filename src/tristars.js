import * as THREE from 'three';

// A genuine gravitational three-body system. The suns start on the
// stable figure-eight choreography (Chenciner & Montgomery initial
// conditions, G = m = 1) and are integrated with velocity Verlet.
const INITIAL = {
  pos: [
    [-0.97000436, 0.24308753],
    [0.97000436, -0.24308753],
    [0, 0],
  ],
  vel: [
    [0.46620368, 0.43236573],
    [0.46620368, 0.43236573],
    [-0.93240737, -0.86473146],
  ],
};

const SUBSTEP = 0.004; // integrator step in simulation time
const SOFTENING = 1e-6;

export function createTriStars(cfg, glowTexture, sunTexture) {
  const group = new THREE.Group();
  group.name = 'triStars';
  group.position.fromArray(cfg.center);

  const bodies = INITIAL.pos.map((p, i) => ({
    pos: { x: p[0], y: p[1] },
    vel: { x: INITIAL.vel[i][0], y: INITIAL.vel[i][1] },
    acc: { x: 0, y: 0 },
  }));

  const stars = cfg.stars.map((s) => {
    const star = new THREE.Group();
    star.name = s.name;
    star.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(s.radius, 32, 32),
        new THREE.MeshBasicMaterial({ map: sunTexture, color: s.color })
      )
    );
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: s.color,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow.scale.setScalar(s.radius * cfg.glowScale);
    star.add(glow);
    star.add(new THREE.PointLight(s.color, cfg.lightIntensity, 0, 0));
    group.add(star);
    return star;
  });

  function computeAccelerations() {
    for (const b of bodies) {
      b.acc.x = 0;
      b.acc.y = 0;
    }
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        const dx = bodies[j].pos.x - bodies[i].pos.x;
        const dy = bodies[j].pos.y - bodies[i].pos.y;
        const d2 = dx * dx + dy * dy + SOFTENING;
        const inv = 1 / (Math.sqrt(d2) * d2);
        bodies[i].acc.x += dx * inv;
        bodies[i].acc.y += dy * inv;
        bodies[j].acc.x -= dx * inv;
        bodies[j].acc.y -= dy * inv;
      }
    }
  }

  computeAccelerations();

  function step(h) {
    for (const b of bodies) {
      b.vel.x += 0.5 * h * b.acc.x;
      b.vel.y += 0.5 * h * b.acc.y;
      b.pos.x += h * b.vel.x;
      b.pos.y += h * b.vel.y;
    }
    computeAccelerations();
    for (const b of bodies) {
      b.vel.x += 0.5 * h * b.acc.x;
      b.vel.y += 0.5 * h * b.acc.y;
    }
  }

  function syncStars() {
    for (let i = 0; i < 3; i++) {
      stars[i].position.set(bodies[i].pos.x * cfg.scale, bodies[i].pos.y * cfg.scale, 0);
    }
  }

  syncStars();

  return {
    group,
    stars,
    // The choreography's barycenter never moves — a fixed point to gaze at.
    center: new THREE.Vector3().fromArray(cfg.center),
    update(dt) {
      let remaining = dt * cfg.timeScale;
      while (remaining > 0) {
        const h = Math.min(SUBSTEP, remaining);
        step(h);
        remaining -= h;
      }
      syncStars();
    },
  };
}
