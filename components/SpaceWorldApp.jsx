'use client';

import { useEffect } from 'react';
import { createApp, destroyCurrentApp } from '../src/boot.js';

// Static HUD shell; the Three.js engine boots into #app on mount and
// wires these elements by id (see src/ui.js).
export default function SpaceWorldApp() {
  useEffect(() => {
    createApp();
    return () => destroyCurrentApp();
  }, []);

  return (
    <>
      <div id="app" />

      <div id="start-overlay">
        <div className="start-card">
          <h1>STELLARIS DECK</h1>
          <p className="tagline">An observation platform adrift in deep space</p>
          <button id="enter-btn">ENTER THE DECK</button>
          <div className="keys">
            WASD move &nbsp;·&nbsp; Mouse look &nbsp;·&nbsp; Shift sprint &nbsp;·&nbsp; Space jump
            <br />
            F toggle fly &nbsp;·&nbsp; E / Q up &amp; down (fly) &nbsp;·&nbsp; Esc release cursor
            <br />
            <span className="earth-tip">Click Earth to stand on it beneath the three suns</span>
          </div>
        </div>
      </div>

      <div id="crosshair" hidden></div>

      <div id="hint-bar" hidden>
        Click Earth to stand beneath the three suns · Esc opens the cinematics panel
      </div>

      <button id="leave-btn" hidden>
        ⟵ LEAVE EARTH
      </button>

      <div id="hud-right">
        <div id="cine-panel">
          <div className="panel-title">CINEMATIC SHOTS</div>
          <select id="shot-select"></select>
          <div className="row">
            <button id="play-btn">▶ Play</button>
            <button id="record-btn">⏺ Record</button>
          </div>
          <button id="record-all-btn">⏺ Record Full Set</button>
          <div id="cine-status">
            Pick a shot, then Play or Record.
            <br />
            Record downloads a .webm video.
          </div>
        </div>

        <div id="world-panel">
          <div className="panel-title">WORLD LIBRARY</div>
          <input id="world-name" placeholder="World name…" maxLength={80} />
          <button id="save-world-btn">💾 Save Current World</button>
          <select id="world-select"></select>
          <div className="row">
            <button id="load-world-btn">⟳ Load</button>
            <button id="delete-world-btn">✕ Delete</button>
          </div>
          <div id="world-status">Loading library…</div>
        </div>
      </div>

      <div id="rec-dot" hidden>
        ● REC
      </div>
      <div className="letterbox top"></div>
      <div className="letterbox bottom"></div>
    </>
  );
}
