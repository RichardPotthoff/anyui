    
async function render({ model, el }) {
    for (let child_id of model.get("children")) {
        try{
           let child_model = await model.widget_manager.get_model(child_id.replace("IPY_MODEL_",""))
           
           let child_view = await model.widget_manager.create_view(child_model);
           el.appendChild(child_view.el);
           }
        catch(error) {alert(error);};
        
    }
}

export default { render }

