export class WidgetManager {
    constructor() {
        this.models = new Map();
        this.moduleCache = new Map();
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
    
    async create_view(model, el = null) {
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

