/**
 * LaTeX Export Engine
 *
 * Generates publication-quality LaTeX tables and report sections.
 * Supports IEEE Transactions, ACM conference, and booktabs styles.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class LaTeXExporter {
    constructor() {
        this.templates = {
            ieee: {
                tableEnv: 'table',
                centering: '\\centering',
                tabular: 'tabular',
                toprule: '\\hline',
                midrule: '\\hline',
                bottomrule: '\\hline',
                captionPosition: 'top'
            },
            acm: {
                tableEnv: 'table',
                centering: '\\centering',
                tabular: 'tabular',
                toprule: '\\toprule',
                midrule: '\\midrule',
                bottomrule: '\\bottomrule',
                captionPosition: 'top'
            },
            booktabs: {
                tableEnv: 'table',
                centering: '\\centering',
                tabular: 'tabular',
                toprule: '\\toprule',
                midrule: '\\midrule',
                bottomrule: '\\bottomrule',
                captionPosition: 'bottom'
            }
        };
    }

    /**
     * Generate a LaTeX table
     *
     * @param {object} data - {headers: string[], rows: any[][], caption, label}
     * @param {string} style - 'ieee'|'acm'|'booktabs'
     * @returns {string} LaTeX source
     */
    table(data, style = 'booktabs') {
        const tmpl = this.templates[style] || this.templates.booktabs;
        const { headers, rows, caption, label } = data;

        // Auto-detect column alignment
        const colSpec = headers.map((_, i) => {
            if (i === 0) return 'l';
            // Check if column is numeric
            const isNumeric = rows.every(row => typeof row[i] === 'number' || !isNaN(parseFloat(row[i])));
            return isNumeric ? 'r' : 'c';
        }).join('');

        let tex = `\\begin{${tmpl.tableEnv}}[htbp]\n`;
        tex += `  ${tmpl.centering}\n`;

        if (tmpl.captionPosition === 'top') {
            tex += `  \\caption{${this._escape(caption || 'Results')}}\n`;
            tex += `  \\label{tab:${this._sanitizeLabel(label || 'results')}}\n`;
        }

        tex += `  \\begin{${tmpl.tabular}}{${colSpec}}\n`;
        tex += `    ${tmpl.toprule}\n`;

        // Header row
        tex += '    ' + headers.map(h => `\\textbf{${this._escape(h)}}`).join(' & ') + ' \\\\\n';
        tex += `    ${tmpl.midrule}\n`;

        // Data rows
        for (const row of rows) {
            tex += '    ' + row.map((cell, i) => this._formatCell(cell, i)).join(' & ') + ' \\\\\n';
        }

        tex += `    ${tmpl.bottomrule}\n`;
        tex += `  \\end{${tmpl.tabular}}\n`;

        if (tmpl.captionPosition === 'bottom') {
            tex += `  \\caption{${this._escape(caption || 'Results')}}\n`;
            tex += `  \\label{tab:${this._sanitizeLabel(label || 'results')}}\n`;
        }

        tex += `\\end{${tmpl.tableEnv}}\n`;
        return tex;
    }

    /**
     * Export statistical test results as LaTeX table
     *
     * @param {array} testResults - Array of t-test result objects
     * @param {string} style
     * @returns {string}
     */
    statisticalResultsTable(testResults, style = 'booktabs') {
        const headers = ['Comparison', '$t$', '$df$', '$p$-value', "Cohen's $d$", 'Sig.'];

        const rows = testResults.map(r => {
            const sample1 = r.sample1Name || r.experiment1 || 'Group 1';
            const sample2 = r.sample2Name || r.experiment2 || 'Group 2';
            return [
                `${sample1} vs ${sample2}`,
                (r.tStatistic || r.tStat || 0).toFixed(3),
                (r.degreesOfFreedom || r.df || 0).toFixed(1),
                this._formatPValue(r.pValue),
                (r.effectSize?.cohensD || r.effectSize || 0).toFixed(3),
                (r.significant || (r.pValue < 0.05)) ? '$\\checkmark$' : ''
            ];
        });

        return this.table({
            headers, rows,
            caption: 'Statistical Significance Tests',
            label: 'stat_tests'
        }, style);
    }

    /**
     * Export RAGAS evaluation results as LaTeX table
     *
     * @param {object} ragasResults - Output from ragasEvaluator.evaluateBatch()
     * @param {string} style
     * @returns {string}
     */
    ragasResultsTable(ragasResults, style = 'booktabs') {
        const headers = ['Metric', 'Mean', 'Std', 'Min', 'Max', '$n$'];
        const metrics = ['faithfulness', 'answerRelevancy', 'contextPrecision', 'contextRecall', 'overall'];
        const labels = ['Faithfulness', 'Answer Relevancy', 'Context Precision', 'Context Recall', 'Overall'];

        const agg = ragasResults.aggregate || ragasResults;

        const rows = metrics.map((m, i) => {
            const a = agg[m];
            if (!a || a.n === 0) return [labels[i], '--', '--', '--', '--', 0];
            return [labels[i], a.mean, a.std, a.min, a.max, a.n];
        });

        return this.table({
            headers, rows,
            caption: 'RAGAS Evaluation Results',
            label: 'ragas_results'
        }, style);
    }

    /**
     * Export NLP metrics comparison table
     *
     * @param {array} results - [{name, bleu, rouge1, rouge2, rougeL, mrr, ndcg, map}, ...]
     * @param {string} style
     * @returns {string}
     */
    nlpMetricsTable(results, style = 'booktabs') {
        const headers = ['Configuration', 'BLEU', 'ROUGE-1', 'ROUGE-2', 'ROUGE-L', 'MRR', 'NDCG', 'MAP'];

        const rows = results.map(r => [
            r.name,
            r.bleu, r.rouge1, r.rouge2, r.rougeL,
            r.mrr, r.ndcg, r.map
        ]);

        return this.table({
            headers, rows,
            caption: 'NLP and IR Metrics Comparison',
            label: 'nlp_metrics'
        }, style);
    }

    /**
     * Export power analysis results as LaTeX table
     *
     * @param {array} analyses - Array of power analysis result objects
     * @param {string} style
     * @returns {string}
     */
    powerAnalysisTable(analyses, style = 'booktabs') {
        const headers = ['Test', 'Effect Size', '$\\alpha$', 'Power', '$n$ (per group)', 'Total $N$'];

        const rows = analyses.map(a => [
            a.test || 't-test',
            a.effectSize,
            a.alpha || 0.05,
            (a.power || a.sampleSize?.power || 0.80),
            a.sampleSize?.perGroup || a.n,
            a.sampleSize?.total || (a.n * 2)
        ]);

        return this.table({
            headers, rows,
            caption: 'Statistical Power Analysis',
            label: 'power_analysis'
        }, style);
    }

    /**
     * Generate complete LaTeX section for an experiment
     *
     * @param {object} experiment - Experiment metadata
     * @param {object} results - {statistical, ragas, nlp}
     * @param {string} style
     * @returns {string}
     */
    experimentSection(experiment, results, style = 'booktabs') {
        let tex = `\\subsection{${this._escape(experiment.name || 'Experiment')}}\n\n`;

        if (experiment.description) {
            tex += `${this._escape(experiment.description)}\n\n`;
        }

        if (results.statistical && results.statistical.length > 0) {
            tex += this.statisticalResultsTable(results.statistical, style);
            tex += '\n';
        }

        if (results.ragas) {
            tex += this.ragasResultsTable(results.ragas, style);
            tex += '\n';
        }

        if (results.nlp && results.nlp.length > 0) {
            tex += this.nlpMetricsTable(results.nlp, style);
        }

        return tex;
    }

    /**
     * Export results as CSV string
     *
     * @param {object} data - {headers: string[], rows: any[][]}
     * @returns {string}
     */
    toCSV(data) {
        const { headers, rows } = data;
        const csvRows = [headers.join(',')];
        for (const row of rows) {
            csvRows.push(row.map(cell => {
                const str = typeof cell === 'number' ? cell.toFixed(4) : String(cell);
                return str.includes(',') ? `"${str}"` : str;
            }).join(','));
        }
        return csvRows.join('\n');
    }

    /**
     * Download content as file
     *
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    download(content, filename = 'results.tex', mimeType = 'text/x-latex') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Download as CSV
     */
    downloadCSV(data, filename = 'results.csv') {
        this.download(this.toCSV(data), filename, 'text/csv');
    }

    // Formatting helpers

    _formatCell(cell, colIndex) {
        if (cell === null || cell === undefined) return '--';
        if (typeof cell === 'number') {
            if (Number.isInteger(cell)) return String(cell);
            return cell.toFixed(4);
        }
        return this._escape(String(cell));
    }

    _formatPValue(p) {
        if (p === null || p === undefined) return '--';
        if (p < 0.001) return '$< 0.001$';
        if (p < 0.01) return p.toFixed(3);
        return p.toFixed(3);
    }

    _escape(text) {
        if (!text) return '';
        return String(text)
            .replace(/\\/g, '\\textbackslash{}')
            .replace(/&/g, '\\&')
            .replace(/%/g, '\\%')
            .replace(/\$/g, '\\$')
            .replace(/#/g, '\\#')
            .replace(/_/g, '\\_')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/~/g, '\\textasciitilde{}')
            .replace(/\^/g, '\\textasciicircum{}');
    }

    _sanitizeLabel(label) {
        return String(label).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    }
}

window.latexExporter = new LaTeXExporter();
console.log('✅ LaTeX Exporter module loaded');
