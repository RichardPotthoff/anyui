 
import anywidget
import traitlets
import ipywidgets
import os
from pathlib import Path
import sys
class Box(anywidget.AnyWidget):
  _esm = Path(__file__).parent / "static" / "h-box.js"
  _css = Path(__file__).parent / "static" / "h-box.css"
  children = traitlets.List(traitlets.Instance(ipywidgets.DOMWidget)).tag(
      sync=True, **ipywidgets.widget_serialization
      )
  orientation = traitlets.Unicode("column").tag(sync=True)  # "column" or "row"
      
  