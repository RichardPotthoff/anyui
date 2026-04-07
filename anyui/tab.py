import anywidget
import traitlets

class Tab(anywidget.AnyWidget):
    _esm = "static/tab.js"
    _css = "static/tab.css"

    titles = traitlets.List(traitlets.Unicode()).tag(sync=True)
    selected_index = traitlets.Int(0).tag(sync=True)
    children = traitlets.List(traitlets.Instance(anywidget.AnyWidget)).tag(
        sync=True, **anywidget.widget_serialization
    )