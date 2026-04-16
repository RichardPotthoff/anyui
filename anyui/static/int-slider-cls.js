import { widgetManager } from "./widget-manager.js";
import { AnyuiWidget,loadCSS } from './anyui-widget-cls.js';

import _esm from './int-slider.js';
const _css_promise = loadCSS('./int-slider.css');

export default class Slider extends AnyuiWidget {
    constructor(state = {value: 50, min:0, max:100, step:1}) {
        super(state);
        // Point to the same ESM the Python class uses
        this._esm = _esm;
        this._css = _css_promise; 
    }
    static {widgetManager.register_class(this);}
}