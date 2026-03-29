# anyui

**Lightweight, reusable UI widgets for anywidget — Jupyter, marimo, and standalone browser apps.**

A Tk/Pythonista.ui-inspired widget kit built on top of [anywidget](https://anywidget.dev).  
Write once, use everywhere: Jypyter, marimo reactive apps, or pure HTML.

## Why anyui

- Drop-in replacements for common Jupyter/marimo UI elements (buttons, sliders, entries, labels, frames, …)
- True two-way state synchronization between Python backend and browser frontend
- Full standalone mode: embed everything in a single HTML file — no Python, no kernel
- Modular architecture: experiment with different state managers and sync strategies in parallel
- Inspired by Tcl/Tk and Pythonista.ui for a familiar, minimal, Pythonic feel

## Features

- Shared `DualStateManager` (frontend + optional backend) with built-in loop prevention
- Per-widget packages for easy parallel development and independent releases
- Works today in Jupyter Lab/Notebook, marimo, and static HTML
- Sequence-number-based sync (no clocks, no timestamps, JSON Patch+WS)
- Tiny footprint — no heavy frameworks

> [!NOTE]
> *The following sections are a draft for future implementation:*
> ## Quickstart 
> ```bash
> pip install -e ".[all]"          # or install individual packages
> ```
>
## Jupyter / marimo
```Python
from anyui import CounterButton,Box
  
w1 = CounterButton(value=60)
w2 = CounterButton(value=0) 
b = Box(children=[w1,w2])
b
```
> [!NOTE]
> *The following sections are a draft for future implementation:*
> ## Standalone HTML (no Python) 
>    
> ```HTML
> <script type="module">
>     import { Button } from "https://cdn.jsdelivr.net/..."; // or local
>     // full interactive widget with embedded JS logic
> </script>
> ```

## Project layout
```
anyui/                  #  anywidgets (.py) 
└── static/             #  _esm, _css (.js, .css)
demos/                  #  Jupyter, Python(WKWebView), marimo, HTML

```

## Philosophy

Keep widgets tiny, state managers separate, and synchronization pluggable.
Experiment freely without branch switching.

## License

MIT © 2026 Richard Potthoff and contributors
