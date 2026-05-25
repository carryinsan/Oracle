export const config = { runtime: 'edge' };

const MAX_SAFE_CHARS = 100000;

function truncateForGroq(messages) {
    let totalChars = JSON.stringify(messages).length;
    if (totalChars <= MAX_SAFE_CHARS) return messages;
    
    let compressed = [...messages];
    if (compressed.length > 2) {
        compressed[1] = { 
            role: "system", 
            content: "[SYSTEM LOG: CONTEXT TRUNCATED. PROCEED WITH AVAILABLE DATA.]" 
        };
    }
    return compressed;
}

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const { messages, stream = true } = await req.json();
        const safeMessages = truncateForGroq(messages);
        const apiKey = process.env.GROQ_API_KEY;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-4-scout",
                messages: safeMessages,
                stream: stream,
                temperature: 0.3 // Kept low for deterministic JSON/planning outputs
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq Upstream Error: ${response.status} - ${errText}`);
        }

        if (stream) {
            return new Response(response.body, {
                headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
            });
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: `[FATAL_ERROR] Groq Llama Pipeline: ${error.message}` }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
