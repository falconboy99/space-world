# Stellaris Deck — Walkable 3D Space World

A Three.js website: a glowing observation platform adrift in deep space,
surrounded by the real solar system — Mercury through Neptune with NASA-style
textures (Solar System Scope, CC BY 4.0), Saturn's rings, and Earth's moon and
clouds. Overhead, a **trisolar system**: three suns bound by real gravity,
integrated live on the stable figure-eight three-body choreography. Walk
around in first person, fly freely, click Earth to stand on its surface
beneath the three suns, and record cinematic camera shots as video files.

## Run it

```bash
npm install
npm run dev
```

## Controls

| Input | Action |
| --- | --- |
| Click | Enter / capture the mouse |
| WASD / arrows | Move |
| Mouse | Look |
| Shift | Sprint |
| Space | Jump (walk mode) |
| F | Toggle fly mode |
| E / Q | Up / down (fly mode) |
| Esc | Release cursor → opens the cinematics panel |
| Click Earth | Fly down and stand on Earth facing the three suns |
| Leave Earth / Esc | Return from Earth to the deck |

## Cinematics & video

The panel in the top-right lists camera shots. **Play** previews a shot,
**Record** plays it while capturing the canvas and downloads a `.webm` video,
and **Record Full Set** records every shot back-to-back into a single file.

## How to redesign / extend (prompt-friendly layout)

The world is fully config-driven, so changes are usually one-file edits:

- [src/config.js](src/config.js) — **the world itself**: planets (position,
  size, texture, rings, moons, tilt), the trisolar system, stars, nebulae,
  asteroid belt, deck size and colors, player speeds, bloom. Add a planet by
  adding an object to `planets`; textures live in `public/textures/`.
- [src/tristars.js](src/tristars.js) — the gravitational three-body
  simulation (figure-eight choreography, velocity-Verlet integrator).
- [src/earthview.js](src/earthview.js) — the click-Earth → stand-on-Earth
  camera sequence.
- [src/cinematics.js](src/cinematics.js) — **the shot library**: each shot is
  a spline camera path plus a look target. Add shots here to build new video
  sets.
- [src/world.js](src/world.js) — how config becomes meshes (new object types
  go here).
- [src/controls.js](src/controls.js) — movement feel.
- [src/ui.js](src/ui.js) / [src/style.css](src/style.css) — HUD and styling.

In the browser console, `window.SpaceWorld` exposes the live `scene`,
`camera`, `world`, `cinematics`, and `recorder` for experimentation.
