import { widgetManager } from "./your-manager-path.js"; 

export default {
    render({ model, el }) {
        // 1. Check if the manager is missing (Marimo/Standalone)
        if (!model.widget_manager) {
            // Attach your custom manager
            widgetManager.register_model(model); 
        }

        // 2. Now standard ipywidgets-style layout logic works
        const children = model.get("children");
        children.forEach(async (childId) => {
            // Your manager handles the lookup and creation
            const childModel = widgetManager.get_model(childId);
            const view = await model.widget_manager.create_view(childModel);
            el.appendChild(view.el);
            
            // Apply your canvas X,Y positioning here
            if (childModel.get('x') !== undefined) {
                view.el.style.position = 'absolute';
                view.el.style.left = `${childModel.get('x')}px`;
                view.el.style.top = `${childModel.get('y')}px`;
            }
        });
    }
}
