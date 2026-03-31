from anywidget import AnyWidget
import traitlets as t
from pathlib import Path

class Slider(AnyWidget):
    value = t.Int(50).tag(sync=True)
    min = t.Int(0).tag(sync=True)
    max = t.Int(100).tag(sync=True)
    step = t.Int(1).tag(sync=True)

    _esm = Path(__file__).parent / "static" / "slider.js"
 #   _css = Path(__file__).parent / "static" / "slider.css"
