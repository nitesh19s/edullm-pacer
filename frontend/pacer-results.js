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

        // Bundled fallback — current results from experiments/results/
        this._fallback = {
            main: [
                { method: 'Recursive',   mrr: 0.8831, ndcg_at_10: 0.9370, p_at_1: 0.8296, r_at_5: 0.9486, cas_overall: 0.0, cas_grade: 0.0, cas_prereq: 0.0, cas_bloom: 0.0, n_chunks: 2976, avg_chunk_chars: 1852 },
                { method: 'Fixed-512',   mrr: 0.8798, ndcg_at_10: 0.9262, p_at_1: 0.8283, r_at_5: 0.9449, cas_overall: 0.0, cas_grade: 0.0, cas_prereq: 0.0, cas_bloom: 0.0, n_chunks: 3176, avg_chunk_chars: 1786 },
                { method: 'Semantic',    mrr: 0.8715, ndcg_at_10: 0.9220, p_at_1: 0.8258, r_at_5: 0.9373, cas_overall: 0.0, cas_grade: 0.0, cas_prereq: 0.0, cas_bloom: 0.0, n_chunks: 3154, avg_chunk_chars: 1574 },
                { method: 'Fixed-256',   mrr: 0.8648, ndcg_at_10: 0.9219, p_at_1: 0.8158, r_at_5: 0.9336, cas_overall: 0.0, cas_grade: 0.0, cas_prereq: 0.0, cas_bloom: 0.0, n_chunks: 6309, avg_chunk_chars: 901  },
                { method: 'Educational', mrr: 0.8487, ndcg_at_10: 0.9099, p_at_1: 0.7870, r_at_5: 0.9286, cas_overall: 0.0, cas_grade: 0.0, cas_prereq: 0.0, cas_bloom: 0.0, n_chunks: 4567, avg_chunk_chars: 1116 },
                { method: 'Hybrid',      mrr: 0.8479, ndcg_at_10: 0.9069, p_at_1: 0.7932, r_at_5: 0.9211, cas_overall: 0.0, cas_grade: 0.0, cas_prereq: 0.0, cas_bloom: 0.0, n_chunks: 4973, avg_chunk_chars: 999  },
                { method: 'PACER',       mrr: 0.8479, ndcg_at_10: 0.9069, p_at_1: 0.7932, r_at_5: 0.9211, cas_overall: 0.0, cas_grade: 0.0, cas_prereq: 0.0, cas_bloom: 0.0, n_chunks: 4973, avg_chunk_chars: 999  },
            ],
            ablation: [
                { method: 'A2-NoBoundary', mrr: 0.8715, ndcg_at_10: 0.9220, p_at_1: 0.8258, r_at_5: 0.9373, cas_overall: 0.0 },
                { method: 'A1-NoRouter',   mrr: 0.8487, ndcg_at_10: 0.9099, p_at_1: 0.7870, r_at_5: 0.9286, cas_overall: 0.0 },
                { method: 'A3-NoCAS',      mrr: 0.8479, ndcg_at_10: 0.9069, p_at_1: 0.7932, r_at_5: 0.9211, cas_overall: 0.0 },
                { method: 'PACER-Full',    mrr: 0.8479, ndcg_at_10: 0.9069, p_at_1: 0.7932, r_at_5: 0.9211, cas_overall: 0.0 },
            ],
            latency: [
                { method: 'Fixed-256',   index_time_ms: 126567, query_p50_ms: 7.2,  query_p95_ms: 10.6, n_chunks: 16071 },
                { method: 'Fixed-512',   index_time_ms: 47992,  query_p50_ms: 4.4,  query_p95_ms: 5.5,  n_chunks: 8100  },
                { method: 'Recursive',   index_time_ms: 45718,  query_p50_ms: 5.0,  query_p95_ms: 5.9,  n_chunks: 7668  },
                { method: 'Semantic',    index_time_ms: 214446, query_p50_ms: 4.9,  query_p95_ms: 7.3,  n_chunks: 8185  },
                { method: 'Educational', index_time_ms: 64077,  query_p50_ms: 4.9,  query_p95_ms: 6.2,  n_chunks: 12073 },
                { method: 'Hybrid',      index_time_ms: 256696, query_p50_ms: 5.3,  query_p95_ms: 6.8,  n_chunks: 13038 },
                { method: 'PACER',       index_time_ms: 329699, query_p50_ms: 9.4,  query_p95_ms: 12.7, n_chunks: 13038 },
            ],
            kappa: {
                llm_judges: ['Groq Llama-3.3-70B', 'Groq Llama-3.1-8B', 'Gemini 2.5 Flash'],
                n_pairs: 150,
                fleiss_kappa: { grade_match: 0.587, prereq_coverage: 0.611, bloom_fit: 0.439, overall_mean: 0.545 },
                pearson_groq70_gemini: { grade_match: 0.755, prereq_coverage: 0.608, bloom_fit: 0.511, overall_mean: 0.624 },
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
        const labels = rows.map(r => r.method || r.condition || '');
        const mrr    = rows.map(r => +(r.mrr || 0));
        const ndcg   = rows.map(r => +(r.ndcg_at_10 || r['ndcg@10'] || 0));
        const colors = labels.map(l => l === 'PACER' || l === 'PACER-Full' ? '#3b82f6' : '#94a3b8');
        const ndcgColors = labels.map(l => l === 'PACER' || l === 'PACER-Full' ? '#1d4ed8' : '#cbd5e1');

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
            { key: 'method',       label: 'Method',    fmt: v => v },
            { key: 'mrr',          label: 'MRR',       fmt: v => (+v).toFixed(4) },
            { key: 'ndcg_at_10',   label: 'nDCG@10',   fmt: v => (+v).toFixed(4), fallback: 'ndcg@10' },
            { key: 'p_at_1',       label: 'P@1',       fmt: v => (+v).toFixed(4) },
            { key: 'r_at_5',       label: 'R@5',       fmt: v => (+v).toFixed(4) },
            { key: 'cas_overall',  label: 'CAS',       fmt: v => (+v).toFixed(4), cls: 'cas-col' },
            { key: 'n_chunks',     label: '#Chunks',   fmt: v => Math.round(+v).toLocaleString() },
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
        const labels = rows.map(r => r.method || r.condition || '');
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
                    y: { min: 0.80, max: 0.96, title: { display: true, text: 'Score' } },
                },
            },
        });
    }

    _renderAblationTable() {
        const el = document.getElementById('pacerAblationTable');
        if (!el) return;
        const rows = this._data.ablation;
        const cols = [
            { key: 'method',      label: 'Condition', fmt: v => v },
            { key: 'mrr',         label: 'MRR',       fmt: v => (+v).toFixed(4) },
            { key: 'ndcg_at_10',  label: 'nDCG@10',   fmt: v => (+v).toFixed(4), fallback: 'ndcg@10' },
            { key: 'p_at_1',      label: 'P@1',       fmt: v => (+v).toFixed(4) },
            { key: 'cas_overall', label: 'CAS',       fmt: v => (+v).toFixed(4), cls: 'cas-col' },
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
            const kappa = this._data.kappa?.fleiss_kappa || {};
            kpiEl.innerHTML = `
              <div class="cas-kpi-grid">
                <div class="cas-kpi ${kappa.grade_match >= 0.6 ? 'good' : 'warn'}">
                  <span class="cas-kpi-label">grade_match κ</span>
                  <span class="cas-kpi-val">${(kappa.grade_match || 0).toFixed(3)}</span>
                </div>
                <div class="cas-kpi ${kappa.prereq_coverage >= 0.6 ? 'good' : 'warn'}">
                  <span class="cas-kpi-label">prereq_coverage κ</span>
                  <span class="cas-kpi-val">${(kappa.prereq_coverage || 0).toFixed(3)}</span>
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
              ${!hasCAS ? '<p class="cas-pending-note"><i class="fas fa-info-circle"></i> CAS sub-scores are 0 in current results — routing bug was present during this run. Re-run on Colab to get real values.</p>' : ''}
            `;
        }

        if (!canvas) return;
        const labels = rows.map(r => r.method || r.condition || '');
        const gradeM = rows.map(r => +(r.cas_grade || r.cas_grade_match || 0));
        const prereq = rows.map(r => +(r.cas_prereq || r.cas_prereq_preservation || 0));
        const bloom  = rows.map(r => +(r.cas_bloom || r.cas_bloom_alignment || 0));

        if (this._charts.cas) this._charts.cas.destroy();
        this._charts.cas = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'grade_match (α=0.45)',       data: gradeM, backgroundColor: '#3b82f688', borderRadius: 3 },
                    { label: 'prereq_preservation (β=0.40)', data: prereq, backgroundColor: '#10b98188', borderRadius: 3 },
                    { label: 'bloom_alignment (γ=0.15)',    data: bloom,  backgroundColor: '#f59e0b88', borderRadius: 3 },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'CAS Sub-Dimension Breakdown per Method' },
                },
                scales: {
                    y: { min: 0, max: 1, title: { display: true, text: 'Score [0–1]' } },
                    x: { stacked: false },
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
        const rows = this._data.latency;
        const labels     = rows.map(r => r.method || '');
        const indexTime  = rows.map(r => +((r.index_time_ms || 0) / 1000).toFixed(1));
        const queryP50   = rows.map(r => +(r.query_p50_ms || 0));
        const queryP95   = rows.map(r => +(r.query_p95_ms || 0));
        const ispacer    = labels.map(l => l === 'PACER');

        if (this._charts.latency) this._charts.latency.destroy();
        this._charts.latency = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Index time (s)',
                        data: indexTime,
                        backgroundColor: ispacer.map(p => p ? '#3b82f688' : '#94a3b844'),
                        borderRadius: 4,
                        yAxisID: 'yIdx',
                    },
                    {
                        label: 'Query p50 (ms)',
                        data: queryP50,
                        backgroundColor: ispacer.map(p => p ? '#1d4ed8cc' : '#64748bcc'),
                        borderRadius: 4,
                        yAxisID: 'yQ',
                        type: 'line',
                        tension: 0.3,
                        pointRadius: 5,
                    },
                    {
                        label: 'Query p95 (ms)',
                        data: queryP95,
                        backgroundColor: 'transparent',
                        borderColor: '#ef444488',
                        borderDash: [4, 4],
                        borderRadius: 4,
                        yAxisID: 'yQ',
                        type: 'line',
                        tension: 0.3,
                        pointRadius: 4,
                        pointStyle: 'rect',
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Latency — Index time vs Query latency' },
                },
                scales: {
                    yIdx: { type: 'linear', position: 'left',  title: { display: true, text: 'Index time (s)' } },
                    yQ:   { type: 'linear', position: 'right', title: { display: true, text: 'Query latency (ms)' }, grid: { drawOnChartArea: false } },
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
        const pk = k.pearson_groq70_gemini || {};
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
              <tr class="${(fk.prereq_coverage||0)>=0.6?'row-good':'row-warn'}">
                <td>prereq_coverage</td><td>${(fk.prereq_coverage||0).toFixed(3)}</td><td>${(pk.prereq_coverage||0).toFixed(3)}</td><td>≥ 0.6</td>
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

    _buildTable(rows, cols, highlightMethod) {
        const header = cols.map(c => `<th>${c.label}</th>`).join('');
        const body = rows.map(r => {
            const method = r.method || r.condition || '';
            const isHL = method === highlightMethod;
            const cells = cols.map(c => {
                const raw = r[c.key] ?? (c.fallback ? r[c.fallback] : undefined);
                const val = raw !== undefined && raw !== null && raw !== '' ? c.fmt(raw) : '—';
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
        document.querySelectorAll('#pacerSection .pacer-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('#pacerSection .pacer-tab-pane').forEach(p => p.classList.remove('active'));
        const btn  = document.querySelector(`#pacerSection [data-tab="${tabId}"]`);
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
        const section = document.getElementById('pacerSection');
        if (section && section.classList.contains('active')) {
            window.pacerResultsManager.initialize();
            observer.disconnect();
        }
    });
    const main = document.querySelector('.main-content');
    if (main) observer.observe(main, { subtree: true, attributeFilter: ['class'] });
});
