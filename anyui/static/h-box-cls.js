// anyui/static/h-box-cls.js
import { AnyuiWidget,loadCSS,widgetManager} from './anyui-model.js';

import _esm from './h-box.js';
const _css_promise = loadCSS('./h-box.css');

export default class HBox extends AnyuiWidget {
  constructor(initialState = { children: [] } ) {  
    super(initialState);
    this._esm = _esm;
    this._css_promise = _css_promise;   // share the same promise
  }
  static {widgetManager.register_class(this);}
}


