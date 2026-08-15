// anyui/static/overlay-cls.js
import { AnyuiWidget, loadCSS, widgetManager } from "./anyui-model.js";
import _esm from "./overlay.js";

const _css_promise = loadCSS("./overlay.css");

export default class Overlay extends AnyuiWidget {
  constructor(
    initialState = {
      children: [],
      activeLayer: 0,
      opacities: null,
      width: 480,
      height: 480,
    }
  ) {
    const state = {
      children: [],
      activeLayer: 0,
      opacities: null,
      width: 480,
      height: 480,
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
