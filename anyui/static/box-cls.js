import { widgetManager } from "./widget-manager.js";
import { AnyuiWidget,loadCSS } from './anyui-widget-cls.js';
import _esm from './box.js';
const _css_promise = loadCSS('../anyui/static/box.css');

class Box extends AnyuiWidget {
  constructor(initialState = { children: [] } ) {
    super(initialState);
    this._esm = _esm;
    this._css_promise = _css_promise;   // share the same promise
  }
}


export {Box};
export default {Box};
