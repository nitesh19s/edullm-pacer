/**
 * Progression Tracker
 * Tracks student learning progression, concept mastery, and learning paths
 * for educational research and analysis
 */

class ProgressionTracker {
    constructor(database) {
        this.database = database;
        this.progressCache = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the progression tracker
     */
    async initialize() {
        if (this.initialized) return;

        console.log('Initializing Progression Tracker...');

        // Ensure database is ready
        if (!this.database.isInitialized()) {
            await this.database.initialize();
        }

        // Load existing progression data
        await this.loadProgressionData();

        this.initialized = true;
        console.log('Progression Tracker initialized successfully');
    }

    /**
     * Load existing progression data from database
     */
    async loadProgressionData() {
        try {
            const progressions = await this.database.getAll('progressions');
            progressions.forEach(prog => {
                this.progressCache.set(prog.studentId, prog);
            });
        } catch (error) {
            console.warn('No existing progression data found:', error);
        }
    }

    /**
     * Track a learning interaction
     * @param {Object} interaction - Learning interaction data
     */
    async trackInteraction(interaction) {
        const {
            studentId = 'default_student',
            conceptId,
            conceptName,
            subject,
            grade,
            difficulty,
            success,
            responseTime,
            confidence,
            context
        } = interaction;

        const timestamp = Date.now();

        // Get or create student progression
        let progression = await this.getStudentProgression(studentId);

        // Create interaction record
        const interactionRecord = {
            id: `int_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            conceptId,
            conceptName,
            subject,
            grade,
            difficulty: difficulty || this.estimateDifficulty(conceptName, subject),
            success: success !== undefined ? success : null,
            responseTime,
            confidence: confidence || null,
            context: context || {},
            timestamp
        };

        // Add to progression
        progression.interactions.push(interactionRecord);

        // Update concept mastery
        await this.updateConceptMastery(progression, interactionRecord);

        // Update learning path
        await this.updateLearningPath(progression, interactionRecord);

        // Calculate progression metrics
        await this.calculateProgressionMetrics(progression);

        // Save progression
        await this.saveProgression(progression);

        return interactionRecord;
    }

    /**
     * Get student progression data
     * @param {string} studentId - Student identifier
     */
    async getStudentProgression(studentId) {
        // Check cache first
        if (this.progressCache.has(studentId)) {
            return { ...this.progressCache.get(studentId) };
        }

        // Try to load from database
        try {
            const progression = await this.database.get('progressions', studentId);
            if (progression) {
                this.progressCache.set(studentId, progression);
                return { ...progression };
            }
        } catch (error) {
            console.log('Creating new progression for student:', studentId);
        }

        // Create new progression
        return this.createNewProgression(studentId);
    }

    /**
     * Create new progression record
     * @param {string} studentId - Student identifier
     */
    createNewProgression(studentId) {
        return {
            studentId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            interactions: [],
            conceptMastery: {},
            learningPath: [],
            knowledgeState: {},
            metrics: {
                totalInteractions: 0,
                averageSuccessRate: 0,
                averageResponseTime: 0,
                averageConfidence: 0,
                learningVelocity: 0,
                retentionRate: 0,
                strugglingConcepts: [],
                masteredConcepts: [],
                currentLevel: 'beginner'
            },
            milestones: [],
            recommendations: []
        };
    }

    /**
     * Update concept mastery based on interaction
     * @param {Object} progression - Student progression object
     * @param {Object} interaction - Interaction record
     */
    async updateConceptMastery(progression, interaction) {
        const { conceptId, conceptName, success, difficulty, confidence } = interaction;

        if (!progression.conceptMastery[conceptId]) {
            progression.conceptMastery[conceptId] = {
                conceptId,
                conceptName,
                firstSeen: interaction.timestamp,
                lastSeen: interaction.timestamp,
                attempts: 0,
                successes: 0,
                failures: 0,
                averageDifficulty: 0,
                averageConfidence: 0,
                masteryLevel: 0, // 0-100
                status: 'learning', // learning, mastered, struggling
                history: []
            };
        }

        const mastery = progression.conceptMastery[conceptId];
        mastery.lastSeen = interaction.timestamp;
        mastery.attempts++;

        if (success === true) {
            mastery.successes++;
        } else if (success === false) {
            mastery.failures++;
        }

        // Update averages
        mastery.averageDifficulty =
            (mastery.averageDifficulty * (mastery.attempts - 1) + difficulty) / mastery.attempts;

        if (confidence !== null) {
            mastery.averageConfidence =
                (mastery.averageConfidence * (mastery.attempts - 1) + confidence) / mastery.attempts;
        }

        // Calculate mastery level using multiple factors
        const successRate = mastery.attempts > 0 ? mastery.successes / mastery.attempts : 0;
        const consistencyBonus = this.calculateConsistency(mastery.history);
        const difficultyFactor = Math.min(mastery.averageDifficulty / 10, 1);
        const recencyFactor = this.calculateRecencyFactor(mastery.lastSeen);

        mastery.masteryLevel = Math.min(100, Math.round(
            (successRate * 40) + // Success rate contributes 40%
            (consistencyBonus * 20) + // Consistency contributes 20%
            (difficultyFactor * 20) + // Difficulty contributes 20%
            (recencyFactor * 20) // Recency contributes 20%
        ));

        // Update status
        if (mastery.masteryLevel >= 80) {
            mastery.status = 'mastered';
        } else if (successRate < 0.4 && mastery.attempts >= 3) {
            mastery.status = 'struggling';
        } else {
            mastery.status = 'learning';
        }

        // Add to history
        mastery.history.push({
            timestamp: interaction.timestamp,
            success,
            difficulty,
            confidence,
            masteryLevel: mastery.masteryLevel
        });

        // Keep history manageable
        if (mastery.history.length > 50) {
            mastery.history = mastery.history.slice(-50);
        }
    }

    /**
     * Calculate consistency in performance
     * @param {Array} history - Performance history
     */
    calculateConsistency(history) {
        if (history.length < 3) return 0;

        const recent = history.slice(-10);
        const successes = recent.filter(h => h.success).length;
        const successRate = successes / recent.length;

        // High consistency = success rate close to 0 or 1
        // Low consistency = success rate around 0.5
        return Math.abs(successRate - 0.5) * 2;
    }

    /**
     * Calculate recency factor for mastery
     * @param {number} lastSeen - Timestamp of last interaction
     */
    calculateRecencyFactor(lastSeen) {
        const daysSinceLastSeen = (Date.now() - lastSeen) / (1000 * 60 * 60 * 24);

        // Fresh (< 7 days) = 1.0
        // 1 month old = 0.5
        // 3 months old = 0.0
        return Math.max(0, 1 - (daysSinceLastSeen / 90));
    }

    /**
     * Update learning path
     * @param {Object} progression - Student progression object
     * @param {Object} interaction - Interaction record
     */
    async updateLearningPath(progression, interaction) {
        const pathEntry = {
            timestamp: interaction.timestamp,
            conceptId: interaction.conceptId,
            conceptName: interaction.conceptName,
            subject: interaction.subject,
            grade: interaction.grade,
            success: interaction.success,
            masteryLevel: progression.conceptMastery[interaction.conceptId]?.masteryLevel || 0
        };

        progression.learningPath.push(pathEntry);

        // Detect learning patterns
        const patterns = this.detectLearningPatterns(progression.learningPath);
        progression.patterns = patterns;

        // Keep path manageable (last 200 entries)
        if (progression.learningPath.length > 200) {
            progression.learningPath = progression.learningPath.slice(-200);
        }
    }

    /**
     * Detect patterns in learning path
     * @param {Array} learningPath - Learning path entries
     */
    detectLearningPatterns(learningPath) {
        if (learningPath.length < 5) return {};

        const recent = learningPath.slice(-20);

        return {
            preferredSubjects: this.findPreferredSubjects(recent),
            learningStyle: this.identifyLearningStyle(recent),
            studyFrequency: this.calculateStudyFrequency(learningPath),
            progressionSpeed: this.calculateProgressionSpeed(recent),
            strugglingAreas: this.identifyStrugglingAreas(recent)
        };
    }

    /**
     * Find preferred subjects
     */
    findPreferredSubjects(interactions) {
        const subjectCounts = {};
        const subjectSuccess = {};

        interactions.forEach(int => {
            const subject = int.subject || 'Unknown';
            subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;

            if (int.success !== null) {
                if (!subjectSuccess[subject]) {
                    subjectSuccess[subject] = { total: 0, success: 0 };
                }
                subjectSuccess[subject].total++;
                if (int.success) subjectSuccess[subject].success++;
            }
        });

        return Object.keys(subjectCounts)
            .map(subject => ({
                subject,
                frequency: subjectCounts[subject],
                successRate: subjectSuccess[subject]
                    ? subjectSuccess[subject].success / subjectSuccess[subject].total
                    : 0
            }))
            .sort((a, b) => b.frequency - a.frequency);
    }

    /**
     * Identify learning style based on patterns
     */
    identifyLearningStyle(interactions) {
        // Analyze patterns to determine learning style
        const avgResponseTime = interactions.reduce((sum, int) =>
            sum + (int.responseTime || 0), 0) / interactions.length;

        const successRate = interactions.filter(int => int.success).length / interactions.length;

        if (avgResponseTime < 30000 && successRate > 0.7) {
            return 'quick_learner';
        } else if (avgResponseTime > 60000 && successRate > 0.7) {
            return 'thorough_learner';
        } else if (successRate < 0.5) {
            return 'needs_support';
        } else {
            return 'steady_learner';
        }
    }

    /**
     * Calculate study frequency
     */
    calculateStudyFrequency(learningPath) {
        if (learningPath.length < 2) return 'insufficient_data';

        const timeSpan = Date.now() - learningPath[0].timestamp;
        const days = timeSpan / (1000 * 60 * 60 * 24);
        const interactionsPerDay = learningPath.length / days;

        if (interactionsPerDay > 10) return 'very_high';
        if (interactionsPerDay > 5) return 'high';
        if (interactionsPerDay > 2) return 'moderate';
        if (interactionsPerDay > 0.5) return 'low';
        return 'very_low';
    }

    /**
     * Calculate progression speed
     */
    calculateProgressionSpeed(recent) {
        const masteryGains = recent.map((entry, i) => {
            if (i === 0) return 0;
            return entry.masteryLevel - recent[i - 1].masteryLevel;
        });

        const avgGain = masteryGains.reduce((sum, gain) => sum + gain, 0) / masteryGains.length;

        if (avgGain > 5) return 'fast';
        if (avgGain > 2) return 'moderate';
        if (avgGain > 0) return 'slow';
        return 'stagnant';
    }

    /**
     * Identify struggling areas
     */
    identifyStrugglingAreas(recent) {
        const conceptPerformance = {};

        recent.forEach(int => {
            if (!conceptPerformance[int.conceptName]) {
                conceptPerformance[int.conceptName] = {
                    attempts: 0,
                    successes: 0,
                    avgMastery: 0
                };
            }
            conceptPerformance[int.conceptName].attempts++;
            if (int.success) conceptPerformance[int.conceptName].successes++;
            conceptPerformance[int.conceptName].avgMastery = int.masteryLevel;
        });

        return Object.keys(conceptPerformance)
            .filter(concept => {
                const perf = conceptPerformance[concept];
                return perf.attempts >= 2 &&
                       (perf.successes / perf.attempts < 0.5 || perf.avgMastery < 40);
            })
            .map(concept => ({
                concept,
                successRate: conceptPerformance[concept].successes /
                            conceptPerformance[concept].attempts,
                masteryLevel: conceptPerformance[concept].avgMastery
            }));
    }

    /**
     * Calculate overall progression metrics
     * @param {Object} progression - Student progression object
     */
    async calculateProgressionMetrics(progression) {
        const interactions = progression.interactions;
        const conceptMastery = progression.conceptMastery;

        if (interactions.length === 0) return;

        // Total interactions
        progression.metrics.totalInteractions = interactions.length;

        // Average success rate
        const successfulInteractions = interactions.filter(int => int.success === true);
        progression.metrics.averageSuccessRate =
            successfulInteractions.length / interactions.length;

        // Average response time
        const timesSum = interactions.reduce((sum, int) =>
            sum + (int.responseTime || 0), 0);
        progression.metrics.averageResponseTime = timesSum / interactions.length;

        // Average confidence
        const confidenceInteractions = interactions.filter(int => int.confidence !== null);
        if (confidenceInteractions.length > 0) {
            const confidenceSum = confidenceInteractions.reduce((sum, int) =>
                sum + int.confidence, 0);
            progression.metrics.averageConfidence = confidenceSum / confidenceInteractions.length;
        }

        // Learning velocity (mastery points gained per day)
        const learningVelocity = this.calculateLearningVelocity(progression);
        progression.metrics.learningVelocity = learningVelocity;

        // Retention rate (concepts that remain mastered over time)
        const retentionRate = this.calculateRetentionRate(conceptMastery);
        progression.metrics.retentionRate = retentionRate;

        // Struggling and mastered concepts
        const struggling = [];
        const mastered = [];

        Object.values(conceptMastery).forEach(concept => {
            if (concept.status === 'struggling') {
                struggling.push({
                    conceptId: concept.conceptId,
                    conceptName: concept.conceptName,
                    masteryLevel: concept.masteryLevel,
                    attempts: concept.attempts,
                    successRate: concept.attempts > 0 ? concept.successes / concept.attempts : 0
                });
            } else if (concept.status === 'mastered') {
                mastered.push({
                    conceptId: concept.conceptId,
                    conceptName: concept.conceptName,
                    masteryLevel: concept.masteryLevel,
                    achievedAt: concept.lastSeen
                });
            }
        });

        progression.metrics.strugglingConcepts = struggling;
        progression.metrics.masteredConcepts = mastered;

        // Determine current level
        const avgMastery = Object.values(conceptMastery).reduce((sum, c) =>
            sum + c.masteryLevel, 0) / Object.keys(conceptMastery).length;

        if (avgMastery >= 80) {
            progression.metrics.currentLevel = 'advanced';
        } else if (avgMastery >= 50) {
            progression.metrics.currentLevel = 'intermediate';
        } else {
            progression.metrics.currentLevel = 'beginner';
        }

        // Check for milestones
        this.checkMilestones(progression);

        // Generate recommendations
        progression.recommendations = this.generateRecommendations(progression);
    }

    /**
     * Calculate learning velocity
     */
    calculateLearningVelocity(progression) {
        const concepts = Object.values(progression.conceptMastery);
        if (concepts.length === 0) return 0;

        const totalMasteryGain = concepts.reduce((sum, concept) =>
            sum + concept.masteryLevel, 0);

        const timeSpan = Date.now() - progression.createdAt;
        const days = Math.max(1, timeSpan / (1000 * 60 * 60 * 24));

        return totalMasteryGain / days;
    }

    /**
     * Calculate retention rate
     */
    calculateRetentionRate(conceptMastery) {
        const concepts = Object.values(conceptMastery);
        const masteredConcepts = concepts.filter(c => c.masteryLevel >= 80);

        if (masteredConcepts.length === 0) return 0;

        // Check how many mastered concepts are still recent
        const retainedConcepts = masteredConcepts.filter(c => {
            const daysSinceLastSeen = (Date.now() - c.lastSeen) / (1000 * 60 * 60 * 24);
            return daysSinceLastSeen < 30; // Retained if reviewed in last 30 days
        });

        return retainedConcepts.length / masteredConcepts.length;
    }

    /**
     * Check for milestone achievements
     */
    checkMilestones(progression) {
        const milestones = [
            {
                id: 'first_interaction',
                name: 'First Step',
                condition: () => progression.interactions.length >= 1,
                achieved: false
            },
            {
                id: 'ten_interactions',
                name: '10 Interactions',
                condition: () => progression.interactions.length >= 10,
                achieved: false
            },
            {
                id: 'first_mastery',
                name: 'First Concept Mastered',
                condition: () => progression.metrics.masteredConcepts.length >= 1,
                achieved: false
            },
            {
                id: 'five_mastery',
                name: '5 Concepts Mastered',
                condition: () => progression.metrics.masteredConcepts.length >= 5,
                achieved: false
            },
            {
                id: 'consistent_week',
                name: 'Week Streak',
                condition: () => this.checkConsistency(progression, 7),
                achieved: false
            },
            {
                id: 'high_success',
                name: 'High Achiever',
                condition: () => progression.metrics.averageSuccessRate >= 0.8 &&
                                progression.interactions.length >= 20,
                achieved: false
            }
        ];

        milestones.forEach(milestone => {
            const existing = progression.milestones.find(m => m.id === milestone.id);

            if (!existing && milestone.condition()) {
                progression.milestones.push({
                    id: milestone.id,
                    name: milestone.name,
                    achievedAt: Date.now()
                });
            }
        });
    }

    /**
     * Check study consistency
     */
    checkConsistency(progression, days) {
        const recentInteractions = progression.interactions.filter(int => {
            const daysSince = (Date.now() - int.timestamp) / (1000 * 60 * 60 * 24);
            return daysSince <= days;
        });

        // Check if there's at least one interaction each day
        const uniqueDays = new Set(recentInteractions.map(int => {
            const date = new Date(int.timestamp);
            return date.toISOString().split('T')[0];
        }));

        return uniqueDays.size >= days;
    }

    /**
     * Generate personalized recommendations
     */
    generateRecommendations(progression) {
        const recommendations = [];

        // Struggling concepts
        if (progression.metrics.strugglingConcepts.length > 0) {
            recommendations.push({
                type: 'review',
                priority: 'high',
                title: 'Review Struggling Concepts',
                description: `You're having difficulty with ${progression.metrics.strugglingConcepts.length} concept(s)`,
                concepts: progression.metrics.strugglingConcepts.map(c => c.conceptName),
                action: 'Review these concepts with additional examples and practice'
            });
        }

        // Low retention
        if (progression.metrics.retentionRate < 0.5 &&
            progression.metrics.masteredConcepts.length > 0) {
            recommendations.push({
                type: 'retention',
                priority: 'medium',
                title: 'Improve Retention',
                description: 'Regular review needed to maintain mastery',
                action: 'Schedule periodic reviews of mastered concepts'
            });
        }

        // Learning velocity
        if (progression.metrics.learningVelocity < 1) {
            recommendations.push({
                type: 'pace',
                priority: 'low',
                title: 'Increase Study Pace',
                description: 'Consider increasing study frequency',
                action: 'Try to study more regularly for better progress'
            });
        }

        // Prerequisites
        const prerequisiteGaps = this.identifyPrerequisiteGaps(progression);
        if (prerequisiteGaps.length > 0) {
            recommendations.push({
                type: 'prerequisites',
                priority: 'high',
                title: 'Fill Knowledge Gaps',
                description: 'Some prerequisite concepts need attention',
                concepts: prerequisiteGaps,
                action: 'Focus on foundational concepts before advancing'
            });
        }

        return recommendations;
    }

    /**
     * Identify prerequisite gaps
     */
    identifyPrerequisiteGaps(progression) {
        // Simple heuristic: if struggling with advanced concepts but not practicing basics
        const conceptsByDifficulty = Object.values(progression.conceptMastery)
            .sort((a, b) => a.averageDifficulty - b.averageDifficulty);

        const gaps = [];
        conceptsByDifficulty.forEach((concept, index) => {
            if (concept.status === 'struggling' && index > 0) {
                // Check if earlier concepts are mastered
                const earlier = conceptsByDifficulty.slice(0, index);
                const unmasteredPrereqs = earlier.filter(c => c.masteryLevel < 60);

                if (unmasteredPrereqs.length > 0) {
                    gaps.push(...unmasteredPrereqs.map(c => c.conceptName));
                }
            }
        });

        return [...new Set(gaps)]; // Remove duplicates
    }

    /**
     * Estimate difficulty of a concept
     */
    estimateDifficulty(conceptName, subject) {
        // Simple heuristic based on keywords
        const advancedKeywords = [
            'advanced', 'complex', 'theorem', 'proof', 'analysis',
            'integration', 'differentiation', 'matrix', 'vector'
        ];

        const basicKeywords = [
            'introduction', 'basic', 'simple', 'fundamental', 'overview'
        ];

        const conceptLower = conceptName.toLowerCase();

        if (advancedKeywords.some(kw => conceptLower.includes(kw))) {
            return 8;
        } else if (basicKeywords.some(kw => conceptLower.includes(kw))) {
            return 3;
        }

        return 5; // Default medium difficulty
    }

    /**
     * Save progression to database
     */
    async saveProgression(progression) {
        progression.updatedAt = Date.now();

        try {
            await this.database.put('progressions', progression);
            this.progressCache.set(progression.studentId, { ...progression });
        } catch (error) {
            console.error('Failed to save progression:', error);
            throw error;
        }
    }

    /**
     * Get progression analytics for a student
     * @param {string} studentId - Student identifier
     */
    async getProgressionAnalytics(studentId) {
        const progression = await this.getStudentProgression(studentId);

        return {
            overview: {
                totalInteractions: progression.metrics.totalInteractions,
                successRate: progression.metrics.averageSuccessRate,
                currentLevel: progression.metrics.currentLevel,
                learningVelocity: progression.metrics.learningVelocity,
                retentionRate: progression.metrics.retentionRate
            },
            mastery: {
                mastered: progression.metrics.masteredConcepts,
                struggling: progression.metrics.strugglingConcepts,
                learning: Object.values(progression.conceptMastery)
                    .filter(c => c.status === 'learning')
            },
            patterns: progression.patterns || {},
            milestones: progression.milestones,
            recommendations: progression.recommendations,
            learningPath: progression.learningPath.slice(-20) // Recent 20 entries
        };
    }

    /**
     * Export progression data
     * @param {string} studentId - Student identifier
     * @param {string} format - Export format (json, csv)
     */
    async exportProgressionData(studentId, format = 'json') {
        const analytics = await this.getProgressionAnalytics(studentId);

        if (format === 'json') {
            return JSON.stringify(analytics, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(analytics);
        }

        throw new Error(`Unsupported export format: ${format}`);
    }

    /**
     * Convert analytics to CSV format
     */
    convertToCSV(analytics) {
        const rows = [];

        // Header
        rows.push('Metric,Value');

        // Overview
        rows.push(`Total Interactions,${analytics.overview.totalInteractions}`);
        rows.push(`Success Rate,${(analytics.overview.successRate * 100).toFixed(2)}%`);
        rows.push(`Current Level,${analytics.overview.currentLevel}`);
        rows.push(`Learning Velocity,${analytics.overview.learningVelocity.toFixed(2)}`);
        rows.push(`Retention Rate,${(analytics.overview.retentionRate * 100).toFixed(2)}%`);

        rows.push(''); // Empty row

        // Mastered concepts
        rows.push('Mastered Concepts');
        rows.push('Concept,Mastery Level');
        analytics.mastery.mastered.forEach(c => {
            rows.push(`${c.conceptName},${c.masteryLevel}`);
        });

        rows.push(''); // Empty row

        // Struggling concepts
        rows.push('Struggling Concepts');
        rows.push('Concept,Mastery Level,Success Rate');
        analytics.mastery.struggling.forEach(c => {
            rows.push(`${c.conceptName},${c.masteryLevel},${(c.successRate * 100).toFixed(2)}%`);
        });

        return rows.join('\n');
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ProgressionTracker = ProgressionTracker;
}
