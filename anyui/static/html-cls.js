// static/html-cls.js
import { AnyuiWidget, loadCSS } from "./anyui-widget-cls.js";
import { widgetManager } from "./widget-manager.js";
import _esm from "./html.js";

const _css_promise = loadCSS("../anyui/static/html.css"); // optional, can be empty

export class HTML extends AnyuiWidget {
  constructor(initialState = {}) {
    super(initialState);
    this._esm = _esm;
    this._css_promise = _css_promise;
  }
}