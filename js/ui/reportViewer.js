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
        list.innerHTML = data.sources.map((s) => this.createSourceBar(s)).join('');
      }
    });

    eventBus.subscribe('ROUTE_CHANGED', (data) => {
      if (data.path === '/research') {
        this.bindLiveSourcesToggle();
        this.forceSourceUIRefresh();
      }

      if (data.path === '/report') {
        this.renderFinalReport();
      }
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
      list.innerHTML = sources.map((s) => this.createSourceBar(s)).join('');
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

    const meta = document.getElementById('meta-sources-final');
    if (meta) {
      meta.textContent = `Sources Verified: ${allSources.length}`;
    }

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
      link.textContent = header.textContent || `Section ${index + 1}`;
      link.style.display = 'block';
      link.style.marginBottom = '0.5rem';

      tocNav.appendChild(link);
    });
  }

  bindFinalButtons(allSources) {
    const downloadBtn = document.getElementById('download-report-btn');
    if (downloadBtn) {
      downloadBtn.onclick = () => this.downloadReport();
    }

    const sourcesBtn = document.getElementById('toggle-live-sources-btn');
    if (sourcesBtn && allSources.length > 0) {
      sourcesBtn.textContent = `Researching ${allSources.length} Sources ▼`;
    }
  }

  downloadReport() {
    const report = researchState.get('sections.final_assembly') || '';
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'research-report.md';
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  createSourceBar(source) {
    try {
      const url = String(source?.url || '');
      const title = String(source?.title || 'Extracted Document');
      const domain = (() => {
        try {
          return new URL(url).hostname.replace(/^www\./, '');
        } catch {
          return 'source';
        }
      })();

      const isPdf = url.toLowerCase().endsWith('.pdf');
      const iconUrl = isPdf
        ? 'https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg'
        : `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

      return `
        <a href="${url}" target="_blank" rel="noreferrer" class="source-bar-link">
          <div class="source-bar-premium">
            <img
              src="${iconUrl}"
              alt="${domain} logo"
              class="source-logo"
              onerror="this.src='https://www.google.com/s2/favicons?domain=google.com&sz=64'"
            >
            <div class="source-info">
              <span class="source-title">${title.substring(0, 80)}...</span>
              <span class="source-url">${domain} • ${url.substring(0, 45)}...</span>
            </div>
          </div>
        </a>
      `;
    } catch {
      return `<div class="source-bar-premium"><span class="source-title">Unknown Source</span></div>`;
    }
  }

  simpleMarkdownParse(text) {
    let html = String(text || '')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/gim,
        '<a href="$2" target="_blank" rel="noreferrer" style="color:var(--glow-accent)">$1</a>'
      )
      .replace(/\n\n/gim, '</p><p style="margin-bottom:1rem;">');

    return `<p style="margin-bottom:1rem;">${html}</p>`;
  }
}

export const reportViewer = new ReportViewer();
