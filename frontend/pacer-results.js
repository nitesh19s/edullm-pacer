/**
 * PACER Results Manager
 *
 * Loads experiment result data (from /api/results/* or bundled fallback),
 * then renders:
 *   - Table 1: Main comparison — bar chart + sortable table
 *   - Table 2: Ablation study — grouped bar + table
 *   - CAS panel: sub-dimension breakdown per method
 *   - Latency panel: index time + query p50/p95
 *   - Kappa panel: inter-rater agreement summary
 */

class PACERResultsManager {
    constructor() {
        this._apiBase = 'http://localhost:8000';
        this._charts = {};

        // Bundled fallback — final results from 900-query NCERT benchmark (2026-04-27)
        // Embedding: BAAI/bge-large-en-v1.5 | Queries: 900 (Math 300, Science 300, SocSci 300)
        this._fallback = {
            main: [
                // Sorted by MRR desc. PACER ≡ educational_2000 on homogeneous NCERT corpus (expected).
                { method: 'Recursive-512',   mrr: 0.9354, ndcg_at_10: 0.8971, cas_overall: 0.6766, n_chunks: 36981, latency_ms: 214 },
                { method: 'Educational-2000',mrr: 0.9241, ndcg_at_10: 0.9208, cas_overall: 0.6511, n_chunks: 16369, latency_ms: null },
                { method: 'Hybrid-2000',     mrr: 0.9241, ndcg_at_10: 0.9208, cas_overall: 0.6511, n_chunks: 16375, latency_ms: 103 },
                { method: 'PACER',           mrr: 0.9241, ndcg_at_10: 0.9208, cas_overall: 0.6511, n_chunks: 16369, latency_ms: 87  },
                { method: 'Recursive-1024',  mrr: 0.9234, ndcg_at_10: 0.9024, cas_overall: 0.6689, n_chunks: 18389, latency_ms: 114 },
                { method: 'Semantic-1024',   mrr: 0.9188, ndcg_at_10: 0.9129, cas_overall: 0.6630, n_chunks: 12987, latency_ms: 85  },
                { method: 'Fixed-1024',      mrr: 0.9187, ndcg_at_10: 0.9308, cas_overall: 0.6587, n_chunks: 8581,  latency_ms: 80  },
                { method: 'Fixed-512',       mrr: 0.9185, ndcg_at_10: 0.9253, cas_overall: 0.6584, n_chunks: 9749,  latency_ms: null },
            ],
            ablation: [
                // Ablation study not yet run — placeholder conditions shown
                { method: 'PACER-Full',    mrr: 0.9241, ndcg_at_10: 0.9208, cas_overall: 0.651 },
                { method: 'A1-NoRouter',   mrr: null,   ndcg_at_10: null,   cas_overall: null  },
                { method: 'A2-NoBoundary', mrr: null,   ndcg_at_10: null,   cas_overall: null  },
                { method: 'A3-NoCAS',      mrr: null,   ndcg_at_10: null,   cas_overall: null  },
            ],
            latency: [
                // Query latency per condition (bge-large). MiniLM values in parentheses where available.
                { method: 'Fixed-1024 (MiniLM)',    latency_ms: 49,  n_chunks: 8581  },
                { method: 'Fixed-512 (MiniLM)',     latency_ms: 53,  n_chunks: 9749  },
                { method: 'Semantic-1024',          latency_ms: 85,  n_chunks: 12987 },
                { method: 'PACER (MiniLM)',         latency_ms: 77,  n_chunks: 16369 },
                { method: 'Fixed-1024',             latency_ms: 80,  n_chunks: 8581  },
                { method: 'PACER',                  latency_ms: 87,  n_chunks: 16369 },
                { method: 'Hybrid-2000',            latency_ms: 103, n_chunks: 16375 },
                { method: 'Recursive-1024',         latency_ms: 114, n_chunks: 18389 },
                { method: 'Recursive-512 (MiniLM)', latency_ms: 177, n_chunks: 36981 },
                { method: 'Recursive-512',          latency_ms: 214, n_chunks: 36981 },
            ],
            kappa: {
                llm_judges: ['Groq Llama-3.3-70B', 'Groq Llama-3.1-8B', 'Gemini 2.5 Flash'],
                n_pairs: 150,
                fleiss_kappa: { grade_match: 0.587, prereq_preservation: 0.611, bloom_fit: 0.439, overall_mean: 0.545 },
                pearson_groq70_gemini: { grade_match: 0.755, prereq_preservation: 0.608, bloom_fit: 0.511, overall_mean: 0.624 },
                status: 'llm_judges_complete_pending_human_raters',
            },
        };
    }

    // -----------------------------------------------------------------------
    // Init
    // -----------------------------------------------------------------------

    async initialize() {
        this._data = await this._loadAll();
        this._render();
        console.log('✅ PACERResultsManager initialized');
    }

    async _loadAll() {
        const tables = ['main', 'ablation', 'latency', 'kappa'];
        const results = {};
        for (const t of tables) {
            try {
                const resp = await fetch(`${this._apiBase}/api/results/${t}`, { signal: AbortSignal.timeout(2000) });
                if (resp.ok) {
                    const json = await resp.json();
                    results[t] = t === 'kappa' ? json : (json.rows || json);
                } else {
                    throw new Error(`HTTP ${resp.status}`);
                }
            } catch {
                results[t] = this._fallback[t];
            }
        }
        return results;
    }

    // -----------------------------------------------------------------------
    // Render all panels
    // -----------------------------------------------------------------------

    _render() {
        this._renderMainChart();
        this._renderMainTable();
        this._renderAblationChart();
        this._renderAblationTable();
        this._renderCASPanel();
        this._renderLatencyChart();
        this._renderKappaPanel();
        this._updateStatusBadge();
    }

    // -----------------------------------------------------------------------
    // Table 1 — Main comparison bar chart
    // -----------------------------------------------------------------------

    _renderMainChart() {
        const canvas = document.getElementById('pacerMainChart');
        if (!canvas) return;
        const rows = this._data.main;
        const labels = rows.map(r => this._label(r));
        const mrr    = rows.map(r => +(r.mrr || 0));
        const ndcg   = rows.map(r => +(r.ndcg_at_10 || r['ndcg@10'] || 0));
        const isPacer = labels.map(l => l.toLowerCase().startsWith('pacer'));
        const colors = isPacer.map(p => p ? '#3b82f6' : '#94a3b8');
        const ndcgColors = isPacer.map(p => p ? '#1d4ed8' : '#cbd5e1');

        if (this._charts.main) this._charts.main.destroy();
        this._charts.main = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'MRR', data: mrr, backgroundColor: colors, borderRadius: 4 },
                    { label: 'nDCG@10', data: ndcg, backgroundColor: ndcgColors, borderRadius: 4 },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Table 1 — Retrieval Performance (PACER vs Baselines)' },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(4)}` } },
                },
                scales: {
                    y: { min: 0.75, max: 1.0, title: { display: true, text: 'Score' } },
                    x: { ticks: { maxRotation: 30 } },
                },
            },
        });
    }

    _renderMainTable() {
        const el = document.getElementById('pacerMainTable');
        if (!el) return;
        const rows = this._data.main;
        const cols = [
            { key: '_label',       label: 'Method',        fmt: (v, r) => this._label(r) },
            { key: 'mrr',          label: 'MRR',           fmt: v => (+v).toFixed(4) },
            { key: 'ndcg_at_10',   label: 'nDCG@10',       fmt: v => (+v).toFixed(4), fallback: 'ndcg@10' },
            { key: 'cas_overall',  label: 'CAS',           fmt: v => (+v).toFixed(4), cls: 'cas-col' },
            { key: 'n_chunks',     label: '#Chunks',       fmt: v => Math.round(+v).toLocaleString() },
            { key: 'latency_ms',   label: 'Latency (ms)',  fmt: v => v != null && v !== '—' ? Math.round(+v) : '—' },
        ];
        el.innerHTML = this._buildTable(rows, cols, 'PACER');
    }

    // -----------------------------------------------------------------------
    // Table 2 — Ablation
    // -----------------------------------------------------------------------

    _renderAblationChart() {
        const canvas = document.getElementById('pacerAblationChart');
        if (!canvas) return;
        const rows = this._data.ablation;
        const labels = rows.map(r => this._label(r));
        const mrr  = rows.map(r => +(r.mrr || 0));
        const ndcg = rows.map(r => +(r.ndcg_at_10 || r['ndcg@10'] || 0));
        const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

        if (this._charts.ablation) this._charts.ablation.destroy();
        this._charts.ablation = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'MRR',     data: mrr,  backgroundColor: palette.map(c => c + 'cc'), borderRadius: 4 },
                    { label: 'nDCG@10', data: ndcg, backgroundColor: palette.map(c => c + '66'), borderRadius: 4 },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Table 2 — Ablation Study' },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(4)}` } },
                },
                scales: {
                    y: { min: 0.88, max: 0.96, title: { display: true, text: 'Score' } },
                },
            },
        });
    }

    _renderAblationTable() {
        const el = document.getElementById('pacerAblationTable');
        if (!el) return;
        const rows = this._data.ablation;
        const cols = [
            { key: '_label',      label: 'Condition', fmt: (v, r) => this._label(r) },
            { key: 'mrr',         label: 'MRR',       fmt: v => v != null ? (+v).toFixed(4) : '—' },
            { key: 'ndcg_at_10',  label: 'nDCG@10',   fmt: v => v != null ? (+v).toFixed(4) : '—', fallback: 'ndcg@10' },
            { key: 'cas_overall', label: 'CAS',       fmt: v => v != null ? (+v).toFixed(4) : '—', cls: 'cas-col' },
        ];
        el.innerHTML = this._buildTable(rows, cols, 'PACER-Full');
    }

    // -----------------------------------------------------------------------
    // CAS panel — sub-dimension breakdown
    // -----------------------------------------------------------------------

    _renderCASPanel() {
        const canvas = document.getElementById('pacerCASChart');
        const kpiEl  = document.getElementById('pacerCASKPIs');
        if (!canvas && !kpiEl) return;

        const rows = this._data.main;
        const hasCAS = rows.some(r => +(r.cas_overall || 0) > 0);

        if (kpiEl) {
            const _fk = this._data.kappa?.fleiss_kappa || {};
            if (_fk.prereq_coverage !== undefined && _fk.prereq_preservation === undefined) {
                _fk.prereq_preservation = _fk.prereq_coverage;
            }
            const kappa = _fk;
            kpiEl.innerHTML = `
              <div class="cas-kpi-grid">
                <div class="cas-kpi ${kappa.grade_match >= 0.6 ? 'good' : 'warn'}">
                  <span class="cas-kpi-label">grade_match κ</span>
                  <span class="cas-kpi-val">${(kappa.grade_match || 0).toFixed(3)}</span>
                </div>
                <div class="cas-kpi ${kappa.prereq_preservation >= 0.6 ? 'good' : 'warn'}">
                  <span class="cas-kpi-label">prereq_preservation κ</span>
                  <span class="cas-kpi-val">${(kappa.prereq_preservation || 0).toFixed(3)}</span>
                </div>
                <div class="cas-kpi ${kappa.bloom_fit >= 0.6 ? 'good' : 'warn'}">
                  <span class="cas-kpi-label">bloom_fit κ</span>
                  <span class="cas-kpi-val">${(kappa.bloom_fit || 0).toFixed(3)}</span>
                </div>
                <div class="cas-kpi">
                  <span class="cas-kpi-label">Weights (α β γ)</span>
                  <span class="cas-kpi-val">0.45 · 0.40 · 0.15</span>
                </div>
              </div>
              <p class="cas-pending-note"><i class="fas fa-info-circle"></i> Chart shows overall CAS per condition. Range: 0.644–0.677. Sub-dimension κ weights shown above.</p>
            `;
        }

        if (!canvas) return;
        const labels  = rows.map(r => this._label(r));
        const casVals = rows.map(r => +(r.cas_overall || 0));
        const isPacer = labels.map(l => l.toLowerCase().startsWith('pacer'));

        if (this._charts.cas) this._charts.cas.destroy();
        this._charts.cas = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'CAS (overall)',
                        data: casVals,
                        backgroundColor: isPacer.map(p => p ? '#3b82f6cc' : '#94a3b8aa'),
                        borderRadius: 3,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Curriculum Alignment Score per Condition' },
                    tooltip: { callbacks: { label: ctx => `CAS: ${ctx.parsed.y.toFixed(4)}` } },
                },
                scales: {
                    y: { min: 0.62, max: 0.70, title: { display: true, text: 'CAS [0–1]' } },
                    x: { ticks: { maxRotation: 40 } },
                },
            },
        });
    }

    // -----------------------------------------------------------------------
    // Latency panel
    // -----------------------------------------------------------------------

    _renderLatencyChart() {
        const canvas = document.getElementById('pacerLatencyChart');
        if (!canvas) return;
        const rows   = this._data.latency;
        const labels = rows.map(r => this._label(r));
        const latency = rows.map(r => {
            const v = r.query_mean_ms ?? r.latency_ms;
            return v != null && v !== '—' ? +v : null;
        });
        const ispacer = labels.map(l => l.toLowerCase().startsWith('pacer'));

        if (this._charts.latency) this._charts.latency.destroy();
        this._charts.latency = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Query latency (ms)',
                        data: latency,
                        backgroundColor: ispacer.map(p => p ? '#3b82f6cc' : '#94a3b8aa'),
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Query Latency per Method — bge-large-en-v1.5' },
                    tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} ms` } },
                },
                scales: {
                    y: { title: { display: true, text: 'Latency (ms)' }, beginAtZero: true },
                    x: { ticks: { maxRotation: 35 } },
                },
            },
        });
    }

    // -----------------------------------------------------------------------
    // Kappa panel
    // -----------------------------------------------------------------------

    _renderKappaPanel() {
        const el = document.getElementById('pacerKappaPanel');
        if (!el) return;
        const k = this._data.kappa;
        const fk = k.fleiss_kappa || {};
        const pk = k.pearson_groq70_gemini || k.pearson_r_groq70b_gemini || {};
        // Normalise key: JSON on disk uses prereq_coverage, fallback uses prereq_preservation
        if (fk.prereq_coverage !== undefined && fk.prereq_preservation === undefined) {
            fk.prereq_preservation = fk.prereq_coverage;
        }
        if (pk.prereq_coverage !== undefined && pk.prereq_preservation === undefined) {
            pk.prereq_preservation = pk.prereq_coverage;
        }
        const statusMap = {
            'llm_judges_complete_pending_human_raters': { cls: 'warn', label: 'LLM judges done — awaiting human raters' },
            'complete': { cls: 'good', label: 'Calibration complete' },
        };
        const statusInfo = statusMap[k.status] || { cls: '', label: k.status };
        el.innerHTML = `
          <div class="kappa-status ${statusInfo.cls}">
            <i class="fas fa-circle-dot"></i> ${statusInfo.label}
          </div>
          <p class="kappa-meta">${k.n_pairs} calibration pairs · Judges: ${(k.llm_judges || []).join(', ')}</p>
          <table class="pacer-table">
            <thead><tr><th>Dimension</th><th>Fleiss κ</th><th>Pearson r (Groq70 × Gemini)</th><th>Target κ</th></tr></thead>
            <tbody>
              <tr class="${(fk.grade_match||0)>=0.6?'row-good':'row-warn'}">
                <td>grade_match</td><td>${(fk.grade_match||0).toFixed(3)}</td><td>${(pk.grade_match||0).toFixed(3)}</td><td>≥ 0.6</td>
              </tr>
              <tr class="${(fk.prereq_preservation||0)>=0.6?'row-good':'row-warn'}">
                <td>prereq_preservation</td><td>${(fk.prereq_preservation||0).toFixed(3)}</td><td>${(pk.prereq_preservation||0).toFixed(3)}</td><td>≥ 0.6</td>
              </tr>
              <tr class="${(fk.bloom_fit||0)>=0.6?'row-good':'row-warn'}">
                <td>bloom_fit</td><td>${(fk.bloom_fit||0).toFixed(3)}</td><td>${(pk.bloom_fit||0).toFixed(3)}</td><td>≥ 0.6</td>
              </tr>
              <tr>
                <td><strong>Overall mean</strong></td><td><strong>${(fk.overall_mean||0).toFixed(3)}</strong></td><td><strong>${(pk.overall_mean||0).toFixed(3)}</strong></td><td>≥ 0.6</td>
              </tr>
            </tbody>
          </table>
        `;
    }

    // -----------------------------------------------------------------------
    // Shared table builder
    // -----------------------------------------------------------------------

    _label(r) {
        if (r.method) return r.method;
        const cond = (r.condition || '').replace(/_/g, '-');
        const emb  = r.embedding ? (r.embedding.includes('MiniLM') ? ' (MiniLM)' : ' (bge)') : '';
        return cond + emb;
    }

    _buildTable(rows, cols, highlightMethod) {
        const header = cols.map(c => `<th>${c.label}</th>`).join('');
        const body = rows.map(r => {
            const label = this._label(r);
            const isHL  = label === highlightMethod || (r.condition || '').toLowerCase() === 'pacer';
            const cells = cols.map(c => {
                let val;
                if (c.key === '_label') {
                    val = c.fmt(null, r);
                } else {
                    const raw = r[c.key] ?? (c.fallback ? r[c.fallback] : undefined);
                    val = raw !== undefined && raw !== null && raw !== '' ? c.fmt(raw, r) : '—';
                }
                return `<td class="${c.cls || ''}">${val}</td>`;
            }).join('');
            return `<tr class="${isHL ? 'row-highlight' : ''}">${cells}</tr>`;
        }).join('');
        return `<table class="pacer-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
    }

    // -----------------------------------------------------------------------
    // Status badge
    // -----------------------------------------------------------------------

    _updateStatusBadge() {
        const el = document.getElementById('pacerDataSource');
        if (!el) return;
        const allFallback = this._data.main === this._fallback.main;
        el.innerHTML = allFallback
            ? '<span class="badge badge-warn"><i class="fas fa-database"></i> Using bundled results (backend offline)</span>'
            : '<span class="badge badge-good"><i class="fas fa-server"></i> Live data from backend</span>';
    }

    // -----------------------------------------------------------------------
    // Tab switching
    // -----------------------------------------------------------------------

    switchTab(tabId) {
        document.querySelectorAll('#pacer .pacer-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('#pacer .pacer-tab-pane').forEach(p => p.classList.remove('active'));
        const btn  = document.querySelector(`#pacer [data-tab="${tabId}"]`);
        const pane = document.getElementById(`pacerTab_${tabId}`);
        if (btn)  btn.classList.add('active');
        if (pane) pane.classList.add('active');
        // Trigger chart resize after tab becomes visible
        if (this._charts[tabId]) {
            setTimeout(() => this._charts[tabId].resize(), 50);
        }
    }

    // -----------------------------------------------------------------------
    // Refresh — re-fetch from backend
    // -----------------------------------------------------------------------

    async refresh() {
        this._data = await this._loadAll();
        this._render();
    }
}

// Auto-init when section becomes visible
window.pacerResultsManager = new PACERResultsManager();
document.addEventListener('DOMContentLoaded', () => {
    // Lazy-init when the PACER section is first shown
    const observer = new MutationObserver(() => {
        const section = document.getElementById('pacer');
        if (section && section.classList.contains('active')) {
            window.pacerResultsManager.initialize();
            observer.disconnect();
        }
    });
    const main = document.querySelector('.main-content');
    if (main) observer.observe(main, { subtree: true, attributeFilter: ['class'] });
});
