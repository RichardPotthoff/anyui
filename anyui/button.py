import anywidget
import traitlets
from pathlib import Path

class MyButton(anywidget.AnyWidget):
    label = traitlets.Unicode("Click me").tag(sync=True)

    _esm = Path(__file__).parent / "static" / "button.js"
    
    def _handle_custom_msg(self, content, buffers=None):
        if content.get("event") == "click":
            print("Button was clicked!")
        # Optional: send something back
        //self.send({"type": "alert", "text": "Thanks!"})