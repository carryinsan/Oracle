// api/gemini.js
export const config = {
    runtime: 'edge' 
};

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    
    try {
        const { promptText, systemInstruction, expectJson, stream } = await req.json();
        
        // 1. THE LOAD BALANCER: Pool your 3 specific keys from Vercel
        const keys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_1,
            process.env.GEMINI_API_KEY_2
        ].filter(Boolean); // This strictly removes any undefined keys to prevent crashes

        if (keys.length === 0) {
            return new Response(JSON.stringify({ error: "CRITICAL: No GEMINI API keys found in Vercel." }), { status: 500 });
        }

        // 2. THE ROTATION: Randomly pick one of the 3 keys for this specific request
        // This splits your 20-request Free Tier limit across all 3 keys (giving you 60 requests instantly)
        const apiKey = keys[Math.floor(Math.random() * keys.length)];

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

        if (!response.ok) {
            const errorText = await response.text();
            return new Response(JSON.stringify({ error: `Google Edge Ban/Error: ${errorText}` }), { 
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (stream) {
            return new Response(response.body, { headers: { 'Content-Type': 'text/event-stream' } });
        } else {
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
