// js/ui/reportViewer.js
import { eventBus } from '../core/eventBus.js';
import { researchState } from '../engine/researchState.js';
import { router } from '../core/router.js';
import { sourceManager } from '../engine/sourceManager.js';

class ReportViewer {
    constructor() {
        this.init();
    }

    init() {
        eventBus.subscribe('SOURCES_UPDATED', (data) => {
            const btn = document.getElementById('toggle-live-sources-btn');
            const list = document.getElementById('live-sources-list');
            if (btn && list) {
                btn.textContent = `Researching ${data.count} Sources ▼`;
                list.innerHTML = data.sources.map(s => this.createSourceBar(s)).join('');
            }
        });

        eventBus.subscribe('ROUTE_CHANGED', (data) => {
            if (data.path === '/research') {
                this.bindLiveSourcesToggle();
                this.forceSourceUIRefresh(); // Catch up on missed counts
            }
            if (data.path === '/report') this.renderFinalReport();
        });

        eventBus.subscribe('PIPELINE_COMPLETE', () => {
            router.navigateTo('/report');
        });
    }

    forceSourceUIRefresh() {
        const sources = sourceManager.getAllSources();
        const btn = document.getElementById('toggle-live-sources-btn');
        const list = document.getElementById('live-sources-list');
        if (btn && list && sources.length > 0) {
            btn.textContent = `Researching ${sources.length} Sources ▼`;
            list.innerHTML = sources.map(s => this.createSourceBar(s)).join('');
        }
    }

    bindLiveSourcesToggle() {
        const btn = document.getElementById('toggle-live-sources-btn');
        const panel = document.getElementById('live-sources-panel');
        if (btn && panel) {
            btn.onclick = () => {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            };
        }
    }

    renderFinalReport() {
        const container = document.getElementById('report-content-container');
        const finalDraft = researchState.get('sections.final_assembly');
        const allSources = sourceManager.getAllSources();
        
        if (!container || !finalDraft) return;

        container.innerHTML = this.simpleMarkdownParse(finalDraft);
        document.getElementById('meta-sources-final').textContent = `Sources Verified: ${allSources.length}`;

        this.generateTableOfContents(container);
        this.bindFinalButtons(allSources);
    }

    generateTableOfContents(container) {
        const tocNav = document.getElementById('dynamic-toc');
        if (!tocNav) return;
        tocNav.innerHTML = '';

        const headers = container.querySelectorAll('h2, h3');
        headers.forEach((header, index) => {
            const id = `section-${index}`;
            header.id = id;

            const link = document.createElement('a');
            link.href = `#${id}`;
            link.className = `toc-item ${header.tagName.toLowerCase()}`;
            link.textContent = header.textContent.replace(/[*#]/g, '').trim();
            
            link.onclick = (e) => {
                e.preventDefault();
                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };

            tocNav.appendChild(link);
        });
    }

    bindFinalButtons(sources) {
        document.getElementById('btn-back-home').onclick = () => {
            window.location.hash = '/';
            window.location.reload();
        };

        document.getElementById('btn-download-pdf').onclick = () => {
            const element = document.getElementById('pdf-export-area');
            const opt = {
                margin:       [15, 15, 15, 15],
                filename:     `LexisAI_Predictive_Report_${Date.now()}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            window.html2pdf().set(opt).from(element).save();
        };

        const modal = document.getElementById('final-sources-modal');
        const list = document.getElementById('final-sources-list');
        
        document.getElementById('btn-view-final-sources').onclick = () => {
            list.innerHTML = sources.map(s => this.createSourceBar(s)).join('');
            modal.style.display = 'flex';
        };
        
        document.getElementById('close-sources-modal').onclick = () => {
            modal.style.display = 'none';
        };
    }

    createSourceBar(source) {
        return `
            <div class="source-bar">
                <span class="source-title">${(source.title || "Extracted Document").substring(0, 80)}...</span>
                <span class="source-url">${source.url}</span>
            </div>
        `;
    }

    simpleMarkdownParse(text) {
        let html = text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" style="color:var(--glow-accent)">$1</a>')
            .replace(/\n\n/gim, '</p><p style="margin-bottom:1rem;">');
        return `<p style="margin-bottom:1rem;">${html}</p>`;
    }
}

export const reportViewer = new ReportViewer();
