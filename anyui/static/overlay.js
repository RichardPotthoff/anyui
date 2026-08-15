/**
 * Overlay layout: stacks children absolutely on top of each other.
 *
 * Model traits:
 *   children     – array of child models (or ids resolved by the manager)
 *   activeLayer  – index of the layer that receives pointer events (others get pointer-events: none)
 *   opacities    – optional array of numbers 0–1; if missing, active=1, others=0.4
 *   width, height – optional; applied to the container
 *
 * Visual cue: non-active layers are dimmed via opacity.
 * Event routing: only the active layer has pointer-events: auto.
 */

function render({ model, el }) {
  el.innerHTML = "";
  el.classList.add("anyui-overlay");

  const container = document.createElement("div");
  container.className = "anyui-overlay";
  container.style.position = "relative";
  container.style.display = "block";
  container.style.overflow = "hidden";
  el.appendChild(container);

  let childCleanups = [];
  let layerEls = [];

  function applySize() {
    const w = model.get("width");
    const h = model.get("height");
    if (w != null) {
      container.style.width = typeof w === "number" ? w + "px" : w;
    }
    if (h != null) {
      container.style.height = typeof h === "number" ? h + "px" : h;
    }
  }

  function applyActiveAndOpacity() {
    const children = model.get("children") || [];
    const active = model.get("activeLayer") ?? 0;
    let opacities = model.get("opacities");
    if (!Array.isArray(opacities) || opacities.length !== children.length) {
      opacities = children.map((_, i) => (i === active ? 1 : 0.4));
    }

    layerEls.forEach((layer, i) => {
      const isActive = i === active;
      layer.style.pointerEvents = isActive ? "auto" : "none";
      layer.style.zIndex = isActive ? "10" : String(i + 1);
      layer.style.opacity = String(opacities[i] ?? (isActive ? 1 : 0.4));
    });
  }

  async function update() {
    // Cleanup previous
    childCleanups.forEach((fn) => {
      if (typeof fn === "function") fn();
    });
    childCleanups = [];
    layerEls = [];
    container.innerHTML = "";

    applySize();

    const children = model.get("children") || [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child) continue;

      const layer = document.createElement("div");
      layer.className = "anyui-overlay-layer";
      layer.dataset.layerIndex = String(i);
      container.appendChild(layer);
      layerEls.push(layer);

      try {
        const view = await model.widget_manager.create_view(child);
        layer.appendChild(view.el);
        if (view.cleanup) childCleanups.push(view.cleanup);
      } catch (err) {
        console.error("Overlay child render failed", err);
        layer.innerHTML = `<div style="color:red;font-size:12px">Layer ${i} error</div>`;
      }
    }

    applyActiveAndOpacity();
  }

  model.on("change:children", update);
  model.on("change:activeLayer", applyActiveAndOpacity);
  model.on("change:opacities", applyActiveAndOpacity);
  model.on("change:width", applySize);
  model.on("change:height", applySize);

  update();

  return () => {
    model.off("change:children", update);
    model.off("change:activeLayer", applyActiveAndOpacity);
    model.off("change:opacities", applyActiveAndOpacity);
    model.off("change:width", applySize);
    model.off("change:height", applySize);
    childCleanups.forEach((fn) => {
      if (typeof fn === "function") fn();
    });
    container.remove();
  };
}

export default { render };
