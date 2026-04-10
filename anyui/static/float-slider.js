function render({ model, el }) {
    
  const layout=model.get("layout")||{};
  //el.style.height = layout.height || "";
  el.style.width = layout.width || "";
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "4px";
  container.style.width = "100%";
  container.style.fontFamily = "system-ui, sans-serif";

  // Description (above everything)
  const description = document.createElement("label");
  description.style.fontSize = "0.9em";
  description.style.color = "#555";
  container.appendChild(description);

  // Main row for horizontal layout
  const mainRow = document.createElement("div");
  mainRow.style.display = "flex";
  mainRow.style.alignItems = "center";
  mainRow.style.gap = "8px";
  mainRow.style.height = layout.height || "";

  // Slider
  const slider = document.createElement("input");
  slider.type = "range";
  slider.style.flex = "1";

  // Readout (editable number input)
  const readout = document.createElement("input");
  readout.type = "number";
  readout.style.width = "80px";
  readout.style.textAlign = "right";
  readout.style.fontFamily = "monospace";

  mainRow.appendChild(slider);
  mainRow.appendChild(readout);
  container.appendChild(mainRow);

  el.appendChild(container);

  // Helper: format value for display
  function formatValue(value) {
    const fmt = model.get("readout_format") || ".2f";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    // Simple support for .Nf style
    const decimals = parseInt(fmt.replace(/[^0-9]/g, "")) || 2;
    return num.toFixed(decimals);
  }

  // Update UI from model
  function updateUI() {
    const value = model.get("value") ?? 0;
    const min = model.get("min") ?? 0;
    const max = model.get("max") ?? 100;
    const step = model.get("step") ?? 0.1;
    const disabled = model.get("disabled") ?? false;
    const orientation = model.get("orientation") ?? "horizontal";
    const descText = model.get("description") ?? "";

    description.textContent = descText;

    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.disabled = disabled;

    readout.min = min;
    readout.max = max;
    readout.step = step;
    readout.value = formatValue(value);
    readout.disabled = disabled;

    if (orientation === "vertical") {
      // Vertical: description on top, slider tall, readout below
      container.style.flexDirection = "column";
      container.style.height = "";
      mainRow.style.flexDirection = "column";
      mainRow.style.alignItems = "center";
      slider.style.writingMode = "vertical-rl";
      slider.style.direction = "rtl";
      slider.style.height = "";
      slider.style.width = "auto";
      readout.style.width = "80px";
      readout.style.marginTop = "6px";
    } else {
      // Horizontal: description on top, slider + readout side-by-side
      container.style.flexDirection = "column";
      mainRow.style.flexDirection = "row";
      mainRow.style.alignItems = "center";
      slider.style.writingMode = "";
      slider.style.direction = "";
      slider.style.height = "";
      slider.style.width = "";
      readout.style.marginTop = "0";
    }
  }

  // Sync: slider → model + readout
  function onSliderInput() {
    const newValue = parseFloat(slider.value);
    model.set("value", newValue);
    model.save_changes();
    readout.value = formatValue(newValue);   // immediate visual feedback
  }

  // Sync: readout input → model
  function onReadoutChange() {
    let newValue = parseFloat(readout.value);
    if (isNaN(newValue)) return;

    // Clamp to min/max
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    newValue = Math.max(min, Math.min(max, newValue));

    model.set("value", newValue);
    model.save_changes();
    slider.value = newValue;   // sync slider
  }

  // Event listeners
  slider.addEventListener("input", onSliderInput);
  readout.addEventListener("change", onReadoutChange);   // on blur/enter
  readout.addEventListener("blur", onReadoutChange);     // also on blur

  // Model → UI
  const traits = ["value", "min", "max", "step", "disabled", "orientation", "description", "readout_format"];
  traits.forEach(trait => model.on(`change:${trait}`, updateUI));

  // Initial render
  updateUI();
}

export default {render};