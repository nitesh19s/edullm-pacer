/**
 * CAS — Curriculum Alignment Score
 *
 * CAS = α·GradeMatch + β·PrereqCoverage + γ·BloomAlignment
 * Default weights: α=0.45, β=0.40, γ=0.15  (from PACER paper calibration)
 *
 * Score range: 0–1 (normalised). Multiply by 5 for the 1–5 paper scale.
 */

'use strict';

// ── NCERT grade bands (used for GradeMatch) ───────────────────────────────────

const GRADE_BANDS = [
    { name: 'Elementary',   min: 1,  max: 5  },
    { name: 'Middle',       min: 6,  max: 8  },
    { name: 'Secondary',    min: 9,  max: 10 },
    { name: 'Senior',       min: 11, max: 12 }
];

function gradeBand(grade) {
    if (!grade || typeof grade !== 'number') return null;
    return GRADE_BANDS.findIndex(b => grade >= b.min && grade <= b.max);
}

/**
 * GradeMatch — 1.0 if same band, 0.6 if adjacent band, 0.2 if 2+ bands away.
 * When either grade is unknown, returns 0.7 (neutral — don't punish missing metadata).
 */
function gradeMatch(queryGrade, chunkGrade) {
    if (!queryGrade || !chunkGrade) return 0.7;
    const qBand = gradeBand(queryGrade);
    const cBand = gradeBand(chunkGrade);
    if (qBand === null || cBand === null) return 0.7;
    const diff = Math.abs(qBand - cBand);
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.6;
    return 0.2;
}

// ── Bloom taxonomy ────────────────────────────────────────────────────────────

const BLOOM_LEVELS = {
    remember:   0,
    recall:     0,
    define:     0,
    list:       0,
    identify:   0,
    understand: 1,
    explain:    1,
    describe:   1,
    summarize:  1,
    summarise:  1,
    classify:   1,
    apply:      2,
    solve:      2,
    calculate:  2,
    use:        2,
    demonstrate:2,
    analyse:    3,
    analyze:    3,
    compare:    3,
    differentiate:3,
    distinguish:3,
    examine:    3,
    evaluate:   4,
    justify:    4,
    assess:     4,
    critique:   4,
    judge:      4,
    create:     5,
    design:     5,
    construct:  5,
    formulate:  5,
    propose:    5
};

/** Infer Bloom level (0–5) from text via keyword scanning. Default = 1 (Understand). */
function inferBloomLevel(text) {
    if (!text) return 1;
    const lower = text.toLowerCase();
    let bestLevel = 1;
    for (const [kw, level] of Object.entries(BLOOM_LEVELS)) {
        const re = new RegExp(`\\b${kw}\\b`);
        if (re.test(lower) && level > bestLevel) bestLevel = level;
    }
    return bestLevel;
}

/**
 * BloomAlignment — 1.0 if exact match, 0.7 if ±1 level, 0.4 if ±2, 0.0 if ≥3 levels apart.
 */
function bloomAlignment(queryLevel, chunkLevel) {
    const diff = Math.abs(queryLevel - chunkLevel);
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.7;
    if (diff === 2) return 0.4;
    return 0.0;
}

// ── Prerequisite Coverage ─────────────────────────────────────────────────────

const STOP_WORDS = new Set([
    'a','an','the','is','are','was','were','be','been','being',
    'have','has','had','do','does','did','will','would','should',
    'could','may','might','shall','can','need','dare','ought',
    'in','on','at','to','for','of','with','by','from','as',
    'it','its','this','that','these','those','i','you','he','she','we','they',
    'what','which','who','how','why','when','where',
    'and','or','but','if','then','so','yet','nor','not',
    'explain','describe','define','find','give','state','write','show'
]);

function tokenize(text) {
    if (!text) return new Set();
    return new Set(
        text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    );
}

/**
 * PrereqCoverage — Jaccard-like overlap between query keywords and chunk keywords.
 * Weighted: query terms that appear in the chunk are "covered prerequisites".
 */
function prereqCoverage(queryText, chunkText) {
    const qTokens = tokenize(queryText);
    const cTokens = tokenize(chunkText);
    if (qTokens.size === 0) return 0.7; // nothing to compare — neutral

    let covered = 0;
    for (const t of qTokens) {
        if (cTokens.has(t)) covered++;
    }
    return covered / qTokens.size;
}

// ── Main CAS scorer ───────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS = { alpha: 0.45, beta: 0.40, gamma: 0.15 };

/**
 * Score a single retrieved chunk against the query context.
 *
 * @param {object} query
 *   @param {string}  query.text        - raw query text
 *   @param {number}  [query.grade]     - 1–12, from request context
 *   @param {number}  [query.bloomLevel]- 0–5, explicit override; inferred if omitted
 *
 * @param {object} chunk
 *   @param {string}  chunk.text        - chunk text
 *   @param {object}  [chunk.metadata]  - metadata.grade, metadata.bloom_level optional
 *
 * @param {object} [weights]  - override default α/β/γ
 *
 * @returns {{ cas, gradeMatch, prereqCoverage, bloomAlignment, bloomLevelQuery, bloomLevelChunk }}
 */
function scoreChunk(query, chunk, weights = DEFAULT_WEIGHTS) {
    const { alpha, beta, gamma } = weights;

    // GradeMatch
    const chunkGrade = chunk.metadata?.grade || chunk.metadata?.Grade || null;
    const gm = gradeMatch(query.grade || null, chunkGrade ? Number(chunkGrade) : null);

    // PrereqCoverage
    const pc = prereqCoverage(query.text, chunk.text);

    // BloomAlignment
    const bloomQ = (query.bloomLevel !== undefined && query.bloomLevel !== null)
        ? query.bloomLevel
        : inferBloomLevel(query.text);
    const bloomC = (chunk.metadata?.bloom_level !== undefined)
        ? Number(chunk.metadata.bloom_level)
        : inferBloomLevel(chunk.text);
    const ba = bloomAlignment(bloomQ, bloomC);

    const cas = alpha * gm + beta * pc + gamma * ba;

    return {
        cas:              parseFloat(cas.toFixed(4)),
        gradeMatch:       parseFloat(gm.toFixed(4)),
        prereqCoverage:   parseFloat(pc.toFixed(4)),
        bloomAlignment:   parseFloat(ba.toFixed(4)),
        bloomLevelQuery:  bloomQ,
        bloomLevelChunk:  bloomC
    };
}

/**
 * Rerank an array of retrieved docs by CAS score (descending).
 *
 * @param {object[]} docs         - array from searchVectorStore
 * @param {object}   queryContext - { text, grade?, bloomLevel? }
 * @param {object}   [weights]
 * @returns {object[]}  same docs with .cas and sub-scores merged in, sorted by CAS desc
 */
function rerankByCAS(docs, queryContext, weights = DEFAULT_WEIGHTS) {
    return docs
        .map(doc => {
            const scores = scoreChunk(queryContext, doc, weights);
            return { ...doc, ...scores };
        })
        .sort((a, b) => b.cas - a.cas);
}

module.exports = { scoreChunk, rerankByCAS, inferBloomLevel, DEFAULT_WEIGHTS };
