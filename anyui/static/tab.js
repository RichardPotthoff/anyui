// anyui/static/tab.js
function render({ model, el }) {
  el.innerHTML = "";

  const container = document.createElement("div");
  container.className = "anyui-tab";

  const header = document.createElement("div");
  header.className = "anyui-tab-header";

  const contentArea = document.createElement("div");
  contentArea.className = "anyui-tab-content";

  container.append(header, contentArea);
  el.appendChild(container);

  let currentCleanup = null;

  function ensureArray(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return val.split(",").map(s => s.trim());
    return [];
  }

  async function showTab(index) {
    // Clean up previous view
    if (currentCleanup) {
      try {
        currentCleanup();
      } catch (e) {}
      currentCleanup = null;
    }

    // Clear content area
    contentArea.innerHTML = "";

    const titles = ensureArray(model.get("titles") || []);
    const children = model.get("children") || [];
    const childModel = children[index];

    // Update header buttons
    header.querySelectorAll("button").forEach((b, i) => b.classList.toggle("active", i === index));

    if (!childModel) {
      contentArea.innerHTML = "<p>(no child model)</p>";
      return;
    }

    try {
      const view = await model.widget_manager.create_view(childModel);
      contentArea.appendChild(view.el);

      // Store cleanup function if the render returned one
      if (typeof view.cleanup === "function") {
        currentCleanup = view.cleanup;
      }
    } catch (err) {
      console.error("Failed to render child:", err);
      contentArea.innerHTML = `<p style="color:red">Render error</p>`;
    }
  }

  function buildHeader() {
    header.innerHTML = "";
    const titles = ensureArray(model.get("titles") || []);
    titles.forEach((title, i) => {
      const btn = document.createElement("button");
      btn.textContent = title;
      btn.addEventListener("click", () => {
        model.set("selected_index", i);
        model.save_changes();
      });
      header.appendChild(btn);
    });
  }

  model.on("change:titles", () => { buildHeader(); showTab(model.get("selected_index") ?? 0); });
  model.on("change:children", () => showTab(model.get("selected_index") ?? 0));
  model.on("change:selected_index", (idx) => showTab(idx));

  buildHeader();
  showTab(model.get("selected_index") ?? 0);
}

export {render};
export default {render};
