/**
 * Analytics API Routes
 * Reports and insights drawn from real SQLite data.
 */

const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { APIError }   = require('../middleware/errorHandler');
const { experiments, sessions, messages, collections, documents } = require('../services/db');

// Reports stored in SQLite — reuse experiments table's metadata for now;
// a dedicated reports table is added in a later migration.
// For this phase, reports are generated on-the-fly from real data.

// ── helpers ───────────────────────────────────────────────────────────────────

function buildSummaryReport() {
    const allExps   = experiments.all({ limit: 1000 });
    const allRuns   = allExps.flatMap(e => experiments.runsByExperiment(e.id));
    const completed = allRuns.filter(r => r.status === 'completed');

    const totalSessions = sessions.all().length;
    const totalMessages = messages.countTotal();
    const totalDocs     = collections.all().reduce((s, c) => s + (c.documentCount || 0), 0);

    const avgPrecision    = completed.length
        ? completed.reduce((s, r) => s + (r.metrics?.precision || 0), 0) / completed.length : 0;
    const avgRecall       = completed.length
        ? completed.reduce((s, r) => s + (r.metrics?.recall || 0), 0) / completed.length : 0;
    const avgResponseTime = completed.length
        ? completed.reduce((s, r) => s + (r.metrics?.responseTime || 0), 0) / completed.length : 0;

    const insights = [];

    if (allExps.length === 0) {
        insights.push({ type: 'info', message: 'No experiments yet. Create one to start tracking.' });
    } else {
        const failRate = allRuns.length ? allRuns.filter(r => r.status === 'failed').length / allRuns.length : 0;
        if (failRate > 0.2) insights.push({ type: 'warning', message: `High failure rate: ${(failRate * 100).toFixed(1)}% of runs failed.` });
        if (avgPrecision > 0.8) insights.push({ type: 'positive', message: `Strong precision: ${(avgPrecision * 100).toFixed(1)}% average across completed runs.` });
        if (avgResponseTime > 5000) insights.push({ type: 'warning', message: `Slow responses: average ${(avgResponseTime / 1000).toFixed(1)}s — consider optimising retrieval.` });
        if (totalDocs > 0) insights.push({ type: 'info', message: `${totalDocs} documents indexed across ${collections.all().length} collections.` });
    }

    return {
        type:        'summary',
        generatedAt: new Date().toISOString(),
        metrics: {
            experiments:     allExps.length,
            runs:            allRuns.length,
            completedRuns:   completed.length,
            avgPrecision:    parseFloat(avgPrecision.toFixed(4)),
            avgRecall:       parseFloat(avgRecall.toFixed(4)),
            avgResponseTime: Math.round(avgResponseTime),
            chatSessions:    totalSessions,
            chatMessages:    totalMessages,
            indexedDocuments: totalDocs
        },
        insights
    };
}

// ── routes ────────────────────────────────────────────────────────────────────

/**
 * GET /analytics/dashboard
 * Real-time summary from all stored data.
 */
router.get('/dashboard', (req, res) => {
    const report = buildSummaryReport();
    res.json({ success: true, data: report });
});

/**
 * POST /analytics/reports/generate
 * Generate and return a report (summary or detailed).
 */
router.post('/reports/generate', (req, res) => {
    const { type = 'summary' } = req.body;
    const report = { id: uuidv4(), ...buildSummaryReport(), type };
    res.json({ success: true, data: report });
});

/**
 * GET /analytics/reports
 * On-the-fly report — no DB storage needed for now.
 */
router.get('/reports', (req, res) => {
    const report = buildSummaryReport();
    res.json({ success: true, data: [report], total: 1 });
});

/**
 * GET /analytics/reports/:id
 * Returns current live report (id is ignored, always fresh).
 */
router.get('/reports/:id', (req, res) => {
    res.json({ success: true, data: buildSummaryReport() });
});

/**
 * GET /analytics/experiments/summary
 * Per-experiment metrics breakdown.
 */
router.get('/experiments/summary', (req, res) => {
    const allExps = experiments.all({ limit: 1000 });

    const summary = allExps.map(exp => {
        const runs      = experiments.runsByExperiment(exp.id);
        const completed = runs.filter(r => r.status === 'completed');
        return {
            id:              exp.id,
            name:            exp.name,
            status:          exp.status,
            totalRuns:       runs.length,
            completedRuns:   completed.length,
            failedRuns:      runs.filter(r => r.status === 'failed').length,
            avgPrecision:    completed.length
                ? parseFloat((completed.reduce((s, r) => s + (r.metrics?.precision || 0), 0) / completed.length).toFixed(4))
                : null,
            avgRecall:       completed.length
                ? parseFloat((completed.reduce((s, r) => s + (r.metrics?.recall || 0), 0) / completed.length).toFixed(4))
                : null,
            createdAt:       exp.createdAt
        };
    });

    res.json({ success: true, data: summary, total: summary.length });
});

/**
 * POST /analytics/baseline/create
 * Snapshot current metrics as a baseline.
 */
router.post('/baseline/create', (req, res) => {
    const { name = 'Baseline' } = req.body;
    const report = buildSummaryReport();
    const baseline = {
        id:        uuidv4(),
        name,
        metrics:   report.metrics,
        createdAt: new Date().toISOString()
    };
    // Return baseline — caller stores it; comparison done client-side or via /compare
    res.json({ success: true, data: baseline });
});

/**
 * POST /analytics/baseline/compare
 * Compare a stored baseline snapshot against current metrics.
 */
router.post('/baseline/compare', (req, res, next) => {
    const { baseline } = req.body;
    if (!baseline?.metrics) return next(new APIError('baseline.metrics required', 400));

    const current = buildSummaryReport().metrics;
    const base    = baseline.metrics;

    const compare = key => {
        const b = base[key] || 0;
        const c = current[key] || 0;
        const delta = b !== 0 ? ((c - b) / b) * 100 : null;
        return { baseline: b, current: c, deltaPercent: delta !== null ? parseFloat(delta.toFixed(2)) : null };
    };

    res.json({
        success: true,
        data: {
            baselineName: baseline.name || 'Baseline',
            baselineDate: baseline.createdAt,
            comparedAt:   new Date().toISOString(),
            comparison: {
                avgPrecision:    compare('avgPrecision'),
                avgRecall:       compare('avgRecall'),
                avgResponseTime: compare('avgResponseTime'),
                completedRuns:   compare('completedRuns'),
                chatSessions:    compare('chatSessions'),
                indexedDocuments: compare('indexedDocuments')
            }
        }
    });
});

/**
 * GET /analytics/rag/usage
 * RAG-specific usage breakdown.
 */
router.get('/rag/usage', (req, res) => {
    const allSessions = sessions.all();
    const totalMsg    = messages.countTotal();
    const cols        = collections.all();

    res.json({
        success: true,
        data: {
            sessions: {
                total:  allSessions.length,
                active: allSessions.filter(s => {
                    const last = new Date(s.lastActivity || s.createdAt);
                    return (Date.now() - last.getTime()) < 24 * 60 * 60 * 1000;
                }).length
            },
            messages: {
                total:    totalMsg,
                avgPerSession: allSessions.length > 0
                    ? parseFloat((totalMsg / allSessions.length).toFixed(1)) : 0
            },
            vectorStore: {
                collections: cols.length,
                documents:   cols.reduce((s, c) => s + (c.documentCount || 0), 0),
                byCollection: cols.map(c => ({ name: c.name, documents: c.documentCount }))
            }
        }
    });
});

module.exports = router;
