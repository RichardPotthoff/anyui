from anywidget import AnyWidget
import traitlets as t
from pathlib import Path

class Slider(AnyWidget):
    value = t.Float(0.5).tag(sync=True)
    min = t.Float(0).tag(sync=True)
    max = t.Float(1.0).tag(sync=True)
    step = t.Float(0).tag(sync=True)

    _esm = Path(__file__).parent / "static" / "float-slider.js"
    _css = Path(__file__).parent / "static" / "float-slider.css"
