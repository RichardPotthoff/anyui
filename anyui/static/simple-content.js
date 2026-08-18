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
 */

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

  function planeToScreen(x, y, width, height, view) {
    return [
      width / 2 + (x * view.scale + view.tx),
      height / 2 - (y * view.scale + view.ty),
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

    // Optional opaque / tinted background. null/false → leave transparent
    // so lower Overlay layers show through.
    const bg = model.get("background");
    if (bg !== null && bg !== false && bg !== undefined) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }

    const view = getView();
    const showGrid = model.get("showGrid") !== false;

    if (showGrid) {
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      const step = 1;
      const extent = 4;
      ctx.beginPath();
      for (let u = -extent; u <= extent; u += step) {
        const [x0, y0] = planeToScreen(u, -extent, width, height, view);
        const [x1, y1] = planeToScreen(u, extent, width, height, view);
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        const [a0, b0] = planeToScreen(-extent, u, width, height, view);
        const [a1, b1] = planeToScreen(extent, u, width, height, view);
        ctx.moveTo(a0, b0);
        ctx.lineTo(a1, b1);
      }
      ctx.stroke();

      // axes
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      {
        const [x0, y0] = planeToScreen(-extent, 0, width, height, view);
        const [x1, y1] = planeToScreen(extent, 0, width, height, view);
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        const [a0, b0] = planeToScreen(0, -extent, width, height, view);
        const [a1, b1] = planeToScreen(0, extent, width, height, view);
        ctx.moveTo(a0, b0);
        ctx.lineTo(a1, b1);
      }
      ctx.stroke();
    }

    const shape = model.get("shape") || defaultShape();
    const color = model.get("color") || "#2563eb";

    ctx.beginPath();
    shape.forEach(([x, y], i) => {
      const [sx, sy] = planeToScreen(x, y, width, height, view);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();
    // light fill derived from stroke colour (keeps transparency feel)
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
  };
}

export default { render };
