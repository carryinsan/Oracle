// api/gemini.js
export const config = {
    runtime: 'edge' 
};

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    
    try {
        const { promptText, systemInstruction, expectJson, stream } = await req.json();
        
        // 1. POOL ALL 5 KEYS
        const keys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_1,
            process.env.GEMINI_API_KEY_2,
            process.env.GEMINI_API_KEY_3,
            process.env.GEMINI_API_KEY_4
        ].filter(Boolean);

        if (keys.length === 0) {
            return new Response(JSON.stringify({ error: "CRITICAL: No GEMINI API keys found in Vercel." }), { status: 500 });
        }

        // 2. SHUFFLE KEYS TO DISTRIBUTE LOAD
        let activeKeys = keys.sort(() => 0.5 - Math.random());
        let lastError = null;
        let lastStatus = 500;

        // 3. THE CASCADING WATERFALL: Try keys until one succeeds
        for (let i = 0; i < activeKeys.length; i++) {
            const apiKey = activeKeys[i];
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

            // IF SUCCESS: Return data immediately to frontend
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
                lastError = `Google Error: ${errorText}`;

                // IF 429 RATE LIMIT: Silently catch it and instantly loop to the NEXT key in the array!
                if (lastStatus === 429 && i < activeKeys.length - 1) {
                    continue; 
                }

                // If it's a fatal error (like bad JSON) or we ran out of all 5 keys, break the loop.
                break;
            }
        }

        // If we exhausted all 5 keys without success
        return new Response(JSON.stringify({ error: lastError }), { 
            status: lastStatus,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
