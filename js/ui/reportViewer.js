// js/ui/reportViewer.js
import { eventBus } from '../core/eventBus.js';
import { researchState } from '../engine/researchState.js';

class ReportViewer {
    constructor() {
        this.container = null;
        this.tooltip = null;
        this.init();
    }

    init() {
        eventBus.subscribe('ROUTE_CHANGED', (data) => {
            if (data.path === '/report') {
                this.container = document.getElementById('report-content-container');
                this.tooltip = document.getElementById('citation-tooltip');
                this.renderFinalReport();
            }
        });

        // Auto-route to report when DAG completes
        eventBus.subscribe('PIPELINE_COMPLETE', () => {
            setTimeout(() => {
                window.location.hash = '#/report';
            }, 1500); // Brief pause to let user see 100%
        });
    }

    renderFinalReport() {
        if (!this.container) return;

        const finalMarkdown = researchState.get('sections.final_assembly');
        
        if (!finalMarkdown) {
            this.container.innerHTML = `<p style="color: var(--error-color);">No report generated. Please initiate a research sequence.</p>`;
            return;
        }

        // Basic Markdown to HTML parsing for the UI representation
        let htmlContent = this.parseMarkdown(finalMarkdown);
        
        // Transform citation markers e.g., ^[1](url="X" weight="Y")^ into interactive DOM nodes
        htmlContent = htmlContent.replace(/\^\[(\d+)\]\(url="(.*?)" weight="(.*?)"\)\^/g, 
            (match, id, url, weight) => {
                return `<sup class="interactive-citation" data-url="${url}" data-weight="${weight}" style="color: var(--glow-accent); cursor: pointer; padding: 0 2px;">[${id}]</sup>`;
            }
        );

        this.container.innerHTML = htmlContent;
        this.bindCitationTooltips();
        this.updateMetaHeaders();
    }

    parseMarkdown(md) {
        // Very basic markdown parsing for bold, italics, headers, and line breaks
        let html = md.replace(/^### (.*$)/gim, '<h3 style="margin-top: 2rem;">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 style="margin-top: 2.5rem; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">$1</h2>');
        html = html.replace(/^\> (.*$)/gim, '<blockquote style="border-left: 3px solid var(--glow-accent); padding-left: 1rem; color: var(--text-secondary); margin: 1.5rem 0;">$1</blockquote>');
        html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/\*(.*)\*/gim, '<i>$1</i>');
        return html.replace(/\n\n/g, '<p style="margin-bottom: 1.5rem;"></p>');
    }

    bindCitationTooltips() {
        if (!this.container || !this.tooltip) return;

        const citations = this.container.querySelectorAll('.interactive-citation');
        
        citations.forEach(citation => {
            citation.addEventListener('mouseenter', (e) => {
                const url = e.target.dataset.url;
                const weight = e.target.dataset.weight;
                
                this.tooltip.innerHTML = `
                    <div style="margin-bottom: 8px; font-weight: bold; color: var(--text-primary);">Source Confidence: ${parseFloat(weight) * 100}%</div>
                    <div style="word-break: break-all; color: var(--glow-accent);"><a href="${url}" target="_blank" style="color: inherit; text-decoration: none;">${url}</a></div>
                `;
                
                this.tooltip.style.display = 'block';
                this.tooltip.style.left = `${e.pageX + 15}px`;
                this.tooltip.style.top = `${e.pageY + 15}px`;
            });

            citation.addEventListener('mouseleave', () => {
                this.tooltip.style.display = 'none';
            });
        });
    }

    updateMetaHeaders() {
        const sourcesCount = researchState.get('anchored_claims')?.length || 0;
        const metaSources = document.getElementById('meta-sources');
        if (metaSources) {
            metaSources.textContent = `Sources Verified: ${sourcesCount}`;
        }
    }
}

export const reportViewer = new ReportViewer();
