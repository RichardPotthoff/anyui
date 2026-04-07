// anyui/static/widget-upgrader.js
import { widgetManager } from "./widget-manager.js";
import { Tab } from "./tab-cls.js";
import { Box } from "./box-cls.js";
import { FloatText } from "./float-text-cls.js";
import { HTML } from "./html-cls.js";
import { loadCSS } from "./anyui-widget-cls.js";

loadCSS("../anyui/static/tab.css");

const registry = {
  "anyui-tab":        Tab,
  "anyui-box":        Box,
  "anyui-float-text": FloatText,
  "anyui-html":       HTML,        // new
};

async function buildWidgetTree(el) {
  const tag = el.tagName.toLowerCase();
  const WidgetClass = registry[tag];

  if (WidgetClass) {
    const state = {};
    for (const attr of el.attributes) {
      let name = attr.name.replace(/-/g, "_");
      let value = attr.value;
      if (value === "true") value = true;
      else if (value === "false") value = false;
      else if (!isNaN(value) && value.trim() !== "") value = parseFloat(value);
      else if (name === "titles") value = value.split(",").map(s => s.trim());
      state[name] = value;
    }

    const childModels = [];
    for (const childEl of Array.from(el.children)) {
      const childModel = await buildWidgetTree(childEl);
      if (childModel) childModels.push(childModel);
    }

    if (childModels.length > 0) {
      state.children = childModels;
    } else if (el.innerHTML.trim() && !WidgetClass.name.includes("FloatText")) {
      // Capture raw HTML content for non-container widgets
      state.value = el.innerHTML.trim();
    }

    const model = new WidgetClass(state);
    return model;
  }

  // Not a widget → recurse
  for (const child of Array.from(el.children)) {
    await buildWidgetTree(child);
  }
  return null;
}

export async function upgradeAllWidgets() {
  console.log("🔧 Starting widget upgrade...");

  const rootTabEl = document.querySelector("anyui-tab");
  if (!rootTabEl) return;

  const tabModel = await buildWidgetTree(rootTabEl);

  // Remove the original markup so it doesn't show in the body
  if (rootTabEl.parentNode) {
    rootTabEl.parentNode.removeChild(rootTabEl);
  }

  if (tabModel) {
    const renderContainer = document.createElement("div");
    document.body.appendChild(renderContainer);
    await widgetManager.create_view(tabModel, renderContainer);
    console.log("✅ Tab rendered successfully");
  }
}

// Auto-run
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", upgradeAllWidgets);
} else {
  upgradeAllWidgets();
}