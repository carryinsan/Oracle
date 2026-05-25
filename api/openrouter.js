export const config = { runtime: 'edge' };

const MAX_SAFE_CHARS = 100000;

function truncateForOpenRouter(messages) {
    let totalChars = JSON.stringify(messages).length;
    if (totalChars <= MAX_SAFE_CHARS) return messages;
    
    let compressed = [...messages];
    if (compressed.length > 2) {
        compressed[1] = { 
            role: "system", 
            content: "[SYSTEM LOG: CONTEXT COMPRESSED BY EDGE GOVERNOR. MAINTAIN FOCUS.]" 
        };
    }
    return compressed;
}

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const { messages, stream = true } = await req.json();
        const safeMessages = truncateForOpenRouter(messages);
        const apiKey = process.env.OPENROUTER_API_KEY;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://lexisai.com', // Required by OpenRouter
                'X-Title': 'LexisAI Deep Research'
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-r1-pro",
                messages: safeMessages,
                stream: stream,
                temperature: 0.4
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenRouter DeepSeek Error: ${response.status} - ${errText}`);
        }

        if (stream) {
            return new Response(response.body, {
                headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
            });
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: `[FATAL_ERROR] OpenRouter Pipeline: ${error.message}` }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
