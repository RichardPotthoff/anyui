// anyui/static/mobius-viewport-cls.js
import { AnyuiWidget, loadCSS, widgetManager } from "./anyui-model.js";
import _esm from "./mobius-viewport.js";

const _css_promise = loadCSS("./mobius-viewport.css");

export default class MobiusViewport extends AnyuiWidget {
  constructor(
    initialState = {
      outline: "Star",
      mobius: { a: [1, 0], b: [0, 0], c: [0, 0], d: [1, 0] },
      width: 480,
      height: 480,
      fixPointCount: 0,
      fixPoints: [],
      activePoint: 0,
      fixAction: "drag",
    }
  ) {
    const state = {
      outline: "Star",
      mobius: { a: [1, 0], b: [0, 0], c: [0, 0], d: [1, 0] },
      width: 480,
      height: 480,
      fixPointCount: 0,
      fixPoints: [],
      activePoint: 0,
      fixAction: "drag",
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
