/**
 * Canvas viewport: turtle arc-chain + one Möbius view transform.
 *
 * Modes:
 *  - fixPointCount 0 ("None"): free 1/2/3-pointer gestures (pan / similarity / bend)
 *  - fixPointCount 2 or 3: show markers; Move or Drag the selected point via the canvas
 */

import {
  identityMobius,
  composeMobiusRaw,
  guardAndNormalize,
  applyMobius,
  invertMobius,
  gestureMobius,
  mobiusFromThreePairs,
  similarityMobius,
  translationMobius,
  mobiusToJSON,
  mobiusFromJSON,
  xyToC,
} from "./geom/mobius.js";
import {
  segmentsToPoints,
  segsDegreesToRadians,
} from "./geom/arcs.js";
import { C, cSub, cMul, cDiv, cAbs } from "./geom/complex.js";
import { cookieOutlines } from "./data/cookie-outlines.js";

const TAU = Math.PI * 2;

function loadOutline(name) {
  const o = cookieOutlines[name] || cookieOutlines.Star;
  const segs = segsDegreesToRadians(o.turtlePath);
  const startAngle = ((o.startAngleDeg || 0) * Math.PI) / 180;
  return { segs, startAngle };
}

function worldBounds(segs, startAngle, pad = 1.15) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
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

/** Default plane-space fix points around the origin (shape center). */
function defaultFixPoints(count, span) {
  const r = 0.35 * span;
  if (count === 2) return [C(-r, 0), C(r, 0)];
  if (count === 3) {
    return [0, 1, 2].map((k) => {
      const a = Math.PI / 2 + (k * 2 * Math.PI) / 3;
      return C(r * Math.cos(a), r * Math.sin(a));
    });
  }
  return [];
}

function packPoints(pts) {
  return pts.map((z) => [z.re, z.im]);
}

function unpackPoints(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((p) => (Array.isArray(p) ? C(p[0], p[1]) : C(p)));
}

function render({ model, el }) {
  el.innerHTML = "";
  el.classList.add("mobius-viewport");

  const wrap = document.createElement("div");
  wrap.className = "mobius-viewport-wrap";

  // --- top bar: outline, fix-point count, reset ---
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

  const fixCountSel = document.createElement("select");
  fixCountSel.setAttribute("aria-label", "Fix points");
  for (const [val, label] of [
    [0, "— Fix points —"],
    [2, "2 fix points"],
    [3, "3 fix points"],
  ]) {
    const opt = document.createElement("option");
    opt.value = String(val);
    opt.textContent = label;
    fixCountSel.appendChild(opt);
  }

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.textContent = "Reset view";

  const hint = document.createElement("span");
  hint.className = "mobius-viewport-hint";

  bar.append(select, fixCountSel, resetBtn, hint);

  // --- secondary bar: point + action (only when count ≥ 2) ---
  const editBar = document.createElement("div");
  editBar.className = "mobius-viewport-bar mobius-viewport-editbar";
  editBar.hidden = true;

  const pointSel = document.createElement("select");
  pointSel.setAttribute("aria-label", "Active point");

  const actionSel = document.createElement("select");
  actionSel.setAttribute("aria-label", "Action");
  for (const [val, label] of [
    ["drag", "Drag (edit transform)"],
    ["move", "Move (reposition handle)"],
  ]) {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = label;
    actionSel.appendChild(opt);
  }

  editBar.append(pointSel, actionSel);

  const canvas = document.createElement("canvas");
  canvas.className = "mobius-viewport-canvas";
  canvas.style.touchAction = "none";

  wrap.append(bar, editBar, canvas);
  el.appendChild(wrap);

  // --- model-backed state ---
  const outlineName = model.get("outline") || "Star";
  select.value = outlineName;

  let { segs, startAngle } = loadOutline(outlineName);
  let bounds = worldBounds(segs, startAngle);

  let fixPointCount = model.get("fixPointCount") ?? 0;
  if (fixPointCount === 1) fixPointCount = 0;
  fixCountSel.value = String(fixPointCount);

  let fixPoints = unpackPoints(model.get("fixPoints"));
  let activePoint = model.get("activePoint") ?? 0;
  let fixAction = model.get("fixAction") || "drag";
  actionSel.value = fixAction;

  function syncPointOptions() {
    pointSel.innerHTML = "";
    for (let i = 0; i < fixPointCount; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = `Point ${i + 1}`;
      pointSel.appendChild(opt);
    }
    if (activePoint >= fixPointCount) activePoint = 0;
    pointSel.value = String(activePoint);
    editBar.hidden = fixPointCount < 2;
    updateHint();
  }

  function updateHint() {
    if (fixPointCount < 2) {
      hint.textContent = "1 finger / mouse: pan · 2: pan/zoom/rotate · 3: bend";
    } else {
      hint.textContent =
        fixAction === "drag"
          ? "Drag on canvas to move the selected handle (recomputes transform)"
          : "Drag on canvas to reposition the handle (transform unchanged)";
    }
  }

  function ensureFixPoints(count) {
    if (count < 2) {
      fixPoints = [];
      return;
    }
    if (fixPoints.length !== count) {
      fixPoints = defaultFixPoints(count, bounds.span);
    }
  }

  ensureFixPoints(fixPointCount);
  syncPointOptions();

  function persistFixState() {
    model.set("fixPointCount", fixPointCount);
    model.set("fixPoints", packPoints(fixPoints));
    model.set("activePoint", activePoint);
    model.set("fixAction", fixAction);
    model.save_changes();
  }

  // Free multi-touch gesture state (count === 0)
  const pointers = new Map();
  let startAnchors = [];
  let pointerOrder = [];
  let M0 = identityMobius();
  let freeDragging = false;

  // Fix-point single-pointer edit
  let fixEditing = false;
  let fixPointerId = null;
  let dragStartImages = []; // plane images M(z_j) at drag start
  let dragStartZs = []; // plane z_j at drag start (for drag mode)

  function currentM() {
    return mobiusFromJSON(model.get("mobius"));
  }

  function currentRmax() {
    const gMax = bounds.span * 0.7;
    const corner = Math.hypot(gMax, gMax);
    const poleFactor = 1.0;
    return corner * poleFactor;
  }

  function setMobius(m) {
    const safe = guardAndNormalize(m, currentRmax());
    model.set("mobius", mobiusToJSON(safe));
    model.save_changes();
  }

  function fitScale(width, height) {
    return Math.min(width, height) / bounds.span;
  }

  function worldToPlane(x, y) {
    return xyToC(x - bounds.cx, y - bounds.cy);
  }

  function planeToScreen(z, width, height, s) {
    return [width / 2 + z.re * s, height / 2 - z.im * s];
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

    ctx.fillStyle =
      getComputedStyle(canvas).getPropertyValue("--mv-bg") || "#f3f4f6";
    ctx.fillRect(0, 0, width, height);

    const M = currentM();
    const s = fitScale(width, height);

    // Grid
    ctx.strokeStyle =
      getComputedStyle(canvas).getPropertyValue("--mv-grid") || "#e2e8f0";
    ctx.lineWidth = 1;
    const gMax = bounds.span * 0.7;
    const gStep = bounds.span / 8;
    ctx.beginPath();
    for (let u = -gMax; u <= gMax + 1e-9; u += gStep) {
      for (const vertical of [true, false]) {
        const line = [];
        for (let v = -gMax; v <= gMax + 1e-9; v += gStep / 4) {
          const z = vertical ? xyToC(u, v) : xyToC(v, u);
          line.push(planeToScreen(applyMobius(M, z), width, height, s));
        }
        if (line.length) {
          ctx.moveTo(line[0][0], line[0][1]);
          for (let i = 1; i < line.length; i++) ctx.lineTo(line[i][0], line[i][1]);
        }
      }
    }
    ctx.stroke();

    // Outline
    const pixelTol = 0.5;
    const tolWorld = pixelTol / s;
    const a0 = [Math.cos(startAngle), Math.sin(startAngle)];
    const outlinePts = [];
    for (const p of segmentsToPoints(segs, {
      p0: [0, 0],
      a0,
      scale: 1,
      tol: tolWorld,
    })) {
      const z = worldToPlane(p.x, p.y);
      outlinePts.push(planeToScreen(applyMobius(M, z), width, height, s));
    }
    if (outlinePts.length) {
      ctx.beginPath();
      ctx.moveTo(outlinePts[0][0], outlinePts[0][1]);
      for (let i = 1; i < outlinePts.length; i++) {
        ctx.lineTo(outlinePts[i][0], outlinePts[i][1]);
      }
      ctx.closePath();
      ctx.strokeStyle =
        getComputedStyle(canvas).getPropertyValue("--mv-stroke") || "#2563eb";
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.fillStyle =
        getComputedStyle(canvas).getPropertyValue("--mv-fill") ||
        "rgba(37,99,235,0.08)";
      ctx.fill();
    }

    // Fix-point markers (plane z_i → screen via M)
    if (fixPointCount >= 2 && fixPoints.length >= fixPointCount) {
      for (let i = 0; i < fixPointCount; i++) {
        const w = applyMobius(M, fixPoints[i]);
        const [sx, sy] = planeToScreen(w, width, height, s);
        const active = i === activePoint;

        ctx.beginPath();
        ctx.arc(sx, sy, active ? 11 : 9, 0, TAU);
        ctx.fillStyle = active
          ? "rgba(15, 118, 110, 0.35)"
          : "rgba(100, 116, 139, 0.25)";
        ctx.fill();
        ctx.strokeStyle = active ? "#0f766e" : "#94a3b8";
        ctx.lineWidth = active ? 2 : 1.5;
        ctx.stroke();

        if (active) {
          // Hairline cross
          ctx.beginPath();
          ctx.moveTo(sx - 16, sy);
          ctx.lineTo(sx + 16, sy);
          ctx.moveTo(sx, sy - 16);
          ctx.lineTo(sx, sy + 16);
          ctx.strokeStyle = "#0f766e";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = active ? "#0f766e" : "#64748b";
        ctx.font = "12px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(i + 1), sx, sy - 14);
      }
    }

    // Free-gesture contact dots
    if (fixPointCount < 2 && pointers.size) {
      ctx.fillStyle = "#0f766e";
      for (const { x, y } of pointers.values()) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, TAU);
        ctx.fill();
      }
    }
  }

  // ----- free multi-touch (fixPointCount === 0) -----
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

  function beginFreeGesture() {
    M0 = currentM();
    startAnchors = activeCurrents();
    freeDragging = startAnchors.length > 0;
  }

  function updateFreeGesture() {
    if (!freeDragging || startAnchors.length === 0) return;
    const currents = activeCurrents();
    const n = Math.min(startAnchors.length, currents.length);
    if (n < 1) return;
    const Rmax = currentRmax();
    const G = gestureMobius(
      startAnchors.slice(0, n),
      currents.slice(0, n),
      1e-8,
      Rmax
    );
    setMobius(composeMobiusRaw(G, M0));
    draw();
  }

  function endFreeGesture() {
    freeDragging = false;
    startAnchors = [];
  }

  // ----- fix-point Move / Drag -----
  function beginFixEdit(planeFinger) {
    const M = currentM();
    dragStartZs = fixPoints.map((z) => C(z));
    dragStartImages = fixPoints.map((z) => applyMobius(M, z));
    fixEditing = true;

    if (fixAction === "move") {
      // Exact inverse — do not pole-guard the inverse map
      const Minv = invertMobius(M);
      fixPoints[activePoint] = applyMobius(Minv, planeFinger);
      persistFixState();
      draw();
    } else {
      updateFixDrag(planeFinger);
    }
  }

  function updateFixDrag(planeFinger) {
    if (!fixEditing) return;
    const i = activePoint;
    const n = fixPointCount;
    if (n < 2 || i < 0 || i >= n) return;

    if (fixAction === "move") {
      const M = currentM();
      const Minv = invertMobius(M);
      fixPoints[i] = applyMobius(Minv, planeFinger);
      persistFixState();
      draw();
      return;
    }

    // Drag: recompute M so M(z_j) match targets (selected image follows finger)
    const zs = dragStartZs;
    const ws = dragStartImages.map((w, j) => (j === i ? planeFinger : w));

    let Mnew;
    if (n === 2) {
      const dz = cSub(zs[1], zs[0]);
      const dw = cSub(ws[1], ws[0]);
      if (cAbs(dz) < 1e-12) {
        Mnew = translationMobius(cSub(ws[0], zs[0]));
      } else {
        const alpha = cDiv(dw, dz);
        const beta = cSub(ws[0], cMul(alpha, zs[0]));
        Mnew = similarityMobius(alpha, beta);
      }
    } else {
      Mnew = mobiusFromThreePairs(
        zs[0],
        ws[0],
        zs[1],
        ws[1],
        zs[2],
        ws[2],
        currentRmax()
      );
    }
    setMobius(Mnew);
    draw();
  }

  function endFixEdit() {
    fixEditing = false;
    fixPointerId = null;
    dragStartImages = [];
    dragStartZs = [];
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
    const xy = pointerXY(ev);
    const width = model.get("width") || 480;
    const height = model.get("height") || 480;
    const s = fitScale(width, height);
    const plane = screenToPlane(xy.x, xy.y, width, height, s);

    if (fixPointCount >= 2) {
      // Single-pointer fix-point editor
      if (fixPointerId == null) {
        fixPointerId = ev.pointerId;
        beginFixEdit(plane);
      }
      return;
    }

    // Free multi-touch
    pointers.set(ev.pointerId, xy);
    pointerOrder.push(ev.pointerId);
    endFreeGesture();
    beginFreeGesture();
    draw();
  }

  function onPointerMove(ev) {
    const xy = pointerXY(ev);
    const width = model.get("width") || 480;
    const height = model.get("height") || 480;
    const s = fitScale(width, height);
    const plane = screenToPlane(xy.x, xy.y, width, height, s);

    if (fixPointCount >= 2) {
      if (ev.pointerId === fixPointerId && fixEditing) {
        updateFixDrag(plane);
      }
      return;
    }

    if (!pointers.has(ev.pointerId)) return;
    pointers.set(ev.pointerId, xy);
    updateFreeGesture();
  }

  function onPointerUp(ev) {
    if (fixPointCount >= 2) {
      if (ev.pointerId === fixPointerId) {
        endFixEdit();
        try {
          canvas.releasePointerCapture(ev.pointerId);
        } catch (_) {}
      }
      draw();
      return;
    }

    pointers.delete(ev.pointerId);
    pointerOrder = pointerOrder.filter((id) => id !== ev.pointerId);
    try {
      canvas.releasePointerCapture(ev.pointerId);
    } catch (_) {}
    endFreeGesture();
    if (pointers.size > 0) beginFreeGesture();
    draw();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  // --- controls ---
  select.addEventListener("change", () => {
    model.set("outline", select.value);
    model.save_changes();
    ({ segs, startAngle } = loadOutline(select.value));
    bounds = worldBounds(segs, startAngle);
    setMobius(identityMobius());
    if (fixPointCount >= 2) {
      fixPoints = defaultFixPoints(fixPointCount, bounds.span);
      persistFixState();
    }
    draw();
  });

  fixCountSel.addEventListener("change", () => {
    fixPointCount = parseInt(fixCountSel.value, 10) || 0;
    activePoint = 0;
    fixAction = "drag";
    actionSel.value = "drag";
    ensureFixPoints(fixPointCount);
    syncPointOptions();
    persistFixState();
    endFixEdit();
    endFreeGesture();
    pointers.clear();
    pointerOrder = [];
    draw();
  });

  pointSel.addEventListener("change", () => {
    activePoint = parseInt(pointSel.value, 10) || 0;
    persistFixState();
    draw();
  });

  actionSel.addEventListener("change", () => {
    fixAction = actionSel.value || "drag";
    updateHint();
    persistFixState();
  });

  resetBtn.addEventListener("click", () => {
    setMobius(identityMobius());
    if (fixPointCount >= 2) {
      fixPoints = defaultFixPoints(fixPointCount, bounds.span);
      persistFixState();
    }
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
