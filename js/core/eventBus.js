/**
 * LexisAI Global Pub/Sub Event Bus
 * Path: /js/core/eventBus.js
 */

class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const filtered = this.listeners.get(event).filter(cb => cb !== callback);
        this.listeners.set(event, filtered);
    }

    emit(event, payload = {}) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(callback => {
            try {
                callback(payload);
            } catch (error) {
                // If a UI element fails to render, log it but DO NOT crash the engine
                console.error(`[EventBus] Handled crash in listener for ${event}:`, error);
            }
        });
    }
}

export const eventBus = new EventBus();
