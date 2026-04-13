import { widgetManager } from "./widget-manager.js";
import { AnyuiWidget,loadCSS } from './anyui-widget-cls.js';
import _esm from './box.js';
const _css_promise = loadCSS('./box.css');

export default class Box extends AnyuiWidget {
  constructor(initialState = { children: [] } ) {  
    super(initialState);
    this._esm = _esm;
    this._css_promise = _css_promise;   // share the same promise
  }
  static {widgetManager.register_class(this);}
}


