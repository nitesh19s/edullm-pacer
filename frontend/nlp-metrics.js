/**
 * NLP & Information Retrieval Metrics
 *
 * Implements standard evaluation metrics for RAG research:
 * - Text Generation: BLEU (Papineni et al., 2002), ROUGE (Lin, 2004)
 * - Information Retrieval: MRR, NDCG, MAP, Precision@K, Recall@K
 *
 * All computations are pure JavaScript with no external dependencies.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class NLPMetrics {
    constructor() {
        this.tokenizer = new SimpleTokenizer();
    }

    // ==================== TEXT GENERATION METRICS ====================

    /**
     * BLEU score (Papineni et al., 2002)
     *
     * @param {string} reference - Reference text
     * @param {string} candidate - Generated text
     * @param {object} options - {maxN: 4, weights: [0.25, 0.25, 0.25, 0.25], smoothing: true}
     * @returns {object} {score, precisions, brevityPenalty, details}
     */
    bleu(reference, candidate, options = {}) {
        const { maxN = 4, weights = null, smoothing = true } = options;
        const w = weights || Array(maxN).fill(1 / maxN);

        const refTokens = this.tokenizer.tokenize(reference);
        const candTokens = this.tokenizer.tokenize(candidate);

        if (candTokens.length === 0) {
            return { score: 0, precisions: Array(maxN).fill(0), brevityPenalty: 0, candidateLength: 0, referenceLength: refTokens.length };
        }

        // Brevity penalty
        const bp = candTokens.length >= refTokens.length
            ? 1.0
            : Math.exp(1 - refTokens.length / candTokens.length);

        const precisions = [];
        for (let n = 1; n <= maxN; n++) {
            const refNgrams = this._getNgrams(refTokens, n);
            const candNgrams = this._getNgrams(candTokens, n);

            if (candNgrams.length === 0) {
                precisions.push(smoothing ? 1 / (candTokens.length + 1) : 0);
                continue;
            }

            const refCounts = this._countNgrams(refNgrams);
            const candCounts = this._countNgrams(candNgrams);

            let matches = 0;
            for (const [ngram, count] of candCounts) {
                matches += Math.min(count, refCounts.get(ngram) || 0);
            }

            let precision = matches / candNgrams.length;

            // Add-1 smoothing (Chen & Cherry, 2014) for n > 1
            if (smoothing && n > 1 && precision === 0) {
                precision = 1 / (candNgrams.length + 1);
            }

            precisions.push(precision);
        }

        // Geometric mean of precisions (log-space)
        const logAvg = precisions.reduce((sum, p, i) => {
            return sum + w[i] * Math.log(Math.max(p, 1e-100));
        }, 0);

        const score = bp * Math.exp(logAvg);

        return {
            score: Math.max(0, Math.min(1, score)),
            precisions,
            brevityPenalty: bp,
            candidateLength: candTokens.length,
            referenceLength: refTokens.length
        };
    }

    /**
     * BLEU score with multiple references
     *
     * @param {string[]} references - Array of reference texts
     * @param {string} candidate - Generated text
     * @param {object} options
     * @returns {object} Best BLEU score across references
     */
    bleuMultiRef(references, candidate, options = {}) {
        const scores = references.map(ref => this.bleu(ref, candidate, options));
        return scores.reduce((best, curr) => curr.score > best.score ? curr : best);
    }

    /**
     * ROUGE scores (Lin, 2004)
     *
     * @param {string} reference - Reference text
     * @param {string} candidate - Generated text
     * @returns {object} {rouge1, rouge2, rougeL} each with {precision, recall, f1}
     */
    rouge(reference, candidate) {
        const refTokens = this.tokenizer.tokenize(reference);
        const candTokens = this.tokenizer.tokenize(candidate);

        return {
            rouge1: this._rougeN(refTokens, candTokens, 1),
            rouge2: this._rougeN(refTokens, candTokens, 2),
            rougeL: this._rougeLCS(refTokens, candTokens)
        };
    }

    _rougeN(refTokens, candTokens, n) {
        if (refTokens.length === 0 && candTokens.length === 0) {
            return { precision: 1, recall: 1, f1: 1 };
        }
        if (refTokens.length === 0 || candTokens.length === 0) {
            return { precision: 0, recall: 0, f1: 0 };
        }

        const refNgrams = this._getNgrams(refTokens, n);
        const candNgrams = this._getNgrams(candTokens, n);

        if (refNgrams.length === 0 || candNgrams.length === 0) {
            return { precision: 0, recall: 0, f1: 0 };
        }

        const refCounts = this._countNgrams(refNgrams);
        const candCounts = this._countNgrams(candNgrams);

        let matches = 0;
        for (const [ngram, count] of candCounts) {
            matches += Math.min(count, refCounts.get(ngram) || 0);
        }

        const precision = matches / candNgrams.length;
        const recall = matches / refNgrams.length;
        const f1 = precision + recall > 0
            ? 2 * precision * recall / (precision + recall)
            : 0;

        return { precision, recall, f1 };
    }

    _rougeLCS(refTokens, candTokens) {
        if (refTokens.length === 0 && candTokens.length === 0) {
            return { precision: 1, recall: 1, f1: 1 };
        }
        if (refTokens.length === 0 || candTokens.length === 0) {
            return { precision: 0, recall: 0, f1: 0 };
        }

        const lcsLength = this._longestCommonSubsequence(refTokens, candTokens);
        const precision = lcsLength / candTokens.length;
        const recall = lcsLength / refTokens.length;
        const f1 = precision + recall > 0
            ? 2 * precision * recall / (precision + recall)
            : 0;

        return { precision, recall, f1 };
    }

    // ==================== INFORMATION RETRIEVAL METRICS ====================

    /**
     * Mean Reciprocal Rank (MRR)
     *
     * @param {array} rankings - Array of query result arrays [{relevant: bool}, ...]
     * @returns {object} {mrr, perQuery}
     */
    mrr(rankings) {
        const perQuery = [];
        let sumRR = 0;

        for (const queryResults of rankings) {
            let rr = 0;
            for (let i = 0; i < queryResults.length; i++) {
                if (queryResults[i].relevant) {
                    rr = 1 / (i + 1);
                    break;
                }
            }
            perQuery.push(rr);
            sumRR += rr;
        }

        return {
            mrr: rankings.length > 0 ? sumRR / rankings.length : 0,
            perQuery
        };
    }

    /**
     * Normalized Discounted Cumulative Gain (NDCG)
     *
     * @param {array} relevanceScores - Relevance scores ordered by rank
     * @param {number} k - Cutoff position (null = all)
     * @returns {object} {dcg, idcg, ndcg}
     */
    ndcg(relevanceScores, k = null) {
        const cutoff = k || relevanceScores.length;
        const scores = relevanceScores.slice(0, cutoff);

        // DCG
        const dcg = scores.reduce((sum, rel, i) =>
            sum + (Math.pow(2, rel) - 1) / Math.log2(i + 2), 0);

        // Ideal DCG (sorted descending)
        const idealScores = [...relevanceScores].sort((a, b) => b - a).slice(0, cutoff);
        const idcg = idealScores.reduce((sum, rel, i) =>
            sum + (Math.pow(2, rel) - 1) / Math.log2(i + 2), 0);

        return {
            dcg,
            idcg,
            ndcg: idcg > 0 ? dcg / idcg : 0
        };
    }

    /**
     * Mean Average Precision (MAP)
     *
     * @param {array} rankings - Array of query result arrays [{relevant: bool}, ...]
     * @returns {object} {map, perQuery}
     */
    map(rankings) {
        const perQuery = [];
        let sumAP = 0;

        for (const queryResults of rankings) {
            let relevantSoFar = 0;
            let sumPrecision = 0;
            const totalRelevant = queryResults.filter(r => r.relevant).length;

            for (let i = 0; i < queryResults.length; i++) {
                if (queryResults[i].relevant) {
                    relevantSoFar++;
                    sumPrecision += relevantSoFar / (i + 1);
                }
            }

            const ap = totalRelevant > 0 ? sumPrecision / totalRelevant : 0;
            perQuery.push(ap);
            sumAP += ap;
        }

        return {
            map: rankings.length > 0 ? sumAP / rankings.length : 0,
            perQuery
        };
    }

    /**
     * Precision at K
     *
     * @param {array} results - [{relevant: bool}, ...]
     * @param {number} k - Cutoff
     * @returns {number}
     */
    precisionAtK(results, k) {
        const topK = results.slice(0, k);
        return topK.length > 0 ? topK.filter(r => r.relevant).length / k : 0;
    }

    /**
     * Recall at K
     *
     * @param {array} results - [{relevant: bool}, ...]
     * @param {number} k - Cutoff
     * @param {number} totalRelevant - Total relevant documents
     * @returns {number}
     */
    recallAtK(results, k, totalRelevant) {
        if (totalRelevant === 0) return 0;
        const topK = results.slice(0, k);
        return topK.filter(r => r.relevant).length / totalRelevant;
    }

    /**
     * Hit Rate at K (proportion of queries with at least one relevant result in top-K)
     *
     * @param {array} rankings - Array of query result arrays
     * @param {number} k - Cutoff
     * @returns {number}
     */
    hitRateAtK(rankings, k) {
        if (rankings.length === 0) return 0;
        const hits = rankings.filter(results =>
            results.slice(0, k).some(r => r.relevant)
        ).length;
        return hits / rankings.length;
    }

    /**
     * Compute all metrics at once for a batch of query results
     *
     * @param {array} rankings - Array of query result arrays
     * @param {object} options - {k: 10}
     * @returns {object} All IR metrics
     */
    computeAllIR(rankings, options = {}) {
        const k = options.k || 10;

        return {
            mrr: this.mrr(rankings).mrr,
            map: this.map(rankings).map,
            hitRateAtK: this.hitRateAtK(rankings, k),
            k
        };
    }

    /**
     * Compute all text generation metrics for a batch
     *
     * @param {array} pairs - [{reference, candidate}, ...]
     * @returns {object} Aggregated metrics
     */
    computeAllGeneration(pairs) {
        const bleuScores = [];
        const rouge1Scores = [];
        const rouge2Scores = [];
        const rougeLScores = [];

        for (const { reference, candidate } of pairs) {
            const b = this.bleu(reference, candidate);
            bleuScores.push(b.score);

            const r = this.rouge(reference, candidate);
            rouge1Scores.push(r.rouge1.f1);
            rouge2Scores.push(r.rouge2.f1);
            rougeLScores.push(r.rougeL.f1);
        }

        const avg = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        return {
            bleu: avg(bleuScores),
            rouge1: avg(rouge1Scores),
            rouge2: avg(rouge2Scores),
            rougeL: avg(rougeLScores),
            n: pairs.length
        };
    }

    // ==================== HELPER METHODS ====================

    _getNgrams(tokens, n) {
        const ngrams = [];
        for (let i = 0; i <= tokens.length - n; i++) {
            ngrams.push(tokens.slice(i, i + n).join(' '));
        }
        return ngrams;
    }

    _countNgrams(ngrams) {
        const counts = new Map();
        for (const ng of ngrams) {
            counts.set(ng, (counts.get(ng) || 0) + 1);
        }
        return counts;
    }

    _longestCommonSubsequence(a, b) {
        const m = a.length;
        const n = b.length;

        // Space-optimized: only need two rows
        let prev = new Array(n + 1).fill(0);
        let curr = new Array(n + 1).fill(0);

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                curr[j] = a[i - 1] === b[j - 1]
                    ? prev[j - 1] + 1
                    : Math.max(prev[j], curr[j - 1]);
            }
            [prev, curr] = [curr, prev];
            curr.fill(0);
        }

        return prev[n];
    }
}

/**
 * Simple whitespace + punctuation tokenizer
 */
class SimpleTokenizer {
    tokenize(text) {
        if (!text || typeof text !== 'string') return [];
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 0);
    }
}

window.nlpMetrics = new NLPMetrics();
window.SimpleTokenizer = SimpleTokenizer;
console.log('✅ NLP Metrics module loaded');
