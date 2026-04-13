
function toKebabCase(str) {
    return str.replace(/([A-Z])/g, "-$1").replace(/^-/,"").toLowerCase();
}

async function loadModule(relpath) {
  const href = new URL(relpath, import.meta.url).href;
  try {
    console.log(`[Loading module] ${relpath}`);
    const module = await import(href);
    console.log(`✅ Loaded module: ${relpath}`);
    return module;
  } catch (err) {
    console.warn(`⚠️ Failed to load module ${relpath}`);
    return null;
  }
}


export class WidgetManager {
    constructor() {
        this.classes = new Map();
        this.failedClasses = new Set();
        this.models = new Map();
        this.moduleCache = new Map();
    }
    
    // Used by static imports to "check in"
    register_class(cls) {
        if (cls.tagName) {this.classes.set(cls.tagName,cls);}
        this.classes.set("anyui-"+toKebabCase(cls.name),cls);
        this.classes.set(cls.name,cls);
    }

    async getOrLoadClass(tagName) {
        // 1. Check if it was already registered (statically or previously loaded)
        
        if (this.classes.has(tagName)) return this.classes.get(tagName);
        
        // 2. Prevent re-fetching known failures
        if (this.failedClasses.has(tagName)) return null;
        
        try {
          // 3. Dynamic load: the module's own execution will trigger registerClass()
          const relpath = `./${tagName.replace(/^anyui-/,"")}-cls.js`;
          const module = await loadModule(relpath);
          // Fallback: if the module didn't auto-register for some reason
          if (module?.default && !this.classes.has(tagName)) {
            this.register_class(module.default);
          }
          return this.classes.get(tagName);
        } catch (e) {
          console.error(e.message);
          this.failedClasses.add(tagName);
          return null;
        }
    }
    
    register_model(model) {
        //model.widget_manager = this; //set in models' constructor
        this.models.set(model.id, model);
    }

    get_model(id) {
        // Strip prefix if present (compatibility with box.js)
        const model =this.models.get(id.replace("IPY_MODEL_", ""));
            
        if (!model) throw new Error(`Model ${id} not found`);
        return model;
    }
    
    async create_view(model, {el = null, attribs={}}={}) {
        const container = el || document.createElement('div');
        const className = model.constructor.name;
        container.style.display = "inline-flex";
        container.style.alignItems = "center";
        container.style.verticalAlign = "middle"; // Helps it sit nicely with text
   
        //apply model layout to element
        if (model.state.layout){
            Object.assign(container.style, model.state.layout);
        }
        if (model._css_promise) {
            try {
                await model._css_promise;
            } catch (err) {
                console.warn(`CSS load failed for ${model.constructor.name}:`, err);
            }
        }

        // 2. Render Logic
        try {
            const module = model._esm;
            if (module.initialize && !model._initialized) {
                await module.initialize({ model });
                model._initialized = true;
            }
    
            if (module.render) {
                const cleanup = await module.render({ model, el: container });
                container._anyui_cleanup = cleanup;
            }
        } catch (err) {
            console.error(`[AnyUI] Render Failed for ${className}:`, err);
            container.innerHTML = `<div style="color:red">Render Error: ${err.message}</div>`;
        }
    
        return { el: container };
    }
}

export const widgetManager = new WidgetManager();

