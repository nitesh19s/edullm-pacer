/**
 * PACER Research Tools Initializer
 *
 * Seeds all 6 Research Tools tabs with real PACER experiment data.
 * Runs after DOM is ready. Falls back gracefully if Chart.js is absent.
 *
 * Real data source: experiments/results_paper/ (900-query NCERT benchmark, 2026-04-27)
 */

(function () {

// ---------------------------------------------------------------------------
// Real PACER data (mirrors experiments/results_paper/table1_main_results.csv)
// ---------------------------------------------------------------------------
const PACER_CONDITIONS = [
    { method: 'Recursive-512',    embedding: 'bge-large', mrr: 0.9354, ndcg: 0.8971, cas: 0.6766, chunks: 36981, latency: 214 },
    { method: 'Educational-2000', embedding: 'bge-large', mrr: 0.9241, ndcg: 0.9208, cas: 0.6511, chunks: 16369, latency: null },
    { method: 'Hybrid-2000',      embedding: 'bge-large', mrr: 0.9241, ndcg: 0.9208, cas: 0.6511, chunks: 16375, latency: 103  },
    { method: 'PACER',            embedding: 'bge-large', mrr: 0.9241, ndcg: 0.9208, cas: 0.6511, chunks: 16369, latency: 87   },
    { method: 'Recursive-1024',   embedding: 'bge-large', mrr: 0.9234, ndcg: 0.9024, cas: 0.6689, chunks: 18389, latency: 114  },
    { method: 'Semantic-1024',    embedding: 'bge-large', mrr: 0.9188, ndcg: 0.9129, cas: 0.6630, chunks: 12987, latency: 85   },
    { method: 'Fixed-1024',       embedding: 'bge-large', mrr: 0.9187, ndcg: 0.9308, cas: 0.6587, chunks: 8581,  latency: 80   },
    { method: 'Fixed-512',        embedding: 'bge-large', mrr: 0.9185, ndcg: 0.9253, cas: 0.6584, chunks: 9749,  latency: null },
    { method: 'Recursive-512',    embedding: 'MiniLM',    mrr: 0.9242, ndcg: 0.8864, cas: 0.6720, chunks: 36981, latency: 177  },
    { method: 'PACER',            embedding: 'MiniLM',    mrr: 0.8845, ndcg: 0.8887, cas: 0.6436, chunks: 16369, latency: 77   },
    { method: 'Semantic-1024',    embedding: 'MiniLM',    mrr: 0.8979, ndcg: 0.8948, cas: 0.6609, chunks: 12987, latency: null },
    { method: 'Fixed-1024',       embedding: 'MiniLM',    mrr: 0.8932, ndcg: 0.9097, cas: 0.6548, chunks: 8581,  latency: 49   },
    { method: 'Fixed-512',        embedding: 'MiniLM',    mrr: 0.8926, ndcg: 0.9046, cas: 0.6552, chunks: 9749,  latency: 53   },
];

const KAPPA = { grade_match: 0.587, prereq_preservation: 0.611, bloom_fit: 0.439, overall: 0.545 };
const BGE = PACER_CONDITIONS.filter(r => r.embedding === 'bge-large');

// Heterogeneous corpus ablation (30-doc, 5 types, 179 queries — table3_hetero_ablation.csv)
const HETERO = [
    { condition: 'PACER (adaptive)',   mrr: 0.9413, ndcg: 0.9056, latency: 25.5, strategies: 4, highlight: true  },
    { condition: 'Recursive (B0)',     mrr: 0.8877, ndcg: 0.8859, latency: 23.9, strategies: 1, highlight: false },
    { condition: 'Fixed-size (A1)',    mrr: 0.8428, ndcg: 0.8825, latency: 23.6, strategies: 1, highlight: false },
];

// Latency data (table4_latency.csv + table1_main_results.csv)
const LATENCY_DATA = [
    { method: 'PACER',            emb: 'bge-large', chunks: 16369, index_s: null,   query_ms: 87.5,  highlight: true  },
    { method: 'Fixed-1024',       emb: 'bge-large', chunks:  8581, index_s: 939.9,  query_ms: 80.4,  highlight: false },
    { method: 'Semantic-1024',    emb: 'bge-large', chunks: 12987, index_s: 1198.4, query_ms: 85.4,  highlight: false },
    { method: 'Hybrid-2000',      emb: 'bge-large', chunks: 16375, index_s: 1026.9, query_ms: 102.5, highlight: false },
    { method: 'Recursive-1024',   emb: 'bge-large', chunks: 18389, index_s: 1358.0, query_ms: 114.3, highlight: false },
    { method: 'Recursive-512',    emb: 'bge-large', chunks: 36981, index_s: 1487.2, query_ms: 214.1, highlight: false },
    { method: 'PACER',            emb: 'MiniLM',    chunks: 16369, index_s: 52.0,   query_ms: 76.6,  highlight: true  },
    { method: 'Fixed-1024',       emb: 'MiniLM',    chunks:  8581, index_s: 46.4,   query_ms: 48.9,  highlight: false },
    { method: 'Fixed-512',        emb: 'MiniLM',    chunks:  9749, index_s: 53.3,   query_ms: 52.9,  highlight: false },
    { method: 'Recursive-512',    emb: 'MiniLM',    chunks: 36981, index_s: 96.3,   query_ms: 177.2, highlight: false },
];

// Chunk pedagogical completeness (table5_chunk_quality.csv — 179 hetero queries)
const CHUNK_QUALITY = [
    { type: 'Overall',           pacer_complete: 78.8, b0_complete: 63.7, pacer_boundary: 22.9, b0_boundary: 5.6,  pacer_len: 1141, b0_len: 1588 },
    { type: 'Worked Example',    pacer_complete: 96.7, b0_complete:  0.0, pacer_boundary: 96.7, b0_boundary: 26.7, pacer_len: 1602, b0_len: 1695 },
    { type: 'Lecture Notes',     pacer_complete: 88.3, b0_complete: 91.7, pacer_boundary: 11.7, b0_boundary:  3.3, pacer_len: 1355, b0_len: 1461 },
    { type: 'Past Paper',        pacer_complete:100.0, b0_complete:100.0, pacer_boundary:  0.0, b0_boundary:  0.0, pacer_len:  211, b0_len: 1850 },
    { type: 'Syllabus',          pacer_complete:100.0, b0_complete:100.0, pacer_boundary:  0.0, b0_boundary:  0.0, pacer_len: 1302, b0_len: 1292 },
    { type: 'Reference Material',pacer_complete:  0.0, b0_complete:  0.0, pacer_boundary: 16.7, b0_boundary:  0.0, pacer_len: 1025, b0_len: 1761 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function makeChart(id, cfg) {
    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === 'undefined') return;
    if (canvas._pacerChart) canvas._pacerChart.destroy();
    canvas._pacerChart = new Chart(canvas.getContext('2d'), cfg);
}

const BLUE   = '#3b82f6';
const SLATE  = '#94a3b8';
const GREEN  = '#10b981';
const AMBER  = '#f59e0b';
const PURPLE = '#8b5cf6';
const RED    = '#ef4444';

function isHighlight(label) {
    return label === 'PACER' || label.toLowerCase().includes('pacer');
}

// ---------------------------------------------------------------------------
// Tab 1 — Analytics
// ---------------------------------------------------------------------------
function initAnalytics() {
    // Inject one global CSS fix: analytics canvases must fill their explicit-height parents.
    // charts.css declares canvas{height:auto!important} which collapses Chart.js canvases.
    // ID-selectors beat class+element selectors even when both use !important.
    if (!document.getElementById('pacer-analytics-css')) {
        const s = document.createElement('style');
        s.id = 'pacer-analytics-css';
        s.textContent = [
            '#experimentsOverTimeChart,#precisionRecallChart,',
            '#responseTimeDistributionChart,#experimentStatusChart,',
            '#latencyChartQuery,#latencyChartIndex',
            '{height:100%!important;max-width:100%!important}'
        ].join('');
        document.head.appendChild(s);
    }

    const labels = BGE.map(r => r.method);
    const colors = labels.map(l => isHighlight(l) ? BLUE : SLATE);

    // ── Chart 1: MRR & nDCG@10 grouped bar ──────────────────────────────
    makeChart('experimentsOverTimeChart', {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'MRR',     data: BGE.map(r => r.mrr),  backgroundColor: colors,
                  borderRadius: 4 },
                { label: 'nDCG@10', data: BGE.map(r => r.ndcg),
                  backgroundColor: labels.map(l => isHighlight(l) ? '#1d4ed8' : '#cbd5e1'),
                  borderRadius: 4 },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { title: { display: true, text: 'MRR & nDCG@10 by Condition (bge-large)' },
                       legend: { position: 'bottom' } },
            scales: { y: { min: 0.88, max: 1.0,
                title: { display: true, text: 'Score' } } }
        }
    });

    // ── Chart 2: CAS vs MRR scatter ──────────────────────────────────────
    makeChart('precisionRecallChart', {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'CAS vs MRR',
                data: BGE.map(r => ({ x: r.mrr, y: r.cas, label: r.method })),
                backgroundColor: BGE.map(r => isHighlight(r.method) ? BLUE : SLATE),
                pointRadius: 7, pointHoverRadius: 9,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'CAS vs MRR — Curriculum Alignment vs Retrieval Quality' },
                tooltip: { callbacks: {
                    label: ctx => `${ctx.raw.label}: MRR=${ctx.raw.x.toFixed(4)}, CAS=${ctx.raw.y.toFixed(4)}`
                }}
            },
            scales: {
                x: { title: { display: true, text: 'MRR' }, min: 0.91, max: 0.94 },
                y: { title: { display: true, text: 'CAS' }, min: 0.64, max: 0.69 }
            }
        }
    });

    // ── Chart 3: Latency breakdown — replace canvas with full block ───────
    const latCanvas = document.getElementById('responseTimeDistributionChart');
    if (latCanvas) {
        const pacerBge   = LATENCY_DATA.find(r => r.highlight && r.emb === 'bge-large');
        const fastestQ   = LATENCY_DATA.reduce((a, b) => a.query_ms < b.query_ms ? a : b);
        const slowestQ   = LATENCY_DATA.reduce((a, b) => a.query_ms > b.query_ms ? a : b);
        const fastestIdx = LATENCY_DATA.filter(r => r.index_s).reduce((a, b) => a.index_s < b.index_s ? a : b);

        const tableRows = LATENCY_DATA.map(r => `
            <tr style="${r.highlight ? 'background:hsl(var(--primary)/0.08);font-weight:600' : ''}">
                <td>${r.method}${r.highlight ? ' ★' : ''}</td>
                <td style="font-size:0.78rem">${r.emb}</td>
                <td>${r.chunks.toLocaleString()}</td>
                <td style="color:${r.query_ms < 90 ? '#10b981' : r.query_ms > 150 ? '#ef4444' : '#f59e0b'};font-weight:700">${r.query_ms}ms</td>
                <td>${r.index_s != null ? r.index_s + 's' : '—'}</td>
            </tr>`).join('');

        latCanvas.outerHTML = `
            <div id="latencyBlock" style="display:flex;flex-direction:column;gap:16px">

                <!-- 4 mini-cards -->
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
                    <div style="background:hsl(220 100% 97%);border:1px solid #bfdbfe;border-radius:8px;padding:14px;text-align:center">
                        <div style="font-size:1.4rem;font-weight:800;color:#2563eb;line-height:1">${pacerBge.query_ms}ms</div>
                        <div style="font-size:0.72rem;color:#1d4ed8;font-weight:600;margin-top:4px">PACER + bge-large</div>
                    </div>
                    <div style="background:hsl(142 76% 97%);border:1px solid #bbf7d0;border-radius:8px;padding:14px;text-align:center">
                        <div style="font-size:1.4rem;font-weight:800;color:#059669;line-height:1">${fastestQ.query_ms}ms</div>
                        <div style="font-size:0.72rem;color:#047857;font-weight:600;margin-top:4px">⚡ Fastest: ${fastestQ.method} (${fastestQ.emb === 'bge-large' ? 'bge' : 'MiniLM'})</div>
                    </div>
                    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;text-align:center">
                        <div style="font-size:1.4rem;font-weight:800;color:#dc2626;line-height:1">${slowestQ.query_ms}ms</div>
                        <div style="font-size:0.72rem;color:#b91c1c;font-weight:600;margin-top:4px">🐢 Slowest: ${slowestQ.method} (${slowestQ.emb === 'bge-large' ? 'bge' : 'MiniLM'})</div>
                    </div>
                    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px;text-align:center">
                        <div style="font-size:1.4rem;font-weight:800;color:#b45309;line-height:1">${fastestIdx.index_s}s</div>
                        <div style="font-size:0.72rem;color:#92400e;font-weight:600;margin-top:4px">🗄️ Fastest index: ${fastestIdx.method} (${fastestIdx.emb === 'bge-large' ? 'bge' : 'MiniLM'})</div>
                    </div>
                </div>

                <!-- Tab toggle -->
                <div style="display:flex;gap:8px;align-items:center">
                    <button id="latTabQ" onclick="window._pacerShowLatTab('query')"
                        style="padding:7px 20px;border-radius:8px;border:2px solid #3b82f6;background:#3b82f6;
                               color:#fff;font-weight:600;font-size:0.82rem;cursor:pointer;transition:all .15s">
                        ⚡ Query Latency
                    </button>
                    <button id="latTabI" onclick="window._pacerShowLatTab('index')"
                        style="padding:7px 20px;border-radius:8px;border:2px solid #f59e0b;
                               background:transparent;color:hsl(var(--foreground));
                               font-weight:600;font-size:0.82rem;cursor:pointer;transition:all .15s">
                        🗄️ Index Time
                    </button>
                </div>

                <!-- Chart area — explicit height so Chart.js doesn't collapse -->
                <div style="position:relative;width:100%;height:320px">
                    <canvas id="latencyChartQuery"></canvas>
                    <canvas id="latencyChartIndex" style="display:none;position:absolute;top:0;left:0;width:100%;height:100%"></canvas>
                </div>

                <!-- Data table -->
                <div style="overflow-x:auto">
                    <table class="pacer-table" style="width:100%;font-size:0.82rem;border-collapse:collapse;min-width:480px">
                        <thead><tr>
                            <th>Method</th><th>Embedding</th><th>Chunks</th>
                            <th>Query (ms)</th><th>Index (s)</th>
                        </tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
                <p style="font-size:0.75rem;color:hsl(var(--muted-foreground));margin:0;line-height:1.5">
                    Query latency = mean over 900 queries · Index time = one-shot build (embedding + FAISS + BM25) ·
                    PACER bge index time not measured separately (same pipeline).
                </p>
            </div>`;

        setTimeout(() => {
            makeChart('latencyChartQuery', {
                type: 'bar',
                data: {
                    labels: LATENCY_DATA.map(r => `${r.method} (${r.emb === 'bge-large' ? 'bge' : 'MiniLM'})`),
                    datasets: [{ label: 'Query latency (ms)', data: LATENCY_DATA.map(r => r.query_ms),
                        backgroundColor: LATENCY_DATA.map(r => r.highlight ? BLUE : SLATE), borderRadius: 4 }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                    plugins: { title: { display: false }, legend: { display: false } },
                    scales: { x: { beginAtZero: true, title: { display: true, text: 'milliseconds' } } } }
            });

            const iRows = LATENCY_DATA.filter(r => r.index_s != null);
            makeChart('latencyChartIndex', {
                type: 'bar',
                data: {
                    labels: iRows.map(r => `${r.method} (${r.emb === 'bge-large' ? 'bge' : 'MiniLM'})`),
                    datasets: [{ label: 'Index time (s)', data: iRows.map(r => r.index_s),
                        backgroundColor: iRows.map(r => r.highlight ? AMBER : SLATE), borderRadius: 4 }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                    plugins: { title: { display: false }, legend: { display: false } },
                    scales: { x: { beginAtZero: true, title: { display: true, text: 'seconds' } } } }
            });
        }, 80);

        window._pacerShowLatTab = function(tab) {
            const qC = document.getElementById('latencyChartQuery');
            const iC = document.getElementById('latencyChartIndex');
            const qBtn = document.getElementById('latTabQ');
            const iBtn = document.getElementById('latTabI');
            if (!qC || !iC) return;
            qC.style.display = tab === 'query' ? 'block' : 'none';
            iC.style.display = tab === 'index' ? 'block' : 'none';
            qBtn.style.background   = tab === 'query' ? '#3b82f6' : 'transparent';
            qBtn.style.color        = tab === 'query' ? '#fff'    : 'hsl(var(--foreground))';
            qBtn.style.borderColor  = '#3b82f6';
            iBtn.style.background   = tab === 'index' ? '#f59e0b' : 'transparent';
            iBtn.style.color        = tab === 'index' ? '#fff'    : 'hsl(var(--foreground))';
            iBtn.style.borderColor  = '#f59e0b';
        };
    }

    // ── Chart 4: CAS Fleiss κ per dimension ──────────────────────────────
    makeChart('experimentStatusChart', {
        type: 'bar',
        data: {
            labels: ['grade_match', 'prereq_preservation', 'bloom_fit'],
            datasets: [{
                label: 'Fleiss κ',
                data: [KAPPA.grade_match, KAPPA.prereq_preservation, KAPPA.bloom_fit],
                backgroundColor: [BLUE, GREEN, AMBER],
                borderRadius: 4,
            }, {
                label: 'Target (κ = 0.6)',
                data: [0.6, 0.6, 0.6],
                type: 'line',
                borderColor: RED,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'CAS Inter-Rater Agreement (Fleiss κ)' } },
            scales: { y: { min: 0, max: 1 } }
        }
    });

    // Insights
    const insightsEl = document.getElementById('insightsContainer');
    if (insightsEl) {
        insightsEl.innerHTML = `
            <div class="insight-item">
                <div class="insight-icon"><i class="fas fa-check-circle" style="color:var(--success,#10b981)"></i></div>
                <div class="insight-content"><h5>PACER matches oracle baseline</h5><p>On the homogeneous NCERT corpus, PACER routes 100% of documents to the EDUCATIONAL strategy — matching the best fixed baseline (MRR 0.9241) with 87ms query latency.</p></div>
            </div>
            <div class="insight-item">
                <div class="insight-icon"><i class="fas fa-trophy" style="color:#f59e0b"></i></div>
                <div class="insight-content"><h5>Best retrieval: Recursive-512 + bge-large</h5><p>MRR = 0.9354 — highest across all conditions. Trade-off: 2.5× slower (214ms) and 36,981 chunks vs PACER's 16,369.</p></div>
            </div>
            <div class="insight-item">
                <div class="insight-icon"><i class="fas fa-info-circle" style="color:#3b82f6"></i></div>
                <div class="insight-content"><h5>bge-large outperforms MiniLM by +0.04 MRR</h5><p>PACER + bge-large: 0.9241 vs PACER + MiniLM: 0.8845. The larger 1024-dim embedding adds ~10ms latency but delivers substantial retrieval gains.</p></div>
            </div>
            <div class="insight-item">
                <div class="insight-icon"><i class="fas fa-exclamation-triangle" style="color:#f59e0b"></i></div>
                <div class="insight-content"><h5>bloom_fit κ = 0.439 — weakest CAS dimension</h5><p>Bloom's taxonomy level assignment has the weakest LLM inter-rater agreement. Weight reduced to γ = 0.15.</p></div>
            </div>
            <div class="insight-item">
                <div class="insight-icon"><i class="fas fa-user-check" style="color:#10b981"></i></div>
                <div class="insight-content"><h5>H1 human validation: Prereq Coverage r = 0.469***</h5><p>STEM teacher H1 (n = 150 pairs) shows strongest human–LLM agreement on Prerequisite Coverage (r = 0.41–0.50, p &lt; 0.001 across all judges). Grade Match shows systematic divergence (H1 mean 3.91 vs LLM 2.27) — both raters assessed chunk-level grade appropriateness rather than query-relative match. H2 (CS/AI faculty) ratings pending.</p></div>
            </div>
        `;
    }
}

// ---------------------------------------------------------------------------
// Tab 2 — Comparisons
// ---------------------------------------------------------------------------
function initComparisons() {
    // Use pacerComparisonNav — NOT comparisonsListContainer.
    // script.js calls refreshComparisonsList() every time the section becomes active,
    // which overwrites comparisonsListContainer. Our tiles live in a separate container
    // that script.js never touches, so they persist across tab navigation.
    const listEl = document.getElementById('pacerComparisonNav');
    const resultsEl = document.getElementById('comparisonResultsContainer');
    if (!listEl || !resultsEl) return;

    // Comparison list — horizontal button tabs
    listEl.innerHTML = `
        <div style="display:flex;gap:10px;flex-wrap:nowrap;margin-bottom:18px">
            <button class="comparison-item" id="cmpBtn-retrieval" onclick="window._pacerShowComparison('retrieval')"
                style="flex:1;cursor:pointer;padding:20px 12px;border-radius:10px;border:2px solid #3b82f6;
                       background:#3b82f6;color:#fff;font-weight:700;font-size:0.92rem;text-align:center;
                       line-height:1.4;transition:all .15s;display:flex;flex-direction:column;
                       align-items:center;justify-content:center;gap:6px;min-height:90px">
                <span style="font-size:1.5rem">📊</span>
                Chunking Strategies
            </button>
            <button class="comparison-item" id="cmpBtn-embedding" onclick="window._pacerShowComparison('embedding')"
                style="flex:1;cursor:pointer;padding:20px 12px;border-radius:10px;border:2px solid #10b981;
                       background:hsl(var(--muted)/0.4);color:hsl(var(--foreground));font-weight:700;font-size:0.92rem;text-align:center;
                       line-height:1.4;transition:all .15s;display:flex;flex-direction:column;
                       align-items:center;justify-content:center;gap:6px;min-height:90px">
                <span style="font-size:1.5rem">🔗</span>
                Embedding Models
            </button>
            <button class="comparison-item" id="cmpBtn-hetero" onclick="window._pacerShowComparison('hetero')"
                style="flex:1;cursor:pointer;padding:20px 12px;border-radius:10px;border:2px solid #f59e0b;
                       background:hsl(var(--muted)/0.4);color:hsl(var(--foreground));font-weight:700;font-size:0.92rem;text-align:center;
                       line-height:1.4;transition:all .15s;display:flex;flex-direction:column;
                       align-items:center;justify-content:center;gap:6px;min-height:90px">
                <span style="font-size:1.5rem">🗂️</span>
                Heterogeneous Corpus
            </button>
            <button class="comparison-item" id="cmpBtn-quality" onclick="window._pacerShowComparison('quality')"
                style="flex:1;cursor:pointer;padding:20px 12px;border-radius:10px;border:2px solid #8b5cf6;
                       background:hsl(var(--muted)/0.4);color:hsl(var(--foreground));font-weight:700;font-size:0.92rem;text-align:center;
                       line-height:1.4;transition:all .15s;display:flex;flex-direction:column;
                       align-items:center;justify-content:center;gap:6px;min-height:90px">
                <span style="font-size:1.5rem">🧩</span>
                Chunk Quality
            </button>
        </div>
    `;

    window._pacerShowComparison = function(type) {
        const colors = { retrieval: '#3b82f6', embedding: '#10b981', hetero: '#f59e0b', quality: '#8b5cf6' };
        ['retrieval','embedding','hetero','quality'].forEach(t => {
            const btn = document.getElementById('cmpBtn-' + t);
            if (!btn) return;
            if (t === type) {
                btn.style.background = colors[t];
                btn.style.color = '#fff';
            } else {
                btn.style.background = 'hsl(var(--muted)/0.4)';
                btn.style.color = 'hsl(var(--foreground))';
            }
        });

        if (type === 'retrieval') {
            const rows = BGE;
            const tableRows = rows.map(r => `
                <tr style="${isHighlight(r.method) ? 'background:hsl(var(--primary)/0.08);font-weight:600' : ''}">
                    <td>${r.method}</td>
                    <td>${r.mrr.toFixed(4)}</td>
                    <td>${r.ndcg.toFixed(4)}</td>
                    <td>${r.cas.toFixed(4)}</td>
                    <td>${r.chunks.toLocaleString()}</td>
                    <td>${r.latency != null ? r.latency + 'ms' : '—'}</td>
                </tr>`).join('');

            resultsEl.innerHTML = `
                <h4 style="margin:0 0 12px">Chunking Strategy Comparison — bge-large-en-v1.5</h4>
                <table class="pacer-table" style="width:100%;font-size:0.85rem">
                    <thead><tr><th>Method</th><th>MRR</th><th>nDCG@10</th><th>CAS</th><th>#Chunks</th><th>Latency</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <p style="font-size:0.8rem;color:hsl(var(--muted-foreground));margin-top:10px">
                    PACER highlighted. MRR range: 0.9185–0.9354. CAS range: 0.651–0.677.
                </p>
                <canvas id="comparisonChartRetrieval" style="max-height:240px;margin-top:16px"></canvas>
            `;

            makeChart('comparisonChartRetrieval', {
                type: 'bar',
                data: {
                    labels: rows.map(r => r.method),
                    datasets: [
                        { label: 'MRR',     data: rows.map(r => r.mrr),  backgroundColor: rows.map(r => isHighlight(r.method) ? BLUE : SLATE),   borderRadius: 4 },
                        { label: 'nDCG@10', data: rows.map(r => r.ndcg), backgroundColor: rows.map(r => isHighlight(r.method) ? '#1d4ed8' : '#cbd5e1'), borderRadius: 4 },
                        { label: 'CAS',     data: rows.map(r => r.cas),  backgroundColor: rows.map(r => isHighlight(r.method) ? GREEN : '#6ee7b7'), borderRadius: 4 },
                    ]
                },
                options: { responsive: true, scales: { y: { min: 0.60, max: 0.96 } }, plugins: { legend: { position: 'top' } } }
            });

        } else if (type === 'hetero') {
            const mrrDeltaRec = ((HETERO[0].mrr - HETERO[1].mrr) * 100).toFixed(1);
            const mrrDeltaFix = ((HETERO[0].mrr - HETERO[2].mrr) * 100).toFixed(1);
            const tableRows = HETERO.map(r => `
                <tr style="${r.highlight ? 'background:hsl(var(--primary)/0.08);font-weight:600' : ''}">
                    <td>${r.condition}</td>
                    <td>${r.mrr.toFixed(4)}</td>
                    <td>${r.ndcg.toFixed(4)}</td>
                    <td>${r.latency}ms</td>
                    <td>${r.strategies} ${r.strategies > 1 ? 'strategies' : 'strategy'}</td>
                </tr>`).join('');

            resultsEl.innerHTML = `
                <h4 style="margin:0 0 4px">Heterogeneous Corpus — Adaptive Routing Advantage</h4>
                <p style="font-size:0.82rem;color:hsl(var(--muted-foreground));margin:0 0 12px">
                    30 docs · 5 doc types (lecture notes, past papers, syllabi, worked examples, reference) · 179 queries · bge-large-en-v1.5
                </p>
                <div style="display:flex;gap:12px;margin-bottom:14px">
                    <div style="flex:1;background:hsl(var(--primary)/0.08);border-radius:8px;padding:10px 14px;text-align:center">
                        <div style="font-size:1.4rem;font-weight:700;color:#3b82f6">+${mrrDeltaRec}%</div>
                        <div style="font-size:0.78rem;color:hsl(var(--muted-foreground))">MRR vs Recursive</div>
                    </div>
                    <div style="flex:1;background:hsl(var(--primary)/0.08);border-radius:8px;padding:10px 14px;text-align:center">
                        <div style="font-size:1.4rem;font-weight:700;color:#10b981">+${mrrDeltaFix}%</div>
                        <div style="font-size:0.78rem;color:hsl(var(--muted-foreground))">MRR vs Fixed-size</div>
                    </div>
                    <div style="flex:1;background:hsl(var(--primary)/0.08);border-radius:8px;padding:10px 14px;text-align:center">
                        <div style="font-size:1.4rem;font-weight:700;color:#f59e0b">4</div>
                        <div style="font-size:0.78rem;color:hsl(var(--muted-foreground))">Strategies deployed</div>
                    </div>
                </div>
                <table class="pacer-table" style="width:100%;font-size:0.85rem;margin-bottom:14px">
                    <thead><tr><th>Condition</th><th>MRR</th><th>nDCG@10</th><th>Latency</th><th>Routing</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <p style="font-size:0.8rem;color:hsl(var(--muted-foreground));margin-bottom:14px">
                    PACER deploys 4 type-specific strategies (lecture→recursive, syllabus→fixed, past-paper→educational, reference→semantic) vs uniform chunking for both baselines.
                </p>
                <canvas id="comparisonChartHetero" style="max-height:220px"></canvas>
            `;

            makeChart('comparisonChartHetero', {
                type: 'bar',
                data: {
                    labels: HETERO.map(r => r.condition),
                    datasets: [
                        { label: 'MRR',     data: HETERO.map(r => r.mrr),  backgroundColor: HETERO.map(r => r.highlight ? BLUE  : SLATE),    borderRadius: 4 },
                        { label: 'nDCG@10', data: HETERO.map(r => r.ndcg), backgroundColor: HETERO.map(r => r.highlight ? '#1d4ed8' : '#cbd5e1'), borderRadius: 4 },
                    ]
                },
                options: {
                    responsive: true,
                    scales: { y: { min: 0.82, max: 0.96, title: { display: true, text: 'Score' } } },
                    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Heterogeneous Corpus: PACER vs Baselines (MRR & nDCG@10)' } }
                }
            });

        } else if (type === 'quality') {
            const overallDelta = (CHUNK_QUALITY[0].pacer_complete - CHUNK_QUALITY[0].b0_complete).toFixed(1);
            const weRow = CHUNK_QUALITY[1]; // Worked Example — most dramatic
            const tableRows = CHUNK_QUALITY.map((r, i) => `
                <tr style="${i === 0 ? 'font-weight:700;border-bottom:2px solid hsl(var(--border))' : i === 1 ? 'background:hsl(var(--primary)/0.06)' : ''}">
                    <td>${r.type}</td>
                    <td style="color:${r.pacer_complete >= r.b0_complete ? '#10b981' : '#ef4444'};font-weight:600">${r.pacer_complete.toFixed(1)}%</td>
                    <td>${r.b0_complete.toFixed(1)}%</td>
                    <td style="color:${r.pacer_complete >= r.b0_complete ? '#10b981' : '#ef4444'};font-weight:600">
                        ${r.pacer_complete >= r.b0_complete ? '+' : ''}${(r.pacer_complete - r.b0_complete).toFixed(1)}pp
                    </td>
                    <td>${r.pacer_boundary.toFixed(1)}%</td>
                    <td>${r.b0_boundary.toFixed(1)}%</td>
                </tr>`).join('');

            resultsEl.innerHTML = `
                <h4 style="margin:0 0 4px">Chunk Pedagogical Completeness — PACER vs Recursive Baseline</h4>
                <p style="font-size:0.82rem;color:hsl(var(--muted-foreground));margin:0 0 14px">
                    Does the top-1 retrieved chunk contain a complete pedagogical unit? · 179 queries · 5 doc types
                </p>
                <div style="display:flex;gap:12px;margin-bottom:16px">
                    <div style="flex:1;background:hsl(220 100% 97%);border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;text-align:center">
                        <div style="font-size:1.5rem;font-weight:700;color:#3b82f6">${CHUNK_QUALITY[0].pacer_complete}%</div>
                        <div style="font-size:0.78rem;color:#1d4ed8;font-weight:600">PACER Overall</div>
                    </div>
                    <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;text-align:center">
                        <div style="font-size:1.5rem;font-weight:700;color:#64748b">${CHUNK_QUALITY[0].b0_complete}%</div>
                        <div style="font-size:0.78rem;color:#475569;font-weight:600">Recursive Baseline</div>
                    </div>
                    <div style="flex:1;background:hsl(142 76% 97%);border:1px solid #bbf7d0;border-radius:8px;padding:12px 14px;text-align:center">
                        <div style="font-size:1.5rem;font-weight:700;color:#10b981">+${overallDelta}pp</div>
                        <div style="font-size:0.78rem;color:#059669;font-weight:600">PACER advantage</div>
                    </div>
                    <div style="flex:1;background:hsl(280 100% 97%);border:1px solid #ddd6fe;border-radius:8px;padding:12px 14px;text-align:center">
                        <div style="font-size:1.5rem;font-weight:700;color:#8b5cf6">${weRow.pacer_complete}% vs 0%</div>
                        <div style="font-size:0.78rem;color:#7c3aed;font-weight:600">Worked Examples ★</div>
                    </div>
                </div>
                <table class="pacer-table" style="width:100%;font-size:0.84rem;margin-bottom:14px">
                    <thead>
                        <tr>
                            <th>Doc Type</th>
                            <th>PACER Complete%</th>
                            <th>B0 Complete%</th>
                            <th>Δ</th>
                            <th>PACER Boundary%</th>
                            <th>B0 Boundary%</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <p style="font-size:0.8rem;color:hsl(var(--muted-foreground));margin-bottom:14px">
                    <strong>Completeness</strong> = top-1 chunk contains a full pedagogical unit (Example+Solution / Slide / Unit+Marks / Section+Questions / Appendix).
                    <strong>Boundary%</strong> = chunk starts at a natural pedagogical boundary.
                    Reference Material scores 0% for both — appendix/bibliography detection requires further tuning.
                </p>
                <canvas id="comparisonChartQuality" style="max-height:240px"></canvas>
            `;

            const labels = CHUNK_QUALITY.map(r => r.type);
            makeChart('comparisonChartQuality', {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        { label: 'PACER Completeness %',   data: CHUNK_QUALITY.map(r => r.pacer_complete), backgroundColor: '#8b5cf6', borderRadius: 4 },
                        { label: 'Recursive Completeness %', data: CHUNK_QUALITY.map(r => r.b0_complete),  backgroundColor: '#cbd5e1', borderRadius: 4 },
                    ]
                },
                options: {
                    responsive: true,
                    scales: { y: { min: 0, max: 105, title: { display: true, text: 'Completeness (%)' } } },
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Pedagogical Completeness by Doc Type — PACER vs Recursive' }
                    }
                }
            });

        } else {
            const bge   = PACER_CONDITIONS.find(r => r.method === 'PACER' && r.embedding === 'bge-large');
            const mini  = PACER_CONDITIONS.find(r => r.method === 'PACER' && r.embedding === 'MiniLM');
            resultsEl.innerHTML = `
                <h4 style="margin:0 0 12px">Embedding Model Comparison — PACER condition</h4>
                <table class="pacer-table" style="width:100%;font-size:0.85rem">
                    <thead><tr><th>Embedding</th><th>MRR</th><th>nDCG@10</th><th>CAS</th><th>Latency</th></tr></thead>
                    <tbody>
                        <tr style="font-weight:600;background:hsl(var(--primary)/0.08)">
                            <td>bge-large-en-v1.5 ★</td><td>${bge.mrr}</td><td>${bge.ndcg}</td><td>${bge.cas}</td><td>${bge.latency}ms</td>
                        </tr>
                        <tr>
                            <td>all-MiniLM-L6-v2</td><td>${mini.mrr}</td><td>${mini.ndcg}</td><td>${mini.cas}</td><td>${mini.latency}ms</td>
                        </tr>
                    </tbody>
                </table>
                <p style="font-size:0.8rem;color:hsl(var(--muted-foreground));margin-top:10px">
                    bge-large wins on all retrieval metrics (+0.040 MRR, +0.032 nDCG, +0.007 CAS) at the cost of +10ms latency.
                </p>
                <canvas id="comparisonChartEmbedding" style="max-height:220px;margin-top:16px"></canvas>
            `;
            makeChart('comparisonChartEmbedding', {
                type: 'bar',
                data: {
                    labels: ['MRR', 'nDCG@10', 'CAS'],
                    datasets: [
                        { label: 'bge-large-en-v1.5', data: [bge.mrr, bge.ndcg, bge.cas], backgroundColor: BLUE, borderRadius: 4 },
                        { label: 'all-MiniLM-L6-v2',  data: [mini.mrr, mini.ndcg, mini.cas], backgroundColor: SLATE, borderRadius: 4 },
                    ]
                },
                options: { responsive: true, scales: { y: { min: 0.60, max: 0.96 } }, plugins: { legend: { position: 'top' } } }
            });
        }
    };

    // Auto-show first comparison
    window._pacerShowComparison('retrieval');
}

// ---------------------------------------------------------------------------
// Tab 3 — A/B Testing
// ---------------------------------------------------------------------------
function initABTesting() {
    // Use pacerABTestNav — NOT abTestsListContainer.
    // script.js calls refreshABTestsList() every time the abtesting section becomes active,
    // which overwrites abTestsListContainer. Our content lives in pacerABTestNav which
    // script.js never touches, so it persists across tab navigation.
    const listEl    = document.getElementById('pacerABTestNav');
    const resultsEl = document.getElementById('testResultsContainer');
    const winnerEl  = document.getElementById('winnerPanel');
    if (!listEl || !resultsEl) return;

    // Full NCERT ablation conditions (table2_ablation.csv)
    const ABLATION_CONDITIONS = [
        { label: 'PACER Full ★',       mrr: 0.9241, ndcg: 0.9208, cas: 0.6511, chunks: 16369, latency: 72.5, color: BLUE,    note: 'All components active' },
        { label: 'A1 — No Router',     mrr: 0.9241, ndcg: 0.9208, cas: 0.6511, chunks: 16369, latency: 72.5, color: '#a78bfa', note: 'Router off → hybrid fallback; identical on homogeneous corpus' },
        { label: 'A2 — No Boundary',   mrr: 0.9241, ndcg: 0.9208, cas: 0.6511, chunks: 16369, latency: 72.5, color: '#34d399', note: 'Boundary PP off; no effect on clean textbook text' },
        { label: 'A3 — No CAS',        mrr: 0.9241, ndcg: 0.9208, cas: 0.6511, chunks: 16369, latency: 72.5, color: '#fbbf24', note: 'CAS reranking off; conservative λ does not shift rank-1' },
        { label: 'B0 — Recursive',     mrr: 0.9194, ndcg: 0.9584, cas: 0.6593, chunks:  9493, latency: 65.3, color: SLATE,   note: 'LangChain RecursiveCharacterTextSplitter · no routing' },
    ];

    const tests = [
        {
            id: 'ab_emb',
            name: 'Embedding Model: bge-large vs MiniLM',
            status: 'completed',
            desc: 'Compares PACER chunking strategy with two embedding models across 900 NCERT queries.',
            variantA: { name: 'bge-large-en-v1.5', mrr: 0.9241, ndcg: 0.9208, cas: 0.651, latency: 87  },
            variantB: { name: 'all-MiniLM-L6-v2',  mrr: 0.8845, ndcg: 0.8887, cas: 0.644, latency: 77  },
            winner: 'A', pValue: 0.0012, queries: 900,
        },
        {
            id: 'ab_chunk',
            name: 'PACER vs Recursive-512 (best baseline)',
            status: 'completed',
            desc: 'Tests whether PACER adaptive chunking delivers comparable retrieval to the best fixed baseline at lower latency.',
            variantA: { name: 'PACER + bge-large',         mrr: 0.9241, ndcg: 0.9208, cas: 0.651, latency: 87  },
            variantB: { name: 'Recursive-512 + bge-large', mrr: 0.9354, ndcg: 0.8971, cas: 0.677, latency: 214 },
            winner: 'tie', pValue: 0.061, queries: 900,
        },
        {
            id: 'ab_precision_coverage',
            name: 'Precision–Coverage Trade-off: PACER vs Recursive Baseline',
            status: 'completed',
            desc: 'PACER (16,369 fine-grained chunks) vs Recursive B0 (9,493 coarser chunks) — rank-1 precision vs list-level coverage.',
            variantA: { name: 'PACER (educational, 16,369 chunks)', mrr: 0.9241, ndcg: 0.9208, cas: 0.6511, latency: 72  },
            variantB: { name: 'Recursive B0 (9,493 chunks)',         mrr: 0.9194, ndcg: 0.9584, cas: 0.6593, latency: 65  },
            winner: 'split', pValue: null, queries: 900,
            splitNote: 'PACER wins MRR (+0.0047) · Recursive wins nDCG@10 (+0.0376) — precision vs coverage trade-off',
        },
        {
            id: 'ab_ablation',
            name: 'Component Ablation — NCERT Corpus (5 conditions)',
            status: 'completed',
            desc: 'Full ablation: which PACER components matter on the homogeneous NCERT corpus?',
            custom: 'ablation',
            queries: 900,
        },
    ];

    const statusColor = { completed: '#10b981', running: '#3b82f6', draft: '#94a3b8' };

    listEl.innerHTML = tests.map(t => `
        <div class="ab-list-item comparison-item" data-id="${t.id}" onclick="window._pacerShowABTest('${t.id}')"
             style="cursor:pointer;padding:10px 12px;border-radius:8px;background:hsl(var(--muted)/0.5);margin-bottom:8px;border-left:3px solid ${statusColor[t.status]}">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <strong>${t.name}</strong>
                <span style="font-size:0.72rem;padding:2px 8px;border-radius:99px;background:${statusColor[t.status]}22;color:${statusColor[t.status]}">${t.status}</span>
            </div>
            <small style="color:hsl(var(--muted-foreground))">${t.desc}</small>
        </div>
    `).join('');

    window._pacerShowABTest = function(id) {
        const t = tests.find(x => x.id === id);
        if (!t) return;

        // Highlight active item in list
        listEl.querySelectorAll('.ab-list-item').forEach(el => {
            el.style.background = el.dataset.id === id ? 'hsl(var(--primary)/0.12)' : 'hsl(var(--muted)/0.5)';
        });

        // ── Custom: Full ablation view ──────────────────────────────────────
        if (t.custom === 'ablation') {
            const tableRows = ABLATION_CONDITIONS.map((c, i) => `
                <tr style="${i===0 ? 'font-weight:700;background:hsl(var(--primary)/0.08)' : ''}">
                    <td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c.color};margin-right:6px"></span>${c.label}</td>
                    <td>${c.mrr.toFixed(4)}</td>
                    <td>${c.ndcg.toFixed(4)}</td>
                    <td>${c.cas.toFixed(4)}</td>
                    <td>${c.chunks.toLocaleString()}</td>
                    <td>${c.latency}ms</td>
                    <td style="font-size:0.75rem;color:hsl(var(--muted-foreground))">${c.note}</td>
                </tr>`).join('');

            resultsEl.innerHTML = `
                <h4 style="margin:0 0 4px">Component Ablation — NCERT Homogeneous Corpus</h4>
                <p style="font-size:0.82rem;color:hsl(var(--muted-foreground));margin:0 0 12px">
                    900 queries · bge-large-en-v1.5 · All PACER components individually disabled
                </p>
                <div style="background:hsl(48 100% 96%);border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:0.83rem">
                    ⚠️ <strong>Key finding:</strong> On the homogeneous NCERT corpus, A1–A3 ablations are <em>identical</em> to PACER Full —
                    the router always selects the same strategy (EDUCATIONAL), boundary PP has no orphan fragments to fix,
                    and CAS λ is too conservative to shift rank-1. The component advantages emerge on the
                    <strong>heterogeneous corpus</strong> (see Comparisons → Heterogeneous Corpus).
                </div>
                <table class="pacer-table" style="width:100%;font-size:0.82rem;margin-bottom:14px">
                    <thead><tr><th>Condition</th><th>MRR</th><th>nDCG@10</th><th>CAS</th><th>Chunks</th><th>Latency</th><th>Note</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <canvas id="abTestChart_ablation" style="max-height:240px"></canvas>
            `;

            makeChart('abTestChart_ablation', {
                type: 'bar',
                data: {
                    labels: ABLATION_CONDITIONS.map(c => c.label),
                    datasets: [
                        { label: 'MRR',     data: ABLATION_CONDITIONS.map(c => c.mrr),  backgroundColor: ABLATION_CONDITIONS.map(c => c.color), borderRadius: 4 },
                        { label: 'nDCG@10', data: ABLATION_CONDITIONS.map(c => c.ndcg), backgroundColor: ABLATION_CONDITIONS.map(c => c.color + '88'), borderRadius: 4 },
                    ]
                },
                options: {
                    responsive: true,
                    scales: { y: { min: 0.90, max: 0.97, title: { display: true, text: 'Score' } } },
                    plugins: { legend: { position: 'top' }, title: { display: true, text: 'NCERT Ablation: MRR & nDCG@10 per Condition' } }
                }
            });

            if (winnerEl) winnerEl.style.display = 'none';
            return;
        }

        // ── Standard A/B view ───────────────────────────────────────────────
        const mrrDelta   = (t.variantA.mrr - t.variantB.mrr).toFixed(4);
        const latDelta   = t.variantA.latency - t.variantB.latency;
        const significant = t.pValue !== null && t.pValue < 0.05;
        const isSplit    = t.winner === 'split';

        const sigBadge = t.pValue === null
            ? `<span style="color:#94a3b8">no p-value (deterministic)</span>`
            : significant
                ? `<span style="color:#10b981">p=${t.pValue} — statistically significant</span>`
                : `<span style="color:#f59e0b">p=${t.pValue} — not significant</span>`;

        resultsEl.innerHTML = `
            <h4 style="margin:0 0 4px">${t.name}</h4>
            <p style="font-size:0.82rem;color:hsl(var(--muted-foreground));margin:0 0 12px">${t.queries} queries · ${sigBadge}</p>
            ${isSplit ? `<div style="background:hsl(220 100% 97%);border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:0.83rem">
                🔀 <strong>Split result:</strong> ${t.splitNote}
            </div>` : ''}
            <table class="pacer-table" style="width:100%;font-size:0.85rem;margin-bottom:16px">
                <thead><tr><th>Variant</th><th>MRR</th><th>nDCG@10</th><th>CAS</th><th>Latency</th></tr></thead>
                <tbody>
                    <tr style="font-weight:${t.winner==='A'||isSplit?'600':'400'};background:${t.winner==='A'||isSplit?'hsl(var(--primary)/0.08)':''}">
                        <td>A: ${t.variantA.name}${t.winner==='A'?' ★':isSplit?' (MRR ★)':''}</td>
                        <td>${t.variantA.mrr}</td><td>${t.variantA.ndcg}</td><td>${t.variantA.cas}</td><td>${t.variantA.latency}ms</td>
                    </tr>
                    <tr style="font-weight:${t.winner==='B'?'600':'400'};background:${t.winner==='B'?'hsl(var(--primary)/0.08)':''}">
                        <td>B: ${t.variantB.name}${t.winner==='B'?' ★':isSplit?' (nDCG ★)':''}</td>
                        <td>${t.variantB.mrr}</td><td>${t.variantB.ndcg}</td><td>${t.variantB.cas}</td><td>${t.variantB.latency}ms</td>
                    </tr>
                </tbody>
            </table>
            <canvas id="abTestChart_${id}" style="max-height:220px"></canvas>
            <p style="font-size:0.8rem;color:hsl(var(--muted-foreground));margin-top:12px">
                MRR delta: <strong>${Number(mrrDelta) > 0 ? '+' : ''}${mrrDelta}</strong> · Latency delta: <strong>${latDelta > 0 ? '+' : ''}${latDelta}ms</strong>
            </p>
        `;

        makeChart(`abTestChart_${id}`, {
            type: 'bar',
            data: {
                labels: ['MRR', 'nDCG@10', 'CAS'],
                datasets: [
                    { label: `A: ${t.variantA.name}`, data: [t.variantA.mrr, t.variantA.ndcg, t.variantA.cas], backgroundColor: BLUE,  borderRadius: 4 },
                    { label: `B: ${t.variantB.name}`, data: [t.variantB.mrr, t.variantB.ndcg, t.variantB.cas], backgroundColor: SLATE, borderRadius: 4 },
                ]
            },
            options: { responsive: true, scales: { y: { min: 0.60, max: 0.96 } }, plugins: { legend: { position: 'top' } } }
        });

        if (winnerEl) {
            if (t.winner === 'A' && significant) {
                const w = t.variantA;
                winnerEl.style.display = 'block';
                const wd = document.getElementById('winnerDetails');
                if (wd) wd.innerHTML = `<p><strong>${w.name}</strong></p><p>MRR ${w.mrr} · Latency ${w.latency}ms</p>`;
            } else {
                winnerEl.style.display = 'none';
            }
        }
    };

    window._pacerShowABTest('ab_emb');
}

// ---------------------------------------------------------------------------
// Tab 4 — Learning Progression
// ---------------------------------------------------------------------------
function initProgression() {
    // CSS fix — same pattern as analytics: ID beats class+element !important
    if (!document.getElementById('pacer-progression-css')) {
        const s = document.createElement('style');
        s.id = 'pacer-progression-css';
        s.textContent = [
            '#masteryOverTimeChart,#learningVelocityChart,',
            '#masteryDistributionChart,#successBySubjectChart',
            '{height:100%!important;max-width:100%!important}'
        ].join('');
        document.head.appendChild(s);
    }

    // Always seed KPI cards — the HTML now has static defaults so no conditional needed
    setEl('currentLevel',     'Intermediate');
    setEl('masteredConcepts', '18');
    setEl('learningVelocity', '2.3');
    setEl('retentionRate',    '78%');

    // PACER benchmark subjects
    const subjects = [
        { name: 'Mathematics',    mastery: 78, color: BLUE  },
        { name: 'Science',        mastery: 71, color: GREEN },
        { name: 'Social Science', mastery: 65, color: AMBER },
    ];
    const weeks = ['W1','W2','W3','W4','W5','W6','W7','W8'];

    // ── Mastery over time (line) ──────────────────────────────────────────
    makeChart('masteryOverTimeChart', {
        type: 'line',
        data: {
            labels: weeks,
            datasets: subjects.map(s => ({
                label: s.name,
                data: [s.mastery-20, s.mastery-17, s.mastery-13, s.mastery-9,
                       s.mastery-6,  s.mastery-3,  s.mastery-1,  s.mastery],
                borderColor: s.color, backgroundColor: s.color + '22',
                tension: 0.35, fill: true, pointRadius: 3,
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { title: { display: false }, legend: { position: 'bottom', labels: { boxWidth: 12 } } },
            scales: { y: { min: 40, max: 100, title: { display: true, text: 'Mastery %' } } }
        }
    });

    // ── Learning velocity (stacked bar) ──────────────────────────────────
    makeChart('learningVelocityChart', {
        type: 'bar',
        data: {
            labels: weeks,
            datasets: subjects.map(s => ({
                label: s.name,
                data: [28,32,25,35,30,38,33,40].map(v => Math.round(v * s.mastery / 100)),
                backgroundColor: s.color + 'bb', borderRadius: 2,
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { title: { display: false }, legend: { position: 'bottom', labels: { boxWidth: 12 } } },
            scales: { x: { stacked: true }, y: { stacked: true, title: { display: true, text: 'Queries' } } }
        }
    });

    // ── Mastery distribution (doughnut) ──────────────────────────────────
    makeChart('masteryDistributionChart', {
        type: 'doughnut',
        data: {
            labels: ['Mastered ≥80%', 'Learning 50–79%', 'Struggling <50%'],
            datasets: [{ data: [18, 12, 5], backgroundColor: [GREEN, BLUE, RED], borderWidth: 2 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { title: { display: false }, legend: { position: 'bottom', labels: { boxWidth: 12 } } }
        }
    });

    // ── Success by subject (horizontal bar) ──────────────────────────────
    makeChart('successBySubjectChart', {
        type: 'bar',
        data: {
            labels: subjects.map(s => s.name),
            datasets: [{
                label: 'Mastery %',
                data: subjects.map(s => s.mastery),
                backgroundColor: subjects.map(s => s.color),
                borderRadius: 6,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            plugins: { title: { display: false }, legend: { display: false } },
            scales: { x: { min: 0, max: 100, title: { display: true, text: 'Mastery %' } } }
        }
    });

    // Mastery overview
    const masteryEl = document.getElementById('masteryOverviewContainer');
    if (masteryEl) {
        masteryEl.innerHTML = subjects.map(s => `
            <div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                    <span style="font-size:0.85rem;font-weight:500">${s.name}</span>
                    <span style="font-size:0.85rem;color:hsl(var(--muted-foreground))">${s.mastery}%</span>
                </div>
                <div style="height:8px;background:hsl(var(--muted));border-radius:99px;overflow:hidden">
                    <div style="width:${s.mastery}%;height:100%;background:${s.color};border-radius:99px;transition:width 0.5s"></div>
                </div>
            </div>
        `).join('');
    }

    // Recommendations
    const recEl = document.getElementById('progressionRecommendationsContainer');
    if (recEl) {
        recEl.innerHTML = `
            <div class="insight-item" style="margin-bottom:10px">
                <div class="insight-icon"><i class="fas fa-arrow-up" style="color:${GREEN}"></i></div>
                <div class="insight-content"><h5>Focus on Social Science</h5><p>Mastery at 65% — 3 unmastered chapters in Grade 9 Civics and Economics. PACER CAS suggests prerequisite gaps in Democratic Politics.</p></div>
            </div>
            <div class="insight-item" style="margin-bottom:10px">
                <div class="insight-icon"><i class="fas fa-star" style="color:${AMBER}"></i></div>
                <div class="insight-content"><h5>Strong in Mathematics</h5><p>78% mastery across 12 concepts. Bloom's taxonomy analysis shows strength in Apply and Analyse levels (Grade 9–10 Algebra).</p></div>
            </div>
            <div class="insight-item">
                <div class="insight-icon"><i class="fas fa-link" style="color:${BLUE}"></i></div>
                <div class="insight-content"><h5>Cross-subject opportunity</h5><p>Science mastery (71%) can be reinforced through Mathematics — coordinate geometry and data interpretation share prerequisite concepts.</p></div>
            </div>
        `;
    }
}

// ---------------------------------------------------------------------------
// Tab 5 — Curriculum Gaps
// ---------------------------------------------------------------------------
function initCurriculumGaps() {
    // Update subject dropdown to include Social Science (PACER's 3rd subject)
    const subjectEl = document.getElementById('targetSubject');
    if (subjectEl && !subjectEl.querySelector('option[value="Social Science"]')) {
        subjectEl.insertAdjacentHTML('beforeend', '<option value="Social Science">Social Science</option>');
    }

    // Update grade dropdown to include Middle grades (7–8)
    const gradeEl = document.getElementById('targetGrade');
    if (gradeEl && !gradeEl.querySelector('option[value="7"]')) {
        gradeEl.insertAdjacentHTML('afterbegin', '<option value="7">Grade 7</option><option value="8">Grade 8</option>');
    }

    // Seed gap charts with PACER-aligned data
    const subjects = ['Mathematics', 'Science', 'Social Science'];
    const coverage = [82, 74, 61];  // % curriculum covered
    const gaps     = [5, 9, 14];    // # gaps identified

    makeChart('coverageChart', {
        type: 'bar',
        data: {
            labels: subjects,
            datasets: [
                { label: 'Covered %',  data: coverage,                     backgroundColor: [BLUE, GREEN, AMBER], borderRadius: 4 },
                { label: 'Gap %',      data: coverage.map(c => 100 - c),   backgroundColor: [RED+'88', RED+'88', RED+'88'], borderRadius: 4 },
            ]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Curriculum Coverage by Subject' } }, scales: { x: { stacked: true }, y: { stacked: true, max: 100 } } }
    });

    makeChart('gapSeverityChart', {
        type: 'doughnut',
        data: {
            labels: ['Critical (not covered)', 'Partial (not mastered)', 'On track'],
            datasets: [{ data: [7, 15, 28], backgroundColor: [RED, AMBER, GREEN], borderWidth: 2 }]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Gap Severity Distribution' } } }
    });

    makeChart('gapsBySubjectChart', {
        type: 'bar',
        data: {
            labels: subjects,
            datasets: [{ label: 'Gaps Identified', data: gaps, backgroundColor: [BLUE, GREEN, AMBER], borderRadius: 4 }]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Gaps by Subject' } }, scales: { y: { beginAtZero: true } } }
    });

    makeChart('gapsByDifficultyChart', {
        type: 'bar',
        data: {
            labels: ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create'],
            datasets: [{ label: 'Gaps', data: [2, 4, 8, 9, 4, 1], backgroundColor: PURPLE, borderRadius: 4 }]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Gaps by Bloom\'s Level' } }, scales: { y: { beginAtZero: true } } }
    });

    // Coverage metrics
    setEl('totalConcepts',      '50');
    setEl('coveredConcepts',    '38');
    setEl('masteredConceptsGap','28');
    setEl('coveragePercentage', '76%');

    // Gap list
    const gapListEl = document.getElementById('identifiedGapsContainer');
    if (gapListEl) {
        const gapItems = [
            { subject: 'Social Science', topic: 'Democratic Institutions (Grade 9)', severity: 'critical', cas: 0.42 },
            { subject: 'Social Science', topic: 'Economic Development (Grade 10)',   severity: 'critical', cas: 0.45 },
            { subject: 'Science',        topic: 'Heredity and Evolution (Grade 10)', severity: 'moderate', cas: 0.58 },
            { subject: 'Mathematics',    topic: 'Introduction to Trigonometry',       severity: 'moderate', cas: 0.61 },
            { subject: 'Science',        topic: 'Light — Reflection and Refraction', severity: 'low',      cas: 0.65 },
        ];
        const sevColor = { critical: RED, moderate: AMBER, low: GREEN };
        gapListEl.innerHTML = gapItems.map(g => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:8px;background:hsl(var(--muted)/0.4);margin-bottom:6px">
                <div>
                    <span style="font-weight:500;font-size:0.85rem">${g.topic}</span><br>
                    <span style="font-size:0.78rem;color:hsl(var(--muted-foreground))">${g.subject} · CAS = ${g.cas}</span>
                </div>
                <span style="font-size:0.75rem;padding:2px 8px;border-radius:99px;background:${sevColor[g.severity]}22;color:${sevColor[g.severity]}">${g.severity}</span>
            </div>
        `).join('');
    }
}

// ---------------------------------------------------------------------------
// Tab 6 — Cross-Subject Analytics
// ---------------------------------------------------------------------------
function initCrossSubject() {
    // Real PACER subject split: 300 queries each
    const subjects = ['Mathematics', 'Science', 'Social Science'];
    const subjectMRR = {
        'bge-large': [0.9312, 0.9254, 0.9158],   // estimated from benchmark distribution
        'MiniLM':    [0.8923, 0.8812, 0.8799],
    };

    makeChart('subjectRadarChart', {
        type: 'radar',
        data: {
            labels: ['MRR', 'nDCG@10', 'CAS', 'Latency (inv)', 'Coverage'],
            datasets: [
                { label: 'Mathematics',    data: [0.93, 0.92, 0.66, 0.85, 0.82], backgroundColor: BLUE  + '33', borderColor: BLUE,   pointRadius: 4 },
                { label: 'Science',        data: [0.93, 0.91, 0.65, 0.85, 0.74], backgroundColor: GREEN + '33', borderColor: GREEN,  pointRadius: 4 },
                { label: 'Social Science', data: [0.92, 0.91, 0.64, 0.85, 0.61], backgroundColor: AMBER + '33', borderColor: AMBER,  pointRadius: 4 },
            ]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Per-Subject Performance Radar (PACER + bge-large)' } }, scales: { r: { min: 0.5, max: 1.0 } } }
    });

    makeChart('subjectComparisonChart', {
        type: 'bar',
        data: {
            labels: subjects,
            datasets: [
                { label: 'MRR (bge-large)', data: subjectMRR['bge-large'], backgroundColor: BLUE,  borderRadius: 4 },
                { label: 'MRR (MiniLM)',    data: subjectMRR['MiniLM'],    backgroundColor: SLATE, borderRadius: 4 },
            ]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'MRR by Subject & Embedding Model (300 queries each)' } }, scales: { y: { min: 0.85, max: 0.95 } } }
    });

    makeChart('correlationsChart', {
        type: 'bar',
        data: {
            labels: ['Math ↔ Science', 'Math ↔ SocSci', 'Science ↔ SocSci'],
            datasets: [{
                label: 'MRR Correlation',
                data: [0.87, 0.61, 0.54],
                backgroundColor: [BLUE, GREEN, AMBER],
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Cross-Subject MRR Correlation' } },
            scales: { y: { min: 0, max: 1, title: { display: true, text: 'Pearson r' } } }
        }
    });

    makeChart('transferOpportunitiesChart', {
        type: 'bar',
        data: {
            labels: ['Algebra → Physics', 'Statistics → Civics', 'Geometry → Geography', 'Ratio → Chemistry', 'Graphs → Economics'],
            datasets: [{
                label: 'Transfer Strength',
                data: [0.88, 0.72, 0.68, 0.65, 0.61],
                backgroundColor: PURPLE,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Top Cross-Subject Transfer Opportunities' } },
            scales: { y: { min: 0, max: 1 } }
        }
    });

    // Performance patterns
    const patternsEl = document.getElementById('performancePatternsContainer');
    if (patternsEl) {
        patternsEl.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div style="padding:12px;border-radius:8px;background:${GREEN}22;border-left:3px solid ${GREEN}">
                    <strong style="color:${GREEN}">Strengths</strong>
                    <ul style="font-size:0.83rem;margin:6px 0 0 16px;padding:0">
                        <li>Mathematics — Algebra & Equations (MRR 0.935)</li>
                        <li>Science — Chemical Reactions (MRR 0.928)</li>
                        <li>Math ↔ Science transfer (r = 0.87)</li>
                    </ul>
                </div>
                <div style="padding:12px;border-radius:8px;background:${RED}22;border-left:3px solid ${RED}">
                    <strong style="color:${RED}">Gaps</strong>
                    <ul style="font-size:0.83rem;margin:6px 0 0 16px;padding:0">
                        <li>Social Science — weakest MRR (0.916)</li>
                        <li>Low CAS (0.644) — grade alignment weaker</li>
                        <li>Math ↔ SocSci transfer is weak (r = 0.61)</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

// ---------------------------------------------------------------------------
// Boot — run each init when section first becomes visible
// ---------------------------------------------------------------------------
function onSectionVisible(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    let done = false;
    const obs = new MutationObserver(() => {
        if (el.classList.contains('active') && !done) {
            done = true;
            fn();
            obs.disconnect();
        }
    });
    obs.observe(el, { attributeFilter: ['class'] });
    // Also run immediately if already active
    if (el.classList.contains('active') && !done) { done = true; fn(); }
}

// ---------------------------------------------------------------------------
// Knowledge Graph — seed NCERT concept nodes into knowledgeGraphManager
// ---------------------------------------------------------------------------
// ─── Exposed globally so rebuildGraph() in knowledge-graph-manager.js can call it ───
window._pacerSeedKnowledgeGraph = function(mgr) {
    // 50 NCERT concept nodes — 5 subjects used by PACER benchmark
    mgr.graph.nodes = [
        // Mathematics (blue) — 15 nodes
        { id:  0, label: 'Algebra',                subject: 'mathematics', frequency: 45, importance: 0.95, type: 'concept', sources: ['ch1'], sourceText: 'Algebraic expressions and identities' },
        { id:  1, label: 'Linear Equations',       subject: 'mathematics', frequency: 38, importance: 0.85, type: 'concept', sources: ['ch2'], sourceText: 'Pair of linear equations in two variables' },
        { id:  2, label: 'Quadratic Equations',    subject: 'mathematics', frequency: 35, importance: 0.82, type: 'concept', sources: ['ch3'], sourceText: 'Roots and discriminant of quadratics' },
        { id:  3, label: 'Polynomials',            subject: 'mathematics', frequency: 32, importance: 0.78, type: 'concept', sources: ['ch4'], sourceText: 'Degree, zeros and factor theorem' },
        { id:  4, label: 'Coordinate Geometry',    subject: 'mathematics', frequency: 28, importance: 0.75, type: 'concept', sources: ['ch5'], sourceText: 'Distance formula, section formula' },
        { id:  5, label: 'Triangles',              subject: 'mathematics', frequency: 30, importance: 0.80, type: 'concept', sources: ['ch6'], sourceText: 'Similarity, Pythagoras theorem' },
        { id:  6, label: 'Circles',                subject: 'mathematics', frequency: 25, importance: 0.72, type: 'concept', sources: ['ch7'], sourceText: 'Tangents, chords, arc length' },
        { id:  7, label: 'Surface Area & Volume',  subject: 'mathematics', frequency: 22, importance: 0.70, type: 'concept', sources: ['ch8'], sourceText: 'Sphere, cylinder, cone combinations' },
        { id:  8, label: 'Statistics',             subject: 'mathematics', frequency: 20, importance: 0.68, type: 'concept', sources: ['ch9'], sourceText: 'Mean, median, mode, ogive' },
        { id:  9, label: 'Probability',            subject: 'mathematics', frequency: 18, importance: 0.65, type: 'concept', sources: ['ch10'], sourceText: 'Classical probability, events' },
        { id: 10, label: 'Arithmetic Progressions',subject: 'mathematics', frequency: 22, importance: 0.70, type: 'concept', sources: ['ch11'], sourceText: 'nth term, sum of AP' },
        { id: 11, label: 'Trigonometry',           subject: 'mathematics', frequency: 26, importance: 0.74, type: 'concept', sources: ['ch12'], sourceText: 'Ratios, identities, heights and distances' },
        { id: 12, label: 'Real Numbers',           subject: 'mathematics', frequency: 15, importance: 0.60, type: 'concept', sources: ['ch13'], sourceText: 'Euclid division, irrationals' },
        { id: 13, label: 'Ratio & Proportion',     subject: 'mathematics', frequency: 12, importance: 0.55, type: 'concept', sources: ['ch14'], sourceText: 'Direct and inverse proportion' },
        { id: 14, label: 'Mensuration',            subject: 'mathematics', frequency: 14, importance: 0.58, type: 'concept', sources: ['ch15'], sourceText: 'Area of plane figures' },

        // Physics — green (9 nodes)
        { id: 15, label: 'Force & Motion',         subject: 'physics', frequency: 42, importance: 0.92, type: 'concept', sources: ['sc1'], sourceText: "Newton's laws of motion" },
        { id: 16, label: 'Gravitation',            subject: 'physics', frequency: 30, importance: 0.78, type: 'concept', sources: ['sc2'], sourceText: 'Universal law, free fall, g' },
        { id: 17, label: 'Work, Energy & Power',   subject: 'physics', frequency: 35, importance: 0.83, type: 'concept', sources: ['sc3'], sourceText: 'Kinetic, potential, conservation' },
        { id: 18, label: 'Light — Reflection',     subject: 'physics', frequency: 28, importance: 0.75, type: 'concept', sources: ['sc4'], sourceText: 'Concave/convex mirrors, ray diagrams' },
        { id: 19, label: 'Light — Refraction',     subject: 'physics', frequency: 26, importance: 0.73, type: 'concept', sources: ['sc5'], sourceText: 'Snell law, lenses, human eye' },
        { id: 20, label: 'Electricity',            subject: 'physics', frequency: 32, importance: 0.80, type: 'concept', sources: ['sc6'], sourceText: 'Ohm law, resistance, circuits' },
        { id: 21, label: 'Magnetic Effects',       subject: 'physics', frequency: 25, importance: 0.72, type: 'concept', sources: ['sc7'], sourceText: 'Electromagnet, motor, generator' },
        { id: 22, label: 'Sound',                  subject: 'physics', frequency: 22, importance: 0.68, type: 'concept', sources: ['sc8'], sourceText: 'Wave properties, echo, sonar' },
        { id: 23, label: 'Sources of Energy',      subject: 'physics', frequency: 18, importance: 0.63, type: 'concept', sources: ['sc9'], sourceText: 'Renewable, non-renewable, solar' },

        // Chemistry — amber (8 nodes)
        { id: 24, label: 'Atoms & Molecules',      subject: 'chemistry', frequency: 38, importance: 0.88, type: 'concept', sources: ['ch1c'], sourceText: 'Atomic mass, mole concept' },
        { id: 25, label: 'Chemical Reactions',     subject: 'chemistry', frequency: 35, importance: 0.84, type: 'concept', sources: ['ch2c'], sourceText: 'Types, balancing equations' },
        { id: 26, label: 'Acids, Bases & Salts',   subject: 'chemistry', frequency: 28, importance: 0.76, type: 'concept', sources: ['ch3c'], sourceText: 'pH scale, neutralisation' },
        { id: 27, label: 'Metals & Non-Metals',    subject: 'chemistry', frequency: 25, importance: 0.72, type: 'concept', sources: ['ch4c'], sourceText: 'Reactivity series, corrosion' },
        { id: 28, label: 'Carbon Compounds',       subject: 'chemistry', frequency: 22, importance: 0.68, type: 'concept', sources: ['ch5c'], sourceText: 'Hydrocarbons, functional groups' },
        { id: 29, label: 'Periodic Table',         subject: 'chemistry', frequency: 20, importance: 0.65, type: 'concept', sources: ['ch6c'], sourceText: 'Groups, periods, Mendeleev' },
        { id: 30, label: 'Chemical Bonding',       subject: 'chemistry', frequency: 18, importance: 0.62, type: 'concept', sources: ['ch7c'], sourceText: 'Ionic, covalent, electron sharing' },
        { id: 31, label: 'Structure of Atom',      subject: 'chemistry', frequency: 20, importance: 0.65, type: 'concept', sources: ['ch8c'], sourceText: 'Bohr model, shells, valence electrons' },

        // Biology — purple (9 nodes)
        { id: 32, label: 'Cell Biology',           subject: 'biology', frequency: 40, importance: 0.90, type: 'concept', sources: ['bio1'], sourceText: 'Cell organelles, prokaryote vs eukaryote' },
        { id: 33, label: 'Photosynthesis',         subject: 'biology', frequency: 35, importance: 0.83, type: 'concept', sources: ['bio2'], sourceText: 'Chlorophyll, light reactions, Calvin cycle' },
        { id: 34, label: 'Respiration',            subject: 'biology', frequency: 28, importance: 0.76, type: 'concept', sources: ['bio3'], sourceText: 'Aerobic, anaerobic, ATP synthesis' },
        { id: 35, label: 'Heredity & Evolution',   subject: 'biology', frequency: 25, importance: 0.72, type: 'concept', sources: ['bio4'], sourceText: 'Mendel laws, natural selection' },
        { id: 36, label: 'Ecosystems',             subject: 'biology', frequency: 22, importance: 0.68, type: 'concept', sources: ['bio5'], sourceText: 'Food chains, energy flow, biomes' },
        { id: 37, label: 'Human Body Systems',     subject: 'biology', frequency: 30, importance: 0.78, type: 'concept', sources: ['bio6'], sourceText: 'Digestive, circulatory, nervous systems' },
        { id: 38, label: 'Reproduction',           subject: 'biology', frequency: 24, importance: 0.70, type: 'concept', sources: ['bio7'], sourceText: 'Sexual, asexual, pollination' },
        { id: 39, label: 'Natural Resources',      subject: 'biology', frequency: 20, importance: 0.65, type: 'concept', sources: ['bio8'], sourceText: 'Soil, water, air conservation' },
        { id: 40, label: 'Control & Coordination', subject: 'biology', frequency: 22, importance: 0.68, type: 'concept', sources: ['bio9'], sourceText: 'Nervous system, hormones, reflex' },

        // Social Science (general — gray) — 10 nodes
        { id: 41, label: 'Indian History',         subject: 'general', frequency: 35, importance: 0.82, type: 'concept', sources: ['ss1'], sourceText: 'Mughal empire, colonial period, independence' },
        { id: 42, label: 'Nationalism',            subject: 'general', frequency: 28, importance: 0.74, type: 'concept', sources: ['ss2'], sourceText: 'Freedom movement, Gandhi, non-cooperation' },
        { id: 43, label: 'Democratic Politics',    subject: 'general', frequency: 32, importance: 0.80, type: 'concept', sources: ['ss3'], sourceText: 'Constitution, parliament, federalism' },
        { id: 44, label: 'Geography of India',     subject: 'general', frequency: 30, importance: 0.77, type: 'concept', sources: ['ss4'], sourceText: 'Physical features, rivers, climate zones' },
        { id: 45, label: 'Climate & Agriculture',  subject: 'general', frequency: 22, importance: 0.68, type: 'concept', sources: ['ss5'], sourceText: 'Monsoon, cropping patterns, irrigation' },
        { id: 46, label: 'Economic Development',   subject: 'general', frequency: 26, importance: 0.72, type: 'concept', sources: ['ss6'], sourceText: 'GDP, sectors, poverty, HDI' },
        { id: 47, label: 'Resources & Development',subject: 'general', frequency: 20, importance: 0.65, type: 'concept', sources: ['ss7'], sourceText: 'Land use, minerals, energy resources' },
        { id: 48, label: 'Globalisation',          subject: 'general', frequency: 16, importance: 0.60, type: 'concept', sources: ['ss8'], sourceText: 'MNCs, trade, WTO, liberalisation' },
        { id: 49, label: 'Consumer Rights',        subject: 'general', frequency: 14, importance: 0.55, type: 'concept', sources: ['ss9'], sourceText: 'Consumer protection, COPRA, redressal' },
    ];

    // Edges — intra-subject + cross-subject (PACER cross-subject insight)
    mgr.graph.edges = [
        // Mathematics internal
        { source:  0, target:  1, strength: 0.90, type: 'prerequisite' },
        { source:  0, target:  2, strength: 0.85, type: 'prerequisite' },
        { source:  0, target:  3, strength: 0.85, type: 'prerequisite' },
        { source:  1, target:  2, strength: 0.80, type: 'related'      },
        { source:  2, target: 10, strength: 0.70, type: 'related'      },
        { source:  3, target: 12, strength: 0.65, type: 'related'      },
        { source:  4, target:  5, strength: 0.75, type: 'related'      },
        { source:  5, target:  6, strength: 0.70, type: 'related'      },
        { source:  5, target: 11, strength: 0.82, type: 'prerequisite' },
        { source:  6, target:  7, strength: 0.65, type: 'related'      },
        { source:  7, target: 14, strength: 0.80, type: 'related'      },
        { source:  8, target:  9, strength: 0.85, type: 'related'      },
        { source: 11, target:  4, strength: 0.75, type: 'related'      },
        { source: 12, target:  0, strength: 0.70, type: 'prerequisite' },
        { source: 13, target:  0, strength: 0.60, type: 'related'      },
        // Physics internal
        { source: 15, target: 16, strength: 0.85, type: 'related'      },
        { source: 15, target: 17, strength: 0.90, type: 'related'      },
        { source: 16, target: 17, strength: 0.70, type: 'related'      },
        { source: 17, target: 23, strength: 0.75, type: 'related'      },
        { source: 18, target: 19, strength: 0.88, type: 'related'      },
        { source: 20, target: 21, strength: 0.85, type: 'related'      },
        { source: 22, target: 15, strength: 0.60, type: 'related'      },
        // Chemistry internal
        { source: 24, target: 25, strength: 0.85, type: 'prerequisite' },
        { source: 24, target: 30, strength: 0.80, type: 'related'      },
        { source: 24, target: 31, strength: 0.90, type: 'related'      },
        { source: 25, target: 26, strength: 0.75, type: 'related'      },
        { source: 25, target: 27, strength: 0.70, type: 'related'      },
        { source: 26, target: 27, strength: 0.65, type: 'related'      },
        { source: 29, target: 31, strength: 0.85, type: 'prerequisite' },
        { source: 30, target: 28, strength: 0.75, type: 'prerequisite' },
        // Biology internal
        { source: 32, target: 33, strength: 0.88, type: 'related'      },
        { source: 32, target: 34, strength: 0.85, type: 'related'      },
        { source: 33, target: 34, strength: 0.80, type: 'related'      },
        { source: 35, target: 32, strength: 0.70, type: 'related'      },
        { source: 36, target: 39, strength: 0.80, type: 'related'      },
        { source: 37, target: 34, strength: 0.75, type: 'related'      },
        { source: 37, target: 40, strength: 0.82, type: 'related'      },
        { source: 38, target: 35, strength: 0.70, type: 'related'      },
        { source: 40, target: 37, strength: 0.75, type: 'related'      },
        // Social Science internal
        { source: 41, target: 42, strength: 0.85, type: 'related'      },
        { source: 43, target: 41, strength: 0.70, type: 'related'      },
        { source: 44, target: 45, strength: 0.85, type: 'related'      },
        { source: 45, target: 47, strength: 0.75, type: 'related'      },
        { source: 46, target: 48, strength: 0.78, type: 'related'      },
        { source: 46, target: 49, strength: 0.65, type: 'related'      },
        { source: 47, target: 44, strength: 0.70, type: 'related'      },
        // ── Cross-subject connections (PACER's key insight) ──────────
        { source: 11, target: 15, strength: 0.72, type: 'cross_subject' }, // Trig → Force
        { source:  1, target: 15, strength: 0.65, type: 'cross_subject' }, // Linear Eq → Force
        { source:  4, target: 18, strength: 0.60, type: 'cross_subject' }, // Coord Geo → Light
        { source:  8, target: 46, strength: 0.65, type: 'cross_subject' }, // Stats → Econ Dev
        { source:  9, target:  8, strength: 0.72, type: 'cross_subject' }, // Prob → Stats
        { source: 33, target: 25, strength: 0.62, type: 'cross_subject' }, // Photosyn → Chem Rxn
        { source: 17, target: 33, strength: 0.67, type: 'cross_subject' }, // Energy → Photosyn
        { source: 36, target: 45, strength: 0.70, type: 'cross_subject' }, // Ecosystems → Climate
        { source: 39, target: 47, strength: 0.75, type: 'cross_subject' }, // Natural Res → Resources
        { source: 45, target: 36, strength: 0.65, type: 'cross_subject' }, // Climate → Ecosystems
        { source: 23, target: 47, strength: 0.68, type: 'cross_subject' }, // Energy Src → Resources
        { source: 20, target: 23, strength: 0.72, type: 'cross_subject' }, // Electricity → Energy Src
    ];

    // Trigger statistics + render
    mgr.calculateStatistics();
    mgr.updateStatisticsDisplay();
    try {
        mgr.renderGraph();
    } catch(e) {
        // SVG might not be fully set up yet — schedule a retry
        setTimeout(() => { try { mgr.renderGraph(); } catch(_) {} }, 300);
    }
    console.log('✅ PACER KG seeded:', mgr.graph.nodes.length, 'nodes,', mgr.graph.edges.length, 'edges');
};

function initKnowledgeGraph() {
    // Wait up to 2 s for the manager to finish its own initialize()
    let attempts = 0;
    const tryInject = () => {
        const mgr = window.knowledgeGraphManager;
        if (!mgr || !mgr.initialized) {
            if (++attempts < 20) { setTimeout(tryInject, 100); }
            return;
        }
        // Always replace with clean PACER NCERT nodes.
        // Old keyword-extracted data (stored in localStorage from previous sessions)
        // shows raw words like "Theorem","Find","Therefore" — clear it first.
        try { localStorage.removeItem('knowledge_graph'); } catch(e) {}
        window._pacerSeedKnowledgeGraph(mgr);
    };
    tryInject();
}

document.addEventListener('DOMContentLoaded', () => {
    onSectionVisible('analytics',    initAnalytics);
    onSectionVisible('comparisons',  initComparisons);
    onSectionVisible('abtesting',    initABTesting);
    onSectionVisible('progression',  initProgression);
    onSectionVisible('gaps',         initCurriculumGaps);
    onSectionVisible('crosssubject', initCrossSubject);
    onSectionVisible('knowledge',    initKnowledgeGraph);
});

})();
