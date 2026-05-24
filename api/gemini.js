// api/gemini.js
export const config = {
    runtime: 'edge' 
};

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    
    try {
        const { promptText, systemInstruction, expectJson, stream } = await req.json();
        
        // 1. ORGANIZE KEYS INTO STRICT ACCOUNT BUCKETS
        const account1 = [
            process.env.GEMINI_API_KEY
        ].filter(Boolean);

        const account2 = [
            process.env.GEMINI_API_KEY_1,
            process.env.GEMINI_API_KEY_2,
            process.env.GEMINI_API_KEY_3,
            process.env.GEMINI_API_KEY_4
        ].filter(Boolean);

        const account3 = [
            process.env.GEMINI_API_KEY_5
        ].filter(Boolean);

        // Filter out any empty accounts to prevent crashes
        const activeAccounts = [account1, account2, account3].filter(acc => acc.length > 0);

        if (activeAccounts.length === 0) {
            return new Response(JSON.stringify({ error: "CRITICAL: No GEMINI API keys found in Vercel." }), { status: 500 });
        }

        // 2. SHUFFLE THE ACCOUNTS SO WE DON'T HAMMER ACCOUNT 1 EVERY TIME
        activeAccounts.sort(() => 0.5 - Math.random());

        let lastError = null;
        let lastStatus = 500;

        // 3. THE TRI-BUCKET WATERFALL
        for (let i = 0; i < activeAccounts.length; i++) {
            const currentAccountPool = activeAccounts[i];
            
            // Pick one random key from this specific account's pool
            const apiKey = currentAccountPool[Math.floor(Math.random() * currentAccountPool.length)];

            const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash";
            const endpoint = stream ? "streamGenerateContent" : "generateContent";
            const url = `${baseUrl}:${endpoint}?key=${apiKey}`;

            const payload = {
                contents: [{ parts: [{ text: promptText }] }]
            };

            if (systemInstruction) payload.systemInstruction = { parts: [{ text: systemInstruction }] };
            if (expectJson) payload.generationConfig = { responseMimeType: "application/json" };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // IF SUCCESS: Return instantly to the frontend!
            if (response.ok) {
                if (stream) {
                    return new Response(response.body, { headers: { 'Content-Type': 'text/event-stream' } });
                } else {
                    const data = await response.json();
                    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
                }
            } else {
                lastStatus = response.status;
                const errorText = await response.text();
                lastError = `Google Error (Account Bucket ${i+1}): ${errorText}`;

                // IF 429 RATE LIMIT: This account is burned. 
                // We SKIP the rest of the keys in this account and let the loop jump to the next Account Bucket!
                if (lastStatus === 429) {
                    continue; 
                }

                // If it's a weird JSON syntax error, breaking the loop is safest
                break;
            }
        }

        // If ALL 3 Google Accounts are completely exhausted, bubble the error to the UI
        return new Response(JSON.stringify({ error: lastError }), { 
            status: lastStatus,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
