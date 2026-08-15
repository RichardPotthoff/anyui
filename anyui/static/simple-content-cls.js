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
    }
  ) {
    const state = {
      view: { scale: 80, tx: 0, ty: 0 },
      width: 480,
      height: 480,
      color: "#2563eb",
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
