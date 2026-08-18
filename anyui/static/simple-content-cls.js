// anyui/static/simple-content-cls.js
import { AnyuiWidget, loadCSS, widgetManager } from "./anyui-model.js";
import _esm from "./simple-content.js";

// no dedicated css needed
const _css_promise = Promise.resolve();

export default class SimpleContent extends AnyuiWidget {
  constructor(
    initialState = {
      view: { scale: 80, tx: 0, ty: 0 },
      width: 480,
      height: 480,
      color: "#2563eb",
      background: "#f8fafc", // set null for transparent (Overlay multi-layer)
      showGrid: true,
      visible: true,
    }
  ) {
    const state = {
      view: { scale: 80, tx: 0, ty: 0 },
      width: 480,
      height: 480,
      color: "#2563eb",
      background: "#f8fafc",
      showGrid: true,
      visible: true,
      ...initialState,
    };
    super(state);
    this._esm = _esm;
    this._css_promise = _css_promise;
  }

  static {
    widgetManager.register_class(this);
  }
}
