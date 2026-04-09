function render({ model, el }) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.gap = "8px";
  container.style.flexDirection = model.get("orientation") || "column";

  el.appendChild(container);

  function update() {
    container.innerHTML = "";
    (model.get("children") || []).forEach(child => {
      if (child) {
        model.widget_manager.create_view(child).then(view => container.appendChild(view.el));
      }
    });
  }

  model.on("change:children", update);
  model.on("change:orientation", () => container.style.flexDirection = model.get("orientation"));

  update();
}    

export default { render }

