export const config = { runtime: 'edge' };

// Group keys by ACCOUNT to bypass account-level RPM limits
const ACCOUNT_A = [process.env.GEMINI_API_KEY_A]; 
const ACCOUNT_B = [
    process.env.GEMINI_API_KEY_B1, process.env.GEMINI_API_KEY_B2, 
    process.env.GEMINI_API_KEY_B3, process.env.GEMINI_API_KEY_B4
];
const ACCOUNT_C = [process.env.GEMINI_API_KEY_C];
const ACCOUNTS = [ACCOUNT_A, ACCOUNT_B, ACCOUNT_C];

// Safe Input Limits (Approx 25k tokens to prevent TPM overflow)
const MAX_SAFE_CHARS = 100000; 

function truncateForTPM(messages) {
    let totalChars = JSON.stringify(messages).length;
    if (totalChars <= MAX_SAFE_CHARS) return messages;
    
    // Smart Truncation: Keep system prompt (index 0) and latest queries, compress the middle
    let compressed = [...messages];
    if (compressed.length > 2) {
        compressed[1] = { 
            role: "user", 
            parts: [{ text: "[SYSTEM LOG: INTERMEDIATE CONTEXT TRUNCATED TO PREVENT TPM/413 CRASH. FOCUS ON LATEST DIRECTIVES.]" }] 
        };
    }
    return compressed;
}

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const body = await req.json();
        const safeMessages = truncateForTPM(body.contents);
        
        // Round-Robin across Accounts based on time to spread RPM
        let accountIndex = Date.now() % ACCOUNTS.length;
        let attempt = 0;
        let lastError = null;

        while (attempt < ACCOUNTS.length) {
            const currentAccountKeys = ACCOUNTS[accountIndex];
            // Pick a random key from the selected account
            const apiKey = currentAccountKeys[Math.floor(Math.random() * currentAccountKeys.length)];
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: safeMessages })
            });

            if (response.status === 429) {
                attempt++;
                accountIndex = (accountIndex + 1) % ACCOUNTS.length; // Pivot to next account
                await new Promise(r => setTimeout(r, 1000 * attempt)); // Jitter backoff
                lastError = "429: Rate Limit Exceeded on all rotated accounts.";
                continue;
            }

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Upstream Gemini Error: ${response.status} - ${errText}`);
            }

            // Return the raw SSE stream directly to the frontend
            return new Response(response.body, {
                headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
            });
        }

        throw new Error(lastError || "Account rotation failed.");

    } catch (error) {
        return new Response(JSON.stringify({ error: `[FATAL_ERROR] Gemini Edge Gateway: ${error.message}` }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
}
