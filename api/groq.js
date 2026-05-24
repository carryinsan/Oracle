// api/groq.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    try {
        const { promptText, systemInstruction, expectJson } = await req.json();
        const apiKey = process.env.GROQ_KEY;
        if (!apiKey) return new Response(JSON.stringify({ error: "Missing GROQ_KEY" }), { status: 500 });

        let messages = [];
        if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
        messages.push({ role: "user", content: promptText });

        const payload = {
            model: "llama-3.1-8b-instant", // Groq's ultra-fast Llama Scout model
            messages: messages,
            temperature: 0.2
        };
        if (expectJson) payload.response_format = { type: "json_object" };

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
