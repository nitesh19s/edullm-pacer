'use strict';

/**
 * Pedagogical Boundary Detector
 *
 * Classifies text chunks into 6 instructional unit types defined in the PACER paper:
 *  1. learning_objective   — "students will learn / be able to"
 *  2. definition_example   — "X is defined as ... for example ..."
 *  3. worked_example       — step-by-step solved problem
 *  4. qa_pair              — explicit Q&A format
 *  5. theorem_proof        — theorem / proof / hence proved
 *  6. summary              — "in summary / to summarize / key points"
 *
 * Also detects boundary signals between units (e.g., topic heading changes,
 * blank lines between sections) to support chunk splitting.
 */

// ── Unit-type patterns ────────────────────────────────────────────────────────

const UNIT_PATTERNS = [
    {
        type: 'learning_objective',
        weight: 1.5,
        patterns: [
            /\bstudents?\s+(will|should|are expected to|can)\b/i,
            /\bby the end\b/i,
            /\blearning\s+objective[s]?\b/i,
            /\bafter\s+(completing|studying|reading)\s+this\b/i,
            /\byou\s+will\s+(be able to|learn|understand)\b/i,
            /\baim[s]?\s*[:\-]/i,
            /\bobjective[s]?\s*[:\-]/i
        ]
    },
    {
        type: 'definition_example',
        weight: 1.2,
        patterns: [
            /\bis\s+(defined|known)\s+as\b/i,
            /\bthe\s+definition\s+of\b/i,
            /\bwhat\s+is\s+[a-z]/i,
            /\bfor\s+example[,:]?\b/i,
            /\bfor\s+instance[,:]?\b/i,
            /\be\.g\.[,:]?\b/i,
            /\bi\.e\.\b/i,
            /\bsuch\s+as\b/i,
            /\bmeans?\s+that\b/i
        ]
    },
    {
        type: 'worked_example',
        weight: 1.4,
        patterns: [
            /\bstep\s*[-–]?\s*[1-9]\b/i,
            /\bsolution\s*[:\-]/i,
            /\bsolving\b.*\bstep\b/i,
            /\bgiven[:\s]/i,
            /\bfind[:\s]/i,
            /\btherefore[,\s]/i,
            /\bhence[,\s]/i,
            /\b∴\b/,
            /\bworked\s+example\b/i,
            /\bexample\s+[0-9]+\s*[:\-]/i,
            /\b(calculate|compute|determine|evaluate)\b.*[:]/i
        ]
    },
    {
        type: 'qa_pair',
        weight: 1.3,
        patterns: [
            /^(question|q)\s*[0-9]*\s*[:\-\.]/im,
            /^(answer|a)\s*[:\-\.]/im,
            /\?\s*\n+\s*(answer|a)[:\-]/im,
            /\bfill\s+in\s+the\s+blank[s]?\b/i,
            /\bmatch\s+the\s+following\b/i,
            /\bmultiple\s+choice\b/i,
            /\btrue\s+or\s+false\b/i
        ]
    },
    {
        type: 'theorem_proof',
        weight: 1.5,
        patterns: [
            /\btheorem\b/i,
            /\bproof\s*[:\-]/i,
            /\bto\s+prove[:\s]/i,
            /\bhence\s+proved\b/i,
            /\bq\.e\.d\./i,
            /\bcorollary\b/i,
            /\blemma\b/i,
            /\bproposition\b/i,
            /\bprove\s+that\b/i,
            /\bby\s+(induction|contradiction|contrapositive)\b/i
        ]
    },
    {
        type: 'summary',
        weight: 1.2,
        patterns: [
            /\bin\s+summary\b/i,
            /\bto\s+summarize\b/i,
            /\bto\s+summarise\b/i,
            /\bkey\s+(points?|takeaways?|concepts?)\b/i,
            /\bimportant\s+points?\b/i,
            /\brecap\b/i,
            /\bwhat\s+we\s+(learned|learnt)\b/i,
            /\bconclusion\b/i,
            /\blet['']s\s+(review|revisit|summarize)\b/i
        ]
    }
];

// ── Boundary signal patterns ───────────────────────────────────────────────────

const BOUNDARY_PATTERNS = [
    /^#{1,3}\s+/m,                          // Markdown headings
    /^[A-Z][A-Z\s]{3,30}$/m,               // ALL-CAPS section header
    /^\d+\.\d*\s+[A-Z]/m,                  // Numbered section (1.2 Title)
    /\n{3,}/,                               // 3+ blank lines
    /^[\*\-]{3,}\s*$/m,                     // Horizontal rule (--- ***)
    /Exercise\s+\d+/i,
    /Chapter\s+\d+/i,
    /Section\s+\d+/i,
    /Activity\s+\d+/i,
    /Example\s+\d+/i
];

// ── Classifier ────────────────────────────────────────────────────────────────

/**
 * Classify a text chunk into an instructional unit type.
 *
 * @param {string} text
 * @returns {{ type: string, confidence: number, signals: string[] }}
 */
function classifyChunk(text) {
    if (!text || text.trim().length === 0) {
        return { type: 'unknown', confidence: 0, signals: [] };
    }

    const scores = {};
    const signals = {};

    for (const unit of UNIT_PATTERNS) {
        let hits = 0;
        const matched = [];
        for (const pat of unit.patterns) {
            if (pat.test(text)) {
                hits++;
                matched.push(pat.source.slice(0, 40));
            }
        }
        if (hits > 0) {
            scores[unit.type] = hits * unit.weight;
            signals[unit.type] = matched;
        }
    }

    if (Object.keys(scores).length === 0) {
        return { type: 'definition_example', confidence: 0.3, signals: ['fallback'] };
    }

    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    const confidence = parseFloat((best[1] / total).toFixed(3));

    return { type: best[0], confidence, signals: signals[best[0]] };
}

/**
 * Detect boundary positions within a longer text.
 *
 * @param {string} text
 * @returns {{ hasBoundary: boolean, boundaryCount: number, positions: number[] }}
 */
function detectBoundaries(text) {
    const positions = [];
    for (const pat of BOUNDARY_PATTERNS) {
        const re = new RegExp(pat.source, 'gm');
        let m;
        while ((m = re.exec(text)) !== null) {
            positions.push(m.index);
        }
    }
    const unique = [...new Set(positions)].sort((a, b) => a - b);
    return { hasBoundary: unique.length > 0, boundaryCount: unique.length, positions: unique };
}

/**
 * Split a long text into pedagogical chunks at detected boundaries.
 * Uses boundary signals as split points, with a minimum chunk size of 100 chars.
 *
 * @param {string} text
 * @param {object} [opts]
 * @param {number} [opts.minChunkLen=100]
 * @param {number} [opts.maxChunkLen=2000]
 * @returns {{ chunks: Array<{ text: string, unitType: string, confidence: number, startPos: number }> }}
 */
function splitIntoPedagogicalChunks(text, { minChunkLen = 100, maxChunkLen = 2000 } = {}) {
    // Split on double newlines + heading signals
    const rawChunks = text
        .split(/\n{2,}/)
        .flatMap(block => {
            // Further split if a heading is embedded mid-block
            return block.split(/(?=^#{1,3}\s)/m);
        })
        .map(s => s.trim())
        .filter(s => s.length >= minChunkLen);

    // Merge very short chunks with the next one
    const merged = [];
    let buffer = '';
    for (const chunk of rawChunks) {
        buffer = buffer ? buffer + '\n\n' + chunk : chunk;
        if (buffer.length >= minChunkLen) {
            if (buffer.length > maxChunkLen) {
                // hard-split at maxChunkLen word boundary
                let pos = maxChunkLen;
                while (pos > 0 && buffer[pos] !== ' ') pos--;
                merged.push(buffer.slice(0, pos || maxChunkLen));
                buffer = buffer.slice(pos || maxChunkLen).trim();
            } else {
                merged.push(buffer);
                buffer = '';
            }
        }
    }
    if (buffer.length >= minChunkLen) merged.push(buffer);

    let offset = 0;
    const chunks = merged.map(chunkText => {
        const startPos = text.indexOf(chunkText, offset);
        if (startPos !== -1) offset = startPos + chunkText.length;
        const { type, confidence, signals } = classifyChunk(chunkText);
        return { text: chunkText, unitType: type, confidence, signals, startPos: startPos >= 0 ? startPos : 0 };
    });

    return { chunks };
}

module.exports = { classifyChunk, detectBoundaries, splitIntoPedagogicalChunks };
