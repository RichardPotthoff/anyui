function render({ model, el }) {
      let count = () => model.get("value");
      let btn = document.createElement("button");
      btn.classList.add("counter-button");
      const update = () => {btn.innerHTML = `count is ${count()}`;};
      btn.addEventListener("click", () => {
        model.set("value", count() + 1);
        model.save_changes();
      });
      
      model.on("change:value", update);
      
      el.appendChild(btn);
      update();
                  // 2. Return the Cleanup Closure
      return () => {
      console.log("Cleaning up widget...");
      model.off("change:value", update); // Remove listener
      btn.onclick = null;                // Break reference
      el.removeChild(btn);               // Remove from DOM
    };
    }
    
export default { render };
