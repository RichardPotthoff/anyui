
import { AnyuiWidget,loadCSS } from './anyui-widget-cls.js';

import _esm from './counter-button.js';
loadCSS('../anyui/static/counter-button.css');
export class CounterButton extends AnyuiWidget {
    constructor(state = { value: 0 }) {
        super(state);
        // Point to the same ESM the Python class uses
        this._esm = _esm;
        
    }
}
