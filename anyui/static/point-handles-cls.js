// anyui/static/point-handles-cls.js
import { AnyuiWidget, loadCSS, widgetManager } from "./anyui-model.js";
import _esm from "./point-handles.js";

const _css_promise = loadCSS("./point-handles.css");

export default class PointHandles extends AnyuiWidget {
  constructor(
    initialState = {
      points: [
        [-1, 0],
        [1, 0],
        [0, 1.2],
      ],
      view: { scale: 80, tx: 0, ty: 0 },
      width: 480,
      height: 480,
      active: -1,
      radius: 11,
      visible: true,
    }
  ) {
    const state = {
      points: [
        [-1, 0],
        [1, 0],
        [0, 1.2],
      ],
      view: { scale: 80, tx: 0, ty: 0 },
      width: 480,
      height: 480,
      active: -1,
      radius: 11,
      visible: true,
      ...initialState,
    };
    super(state);
    this._esm = _esm;
    this._css_promise = _css_promise;
  }

  static {
    widgetManager.register_class(this);
  }
}
