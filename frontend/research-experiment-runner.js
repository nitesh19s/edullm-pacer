/**
 * Research Experiment Runner
 *
 * Automates end-to-end experiment execution with proper controls:
 *   config snapshot → data versioning → RAG query → NLP metrics →
 *   RAGAS evaluation → statistical analysis → LaTeX/CSV export
 *
 * Designed for PhD-level reproducible research.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class ResearchExperimentRunner {
    constructor() {
        this.running = false;
        this.currentRun = null;
        this.history = [];
    }

    /**
     * Run a complete research experiment
     *
     * @param {object} spec - Experiment specification
     * @param {string} spec.name - Experiment name
     * @param {string} spec.description - Description / hypothesis
     * @param {array} spec.configurations - RAG configs to compare [{name, topK, chunkSize, ...}]
     * @param {object} spec.dataset - {questions: string[], groundTruths: string[], contexts?: string[][]}
     * @param {array} spec.metrics - Metrics to compute (default: all)
     * @param {number} spec.repetitions - Number of repetitions per config (default: 3)
     * @param {number} spec.seed - Random seed for reproducibility
     * @param {function} spec.onProgress - Progress callback
     * @returns {object} Complete results with all metrics
     */
    async run(spec) {
        if (this.running) {
            throw new Error('An experiment is already running');
        }

        const {
            name,
            description = '',
            configurations,
            dataset,
            metrics = ['bleu', 'rouge', 'mrr', 'ndcg', 'map', 'ragas'],
            repetitions = 3,
            seed = Date.now(),
            onProgress = null
        } = spec;

        this.running = true;
        const startTime = Date.now();
        const rng = new SeededRandom(seed);

        const progress = (phase, detail, pct) => {
            if (onProgress) onProgress({ phase, detail, pct, elapsed: Date.now() - startTime });
        };

        try {
            progress('init', 'Initializing experiment...', 0);

            // 1. Create reproducibility metadata
            const configSnapshot = window.configManager
                ? await window.configManager.createSnapshot(
                    this._gatherCurrentConfig(),
                    `Experiment: ${name}`
                )
                : null;

            // 2. Version the dataset
            const datasetVersion = window.datasetVersioner
                ? await window.datasetVersioner.createVersion(
                    `${name}_dataset`,
                    dataset.questions.map((q, i) => ({
                        question: q,
                        groundTruth: dataset.groundTruths?.[i] || null
                    })),
                    { source: 'experiment_runner', experimentName: name }
                )
                : null;

            // 3. Record experiment creation
            if (window.auditTrail) {
                window.auditTrail.record('CREATE', 'experiment', name, {
                    summary: `Started experiment "${name}" with ${configurations.length} configs, ${dataset.questions.length} questions, ${repetitions} reps`,
                    seed,
                    configHash: configSnapshot?.hash,
                    datasetHash: datasetVersion?.hash
                });
            }

            // 4. Create experiment in tracker if available
            let experimentId = null;
            if (window.experimentTracker) {
                try {
                    const exp = await window.experimentTracker.createExperiment(name, description, [], {
                        seed,
                        parameters: { configurations: configurations.map(c => c.name), repetitions, metrics }
                    });
                    experimentId = exp.id;
                } catch (e) {
                    console.warn('Experiment tracker not available:', e);
                }
            }

            progress('run', 'Running configurations...', 10);

            // 5. Run each configuration
            const configResults = [];
            const totalSteps = configurations.length * dataset.questions.length * repetitions;
            let completedSteps = 0;

            for (let ci = 0; ci < configurations.length; ci++) {
                const config = configurations[ci];
                const configRunResults = [];

                for (let rep = 0; rep < repetitions; rep++) {
                    const repResults = [];

                    for (let qi = 0; qi < dataset.questions.length; qi++) {
                        const question = dataset.questions[qi];
                        const groundTruth = dataset.groundTruths?.[qi] || null;

                        // Query RAG system with this config
                        let answer = '';
                        let contexts = dataset.contexts?.[qi] || [];
                        let queryTime = 0;

                        try {
                            const queryStart = performance.now();
                            if (window.ragOrchestrator) {
                                const result = await window.ragOrchestrator.query(question, {
                                    topK: config.topK,
                                    minScore: config.minScore,
                                    maxTokens: config.maxTokens,
                                    ...config
                                });
                                answer = result.answer || result.content || '';
                                contexts = result.sources?.map(s => s.content || s.text) || contexts;
                            }
                            queryTime = performance.now() - queryStart;
                        } catch (e) {
                            console.warn(`Query failed for config ${config.name}, q${qi}:`, e);
                        }

                        repResults.push({
                            question,
                            answer,
                            contexts,
                            groundTruth,
                            queryTime,
                            configName: config.name,
                            repetition: rep + 1
                        });

                        completedSteps++;
                        const pct = 10 + (completedSteps / totalSteps) * 50;
                        progress('run', `Config "${config.name}" rep ${rep + 1}/${repetitions} q${qi + 1}/${dataset.questions.length}`, pct);
                    }

                    configRunResults.push(repResults);
                }

                configResults.push({
                    config,
                    runs: configRunResults
                });
            }

            progress('metrics', 'Computing NLP metrics...', 60);

            // 6. Compute NLP metrics per config
            const metricsResults = [];
            for (const cr of configResults) {
                const allResults = cr.runs.flat();
                const configMetrics = { name: cr.config.name };

                if (window.nlpMetrics) {
                    // Text generation metrics
                    const pairs = allResults
                        .filter(r => r.groundTruth && r.answer)
                        .map(r => ({ reference: r.groundTruth, candidate: r.answer }));

                    if (pairs.length > 0) {
                        const gen = window.nlpMetrics.computeAllGeneration(pairs);
                        configMetrics.bleu = gen.bleu;
                        configMetrics.rouge1 = gen.rouge1;
                        configMetrics.rouge2 = gen.rouge2;
                        configMetrics.rougeL = gen.rougeL;
                    }

                    // IR metrics (if relevance judgments available)
                    const rankings = allResults
                        .filter(r => r.contexts.length > 0 && r.groundTruth)
                        .map(r => r.contexts.map(ctx => ({
                            relevant: this._isRelevant(ctx, r.groundTruth)
                        })));

                    if (rankings.length > 0) {
                        const ir = window.nlpMetrics.computeAllIR(rankings, { k: cr.config.topK || 5 });
                        configMetrics.mrr = ir.mrr;
                        configMetrics.map = ir.map;
                        configMetrics.hitRate = ir.hitRateAtK;

                        // NDCG per query, then average
                        const ndcgScores = rankings.map(r =>
                            window.nlpMetrics.ndcg(r.map(x => x.relevant ? 1 : 0)).ndcg
                        );
                        configMetrics.ndcg = ndcgScores.reduce((a, b) => a + b, 0) / ndcgScores.length;
                    }

                    // Response time stats
                    const times = allResults.map(r => r.queryTime).filter(t => t > 0);
                    if (times.length > 0) {
                        configMetrics.avgResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
                        configMetrics.p95ResponseTime = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
                    }
                }

                metricsResults.push(configMetrics);
            }

            progress('ragas', 'Running RAGAS evaluation...', 70);

            // 7. RAGAS evaluation (if enabled and LLM available)
            let ragasResults = null;
            if (metrics.includes('ragas') && window.ragasEvaluator) {
                try {
                    await window.ragasEvaluator.initialize();

                    // Evaluate best run of each config
                    const ragasBatch = [];
                    for (const cr of configResults) {
                        const bestRun = cr.runs[0]; // First repetition
                        for (const r of bestRun) {
                            if (r.answer && r.contexts.length > 0) {
                                ragasBatch.push({
                                    question: r.question,
                                    answer: r.answer,
                                    contexts: r.contexts,
                                    groundTruth: r.groundTruth,
                                    configName: cr.config.name
                                });
                            }
                        }
                    }

                    if (ragasBatch.length > 0) {
                        ragasResults = await window.ragasEvaluator.evaluateBatch(
                            ragasBatch,
                            (done, total) => progress('ragas', `RAGAS: ${done}/${total}`, 70 + (done / total) * 10)
                        );
                    }
                } catch (e) {
                    console.warn('RAGAS evaluation failed:', e);
                }
            }

            progress('stats', 'Running statistical tests...', 80);

            // 8. Statistical comparison between configs
            let statisticalResults = null;
            if (configurations.length >= 2 && window.statisticalAnalyzer) {
                statisticalResults = this._runStatisticalTests(configResults, metricsResults);
            }

            progress('export', 'Generating exports...', 90);

            // 9. Assemble final results
            const results = {
                experimentId,
                name,
                description,
                seed,
                configSnapshot: configSnapshot ? { version: configSnapshot.version, hash: configSnapshot.hash } : null,
                datasetVersion: datasetVersion ? { id: datasetVersion.id, hash: datasetVersion.hash, recordCount: datasetVersion.recordCount } : null,
                configurations: configurations.map(c => c.name),
                repetitions,
                totalQueries: configResults.reduce((s, cr) => s + cr.runs.flat().length, 0),
                metricsResults,
                ragasResults: ragasResults?.aggregate || null,
                ragasIndividual: ragasResults?.individual || null,
                statisticalResults,
                duration: Date.now() - startTime,
                completedAt: new Date().toISOString()
            };

            // 10. Generate LaTeX and CSV exports
            const exports = {};
            if (window.latexExporter) {
                exports.latex = {};

                if (metricsResults.length > 0) {
                    exports.latex.nlpMetrics = window.latexExporter.nlpMetricsTable(metricsResults);
                }
                if (ragasResults?.aggregate) {
                    exports.latex.ragas = window.latexExporter.ragasResultsTable(ragasResults);
                }
                if (statisticalResults?.pairwiseTests?.length > 0) {
                    exports.latex.statistical = window.latexExporter.statisticalResultsTable(statisticalResults.pairwiseTests);
                }

                // Combined CSV
                exports.csv = window.latexExporter.toCSV({
                    headers: ['Configuration', 'BLEU', 'ROUGE-1', 'ROUGE-2', 'ROUGE-L', 'MRR', 'NDCG', 'MAP', 'Avg Response Time (ms)'],
                    rows: metricsResults.map(m => [
                        m.name,
                        m.bleu || '--', m.rouge1 || '--', m.rouge2 || '--', m.rougeL || '--',
                        m.mrr || '--', m.ndcg || '--', m.map || '--',
                        m.avgResponseTime ? m.avgResponseTime.toFixed(1) : '--'
                    ])
                });
            }

            results.exports = exports;

            // Record completion
            if (window.auditTrail) {
                window.auditTrail.record('COMPUTE', 'experiment', name, {
                    summary: `Completed experiment "${name}" in ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
                    duration: Date.now() - startTime,
                    totalQueries: results.totalQueries
                });
            }

            this.history.push({
                name,
                completedAt: results.completedAt,
                duration: results.duration,
                configCount: configurations.length,
                questionCount: dataset.questions.length
            });

            progress('done', 'Experiment complete!', 100);

            return results;

        } finally {
            this.running = false;
            this.currentRun = null;
        }
    }

    /**
     * Run statistical tests comparing configs
     */
    _runStatisticalTests(configResults, metricsResults) {
        const metricNames = ['bleu', 'rouge1', 'rouge2', 'rougeL'];
        const pairwiseTests = [];

        // For each pair of configurations
        for (let i = 0; i < configResults.length; i++) {
            for (let j = i + 1; j < configResults.length; j++) {
                const config1 = configResults[i];
                const config2 = configResults[j];

                // Extract per-question scores for comparison
                for (const metric of metricNames) {
                    const scores1 = this._extractPerQuestionScores(config1, metric);
                    const scores2 = this._extractPerQuestionScores(config2, metric);

                    if (scores1.length >= 2 && scores2.length >= 2) {
                        try {
                            const test = window.statisticalAnalyzer.tTest(scores1, scores2, {
                                alternative: 'two-sided',
                                confidenceLevel: 0.95
                            });

                            pairwiseTests.push({
                                experiment1: config1.config.name,
                                experiment2: config2.config.name,
                                metric,
                                ...test
                            });
                        } catch (e) {
                            console.warn(`Statistical test failed for ${metric}:`, e);
                        }
                    }
                }
            }
        }

        // Multiple comparison correction
        let correctedPValues = null;
        if (pairwiseTests.length > 1 && window.statisticalAnalyzer.benjaminiHochberg) {
            const pValues = pairwiseTests.map(t => t.pValue);
            correctedPValues = window.statisticalAnalyzer.benjaminiHochberg(pValues);
        }

        return {
            pairwiseTests,
            correctedPValues,
            testCount: pairwiseTests.length,
            significantCount: pairwiseTests.filter(t => t.significant).length
        };
    }

    /**
     * Extract per-question scores for a given metric from config results
     */
    _extractPerQuestionScores(configResult, metric) {
        const scores = [];
        const allResults = configResult.runs.flat();

        for (const r of allResults) {
            if (r.groundTruth && r.answer && window.nlpMetrics) {
                if (metric === 'bleu') {
                    scores.push(window.nlpMetrics.bleu(r.groundTruth, r.answer).score);
                } else if (metric.startsWith('rouge')) {
                    const rouge = window.nlpMetrics.rouge(r.groundTruth, r.answer);
                    if (metric === 'rouge1') scores.push(rouge.rouge1.f1);
                    else if (metric === 'rouge2') scores.push(rouge.rouge2.f1);
                    else if (metric === 'rougeL') scores.push(rouge.rougeL.f1);
                }
            }
        }

        return scores;
    }

    /**
     * Simple relevance check (token overlap > threshold)
     */
    _isRelevant(context, groundTruth, threshold = 0.15) {
        const ctxTokens = new Set(context.toLowerCase().split(/\s+/).filter(t => t.length > 2));
        const gtTokens = new Set(groundTruth.toLowerCase().split(/\s+/).filter(t => t.length > 2));
        const intersection = [...ctxTokens].filter(t => gtTokens.has(t));
        return gtTokens.size > 0 ? intersection.length / gtTokens.size > threshold : false;
    }

    /**
     * Gather current platform configuration
     */
    _gatherCurrentConfig() {
        const config = {};

        if (window.CONFIG) config.platform = window.CONFIG;

        if (window.ragOrchestrator?.config) {
            config.rag = {
                topK: window.ragOrchestrator.config.retrievalTopK,
                minScore: window.ragOrchestrator.config.retrievalMinScore,
                maxTokens: window.ragOrchestrator.config.contextMaxTokens
            };
        }

        config.timestamp = new Date().toISOString();
        config.userAgent = navigator.userAgent;

        return config;
    }

    /**
     * Download all experiment results
     */
    downloadResults(results, format = 'all') {
        if (!window.latexExporter) {
            console.error('LaTeX exporter not loaded');
            return;
        }

        if (format === 'latex' || format === 'all') {
            let latex = `% Experiment: ${results.name}\n`;
            latex += `% Generated: ${results.completedAt}\n`;
            latex += `% Seed: ${results.seed}\n\n`;

            if (results.exports?.latex) {
                for (const [key, content] of Object.entries(results.exports.latex)) {
                    latex += `% === ${key} ===\n${content}\n\n`;
                }
            }

            window.latexExporter.download(latex, `${results.name.replace(/\s+/g, '_')}_results.tex`);
        }

        if (format === 'csv' || format === 'all') {
            if (results.exports?.csv) {
                window.latexExporter.download(
                    results.exports.csv,
                    `${results.name.replace(/\s+/g, '_')}_results.csv`,
                    'text/csv'
                );
            }
        }

        if (format === 'json' || format === 'all') {
            const json = JSON.stringify(results, null, 2);
            window.latexExporter.download(
                json,
                `${results.name.replace(/\s+/g, '_')}_results.json`,
                'application/json'
            );
        }
    }

    /**
     * Get experiment history
     */
    getHistory() {
        return this.history;
    }
}

window.researchRunner = new ResearchExperimentRunner();
console.log('✅ Research Experiment Runner module loaded');
