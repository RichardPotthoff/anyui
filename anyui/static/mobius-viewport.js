/**
 * Canvas viewport: turtle arc-chain in world coords + one Möbius view transform.
 * 1/2/3-pointer gestures update an incremental G and compose into model.mobius.
 */

import {
  identityMobius,
  composeMobius,
  applyMobius,
  gestureMobius,
  mobiusToJSON,
  mobiusFromJSON,
  xyToC,
} from "./geom/mobius.js";
import {
  segmentsToPoints,
  segsDegreesToRadians,
  transformArcs,
} from "./geom/arcs.js";
import { C, cNorm, cExpI } from "./geom/complex.js";
import { cookieOutlines } from "./data/cookie-outlines.js";

function loadOutline(name) {
  const o = cookieOutlines[name] || cookieOutlines.Star;
  const segs = segsDegreesToRadians(o.turtlePath);
  const startAngle = ((o.startAngleDeg || 0) * Math.PI) / 180;
  return { segs, startAngle };
}

function worldBounds(segs, startAngle, pad = 1.15) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const a0 = [Math.cos(startAngle), Math.sin(startAngle)];
  for (const p of segmentsToPoints(segs, { p0: [0, 0], a0, scale: 1, tol: 0.5 })) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (!Number.isFinite(minX)) return { cx: 0, cy: 0, span: 20 };
  const cx = 0.5 * (minX + maxX);
  const cy = 0.5 * (minY + maxY);
  const span = Math.max(maxX - minX, maxY - minY, 1e-6) * pad;
  return { cx, cy, span };
}

function render({ model, el }) {
  el.innerHTML = "";
  el.classList.add("mobius-viewport");

  const wrap = document.createElement("div");
  wrap.className = "mobius-viewport-wrap";

  const bar = document.createElement("div");
  bar.className = "mobius-viewport-bar";
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Outline");
  for (const name of Object.keys(cookieOutlines)) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  }
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.textContent = "Reset view";
  const hint = document.createElement("span");
  hint.className = "mobius-viewport-hint";
  hint.textContent = "1 finger: pan · 2: pan/zoom/rotate · 3: bend";
  bar.append(select, resetBtn, hint);

  const canvas = document.createElement("canvas");
  canvas.className = "mobius-viewport-canvas";
  canvas.style.touchAction = "none";

  wrap.append(bar, canvas);
  el.appendChild(wrap);

  const outlineName = model.get("outline") || "Star";
  select.value = outlineName;

  let { segs, startAngle } = loadOutline(outlineName);
  let bounds = worldBounds(segs, startAngle);

  // Active pointers: id → { x, y }
  const pointers = new Map();
  // Gesture segment state
  let startAnchors = []; // complex[]
  let pointerOrder = []; // pointer ids in start order
  let M0 = identityMobius(); // M at gesture start
  let dragging = false;

  function currentM() {
    return mobiusFromJSON(model.get("mobius"));
  }

  function setMobius(m) {
    model.set("mobius", mobiusToJSON(m));
    model.save_changes();
  }

  function fitScale(width, height) {
    const s = Math.min(width, height) / bounds.span;
    return s;
  }

  /** World → screen via center/scale then Möbius in a plane centered on shape */
  function worldToPlane(x, y) {
    // plane coords: origin at shape center
    return xyToC(x - bounds.cx, y - bounds.cy);
  }

  function planeToScreen(z, width, height, s) {
    // screen y flipped for canvas
    const sx = width / 2 + z.re * s;
    const sy = height / 2 - z.im * s;
    return [sx, sy];
  }

  function screenToPlane(sx, sy, width, height, s) {
    return xyToC((sx - width / 2) / s, -(sy - height / 2) / s);
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

    // background
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--mv-bg") || "#f3f4f6";
    ctx.fillRect(0, 0, width, height);

    const M = currentM();
    const s = fitScale(width, height);

    // Grid in plane, mapped by M
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue("--mv-grid") || "#e5e7eb";
    ctx.lineWidth = 1;
    const gMax = bounds.span * 0.7;
    const gStep = bounds.span / 8;
    ctx.beginPath();
    for (let u = -gMax; u <= gMax + 1e-9; u += gStep) {
      for (const vertical of [true, false]) {
        const pts = [];
        for (let v = -gMax; v <= gMax + 1e-9; v += gStep / 4) {
          const z = vertical ? xyToC(u, v) : xyToC(v, u);
          const w = applyMobius(M, z);
          pts.push(planeToScreen(w, width, height, s));
        }
        if (pts.length) {
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        }
      }
    }
    ctx.stroke();

    // Outline: densify in world, map each point by M (simple + robust first version)
    // tol = max chord-to-arc error in world units ≈ pixelTol / screenScale
    const pixelTol = 0.25;
    const tolWorld = pixelTol / s;
    const a0 = [Math.cos(startAngle), Math.sin(startAngle)];
    const pts = [];
    for (const p of segmentsToPoints(segs, { p0: [0, 0], a0, scale: 1, tol: tolWorld })) {
      const z = worldToPlane(p.x, p.y);
      const w = applyMobius(M, z);
      pts.push(planeToScreen(w, width, height, s));
    }

    if (pts.length) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue("--mv-stroke") || "#2563eb";
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--mv-fill") || "rgba(37,99,235,0.08)";
      ctx.fill();
    }

    // Touch markers
    if (pointers.size) {
      ctx.fillStyle = "#0f766e";
      for (const { x, y } of pointers.values()) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, TAU);
        ctx.fill();
      }
    }
  }

  const TAU = Math.PI * 2;

  function activeCurrents() {
    const width = model.get("width") || 480;
    const height = model.get("height") || 480;
    const s = fitScale(width, height);
    return pointerOrder
      .filter((id) => pointers.has(id))
      .map((id) => {
        const { x, y } = pointers.get(id);
        return screenToPlane(x, y, width, height, s);
      });
  }

  function beginGesture() {
    M0 = currentM();
    startAnchors = activeCurrents();
    dragging = startAnchors.length > 0;
  }

  function updateGesture() {
    if (!dragging || startAnchors.length === 0) return;
    const currents = activeCurrents();
    const n = Math.min(startAnchors.length, currents.length);
    if (n < 1) return;
    const G = gestureMobius(startAnchors.slice(0, n), currents.slice(0, n));
    // Display = G ∘ M0  (screen = G(M0(world)))
    setMobius(composeMobius(G, M0));
    draw();
  }

  function endGesture() {
    dragging = false;
    startAnchors = [];
    // M already committed via setMobius during move
  }

  function pointerXY(ev) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = (model.get("width") || 480) / rect.width;
    const scaleY = (model.get("height") || 480) / rect.height;
    return {
      x: (ev.clientX - rect.left) * scaleX,
      y: (ev.clientY - rect.top) * scaleY,
    };
  }

  function onPointerDown(ev) {
    ev.preventDefault();
    canvas.setPointerCapture(ev.pointerId);
    pointers.set(ev.pointerId, pointerXY(ev));
    pointerOrder.push(ev.pointerId);
    // Count changed → new segment
    endGesture();
    beginGesture();
    draw();
  }

  function onPointerMove(ev) {
    if (!pointers.has(ev.pointerId)) return;
    pointers.set(ev.pointerId, pointerXY(ev));
    updateGesture();
  }

  function onPointerUp(ev) {
    pointers.delete(ev.pointerId);
    pointerOrder = pointerOrder.filter((id) => id !== ev.pointerId);
    try {
      canvas.releasePointerCapture(ev.pointerId);
    } catch (_) {}
    endGesture();
    if (pointers.size > 0) beginGesture();
    draw();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  select.addEventListener("change", () => {
    model.set("outline", select.value);
    model.save_changes();
    ({ segs, startAngle } = loadOutline(select.value));
    bounds = worldBounds(segs, startAngle);
    setMobius(identityMobius());
    draw();
  });

  resetBtn.addEventListener("click", () => {
    setMobius(identityMobius());
    draw();
  });

  model.on("change:mobius", draw);
  model.on("change:width", draw);
  model.on("change:height", draw);
  model.on("change:outline", () => {
    select.value = model.get("outline") || "Star";
    ({ segs, startAngle } = loadOutline(select.value));
    bounds = worldBounds(segs, startAngle);
    draw();
  });

  draw();

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    model.off("change:mobius", draw);
  };
}

export default { render };
