
import { AnyuiWidget,loadCSS } from './anyui-widget-cls.js';

import _esm from './slider.js';
const _css = '../anyui/static/slider.css'
export class Slider extends AnyuiWidget {
    constructor(id, state = { value: 0 }) {
        super(id, state);
        // Point to the same ESM the Python class uses
        this._esm = _esm;
        this._css = _css;
        loadCSS(_css);
    }
}