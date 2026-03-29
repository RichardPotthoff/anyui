import anywidget
import traitlets
from pathlib import Path

class CounterButton(anywidget.AnyWidget):
    _esm = Path(__file__).parent / "static" / "counter-button.js"
    _css = Path(__file__).parent / "static" / "counter-button.css"
    value = traitlets.Int(0).tag(sync=True)
