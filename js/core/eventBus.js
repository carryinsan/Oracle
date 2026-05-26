// File Path: js/core/eventBus.js
// Purpose: Central nervous system for decoupled component communication.
// Mitigates memory leaks via strict listener management.

class EventBusCore {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event.
     * @param {string} event - The event name.
     * @param {Function} callback - The function to execute.
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    /**
     * Unsubscribe from an event to prevent memory leaks (CRITICAL for SPA).
     * @param {string} event - The event name.
     * @param {Function} callback - The function to remove.
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
            if (this.listeners.get(event).size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Subscribe to an event exactly once.
     * @param {string} event - The event name.
     * @param {Function} callback - The function to execute.
     */
    once(event, callback) {
        const wrapper = (payload) => {
            callback(payload);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }

    /**
     * Emit an event to all subscribers.
     * @param {string} event - The event name.
     * @param {any} payload - Data to pass to callbacks.
     */
    emit(event, payload = null) {
        if (this.listeners.has(event)) {
            // Copy the set to prevent issues if a listener unsubscribes during execution
            const callbacks = Array.from(this.listeners.get(event));
            callbacks.forEach(callback => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error(`[EventBus] Error in listener for event '${event}':`, error);
                }
            });
        }
    }

    /**
     * Clears all listeners. Used heavily during research state resets.
     */
    clearAll() {
        this.listeners.clear();
        console.log("[EventBus] All listeners purged. System reset.");
    }
}

// Export as a singleton
export const EventBus = new EventBusCore();
