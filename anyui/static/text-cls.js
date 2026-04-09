// anyui/static/int-text-cls.js
import { AnyuiWidget, loadCSS } from "./anyui-widget-cls.js";

import _esm from "./text.js";
const _css_promise = loadCSS("./text.css");   // optional for now

export default class Text extends AnyuiWidget {
  constructor(initialState = {}) {
    super(initialState);
    this._esm = _esm;
    this._css_promise = _css_promise;
  }
}