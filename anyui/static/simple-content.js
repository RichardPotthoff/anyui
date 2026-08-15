/**
 * SimpleContent – minimal drawing layer that shares the same view as PointHandles.
 * Draws a light grid and a fixed polygon (or the outline points) so we can see
 * that the handles stay registered with the content when V changes.
 *
 * Traits: view {scale, tx, ty}, width, height, color
 */

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

    // background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, width, height);

    const view = getView();

    // grid
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

    // simple closed shape (a pentagon-ish star outline for visual interest)
    const shape = [
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
    ctx.beginPath();
    shape.forEach(([x, y], i) => {
      const [sx, sy] = planeToScreen(x, y, width, height, view);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.closePath();
    ctx.strokeStyle = model.get("color") || "#2563eb";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.fillStyle = "rgba(37, 99, 235, 0.08)";
    ctx.fill();
  }

  function onChange() {
    draw();
  }

  model.on("change:view", onChange);
  model.on("change:width", onChange);
  model.on("change:height", onChange);
  model.on("change:color", onChange);

  draw();

  return () => {
    model.off("change:view", onChange);
    model.off("change:width", onChange);
    model.off("change:height", onChange);
    model.off("change:color", onChange);
  };
}

export default { render };
