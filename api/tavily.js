// api/tavily.js
export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    
    try {
        const body = await req.json();
        
        // Check both common naming conventions
        const apiKey = process.env.TAVILY_API_KEY || process.env.TAVILY_KEY;
        
        if (!apiKey) {
            return new Response(JSON.stringify({ error: "CRITICAL: Tavily API Key is missing from Vercel." }), { status: 500 });
        }

        body.api_key = apiKey;

        const response = await fetch("https://api.tavily.com/search", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            return new Response(JSON.stringify({ error: errText }), { status: response.status });
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
