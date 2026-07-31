/**
 * Vector Database API Routes
 * Backed by SQLite via services/db.js
 */

const express = require('express');
const router  = express.Router();
const Joi     = require('joi');
const { v4: uuidv4 }   = require('uuid');
const { APIError }     = require('../middleware/errorHandler');
const { collections, documents } = require('../services/db');
const { classifyChunk, detectBoundaries, splitIntoPedagogicalChunks } = require('../services/boundaryDetector');

// ── validation ────────────────────────────────────────────────────────────────

const collectionSchema = Joi.object({
    name:        Joi.string().required().min(3).max(100),
    description: Joi.string().max(500),
    metadata:    Joi.object()
});

const documentSchema = Joi.object({
    text:      Joi.string().required(),
    embedding: Joi.array().items(Joi.number()),
    metadata:  Joi.object()
});

// ── helper ────────────────────────────────────────────────────────────────────

function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot   += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── routes ────────────────────────────────────────────────────────────────────

router.get('/collections', (req, res) => {
    res.json({ success: true, data: collections.all(), total: collections.all().length });
});

router.post('/collections', (req, res, next) => {
    const { error, value } = collectionSchema.validate(req.body);
    if (error) return next(new APIError('Validation failed', 400, error.details));

    const now = new Date().toISOString();
    const col = collections.create({
        id:          uuidv4(),
        name:        value.name,
        description: value.description,
        metadata:    value.metadata || {},
        createdAt:   now,
        updatedAt:   now
    });

    res.status(201).json({ success: true, data: col, message: 'Collection created successfully' });
});

router.delete('/collections/:id', (req, res, next) => {
    const col = collections.get(req.params.id);
    if (!col) return next(new APIError('Collection not found', 404));

    documents.deleteByCollection(req.params.id);
    collections.delete(req.params.id);

    res.json({ success: true, message: 'Collection deleted successfully' });
});

router.post('/collections/:id/documents', (req, res, next) => {
    const col = collections.get(req.params.id);
    if (!col) return next(new APIError('Collection not found', 404));

    const { documents: docs } = req.body;
    if (!Array.isArray(docs) || docs.length === 0)
        return next(new APIError('documents array is required', 400));

    const now = new Date().toISOString();
    const added = [];

    for (const doc of docs) {
        const { error, value } = documentSchema.validate(doc);
        if (error) return next(new APIError('Document validation failed', 400, error.details));

        const newDoc = {
            id:           uuidv4(),
            collectionId: req.params.id,
            text:         value.text,
            embedding:    value.embedding || null,
            metadata:     value.metadata || {},
            createdAt:    now
        };
        documents.add(newDoc);
        added.push(newDoc);
    }

    collections.incrementDocCount(req.params.id, added.length);

    res.status(201).json({
        success: true,
        data:    { added: added.length, documents: added },
        message: `${added.length} document(s) added successfully`
    });
});

router.get('/collections/:id/documents', (req, res, next) => {
    const col = collections.get(req.params.id);
    if (!col) return next(new APIError('Collection not found', 404));

    const limit  = parseInt(req.query.limit  || 50);
    const offset = parseInt(req.query.offset || 0);
    const docs   = documents.byCollection(req.params.id, limit, offset);

    res.json({ success: true, data: docs, total: docs.length, collection: col.name });
});

router.post('/collections/:id/query', (req, res, next) => {
    const col = collections.get(req.params.id);
    if (!col) return next(new APIError('Collection not found', 404));

    const { query, embedding, topK = 5 } = req.body;
    if (!query && !embedding)
        return next(new APIError('Either query or embedding is required', 400));

    const allDocs = documents.allWithEmbeddings(req.params.id);
    let results;

    if (embedding && embedding.length > 0) {
        results = allDocs
            .map(doc => ({ doc, similarity: cosineSimilarity(embedding, doc.embedding) }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK)
            .map(r => ({ ...r.doc, similarity: parseFloat(r.similarity.toFixed(4)) }));
    } else {
        results = allDocs
            .filter(doc => doc.text.toLowerCase().includes(query.toLowerCase()))
            .slice(0, topK);
    }

    res.json({
        success: true,
        data:    { query, results, totalResults: results.length, collection: col.name }
    });
});

/**
 * POST /vector/detect-boundaries
 * Analyse text: split into pedagogical chunks + classify each unit type.
 */
const boundarySchema = Joi.object({
    text:        Joi.string().required().min(20).max(50000),
    minChunkLen: Joi.number().integer().min(50).max(500).default(100),
    maxChunkLen: Joi.number().integer().min(200).max(10000).default(2000)
});

router.post('/detect-boundaries', (req, res, next) => {
    const { error, value } = boundarySchema.validate(req.body);
    if (error) return next(new APIError('Validation failed', 400, error.details));

    const { text, minChunkLen, maxChunkLen } = value;
    const boundaries    = detectBoundaries(text);
    const { chunks }    = splitIntoPedagogicalChunks(text, { minChunkLen, maxChunkLen });
    const unitTypeCounts = {};
    for (const c of chunks) {
        unitTypeCounts[c.unitType] = (unitTypeCounts[c.unitType] || 0) + 1;
    }

    res.json({
        success: true,
        data: {
            totalChunks:   chunks.length,
            boundaries,
            unitTypeCounts,
            chunks: chunks.map(c => ({
                text:       c.text.slice(0, 200) + (c.text.length > 200 ? '…' : ''),
                unitType:   c.unitType,
                confidence: c.confidence,
                startPos:   c.startPos,
                length:     c.text.length
            }))
        }
    });
});

/**
 * POST /vector/classify-chunk
 * Classify a single chunk into an instructional unit type.
 */
router.post('/classify-chunk', (req, res, next) => {
    const { error, value } = Joi.object({ text: Joi.string().required().min(10).max(10000) }).validate(req.body);
    if (error) return next(new APIError('Validation failed', 400, error.details));

    const result = classifyChunk(value.text);
    res.json({ success: true, data: result });
});

router.get('/stats', (req, res) => {
    const cols = collections.all();
    res.json({
        success: true,
        data: {
            totalCollections: cols.length,
            totalDocuments:   cols.reduce((s, c) => s + (c.documentCount || 0), 0),
            collections:      cols.map(c => ({ id: c.id, name: c.name, documentCount: c.documentCount }))
        }
    });
});

module.exports = router;
