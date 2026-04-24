/**
 * Chart Visualization Manager
 *
 * Provides unified charting utilities for research features using Chart.js
 * Handles chart creation, updates, themes, and export functionality
 */

class ChartVisualizationManager {
    constructor(config = {}) {
        this.config = {
            theme: config.theme || 'light',
            defaultHeight: config.defaultHeight || 300,
            enableAnimations: config.enableAnimations !== false,
            enableResponsive: config.enableResponsive !== false,
            enableExport: config.enableExport !== false
        };

        this.charts = new Map(); // Store chart instances
        this.colorSchemes = this.initializeColorSchemes();
    }

    /**
     * Initialize color schemes for different themes
     */
    initializeColorSchemes() {
        return {
            light: {
                primary: '#3b82f6',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                info: '#06b6d4',
                purple: '#8b5cf6',
                pink: '#ec4899',
                indigo: '#6366f1',
                gray: '#6b7280',
                background: '#ffffff',
                text: '#1f2937',
                grid: '#e5e7eb',
                palette: [
                    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
                    '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'
                ]
            },
            dark: {
                primary: '#60a5fa',
                success: '#34d399',
                warning: '#fbbf24',
                danger: '#f87171',
                info: '#22d3ee',
                purple: '#a78bfa',
                pink: '#f472b6',
                indigo: '#818cf8',
                gray: '#9ca3af',
                background: '#1f2937',
                text: '#f9fafb',
                grid: '#374151',
                palette: [
                    '#60a5fa', '#34d399', '#fbbf24', '#f87171',
                    '#a78bfa', '#f472b6', '#22d3ee', '#818cf8'
                ]
            }
        };
    }

    /**
     * Get current color scheme
     */
    getColors() {
        return this.colorSchemes[this.config.theme];
    }

    /**
     * Create a line chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     * @param {Object} options - Additional options
     */
    createLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element not found: ${canvasId}`);
            return null;
        }

        const ctx = canvas.getContext('2d');
        const colors = this.getColors();

        const chartConfig = {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: (data.datasets || []).map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data,
                    borderColor: dataset.color || colors.palette[index % colors.palette.length],
                    backgroundColor: this.addAlpha(
                        dataset.color || colors.palette[index % colors.palette.length],
                        0.1
                    ),
                    borderWidth: dataset.borderWidth || 2,
                    tension: dataset.tension !== undefined ? dataset.tension : 0.4,
                    fill: dataset.fill !== undefined ? dataset.fill : true,
                    pointRadius: dataset.pointRadius !== undefined ? dataset.pointRadius : 3,
                    pointHoverRadius: dataset.pointHoverRadius || 5
                }))
            },
            options: this.getDefaultOptions(options, colors)
        };

        const chart = new Chart(ctx, chartConfig);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Create a bar chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     * @param {Object} options - Additional options
     */
    createBarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element not found: ${canvasId}`);
            return null;
        }

        const ctx = canvas.getContext('2d');
        const colors = this.getColors();

        const chartConfig = {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: (data.datasets || []).map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data,
                    backgroundColor: dataset.colors || colors.palette[index % colors.palette.length],
                    borderColor: dataset.borderColor || colors.palette[index % colors.palette.length],
                    borderWidth: dataset.borderWidth || 1,
                    borderRadius: dataset.borderRadius || 4
                }))
            },
            options: {
                ...this.getDefaultOptions(options, colors),
                scales: {
                    y: {
                        beginAtZero: true,
                        ...options.yAxis
                    },
                    x: options.xAxis || {}
                }
            }
        };

        const chart = new Chart(ctx, chartConfig);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Create a radar chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     * @param {Object} options - Additional options
     */
    createRadarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element not found: ${canvasId}`);
            return null;
        }

        const ctx = canvas.getContext('2d');
        const colors = this.getColors();

        const chartConfig = {
            type: 'radar',
            data: {
                labels: data.labels || [],
                datasets: (data.datasets || []).map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data,
                    backgroundColor: this.addAlpha(
                        dataset.color || colors.palette[index % colors.palette.length],
                        0.2
                    ),
                    borderColor: dataset.color || colors.palette[index % colors.palette.length],
                    borderWidth: dataset.borderWidth || 2,
                    pointRadius: dataset.pointRadius || 3,
                    pointHoverRadius: dataset.pointHoverRadius || 5
                }))
            },
            options: {
                ...this.getDefaultOptions(options, colors),
                scales: {
                    r: {
                        beginAtZero: true,
                        max: options.maxValue || 100,
                        ticks: {
                            stepSize: options.stepSize || 20
                        }
                    }
                }
            }
        };

        const chart = new Chart(ctx, chartConfig);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Create a doughnut/pie chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     * @param {Object} options - Additional options
     */
    createDoughnutChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element not found: ${canvasId}`);
            return null;
        }

        const ctx = canvas.getContext('2d');
        const colors = this.getColors();

        const chartConfig = {
            type: options.type || 'doughnut', // 'doughnut' or 'pie'
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: data.colors || colors.palette,
                    borderColor: colors.background,
                    borderWidth: 2
                }]
            },
            options: {
                ...this.getDefaultOptions(options, colors),
                cutout: options.cutout || '60%' // For doughnut
            }
        };

        const chart = new Chart(ctx, chartConfig);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Create a scatter plot
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     * @param {Object} options - Additional options
     */
    createScatterPlot(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element not found: ${canvasId}`);
            return null;
        }

        const ctx = canvas.getContext('2d');
        const colors = this.getColors();

        const chartConfig = {
            type: 'scatter',
            data: {
                datasets: (data.datasets || []).map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data, // Array of {x, y} objects
                    backgroundColor: dataset.color || colors.palette[index % colors.palette.length],
                    borderColor: dataset.color || colors.palette[index % colors.palette.length],
                    pointRadius: dataset.pointRadius || 5,
                    pointHoverRadius: dataset.pointHoverRadius || 7
                }))
            },
            options: {
                ...this.getDefaultOptions(options, colors),
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: options.xLabel || 'X Axis'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: options.yLabel || 'Y Axis'
                        }
                    }
                }
            }
        };

        const chart = new Chart(ctx, chartConfig);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Get default chart options
     */
    getDefaultOptions(customOptions, colors) {
        return {
            responsive: this.config.enableResponsive,
            maintainAspectRatio: customOptions.maintainAspectRatio !== false,
            plugins: {
                legend: {
                    display: customOptions.showLegend !== false,
                    position: customOptions.legendPosition || 'top',
                    labels: {
                        color: colors.text,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: colors.background === '#ffffff' ? '#1f2937' : '#ffffff',
                    titleColor: colors.background === '#ffffff' ? '#ffffff' : '#1f2937',
                    bodyColor: colors.background === '#ffffff' ? '#ffffff' : '#1f2937',
                    borderColor: colors.grid,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: customOptions.tooltipCallbacks || {}
                },
                title: {
                    display: !!customOptions.title,
                    text: customOptions.title || '',
                    color: colors.text,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            animation: {
                duration: this.config.enableAnimations ? 1000 : 0
            },
            scales: customOptions.scales || {},
            ...customOptions
        };
    }

    /**
     * Update existing chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} newData - New chart data
     */
    updateChart(canvasId, newData) {
        const chart = this.charts.get(canvasId);
        if (!chart) {
            console.error(`Chart not found: ${canvasId}`);
            return;
        }

        if (newData.labels) {
            chart.data.labels = newData.labels;
        }

        if (newData.datasets) {
            chart.data.datasets = newData.datasets;
        }

        chart.update();
    }

    /**
     * Destroy chart
     * @param {string} canvasId - Canvas element ID
     */
    destroyChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.destroy();
            this.charts.delete(canvasId);
        }
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }

    /**
     * Export chart as image
     * @param {string} canvasId - Canvas element ID
     * @param {string} filename - Export filename
     */
    exportChartAsImage(canvasId, filename = 'chart.png') {
        const chart = this.charts.get(canvasId);
        if (!chart) {
            console.error(`Chart not found: ${canvasId}`);
            return;
        }

        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
    }

    /**
     * Add alpha transparency to color
     * @param {string} color - Hex color
     * @param {number} alpha - Alpha value (0-1)
     */
    addAlpha(color, alpha) {
        // Convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Set theme
     * @param {string} theme - 'light' or 'dark'
     */
    setTheme(theme) {
        this.config.theme = theme;
        // Recreate all charts with new theme
        const chartData = new Map();
        this.charts.forEach((chart, id) => {
            chartData.set(id, {
                type: chart.config.type,
                data: chart.data,
                options: chart.options
            });
        });

        this.destroyAllCharts();

        chartData.forEach((config, id) => {
            // Recreate chart based on type
            const method = `create${config.type.charAt(0).toUpperCase() + config.type.slice(1)}Chart`;
            if (this[method]) {
                this[method](id, config.data, config.options);
            }
        });
    }

    /**
     * Get chart instance
     * @param {string} canvasId - Canvas element ID
     */
    getChart(canvasId) {
        return this.charts.get(canvasId);
    }

    /**
     * Check if chart exists
     * @param {string} canvasId - Canvas element ID
     */
    hasChart(canvasId) {
        return this.charts.has(canvasId);
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ChartVisualizationManager = ChartVisualizationManager;
}
