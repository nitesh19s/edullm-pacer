/**
 * Cross-Subject Advanced Analytics
 * Analyzes learning patterns across subjects, identifies interdisciplinary connections,
 * and provides insights for holistic educational research
 */

class CrossSubjectAnalyzer {
    constructor(database) {
        this.database = database;
        this.subjectCorrelations = new Map();
        this.interdisciplinaryMap = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the cross-subject analyzer
     */
    async initialize() {
        if (this.initialized) return;

        console.log('Initializing Cross-Subject Analyzer...');

        // Ensure database is ready
        if (!this.database.isInitialized()) {
            await this.database.initialize();
        }

        // Build interdisciplinary concept map
        await this.buildInterdisciplinaryMap();

        this.initialized = true;
        console.log('Cross-Subject Analyzer initialized successfully');
    }

    /**
     * Build map of interdisciplinary concept connections
     */
    async buildInterdisciplinaryMap() {
        // Define known interdisciplinary connections
        const connections = [
            // Math-Science connections
            {
                concepts: ['Algebra', 'Equations', 'Variables'],
                relatedSubjects: ['Mathematics', 'Physics', 'Chemistry'],
                connectionType: 'mathematical_foundation',
                strength: 0.9
            },
            {
                concepts: ['Graphs', 'Coordinate Geometry', 'Functions'],
                relatedSubjects: ['Mathematics', 'Physics'],
                connectionType: 'visualization',
                strength: 0.85
            },
            {
                concepts: ['Trigonometry', 'Angles'],
                relatedSubjects: ['Mathematics', 'Physics'],
                connectionType: 'measurement',
                strength: 0.8
            },
            {
                concepts: ['Statistics', 'Probability', 'Data Analysis'],
                relatedSubjects: ['Mathematics', 'Science', 'Social Science'],
                connectionType: 'analytical',
                strength: 0.75
            },
            {
                concepts: ['Ratios', 'Proportions', 'Percentage'],
                relatedSubjects: ['Mathematics', 'Chemistry', 'Economics'],
                connectionType: 'quantitative',
                strength: 0.7
            },
            // Physics-Chemistry connections
            {
                concepts: ['Atoms', 'Molecules', 'Matter'],
                relatedSubjects: ['Physics', 'Chemistry'],
                connectionType: 'structural',
                strength: 0.9
            },
            {
                concepts: ['Energy', 'Work', 'Power'],
                relatedSubjects: ['Physics', 'Chemistry'],
                connectionType: 'energy_systems',
                strength: 0.85
            },
            {
                concepts: ['Motion', 'Force', 'Velocity'],
                relatedSubjects: ['Physics', 'Mathematics'],
                connectionType: 'kinematic',
                strength: 0.8
            },
            // Biology-Chemistry connections
            {
                concepts: ['Chemical Reactions', 'Metabolism', 'Respiration'],
                relatedSubjects: ['Chemistry', 'Biology'],
                connectionType: 'biochemical',
                strength: 0.85
            },
            {
                concepts: ['pH', 'Acids', 'Bases'],
                relatedSubjects: ['Chemistry', 'Biology'],
                connectionType: 'chemical_properties',
                strength: 0.75
            }
        ];

        connections.forEach(connection => {
            connection.concepts.forEach(concept => {
                if (!this.interdisciplinaryMap.has(concept)) {
                    this.interdisciplinaryMap.set(concept, []);
                }
                this.interdisciplinaryMap.get(concept).push({
                    relatedSubjects: connection.relatedSubjects,
                    connectionType: connection.connectionType,
                    strength: connection.strength
                });
            });
        });

        console.log(`Built interdisciplinary map with ${this.interdisciplinaryMap.size} concept connections`);
    }

    /**
     * Analyze cross-subject performance
     * @param {Object} progressionData - Student progression data
     */
    async analyzeCrossSubjectPerformance(progressionData) {
        // Extract subject-wise performance
        const subjectPerformance = this.extractSubjectPerformance(progressionData);

        // Calculate correlations between subjects
        const correlations = this.calculateSubjectCorrelations(subjectPerformance);

        // Identify strength and weakness patterns
        const patterns = this.identifyPerformancePatterns(subjectPerformance);

        // Find interdisciplinary concepts
        const interdisciplinaryInsights = this.analyzeInterdisciplinaryPerformance(
            progressionData,
            subjectPerformance
        );

        // Identify transfer learning opportunities
        const transferOpportunities = this.identifyTransferLearning(
            subjectPerformance,
            patterns
        );

        // Generate holistic insights
        const insights = this.generateCrossSubjectInsights(
            subjectPerformance,
            correlations,
            patterns,
            interdisciplinaryInsights
        );

        return {
            timestamp: Date.now(),
            studentId: progressionData.studentId,
            subjectPerformance,
            correlations,
            patterns,
            interdisciplinaryInsights,
            transferOpportunities,
            insights,
            recommendations: this.generateCrossSubjectRecommendations(
                subjectPerformance,
                patterns,
                transferOpportunities
            )
        };
    }

    /**
     * Extract performance metrics by subject
     */
    extractSubjectPerformance(progressionData) {
        const subjects = {};

        // Process concept mastery by subject
        if (progressionData.conceptMastery) {
            Object.values(progressionData.conceptMastery).forEach(concept => {
                const subject = concept.subject || 'Unknown';

                if (!subjects[subject]) {
                    subjects[subject] = {
                        subject,
                        totalConcepts: 0,
                        masteredConcepts: 0,
                        learningConcepts: 0,
                        strugglingConcepts: 0,
                        averageMastery: 0,
                        averageAttempts: 0,
                        averageSuccessRate: 0,
                        totalTime: 0,
                        concepts: []
                    };
                }

                const subj = subjects[subject];
                subj.totalConcepts++;
                subj.concepts.push(concept);

                if (concept.status === 'mastered') {
                    subj.masteredConcepts++;
                } else if (concept.status === 'learning') {
                    subj.learningConcepts++;
                } else if (concept.status === 'struggling') {
                    subj.strugglingConcepts++;
                }
            });
        }

        // Calculate aggregated metrics
        Object.values(subjects).forEach(subject => {
            if (subject.concepts.length > 0) {
                subject.averageMastery = subject.concepts.reduce((sum, c) =>
                    sum + c.masteryLevel, 0) / subject.concepts.length;

                subject.averageAttempts = subject.concepts.reduce((sum, c) =>
                    sum + c.attempts, 0) / subject.concepts.length;

                const successRates = subject.concepts.map(c =>
                    c.attempts > 0 ? c.successes / c.attempts : 0
                );
                subject.averageSuccessRate = successRates.reduce((sum, sr) =>
                    sum + sr, 0) / successRates.length;

                subject.masteryPercentage = (subject.masteredConcepts / subject.totalConcepts) * 100;
                subject.strugglingPercentage = (subject.strugglingConcepts / subject.totalConcepts) * 100;
            }
        });

        return subjects;
    }

    /**
     * Calculate correlations between subject performances
     */
    calculateSubjectCorrelations(subjectPerformance) {
        const subjects = Object.keys(subjectPerformance);
        const correlations = [];

        for (let i = 0; i < subjects.length; i++) {
            for (let j = i + 1; j < subjects.length; j++) {
                const subj1 = subjectPerformance[subjects[i]];
                const subj2 = subjectPerformance[subjects[j]];

                const correlation = this.calculatePearsonCorrelation(
                    subj1.averageMastery,
                    subj2.averageMastery,
                    subj1.averageSuccessRate,
                    subj2.averageSuccessRate
                );

                correlations.push({
                    subject1: subjects[i],
                    subject2: subjects[j],
                    correlation: correlation,
                    strength: this.interpretCorrelation(correlation),
                    masteryGap: Math.abs(subj1.averageMastery - subj2.averageMastery)
                });
            }
        }

        return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    }

    /**
     * Calculate Pearson correlation (simplified)
     */
    calculatePearsonCorrelation(x1, x2, y1, y2) {
        // Simplified correlation for two data points
        // In real scenario, we'd use time series of mastery levels
        const avgX = (x1 + x2) / 2;
        const avgY = (y1 + y2) / 2;

        const numerator = (x1 - avgX) * (y1 - avgY) + (x2 - avgX) * (y2 - avgY);
        const denomX = Math.sqrt(Math.pow(x1 - avgX, 2) + Math.pow(x2 - avgX, 2));
        const denomY = Math.sqrt(Math.pow(y1 - avgY, 2) + Math.pow(y2 - avgY, 2));

        if (denomX === 0 || denomY === 0) return 0;

        return numerator / (denomX * denomY);
    }

    /**
     * Interpret correlation strength
     */
    interpretCorrelation(correlation) {
        const abs = Math.abs(correlation);

        if (abs >= 0.8) return 'very_strong';
        if (abs >= 0.6) return 'strong';
        if (abs >= 0.4) return 'moderate';
        if (abs >= 0.2) return 'weak';
        return 'very_weak';
    }

    /**
     * Identify performance patterns across subjects
     */
    identifyPerformancePatterns(subjectPerformance) {
        const subjects = Object.values(subjectPerformance);

        // Identify strengths (high mastery subjects)
        const strengths = subjects
            .filter(s => s.averageMastery >= 70)
            .sort((a, b) => b.averageMastery - a.averageMastery)
            .map(s => ({
                subject: s.subject,
                averageMastery: s.averageMastery,
                masteryPercentage: s.masteryPercentage
            }));

        // Identify weaknesses (low mastery subjects)
        const weaknesses = subjects
            .filter(s => s.averageMastery < 50)
            .sort((a, b) => a.averageMastery - b.averageMastery)
            .map(s => ({
                subject: s.subject,
                averageMastery: s.averageMastery,
                strugglingPercentage: s.strugglingPercentage
            }));

        // Identify balanced subjects (moderate mastery)
        const balanced = subjects
            .filter(s => s.averageMastery >= 50 && s.averageMastery < 70)
            .map(s => ({
                subject: s.subject,
                averageMastery: s.averageMastery
            }));

        // Detect improvement trends
        const improvementTrends = this.detectImprovementTrends(subjects);

        // Identify consistency patterns
        const consistency = subjects.map(s => ({
            subject: s.subject,
            consistency: this.calculateConsistency(s.concepts),
            variance: this.calculateVariance(s.concepts.map(c => c.masteryLevel))
        }));

        return {
            strengths,
            weaknesses,
            balanced,
            improvementTrends,
            consistency: consistency.sort((a, b) => b.consistency - a.consistency),
            overallBalance: this.calculateOverallBalance(subjects)
        };
    }

    /**
     * Detect improvement trends
     */
    detectImprovementTrends(subjects) {
        return subjects.map(subject => {
            // Analyze concept history for trends
            const conceptsWithHistory = subject.concepts.filter(c =>
                c.history && c.history.length >= 3
            );

            if (conceptsWithHistory.length === 0) {
                return {
                    subject: subject.subject,
                    trend: 'insufficient_data',
                    slope: 0
                };
            }

            // Calculate average slope across concepts
            const slopes = conceptsWithHistory.map(concept => {
                const history = concept.history.slice(-5); // Last 5 interactions
                return this.calculateSlope(history.map((h, i) => ({
                    x: i,
                    y: h.masteryLevel
                })));
            });

            const avgSlope = slopes.reduce((sum, s) => sum + s, 0) / slopes.length;

            let trend = 'stable';
            if (avgSlope > 2) trend = 'improving';
            else if (avgSlope < -2) trend = 'declining';

            return {
                subject: subject.subject,
                trend,
                slope: avgSlope
            };
        });
    }

    /**
     * Calculate slope (linear regression)
     */
    calculateSlope(points) {
        const n = points.length;
        if (n < 2) return 0;

        const sumX = points.reduce((sum, p) => sum + p.x, 0);
        const sumY = points.reduce((sum, p) => sum + p.y, 0);
        const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
        const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }

    /**
     * Calculate consistency score
     */
    calculateConsistency(concepts) {
        if (concepts.length < 2) return 0;

        const masteryLevels = concepts.map(c => c.masteryLevel);
        const variance = this.calculateVariance(masteryLevels);

        // Low variance = high consistency
        return Math.max(0, 100 - variance);
    }

    /**
     * Calculate variance
     */
    calculateVariance(values) {
        if (values.length === 0) return 0;

        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
    }

    /**
     * Calculate overall balance across subjects
     */
    calculateOverallBalance(subjects) {
        if (subjects.length === 0) return 0;

        const masteryLevels = subjects.map(s => s.averageMastery);
        const variance = this.calculateVariance(masteryLevels);

        // Low variance = high balance
        return Math.max(0, 100 - variance);
    }

    /**
     * Analyze interdisciplinary concept performance
     */
    analyzeInterdisciplinaryPerformance(progressionData, subjectPerformance) {
        const interdisciplinaryConcepts = [];

        // Find concepts that appear in multiple subjects
        if (progressionData.conceptMastery) {
            Object.values(progressionData.conceptMastery).forEach(concept => {
                const conceptName = concept.conceptName.toLowerCase();

                // Check if concept has interdisciplinary connections
                for (const [key, connections] of this.interdisciplinaryMap) {
                    if (conceptName.includes(key.toLowerCase())) {
                        interdisciplinaryConcepts.push({
                            conceptId: concept.conceptId,
                            conceptName: concept.conceptName,
                            primarySubject: concept.subject,
                            masteryLevel: concept.masteryLevel,
                            connections: connections,
                            transferPotential: this.calculateTransferPotential(
                                concept,
                                connections,
                                subjectPerformance
                            )
                        });
                    }
                }
            });
        }

        return {
            totalInterdisciplinary: interdisciplinaryConcepts.length,
            concepts: interdisciplinaryConcepts,
            byConnectionType: this.groupByConnectionType(interdisciplinaryConcepts),
            highTransferPotential: interdisciplinaryConcepts
                .filter(c => c.transferPotential > 0.7)
                .sort((a, b) => b.transferPotential - a.transferPotential)
        };
    }

    /**
     * Calculate transfer potential
     */
    calculateTransferPotential(concept, connections, subjectPerformance) {
        // Transfer potential = how well mastery in one subject could help in others
        let potential = 0;

        connections.forEach(connection => {
            const relatedSubjects = connection.relatedSubjects.filter(s =>
                s !== concept.subject
            );

            relatedSubjects.forEach(relatedSubject => {
                if (subjectPerformance[relatedSubject]) {
                    const performanceGap = Math.abs(
                        concept.masteryLevel - subjectPerformance[relatedSubject].averageMastery
                    );

                    // Higher gap = higher transfer potential
                    potential += (performanceGap / 100) * connection.strength;
                }
            });
        });

        return Math.min(1, potential);
    }

    /**
     * Group interdisciplinary concepts by connection type
     */
    groupByConnectionType(concepts) {
        const groups = {};

        concepts.forEach(concept => {
            concept.connections.forEach(conn => {
                if (!groups[conn.connectionType]) {
                    groups[conn.connectionType] = [];
                }
                groups[conn.connectionType].push({
                    conceptName: concept.conceptName,
                    masteryLevel: concept.masteryLevel,
                    transferPotential: concept.transferPotential
                });
            });
        });

        return groups;
    }

    /**
     * Identify transfer learning opportunities
     */
    identifyTransferLearning(subjectPerformance, patterns) {
        const opportunities = [];

        // Find where strong subjects can help weak subjects
        patterns.strengths.forEach(strength => {
            patterns.weaknesses.forEach(weakness => {
                // Check if there are interdisciplinary connections
                const connections = this.findSubjectConnections(
                    strength.subject,
                    weakness.subject
                );

                if (connections.length > 0) {
                    opportunities.push({
                        fromSubject: strength.subject,
                        fromMastery: strength.averageMastery,
                        toSubject: weakness.subject,
                        toMastery: weakness.averageMastery,
                        gap: strength.averageMastery - weakness.averageMastery,
                        connections: connections,
                        priority: this.calculateTransferPriority(
                            strength.averageMastery,
                            weakness.averageMastery,
                            connections
                        )
                    });
                }
            });
        });

        return opportunities.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Find connections between subjects
     */
    findSubjectConnections(subject1, subject2) {
        const connections = [];

        for (const [concept, conns] of this.interdisciplinaryMap) {
            conns.forEach(conn => {
                if (conn.relatedSubjects.includes(subject1) &&
                    conn.relatedSubjects.includes(subject2)) {
                    connections.push({
                        concept,
                        connectionType: conn.connectionType,
                        strength: conn.strength
                    });
                }
            });
        }

        return connections;
    }

    /**
     * Calculate transfer learning priority
     */
    calculateTransferPriority(fromMastery, toMastery, connections) {
        const gap = fromMastery - toMastery;
        const connectionStrength = connections.reduce((sum, c) =>
            sum + c.strength, 0) / connections.length;

        // Priority = gap * connection strength
        return (gap / 100) * connectionStrength * 100;
    }

    /**
     * Generate cross-subject insights
     */
    generateCrossSubjectInsights(
        subjectPerformance,
        correlations,
        patterns,
        interdisciplinaryInsights
    ) {
        const insights = [];

        // Performance balance insight
        if (patterns.overallBalance < 50) {
            insights.push({
                type: 'performance_imbalance',
                severity: 'medium',
                title: 'Unbalanced Performance Across Subjects',
                description: 'Significant variation in mastery across subjects',
                data: {
                    balance: patterns.overallBalance,
                    strengths: patterns.strengths.map(s => s.subject),
                    weaknesses: patterns.weaknesses.map(w => w.subject)
                }
            });
        }

        // Strong correlations insight
        const strongCorrelations = correlations.filter(c =>
            Math.abs(c.correlation) > 0.6
        );

        if (strongCorrelations.length > 0) {
            insights.push({
                type: 'subject_correlations',
                severity: 'info',
                title: 'Strong Subject Correlations Found',
                description: 'Performance in some subjects is highly correlated',
                data: {
                    correlations: strongCorrelations.map(c => ({
                        subjects: [c.subject1, c.subject2],
                        strength: c.strength
                    }))
                }
            });
        }

        // Interdisciplinary opportunities
        if (interdisciplinaryInsights.highTransferPotential.length > 0) {
            insights.push({
                type: 'transfer_opportunities',
                severity: 'high',
                title: 'Transfer Learning Opportunities Available',
                description: 'Your strengths can help improve other subjects',
                data: {
                    opportunities: interdisciplinaryInsights.highTransferPotential.slice(0, 5)
                }
            });
        }

        // Consistent improvement
        const improvingSubjects = patterns.improvementTrends.filter(t =>
            t.trend === 'improving'
        );

        if (improvingSubjects.length > 0) {
            insights.push({
                type: 'improvement_trend',
                severity: 'positive',
                title: 'Positive Improvement Trends',
                description: `Improving in ${improvingSubjects.length} subject(s)`,
                data: {
                    subjects: improvingSubjects.map(s => s.subject)
                }
            });
        }

        // Declining performance
        const decliningSubjects = patterns.improvementTrends.filter(t =>
            t.trend === 'declining'
        );

        if (decliningSubjects.length > 0) {
            insights.push({
                type: 'performance_decline',
                severity: 'warning',
                title: 'Performance Declining in Some Subjects',
                description: `Attention needed in ${decliningSubjects.length} subject(s)`,
                data: {
                    subjects: decliningSubjects.map(s => s.subject)
                }
            });
        }

        return insights;
    }

    /**
     * Generate cross-subject recommendations
     */
    generateCrossSubjectRecommendations(
        subjectPerformance,
        patterns,
        transferOpportunities
    ) {
        const recommendations = [];

        // Transfer learning recommendations
        if (transferOpportunities.length > 0) {
            const topOpportunity = transferOpportunities[0];
            recommendations.push({
                type: 'transfer_learning',
                priority: 'high',
                title: `Use ${topOpportunity.fromSubject} Skills in ${topOpportunity.toSubject}`,
                description: `Your strong ${topOpportunity.fromSubject} foundation can help improve ${topOpportunity.toSubject}`,
                action: `Focus on ${topOpportunity.connections.map(c => c.concept).join(', ')} concepts`,
                expectedImpact: 'high'
            });
        }

        // Balance improvement
        if (patterns.overallBalance < 60) {
            recommendations.push({
                type: 'balance_subjects',
                priority: 'medium',
                title: 'Balance Your Learning Across Subjects',
                description: 'Some subjects need more attention',
                action: patterns.weaknesses.length > 0
                    ? `Increase focus on ${patterns.weaknesses[0].subject}`
                    : 'Distribute study time more evenly',
                expectedImpact: 'medium'
            });
        }

        // Leverage strengths
        if (patterns.strengths.length > 0) {
            const strength = patterns.strengths[0];
            recommendations.push({
                type: 'leverage_strength',
                priority: 'low',
                title: `Build on ${strength.subject} Success`,
                description: `Apply your successful ${strength.subject} strategies to other subjects`,
                action: 'Identify what works well and replicate',
                expectedImpact: 'medium'
            });
        }

        // Address declining subjects
        const declining = patterns.improvementTrends.filter(t => t.trend === 'declining');
        if (declining.length > 0) {
            recommendations.push({
                type: 'address_decline',
                priority: 'high',
                title: 'Prevent Performance Decline',
                description: `${declining[0].subject} performance is declining`,
                action: 'Review recent topics and identify struggling areas',
                expectedImpact: 'high'
            });
        }

        return recommendations;
    }

    /**
     * Export cross-subject analysis
     * @param {Object} analysis - Cross-subject analysis data
     * @param {string} format - Export format (json, csv, markdown)
     */
    async exportAnalysis(analysis, format = 'json') {
        if (format === 'json') {
            return JSON.stringify(analysis, null, 2);
        } else if (format === 'markdown') {
            return this.convertToMarkdown(analysis);
        }

        throw new Error(`Unsupported export format: ${format}`);
    }

    /**
     * Convert analysis to markdown
     */
    convertToMarkdown(analysis) {
        const lines = [];

        lines.push('# Cross-Subject Performance Analysis\n');
        lines.push(`**Generated:** ${new Date(analysis.timestamp).toLocaleString()}  `);
        lines.push(`**Student ID:** ${analysis.studentId}  \n`);

        // Subject Performance
        lines.push('## Subject Performance Overview\n');
        Object.values(analysis.subjectPerformance).forEach(subject => {
            lines.push(`### ${subject.subject}\n`);
            lines.push(`- **Average Mastery:** ${subject.averageMastery.toFixed(2)}%`);
            lines.push(`- **Mastered Concepts:** ${subject.masteredConcepts}/${subject.totalConcepts}`);
            lines.push(`- **Success Rate:** ${(subject.averageSuccessRate * 100).toFixed(2)}%`);
            lines.push(`- **Struggling Concepts:** ${subject.strugglingConcepts}\n`);
        });

        // Patterns
        lines.push('## Performance Patterns\n');

        if (analysis.patterns.strengths.length > 0) {
            lines.push('### Strengths\n');
            analysis.patterns.strengths.forEach(s => {
                lines.push(`- **${s.subject}**: ${s.averageMastery.toFixed(2)}% mastery`);
            });
            lines.push('');
        }

        if (analysis.patterns.weaknesses.length > 0) {
            lines.push('### Areas for Improvement\n');
            analysis.patterns.weaknesses.forEach(w => {
                lines.push(`- **${w.subject}**: ${w.averageMastery.toFixed(2)}% mastery`);
            });
            lines.push('');
        }

        // Insights
        if (analysis.insights.length > 0) {
            lines.push('## Key Insights\n');
            analysis.insights.forEach(insight => {
                lines.push(`### ${insight.title}`);
                lines.push(`**Type:** ${insight.type}  `);
                lines.push(`**Severity:** ${insight.severity}  `);
                lines.push(`${insight.description}\n`);
            });
        }

        // Recommendations
        if (analysis.recommendations.length > 0) {
            lines.push('## Recommendations\n');
            analysis.recommendations.forEach((rec, i) => {
                lines.push(`### ${i + 1}. ${rec.title}`);
                lines.push(`**Priority:** ${rec.priority}  `);
                lines.push(`**Description:** ${rec.description}  `);
                lines.push(`**Action:** ${rec.action}  `);
                lines.push(`**Expected Impact:** ${rec.expectedImpact}  \n`);
            });
        }

        return lines.join('\n');
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.CrossSubjectAnalyzer = CrossSubjectAnalyzer;
}
