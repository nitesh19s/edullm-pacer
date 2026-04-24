/**
 * RAGAS Evaluation Framework
 *
 * Implements the four core RAGAS metrics (Es et al., 2023):
 * - Faithfulness: Is the answer grounded in the provided contexts?
 * - Answer Relevancy: Is the answer relevant to the question?
 * - Context Precision: Are relevant contexts ranked higher?
 * - Context Recall: Are all ground truth statements covered by contexts?
 *
 * Uses LLM-as-judge pattern with the configured LLM provider.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class RAGASEvaluator {
    constructor(options = {}) {
        this.llmService = null;
        this.nlpMetrics = null;
        this.initialized = false;
        this.evaluationCache = new Map();
        this.config = {
            maxRetries: options.maxRetries || 2,
            temperature: options.temperature || 0.0, // Deterministic for evaluation
            batchSize: options.batchSize || 5
        };
    }

    /**
     * Initialize with available LLM service
     */
    async initialize() {
        this.llmService = window.ragOrchestrator?.llmService
            || window.enhancedLLMService
            || window.localModelManager;

        this.nlpMetrics = window.nlpMetrics;
        if (!this.nlpMetrics) {
            console.warn('RAGASEvaluator: NLPMetrics not loaded, token overlap will be used for similarity');
        }

        this.initialized = true;
        console.log('✅ RAGAS Evaluator initialized');
    }

    /**
     * Full RAGAS evaluation of a single sample
     *
     * @param {object} sample - {question, answer, contexts: string[], groundTruth}
     * @returns {object} All four RAGAS scores + overall
     */
    async evaluate(sample) {
        if (!this.initialized) await this.initialize();

        const { question, answer, contexts, groundTruth } = sample;

        if (!answer || !contexts || contexts.length === 0) {
            return this._emptyScores('Missing answer or contexts');
        }

        const results = {};

        // Run metrics (some can be parallelized)
        try {
            const [faithfulness, answerRelevancy] = await Promise.all([
                this.faithfulness({ answer, contexts }),
                this.answerRelevancy({ question, answer })
            ]);
            results.faithfulness = faithfulness;
            results.answerRelevancy = answerRelevancy;
        } catch (e) {
            console.error('RAGAS faithfulness/relevancy error:', e);
            results.faithfulness = null;
            results.answerRelevancy = null;
        }

        try {
            if (groundTruth) {
                const [contextPrecision, contextRecall] = await Promise.all([
                    this.contextPrecision({ question, contexts, groundTruth }),
                    this.contextRecall({ contexts, groundTruth })
                ]);
                results.contextPrecision = contextPrecision;
                results.contextRecall = contextRecall;
            } else {
                results.contextPrecision = null;
                results.contextRecall = null;
            }
        } catch (e) {
            console.error('RAGAS context metrics error:', e);
            results.contextPrecision = null;
            results.contextRecall = null;
        }

        // Overall score (average of available metrics)
        const available = [results.faithfulness, results.answerRelevancy,
                          results.contextPrecision, results.contextRecall]
                          .filter(v => v !== null);
        results.overall = available.length > 0
            ? available.reduce((a, b) => a + b, 0) / available.length
            : null;

        results.timestamp = new Date().toISOString();
        results.metricsComputed = available.length;

        return results;
    }

    /**
     * Faithfulness: Is the answer grounded in the provided contexts?
     * Decomposes answer into claims, checks each against contexts.
     */
    async faithfulness({ answer, contexts }) {
        // Step 1: Extract claims from answer
        const claimsPrompt = `Given the following answer, extract all distinct factual claims as a numbered list. Only include factual statements, not opinions or hedging language.

Answer: ${answer}

List each distinct factual claim, one per line, numbered:`;

        const claimsResponse = await this._llmCall(claimsPrompt);
        const claims = this._parseNumberedList(claimsResponse);

        if (claims.length === 0) return 1.0; // No claims to verify

        // Step 2: Verify each claim against contexts
        const contextText = contexts.join('\n\n---\n\n');
        let supportedCount = 0;

        for (const claim of claims) {
            const verifyPrompt = `Given the context below, determine if the following claim is supported by the context.

Context:
${contextText}

Claim: ${claim}

Answer with exactly one word: "supported" or "unsupported".`;

            const verdict = await this._llmCall(verifyPrompt);
            const lower = verdict.toLowerCase().trim();
            if (lower.startsWith('supported') && !lower.startsWith('unsupported')) {
                supportedCount++;
            }
        }

        return claims.length > 0 ? supportedCount / claims.length : 1.0;
    }

    /**
     * Answer Relevancy: Is the answer relevant to the question?
     * Generates questions from the answer, measures similarity to original.
     */
    async answerRelevancy({ question, answer }) {
        const numQuestions = 3;

        const genPrompt = `Given the following answer, generate exactly ${numQuestions} different questions that this answer could be answering. Output only the questions, one per line, with no numbering or prefixes.

Answer: ${answer}

Questions:`;

        const genResponse = await this._llmCall(genPrompt);
        const generatedQuestions = this._parseLines(genResponse).slice(0, numQuestions);

        if (generatedQuestions.length === 0) return 0;

        // Compute similarity between original question and generated questions
        let totalSimilarity = 0;
        for (const gq of generatedQuestions) {
            totalSimilarity += this._tokenOverlapSimilarity(question, gq);
        }

        return totalSimilarity / generatedQuestions.length;
    }

    /**
     * Context Precision: Are relevant contexts ranked higher?
     * Checks if contexts useful for answering are at top of ranking.
     */
    async contextPrecision({ question, contexts, groundTruth }) {
        if (!groundTruth || contexts.length === 0) return 0;

        const relevances = [];
        for (const ctx of contexts) {
            const prompt = `Given the question and the expected answer, is the following context relevant and useful for producing the answer?

Question: ${question}
Expected Answer: ${groundTruth}
Context: ${ctx}

Answer with exactly one word: "relevant" or "irrelevant".`;

            const verdict = await this._llmCall(prompt);
            const lower = verdict.toLowerCase().trim();
            relevances.push(lower.startsWith('relevant') && !lower.startsWith('irrelevant'));
        }

        // Compute average precision weighted by position
        let score = 0;
        let relevantSoFar = 0;
        for (let i = 0; i < relevances.length; i++) {
            if (relevances[i]) {
                relevantSoFar++;
                score += relevantSoFar / (i + 1);
            }
        }

        const totalRelevant = relevances.filter(r => r).length;
        return totalRelevant > 0 ? score / totalRelevant : 0;
    }

    /**
     * Context Recall: Are all ground truth statements covered by contexts?
     * Extracts statements from ground truth, checks coverage.
     */
    async contextRecall({ contexts, groundTruth }) {
        if (!groundTruth) return 0;

        const statementsPrompt = `Extract all distinct factual statements from the following text. Output one statement per line, with no numbering.

Text: ${groundTruth}

Statements:`;

        const statementsResponse = await this._llmCall(statementsPrompt);
        const statements = this._parseLines(statementsResponse);

        if (statements.length === 0) return 1.0;

        const contextText = contexts.join('\n\n---\n\n');
        let coveredCount = 0;

        for (const stmt of statements) {
            const prompt = `Is the following statement supported or covered by the given context?

Context:
${contextText}

Statement: ${stmt}

Answer with exactly one word: "yes" or "no".`;

            const verdict = await this._llmCall(prompt);
            if (verdict.toLowerCase().trim().startsWith('yes')) {
                coveredCount++;
            }
        }

        return coveredCount / statements.length;
    }

    /**
     * Batch evaluation with progress tracking
     *
     * @param {array} samples - Array of {question, answer, contexts, groundTruth}
     * @param {function} progressCallback - Called with (completed, total, lastResult)
     * @returns {object} {individual, aggregate}
     */
    async evaluateBatch(samples, progressCallback = null) {
        if (!this.initialized) await this.initialize();

        const results = [];

        for (let i = 0; i < samples.length; i++) {
            try {
                const result = await this.evaluate(samples[i]);
                results.push({ ...samples[i], scores: result });
            } catch (error) {
                console.error(`RAGAS batch error on sample ${i}:`, error);
                results.push({ ...samples[i], scores: this._emptyScores(error.message) });
            }

            if (progressCallback) {
                progressCallback(i + 1, samples.length, results[results.length - 1]);
            }
        }

        return {
            individual: results,
            aggregate: this._aggregateScores(results),
            evaluatedAt: new Date().toISOString(),
            sampleCount: samples.length
        };
    }

    /**
     * Aggregate scores across batch results
     */
    _aggregateScores(results) {
        const metrics = ['faithfulness', 'answerRelevancy', 'contextPrecision', 'contextRecall', 'overall'];
        const agg = {};

        for (const m of metrics) {
            const values = results
                .map(r => r.scores?.[m])
                .filter(v => v !== null && v !== undefined && !isNaN(v));

            if (values.length === 0) {
                agg[m] = { mean: null, std: null, min: null, max: null, n: 0 };
                continue;
            }

            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.length > 1
                ? values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (values.length - 1)
                : 0;

            agg[m] = {
                mean,
                std: Math.sqrt(variance),
                min: Math.min(...values),
                max: Math.max(...values),
                n: values.length
            };
        }

        return agg;
    }

    _emptyScores(reason = '') {
        return {
            faithfulness: null,
            answerRelevancy: null,
            contextPrecision: null,
            contextRecall: null,
            overall: null,
            error: reason,
            timestamp: new Date().toISOString(),
            metricsComputed: 0
        };
    }

    /**
     * Call LLM service (compatible with multiple providers)
     */
    async _llmCall(prompt) {
        if (!this.llmService) {
            throw new Error('No LLM service available for RAGAS evaluation');
        }

        const opts = {
            maxTokens: 500,
            temperature: this.config.temperature
        };

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                if (this.llmService.generateText) {
                    const response = await this.llmService.generateText(prompt, opts);
                    return typeof response === 'string' ? response : response.content || response.text || '';
                }
                if (this.llmService.generateResponse) {
                    const response = await this.llmService.generateResponse(prompt, [], opts);
                    return typeof response === 'string' ? response : response.content || response.text || '';
                }
                if (this.llmService.chat) {
                    const response = await this.llmService.chat([{ role: 'user', content: prompt }], opts);
                    return typeof response === 'string' ? response : response.content || response.text || '';
                }
                throw new Error('No compatible LLM service method found');
            } catch (error) {
                if (attempt === this.config.maxRetries) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    }

    _parseNumberedList(text) {
        if (!text) return [];
        return text.split('\n')
            .map(l => l.replace(/^\d+[.):\-]\s*/, '').trim())
            .filter(l => l.length > 3); // Filter very short/empty lines
    }

    _parseLines(text) {
        if (!text) return [];
        return text.split('\n')
            .map(l => l.replace(/^[\-\*\d.)\s]+/, '').trim())
            .filter(l => l.length > 3);
    }

    _tokenOverlapSimilarity(text1, text2) {
        const tokens1 = new Set(text1.toLowerCase().split(/\s+/).filter(t => t.length > 1));
        const tokens2 = new Set(text2.toLowerCase().split(/\s+/).filter(t => t.length > 1));
        const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
        const union = new Set([...tokens1, ...tokens2]);
        return union.size > 0 ? intersection.size / union.size : 0;
    }
}

window.ragasEvaluator = new RAGASEvaluator();
console.log('✅ RAGAS Evaluator module loaded');
