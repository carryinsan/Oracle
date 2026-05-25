/**
 * LexisAI Safe SSE Buffer
 * Path: /js/api/geminiStream.js
 */
import { eventBus } from '../core/eventBus.js';

export class SSEParser {
    static async parseStream(response, onChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                
                // Only process when a complete SSE packet boundary is detected
                let packets = buffer.split('\n\n');
                buffer = packets.pop(); // Keep the incomplete packet in the buffer

                for (let packet of packets) {
                    const dataMatch = packet.match(/^data:\s*(.*)/);
                    if (dataMatch && dataMatch[1]) {
                        const rawData = dataMatch[1].trim();
                        if (rawData === '[DONE]') continue;
                        
                        try {
                            const parsed = JSON.parse(rawData);
                            // Navigate Gemini's specific chunk structure safely
                            if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                                onChunk(parsed.candidates[0].content.parts[0].text);
                            }
                        } catch (e) {
                            console.warn("[STREAM_PARSE_WARNING] Ignored malformed chunk.", e.message);
                        }
                    }
                }
            }
        } catch (error) {
            eventBus.emit('FATAL_ERROR', { message: `[STREAM_FAILURE] Connection interrupted: ${error.message}` });
        } finally {
            reader.releaseLock();
        }
    }
}
