function render({ model, el }) {
    const container = document.createElement("div");
    container.className = "widget-box";
    container.innerHTML = `<div>Mirror Widget</div><strong id="val"></strong>`;
    
    const span = container.querySelector("#val");
    const update = () => { span.textContent = model.get("value"); };
    
    model.on("change:value", update);
    update();
    el.appendChild(container);
        // 2. Return the Cleanup Closure
    return () => {
      console.log("Cleaning up widget...");
      model.off("change:value", update); // Remove listener
      el.removeChild(container);               // Remove from DOM
    };
};

export default {render};

