/**
 * Experiments API Routes
 * Backed by SQLite via services/db.js
 */

const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const Joi     = require('joi');
const { APIError }   = require('../middleware/errorHandler');
const { experiments } = require('../services/db');

// ── validation ────────────────────────────────────────────────────────────────

const experimentSchema = Joi.object({
    name:        Joi.string().required().min(3).max(100),
    description: Joi.string().max(500),
    configuration: Joi.object({
        provider:    Joi.string().valid('openai', 'anthropic', 'google', 'ollama').required(),
        model:       Joi.string().required(),
        temperature: Joi.number().min(0).max(2),
        maxTokens:   Joi.number().min(1).max(32000),
        parameters:  Joi.object()
    }).required(),
    metadata: Joi.object()
});

const runSchema = Joi.object({
    testCases:     Joi.array().items(Joi.object()).min(1).required(),
    configuration: Joi.object()
});

// ── routes ────────────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;
    const total = experiments.count(status || null);
    const data  = experiments.all({ status, limit: parseInt(limit), offset: parseInt(offset) });

    res.json({
        success: true,
        data,
        pagination: {
            total,
            limit:   parseInt(limit),
            offset:  parseInt(offset),
            hasMore: parseInt(offset) + parseInt(limit) < total
        }
    });
});

router.get('/:id', (req, res, next) => {
    const exp = experiments.get(req.params.id);
    if (!exp) return next(new APIError('Experiment not found', 404));
    res.json({ success: true, data: exp });
});

router.post('/', (req, res, next) => {
    const { error, value } = experimentSchema.validate(req.body);
    if (error) return next(new APIError('Validation failed', 400, error.details));

    const now = new Date().toISOString();
    const exp = experiments.create({
        id:          uuidv4(),
        name:        value.name,
        description: value.description,
        status:      'pending',
        config:      value.configuration,
        metrics:     {},
        createdAt:   now,
        updatedAt:   now
    });

    res.status(201).json({ success: true, data: exp, message: 'Experiment created successfully' });
});

router.put('/:id', (req, res, next) => {
    const exp = experiments.get(req.params.id);
    if (!exp) return next(new APIError('Experiment not found', 404));

    const { error, value } = experimentSchema.validate(req.body);
    if (error) return next(new APIError('Validation failed', 400, error.details));

    const updated = experiments.update(req.params.id, {
        name:        value.name,
        description: value.description || null,
        config:      JSON.stringify(value.configuration)
    });

    res.json({ success: true, data: updated, message: 'Experiment updated successfully' });
});

router.delete('/:id', (req, res, next) => {
    if (!experiments.get(req.params.id))
        return next(new APIError('Experiment not found', 404));

    experiments.delete(req.params.id);
    res.json({ success: true, message: 'Experiment deleted successfully' });
});

router.post('/:id/runs', (req, res, next) => {
    const exp = experiments.get(req.params.id);
    if (!exp) return next(new APIError('Experiment not found', 404));

    const { error, value } = runSchema.validate(req.body);
    if (error) return next(new APIError('Validation failed', 400, error.details));

    const run = experiments.addRun({
        id:           uuidv4(),
        experimentId: req.params.id,
        status:       'running',
        metrics:      {},
        startedAt:    new Date().toISOString()
    });

    experiments.update(req.params.id, { status: 'running' });

    res.status(201).json({ success: true, data: run, message: 'Experiment run started' });
});

router.get('/:id/runs', (req, res, next) => {
    if (!experiments.get(req.params.id))
        return next(new APIError('Experiment not found', 404));

    const runs = experiments.runsByExperiment(req.params.id);
    res.json({ success: true, data: runs });
});

/**
 * GET /experiments/ablation/latest
 * Returns the most recent PACER ablation experiment with full metrics.
 */
router.get('/ablation/latest', (req, res) => {
    const all = experiments.all({ limit: 50, offset: 0 });
    const ablation = all
        .filter(e => e.name && e.name.startsWith('PACER Ablation'))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    if (!ablation) {
        return res.json({
            success: true,
            data: null,
            message: 'No ablation experiment found. Run: node backend/scripts/run-ablation.js'
        });
    }

    const runs = experiments.runsByExperiment(ablation.id);
    res.json({ success: true, data: { experiment: ablation, runs } });
});

router.get('/:id/stats', (req, res, next) => {
    const exp = experiments.get(req.params.id);
    if (!exp) return next(new APIError('Experiment not found', 404));

    const runs = experiments.runsByExperiment(req.params.id);

    const completed = runs.filter(r => r.status === 'completed');
    const avg = key => completed.length > 0
        ? parseFloat((completed.reduce((s, r) => s + (r.metrics?.[key] || 0), 0) / completed.length).toFixed(4))
        : 0;

    res.json({
        success: true,
        data: {
            experiment: exp,
            statistics: {
                totalRuns:       runs.length,
                completedRuns:   completed.length,
                failedRuns:      runs.filter(r => r.status === 'failed').length,
                runningRuns:     runs.filter(r => r.status === 'running').length,
                avgPrecision:    avg('precision'),
                avgRecall:       avg('recall'),
                avgResponseTime: avg('responseTime')
            }
        }
    });
});

module.exports = router;
