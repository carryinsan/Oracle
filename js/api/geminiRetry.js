// js/api/geminiRetry.js
import { eventBus } from '../core/eventBus.js';

export async function fetchWithRetry(url, options, maxRetries = 10, baseDelay = 2000) {
    let attempt = 0;

    while (attempt < maxRetries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout
        options.signal = controller.signal;

        try {
            const response = await fetch(url, options);
            clearTimeout(timeoutId);

            // If successful or a non-429 client error (like a bad prompt), return it
            if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
                return response;
            }

            // Throw 429 (Too Many Requests) or 5xx to the catch block for recovery
            throw new Error(`HTTP Error: ${response.status}`);

        } catch (error) {
            clearTimeout(timeoutId);
            const isRateLimit = error.message.includes('429');
            
            attempt++;

            if (attempt >= maxRetries || error.name === 'AbortError') {
                console.error(`[GeminiRetry] System exhausted all ${maxRetries} recovery attempts.`);
                throw error;
            }

            // If 429, force a massive 15-second cooldown. Otherwise, standard exponential backoff.
            let delayTime = isRateLimit ? 15000 : (baseDelay * Math.pow(2, attempt - 1)) + (Math.random() * 2000);

            // Visibly tell the UI we are auto-recovering so it doesn't look frozen
            if (isRateLimit) {
                eventBus.publish('PIPELINE_ACTION', { action: 'API Rate Limit (429) Protected. Auto-recovering in 15s...' });
            } else {
                eventBus.publish('PIPELINE_ACTION', { action: `Network anomaly detected. Auto-recovering (Attempt ${attempt})...` });
            }

            // Sleep and wait for API to cool down
            await new Promise(resolve => setTimeout(resolve, delayTime));
        }
    }
}
