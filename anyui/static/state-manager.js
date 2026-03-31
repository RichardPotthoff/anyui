export class WidgetManager {
    constructor() {
        this.models = new Map();
        this.moduleCache = new Map();
    }

    register_model(model) {
        model.widget_manager = this;
        this.models.set(model.model_id, model);
    }

    async get_model(modelId) {
        // Strip prefix if present (compatibility with box.js)
        const id = modelId.startsWith("IPY_MODEL_") 
            ? modelId.slice("IPY_MODEL_".length) 
            : modelId;
            
        if (!this.models.has(id)) throw new Error(`Model ${id} not found`);
        return this.models.get(id);
    }
    
    async create_view(model, el = null) {
        const container = el || document.createElement('div');
        const className = model.constructor.name;
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

