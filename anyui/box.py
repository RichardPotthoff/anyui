 
import anywidget
import traitlets
import ipywidgets
import os
from pathlib import Path
import sys
class Box(anywidget.AnyWidget):
  _esm = Path(__file__).parent / "static" / "box.js"
  children = traitlets.List(traitlets.Instance(ipywidgets.DOMWidget)).tag(
      sync=True, **ipywidgets.widget_serialization
      )
      
