import { AnyuiWidget, loadCSS } from "./anyui-widget-cls.js";

import _esm from "./float-slider.js";
const _css_promise = loadCSS("./float-slider.css");

export default class FloatSlider extends AnyuiWidget {
  constructor(initialState = {}) {
    super(initialState);
    this._esm = _esm;
    this._css_promise = _css_promise;   // share the same promise
  }
}


