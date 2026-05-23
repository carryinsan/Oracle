// api/gemini.js
export const config = {
    runtime: 'edge' 
};

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    
    try {
        const { promptText, systemInstruction, expectJson, stream } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "CRITICAL: Vercel Environment Variable GEMINI_API_KEY is missing." }), { status: 500 });
        }

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
            // DIAGNOSTIC EXTRACTION: Pull the exact string from Google
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
