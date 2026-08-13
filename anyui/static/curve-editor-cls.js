// anyui/static/curve-editor-cls.js
// Thin AnyuiWidget wrapper that mirrors wigglystuff.CurveEditor defaults.
// The real render lives in curve-editor.js (bundled D3 + UI) and is shared
// unchanged with the original anywidget.

import { AnyuiWidget, loadCSS, widgetManager } from "./anyui-model.js";
import _esm from "./curve-editor.js";

const _css_promise = loadCSS("./curve-editor.css");

const DEFAULT_POINTS = [
  { x: 0.0, y: 0.15 },
  { x: 0.18, y: 0.32 },
  { x: 0.38, y: 0.72 },
  { x: 0.62, y: 0.48 },
  { x: 0.82, y: 0.88 },
  { x: 1.0, y: 0.58 },
];

export default class CurveEditor extends AnyuiWidget {
  constructor(
    initialState = {
      points: DEFAULT_POINTS,
      samples: [],
      x: 0.0,
      y: 0.15,
      t: 0.0,
      show_axes: false,
      n_samples: 100,
      curve: "natural",
      tension: 0.0,
      alpha: 0.5,
      closed: false,
      playing: false,
      loop: false,
      interval_ms: 30,
      duration_ms: 12000,
      sync_throttle_ms: 250,
      selected_index: -1,
      x_bounds: [0.0, 1.0],
      y_bounds: [0.0, 1.0],
      width: 600,
      height: 360,
    }
  ) {
    // Allow callers to pass a partial state; fill missing keys from defaults.
    const state = {
      points: DEFAULT_POINTS,
      samples: [],
      x: 0.0,
      y: 0.15,
      t: 0.0,
      show_axes: false,
      n_samples: 100,
      curve: "natural",
      tension: 0.0,
      alpha: 0.5,
      closed: false,
      playing: false,
      loop: false,
      interval_ms: 30,
      duration_ms: 12000,
      sync_throttle_ms: 250,
      selected_index: -1,
      x_bounds: [0.0, 1.0],
      y_bounds: [0.0, 1.0],
      width: 600,
      height: 360,
      ...initialState,
    };
    // Keep a defensive copy of points so the default array is not mutated.
    if (!Array.isArray(state.points)) state.points = DEFAULT_POINTS.slice();
    else state.points = state.points.map((p) => ({ x: +p.x, y: +p.y }));

    super(state);
    this._esm = _esm;
    this._css_promise = _css_promise;
  }

  static {
    widgetManager.register_class(this);
  }
}
