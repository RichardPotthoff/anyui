import ui
import os
from wkapp.wkwebview import WKWebView # Assuming mikaelho's wkwebview.py or similar
import json

class AnywidgetBridge(WKWebView):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.state = {}

    def on_anywidget(self, message):
        """Called when JS calls window.webkit.messageHandlers.anywidget.postMessage"""
        # Update Python state from JS
        new_state = message # In some versions, you may need json.loads(message)
        self.state.update(new_state)
        print(f"Python State Updated: {self.state}")

    def update_js_state(self, key, value):
        """Update the JS model from Python"""
        val_json = json.dumps(value)
        js_code = f"window.model.set('{key}', {val_json});"
        self.evaluate_javascript(js_code)
        
# Pythonista side
def update_ui(key, value):
    # Pass the value as JSON to handle strings/numbers/lists correctly
    json_val = json.dumps(value)
    webview.evaluate_javascript(f"window.mainModel.set('{key}', {json_val});")


# Usage
with open('test-counter-button.html',encoding='utf-8')as f:
  html=f.read()
v = AnywidgetBridge()
v.load_url('file://demos/test-counter-button.html')
v.present('panel')

# Example: Update a slider value from Python
#v.update_js_state("input_val", 42)

