/**
 * LexisAI Exponential Backoff & Jitter Wrapper
 * Path: /js/api/geminiRetry.js
 */

export async function withRetry(apiCallPromiseFn, maxRetries = 3, baseDelayMs = 1000) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await apiCallPromiseFn();
        } catch (error) {
            attempt++;
            if (attempt >= maxRetries) {
                throw new Error(`[NETWORK_EXHAUSTION] Failed after ${maxRetries} attempts. Last Error: ${error.message}`);
            }
            // Exponential backoff with 30% random jitter to prevent Thundering Herd
            const jitter = Math.random() * 0.3 + 0.85; 
            const delay = baseDelayMs * Math.pow(2, attempt) * jitter;
            
            console.warn(`[RETRY] API Call Failed. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
