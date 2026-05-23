// js/api/geminiRetry.js

export async function fetchWithRetry(url, options, maxRetries = 3, baseDelay = 1000) {
    let attempt = 0;

    while (attempt < maxRetries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s hard timeout
        options.signal = controller.signal;

        try {
            const response = await fetch(url, options);
            clearTimeout(timeoutId);

            // If successful or client error (bad request), return immediately
            if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
                return response;
            }

            // Throw to trigger catch block for 429 or 5xx
            throw new Error(`HTTP Error: ${response.status}`);

        } catch (error) {
            clearTimeout(timeoutId);
            attempt++;

            if (attempt >= maxRetries || error.name === 'AbortError') {
                console.error(`[GeminiRetry] Request failed after ${attempt} attempts:`, error);
                throw error;
            }

            // Exponential backoff with randomized jitter
            const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
            const jitter = Math.random() * exponentialDelay;
            const finalWaitTime = exponentialDelay + jitter;

            console.warn(`[GeminiRetry] Network fault. Retrying in ${Math.round(finalWaitTime)}ms...`);
            await new Promise(resolve => setTimeout(resolve, finalWaitTime));
        }
    }
}
