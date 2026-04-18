/**
 * Curriculum Gap Analyzer
 * Identifies gaps in curriculum coverage, prerequisite missing concepts,
 * and generates personalized learning recommendations
 */

class CurriculumGapAnalyzer {
    constructor(database) {
        this.database = database;
        this.curriculumMap = new Map();
        this.dependencyGraph = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the curriculum gap analyzer
     */
    async initialize() {
        if (this.initialized) return;

        console.log('Initializing Curriculum Gap Analyzer...');

        // Ensure database is ready
        if (!this.database.isInitialized()) {
            await this.database.initialize();
        }

        // Load curriculum structure
        await this.loadCurriculumStructure();

        // Build dependency graph
        await this.buildDependencyGraph();

        this.initialized = true;
        console.log('Curriculum Gap Analyzer initialized successfully');
    }

    /**
     * Load curriculum structure from database
     */
    async loadCurriculumStructure() {
        try {
            const curriculumData = await this.database.getAll('curriculum');

            curriculumData.forEach(item => {
                const key = `${item.subject}_${item.grade}_${item.chapter}`;
                this.curriculumMap.set(key, item);
            });

            console.log(`Loaded ${this.curriculumMap.size} curriculum items`);
        } catch (error) {
            console.warn('Failed to load curriculum data:', error);
            // Initialize with default structure
            await this.initializeDefaultCurriculum();
        }
    }

    /**
     * Initialize default curriculum structure for NCERT
     */
    async initializeDefaultCurriculum() {
        const defaultCurriculum = [
            // Mathematics
            {
                subject: 'Mathematics',
                grade: 9,
                chapters: [
                    { id: 'math_9_1', name: 'Number Systems', difficulty: 3, prerequisites: [] },
                    { id: 'math_9_2', name: 'Polynomials', difficulty: 4, prerequisites: ['math_9_1'] },
                    { id: 'math_9_3', name: 'Coordinate Geometry', difficulty: 5, prerequisites: ['math_9_1'] },
                    { id: 'math_9_4', name: 'Linear Equations in Two Variables', difficulty: 5, prerequisites: ['math_9_1', 'math_9_2'] },
                    { id: 'math_9_5', name: 'Introduction to Euclids Geometry', difficulty: 4, prerequisites: [] },
                    { id: 'math_9_6', name: 'Lines and Angles', difficulty: 4, prerequisites: ['math_9_5'] },
                    { id: 'math_9_7', name: 'Triangles', difficulty: 5, prerequisites: ['math_9_6'] },
                    { id: 'math_9_8', name: 'Quadrilaterals', difficulty: 5, prerequisites: ['math_9_7'] },
                    { id: 'math_9_9', name: 'Areas of Parallelograms and Triangles', difficulty: 5, prerequisites: ['math_9_8'] },
                    { id: 'math_9_10', name: 'Circles', difficulty: 6, prerequisites: ['math_9_5'] },
                    { id: 'math_9_11', name: 'Constructions', difficulty: 4, prerequisites: ['math_9_7'] },
                    { id: 'math_9_12', name: 'Herons Formula', difficulty: 4, prerequisites: ['math_9_7'] },
                    { id: 'math_9_13', name: 'Surface Areas and Volumes', difficulty: 5, prerequisites: ['math_9_1'] },
                    { id: 'math_9_14', name: 'Statistics', difficulty: 5, prerequisites: ['math_9_1'] },
                    { id: 'math_9_15', name: 'Probability', difficulty: 6, prerequisites: ['math_9_14'] }
                ]
            },
            {
                subject: 'Mathematics',
                grade: 10,
                chapters: [
                    { id: 'math_10_1', name: 'Real Numbers', difficulty: 5, prerequisites: ['math_9_1'] },
                    { id: 'math_10_2', name: 'Polynomials', difficulty: 6, prerequisites: ['math_9_2'] },
                    { id: 'math_10_3', name: 'Pair of Linear Equations in Two Variables', difficulty: 6, prerequisites: ['math_9_4'] },
                    { id: 'math_10_4', name: 'Quadratic Equations', difficulty: 7, prerequisites: ['math_10_2'] },
                    { id: 'math_10_5', name: 'Arithmetic Progressions', difficulty: 6, prerequisites: ['math_9_1'] },
                    { id: 'math_10_6', name: 'Triangles', difficulty: 6, prerequisites: ['math_9_7'] },
                    { id: 'math_10_7', name: 'Coordinate Geometry', difficulty: 6, prerequisites: ['math_9_3'] },
                    { id: 'math_10_8', name: 'Introduction to Trigonometry', difficulty: 7, prerequisites: ['math_9_7'] },
                    { id: 'math_10_9', name: 'Some Applications of Trigonometry', difficulty: 7, prerequisites: ['math_10_8'] },
                    { id: 'math_10_10', name: 'Circles', difficulty: 7, prerequisites: ['math_9_10'] },
                    { id: 'math_10_11', name: 'Constructions', difficulty: 5, prerequisites: ['math_9_11'] },
                    { id: 'math_10_12', name: 'Areas Related to Circles', difficulty: 6, prerequisites: ['math_10_10'] },
                    { id: 'math_10_13', name: 'Surface Areas and Volumes', difficulty: 6, prerequisites: ['math_9_13'] },
                    { id: 'math_10_14', name: 'Statistics', difficulty: 6, prerequisites: ['math_9_14'] },
                    { id: 'math_10_15', name: 'Probability', difficulty: 7, prerequisites: ['math_9_15'] }
                ]
            },
            // Science
            {
                subject: 'Science',
                grade: 9,
                chapters: [
                    { id: 'sci_9_1', name: 'Matter in Our Surroundings', difficulty: 3, prerequisites: [] },
                    { id: 'sci_9_2', name: 'Is Matter Around Us Pure', difficulty: 4, prerequisites: ['sci_9_1'] },
                    { id: 'sci_9_3', name: 'Atoms and Molecules', difficulty: 5, prerequisites: ['sci_9_2'] },
                    { id: 'sci_9_4', name: 'Structure of the Atom', difficulty: 6, prerequisites: ['sci_9_3'] },
                    { id: 'sci_9_5', name: 'The Fundamental Unit of Life', difficulty: 5, prerequisites: [] },
                    { id: 'sci_9_6', name: 'Tissues', difficulty: 5, prerequisites: ['sci_9_5'] },
                    { id: 'sci_9_7', name: 'Diversity in Living Organisms', difficulty: 5, prerequisites: ['sci_9_5'] },
                    { id: 'sci_9_8', name: 'Motion', difficulty: 5, prerequisites: [] },
                    { id: 'sci_9_9', name: 'Force and Laws of Motion', difficulty: 6, prerequisites: ['sci_9_8'] },
                    { id: 'sci_9_10', name: 'Gravitation', difficulty: 6, prerequisites: ['sci_9_9'] },
                    { id: 'sci_9_11', name: 'Work and Energy', difficulty: 6, prerequisites: ['sci_9_9'] },
                    { id: 'sci_9_12', name: 'Sound', difficulty: 5, prerequisites: ['sci_9_8'] },
                    { id: 'sci_9_13', name: 'Why Do We Fall Ill', difficulty: 4, prerequisites: ['sci_9_5'] },
                    { id: 'sci_9_14', name: 'Natural Resources', difficulty: 4, prerequisites: [] },
                    { id: 'sci_9_15', name: 'Improvement in Food Resources', difficulty: 5, prerequisites: ['sci_9_7'] }
                ]
            },
            {
                subject: 'Science',
                grade: 10,
                chapters: [
                    { id: 'sci_10_1', name: 'Chemical Reactions and Equations', difficulty: 5, prerequisites: ['sci_9_3'] },
                    { id: 'sci_10_2', name: 'Acids, Bases and Salts', difficulty: 5, prerequisites: ['sci_9_2'] },
                    { id: 'sci_10_3', name: 'Metals and Non-metals', difficulty: 6, prerequisites: ['sci_9_4'] },
                    { id: 'sci_10_4', name: 'Carbon and its Compounds', difficulty: 7, prerequisites: ['sci_9_3'] },
                    { id: 'sci_10_5', name: 'Periodic Classification of Elements', difficulty: 6, prerequisites: ['sci_9_4'] },
                    { id: 'sci_10_6', name: 'Life Processes', difficulty: 6, prerequisites: ['sci_9_5', 'sci_9_6'] },
                    { id: 'sci_10_7', name: 'Control and Coordination', difficulty: 6, prerequisites: ['sci_10_6'] },
                    { id: 'sci_10_8', name: 'How do Organisms Reproduce', difficulty: 6, prerequisites: ['sci_9_5'] },
                    { id: 'sci_10_9', name: 'Heredity and Evolution', difficulty: 7, prerequisites: ['sci_10_8'] },
                    { id: 'sci_10_10', name: 'Light - Reflection and Refraction', difficulty: 6, prerequisites: [] },
                    { id: 'sci_10_11', name: 'Human Eye and Colourful World', difficulty: 5, prerequisites: ['sci_10_10'] },
                    { id: 'sci_10_12', name: 'Electricity', difficulty: 7, prerequisites: [] },
                    { id: 'sci_10_13', name: 'Magnetic Effects of Electric Current', difficulty: 7, prerequisites: ['sci_10_12'] },
                    { id: 'sci_10_14', name: 'Sources of Energy', difficulty: 5, prerequisites: ['sci_9_11'] },
                    { id: 'sci_10_15', name: 'Our Environment', difficulty: 5, prerequisites: ['sci_9_14'] },
                    { id: 'sci_10_16', name: 'Sustainable Management of Natural Resources', difficulty: 5, prerequisites: ['sci_10_15'] }
                ]
            }
        ];

        // Store in curriculum map
        defaultCurriculum.forEach(gradeData => {
            gradeData.chapters.forEach(chapter => {
                const key = `${gradeData.subject}_${gradeData.grade}_${chapter.name}`;
                this.curriculumMap.set(key, {
                    ...chapter,
                    subject: gradeData.subject,
                    grade: gradeData.grade
                });
            });
        });

        console.log('Initialized default curriculum structure');
    }

    /**
     * Build dependency graph from curriculum
     */
    async buildDependencyGraph() {
        this.curriculumMap.forEach((concept, key) => {
            if (!this.dependencyGraph.has(concept.id)) {
                this.dependencyGraph.set(concept.id, {
                    concept,
                    prerequisites: concept.prerequisites || [],
                    dependents: []
                });
            }

            // Build reverse dependencies (what depends on this)
            if (concept.prerequisites && concept.prerequisites.length > 0) {
                concept.prerequisites.forEach(prereqId => {
                    const prereqNode = this.dependencyGraph.get(prereqId);
                    if (prereqNode) {
                        prereqNode.dependents.push(concept.id);
                    }
                });
            }
        });

        console.log(`Built dependency graph with ${this.dependencyGraph.size} nodes`);
    }

    /**
     * Analyze curriculum gaps for a student
     * @param {Object} progressionData - Student progression data
     * @param {Object} options - Analysis options
     */
    async analyzeCurriculumGaps(progressionData, options = {}) {
        const {
            targetGrade = 10,
            targetSubject = null,
            includePrerequisites = true,
            includeRecommendations = true
        } = options;

        // Extract concepts the student has interacted with
        const coveredConcepts = this.extractCoveredConcepts(progressionData);

        // Get target curriculum
        const targetCurriculum = this.getTargetCurriculum(targetGrade, targetSubject);

        // Identify gaps
        const gaps = this.identifyGaps(coveredConcepts, targetCurriculum);

        // Analyze prerequisite gaps
        let prerequisiteGaps = [];
        if (includePrerequisites) {
            prerequisiteGaps = this.analyzePrerequisiteGaps(
                coveredConcepts,
                gaps,
                progressionData
            );
        }

        // Calculate coverage metrics
        const coverage = this.calculateCoverage(coveredConcepts, targetCurriculum);

        // Generate gap report
        const gapReport = {
            timestamp: Date.now(),
            studentId: progressionData.studentId,
            targetGrade,
            targetSubject,
            coverage,
            gaps: {
                total: gaps.length,
                byDifficulty: this.groupByDifficulty(gaps),
                bySubject: this.groupBySubject(gaps),
                critical: gaps.filter(g => g.isCritical),
                concepts: gaps
            },
            prerequisiteGaps: {
                total: prerequisiteGaps.length,
                concepts: prerequisiteGaps
            },
            recommendations: includeRecommendations
                ? this.generateGapRecommendations(gaps, prerequisiteGaps, coverage)
                : []
        };

        return gapReport;
    }

    /**
     * Extract concepts covered by student
     */
    extractCoveredConcepts(progressionData) {
        const covered = new Map();

        // From concept mastery
        if (progressionData.conceptMastery) {
            Object.values(progressionData.conceptMastery).forEach(concept => {
                covered.set(concept.conceptId, {
                    id: concept.conceptId,
                    name: concept.conceptName,
                    masteryLevel: concept.masteryLevel,
                    status: concept.status,
                    attempts: concept.attempts,
                    lastSeen: concept.lastSeen
                });
            });
        }

        // From interactions
        if (progressionData.interactions) {
            progressionData.interactions.forEach(interaction => {
                if (!covered.has(interaction.conceptId)) {
                    covered.set(interaction.conceptId, {
                        id: interaction.conceptId,
                        name: interaction.conceptName,
                        masteryLevel: 0,
                        status: 'encountered',
                        attempts: 1,
                        lastSeen: interaction.timestamp
                    });
                }
            });
        }

        return covered;
    }

    /**
     * Get target curriculum for analysis
     */
    getTargetCurriculum(grade, subject = null) {
        const curriculum = [];

        this.curriculumMap.forEach((concept, key) => {
            if (concept.grade === grade) {
                if (subject === null || concept.subject === subject) {
                    curriculum.push(concept);
                }
            }
        });

        return curriculum;
    }

    /**
     * Identify gaps in curriculum coverage
     */
    identifyGaps(coveredConcepts, targetCurriculum) {
        const gaps = [];

        targetCurriculum.forEach(concept => {
            const covered = coveredConcepts.get(concept.id);

            if (!covered) {
                // Complete gap - never encountered
                gaps.push({
                    conceptId: concept.id,
                    conceptName: concept.name,
                    subject: concept.subject,
                    grade: concept.grade,
                    difficulty: concept.difficulty,
                    gapType: 'not_covered',
                    severity: this.calculateGapSeverity(concept, 'not_covered'),
                    isCritical: this.isConceptCritical(concept),
                    prerequisites: concept.prerequisites || []
                });
            } else if (covered.masteryLevel < 50) {
                // Partial gap - covered but not mastered
                gaps.push({
                    conceptId: concept.id,
                    conceptName: concept.name,
                    subject: concept.subject,
                    grade: concept.grade,
                    difficulty: concept.difficulty,
                    gapType: 'not_mastered',
                    masteryLevel: covered.masteryLevel,
                    severity: this.calculateGapSeverity(concept, 'not_mastered', covered.masteryLevel),
                    isCritical: this.isConceptCritical(concept) && covered.masteryLevel < 30,
                    prerequisites: concept.prerequisites || []
                });
            }
        });

        return gaps.sort((a, b) => b.severity - a.severity);
    }

    /**
     * Calculate gap severity
     */
    calculateGapSeverity(concept, gapType, masteryLevel = 0) {
        let severity = 0;

        // Base severity on gap type
        if (gapType === 'not_covered') {
            severity = 100;
        } else if (gapType === 'not_mastered') {
            severity = 100 - masteryLevel; // Inverse of mastery
        }

        // Adjust for difficulty
        severity *= (concept.difficulty / 10);

        // Adjust for critical concepts
        if (this.isConceptCritical(concept)) {
            severity *= 1.5;
        }

        return Math.round(severity);
    }

    /**
     * Check if concept is critical
     */
    isConceptCritical(concept) {
        // Critical concepts have many dependents
        const node = this.dependencyGraph.get(concept.id);
        return node && node.dependents && node.dependents.length > 3;
    }

    /**
     * Analyze prerequisite gaps
     */
    analyzePrerequisiteGaps(coveredConcepts, gaps, progressionData) {
        const prerequisiteGaps = [];

        gaps.forEach(gap => {
            if (gap.prerequisites && gap.prerequisites.length > 0) {
                gap.prerequisites.forEach(prereqId => {
                    const prereqCovered = coveredConcepts.get(prereqId);
                    const prereqConcept = this.findConceptById(prereqId);

                    if (!prereqCovered || prereqCovered.masteryLevel < 60) {
                        prerequisiteGaps.push({
                            prerequisiteId: prereqId,
                            prerequisiteName: prereqConcept?.name || 'Unknown',
                            blockedConcept: gap.conceptName,
                            blockedConceptId: gap.conceptId,
                            masteryLevel: prereqCovered?.masteryLevel || 0,
                            severity: prereqConcept
                                ? this.calculateGapSeverity(prereqConcept, 'prerequisite', prereqCovered?.masteryLevel || 0)
                                : 50
                        });
                    }
                });
            }
        });

        return prerequisiteGaps.sort((a, b) => b.severity - a.severity);
    }

    /**
     * Find concept by ID
     */
    findConceptById(conceptId) {
        for (const [key, concept] of this.curriculumMap) {
            if (concept.id === conceptId) {
                return concept;
            }
        }
        return null;
    }

    /**
     * Calculate curriculum coverage
     */
    calculateCoverage(coveredConcepts, targetCurriculum) {
        const total = targetCurriculum.length;
        const covered = targetCurriculum.filter(concept =>
            coveredConcepts.has(concept.id)
        ).length;

        const mastered = targetCurriculum.filter(concept => {
            const cov = coveredConcepts.get(concept.id);
            return cov && cov.masteryLevel >= 80;
        }).length;

        const learning = targetCurriculum.filter(concept => {
            const cov = coveredConcepts.get(concept.id);
            return cov && cov.masteryLevel >= 50 && cov.masteryLevel < 80;
        }).length;

        return {
            total,
            covered,
            mastered,
            learning,
            notCovered: total - covered,
            coveragePercentage: total > 0 ? (covered / total) * 100 : 0,
            masteryPercentage: total > 0 ? (mastered / total) * 100 : 0,
            learningPercentage: total > 0 ? (learning / total) * 100 : 0
        };
    }

    /**
     * Group gaps by difficulty
     */
    groupByDifficulty(gaps) {
        const groups = {
            easy: [],
            medium: [],
            hard: []
        };

        gaps.forEach(gap => {
            if (gap.difficulty <= 4) {
                groups.easy.push(gap);
            } else if (gap.difficulty <= 7) {
                groups.medium.push(gap);
            } else {
                groups.hard.push(gap);
            }
        });

        return groups;
    }

    /**
     * Group gaps by subject
     */
    groupBySubject(gaps) {
        const groups = {};

        gaps.forEach(gap => {
            const subject = gap.subject || 'Unknown';
            if (!groups[subject]) {
                groups[subject] = [];
            }
            groups[subject].push(gap);
        });

        return groups;
    }

    /**
     * Generate recommendations to fill gaps
     */
    generateGapRecommendations(gaps, prerequisiteGaps, coverage) {
        const recommendations = [];

        // Prerequisite gaps first
        if (prerequisiteGaps.length > 0) {
            const topPrereqs = prerequisiteGaps.slice(0, 3);
            recommendations.push({
                type: 'prerequisites',
                priority: 'critical',
                title: 'Master Prerequisites First',
                description: `${prerequisiteGaps.length} prerequisite concept(s) need attention`,
                concepts: topPrereqs.map(pg => pg.prerequisiteName),
                action: 'Focus on these foundational concepts before advancing',
                estimatedTime: `${topPrereqs.length * 2} hours`
            });
        }

        // Critical gaps
        const criticalGaps = gaps.filter(g => g.isCritical);
        if (criticalGaps.length > 0) {
            recommendations.push({
                type: 'critical_gaps',
                priority: 'high',
                title: 'Fill Critical Knowledge Gaps',
                description: `${criticalGaps.length} critical concept(s) are missing`,
                concepts: criticalGaps.slice(0, 5).map(g => g.conceptName),
                action: 'These concepts are prerequisites for many other topics',
                estimatedTime: `${criticalGaps.length * 3} hours`
            });
        }

        // Easy wins (easy difficulty gaps)
        const easyGaps = gaps.filter(g => g.difficulty <= 4 && !g.isCritical);
        if (easyGaps.length > 0) {
            recommendations.push({
                type: 'quick_wins',
                priority: 'medium',
                title: 'Quick Wins Available',
                description: `${easyGaps.length} easier concept(s) to build confidence`,
                concepts: easyGaps.slice(0, 5).map(g => g.conceptName),
                action: 'Start with these to build momentum',
                estimatedTime: `${easyGaps.length} hours`
            });
        }

        // Coverage improvement
        if (coverage.coveragePercentage < 50) {
            recommendations.push({
                type: 'coverage',
                priority: 'medium',
                title: 'Increase Coverage',
                description: `Currently at ${coverage.coveragePercentage.toFixed(1)}% coverage`,
                action: 'Aim to cover at least 70% of curriculum',
                targetCoverage: 70
            });
        }

        // Mastery improvement
        if (coverage.masteryPercentage < 30 && coverage.covered > 0) {
            recommendations.push({
                type: 'mastery',
                priority: 'medium',
                title: 'Improve Mastery',
                description: `Only ${coverage.masteryPercentage.toFixed(1)}% of concepts mastered`,
                action: 'Review and practice covered concepts to achieve mastery',
                targetMastery: 50
            });
        }

        return recommendations;
    }

    /**
     * Get learning path to fill specific gap
     * @param {string} conceptId - Target concept ID
     * @param {Map} coveredConcepts - Already covered concepts
     */
    async getLearningPathForGap(conceptId, coveredConcepts) {
        const targetConcept = this.findConceptById(conceptId);
        if (!targetConcept) {
            throw new Error(`Concept not found: ${conceptId}`);
        }

        const path = [];
        const visited = new Set();

        // Recursive function to find prerequisites
        const buildPath = (cId) => {
            if (visited.has(cId)) return;
            visited.add(cId);

            const concept = this.findConceptById(cId);
            if (!concept) return;

            // Check prerequisites first
            if (concept.prerequisites && concept.prerequisites.length > 0) {
                concept.prerequisites.forEach(prereqId => {
                    const covered = coveredConcepts.get(prereqId);
                    // Only include if not mastered
                    if (!covered || covered.masteryLevel < 60) {
                        buildPath(prereqId);
                    }
                });
            }

            // Add current concept if not mastered
            const covered = coveredConcepts.get(cId);
            if (!covered || covered.masteryLevel < 80) {
                path.push({
                    conceptId: cId,
                    conceptName: concept.name,
                    subject: concept.subject,
                    grade: concept.grade,
                    difficulty: concept.difficulty,
                    currentMastery: covered?.masteryLevel || 0,
                    estimatedTime: this.estimateStudyTime(concept, covered?.masteryLevel || 0)
                });
            }
        };

        buildPath(conceptId);

        return {
            targetConcept: {
                id: targetConcept.id,
                name: targetConcept.name
            },
            path,
            totalSteps: path.length,
            estimatedTotalTime: path.reduce((sum, step) => sum + step.estimatedTime, 0)
        };
    }

    /**
     * Estimate study time for a concept
     */
    estimateStudyTime(concept, currentMastery) {
        const baseTime = concept.difficulty * 30; // Base: difficulty * 30 mins
        const masteryGap = 80 - currentMastery; // Target 80% mastery
        const timeNeeded = (baseTime * masteryGap) / 100;

        return Math.max(30, Math.round(timeNeeded)); // Minimum 30 mins
    }

    /**
     * Export gap analysis report
     * @param {Object} gapReport - Gap analysis report
     * @param {string} format - Export format (json, csv, markdown)
     */
    async exportGapReport(gapReport, format = 'json') {
        if (format === 'json') {
            return JSON.stringify(gapReport, null, 2);
        } else if (format === 'csv') {
            return this.convertGapReportToCSV(gapReport);
        } else if (format === 'markdown') {
            return this.convertGapReportToMarkdown(gapReport);
        }

        throw new Error(`Unsupported export format: ${format}`);
    }

    /**
     * Convert gap report to CSV
     */
    convertGapReportToCSV(report) {
        const rows = [];

        // Header
        rows.push('Gap Analysis Report');
        rows.push(`Generated: ${new Date(report.timestamp).toLocaleString()}`);
        rows.push(`Student ID: ${report.studentId}`);
        rows.push(`Target: Grade ${report.targetGrade}${report.targetSubject ? ` - ${report.targetSubject}` : ''}`);
        rows.push('');

        // Coverage
        rows.push('Coverage Metrics');
        rows.push('Metric,Value');
        rows.push(`Total Concepts,${report.coverage.total}`);
        rows.push(`Covered,${report.coverage.covered}`);
        rows.push(`Mastered,${report.coverage.mastered}`);
        rows.push(`Coverage %,${report.coverage.coveragePercentage.toFixed(2)}%`);
        rows.push(`Mastery %,${report.coverage.masteryPercentage.toFixed(2)}%`);
        rows.push('');

        // Gaps
        rows.push('Identified Gaps');
        rows.push('Concept,Subject,Grade,Difficulty,Gap Type,Severity');
        report.gaps.concepts.forEach(gap => {
            rows.push(`${gap.conceptName},${gap.subject},${gap.grade},${gap.difficulty},${gap.gapType},${gap.severity}`);
        });

        return rows.join('\n');
    }

    /**
     * Convert gap report to Markdown
     */
    convertGapReportToMarkdown(report) {
        const lines = [];

        lines.push('# Curriculum Gap Analysis Report\n');
        lines.push(`**Generated:** ${new Date(report.timestamp).toLocaleString()}  `);
        lines.push(`**Student ID:** ${report.studentId}  `);
        lines.push(`**Target:** Grade ${report.targetGrade}${report.targetSubject ? ` - ${report.targetSubject}` : ''}  \n`);

        // Coverage
        lines.push('## Coverage Metrics\n');
        lines.push(`- **Total Concepts:** ${report.coverage.total}`);
        lines.push(`- **Covered:** ${report.coverage.covered}`);
        lines.push(`- **Mastered:** ${report.coverage.mastered}`);
        lines.push(`- **Coverage:** ${report.coverage.coveragePercentage.toFixed(2)}%`);
        lines.push(`- **Mastery:** ${report.coverage.masteryPercentage.toFixed(2)}%\n`);

        // Gaps summary
        lines.push('## Gap Summary\n');
        lines.push(`- **Total Gaps:** ${report.gaps.total}`);
        lines.push(`- **Critical Gaps:** ${report.gaps.critical.length}`);
        lines.push(`- **Prerequisite Gaps:** ${report.prerequisiteGaps.total}\n`);

        // Critical gaps
        if (report.gaps.critical.length > 0) {
            lines.push('## Critical Gaps\n');
            report.gaps.critical.forEach(gap => {
                lines.push(`### ${gap.conceptName}`);
                lines.push(`- **Subject:** ${gap.subject}`);
                lines.push(`- **Grade:** ${gap.grade}`);
                lines.push(`- **Difficulty:** ${gap.difficulty}/10`);
                lines.push(`- **Severity:** ${gap.severity}/100\n`);
            });
        }

        // Recommendations
        if (report.recommendations && report.recommendations.length > 0) {
            lines.push('## Recommendations\n');
            report.recommendations.forEach((rec, index) => {
                lines.push(`### ${index + 1}. ${rec.title}`);
                lines.push(`**Priority:** ${rec.priority}  `);
                lines.push(`**Description:** ${rec.description}  `);
                lines.push(`**Action:** ${rec.action}  `);
                if (rec.estimatedTime) {
                    lines.push(`**Estimated Time:** ${rec.estimatedTime}  `);
                }
                lines.push('');
            });
        }

        return lines.join('\n');
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.CurriculumGapAnalyzer = CurriculumGapAnalyzer;
}
