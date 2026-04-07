import anywidget
import traitlets
from pathlib import Path
class HTML(anywidget.AnyWidget):
    _esm = Path(__file__).parent / "static" /  "html.js"

    value = traitlets.Unicode("").tag(sync=True)