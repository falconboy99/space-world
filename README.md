# Stellaris Deck — Walkable 3D Space World

**Live demo:** https://space-world-eight.vercel.app/

A Next.js + Three.js website: a glowing observation platform adrift in deep
space, surrounded by the real solar system — Mercury through Neptune with
NASA-style textures (Solar System Scope, CC BY 4.0), Saturn's rings, and
Earth's moon and clouds. Overhead, a **trisolar system**: three suns bound by
real gravity, integrated live on the stable figure-eight three-body
choreography. Walk around in first person, fly freely, click Earth to stand
on its surface beneath the three suns, record cinematic camera shots as video
files — and save whole world designs to **PostgreSQL** through the built-in
**World Library**.

## Stack

- **Next.js (App Router)** — serves the 3D frontend and the backend API
  (route handlers under `app/api/`).
- **PostgreSQL** — stores named world configurations as JSONB.
- **Three.js** — the 3D engine (plain ES modules under `src/`, booted from a
  React client component).

## Run it

```bash
# 1. Start a local PostgreSQL (or point DATABASE_URL at any Postgres)
docker run -d --name spaceworld-postgres \
  -e POSTGRES_USER=spaceworld -e POSTGRES_PASSWORD=spaceworld \
  -e POSTGRES_DB=spaceworld -p 5433:5432 postgres:16-alpine

# 2. Configure the connection
cp .env.example .env.local

# 3. Install and run
npm install
npm run dev
```

The app works without a database too — the World Library panel just shows
"No database configured" until `DATABASE_URL` is set. The `worlds` table is
created automatically on first use.

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
| Esc | Release cursor → opens the side panels |
| Click Earth | Fly down and stand on Earth facing the three suns |
| Leave Earth / Esc | Return from Earth to the deck |

## Cinematics & video

The Cinematic Shots panel lists camera shots. **Play** previews a shot,
**Record** plays it while capturing the canvas and downloads a `.webm` video,
and **Record Full Set** records every shot back-to-back into a single file.

## World Library (PostgreSQL)

The World Library panel saves the current world configuration under a name
and lets you load or delete saved designs. Loading rebuilds the entire scene
from the stored config.

API:

- `GET /api/worlds` — list saved worlds
- `POST /api/worlds` — `{ name, config }`, upserts by name
- `GET /api/worlds/:id` — fetch one world with its full config
- `DELETE /api/worlds/:id` — remove a world

## Deploying (Vercel)

Pushing to `main` auto-deploys. To enable the World Library in production,
add a Postgres integration (e.g. Neon) from the Vercel dashboard — it sets
`DATABASE_URL` automatically, and the schema bootstraps itself.

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
- [src/boot.js](src/boot.js) — engine lifecycle (boot / destroy / reboot).
- [src/controls.js](src/controls.js) — movement feel.
- [src/ui.js](src/ui.js) / [app/globals.css](app/globals.css) — HUD and
  styling; the HUD DOM lives in
  [components/SpaceWorldApp.jsx](components/SpaceWorldApp.jsx).
- [lib/db.js](lib/db.js) + [app/api/worlds](app/api/worlds) — the PostgreSQL
  layer and REST API.

In the browser console, `window.SpaceWorld` exposes the live `scene`,
`camera`, `world`, `cinematics`, `recorder`, and `config` for
experimentation — tweak `config` and hit "Save Current World" to persist a
design.
