// --- Console Tee Setup ---
function setupLogger() {
  // 1. Create the UI elements
  const container = document.createElement("div");
  container.id = "anyui-console-wrapper";
  container.style.cssText = `
    margin: 20px 0; padding: 12px; background: #1e1e1e; color: #ddd;
    font-family: monospace; font-size: 13px; border: 1px solid #444;
    border-radius: 6px; position: relative;
  `;

  const header = document.createElement("div");
  header.style.cssText = "display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 4px;";
  header.innerHTML = "<strong>AnyUI Console Output</strong>";

  const copyBtn = document.createElement("button");
  copyBtn.innerText = "Copy Logs";
  copyBtn.style.cssText = "cursor: pointer; padding: 2px 8px; font-size: 11px; background: #444; color: #fff; border: none; border-radius: 3px;";
  
  const logArea = document.createElement("div");
  logArea.id = "anyui-console-log";
  logArea.style.cssText = "max-height: 400px; overflow-y: auto; white-space: pre-wrap; line-height: 1.4;";

  header.appendChild(copyBtn);
  container.appendChild(header);
  container.appendChild(logArea);
  document.body.appendChild(container); // Appends to the end of body

  // 2. Logic to append messages
  const appendToConsole = (level, color, ...args) => {
    const timestamp = new Date().toLocaleTimeString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' ');

    const line = document.createElement('div');
    line.style.marginBottom = '2px';
    line.innerHTML = `<span style="color:#888">[${timestamp}]</span> <span style="color:${color}">[${level.toUpperCase()}]</span> ${message}`;
    logArea.appendChild(line);
    logArea.scrollTop = logArea.scrollHeight;
  };

  // 3. Override Globals
  const original = { log: console.log, warn: console.warn, error: console.error };
  console.log = (...args) => { original.log(...args); appendToConsole('log', '#ddd', ...args); };
  console.warn = (...args) => { original.warn(...args); appendToConsole('warn', '#ffcc00', ...args); };
  console.error = (...args) => { original.error(...args); appendToConsole('error', '#ff6666', ...args); };

  // 4. Copy to clipboard logic
  copyBtn.onclick = () => {
    const text = logArea.innerText;
    navigator.clipboard.writeText(text).then(() => {
      const oldText = copyBtn.innerText;
      copyBtn.innerText = "✅ Copied!";
      setTimeout(() => copyBtn.innerText = oldText, 2000);
    }).catch(err => {
      alert("Copy failed: " + err);
    });
  };
}

// Initialize logger immediately when module loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupLogger);
} else {
  setupLogger();
}

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
//  console.log(`Building widget from: &lt${tag}&gt`);

const openingTag = el.outerHTML.match(/^<([^>]+)>/)[1];
console.log(`Building widget from: &lt${openingTag}&gt`);

  let WidgetClass = null;

  if (tag.startsWith("anyui-")) {
    const widgetName = tag.replace("anyui-", "");
    const moduleName = `${widgetName}-cls.js`;

    const module = await loadModule(`./${moduleName}`);

    if (module && module.default) {
      WidgetClass = module.default;
    } else {
      console.warn(`⚠️ Widget &lt${tag}&gt not found → using HTML placeholder`);
      WidgetClass = null;
    }
  }

  if (WidgetClass) {
    const state = {};

    for (const attr of el.attributes) {
      let name = attr.name.replace(/-/g, "_");
      let value = attr.value;
      if (value.startsWith('[') || value.startsWith('{')) {
        try {
            value = JSON.parse(value);
        } catch (e) {
            console.error("JSON parse failed for", attr.name, e);
        }
      }
      else if (value === "true") value = true;
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
    console.log(`✅ Created HTML placeholder for &lt${tag}&gt`);
    return htmlModel;
  }
  

  // Not a widget → recurse
  for (const child of Array.from(el.children)) {
    await buildWidgetTree(child);
  }
  return null;
}


export async function upgradeAllWidgets_() {
  console.log("🔧 Starting widget upgrade...");

  // 1. Find all custom elements in the body
  const allElements = Array.from(document.body.querySelectorAll("*"));
  const anyUIElements = allElements.filter(el => 
    el.tagName.toLowerCase().startsWith("anyui-")
  );

  // 2. Filter for "Root" widgets only
  // We only want to start hydration at the top level. 
  // If an element has an ancestor that is ALSO an anyui- element, we skip it.
  const rootWidgets = anyUIElements.filter(el => {
    // .closest() finds the nearest ancestor matching the selector.
    // Since we can't use wildcards in .closest(), we check manually.
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      if (parent.tagName.toLowerCase().startsWith("anyui-")) {
        return false; // Found an anyui ancestor; this is a nested child.
      }
      parent = parent.parentElement;
    }
    return true; // No anyui ancestor; this is a root.
  });

  // 3. Hydrate the root widgets
  for (const el of rootWidgets) {
    const model = await buildWidgetTree(el);

    if (model) {
      const renderContainer = document.createElement("div");
      renderContainer.className = "anyui-container";
      
      // Swap the original tag for the live container
      el.parentNode.replaceChild(renderContainer, el);

      // Render the widget
      await model.create_view(renderContainer);
      console.log(`✅ Upgraded root: <${el.tagName.toLowerCase()}>`);
    }
  }
}

export async function upgradeAllWidgets() {
  console.log("🔧 Starting DFS hydration...");

  async function walk(node) {
    // 1. If it's a widget, hydrate it and STOP recursion for this branch
    // (buildWidgetTree already handles its own children internally)
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase().startsWith("anyui-")) {
      const tag = node.tagName.toLowerCase();
      const model = await buildWidgetTree(node);

      if (model) {
        const container = document.createElement("div");
        container.className = "anyui-container";
        container.style.display = "inline-block"; // Optional: keep flow natural

        // Swap the tag for the live widget
        node.parentNode.replaceChild(container, node);
        await model.create_view(container);
        
        console.log(`✅ Hydrated: &lt${tag}&gt`);
        return; // Important: Stop walking this branch, model handled the rest
      }
    }

    // 2. If it's regular HTML, keep walking deeper to find nested widgets
    const children = Array.from(node.childNodes);
    for (const child of children) {
      await walk(child);
    }
  }

  // Start the walk from the body
  await walk(document.body);
  console.log("✨ Hydration complete.");
}


// Auto-run
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", upgradeAllWidgets);
} else {
  upgradeAllWidgets();
}