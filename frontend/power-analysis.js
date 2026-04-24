/**
 * Statistical Power Analysis Module
 *
 * Provides sample size determination, post-hoc power calculations,
 * and minimum detectable effect size computations for research planning.
 * Requires jStat for distribution functions.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class PowerAnalysis {
    constructor() {
        this.hasJStat = typeof jStat !== 'undefined';
        if (!this.hasJStat) {
            console.warn('PowerAnalysis: jStat not loaded, calculations will use approximations');
        }
    }

    /**
     * Required sample size per group for two-sample t-test
     *
     * @param {number} effectSize - Cohen's d (0.2=small, 0.5=medium, 0.8=large)
     * @param {number} alpha - Significance level (default 0.05)
     * @param {number} power - Statistical power (default 0.80)
     * @param {string} alternative - 'two-sided' or 'one-sided'
     * @returns {object} {perGroup, total, effectSize, alpha, power}
     */
    requiredSampleSize(effectSize, alpha = 0.05, power = 0.80, alternative = 'two-sided') {
        if (effectSize <= 0) {
            throw new Error('Effect size must be positive');
        }

        const zAlpha = alternative === 'two-sided'
            ? this._zInv(1 - alpha / 2)
            : this._zInv(1 - alpha);
        const zBeta = this._zInv(power);

        const n = Math.ceil(Math.pow((zAlpha + zBeta) / effectSize, 2));

        return {
            perGroup: n,
            total: n * 2,
            effectSize,
            alpha,
            power,
            alternative,
            formula: `n = ((z_α + z_β) / d)² = ((${zAlpha.toFixed(3)} + ${zBeta.toFixed(3)}) / ${effectSize})² = ${n}`
        };
    }

    /**
     * Achieved power for given sample size (post-hoc)
     *
     * @param {number} n - Sample size per group
     * @param {number} effectSize - Cohen's d
     * @param {number} alpha - Significance level
     * @param {string} alternative - 'two-sided' or 'one-sided'
     * @returns {object} {power, n, effectSize, alpha}
     */
    achievedPower(n, effectSize, alpha = 0.05, alternative = 'two-sided') {
        const zAlpha = alternative === 'two-sided'
            ? this._zInv(1 - alpha / 2)
            : this._zInv(1 - alpha);

        const zBeta = effectSize * Math.sqrt(n) - zAlpha;
        const power = this._normalCDF(zBeta);

        return {
            power: Math.max(0, Math.min(1, power)),
            n,
            effectSize,
            alpha,
            alternative,
            adequate: power >= 0.80,
            interpretation: power >= 0.80
                ? `Adequate power (${(power * 100).toFixed(1)}%) to detect d=${effectSize}`
                : `Insufficient power (${(power * 100).toFixed(1)}%). Consider n=${this.requiredSampleSize(effectSize, alpha, 0.80, alternative).perGroup} per group.`
        };
    }

    /**
     * Minimum detectable effect size
     *
     * @param {number} n - Sample size per group
     * @param {number} alpha - Significance level
     * @param {number} power - Desired power
     * @param {string} alternative - 'two-sided' or 'one-sided'
     * @returns {object} {mde, n, alpha, power}
     */
    minimumDetectableEffect(n, alpha = 0.05, power = 0.80, alternative = 'two-sided') {
        const zAlpha = alternative === 'two-sided'
            ? this._zInv(1 - alpha / 2)
            : this._zInv(1 - alpha);
        const zBeta = this._zInv(power);

        const mde = (zAlpha + zBeta) / Math.sqrt(n);

        return {
            mde,
            n,
            alpha,
            power,
            alternative,
            interpretation: `With n=${n} per group, the smallest detectable effect is d=${mde.toFixed(3)} (${this._interpretCohenD(mde)})`
        };
    }

    /**
     * Power analysis for one-way ANOVA
     *
     * @param {number} k - Number of groups
     * @param {number} n - Sample size per group
     * @param {number} f - Cohen's f effect size (0.10=small, 0.25=medium, 0.40=large)
     * @param {number} alpha - Significance level
     * @returns {object} {power, k, n, f, alpha}
     */
    anovaPower(k, n, f, alpha = 0.05) {
        // Non-centrality parameter: λ = n * k * f²
        const lambda = n * k * f * f;
        const dfBetween = k - 1;
        const dfWithin = k * (n - 1);

        // Critical F-value
        let fCrit, power;
        if (this.hasJStat) {
            fCrit = jStat.centralF.inv(1 - alpha, dfBetween, dfWithin);
            // Power = P(F > fCrit | non-central F with λ)
            // Approximate using non-central chi-squared
            const chiCrit = fCrit * dfBetween;
            const ncChiDf = dfBetween;
            // Use normal approximation to non-central chi-squared
            const z = (Math.sqrt(2 * chiCrit) - Math.sqrt(2 * ncChiDf + 2 * lambda - 1));
            power = 1 - jStat.normal.cdf(z, 0, 1);
        } else {
            // Rough approximation
            fCrit = 3.0; // approximate for moderate df
            power = 1 - Math.exp(-lambda / (2 * k));
        }

        return {
            power: Math.max(0, Math.min(1, power)),
            k,
            n,
            f,
            alpha,
            totalN: k * n,
            adequate: power >= 0.80,
            requiredN: this._anovaRequiredN(k, f, alpha, 0.80)
        };
    }

    /**
     * Required sample size per group for ANOVA
     */
    _anovaRequiredN(k, f, alpha, targetPower) {
        // Iterative search
        for (let n = 3; n <= 1000; n++) {
            const result = this.anovaPower(k, n, f, alpha);
            if (result.power >= targetPower) return n;
        }
        return '>1000';
    }

    /**
     * Generate power analysis report for research paper
     * @returns {object}
     */
    generateReport(specs) {
        const results = specs.map(spec => {
            if (spec.test === 'ttest') {
                return {
                    ...spec,
                    sampleSize: this.requiredSampleSize(spec.effectSize, spec.alpha, spec.power),
                    postHoc: spec.n ? this.achievedPower(spec.n, spec.effectSize, spec.alpha) : null
                };
            } else if (spec.test === 'anova') {
                return {
                    ...spec,
                    power: this.anovaPower(spec.k, spec.n, spec.effectSize, spec.alpha)
                };
            }
            return spec;
        });

        return {
            generatedAt: new Date().toISOString(),
            analyses: results
        };
    }

    // Internal helpers

    _zInv(p) {
        if (this.hasJStat) {
            return jStat.normal.inv(p, 0, 1);
        }
        // Rational approximation (Abramowitz & Stegun 26.2.23)
        if (p <= 0) return -Infinity;
        if (p >= 1) return Infinity;
        if (p === 0.5) return 0;

        const t = p < 0.5
            ? Math.sqrt(-2 * Math.log(p))
            : Math.sqrt(-2 * Math.log(1 - p));

        const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
        const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;

        const z = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
        return p < 0.5 ? -z : z;
    }

    _normalCDF(z) {
        if (this.hasJStat) {
            return jStat.normal.cdf(z, 0, 1);
        }
        // Approximation
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.3989423 * Math.exp(-z * z / 2);
        const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return z > 0 ? 1 - prob : prob;
    }

    _interpretCohenD(d) {
        const abs = Math.abs(d);
        if (abs < 0.2) return 'negligible';
        if (abs < 0.5) return 'small';
        if (abs < 0.8) return 'medium';
        return 'large';
    }
}

window.powerAnalysis = new PowerAnalysis();
console.log('✅ Power Analysis module loaded');
