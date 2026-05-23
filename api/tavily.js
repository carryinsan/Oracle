// api/tavily.js
export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    
    try {
        const body = await req.json();
        
        // Inject secure key from environment
        body.api_key = process.env.TAVILY_API_KEY;

        const response = await fetch("https://api.tavily.com/search", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
