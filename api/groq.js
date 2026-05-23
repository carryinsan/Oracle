// api/groq.js
export const config = {
    runtime: 'edge' 
};

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    
    try {
        const { promptText, systemInstruction, expectJson } = await req.json();
        
        const apiKey = process.env.GROQ_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: "CRITICAL: GROQ_KEY is missing from Vercel." }), { status: 500 });
        }

        let messages = [];
        if (systemInstruction) {
            messages.push({ role: "system", content: systemInstruction });
        }
        messages.push({ role: "user", content: promptText });

        const payload = {
            // Using Groq's fastest Llama model as the designated Scout 
            model: "llama3-8b-8192", 
            messages: messages,
            temperature: 0.2
        };

        if (expectJson) {
            payload.response_format = { type: "json_object" };
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return new Response(JSON.stringify({ error: `Groq Edge Ban/Error: ${errorText}` }), { 
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json();
        const outputText = data.choices[0]?.message?.content || "";
        
        return new Response(JSON.stringify({ text: outputText }), { 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
