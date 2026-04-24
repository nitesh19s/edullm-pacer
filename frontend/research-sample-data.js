/**
 * Sample Data for Research Tools
 * Provides realistic data for Progression Tracking, Curriculum Gaps, and Cross-Subject Analytics
 */

class ResearchSampleData {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize all research tools with sample data
     */
    async initializeAll() {
        if (this.initialized) {
            console.log('Research sample data already initialized');
            return;
        }

        console.log('Initializing research sample data...');

        try {
            await this.initializeProgressionData();
            await this.initializeGapsData();
            await this.initializeCrossSubjectData();

            this.initialized = true;
            console.log('✓ Research sample data initialized successfully');
        } catch (error) {
            console.error('Error initializing research sample data:', error);
        }
    }

    /**
     * Initialize Progression Tracking sample data
     */
    async initializeProgressionData() {
        const progressionData = {
            studentId: 'student_001',
            studentName: 'Sample Student',
            currentLevel: 'Intermediate',
            overallProgress: 72,
            conceptsMastered: 45,
            conceptsInProgress: 12,
            conceptsNotStarted: 8,
            learningPath: [
                {
                    date: '2024-01-15',
                    concept: 'Basic Algebra',
                    subject: 'Mathematics',
                    level: 'Beginner',
                    score: 85,
                    timeSpent: 120,
                    status: 'mastered'
                },
                {
                    date: '2024-01-20',
                    concept: 'Linear Equations',
                    subject: 'Mathematics',
                    level: 'Intermediate',
                    score: 78,
                    timeSpent: 90,
                    status: 'mastered'
                },
                {
                    date: '2024-01-25',
                    concept: 'Quadratic Equations',
                    subject: 'Mathematics',
                    level: 'Intermediate',
                    score: 82,
                    timeSpent: 105,
                    status: 'mastered'
                },
                {
                    date: '2024-02-01',
                    concept: 'Newton\'s Laws',
                    subject: 'Physics',
                    level: 'Intermediate',
                    score: 75,
                    timeSpent: 85,
                    status: 'in_progress'
                },
                {
                    date: '2024-02-05',
                    concept: 'Chemical Bonding',
                    subject: 'Chemistry',
                    level: 'Intermediate',
                    score: 88,
                    timeSpent: 95,
                    status: 'mastered'
                },
                {
                    date: '2024-02-10',
                    concept: 'Cell Biology',
                    subject: 'Biology',
                    level: 'Beginner',
                    score: 90,
                    timeSpent: 110,
                    status: 'mastered'
                },
                {
                    date: '2024-02-15',
                    concept: 'Trigonometry',
                    subject: 'Mathematics',
                    level: 'Advanced',
                    score: 65,
                    timeSpent: 120,
                    status: 'in_progress'
                }
            ],
            masteryLevels: {
                'Mathematics': {
                    overall: 78,
                    beginner: 95,
                    intermediate: 85,
                    advanced: 60
                },
                'Physics': {
                    overall: 70,
                    beginner: 88,
                    intermediate: 72,
                    advanced: 55
                },
                'Chemistry': {
                    overall: 82,
                    beginner: 92,
                    intermediate: 86,
                    advanced: 68
                },
                'Biology': {
                    overall: 85,
                    beginner: 94,
                    intermediate: 88,
                    advanced: 72
                }
            },
            progressionTrend: [
                { week: 'Week 1', score: 65 },
                { week: 'Week 2', score: 70 },
                { week: 'Week 3', score: 72 },
                { week: 'Week 4', score: 75 },
                { week: 'Week 5', score: 78 },
                { week: 'Week 6', score: 80 },
                { week: 'Week 7', score: 82 },
                { week: 'Week 8', score: 85 }
            ],
            recommendations: [
                {
                    type: 'focus_area',
                    title: 'Advanced Trigonometry',
                    description: 'Focus on mastering trigonometric identities and applications',
                    priority: 'high'
                },
                {
                    type: 'revision',
                    title: 'Newton\'s Laws Review',
                    description: 'Review force diagrams and problem-solving techniques',
                    priority: 'medium'
                },
                {
                    type: 'practice',
                    title: 'More Practice Problems',
                    description: 'Complete additional practice sets for quadratic equations',
                    priority: 'low'
                }
            ]
        };

        // Store in window object for access by progression tracker
        window.sampleProgressionData = progressionData;

        // Populate UI elements if they exist
        this.populateProgressionUI(progressionData);

        console.log('✓ Progression tracking sample data loaded');
    }

    /**
     * Populate Progression Tracking UI with sample data
     */
    populateProgressionUI(data) {
        // Update metric cards
        const currentLevel = document.getElementById('currentLevel');
        if (currentLevel) currentLevel.textContent = data.currentLevel;

        const overallProgress = document.getElementById('overallProgress');
        if (overallProgress) overallProgress.textContent = `${data.overallProgress}%`;

        const conceptsMastered = document.getElementById('conceptsMastered');
        if (conceptsMastered) conceptsMastered.textContent = data.conceptsMastered;

        const activeTopics = document.getElementById('activeTopics');
        if (activeTopics) activeTopics.textContent = data.conceptsInProgress;

        // Update progression chart if visualization exists
        if (window.ProgressionVisualizations && typeof window.ProgressionVisualizations.updateProgressionChart === 'function') {
            window.ProgressionVisualizations.updateProgressionChart(data.progressionTrend);
        }

        // Update mastery levels chart
        if (window.ProgressionVisualizations && typeof window.ProgressionVisualizations.updateMasteryChart === 'function') {
            window.ProgressionVisualizations.updateMasteryChart(data.masteryLevels);
        }

        // Populate recommendations
        const recommendationsContainer = document.getElementById('progressionRecommendationsContainer');
        if (recommendationsContainer) {
            recommendationsContainer.innerHTML = data.recommendations.map(rec => `
                <div class="recommendation-card ${rec.priority}-priority">
                    <div class="recommendation-header">
                        <span class="recommendation-type">${rec.type.replace('_', ' ').toUpperCase()}</span>
                        <span class="priority-badge ${rec.priority}">${rec.priority}</span>
                    </div>
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                </div>
            `).join('');
        }
    }

    /**
     * Initialize Curriculum Gaps sample data
     */
    async initializeGapsData() {
        const gapsData = {
            targetGrade: 10,
            targetSubject: 'Mathematics',
            analysisDate: new Date().toISOString(),
            overallGapScore: 25, // 0-100, lower is better
            totalGapsIdentified: 12,
            criticalGaps: 3,
            moderateGaps: 5,
            minorGaps: 4,
            gaps: [
                {
                    id: 'gap_001',
                    concept: 'Quadratic Formula Application',
                    subject: 'Mathematics',
                    grade: 10,
                    severity: 'critical',
                    description: 'Difficulty applying quadratic formula to word problems',
                    prerequisites: ['Basic Algebra', 'Equation Solving'],
                    recommendations: [
                        'Review quadratic equation fundamentals',
                        'Practice 10 word problems daily',
                        'Watch tutorial videos on applications'
                    ],
                    estimatedTime: 5 // hours to fill gap
                },
                {
                    id: 'gap_002',
                    concept: 'Trigonometric Ratios',
                    subject: 'Mathematics',
                    grade: 10,
                    severity: 'critical',
                    description: 'Missing understanding of sine, cosine, tangent relationships',
                    prerequisites: ['Right Triangle Properties', 'Angle Measurement'],
                    recommendations: [
                        'Study unit circle and basic ratios',
                        'Practice ratio calculations',
                        'Solve triangle problems'
                    ],
                    estimatedTime: 6
                },
                {
                    id: 'gap_003',
                    concept: 'Polynomial Factorization',
                    subject: 'Mathematics',
                    grade: 10,
                    severity: 'critical',
                    description: 'Incomplete mastery of factorization techniques',
                    prerequisites: ['Algebraic Expressions', 'Common Factors'],
                    recommendations: [
                        'Learn different factorization methods',
                        'Practice with varied polynomials',
                        'Master special products'
                    ],
                    estimatedTime: 4
                },
                {
                    id: 'gap_004',
                    concept: 'Electromagnetic Induction',
                    subject: 'Physics',
                    grade: 10,
                    severity: 'moderate',
                    description: 'Partial understanding of Faraday\'s law applications',
                    prerequisites: ['Magnetic Fields', 'Electric Current'],
                    recommendations: [
                        'Review Faraday\'s law derivation',
                        'Study practical applications',
                        'Solve numerical problems'
                    ],
                    estimatedTime: 3
                },
                {
                    id: 'gap_005',
                    concept: 'Chemical Equilibrium',
                    subject: 'Chemistry',
                    grade: 10,
                    severity: 'moderate',
                    description: 'Difficulty with Le Chatelier\'s principle',
                    prerequisites: ['Reversible Reactions', 'Reaction Rates'],
                    recommendations: [
                        'Study equilibrium constant calculations',
                        'Practice Le Chatelier predictions',
                        'Analyze example reactions'
                    ],
                    estimatedTime: 4
                },
                {
                    id: 'gap_006',
                    concept: 'Genetics Basics',
                    subject: 'Biology',
                    grade: 10,
                    severity: 'moderate',
                    description: 'Incomplete understanding of Mendelian inheritance',
                    prerequisites: ['Cell Division', 'DNA Structure'],
                    recommendations: [
                        'Study Punnett squares',
                        'Practice inheritance problems',
                        'Review genetic terminology'
                    ],
                    estimatedTime: 3
                }
            ],
            gapsBySubject: {
                'Mathematics': 5,
                'Physics': 3,
                'Chemistry': 2,
                'Biology': 2
            },
            gapsBySeverity: {
                'critical': 3,
                'moderate': 5,
                'minor': 4
            },
            prerequisitesNeeded: [
                { concept: 'Basic Algebra', importance: 'high', mastered: true },
                { concept: 'Right Triangle Properties', importance: 'high', mastered: false },
                { concept: 'Magnetic Fields', importance: 'medium', mastered: true },
                { concept: 'Reversible Reactions', importance: 'medium', mastered: false },
                { concept: 'Cell Division', importance: 'medium', mastered: true }
            ],
            learningPath: [
                { step: 1, concept: 'Right Triangle Properties', duration: 2 },
                { step: 2, concept: 'Trigonometric Ratios', duration: 6 },
                { step: 3, concept: 'Polynomial Factorization', duration: 4 },
                { step: 4, concept: 'Quadratic Formula Application', duration: 5 },
                { step: 5, concept: 'Reversible Reactions', duration: 3 },
                { step: 6, concept: 'Chemical Equilibrium', duration: 4 }
            ]
        };

        // Store in window object
        window.sampleGapsData = gapsData;

        // Populate UI
        this.populateGapsUI(gapsData);

        console.log('✓ Curriculum gaps sample data loaded');
    }

    /**
     * Populate Gaps Analysis UI with sample data
     */
    populateGapsUI(data) {
        // Update summary metrics
        const totalGaps = document.getElementById('totalGapsIdentified');
        if (totalGaps) totalGaps.textContent = data.totalGapsIdentified;

        const criticalGaps = document.getElementById('criticalGapsCount');
        if (criticalGaps) criticalGaps.textContent = data.criticalGaps;

        const gapScore = document.getElementById('overallGapScore');
        if (gapScore) gapScore.textContent = `${data.overallGapScore}%`;

        // Update charts if visualization exists
        if (window.GapCrossSubjectVisualizations) {
            if (typeof window.GapCrossSubjectVisualizations.updateGapsBySubjectChart === 'function') {
                window.GapCrossSubjectVisualizations.updateGapsBySubjectChart(data.gapsBySubject);
            }
            if (typeof window.GapCrossSubjectVisualizations.updateGapsBySeverityChart === 'function') {
                window.GapCrossSubjectVisualizations.updateGapsBySeverityChart(data.gapsBySeverity);
            }
        }

        // Populate gaps list
        const gapsList = document.getElementById('gapsList');
        if (gapsList) {
            gapsList.innerHTML = data.gaps.map(gap => `
                <div class="gap-card ${gap.severity}">
                    <div class="gap-header">
                        <h4>${gap.concept}</h4>
                        <span class="severity-badge ${gap.severity}">${gap.severity}</span>
                    </div>
                    <p class="gap-subject">${gap.subject} - Grade ${gap.grade}</p>
                    <p class="gap-description">${gap.description}</p>
                    <div class="gap-prerequisites">
                        <strong>Prerequisites:</strong> ${gap.prerequisites.join(', ')}
                    </div>
                    <div class="gap-time">
                        <i class="fas fa-clock"></i> ${gap.estimatedTime} hours
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * Initialize Cross-Subject Analytics sample data
     */
    async initializeCrossSubjectData() {
        const crossSubjectData = {
            analysisDate: new Date().toISOString(),
            subjectsAnalyzed: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
            overallPerformance: 78,
            performanceBySubject: {
                'Mathematics': 82,
                'Physics': 75,
                'Chemistry': 80,
                'Biology': 76
            },
            correlations: [
                {
                    subject1: 'Mathematics',
                    subject2: 'Physics',
                    correlation: 0.85,
                    strength: 'strong',
                    insight: 'Strong positive correlation - mathematical skills directly benefit physics performance'
                },
                {
                    subject1: 'Chemistry',
                    subject2: 'Biology',
                    correlation: 0.72,
                    strength: 'moderate',
                    insight: 'Moderate correlation - chemistry knowledge helps with biochemistry topics'
                },
                {
                    subject1: 'Mathematics',
                    subject2: 'Chemistry',
                    correlation: 0.68,
                    strength: 'moderate',
                    insight: 'Mathematical skills support stoichiometry and calculations'
                },
                {
                    subject1: 'Physics',
                    subject2: 'Chemistry',
                    correlation: 0.65,
                    strength: 'moderate',
                    insight: 'Shared concepts in atomic structure and energy'
                }
            ],
            conceptConnections: [
                {
                    concept: 'Energy Conservation',
                    subjects: ['Physics', 'Chemistry', 'Biology'],
                    strength: 'high',
                    description: 'Fundamental principle across multiple sciences'
                },
                {
                    concept: 'Atomic Structure',
                    subjects: ['Physics', 'Chemistry'],
                    strength: 'high',
                    description: 'Core concept linking physical and chemical properties'
                },
                {
                    concept: 'Mathematical Modeling',
                    subjects: ['Mathematics', 'Physics', 'Chemistry'],
                    strength: 'high',
                    description: 'Essential tool for scientific analysis'
                },
                {
                    concept: 'Molecular Interactions',
                    subjects: ['Chemistry', 'Biology'],
                    strength: 'medium',
                    description: 'Basis for understanding biological processes'
                }
            ],
            strengthsAndWeaknesses: {
                strengths: [
                    {
                        area: 'Quantitative Analysis',
                        subjects: ['Mathematics', 'Physics'],
                        score: 85,
                        description: 'Strong problem-solving and numerical skills'
                    },
                    {
                        area: 'Conceptual Understanding',
                        subjects: ['Biology', 'Chemistry'],
                        score: 82,
                        description: 'Good grasp of theoretical concepts'
                    }
                ],
                weaknesses: [
                    {
                        area: 'Applied Mathematics in Physics',
                        subjects: ['Mathematics', 'Physics'],
                        score: 65,
                        description: 'Difficulty applying math concepts to physics problems'
                    },
                    {
                        area: 'Chemical Calculations',
                        subjects: ['Mathematics', 'Chemistry'],
                        score: 68,
                        description: 'Needs improvement in stoichiometry and molarity'
                    }
                ]
            },
            performanceTrend: [
                {
                    period: 'Jan',
                    Mathematics: 75,
                    Physics: 70,
                    Chemistry: 72,
                    Biology: 73
                },
                {
                    period: 'Feb',
                    Mathematics: 78,
                    Physics: 73,
                    Chemistry: 76,
                    Biology: 75
                },
                {
                    period: 'Mar',
                    Mathematics: 80,
                    Physics: 74,
                    Chemistry: 78,
                    Biology: 76
                },
                {
                    period: 'Apr',
                    Mathematics: 82,
                    Physics: 75,
                    Chemistry: 80,
                    Biology: 76
                }
            ],
            recommendations: [
                {
                    title: 'Strengthen Mathematical Foundations',
                    subjects: ['Mathematics', 'Physics', 'Chemistry'],
                    priority: 'high',
                    description: 'Focus on algebraic manipulation and equation solving to improve performance across all sciences',
                    expectedImpact: 'high'
                },
                {
                    title: 'Integrate Learning Across Sciences',
                    subjects: ['Physics', 'Chemistry', 'Biology'],
                    priority: 'medium',
                    description: 'Study connections between energy concepts in different subjects',
                    expectedImpact: 'medium'
                },
                {
                    title: 'Practice Cross-Subject Problems',
                    subjects: ['All'],
                    priority: 'medium',
                    description: 'Solve problems requiring knowledge from multiple subjects',
                    expectedImpact: 'high'
                }
            ]
        };

        // Store in window object
        window.sampleCrossSubjectData = crossSubjectData;

        // Populate UI
        this.populateCrossSubjectUI(crossSubjectData);

        console.log('✓ Cross-subject analytics sample data loaded');
    }

    /**
     * Populate Cross-Subject Analytics UI with sample data
     */
    populateCrossSubjectUI(data) {
        // Update summary metrics
        const subjectsAnalyzed = document.getElementById('subjectsAnalyzed');
        if (subjectsAnalyzed) subjectsAnalyzed.textContent = data.subjectsAnalyzed.length;

        const strongConnections = document.getElementById('strongConnections');
        if (strongConnections) {
            const strong = data.correlations.filter(c => c.strength === 'strong').length;
            strongConnections.textContent = strong;
        }

        const overallPerformance = document.getElementById('crossSubjectOverallPerformance');
        if (overallPerformance) overallPerformance.textContent = `${data.overallPerformance}%`;

        // Update charts if visualization exists
        if (window.GapCrossSubjectVisualizations) {
            if (typeof window.GapCrossSubjectVisualizations.updateCrossSubjectPerformanceChart === 'function') {
                window.GapCrossSubjectVisualizations.updateCrossSubjectPerformanceChart(data.performanceBySubject);
            }
            if (typeof window.GapCrossSubjectVisualizations.updatePerformanceTrendChart === 'function') {
                window.GapCrossSubjectVisualizations.updatePerformanceTrendChart(data.performanceTrend);
            }
        }

        // Populate correlations
        const correlationsList = document.getElementById('correlationsList');
        if (correlationsList) {
            correlationsList.innerHTML = data.correlations.map(corr => `
                <div class="correlation-card ${corr.strength}">
                    <div class="correlation-subjects">
                        <span class="subject-tag">${corr.subject1}</span>
                        <i class="fas fa-link"></i>
                        <span class="subject-tag">${corr.subject2}</span>
                    </div>
                    <div class="correlation-score">
                        Correlation: ${(corr.correlation * 100).toFixed(0)}%
                        <span class="strength-badge ${corr.strength}">${corr.strength}</span>
                    </div>
                    <p class="correlation-insight">${corr.insight}</p>
                </div>
            `).join('');
        }

        // Populate concept connections
        const conceptConnectionsList = document.getElementById('conceptConnectionsList');
        if (conceptConnectionsList) {
            conceptConnectionsList.innerHTML = data.conceptConnections.map(concept => `
                <div class="concept-connection-card">
                    <h4>${concept.concept}</h4>
                    <div class="concept-subjects">
                        ${concept.subjects.map(s => `<span class="subject-tag">${s}</span>`).join('')}
                    </div>
                    <p>${concept.description}</p>
                    <span class="strength-indicator ${concept.strength}">${concept.strength} connection</span>
                </div>
            `).join('');
        }
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.researchSampleData = new ResearchSampleData();
        // Initialize with a small delay to ensure other scripts are loaded
        setTimeout(() => {
            window.researchSampleData.initializeAll();
        }, 1000);
    });
} else {
    window.researchSampleData = new ResearchSampleData();
    setTimeout(() => {
        window.researchSampleData.initializeAll();
    }, 1000);
}
