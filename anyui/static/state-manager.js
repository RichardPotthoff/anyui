export class AnyUIModel {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Map();
  }

  // Required by anywidget spec: Get a property value
  get(key) {
    return this.state[key];
  }

  // Required: Set a property and notify listeners
  set(key, value) {
    this.state[key] = value;
    const eventName = `change:${key}`;
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach(cb => cb());
    }
  }

  // Required: Register event listeners for "change:key"
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);
  }

  // Required: Unsubscribe from events
  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).delete(callback);
    }
  }

  // Required: Signal that local changes should sync to a backend
//  save_changes() {
//    console.log("Syncing to backend:", this.state);
    // This is where you would hook into your WKWebView or WebSocket bridge
//  }
  save_changes() {
    console.log("Syncing to backend:", this.state);
    
    // Check if we are running inside Pythonista's WKWebView
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.anywidget) {
      window.webkit.messageHandlers.anywidget.postMessage(this.state);
    }
  }

}

export class AnyUIManager {
    constructor() {
        this.activeWidgets = new Map(); // Store cleanup functions
    }
    
    async mount(modulePath, model, container) {
        this.unmount(container);
        const { default: widget } = await import(modulePath);

        // 1. Run initialize logic (Calculation/Listeners)
        if (widget.initialize) {
            await widget.initialize({ model });
        }

        // 2. Run render logic (UI/DOM)
        if (widget.render) {
            const cleanup = await widget.render({ model, el: container });
            if (typeof cleanup === 'function') {
                this.activeWidgets.set(container, cleanup);
            }
        }
    }

    unmount(container) {
        if (this.activeWidgets.has(container)) {
            const cleanup = this.activeWidgets.get(container);
            cleanup(); // Execute the closure
            this.activeWidgets.delete(container);
        }
    }
}
