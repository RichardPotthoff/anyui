/**
 * PointHandles – general N-point overlay.
 *
 * Model traits (minimal first version):
 *   points   – array of [x, y] in plane coordinates
 *   view     – { scale, tx, ty }  (simple similarity, no rotation yet)
 *   width, height
 *   active   – index of the currently dragged / highlighted point (or -1)
 *   radius   – pixel radius of the handles (default 10)
 *
 * Plane → screen:  sx = width/2 + (x * scale + tx)
 *                  sy = height/2 - (y * scale + ty)   // y up
 *
 * Dragging a handle updates the corresponding plane point and calls save_changes.
 */

function render({ model, el }) {
  el.innerHTML = "";
  el.classList.add("point-handles");

  const canvas = document.createElement("canvas");
  canvas.className = "point-handles-canvas";
  canvas.style.touchAction = "none";
  el.appendChild(canvas);

  let dragging = false;
  let dragIndex = -1;
  let pointerId = null;

  function getView() {
    return model.get("view") || { scale: 1, tx: 0, ty: 0 };
  }

  function getPoints() {
    const raw = model.get("points") || [];
    return raw.map((p) => (Array.isArray(p) ? p : [p.re ?? p.x ?? 0, p.im ?? p.y ?? 0]));
  }

  function planeToScreen(x, y, width, height, view) {
    const sx = width / 2 + (x * view.scale + view.tx);
    const sy = height / 2 - (y * view.scale + view.ty);
    return [sx, sy];
  }

  function screenToPlane(sx, sy, width, height, view) {
    const x = (sx - width / 2 - view.tx) / view.scale;
    const y = -(sy - height / 2 - view.ty) / view.scale; // invert y
    return [x, y];
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

    // Transparent by default – the layer only draws the handles
    const points = getPoints();
    const view = getView();
    const radius = model.get("radius") ?? 10;
    const active = model.get("active") ?? -1;

    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      const [sx, sy] = planeToScreen(x, y, width, height, view);
      const isActive = i === active || i === dragIndex;

      ctx.beginPath();
      ctx.arc(sx, sy, isActive ? radius + 2 : radius, 0, Math.PI * 2);
      ctx.fillStyle = isActive
        ? "rgba(15, 118, 110, 0.45)"
        : "rgba(100, 116, 139, 0.35)";
      ctx.fill();
      ctx.strokeStyle = isActive ? "#0f766e" : "#64748b";
      ctx.lineWidth = isActive ? 2.5 : 1.5;
      ctx.stroke();

      // small cross for the active point
      if (isActive) {
        ctx.beginPath();
        ctx.moveTo(sx - radius - 4, sy);
        ctx.lineTo(sx + radius + 4, sy);
        ctx.moveTo(sx, sy - radius - 4);
        ctx.lineTo(sx, sy + radius + 4);
        ctx.strokeStyle = "#0f766e";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  function pointerXY(ev) {
    const rect = canvas.getBoundingClientRect();
    return [ev.clientX - rect.left, ev.clientY - rect.top];
  }

  function findHit(sx, sy) {
    const width = model.get("width") || 480;
    const height = model.get("height") || 480;
    const view = getView();
    const points = getPoints();
    const radius = (model.get("radius") ?? 10) + 6; // generous hit area
    let best = -1;
    let bestDist = radius;
    for (let i = 0; i < points.length; i++) {
      const [px, py] = planeToScreen(points[i][0], points[i][1], width, height, view);
      const d = Math.hypot(sx - px, sy - py);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  function onPointerDown(ev) {
    const [sx, sy] = pointerXY(ev);
    const hit = findHit(sx, sy);
    if (hit < 0) return;

    ev.preventDefault();
    canvas.setPointerCapture(ev.pointerId);
    dragging = true;
    dragIndex = hit;
    pointerId = ev.pointerId;
    model.set("active", hit);
    model.save_changes();
    draw();
  }

  function onPointerMove(ev) {
    if (!dragging || ev.pointerId !== pointerId) return;
    ev.preventDefault();

    const width = model.get("width") || 480;
    const height = model.get("height") || 480;
    const view = getView();
    const [sx, sy] = pointerXY(ev);
    const [x, y] = screenToPlane(sx, sy, width, height, view);

    const points = getPoints();
    if (dragIndex >= 0 && dragIndex < points.length) {
      points[dragIndex] = [x, y];
      model.set("points", points);
      model.save_changes();
      draw();
    }
  }

  function onPointerUp(ev) {
    if (ev.pointerId !== pointerId) return;
    dragging = false;
    dragIndex = -1;
    pointerId = null;
    // keep "active" as the last touched point
    draw();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  function onChange() {
    draw();
  }

  model.on("change:points", onChange);
  model.on("change:view", onChange);
  model.on("change:width", onChange);
  model.on("change:height", onChange);
  model.on("change:active", onChange);
  model.on("change:radius", onChange);

  draw();

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    model.off("change:points", onChange);
    model.off("change:view", onChange);
    model.off("change:width", onChange);
    model.off("change:height", onChange);
    model.off("change:active", onChange);
    model.off("change:radius", onChange);
  };
}

export default { render };
