// static/anyui-widget-cls.js
import {widgetManager} from "./widget-manager.js";

const classCounters = new Map();

export class AnyuiWidget {
    constructor(initialState = {}) {
        try{
        const className = this.constructor.name;
        var id=null;
        // ID handling: user-provided takes priority
        if (initialState.id !== undefined) {
            id = String(initialState.id);
            //delete initialState.id;//do not modify the initialstate object
        } else {
            if (!classCounters.has(className)) {
                classCounters.set(className, 0);
            }
            const count = classCounters.get(className);
            id = `${className}_${String(count).padStart(3, '0')}`;
            classCounters.set(className, count + 1);
        }
        const cachedModel=widgetManager.get_model(id);
        if (cachedModel) { 
            if (this.constructor !== cachedModel.constructor){
                console.error(`Type mismatch: {id:"${id}", type:"${this.constructor.name}"}, {id:"${cachedModel.id}", type:"${cachedModel.constructor.name}"}`);
            };
            return cachedModel;
        }
        
        this.id=id;
        this.state = { ...initialState };
        this.listeners = {};
        this.widget_manager = widgetManager; // Set by the manager upon registration
        this._buffer = {};

        // Mirror the Python class attributes
        this._esm = null;
        this._css = null;

        widgetManager.register_model(this);
    }catch(err){
        console.error(err.message);
    }
    }

    get(name) {
        return this.state[name];
    }

    set(name, value) {
        this._buffer[name] = value;
    }

    // === NEW: send custom message (mirrors ipywidgets / anywidget model.send) ===
    send(content, callbacks = null, buffers = null) {
        console.log(`[${this.id}] send() called →`, content);

        // For standalone mode (no Python backend), you can just log or ignore
        // If you later add a bridge, post the message here

        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.anyui) {
            window.webkit.messageHandlers.anyui.postMessage({
                method: 'custom_message',
                model_id: this.id,        // or this.model_id if you set it
                content: content,
                buffers: buffers
            });
        }

        // Trigger the "msg:custom" event on the model itself (so listeners see it)
        this.trigger("msg:custom", content, buffers || []);
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    // === NEW: off() - remove listener(s) ===
    off(event = null, callback = null) {
        if (!event) {
            // remove all listeners
            this.listeners = {};
            console.log(`[${this.id}] off() - removed all listeners`);
            return;
        }

        if (!callback) {
            // remove all listeners for this event
            delete this.listeners[event];
            console.log(`[${this.id}] off("${event}") - removed all callbacks for event`);
            return;
        }

        // remove specific callback
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
            if (this.listeners[event].length === 0) {
                delete this.listeners[event];
            }
            console.log(`[${this.id}] off("${event}") - removed one callback`);
        }
    }

    save_changes() {
        const changes = { ...this._buffer };
        for (const [key, value] of Object.entries(changes)) {
            this.state[key] = value;

            // === Logging for change events ===
            console.log(`[${this.id}] change:${key} →`, value);

            this.trigger(`change:${key}`, value);
        }
        this._buffer = {};

        // Sync to Python/bridge if present
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.anyui) {
            window.webkit.messageHandlers.anyui.postMessage({
                method: 'update_state',
                model_id: this.id,   // adjust if you use model_id
                changes: changes
            });
        }
    }

    trigger(event, ...args) {
        const cbs = this.listeners[event] || [];
        if (cbs.length > 0 && (event.startsWith("change:") || event === "msg:custom")) {
            console.log(`[${this.id}] triggering "${event}" with`, ...args);
        }
        cbs.forEach(cb => cb(...args));
    }

    create_view({el = null, attribs = {}} = {}) {
        return this.widget_manager.create_view(this, {el: el, attribs: attribs});
    }
}

export function loadCSS(relpath) {
    return new Promise((resolve, reject) => {
        const href = new URL(relpath, import.meta.url).href;
        if (document.querySelector(`link[href="${href}"]`)) return resolve();

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onload = resolve;
        link.onerror = () => reject(new Error(`Could not load CSS at ${href}`));
        document.head.appendChild(link);
    });
}