// anyui/static/widget-upgrader.js
import { loadCSS } from "./anyui-widget-cls.js";
import HTML from "./html-cls.js";   // ← added as requested

// Dynamic module loader
const moduleCache = new Map();

async function loadModule(relpath) {
  const href = new URL(relpath, import.meta.url).href;
  if (moduleCache.has(href)) {
    console.log(`[Cache hit] ${relpath}`);
    return moduleCache.get(href);
  }

  try {
    console.log(`[Loading module] ${relpath}`);
    const module = await import(href);
    moduleCache.set(href, module);
    console.log(`✅ Loaded module: ${relpath}`);
    return module;
  } catch (err) {
    console.warn(`⚠️ Failed to load module ${relpath}`);
    return null;
  }
}

async function buildWidgetTree(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = el.tagName.toLowerCase();
  console.log(`Building widget from: <${tag}>`);

  let WidgetClass = null;

  if (tag.startsWith("anyui-")) {
    const widgetName = tag.replace("anyui-", "");
    const moduleName = `${widgetName}-cls.js`;

    const module = await loadModule(`./${moduleName}`);

    if (module && module.default) {
      WidgetClass = module.default;
    } else {
      console.warn(`⚠️ Widget <${tag}> not found → using HTML placeholder`);
      WidgetClass = null;
    }
  }

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
    let rawHTML = "";

    for (const childEl of Array.from(el.children)) {
      const childModel = await buildWidgetTree(childEl);
      if (childModel) {
        childModels.push(childModel);
      } else {
        rawHTML += childEl.outerHTML;
      }
    }

    if (childModels.length > 0) {
      state.children = childModels;
      console.log(`  → Attached ${childModels.length} children to ${WidgetClass.name}`);
    } else if (rawHTML) {
      state.value = rawHTML;
      console.log(`  → Collected raw HTML into "value"`);
    }

    const model = new WidgetClass(state);
    console.log(`✅ Created ${WidgetClass.name}`);
    return model;
  }

  // === Placeholder using HTML widget ===
  if (tag.startsWith("anyui-")) {
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

    const stateStr = JSON.stringify(state);
    const placeholderHTML = `
      <div style="border: 2px dashed #f66; padding: 8px; border-radius: 4px; background: #fff3f3; font-family: monospace; font-size: 13px;">
        <strong>⚠️ ${tag}</strong> not implemented yet — 
        <code>new ${tag.replace("anyui-", "")}(${stateStr})</code>
      </div>`;

    const htmlModel = new HTML({ value: placeholderHTML });
    console.log(`✅ Created HTML placeholder for <${tag}>`);
    return htmlModel;
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
  if (!rootTabEl) {
    console.error("No <anyui-tab> found");
    return;
  }

  const tabModel = await buildWidgetTree(rootTabEl);

  // Remove original markup
  if (rootTabEl.parentNode) {
    rootTabEl.parentNode.removeChild(rootTabEl);
  }

  if (tabModel) {
    console.log("✅ Tab model built — now rendering");
    const renderContainer = document.createElement("div");
    document.body.appendChild(renderContainer);

    await tabModel.create_view(renderContainer);
    console.log("✅ Root Tab rendered successfully");
  }
}

// Auto-run
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", upgradeAllWidgets);
} else {
  upgradeAllWidgets();
}