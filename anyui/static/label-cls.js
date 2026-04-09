import { AnyuiWidget, loadCSS } from "./anyui-widget-cls.js";
import _esm from "./label.js";
const _css_promise = loadCSS("./label.css");

export default class Label extends AnyuiWidget {
  constructor(initialState = {}) {
    super(initialState);
    this._esm = _esm;
    this._css_promise = _css_promise;   // share the same promise
  }
}


