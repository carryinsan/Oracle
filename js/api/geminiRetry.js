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

            if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
                return response;
            }

            throw new Error(`HTTP Error: ${response.status}`);

        } catch (error) {
            clearTimeout(timeoutId);
            const isRateLimit = error.message.includes('429');
            attempt++;

            if (attempt >= maxRetries || error.name === 'AbortError') {
                console.error(`[GeminiRetry] System exhausted all ${maxRetries} recovery attempts.`);
                throw error;
            }

            let delayTime;
            if (isRateLimit) {
                // Exponential 429 scaling: 15s -> 30s -> 60s
                delayTime = 15000 * Math.pow(2, attempt - 1);
                eventBus.publish('PIPELINE_ACTION', { action: `API Rate Limit (429). Forcing cooldown... waiting ${delayTime / 1000}s.` });
            } else {
                delayTime = (baseDelay * Math.pow(2, attempt - 1)) + (Math.random() * 2000);
                eventBus.publish('PIPELINE_ACTION', { action: `Network anomaly detected. Auto-recovering (Attempt ${attempt})...` });
            }

            await new Promise(resolve => setTimeout(resolve, delayTime));
        }
    }
}
