// File Path: js/api/geminiRetry.js
// Purpose: Exponential backoff with full jitter to handle Gemini API rate limits (429s) gracefully.

export class ResilienceEngine {
    /**
     * Executes an async operation with exponential backoff and jitter.
     * @param {Function} operation - The async function to execute.
     * @param {number} maxRetries - Maximum number of retry attempts.
     * @param {number} baseDelayMs - Starting delay in milliseconds.
     * @returns {Promise<any>}
     */
    static async executeWithRetry(operation, maxRetries = 5, baseDelayMs = 2000) {
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                return await operation();
            } catch (error) {
                attempt++;
                const isRateLimit = error.message.includes('429') || error.status === 429;
                const isServerError = error.message.includes('50') || error.status >= 500;

                if (!isRateLimit && !isServerError) {
                    // Do not retry client errors (400, 401, 403)
                    throw error;
                }

                if (attempt >= maxRetries) {
                    console.error(`[ResilienceEngine] Max retries (${maxRetries}) exhausted. Operation failed.`);
                    throw error;
                }

                // Calculate Exponential Backoff with Full Jitter
                // Delay = random_between(0, min(cap, base * 2^attempt))
                const maxDelay = Math.min(30000, baseDelayMs * Math.pow(2, attempt));
                const jitterDelay = Math.floor(Math.random() * maxDelay);

                console.warn(`[ResilienceEngine] API constraint detected (Attempt ${attempt}/${maxRetries}). Retrying in ${jitterDelay}ms...`);
                
                await this.sleep(jitterDelay);
            }
        }
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
