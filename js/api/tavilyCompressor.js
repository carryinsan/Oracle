// js/api/tavilyCompressor.js

export class TavilyCompressor {
    static compressHTML(rawContent) {
        if (!rawContent) return "";

        try {
            // Utilize native browser DOMParser for rapid HTML stripping
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawContent, 'text/html');

            // Strip heavy non-semantic nodes
            const selectorsToRemove = [
                'script', 'style', 'nav', 'footer', 'header', 
                'aside', 'noscript', 'iframe', 'svg', 'form'
            ];

            selectorsToRemove.forEach(selector => {
                const elements = doc.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            });

            // Extract pure text content and collapse whitespace
            const textContent = doc.body ? doc.body.textContent : rawContent;
            return textContent.replace(/\s+/g, ' ').trim();

        } catch (error) {
            console.warn("[TavilyCompressor] HTML parse failed, falling back to regex.", error);
            // Fallback: Aggressive regex stripping
            return rawContent.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
        }
    }

    static processSearchResults(apiResponse) {
        if (!apiResponse || !apiResponse.results) return [];

        return apiResponse.results.map(result => ({
            title: result.title,
            url: result.url,
            score: result.score,
            content: this.compressHTML(result.raw_content || result.content)
        }));
    }
}
