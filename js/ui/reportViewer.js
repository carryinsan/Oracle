/**
 * LexisAI Final Synthesis Renderer
 * Path: /js/ui/reportViewer.js
 */
import { eventBus } from '../core/eventBus.js';
import { router } from '../core/router.js';

export class ReportViewer {
    constructor() {
        this.completeHandler = this.handleCompletion.bind(this);
        this.renderHandler = this.renderContent.bind(this);
        this.teardownHandler = this.teardown.bind(this);

        eventBus.on('REPORT_GENERATION_COMPLETE', this.completeHandler);
        eventBus.on('DOM_READY', this.renderHandler);
        eventBus.on('ROUTE_TEARDOWN', this.teardownHandler);
        
        this.pendingMarkdown = null;
    }

    handleCompletion(payload) {
        // 1. Store the markdown securely in memory
        this.pendingMarkdown = payload.markdown;
        
        // 2. Automatically navigate the user to the Report Viewer
        setTimeout(() => {
            router.navigate('#/report');
        }, 1500); // 1.5s delay to let them see 100% completion
    }

    renderContent(payload) {
        // Only run if we arrived at the report page
        if (payload.route !== '#/report' || !this.pendingMarkdown) return;
        
        const contentContainer = document.getElementById('report-content');
        if (!contentContainer) return;

        try {
            // Built-in Lightweight Markdown Parser to prevent dependency crashes
            let html = this.pendingMarkdown
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/^\> (.*$)/gim, '<blockquote style="border-left:3px solid var(--accent-glow); padding-left:10px; margin:10px 0;">$1</blockquote>')
                .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                .replace(/\*(.*)\*/gim, '<em>$1</em>')
                .replace(/\[(\d+)\]/gim, '<sup class="citation-tag">[$1]</sup>'); // Style citations

            // Handle line breaks and paragraphs safely
            html = html.split('\n\n').map(paragraph => {
                if (!paragraph.startsWith('<h') && !paragraph.startsWith('<b')) {
                    return `<p>${paragraph}</p>`;
                }
                return paragraph;
            }).join('');

            contentContainer.innerHTML = html;
            
        } catch (error) {
            eventBus.emit('FATAL_ERROR', { message: `[RENDER_FAIL] Markdown parse error: ${error.message}` });
        }
    }

    teardown() {
        eventBus.off('REPORT_GENERATION_COMPLETE', this.completeHandler);
        eventBus.off('DOM_READY', this.renderHandler);
        eventBus.off('ROUTE_TEARDOWN', this.teardownHandler);
    }
}
