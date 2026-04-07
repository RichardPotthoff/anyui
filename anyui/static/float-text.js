function render({ model, el }) {
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "8px";
  wrapper.style.margin = "4px 0";

  const label = document.createElement("label");
  label.textContent = model.get("description") || "";
  label.style.minWidth = "140px";
  label.style.textAlign = "right";

  const input = document.createElement("input");
  input.type = "number";
  input.step = "any";
  input.value = model.get("value") || 0;
  input.disabled = model.get("disabled") || false;
  input.style.flex = "1";

  input.addEventListener("input", () => {
    model.set("value", parseFloat(input.value) || 0);
    model.save_changes();
  });

  model.on("change:value", () => input.value = model.get("value"));
  model.on("change:description", () => label.textContent = model.get("description") || "");
  model.on("change:disabled", () => input.disabled = model.get("disabled"));

  if (model.get("description")) wrapper.appendChild(label);
  wrapper.appendChild(input);
  el.appendChild(wrapper);
}

export default { render };