/**
 * SimpleContent – minimal drawing layer that shares a view with PointHandles.
 * Draws an optional grid and a fixed polygon so we can see registration
 * when the view changes.
 *
 * Traits:
 *   view {scale, tx, ty}
 *   width, height
 *   color          – stroke colour (default #2563eb)
 *   background     – canvas fill colour, or null/false for clear (transparent)
 *   showGrid       – boolean (default true)
 *   visible        – if false, draw nothing (default true)
 *   shape          – optional array of [x,y] plane points (closed path)
 *   mobius         – optional {a,b,c,d} each {re,im} (or null). When set,
 *                    plane points are mapped through M before the view V.
 *                    Grid lines are densified so curves stay smooth.
 */

import { applyMobius, mobiusFromJSON } from "./geom/mobius.js";
import { C } from "./geom/complex.js";

function defaultShape() {
  return [
    [0, 1.6],
    [0.5, 0.5],
    [1.5, 0.5],
    [0.7, -0.2],
    [1.0, -1.3],
    [0, -0.6],
    [-1.0, -1.3],
    [-0.7, -0.2],
    [-1.5, 0.5],
    [-0.5, 0.5],
  ];
}

function render({ model, el }) {
  el.innerHTML = "";
  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "none";
  el.appendChild(canvas);

  function getView() {
    return model.get("view") || { scale: 1, tx: 0, ty: 0 };
  }

  function getMobius() {
    const raw = model.get("mobius");
    if (!raw) return null;
    try {
      return mobiusFromJSON(raw);
    } catch (_) {
      return null;
    }
  }

  /** Map plane (x,y) → screen, optionally through M then V. */
  function planeToScreen(x, y, width, height, view, m) {
    let px = x;
    let py = y;
    if (m) {
      const w = applyMobius(m, C(x, y));
      if (!Number.isFinite(w.re) || !Number.isFinite(w.im)) {
        return [NaN, NaN];
      }
      px = w.re;
      py = w.im;
    }
    return [
      width / 2 + (px * view.scale + view.tx),
      height / 2 - (py * view.scale + view.ty),
    ];
  }

  function draw() {
    const width = model.get("width") || 480;
    const height = model.get("height") || 480;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (model.get("visible") === false) return;

    const bg = model.get("background");
    if (bg !== null && bg !== false && bg !== undefined) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }

    const view = getView();
    const m = getMobius();
    const showGrid = model.get("showGrid") !== false;

    if (showGrid) {
      const step = 1;
      const extent = 4;
      // Densify when M is present so lines become smooth curves
      const samples = m ? 48 : 1;

      ctx.strokeStyle = m ? "#fdba74" : "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let u = -extent; u <= extent; u += step) {
        // vertical line x = u
        let started = false;
        for (let i = 0; i <= samples; i++) {
          const v = -extent + (2 * extent * i) / samples;
          const [sx, sy] = planeToScreen(u, v, width, height, view, m);
          if (!Number.isFinite(sx) || !Number.isFinite(sy)) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else ctx.lineTo(sx, sy);
        }
        // horizontal line y = u
        started = false;
        for (let i = 0; i <= samples; i++) {
          const v = -extent + (2 * extent * i) / samples;
          const [sx, sy] = planeToScreen(v, u, width, height, view, m);
          if (!Number.isFinite(sx) || !Number.isFinite(sy)) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();

      // axes
      ctx.strokeStyle = m ? "#ea580c" : "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const [axis, horizontal] of [
        [0, false],
        [0, true],
      ]) {
        let started = false;
        for (let i = 0; i <= samples; i++) {
          const t = -extent + (2 * extent * i) / samples;
          const [sx, sy] = horizontal
            ? planeToScreen(t, 0, width, height, view, m)
            : planeToScreen(0, t, width, height, view, m);
          if (!Number.isFinite(sx) || !Number.isFinite(sy)) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();
    }

    // Shape: densify edges a bit when M is active
    const shape = model.get("shape") || defaultShape();
    const color = model.get("color") || "#2563eb";
    const edgeSamples = m ? 12 : 1;

    ctx.beginPath();
    let first = true;
    for (let i = 0; i < shape.length; i++) {
      const [x0, y0] = shape[i];
      const [x1, y1] = shape[(i + 1) % shape.length];
      for (let s = 0; s < edgeSamples; s++) {
        const t = s / edgeSamples;
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t;
        const [sx, sy] = planeToScreen(x, y, width, height, view, m);
        if (!Number.isFinite(sx) || !Number.isFinite(sy)) {
          first = true;
          continue;
        }
        if (first) {
          ctx.moveTo(sx, sy);
          first = false;
        } else ctx.lineTo(sx, sy);
      }
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.fillStyle = color.length === 7 ? color + "14" : "rgba(37, 99, 235, 0.08)";
    ctx.fill();
  }

  function onChange() {
    draw();
  }

  model.on("change:view", onChange);
  model.on("change:width", onChange);
  model.on("change:height", onChange);
  model.on("change:color", onChange);
  model.on("change:background", onChange);
  model.on("change:showGrid", onChange);
  model.on("change:visible", onChange);
  model.on("change:shape", onChange);
  model.on("change:mobius", onChange);

  draw();

  return () => {
    model.off("change:view", onChange);
    model.off("change:width", onChange);
    model.off("change:height", onChange);
    model.off("change:color", onChange);
    model.off("change:background", onChange);
    model.off("change:showGrid", onChange);
    model.off("change:visible", onChange);
    model.off("change:shape", onChange);
    model.off("change:mobius", onChange);
  };
}

export default { render };
