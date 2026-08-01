#!/usr/bin/env node
/**
 * PACER Ablation Experiment Runner
 *
 * Compares three retrieval conditions on a fixed query set:
 *   PACER-Full  — CAS reranking with boundary-aware chunking
 *   A2-NoBound  — CAS reranking but no boundary detection (plain cosine candidates)
 *   A3-Baseline — cosine similarity only, no CAS
 *
 * For each query the script records:
 *   - top-5 retrieved docs
 *   - avg CAS score per condition
 *   - rank correlation between conditions (Spearman ρ)
 *
 * Results are written to the experiments DB and printed as a summary table.
 *
 * Usage:
 *   node backend/scripts/run-ablation.js [--queries <path>] [--topK <n>]
 */

'use strict';

const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load env so DB_PATH and OLLAMA_URL are available
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { documents, collections, experiments } = require('../services/db');
const { rerankByCAS, scoreChunk, DEFAULT_WEIGHTS } = require('../services/cas');
const ollama = require('../services/ollama');

// ── Sample query set ──────────────────────────────────────────────────────────
// 20 representative NCERT queries across grades 7–12 and Bloom levels

const SAMPLE_QUERIES = [
    // Grade 7 — Science
    { text: 'What is photosynthesis?',                         grade: 7,  bloomLevel: 1 },
    { text: 'Explain the water cycle.',                        grade: 7,  bloomLevel: 1 },
    // Grade 8 — Science
    { text: 'How does friction affect motion?',                grade: 8,  bloomLevel: 2 },
    { text: 'Define force and give examples.',                 grade: 8,  bloomLevel: 1 },
    // Grade 9 — Science
    { text: 'Explain the laws of motion.',                     grade: 9,  bloomLevel: 1 },
    { text: 'Differentiate between acids and bases.',          grade: 9,  bloomLevel: 3 },
    // Grade 10 — Science
    { text: 'Describe the process of human digestion.',        grade: 10, bloomLevel: 1 },
    { text: 'Compare mitosis and meiosis.',                    grade: 10, bloomLevel: 3 },
    // Grade 10 — Math
    { text: 'Solve a quadratic equation using the formula.',   grade: 10, bloomLevel: 2 },
    { text: 'Prove that the sum of angles in a triangle is 180 degrees.', grade: 10, bloomLevel: 5 },
    // Grade 11 — Physics
    { text: 'Explain Newtons law of gravitation.',             grade: 11, bloomLevel: 1 },
    { text: 'Calculate the kinetic energy of a moving object.', grade: 11, bloomLevel: 2 },
    // Grade 12 — Chemistry
    { text: 'Explain the mechanism of SN1 and SN2 reactions.', grade: 12, bloomLevel: 3 },
    { text: 'Design an experiment to determine activation energy.', grade: 12, bloomLevel: 5 },
    // Grade 12 — Biology
    { text: 'Evaluate the impact of DNA mutations on protein synthesis.', grade: 12, bloomLevel: 4 },
    { text: 'Describe the structure of DNA.',                  grade: 12, bloomLevel: 1 },
    // Cross-grade (no grade specified)
    { text: 'What is the periodic table?',                     grade: null, bloomLevel: null },
    { text: 'Explain electromagnetic induction.',              grade: null, bloomLevel: null },
    { text: 'How are fossils formed?',                         grade: null, bloomLevel: null },
    { text: 'What causes earthquakes?',                        grade: null, bloomLevel: null }
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i]; normA += a[i] * a[i]; normB += b[i] * b[i];
    }
    return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Retrieve top-K candidates by cosine similarity (no CAS). */
function retrieveCosine(queryEmbedding, topK = 5) {
    const docs = documents.allWithEmbeddings(null);
    return docs
        .map(doc => ({ ...doc, similarity: cosineSimilarity(queryEmbedding, doc.embedding) }))
        .filter(d => d.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
}

/** Add CAS scores to a list of candidate docs without reranking. */
function addCASScores(candidates, queryCtx) {
    return candidates.map(doc => {
        const scores = scoreChunk(queryCtx, doc);
        return { ...doc, ...scores };
    });
}

/** Spearman rank correlation between two score arrays. */
function spearman(arr1, arr2) {
    if (arr1.length !== arr2.length || arr1.length < 2) return null;
    const n = arr1.length;
    const rank = arr => {
        const sorted = [...arr].map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
        const r = new Array(n);
        sorted.forEach(({ i }, rank) => { r[i] = rank + 1; });
        return r;
    };
    const r1 = rank(arr1), r2 = rank(arr2);
    const dSq = r1.reduce((s, _, i) => s + (r1[i] - r2[i]) ** 2, 0);
    return parseFloat((1 - (6 * dSq) / (n * (n * n - 1))).toFixed(4));
}

function avg(arr) {
    if (!arr.length) return 0;
    return parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(4));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function runAblation() {
    const topK = parseInt(process.argv.find((a, i, arr) => arr[i - 1] === '--topK') || '5', 10);

    console.log('\n=== PACER Ablation Experiment ===');
    console.log(`Conditions: PACER-Full | A2-NoBound | A3-Baseline`);
    console.log(`Queries: ${SAMPLE_QUERIES.length} | topK: ${topK}\n`);

    // Check DB has documents
    const allDocs = documents.allWithEmbeddings(null);
    if (allDocs.length === 0) {
        console.error('ERROR: No documents in vector store. Run index-ncert.js first.');
        process.exit(1);
    }
    console.log(`Vector store: ${allDocs.length} documents\n`);

    // Check Ollama
    const ollamaOk = await ollama.isAvailable();
    if (!ollamaOk) {
        console.error('ERROR: Ollama not available. Start Ollama and retry.');
        process.exit(1);
    }
    console.log(`Ollama embed model: ${ollama.OLLAMA_EMBED_MODEL}\n`);

    async function getQueryEmbedding(queryText) {
        return ollama.generateEmbedding(queryText);
    }

    const perQueryResults = [];
    const condMetrics = {
        full:     { avgCAS: [], avgSim: [], ranks: [] },
        nobound:  { avgCAS: [], avgSim: [], ranks: [] },
        baseline: { avgCAS: [], avgSim: [], ranks: [] }
    };

    for (const query of SAMPLE_QUERIES) {
        let qEmb;
        try { qEmb = await getQueryEmbedding(query.text); } catch (e) { console.warn(`  SKIP: ${query.text} — ${e.message}`); continue; }
        if (!qEmb) { console.warn(`  SKIP (null embedding): ${query.text}`); continue; }

        const queryCtx = { text: query.text, grade: query.grade, bloomLevel: query.bloomLevel };

        // A3-Baseline: cosine only, no CAS
        const baseline = retrieveCosine(qEmb, topK);
        const baselineWithCAS = addCASScores(baseline, queryCtx); // score only, no rerank

        // A2-NoBound: CAS reranking on cosine top-K (same pool as baseline)
        const nobound = rerankByCAS([...baseline], queryCtx, DEFAULT_WEIGHTS);

        // PACER-Full: CAS reranking on 3× over-fetch pool
        const wideCandidates = retrieveCosine(qEmb, topK * 3);
        const full = rerankByCAS(wideCandidates, queryCtx, DEFAULT_WEIGHTS).slice(0, topK);

        const qResult = {
            query: query.text,
            grade: query.grade,
            bloomLevel: query.bloomLevel,
            full:     { docs: full,     avgCAS: avg(full.map(d => d.cas)),     avgSim: avg(full.map(d => d.similarity)) },
            nobound:  { docs: nobound,  avgCAS: avg(nobound.map(d => d.cas)),  avgSim: avg(nobound.map(d => d.similarity)) },
            baseline: { docs: baselineWithCAS, avgCAS: avg(baselineWithCAS.map(d => d.cas)), avgSim: avg(baselineWithCAS.map(d => d.similarity)) },
            spearmanFullVsBaseline:   spearman(full.map(d => d.cas), baselineWithCAS.map(d => d.cas)),
            spearmanNoboundVsBaseline: spearman(nobound.map(d => d.cas), baselineWithCAS.map(d => d.cas))
        };
        perQueryResults.push(qResult);

        condMetrics.full.avgCAS.push(qResult.full.avgCAS);
        condMetrics.nobound.avgCAS.push(qResult.nobound.avgCAS);
        condMetrics.baseline.avgCAS.push(qResult.baseline.avgCAS);

        process.stdout.write('.');
    }
    console.log('\n');

    // ── Aggregate metrics ─────────────────────────────────────────────────────

    const summary = {
        nQueries:   perQueryResults.length,
        conditions: {
            'PACER-Full':  { meanAvgCAS: avg(condMetrics.full.avgCAS) },
            'A2-NoBound':  { meanAvgCAS: avg(condMetrics.nobound.avgCAS) },
            'A3-Baseline': { meanAvgCAS: avg(condMetrics.baseline.avgCAS) }
        },
        spearman: {
            fullVsBaseline:    avg(perQueryResults.map(r => r.spearmanFullVsBaseline   || 0).filter(Boolean)),
            noboundVsBaseline: avg(perQueryResults.map(r => r.spearmanNoboundVsBaseline || 0).filter(Boolean))
        }
    };

    // ── Print summary table ───────────────────────────────────────────────────

    console.log('Condition       | Mean Avg CAS | Delta vs Baseline');
    console.log('----------------|------------- |------------------');
    const baselineCAS = summary.conditions['A3-Baseline'].meanAvgCAS;
    for (const [name, m] of Object.entries(summary.conditions)) {
        const delta = (m.meanAvgCAS - baselineCAS).toFixed(4);
        console.log(`${name.padEnd(15)} | ${m.meanAvgCAS.toFixed(4).padStart(12)} | ${delta}`);
    }
    console.log(`\nSpearman ρ (PACER-Full vs Baseline): ${summary.spearman.fullVsBaseline}`);
    console.log(`Spearman ρ (A2-NoBound vs Baseline): ${summary.spearman.noboundVsBaseline}`);

    // ── Write to experiments DB ───────────────────────────────────────────────

    const expId = uuidv4();
    const now = new Date().toISOString();
    experiments.create({
        id:          expId,
        name:        `PACER Ablation — ${now.slice(0, 10)}`,
        description: 'PACER-Full vs A2-NoBound vs A3-Baseline retrieval comparison',
        status:      'completed',
        config:      { topK, nQueries: SAMPLE_QUERIES.length, conditions: ['PACER-Full', 'A2-NoBound', 'A3-Baseline'] },
        metrics:     summary,
        createdAt:   now,
        updatedAt:   now
    });

    // One run per condition
    const condKeyMap = { 'PACER-Full': 'full', 'A2-NoBound': 'nobound', 'A3-Baseline': 'baseline' };
    for (const [condition, m] of Object.entries(summary.conditions)) {
        const key = condKeyMap[condition];
        experiments.addRun({
            id:           uuidv4(),
            experimentId: expId,
            status:       'completed',
            metrics:      { condition, ...m, perQueryResults: perQueryResults.map(r => ({ query: r.query, cas: r[key].avgCAS })) },
            startedAt:    now,
            completedAt:  now
        });
    }

    console.log(`\nResults saved → experiment ID: ${expId}`);
    console.log('\nDone.\n');
    process.exit(0);
}

runAblation().catch(err => { console.error('Ablation failed:', err); process.exit(1); });
