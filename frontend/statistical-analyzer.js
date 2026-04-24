/**
 * Statistical Analysis Module
 *
 * Provides comprehensive statistical analysis tools for RAG research.
 * Includes descriptive statistics, hypothesis testing, correlation analysis,
 * distribution analysis, and advanced statistical methods.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class StatisticalAnalyzer {
    constructor() {
        this.analyses = new Map(); // analysis_id -> analysis results
        this.datasets = new Map(); // dataset_id -> dataset
        this.initialized = false;

        this.tests = {
            parametric: ['t-test', 'paired-t-test', 'anova', 'pearson-correlation'],
            nonParametric: ['mann-whitney', 'wilcoxon', 'kruskal-wallis', 'spearman-correlation'],
            normality: ['shapiro-wilk', 'anderson-darling', 'kolmogorov-smirnov']
        };

        this.confidenceLevels = [0.90, 0.95, 0.99];
    }

    /**
     * Initialize the analyzer
     */
    async initialize() {
        if (this.initialized) return;

        try {
            const savedData = localStorage.getItem('rag_statistical_analyses');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.analyses = new Map(data.analyses || []);
                this.datasets = new Map(data.datasets || []);
            }

            this.initialized = true;
            console.log('✅ Statistical Analyzer initialized');
        } catch (error) {
            console.error('Error initializing analyzer:', error);
            throw error;
        }
    }

    /**
     * Create a dataset from experiment results
     *
     * @param {string} name - Dataset name
     * @param {array} data - Raw data
     * @param {object} metadata - Metadata
     * @returns {object} Dataset object
     */
    createDataset(name, data, metadata = {}) {
        const dataset = {
            id: this.generateId('dataset'),
            name,
            data,
            metadata: {
                ...metadata,
                size: data.length,
                created: Date.now()
            },
            summary: this.calculateDescriptiveStats(data)
        };

        this.datasets.set(dataset.id, dataset);
        this.save();

        return dataset;
    }

    /**
     * Calculate comprehensive descriptive statistics
     *
     * @param {array} data - Numerical data array
     * @returns {object} Descriptive statistics
     */
    calculateDescriptiveStats(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return null;
        }

        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;

        // Central tendency
        const mean = this.mean(data);
        const median = this.median(sorted);
        const mode = this.mode(data);

        // Dispersion
        const variance = this.variance(data, mean);
        const stdDev = Math.sqrt(variance);
        const range = sorted[n - 1] - sorted[0];
        const iqr = this.iqr(sorted);
        const mad = this.mad(data, median); // Median Absolute Deviation

        // Shape
        const skewness = this.skewness(data, mean, stdDev);
        const kurtosis = this.kurtosis(data, mean, stdDev);

        // Percentiles
        const percentiles = {
            p5: this.percentile(sorted, 0.05),
            p10: this.percentile(sorted, 0.10),
            p25: this.percentile(sorted, 0.25),
            p50: median,
            p75: this.percentile(sorted, 0.75),
            p90: this.percentile(sorted, 0.90),
            p95: this.percentile(sorted, 0.95)
        };

        // Confidence intervals (95%) using proper t-distribution
        const sem = stdDev / Math.sqrt(n);
        const tCrit = typeof jStat !== 'undefined'
            ? jStat.studentt.inv(1 - 0.025, n - 1)
            : 1.96;
        const ci95 = {
            lower: mean - tCrit * sem,
            upper: mean + tCrit * sem
        };

        return {
            n,
            mean,
            median,
            mode,
            variance,
            stdDev,
            range,
            iqr,
            mad,
            skewness,
            kurtosis,
            percentiles,
            ci95,
            min: sorted[0],
            max: sorted[n - 1],
            sum: data.reduce((a, b) => a + b, 0),
            coefficientOfVariation: mean !== 0 ? (stdDev / mean) * 100 : 0
        };
    }

    /**
     * Perform independent samples t-test
     *
     * @param {array} sample1 - First sample
     * @param {array} sample2 - Second sample
     * @param {object} options - Test options
     * @returns {object} Test results
     */
    tTest(sample1, sample2, options = {}) {
        const {
            paired = false,
            alternative = 'two-sided', // 'two-sided', 'less', 'greater'
            confidenceLevel = 0.95
        } = options;

        if (paired) {
            return this.pairedTTest(sample1, sample2, options);
        }

        const n1 = sample1.length;
        const n2 = sample2.length;

        const mean1 = this.mean(sample1);
        const mean2 = this.mean(sample2);

        const var1 = this.variance(sample1);
        const var2 = this.variance(sample2);

        // Welch's t-test (doesn't assume equal variances)
        const tStatistic = (mean1 - mean2) / Math.sqrt(var1 / n1 + var2 / n2);

        // Welch-Satterthwaite degrees of freedom
        const df = Math.pow(var1 / n1 + var2 / n2, 2) /
            (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));

        const pValue = this.calculatePValue(tStatistic, df, alternative);

        // Effect size (Cohen's d)
        const pooledStd = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));
        const cohensD = (mean1 - mean2) / pooledStd;

        // Confidence interval for mean difference
        const tCritical = this.tCriticalValue(df, confidenceLevel);
        const se = Math.sqrt(var1 / n1 + var2 / n2);
        const ci = {
            lower: (mean1 - mean2) - tCritical * se,
            upper: (mean1 - mean2) + tCritical * se
        };

        return {
            test: 'Independent t-test (Welch)',
            tStatistic,
            degreesOfFreedom: df,
            pValue,
            significant: pValue < (1 - confidenceLevel),
            meanDifference: mean1 - mean2,
            confidenceInterval: ci,
            effectSize: {
                cohensD,
                interpretation: this.interpretCohenD(cohensD)
            },
            sample1Stats: { n: n1, mean: mean1, variance: var1 },
            sample2Stats: { n: n2, mean: mean2, variance: var2 }
        };
    }

    /**
     * Perform paired samples t-test
     *
     * @param {array} sample1 - First sample
     * @param {array} sample2 - Second sample (paired)
     * @param {object} options - Test options
     * @returns {object} Test results
     */
    pairedTTest(sample1, sample2, options = {}) {
        if (sample1.length !== sample2.length) {
            throw new Error('Paired samples must have equal length');
        }

        const differences = sample1.map((val, i) => val - sample2[i]);
        const n = differences.length;

        const meanDiff = this.mean(differences);
        const stdDiff = Math.sqrt(this.variance(differences));

        const tStatistic = meanDiff / (stdDiff / Math.sqrt(n));
        const df = n - 1;

        const { alternative = 'two-sided', confidenceLevel = 0.95 } = options;
        const pValue = this.calculatePValue(tStatistic, df, alternative);

        // Effect size
        const cohensD = meanDiff / stdDiff;

        // Confidence interval
        const tCritical = this.tCriticalValue(df, confidenceLevel);
        const se = stdDiff / Math.sqrt(n);
        const ci = {
            lower: meanDiff - tCritical * se,
            upper: meanDiff + tCritical * se
        };

        return {
            test: 'Paired t-test',
            tStatistic,
            degreesOfFreedom: df,
            pValue,
            significant: pValue < (1 - confidenceLevel),
            meanDifference: meanDiff,
            stdDifference: stdDiff,
            confidenceInterval: ci,
            effectSize: {
                cohensD,
                interpretation: this.interpretCohenD(cohensD)
            }
        };
    }

    /**
     * Perform one-way ANOVA
     *
     * @param {array} groups - Array of sample arrays
     * @param {object} options - Test options
     * @returns {object} ANOVA results
     */
    anova(groups, options = {}) {
        const { confidenceLevel = 0.95 } = options;

        const k = groups.length; // number of groups
        const n = groups.reduce((sum, group) => sum + group.length, 0); // total n

        // Grand mean
        const allData = groups.flat();
        const grandMean = this.mean(allData);

        // Between-group sum of squares (SSB)
        const ssb = groups.reduce((sum, group) => {
            const groupMean = this.mean(group);
            return sum + group.length * Math.pow(groupMean - grandMean, 2);
        }, 0);

        // Within-group sum of squares (SSW)
        const ssw = groups.reduce((sum, group) => {
            const groupMean = this.mean(group);
            return sum + group.reduce((s, val) => s + Math.pow(val - groupMean, 2), 0);
        }, 0);

        // Total sum of squares
        const sst = ssb + ssw;

        // Degrees of freedom
        const dfBetween = k - 1;
        const dfWithin = n - k;

        // Mean squares
        const msb = ssb / dfBetween;
        const msw = ssw / dfWithin;

        // F-statistic
        const fStatistic = msb / msw;

        // P-value (simplified approximation)
        const pValue = this.fDistributionPValue(fStatistic, dfBetween, dfWithin);

        // Effect size (eta-squared)
        const etaSquared = ssb / sst;

        // Post-hoc: pairwise comparisons (Tukey HSD)
        const pairwiseComparisons = this.tukeyHSD(groups, msw, n);

        return {
            test: 'One-way ANOVA',
            fStatistic,
            pValue,
            significant: pValue < (1 - confidenceLevel),
            degreesOfFreedom: { between: dfBetween, within: dfWithin },
            sumOfSquares: { between: ssb, within: ssw, total: sst },
            meanSquares: { between: msb, within: msw },
            effectSize: {
                etaSquared,
                interpretation: this.interpretEtaSquared(etaSquared)
            },
            groupStats: groups.map((group, i) => ({
                group: i + 1,
                n: group.length,
                mean: this.mean(group),
                std: Math.sqrt(this.variance(group))
            })),
            pairwiseComparisons
        };
    }

    /**
     * Perform Tukey's HSD post-hoc test
     */
    tukeyHSD(groups, msw, totalN) {
        const comparisons = [];
        const k = groups.length;

        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                const mean1 = this.mean(groups[i]);
                const mean2 = this.mean(groups[j]);
                const n1 = groups[i].length;
                const n2 = groups[j].length;

                // Q statistic
                const qStat = Math.abs(mean1 - mean2) / Math.sqrt(msw / 2 * (1/n1 + 1/n2));

                // Studentized Range critical values at alpha=0.05
                // Table indexed by [k (groups)][df], covering common cases
                const qCritTable = {
                    2: { 5: 3.64, 10: 3.15, 15: 3.01, 20: 2.95, 30: 2.89, 60: 2.83, 120: 2.80 },
                    3: { 5: 4.60, 10: 3.88, 15: 3.67, 20: 3.58, 30: 3.49, 60: 3.40, 120: 3.36 },
                    4: { 5: 5.22, 10: 4.33, 15: 4.08, 20: 3.96, 30: 3.85, 60: 3.74, 120: 3.68 },
                    5: { 5: 5.67, 10: 4.65, 15: 4.37, 20: 4.23, 30: 4.10, 60: 3.98, 120: 3.92 },
                    6: { 5: 6.03, 10: 4.91, 15: 4.60, 20: 4.45, 30: 4.30, 60: 4.16, 120: 4.10 },
                    7: { 5: 6.33, 10: 5.12, 15: 4.78, 20: 4.62, 30: 4.46, 60: 4.31, 120: 4.24 },
                    8: { 5: 6.58, 10: 5.30, 15: 4.94, 20: 4.77, 30: 4.60, 60: 4.44, 120: 4.36 }
                };

                // Look up critical value with interpolation for df
                let qCrit = 3.0; // Fallback
                const kRow = qCritTable[Math.min(k, 8)];
                if (kRow) {
                    const dfWithin = totalN - k;
                    const dfKeys = Object.keys(kRow).map(Number).sort((a, b) => a - b);
                    if (dfWithin >= dfKeys[dfKeys.length - 1]) {
                        qCrit = kRow[dfKeys[dfKeys.length - 1]];
                    } else if (dfWithin <= dfKeys[0]) {
                        qCrit = kRow[dfKeys[0]];
                    } else {
                        // Linear interpolation between nearest df values
                        for (let idx = 0; idx < dfKeys.length - 1; idx++) {
                            if (dfWithin >= dfKeys[idx] && dfWithin <= dfKeys[idx + 1]) {
                                const frac = (dfWithin - dfKeys[idx]) / (dfKeys[idx + 1] - dfKeys[idx]);
                                qCrit = kRow[dfKeys[idx]] * (1 - frac) + kRow[dfKeys[idx + 1]] * frac;
                                break;
                            }
                        }
                    }
                }

                comparisons.push({
                    group1: i + 1,
                    group2: j + 1,
                    meanDifference: mean1 - mean2,
                    qStatistic: qStat,
                    qCritical: qCrit,
                    significant: qStat > qCrit
                });
            }
        }

        return comparisons;
    }

    /**
     * Calculate Pearson correlation coefficient
     *
     * @param {array} x - First variable
     * @param {array} y - Second variable
     * @returns {object} Correlation results
     */
    pearsonCorrelation(x, y, options = {}) {
        if (x.length !== y.length) {
            throw new Error('Arrays must have equal length');
        }

        const { confidenceLevel = 0.95 } = options;
        const n = x.length;

        const meanX = this.mean(x);
        const meanY = this.mean(y);

        const covXY = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / n;
        const stdX = Math.sqrt(this.variance(x));
        const stdY = Math.sqrt(this.variance(y));

        const r = covXY / (stdX * stdY);

        // Test significance
        const tStat = r * Math.sqrt((n - 2) / (1 - r * r));
        const df = n - 2;
        const pValue = this.calculatePValue(tStat, df, 'two-sided');

        // Fisher's z-transformation for confidence interval
        const z = 0.5 * Math.log((1 + r) / (1 - r));
        const seZ = 1 / Math.sqrt(n - 3);
        const alpha = 1 - confidenceLevel;
        const zCrit = typeof jStat !== 'undefined'
            ? jStat.normal.inv(1 - alpha / 2, 0, 1)
            : 1.96;
        const ciZ = {
            lower: z - zCrit * seZ,
            upper: z + zCrit * seZ
        };

        // Transform back to r
        const ci = {
            lower: (Math.exp(2 * ciZ.lower) - 1) / (Math.exp(2 * ciZ.lower) + 1),
            upper: (Math.exp(2 * ciZ.upper) - 1) / (Math.exp(2 * ciZ.upper) + 1)
        };

        return {
            test: 'Pearson Correlation',
            correlation: r,
            rSquared: r * r,
            tStatistic: tStat,
            degreesOfFreedom: df,
            pValue,
            significant: pValue < (1 - confidenceLevel),
            confidenceInterval: ci,
            interpretation: this.interpretCorrelation(r),
            strength: this.correlationStrength(Math.abs(r))
        };
    }

    /**
     * Calculate Spearman rank correlation
     *
     * @param {array} x - First variable
     * @param {array} y - Second variable
     * @returns {object} Correlation results
     */
    spearmanCorrelation(x, y, options = {}) {
        if (x.length !== y.length) {
            throw new Error('Arrays must have equal length');
        }

        // Rank the data
        const ranksX = this.rankData(x);
        const ranksY = this.rankData(y);

        // Calculate Pearson correlation on ranks
        return {
            ...this.pearsonCorrelation(ranksX, ranksY, options),
            test: 'Spearman Rank Correlation'
        };
    }

    /**
     * Test for normality using Shapiro-Wilk test (simplified)
     *
     * @param {array} data - Data to test
     * @returns {object} Normality test results
     */
    normalityTest(data, options = {}) {
        const { test = 'shapiro-wilk', confidenceLevel = 0.95 } = options;

        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;

        if (n < 3) {
            return {
                test: 'Normality Test',
                error: 'Sample size too small (n < 3)'
            };
        }

        // Simplified Shapiro-Wilk test
        const mean = this.mean(data);
        const variance = this.variance(data);

        // Calculate skewness and kurtosis
        const stdDev = Math.sqrt(variance);
        const skewness = this.skewness(data, mean, stdDev);
        const kurtosis = this.kurtosis(data, mean, stdDev);

        // Approximate W statistic (simplified)
        const numerator = Math.pow(sorted.reduce((sum, val, i) => {
            const ai = this.shapiroWilkCoefficient(i + 1, n);
            return sum + ai * val;
        }, 0), 2);

        const denominator = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);

        const wStatistic = numerator / denominator;

        // P-value using log-transformation to normal (Royston 1995)
        let pValue;
        if (typeof jStat !== 'undefined' && wStatistic > 0 && wStatistic < 1) {
            const mu = -1.2725 + 1.0521 * Math.log(Math.log(n));
            const sigma = 1.0308 - 0.26758 * Math.log(Math.log(n));
            const z = (Math.log(1 - wStatistic) - mu) / sigma;
            pValue = 1 - jStat.normal.cdf(z, 0, 1);
        } else {
            // Fallback approximation
            pValue = 1 - Math.pow(wStatistic, n / 10);
        }

        return {
            test: 'Shapiro-Wilk Normality Test',
            wStatistic,
            pValue,
            isNormal: pValue > (1 - confidenceLevel),
            skewness,
            kurtosis,
            interpretation: {
                skewness: Math.abs(skewness) < 0.5 ? 'approximately symmetric' :
                         skewness > 0 ? 'right-skewed' : 'left-skewed',
                kurtosis: Math.abs(kurtosis) < 0.5 ? 'mesokurtic' :
                         kurtosis > 0 ? 'leptokurtic (heavy-tailed)' : 'platykurtic (light-tailed)'
            }
        };
    }

    /**
     * Detect outliers using multiple methods
     *
     * @param {array} data - Data to analyze
     * @returns {object} Outlier detection results
     */
    detectOutliers(data) {
        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;

        const q1 = this.percentile(sorted, 0.25);
        const q3 = this.percentile(sorted, 0.75);
        const iqr = q3 - q1;

        // IQR method
        const iqrLower = q1 - 1.5 * iqr;
        const iqrUpper = q3 + 1.5 * iqr;
        const iqrOutliers = data.filter(val => val < iqrLower || val > iqrUpper);

        // Z-score method
        const mean = this.mean(data);
        const std = Math.sqrt(this.variance(data));
        const zScores = data.map(val => Math.abs((val - mean) / std));
        const zOutliers = data.filter((val, i) => zScores[i] > 3);

        // Modified Z-score (using MAD)
        const median = this.median(sorted);
        const mad = this.mad(data, median);
        const modifiedZScores = data.map(val => Math.abs(0.6745 * (val - median) / mad));
        const madOutliers = data.filter((val, i) => modifiedZScores[i] > 3.5);

        return {
            methods: {
                iqr: {
                    method: 'Interquartile Range (IQR)',
                    bounds: { lower: iqrLower, upper: iqrUpper },
                    outliers: iqrOutliers,
                    count: iqrOutliers.length,
                    percentage: (iqrOutliers.length / n * 100).toFixed(2)
                },
                zscore: {
                    method: 'Z-Score (|z| > 3)',
                    outliers: zOutliers,
                    count: zOutliers.length,
                    percentage: (zOutliers.length / n * 100).toFixed(2)
                },
                modifiedZ: {
                    method: 'Modified Z-Score (MAD-based)',
                    outliers: madOutliers,
                    count: madOutliers.length,
                    percentage: (madOutliers.length / n * 100).toFixed(2)
                }
            },
            summary: {
                totalDataPoints: n,
                iqrOutlierCount: iqrOutliers.length,
                zScoreOutlierCount: zOutliers.length,
                madOutlierCount: madOutliers.length,
                recommendation: this.outlierRecommendation(
                    iqrOutliers.length,
                    zOutliers.length,
                    madOutliers.length,
                    n
                )
            }
        };
    }

    /**
     * Perform multiple comparison correction (Bonferroni)
     *
     * @param {array} pValues - Array of p-values
     * @param {number} alpha - Significance level
     * @returns {object} Corrected results
     */
    bonferroniCorrection(pValues, alpha = 0.05) {
        const m = pValues.length;
        const correctedAlpha = alpha / m;

        const results = pValues.map((p, i) => ({
            index: i,
            originalPValue: p,
            correctedAlpha,
            significant: p < correctedAlpha,
            rejectedNull: p < correctedAlpha
        }));

        return {
            method: 'Bonferroni Correction',
            numTests: m,
            originalAlpha: alpha,
            correctedAlpha,
            significantTests: results.filter(r => r.significant).length,
            results
        };
    }

    /**
     * Benjamini-Hochberg FDR correction
     *
     * @param {array} pValues - Array of p-values
     * @param {number} alpha - Target FDR rate (default 0.05)
     * @returns {object} Corrected results with adjusted p-values
     */
    benjaminiHochberg(pValues, alpha = 0.05) {
        const m = pValues.length;
        const indexed = pValues.map((p, i) => ({ p, i }));
        indexed.sort((a, b) => a.p - b.p);

        // Find largest k where p_(k) <= k * alpha / m
        let maxK = 0;
        for (let k = 0; k < m; k++) {
            if (indexed[k].p <= ((k + 1) * alpha) / m) {
                maxK = k + 1;
            }
        }

        // Calculate adjusted p-values (step-up)
        const adjustedP = new Array(m);
        let cumMin = 1;
        for (let k = m - 1; k >= 0; k--) {
            const rawAdjusted = (indexed[k].p * m) / (k + 1);
            cumMin = Math.min(cumMin, rawAdjusted);
            adjustedP[indexed[k].i] = Math.min(1, cumMin);
        }

        const results = pValues.map((p, i) => ({
            index: i,
            originalPValue: p,
            adjustedPValue: adjustedP[i],
            significant: i < maxK ? indexed.some(x => x.i === i && indexed.indexOf(x) < maxK) : false
        }));

        // Re-check significance using adjusted p-values
        for (const r of results) {
            r.significant = r.adjustedPValue < alpha;
        }

        return {
            method: 'Benjamini-Hochberg FDR',
            numTests: m,
            alpha,
            significantTests: results.filter(r => r.significant).length,
            results
        };
    }

    /**
     * Holm-Bonferroni step-down correction
     *
     * @param {array} pValues - Array of p-values
     * @param {number} alpha - Significance level (default 0.05)
     * @returns {object} Corrected results
     */
    holmBonferroni(pValues, alpha = 0.05) {
        const m = pValues.length;
        const indexed = pValues.map((p, i) => ({ p, i }));
        indexed.sort((a, b) => a.p - b.p);

        // Calculate adjusted p-values (step-down)
        const adjustedP = new Array(m);
        let cumMax = 0;
        for (let k = 0; k < m; k++) {
            const rawAdjusted = indexed[k].p * (m - k);
            cumMax = Math.max(cumMax, rawAdjusted);
            adjustedP[indexed[k].i] = Math.min(1, cumMax);
        }

        const results = pValues.map((p, i) => ({
            index: i,
            originalPValue: p,
            adjustedPValue: adjustedP[i],
            significant: adjustedP[i] < alpha
        }));

        return {
            method: 'Holm-Bonferroni',
            numTests: m,
            alpha,
            significantTests: results.filter(r => r.significant).length,
            results
        };
    }

    // Statistical utility functions

    mean(data) {
        return data.reduce((sum, val) => sum + val, 0) / data.length;
    }

    median(sortedData) {
        const n = sortedData.length;
        const mid = Math.floor(n / 2);
        return n % 2 === 0 ? (sortedData[mid - 1] + sortedData[mid]) / 2 : sortedData[mid];
    }

    mode(data) {
        const freq = {};
        let maxFreq = 0;
        let modes = [];

        for (const val of data) {
            freq[val] = (freq[val] || 0) + 1;
            if (freq[val] > maxFreq) {
                maxFreq = freq[val];
                modes = [val];
            } else if (freq[val] === maxFreq) {
                modes.push(val);
            }
        }

        return modes.length === data.length ? null : modes;
    }

    variance(data, mean = null) {
        if (data.length < 2) return 0;
        const m = mean !== null ? mean : this.mean(data);
        return data.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / (data.length - 1);
    }

    skewness(data, mean, std) {
        if (std === 0) return 0;
        const n = data.length;
        const m3 = data.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / n;
        return m3;
    }

    kurtosis(data, mean, std) {
        if (std === 0) return 0;
        const n = data.length;
        const m4 = data.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / n;
        return m4 - 3; // Excess kurtosis
    }

    percentile(sortedData, p) {
        const n = sortedData.length;
        const index = p * (n - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;

        if (upper >= n) return sortedData[n - 1];
        if (lower < 0) return sortedData[0];

        return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
    }

    iqr(sortedData) {
        return this.percentile(sortedData, 0.75) - this.percentile(sortedData, 0.25);
    }

    mad(data, median) {
        const deviations = data.map(val => Math.abs(val - median));
        return this.median([...deviations].sort((a, b) => a - b));
    }

    rankData(data) {
        const indexed = data.map((val, i) => ({ val, i }));
        indexed.sort((a, b) => a.val - b.val);

        const ranks = new Array(data.length);
        let i = 0;

        while (i < indexed.length) {
            let j = i;
            // Handle ties
            while (j < indexed.length && indexed[j].val === indexed[i].val) {
                j++;
            }

            const rank = (i + j + 1) / 2;
            for (let k = i; k < j; k++) {
                ranks[indexed[k].i] = rank;
            }

            i = j;
        }

        return ranks;
    }

    shapiroWilkCoefficient(i, n) {
        // Shapiro-Wilk 'a' coefficients using Royston (1995) approximation
        // Uses normal order statistics via jStat when available
        if (typeof jStat !== 'undefined') {
            const m = jStat.normal.inv((i - 0.375) / (n + 0.25), 0, 1);
            // Normalize coefficients
            const mValues = [];
            for (let k = 1; k <= n; k++) {
                mValues.push(jStat.normal.inv((k - 0.375) / (n + 0.25), 0, 1));
            }
            const sumSq = mValues.reduce((s, v) => s + v * v, 0);
            return m / Math.sqrt(sumSq);
        }
        // Fallback: simplified sign-based coefficient
        return i <= n / 2 ? 1 : -1;
    }

    calculatePValue(tStat, df, alternative) {
        const absTStat = Math.abs(tStat);
        if (typeof jStat !== 'undefined') {
            const p = 2 * (1 - jStat.studentt.cdf(absTStat, df));
            if (alternative === 'two-sided') return p;
            if (alternative === 'greater') return tStat > 0 ? p / 2 : 1 - p / 2;
            if (alternative === 'less') return tStat < 0 ? p / 2 : 1 - p / 2;
            return p;
        }
        // Fallback without jStat
        const p = 2 * (1 - this._fallbackTCDF(absTStat, df));
        if (alternative === 'two-sided') return p;
        return p / 2;
    }

    tDistributionCDF(t, df) {
        if (typeof jStat !== 'undefined') {
            return jStat.studentt.cdf(t, df);
        }
        return this._fallbackTCDF(t, df);
    }

    _fallbackTCDF(t, df) {
        // Abramowitz & Stegun approximation (used only when jStat unavailable)
        const x = df / (df + t * t);
        return 1 - 0.5 * Math.pow(x, df / 2);
    }

    tCriticalValue(df, confidenceLevel) {
        if (typeof jStat !== 'undefined') {
            const alpha = 1 - confidenceLevel;
            return jStat.studentt.inv(1 - alpha / 2, df);
        }
        // Fallback lookup table
        if (df > 30) return 1.96;
        if (df > 20) return 2.086;
        if (df > 10) return 2.228;
        return 2.5;
    }

    fDistributionPValue(f, df1, df2) {
        if (typeof jStat !== 'undefined') {
            return 1 - jStat.centralF.cdf(f, df1, df2);
        }
        // Fallback: rough approximation (NOT for publication)
        console.warn('fDistributionPValue: jStat not loaded, using rough approximation');
        return Math.exp(-f / 5);
    }

    interpretCohenD(d) {
        const abs = Math.abs(d);
        if (abs < 0.2) return 'negligible';
        if (abs < 0.5) return 'small';
        if (abs < 0.8) return 'medium';
        return 'large';
    }

    interpretEtaSquared(eta) {
        if (eta < 0.01) return 'negligible';
        if (eta < 0.06) return 'small';
        if (eta < 0.14) return 'medium';
        return 'large';
    }

    interpretCorrelation(r) {
        const abs = Math.abs(r);
        let strength = this.correlationStrength(abs);
        let direction = r > 0 ? 'positive' : r < 0 ? 'negative' : 'no';
        return `${strength} ${direction} correlation`;
    }

    correlationStrength(absR) {
        if (absR < 0.1) return 'negligible';
        if (absR < 0.3) return 'weak';
        if (absR < 0.5) return 'moderate';
        if (absR < 0.7) return 'strong';
        return 'very strong';
    }

    outlierRecommendation(iqrCount, zCount, madCount, n) {
        const avgCount = (iqrCount + zCount + madCount) / 3;
        const percentage = (avgCount / n) * 100;

        if (percentage < 1) return 'Few outliers detected. Data appears clean.';
        if (percentage < 5) return 'Some outliers detected. Consider investigation.';
        if (percentage < 10) return 'Moderate outliers. Review data quality.';
        return 'Many outliers detected. Investigate data collection process.';
    }

    generateId(prefix) {
        return `${prefix}_${crypto.randomUUID()}`;
    }

    async save() {
        try {
            const data = {
                analyses: Array.from(this.analyses.entries()),
                datasets: Array.from(this.datasets.entries())
            };
            localStorage.setItem('rag_statistical_analyses', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving analyses:', error);
        }
    }

    // Getters
    getAnalysis(id) {
        return this.analyses.get(id);
    }

    getAllAnalyses() {
        return Array.from(this.analyses.values());
    }

    getDataset(id) {
        return this.datasets.get(id);
    }

    getAllDatasets() {
        return Array.from(this.datasets.values());
    }
}

// Initialize and export
window.statisticalAnalyzer = new StatisticalAnalyzer();
console.log('✅ Statistical Analyzer module loaded');
