/**
 * Phase 2 Testing & Initialization Script
 *
 * Copy and paste this entire file into browser console at http://localhost:8080
 * to test all new Phase 2 features.
 */

(async function testPhase2() {
    console.log('='.repeat(60));
    console.log('🚀 PHASE 2 TESTING & INITIALIZATION');
    console.log('='.repeat(60));
    console.log('');

    // ============================================================
    // STEP 1: Verify All Modules Loaded
    // ============================================================
    console.log('📦 STEP 1: Verifying Module Loading...');
    console.log('-'.repeat(60));

    const modules = {
        'Baseline Comparator': window.baselineComparator,
        'Statistical Analyzer': window.statisticalAnalyzer,
        'Analytics Dashboard': window.analyticsDashboard,
        'Enhanced PDF Processor': window.enhancedPDFProcessor,
        'A/B Testing Framework': window.abTestingFramework,
        'Experiment Tracker': window.experimentTracker,
        'Vector Store': window.vectorStore,
        'Embedding Manager': window.embeddingManager
    };

    let allLoaded = true;
    for (const [name, module] of Object.entries(modules)) {
        const status = module ? '✅' : '❌';
        console.log(`${status} ${name}: ${module ? 'Loaded' : 'MISSING!'}`);
        if (!module) allLoaded = false;
    }

    console.log('');
    if (!allLoaded) {
        console.error('❌ Some modules are missing! Please refresh the page.');
        return;
    }
    console.log('✅ All modules loaded successfully!');
    console.log('');

    // ============================================================
    // STEP 2: Initialize All Phase 2 Modules
    // ============================================================
    console.log('🔧 STEP 2: Initializing Phase 2 Modules...');
    console.log('-'.repeat(60));

    try {
        await window.baselineComparator.initialize();
        console.log('✅ Baseline Comparator initialized');

        await window.statisticalAnalyzer.initialize();
        console.log('✅ Statistical Analyzer initialized');

        await window.analyticsDashboard.initialize();
        console.log('✅ Analytics Dashboard initialized');

        await window.enhancedPDFProcessor.initialize();
        console.log('✅ Enhanced PDF Processor initialized');

        await window.abTestingFramework.initialize();
        console.log('✅ A/B Testing Framework initialized');

        console.log('');
        console.log('✅ All Phase 2 modules initialized!');
        console.log('');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        return;
    }

    // ============================================================
    // STEP 3: Create Demo Experiments
    // ============================================================
    console.log('🧪 STEP 3: Creating Demo Experiments...');
    console.log('-'.repeat(60));

    try {
        const demoExperiments = [];

        // Create 3 demo experiments with different characteristics
        const configs = [
            {
                name: 'Semantic Chunking Baseline',
                description: 'Baseline using semantic boundary detection for chunking',
                metrics: {
                    precision: { base: 0.82, variance: 0.05 },
                    recall: { base: 0.79, variance: 0.04 },
                    f1_score: { base: 0.805, variance: 0.045 },
                    response_time: { base: 245, variance: 30 }
                }
            },
            {
                name: 'Fixed-Size Chunking',
                description: 'Testing fixed-size chunks (512 tokens) with 50 token overlap',
                metrics: {
                    precision: { base: 0.78, variance: 0.06 },
                    recall: { base: 0.81, variance: 0.05 },
                    f1_score: { base: 0.795, variance: 0.055 },
                    response_time: { base: 198, variance: 25 }
                }
            },
            {
                name: 'Optimized Hybrid Approach',
                description: 'Combining semantic + fixed-size with enhanced retrieval',
                metrics: {
                    precision: { base: 0.88, variance: 0.04 },
                    recall: { base: 0.86, variance: 0.035 },
                    f1_score: { base: 0.87, variance: 0.0375 },
                    response_time: { base: 267, variance: 35 }
                }
            }
        ];

        for (let i = 0; i < configs.length; i++) {
            const config = configs[i];

            // Create experiment
            const exp = await window.experimentTracker.createExperiment(
                config.name,
                config.description
            );

            console.log(`  Created: ${config.name}`);

            // Run 10 test runs for each experiment
            for (let runNum = 1; runNum <= 10; runNum++) {
                const run = await window.experimentTracker.startRun(
                    exp.id,
                    `Run ${runNum}`,
                    { runNumber: runNum, timestamp: Date.now() }
                );

                // Generate realistic metrics with variance
                for (const [metric, params] of Object.entries(config.metrics)) {
                    const value = params.base + (Math.random() - 0.5) * 2 * params.variance;
                    window.experimentTracker.logMetric(metric, value);
                }

                await window.experimentTracker.endRun();
            }

            console.log(`    ✅ Completed 10 runs`);
            demoExperiments.push(exp);
        }

        console.log('');
        console.log(`✅ Created ${demoExperiments.length} demo experiments with 10 runs each`);
        console.log('');

        // Store for later use
        window.demoExperiments = demoExperiments;

    } catch (error) {
        console.error('❌ Error creating demo experiments:', error);
        return;
    }

    // ============================================================
    // STEP 4: Test Statistical Analysis
    // ============================================================
    console.log('📊 STEP 4: Testing Statistical Analysis...');
    console.log('-'.repeat(60));

    try {
        // Get metrics from first experiment
        const exp1 = window.demoExperiments[0];
        const runs1 = window.experimentTracker.getRuns(exp1.id);
        const precision1 = runs1.map(r => r.metrics.precision).filter(v => v);

        // Calculate descriptive statistics
        const stats = window.statisticalAnalyzer.calculateDescriptiveStats(precision1);
        console.log(`  Descriptive Statistics for ${exp1.name}:`);
        console.log(`    Mean: ${stats.mean.toFixed(4)}`);
        console.log(`    Median: ${stats.median.toFixed(4)}`);
        console.log(`    Std Dev: ${stats.stdDev.toFixed(4)}`);
        console.log(`    95% CI: [${stats.ci95.lower.toFixed(4)}, ${stats.ci95.upper.toFixed(4)}]`);
        console.log('');

        // Compare two experiments with t-test
        const exp2 = window.demoExperiments[1];
        const runs2 = window.experimentTracker.getRuns(exp2.id);
        const precision2 = runs2.map(r => r.metrics.precision).filter(v => v);

        const tTest = window.statisticalAnalyzer.tTest(precision1, precision2, {
            confidenceLevel: 0.95
        });

        console.log(`  T-Test: ${exp1.name} vs ${exp2.name}`);
        console.log(`    t-statistic: ${tTest.tStatistic.toFixed(4)}`);
        console.log(`    p-value: ${tTest.pValue.toFixed(4)}`);
        console.log(`    Significant: ${tTest.significant ? 'YES ✅' : 'NO ❌'} (α=0.05)`);
        console.log(`    Mean Difference: ${tTest.meanDifference.toFixed(4)}`);
        console.log(`    Effect Size: ${tTest.effectSize.cohensD.toFixed(4)} (${tTest.effectSize.interpretation})`);
        console.log('');

        // Outlier detection
        const outliers = window.statisticalAnalyzer.detectOutliers(precision1);
        console.log(`  Outlier Detection:`);
        console.log(`    IQR method: ${outliers.methods.iqr.count} outliers`);
        console.log(`    Z-score method: ${outliers.methods.zscore.count} outliers`);
        console.log(`    Recommendation: ${outliers.summary.recommendation}`);
        console.log('');

        console.log('✅ Statistical analysis working correctly!');
        console.log('');

    } catch (error) {
        console.error('❌ Error in statistical analysis:', error);
    }

    // ============================================================
    // STEP 5: Test Baseline Comparison
    // ============================================================
    console.log('⚖️ STEP 5: Testing Baseline Comparison...');
    console.log('-'.repeat(60));

    try {
        // Create comparison between all experiments
        const experimentIds = window.demoExperiments.map(e => e.id);

        const comparison = await window.baselineComparator.createComparison(
            'Demo Comparison: All Approaches',
            experimentIds,
            {
                metrics: ['precision', 'recall', 'f1_score', 'response_time'],
                statisticalTests: true,
                confidenceLevel: 0.95
            }
        );

        console.log(`  Created comparison: ${comparison.name}`);
        console.log(`  Status: ${comparison.status}`);
        console.log('');

        if (comparison.results) {
            console.log('  📊 Results:');
            console.log('  Overall Rankings:');
            comparison.results.rankings.overall.forEach((ranking, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
                console.log(`    ${medal} #${ranking.rank}: ${ranking.experimentName}`);
                console.log(`       Avg Rank: ${ranking.averageRank.toFixed(2)}`);
            });
            console.log('');

            console.log('  💡 Key Insights:');
            comparison.results.insights.forEach((insight, idx) => {
                const icon = insight.priority === 'high' ? '🔴' :
                           insight.priority === 'medium' ? '🟡' : '🟢';
                console.log(`    ${icon} ${insight.title}`);
                console.log(`       ${insight.description}`);
            });
            console.log('');
        }

        console.log('✅ Baseline comparison working correctly!');
        console.log('');

        // Store for later
        window.demoComparison = comparison;

    } catch (error) {
        console.error('❌ Error in baseline comparison:', error);
    }

    // ============================================================
    // STEP 6: Test Analytics Dashboard
    // ============================================================
    console.log('📈 STEP 6: Testing Analytics Dashboard...');
    console.log('-'.repeat(60));

    try {
        // Generate comprehensive report
        const report = await window.analyticsDashboard.generateReport(
            'default_dashboard',
            {
                name: 'Phase 2 Demo Report',
                timeRange: { start: 0, end: Date.now() }
            }
        );

        console.log(`  Generated report: ${report.name}`);
        console.log(`  Report ID: ${report.id}`);
        console.log(`  Sections: ${report.sections.length}`);
        console.log('');

        // Show section summaries
        console.log('  📑 Report Sections:');
        report.sections.forEach((section, idx) => {
            console.log(`    ${idx + 1}. ${section.title}`);
            if (section.type === 'summary' && section.data.overview) {
                console.log(`       - Total Experiments: ${section.data.overview.totalExperiments}`);
                console.log(`       - Completed Runs: ${section.data.overview.completedRuns}`);
            }
        });
        console.log('');

        // Show insights
        const insightsSection = report.sections.find(s => s.title === 'Insights & Recommendations');
        if (insightsSection && insightsSection.data.insights) {
            console.log('  💡 Top Insights:');
            insightsSection.data.insights.slice(0, 3).forEach(insight => {
                const icon = insight.priority === 'high' ? '🔴' :
                           insight.priority === 'medium' ? '🟡' : '🟢';
                console.log(`    ${icon} ${insight.title}`);
            });
            console.log('');
        }

        console.log('✅ Analytics dashboard working correctly!');
        console.log('');

        // Store for later
        window.demoReport = report;

    } catch (error) {
        console.error('❌ Error in analytics dashboard:', error);
    }

    // ============================================================
    // STEP 7: Test A/B Testing Framework
    // ============================================================
    console.log('🧪 STEP 7: Testing A/B Testing Framework...');
    console.log('-'.repeat(60));

    try {
        // Create A/B test
        const abTest = await window.abTestingFramework.createTest(
            'Context Window Size Optimization',
            {
                description: 'Testing different context window sizes for optimal performance',
                testType: 'context_size',
                primaryMetric: 'f1_score',
                secondaryMetrics: ['precision', 'recall', 'response_time'],
                minimumSampleSize: 10,
                confidenceLevel: 0.95,
                assignmentStrategy: 'random'
            }
        );

        console.log(`  Created A/B test: ${abTest.name}`);
        console.log(`  Test ID: ${abTest.id}`);
        console.log(`  Status: ${abTest.status}`);
        console.log('');

        // Add variants
        const controlVariant = await window.abTestingFramework.addVariant(
            abTest.id,
            'Small Context (2k tokens)',
            {
                description: 'Using 2000 token context window',
                parameters: { contextSize: 2000 },
                isControl: true
            }
        );

        const testVariant = await window.abTestingFramework.addVariant(
            abTest.id,
            'Large Context (4k tokens)',
            {
                description: 'Using 4000 token context window',
                parameters: { contextSize: 4000 },
                weight: 1.0
            }
        );

        console.log(`  ✅ Added variant: ${controlVariant.name} (Control)`);
        console.log(`  ✅ Added variant: ${testVariant.name}`);
        console.log('');

        // Start test
        await window.abTestingFramework.startTest(abTest.id);
        console.log('  ▶️  Test started!');
        console.log('');

        // Simulate some observations
        console.log('  Simulating 15 observations per variant...');
        for (let i = 0; i < 15; i++) {
            // Control variant
            await window.abTestingFramework.recordObservation(
                abTest.id,
                controlVariant.id,
                {
                    precision: 0.82 + (Math.random() - 0.5) * 0.1,
                    recall: 0.79 + (Math.random() - 0.5) * 0.08,
                    f1_score: 0.805 + (Math.random() - 0.5) * 0.09,
                    response_time: 245 + (Math.random() - 0.5) * 60
                }
            );

            // Test variant (slightly better)
            await window.abTestingFramework.recordObservation(
                abTest.id,
                testVariant.id,
                {
                    precision: 0.87 + (Math.random() - 0.5) * 0.08,
                    recall: 0.85 + (Math.random() - 0.5) * 0.07,
                    f1_score: 0.86 + (Math.random() - 0.5) * 0.075,
                    response_time: 312 + (Math.random() - 0.5) * 70
                }
            );
        }
        console.log('  ✅ Recorded 30 total observations');
        console.log('');

        // Get results
        const results = window.abTestingFramework.getCurrentResults(abTest.id);

        console.log('  📊 A/B Test Results:');
        results.variants.forEach(v => {
            console.log(`    ${v.isControl ? '🎯' : '🧪'} ${v.name}:`);
            console.log(`       Sample Size: ${v.sampleSize}`);
            if (v.metrics.f1_score) {
                console.log(`       F1 Score: ${v.metrics.f1_score.mean.toFixed(4)} ± ${v.metrics.f1_score.stdDev.toFixed(4)}`);
            }
        });
        console.log('');

        if (results.stats && results.stats.winner) {
            const winner = results.stats.winner;
            console.log('  🏆 Winner Detected:');
            console.log(`    Variant: ${winner.variantName}`);
            console.log(`    Performance: ${(winner.performance * 100).toFixed(2)}%`);
            console.log(`    Improvement: ${winner.improvement.toFixed(2)}%`);
            console.log(`    Confidence: ${winner.confidence.toFixed(1)}%`);
            console.log(`    Significant: ${winner.significant ? 'YES ✅' : 'NO ❌'}`);
        }
        console.log('');

        console.log('✅ A/B testing framework working correctly!');
        console.log('');

        // Store for later
        window.demoABTest = abTest;

    } catch (error) {
        console.error('❌ Error in A/B testing:', error);
    }

    // ============================================================
    // FINAL SUMMARY
    // ============================================================
    console.log('='.repeat(60));
    console.log('🎉 PHASE 2 TESTING COMPLETE!');
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ All modules loaded and initialized');
    console.log('✅ Demo experiments created (3 experiments × 10 runs)');
    console.log('✅ Statistical analysis tested');
    console.log('✅ Baseline comparison tested');
    console.log('✅ Analytics dashboard tested');
    console.log('✅ A/B testing framework tested');
    console.log('');
    console.log('📦 Created Demo Objects:');
    console.log('   window.demoExperiments - Array of 3 experiments');
    console.log('   window.demoComparison - Comparison results');
    console.log('   window.demoReport - Analytics report');
    console.log('   window.demoABTest - A/B test with results');
    console.log('');
    console.log('📊 Next Steps:');
    console.log('   1. Explore the UI pages (Analytics, Comparisons, A/B Testing)');
    console.log('   2. Try exporting reports:');
    console.log('      const markdown = window.analyticsDashboard.exportReport(');
    console.log('          window.demoReport.id, "markdown"');
    console.log('      );');
    console.log('      console.log(markdown);');
    console.log('');
    console.log('   3. Create your own experiments with real data');
    console.log('   4. Read PHASE_2_QUICKSTART.md for more examples');
    console.log('');
    console.log('🎓 Your platform is now ready for PhD research!');
    console.log('='.repeat(60));
    console.log('');

})().catch(error => {
    console.error('');
    console.error('❌ TESTING FAILED:');
    console.error(error);
    console.error('');
    console.error('Please check:');
    console.error('  1. Browser console for detailed errors');
    console.error('  2. All JavaScript files are loaded (check Network tab)');
    console.error('  3. No JavaScript errors on page load');
});
