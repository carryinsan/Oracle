/**
 * LexisAI Application Bootstrapper & Error Boundary
 * Path: /js/core/app.js
 */

import { eventBus } from './eventBus.js';
import { router } from './router.js';

class LexisOS {
    constructor() {
        this.setupGlobalErrorBoundary();
        this.bindGlobalInterceptors();
        
        // Initial boot injection
        router.handleRoute();
    }

    setupGlobalErrorBoundary() {
        const triggerToast = (msgString) => {
            const toast = document.getElementById('global-error-toast');
            const msg = document.getElementById('error-message-text');
            if (toast && msg) {
                msg.textContent = msgString;
                toast.classList.add('visible');
                
                // Auto-hide after 6 seconds
                setTimeout(() => toast.classList.remove('visible'), 6000);
            }
        };

        // 1. Listen for internally dispatched pipeline errors
        eventBus.on('FATAL_ERROR', (payload) => {
            console.error(payload.message);
            triggerToast(payload.message || 'Unknown Pipeline Failure');
        });

        // 2. Catch native runtime exceptions (Undefined DOM nodes, etc.)
        window.onerror = (message, source, lineno) => {
            const cleanMsg = typeof message === 'object' ? 'DOM/Script execution error' : message;
            eventBus.emit('FATAL_ERROR', { message: `[SYS_CRASH] ${cleanMsg} (Line: ${lineno})` });
            return true; 
        };

        // 3. Catch silent async fetch/promise failures (504s, 429s, Network Drops)
        window.addEventListener('unhandledrejection', (event) => {
            const errorReason = event.reason?.message || event.reason || 'Unhandled Async Rejection';
            eventBus.emit('FATAL_ERROR', { message: `[NETWORK_FAIL] ${errorReason}` });
        });
    }

    bindGlobalInterceptors() {
        document.body.addEventListener('click', (e) => {
            // KILL SWITCH: Prevent all native HTML <form> GET reloads
            if (e.target.tagName === 'BUTTON' && e.target.type === 'submit') {
                e.preventDefault();
            }

            // Global SPA link interceptor
            const link = e.target.closest('a');
            if (link && link.getAttribute('href')?.startsWith('#')) {
                e.preventDefault();
                router.navigate(link.getAttribute('href'));
            }
            
            // Explicit interception of the Index "Initialize Pipeline" button
            if (e.target.id === 'btn-init-research') {
                e.preventDefault();
                const queryInput = document.getElementById('research-query-input');
                
                if (queryInput && queryInput.value.trim() !== '') {
                    // Temporarily persist intent in memory, then swap view
                    sessionStorage.setItem('LEXIS_INTENT', queryInput.value.trim());
                    router.navigate('#/research');
                } else {
                    eventBus.emit('FATAL_ERROR', { message: 'Research directive cannot be empty.' });
                }
            }
        });
    }
}

// Instantiate OS on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.LexisApp = new LexisOS();
});
