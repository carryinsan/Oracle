// api/openrouter.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const {promptText, systemInstruction, expectJson, stream } = await req.json();
        const apiKey = process.env.OPENROUTER_KEY;

        if (!apiKey) return new Response (JSON.stringify({ error: "Missing OPENROUTER_KEY" }), { status: 500 });

        let messages = [];
        
        if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
        messages.push({ role: "user", content: promptText });

        // MODIFIED: Extracted the conditional statement outside of the object literal structure
        const payload = {
            model: "deepseek/deepseek-chat", // DeepSeek V4 Pro architecture
            messages: messages,
            stream: stream
        };

        if (expectJson) payload.response_format = { type: "json_object" };

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://lexisai.vercel.app",
                "X-Title": "LexisAl"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(await response.text());

        if (stream) {
            return new Response (response.body, { headers: { "Content-Type": "text/event-stream" } });
        } else {
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
        }
    } catch (e) {
        return new Response (JSON.stringify({ error: e.message }), { status: 500 });
    }
}
