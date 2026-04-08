import { AnyuiWidget, loadCSS } from "./anyui-widget-cls.js";
import { widgetManager } from "./widget-manager.js";
import _esm from "./float-text.js";
const _css_promise = loadCSS("./float-text.css");

class FloatText extends AnyuiWidget {
  constructor(initialState = {}) {
    super(initialState);
    this._esm = _esm;
    this._css_promise = _css_promise;   // share the same promise
  }
}


export {FloatText};
export default {FloatText};