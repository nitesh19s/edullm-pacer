/**
 * RAG (Retrieval-Augmented Generation) API Routes
 *
 * Pipeline:
 *  1. Embed user query via Ollama (nomic-embed-text)
 *  2. Cosine-similarity search against SQLite vector store
 *  3. Build context-augmented prompt
 *  4. Generate response via Ollama (llama3.2)
 *  5. Persist session + messages to SQLite
 */

const express = require('express');
const router  = express.Router();
const Joi     = require('joi');
const { v4: uuidv4 }   = require('uuid');
const { APIError }     = require('../middleware/errorHandler');
const ollama           = require('../services/ollama');
const { rerankByCAS }  = require('../services/cas');
const { collections, documents, sessions, messages } = require('../services/db');

// ── validation ────────────────────────────────────────────────────────────────

const chatSchema = Joi.object({
    sessionId: Joi.string(),
    message:   Joi.string().required().min(1).max(2000),
    context: Joi.object({
        subject:    Joi.string(),
        grade:      Joi.number().integer().min(1).max(12),
        topic:      Joi.string(),
        bloomLevel: Joi.number().integer().min(0).max(5)
    }),
    retrievalConfig: Joi.object({
        topK:         Joi.number().integer().min(1).max(20).default(5),
        collectionId: Joi.string(),
        casWeights: Joi.object({
            alpha: Joi.number().min(0).max(1),
            beta:  Joi.number().min(0).max(1),
            gamma: Joi.number().min(0).max(1)
        }),
        disableCAS: Joi.boolean().default(false)
    })
});

const retrieveSchema = Joi.object({
    query:        Joi.string().required().min(1).max(2000),
    collectionId: Joi.string(),
    topK:         Joi.number().integer().min(1).max(20).default(5),
    grade:        Joi.number().integer().min(1).max(12),
    bloomLevel:   Joi.number().integer().min(0).max(5),
    casWeights: Joi.object({
        alpha: Joi.number().min(0).max(1),
        beta:  Joi.number().min(0).max(1),
        gamma: Joi.number().min(0).max(1)
    }),
    disableCAS:   Joi.boolean().default(false)
});

// ── helpers ───────────────────────────────────────────────────────────────────

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

/**
 * Returns top-k docs by cosine similarity.
 * fetchK lets callers over-fetch so CAS reranking has a wider candidate pool.
 */
function searchVectorStore(queryEmbedding, { collectionId, topK = 5, fetchK } = {}) {
    const limit = fetchK || topK;
    const docs = documents.allWithEmbeddings(collectionId || null);
    return docs
        .map(doc => ({ doc, similarity: cosineSimilarity(queryEmbedding, doc.embedding) }))
        .filter(r => r.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(r => {
            const col = collections.get(r.doc.collectionId);
            return {
                id:         r.doc.id,
                text:       r.doc.text,
                similarity: parseFloat(r.similarity.toFixed(4)),
                metadata:   r.doc.metadata || {},
                collection: col?.name || 'unknown'
            };
        });
}

function buildPrompt(message, retrievedDocs, context = {}) {
    const subjectLine = context.subject
        ? `Subject: ${context.subject}${context.grade ? ` | Grade: ${context.grade}` : ''}${context.topic ? ` | Topic: ${context.topic}` : ''}`
        : '';

    const contextBlock = retrievedDocs.length
        ? 'Relevant context from NCERT knowledge base:\n' +
          retrievedDocs.map((d, i) => `[${i + 1}] ${d.text.slice(0, 600)}`).join('\n\n') +
          '\n\nUsing the above context where relevant, answer the following question:'
        : 'Answer the following question based on NCERT curriculum:';

    return [
        'You are an expert NCERT teacher for Indian students.',
        subjectLine,
        '',
        contextBlock,
        '',
        `Question: ${message}`,
        '',
        'Provide a clear, accurate, curriculum-aligned answer in student-friendly language.'
    ].filter(Boolean).join('\n');
}

// ── routes ────────────────────────────────────────────────────────────────────

/**
 * POST /rag/chat
 */
router.post('/chat', async (req, res, next) => {
    const { error, value } = chatSchema.validate(req.body);
    if (error) return next(new APIError('Validation failed', 400, error.details));

    let { sessionId, message, context, retrievalConfig = {} } = value;
    const { topK = 5, collectionId, casWeights, disableCAS = false } = retrievalConfig;
    const startTime = Date.now();

    // Session — create if new or not found
    if (!sessionId) sessionId = uuidv4();
    if (!sessions.get(sessionId)) {
        sessions.create({ id: sessionId, context, createdAt: new Date().toISOString() });
    }

    // Store user message
    messages.add({
        id: uuidv4(), sessionId, role: 'user', content: message,
        timestamp: new Date().toISOString()
    });

    // ── RAG pipeline ──────────────────────────────────────────────────────────

    let retrievedDocs = [];
    let embeddingError = null;

    try {
        const queryEmbedding = await ollama.generateEmbedding(message);
        // Over-fetch 3× so CAS reranking has a wider candidate pool
        const fetchK = disableCAS ? topK : topK * 3;
        const candidates = searchVectorStore(queryEmbedding, { collectionId, topK, fetchK });

        if (!disableCAS && candidates.length > 0) {
            const queryCtx = {
                text:       message,
                grade:      context?.grade     || null,
                bloomLevel: context?.bloomLevel || null
            };
            retrievedDocs = rerankByCAS(candidates, queryCtx, casWeights).slice(0, topK);
        } else {
            retrievedDocs = candidates;
        }
    } catch (err) {
        embeddingError = err.message;
        console.warn(`[RAG] Embedding failed, answering without context: ${err.message}`);
    }

    const prompt = buildPrompt(message, retrievedDocs, context || {});

    let generatedText, modelUsed, tokensUsed;
    try {
        const result = await ollama.generate(prompt);
        generatedText = result.response;
        modelUsed     = result.model;
        tokensUsed    = result.evalCount || 0;
    } catch (err) {
        return next(new APIError(`Ollama generation failed: ${err.message}`, 502));
    }

    const responseTime = Date.now() - startTime;

    const assistantMsg = {
        id:               uuidv4(),
        sessionId,
        role:             'assistant',
        content:          generatedText,
        retrievedContext: retrievedDocs,
        metadata: {
            model:         modelUsed,
            tokensUsed,
            responseTime,
            contextDocs:   retrievedDocs.length,
            casEnabled:    !disableCAS,
            avgCAS: retrievedDocs.length > 0 && retrievedDocs[0].cas !== undefined
                ? parseFloat((retrievedDocs.reduce((s, d) => s + d.cas, 0) / retrievedDocs.length).toFixed(4))
                : null,
            ...(embeddingError && { embeddingError })
        },
        timestamp: new Date().toISOString()
    };

    messages.add(assistantMsg);
    sessions.touch(sessionId, 2);

    res.json({
        success: true,
        data: { sessionId, message: assistantMsg, retrievedContext: retrievedDocs }
    });
});

/**
 * GET /rag/sessions/:sessionId
 */
router.get('/sessions/:sessionId', (req, res, next) => {
    const session = sessions.get(req.params.sessionId);
    if (!session) return next(new APIError('Session not found', 404));

    res.json({
        success: true,
        data: { session, history: messages.bySession(req.params.sessionId) }
    });
});

/**
 * GET /rag/sessions
 */
router.get('/sessions', (req, res) => {
    const all = sessions.all();
    res.json({ success: true, data: all, total: all.length });
});

/**
 * DELETE /rag/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', (req, res, next) => {
    if (!sessions.get(req.params.sessionId))
        return next(new APIError('Session not found', 404));
    sessions.delete(req.params.sessionId);
    res.json({ success: true, message: 'Session deleted successfully' });
});

/**
 * POST /rag/retrieve
 */
router.post('/retrieve', async (req, res, next) => {
    const { error, value } = retrieveSchema.validate(req.body);
    if (error) return next(new APIError('Validation failed', 400, error.details));

    const { query, collectionId, topK, grade, bloomLevel, casWeights, disableCAS = false } = value;

    let results = [];
    try {
        const embedding = await ollama.generateEmbedding(query);
        const fetchK = disableCAS ? topK : topK * 3;
        const candidates = searchVectorStore(embedding, { collectionId, topK, fetchK });

        if (!disableCAS && candidates.length > 0) {
            const queryCtx = { text: query, grade: grade || null, bloomLevel: bloomLevel || null };
            results = rerankByCAS(candidates, queryCtx, casWeights).slice(0, topK);
        } else {
            results = candidates;
        }
    } catch (err) {
        return next(new APIError(`Embedding failed: ${err.message}`, 502));
    }

    const avgCAS = results.length > 0 && results[0].cas !== undefined
        ? parseFloat((results.reduce((s, d) => s + d.cas, 0) / results.length).toFixed(4))
        : null;

    res.json({
        success: true,
        data: { query, results, totalResults: results.length, casEnabled: !disableCAS, avgCAS }
    });
});

/**
 * GET /rag/stats
 */
router.get('/stats', (req, res) => {
    const totalMessages = messages.countTotal();
    const allSessions   = sessions.all();

    res.json({
        success: true,
        data: {
            totalSessions:             allSessions.length,
            totalMessages,
            averageMessagesPerSession: allSessions.length > 0
                ? parseFloat((totalMessages / allSessions.length).toFixed(1)) : 0,
            activeSessions: allSessions.filter(s => {
                const last = new Date(s.lastActivity || s.createdAt);
                return (Date.now() - last.getTime()) < 24 * 60 * 60 * 1000;
            }).length,
            vectorStore: {
                collections: collections.all().length,
                documents:   collections.all().reduce((s, c) => s + (c.documentCount || 0), 0)
            }
        }
    });
});

/**
 * GET /rag/status
 */
router.get('/status', async (req, res) => {
    const available = await ollama.isAvailable();
    const models    = available ? await ollama.listModels() : [];

    res.json({
        success: true,
        data: {
            ollama: {
                available,
                url:        process.env.OLLAMA_URL || 'http://localhost:11434',
                model:      ollama.OLLAMA_MODEL,
                embedModel: ollama.OLLAMA_EMBED_MODEL,
                models
            }
        }
    });
});

module.exports = router;
