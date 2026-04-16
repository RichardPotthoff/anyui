import anywidget
import traitlets
from pathlib import Path

class Button(anywidget.AnyWidget):
    label = traitlets.Unicode("Click me").tag(sync=True)

    _esm = Path(__file__).parent / "static" / "button.js"
    _css = Path(__file__).parent / "static" / "button.css"
    
    def _handle_custom_msg(self, content, buffers=None):
        if content.get("event") == "click":
            print("Button was clicked!")
        # Optional: send something back
        //self.send({"type": "alert", "text": "Thanks!"})