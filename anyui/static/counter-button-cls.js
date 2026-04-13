
import { AnyuiWidget,loadCSS } from './anyui-widget-cls.js';

import _esm from './counter-button.js';
const _css_promise = loadCSS('./counter-button.css');
export default class CounterButton extends AnyuiWidget {
    constructor(state = { value: 0 }) {
        super(state);
        // Point to the same ESM the Python class uses
        this._esm = _esm;
        this._css_promise = _css_promise;
    }
}
