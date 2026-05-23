// js/api/geminiRetry.js
import { eventBus } from '../core/eventBus.js';

export async function fetchWithRetry(url, options, maxRetries = 10, baseDelay = 2000) {
    let attempt = 0;

    while (attempt < maxRetries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); 
        options.signal = controller.signal;

        try {
            const response = await fetch(url, options);
            clearTimeout(timeoutId);

            // ONLY return if strictly successful
            if (response.ok) {
                return response;
            }

            // Extract the diagnostic error from the backend
            let errorMsg = `HTTP Error: ${response.status}`;
            try {
                const errData = await response.json();
                errorMsg = errData.error ? errData.error : errorMsg;
            } catch(e) {}

            throw new Error(errorMsg);

        } catch (error) {
            clearTimeout(timeoutId);
            attempt++;

            if (attempt >= maxRetries || error.name === 'AbortError') {
                throw error;
            }

            const isRateLimit = error.message.includes('429');
            let delayTime;

            if (isRateLimit) {
                delayTime = 15000 * Math.pow(2, attempt - 1);
                // PRINT EXACT ERROR TO UI
                eventBus.publish('PIPELINE_ACTION', { action: `API 429 Cooldown (${delayTime / 1000}s). Reason: ${error.message}` });
            } else {
                delayTime = (baseDelay * Math.pow(2, attempt - 1)) + (Math.random() * 2000);
                eventBus.publish('PIPELINE_ACTION', { action: `Network anomaly (${error.message}). Retrying...` });
            }

            await new Promise(resolve => setTimeout(resolve, delayTime));
        }
    }
}
