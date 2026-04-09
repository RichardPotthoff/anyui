import { widgetManager } from "./widget-manager.js";
import { AnyuiWidget,loadCSS } from './anyui-widget-cls.js';
import _esm from './h-box.js';
const _css_promise = loadCSS('./h-box.css');

export default class HBox extends AnyuiWidget {
  constructor(initialState = { children: [] } ) {  
    super(initialState);
    this._esm = _esm;
    this._css_promise = _css_promise;   // share the same promise
  }
}


