import { AnyuiWidget,loadCSS } from './anyui-widget-cls.js';
import _esm from './box.js';
const _css = '../anyui/static/box.css'
export class Box extends AnyuiWidget {
    constructor(id, state = { children: [] }) {
        super(id, state);
        // Point to the same ESM the Python class uses
        this._esm = _esm; 
        this._css = _css;
        loadCSS(_css);
    }
}
