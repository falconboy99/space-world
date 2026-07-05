// ============================================================
// SCENE CONFIG — the single source of truth for the world.
// Redesign the space by editing this file: move/recolor/resize
// planets, add moons or rings, tweak the deck, stars, nebulae.
// ============================================================

export const CONFIG = {
  space: {
    background: 0x02030a,
  },

  // The walkable observation platform at the origin.
  deck: {
    radius: 70,
    color: 0x070b16,
    gridColor: 0x1f4fff,
    rimColor: 0x37c8ff,
    postCount: 10, // glowing posts around the rim
  },

  // Trisolar system: three suns bound by real gravity, dancing on
  // the stable figure-eight choreography. Simulated in tristars.js.
  triSystem: {
    center: [0, 380, -1500],
    scale: 420, // world units per simulation unit
    glowScale: 5,
    lightIntensity: 1.0,
    timeScale: 0.15, // one full orbit ≈ 42 s of real time
    texture: '/textures/2k_sun.jpg',
    stars: [
      { name: 'Alpha', radius: 40, color: 0xfff2cf },
      { name: 'Beta', radius: 32, color: 0xffb066 },
      { name: 'Gamma', radius: 27, color: 0xff6d4f },
    ],
  },

  ambientLight: { color: 0x66707f, intensity: 2.2 },

  // The real solar system (sizes/distances compressed to stay walkable).
  planets: [
    {
      name: 'Mercury',
      radius: 8,
      position: [190, 40, -170],
      texture: '/textures/2k_mercury.jpg',
      spin: 0.005,
    },
    {
      name: 'Venus',
      radius: 17,
      position: [-170, 55, -270],
      texture: '/textures/2k_venus_atmosphere.jpg',
      spin: -0.002, // retrograde
    },
    {
      name: 'Earth',
      radius: 18,
      position: [140, 60, 260],
      texture: '/textures/2k_earth_daymap.jpg',
      clouds: '/textures/2k_earth_clouds.jpg',
      spin: 0.03,
      tilt: 0.41,
      landable: true, // click Earth to stand on it under the three suns
      moons: [{ radius: 4.5, distance: 45, speed: 0.25, texture: '/textures/2k_moon.jpg' }],
    },
    {
      name: 'Mars',
      radius: 11,
      position: [-260, 25, 230],
      texture: '/textures/2k_mars.jpg',
      spin: 0.028,
      tilt: 0.44,
    },
    {
      name: 'Jupiter',
      radius: 62,
      position: [540, 90, -430],
      texture: '/textures/2k_jupiter.jpg',
      spin: 0.07,
      tilt: 0.05,
    },
    {
      name: 'Saturn',
      radius: 52,
      position: [-560, 110, -330],
      texture: '/textures/2k_saturn.jpg',
      spin: 0.06,
      tilt: 0.47,
      rings: { inner: 62, outer: 118, texture: '/textures/2k_saturn_ring_alpha.png', opacity: 1 },
    },
    {
      name: 'Uranus',
      radius: 26,
      position: [430, 150, 530],
      texture: '/textures/2k_uranus.jpg',
      spin: 0.04,
      tilt: 1.71, // rolls on its side
    },
    {
      name: 'Neptune',
      radius: 25,
      position: [-430, -30, 570],
      texture: '/textures/2k_neptune.jpg',
      spin: 0.045,
      tilt: 0.49,
    },
  ],

  stars: { count: 9000, radius: 2600, size: 2.2 },

  nebulae: [
    { position: [-1200, 300, -900], color: 0x7a3cff, scale: 1500, opacity: 0.14 },
    { position: [1000, -200, 800], color: 0x2f7dff, scale: 1300, opacity: 0.12 },
    { position: [200, 500, 1400], color: 0xff4f9a, scale: 1100, opacity: 0.09 },
  ],

  // Distant slowly-rotating belt.
  asteroids: {
    count: 80,
    innerRadius: 550,
    outerRadius: 800,
    ySpread: 120,
    minSize: 2,
    maxSize: 9,
    color: 0x777066,
    beltSpeed: 0.008,
  },

  // Small rocks drifting near the deck for parallax while walking.
  driftRocks: {
    count: 14,
    minRadius: 90,
    maxRadius: 170,
    minY: 6,
    maxY: 50,
    minSize: 1,
    maxSize: 3.5,
    color: 0x8a8378,
    bobSpeed: 0.4,
  },

  player: {
    eyeHeight: 3,
    walkSpeed: 24,
    sprintMultiplier: 2.2,
    flySpeed: 60,
    jumpVelocity: 12,
    gravity: 30,
    spawn: [0, 3, 40], // near the deck edge, facing the hologram
  },

  bloom: { strength: 0.7, radius: 0.6, threshold: 0.7 },
};
