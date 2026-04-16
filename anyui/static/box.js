function render({ model, el }) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.gap = "8px";
  container.style.flexDirection = model.get("orientation") || "column";
  el.appendChild(container);

  // Keep track of all active child cleanup functions
  let childCleanups = [];

  async function update() {
    // 1. Clean up ALL existing children first
    childCleanups.forEach(cleanup => {
        if (typeof cleanup === "function") cleanup();
    });
    childCleanups = [];
    container.innerHTML = "";

    // 2. Render new children
    const children = model.get("children") || [];
    for (const child of children) {
      if (child) {
        try {
          const view = await model.widget_manager.create_view(child);
          container.appendChild(view.el);
          // Store the specific cleanup for this child
          if (view.cleanup) childCleanups.push(view.cleanup);
        } catch (err) {
          console.error("Box child render failed", err.message);
        }
      }
    }
  }

  model.on("change:children", update);
  model.on("change:orientation", () => {
    container.style.flexDirection = model.get("orientation");
  });

  update();

  // 3. RETURN THE MASTER CLEANUP
  return () => {
    model.off("change:children", update);
    childCleanups.forEach(cleanup => cleanup());
    container.remove();
  };
}

export default { render };
