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
        console.log(child);
        model.widget_manager.create_view(child).then(view => container.appendChild(view.el));
      }
    });
  }

  model.on("change:children", update);
  model.on("change:orientation", () => container.style.flexDirection = model.get("orientation"));

  update();
}    

async function render_({ model, el }) {
    for (let child_id of model.get("children")) {
        try{
           let child_model = await model.widget_manager.get_model(child_id.replace("IPY_MODEL_",""))
           
           let child_view = await model.widget_manager.create_view(child_model);
           el.appendChild(child_view.el);
           }
        catch(error) {alert(error);};
        
    }
}

export default { render }

