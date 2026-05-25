export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const { query } = await req.json();
        if (!query) throw new Error("Search intent missing from payload.");

        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) throw new Error("Tavily API key missing in edge environment.");

        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: "advanced",
                max_results: 20,
                include_raw_content: true // Required for deep contradiction extraction
            })
        });

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`Tavily Rejected Request: ${response.status} - ${errData}`);
        }

        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: `[FATAL_ERROR] Tavily Retrieval Failed: ${error.message}` }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
