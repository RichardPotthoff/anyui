import {widgetManager} from "./widget-manager.js";
const classCounters=new Map();
export class AnyuiWidget {
    constructor(initialState = {}) {
        const className = this.constructor.name;

    // ID handling: user-provided takes priority
        if (initialState.id !== undefined) {
          this.id = String(initialState.id);
          delete initialState.id;
        } else {
          if (!classCounters.has(className)) {
            classCounters.set(className, 0);
          }
          const count = classCounters.get(className);
          this.id = `${className}_${String(count).padStart(3, '0')}`;
          classCounters.set(className, count + 1);
        }
        this.state = { ...initialState};
        this.listeners = {};
        this.widget_manager = null; // Set by the manager upon registration
        this._buffer = {}; 
        // These mirror the Python class attributes
        this._esm = null; 
        this._css = null;
        widgetManager.register_model(this);
    }

    get(name) {
        return serialize(this.state[name]);
            // Return the staged value if it exists, otherwise the confirmed state
        //return name in this._buffer ? this._buffer[name] : this.state[name];
    }

    set(name, value) {
            this._buffer[name] = value;
        }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    
    save_changes() {
        // 1. Update the local state from the buffer
        const changes = { ...this._buffer };
        for (const [key, value] of Object.entries(changes)) {
            this.state[key] = value;
            this.trigger(`change:${key}`, value);
        }
        this._buffer = {}; 
    
        // 2. Sync to Pythonista if the bridge exists
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.anyui) {
            window.webkit.messageHandlers.anyui.postMessage({
                method: 'update_state',
                model_id: this.model_id,
                changes: changes
            });
        }
    }

    trigger(event, ...args) {
        (this.listeners[event] || []).forEach(cb => cb(...args));
    }
}

//replace widgets with their ids
export function serialize(value) {
    if (value instanceof AnyuiWidget) {
      return value.id;
    }
    if (Array.isArray(value)) {
      return value.map(item => serialize(item));
    }
    if (value && typeof value === 'object' && value !== null) {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = serialize(v);
      }
      return out;
    }
    return value;
  }
  
export function loadCSS(href) {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (document.querySelector(`link[href="${href}"]`)) return resolve();
        
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onload = resolve;
        link.onerror = () => reject(new Error(`Could not load CSS at ${href}`));
        document.head.appendChild(link);
    });
}