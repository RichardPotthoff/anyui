import json
import re
import ipywidgets as widgets

def to_kebab(name):
    # Standard CamelCase to kebab-case
    s = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1-\2', s).lower()

def serialize_widget(widget):
    class_name = widget.__class__.__name__
    tag = f"anyui-{to_kebab(class_name)}"
    
    important_keys = set() #set(widget.keys) #just use _repr_keys
    if hasattr(widget, '_repr_keys'):
        important_keys.update(widget._repr_keys())
        
    noise = {'_model_module', '_model_module_version', '_view_module', '_view_name', 'msg_throttle'}
    # CRITICAL: Remove 'children' from the attribute loop!
    keys_to_serialize = (important_keys - noise) - {'children'}
    
    attributes = []
    
    # We still skip 'children' here to handle them recursively
    keys_to_serialize = (important_keys - noise) - {'children'}
    
    for key in keys_to_serialize:
        value = getattr(widget, key)
        
        # FIX: Explicitly check for get_state on non-main widgets
        # This converts Layout and DescriptionStyle objects into dicts
        if hasattr(value, 'get_state') and not isinstance(value, widgets.Box):
            # drop_defaults=True keeps the HTML clean
            value = value.get_state(drop_defaults=True)
            
        attr_name = key.replace('_', '-')
        
        # Now serialize the resulting dict/list to a JSON string
        if isinstance(value, (dict, list, tuple)):
            # ensure_ascii=False for UTF-8 safety as we discussed
            json_data = json.dumps(value, ensure_ascii=False)
            attributes.append(f"{attr_name}='{json_data}'")
        else:
            attributes.append(f'{attr_name}="{value}"')
            
    # Handle Nesting separately (This is where VBox/HBox children go)
    child_content = ""
    if hasattr(widget, 'children'):
        # This calls the function recursively for each child widget
        child_content = "\n".join([serialize_widget(c) for c in widget.children])
        
    return f"<{tag} {' '.join(attributes)}>\n{child_content}\n</{tag}>"

def wrap(serialized_widgets):
    return (
"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AnyUI Parser Test</title>
</head>
<!-- Console Tee for easy copying -->
<div id="console-log" style="
    margin-top: 20px;
    padding: 12px;
    background: #1e1e1e;
    color: #ddd;
    font-family: monospace;
    font-size: 13px;
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #444;
    border-radius: 6px;
    white-space: pre-wrap;
    line-height: 1.4;
">
    <strong>Console Output:</strong><br>
</div>

<script>
// Simple console tee
const consoleDiv = document.getElementById('console-log');
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
const originalInfo = console.info;

function appendToConsole(level, ...args) {
    const timestamp = new Date().toLocaleTimeString();
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' ');

    const line = document.createElement('div');
    line.style.marginBottom = '2px';
    line.innerHTML = `<span style="color:#888">[${timestamp}]</span> <span style="color:${level}">[${level.toUpperCase()}]</span> ${message}`;
    consoleDiv.appendChild(line);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

// Override console methods
console.log = (...args) => {
    originalLog(...args);
    appendToConsole('log', ...args);
};

console.warn = (...args) => {
    originalWarn(...args);
    appendToConsole('warn', ...args);
};

console.error = (...args) => {
    originalError(...args);
    appendToConsole('error', ...args);
};

console.info = (...args) => {
    originalInfo(...args);
    appendToConsole('info', ...args);
};
</script>
<body>
  <h1>Capstan UI – Parser Test</h1>

""" +
serialized_widgets +
"""
  <script type="module">
    import "../anyui/static/widget-upgrader.js";
  </script>
</body>
</html>
"""
)