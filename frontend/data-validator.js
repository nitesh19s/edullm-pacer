// NCERT Data Validation and Quality Assurance System
class NCERTDataValidator {
    constructor() {
        this.validationRules = this.initializeValidationRules();
        this.qualityMetrics = {
            completeness: 0,
            accuracy: 0,
            consistency: 0,
            coverage: 0
        };
    }

    initializeValidationRules() {
        return {
            content: {
                minLength: 50,
                maxLength: 10000,
                requiredFields: ['subject', 'grade', 'chapter', 'content'],
                forbiddenChars: ['<script>', '<?php', 'javascript:'],
                languagePatterns: {
                    english: /^[a-zA-Z0-9\s\.\,\;\:\!\?\(\)\[\]\{\}\-\+\=\*\/\%\$\#\@\&\^\~\`\'\"\|\\]+$/,
                    hindi: /[\u0900-\u097F]/,
                    mathematical: /[∑∏∫∆∇√∞±≤≥≠≈∝∴∵∠∟⊥∥⊕⊗]/
                }
            },
            structure: {
                expectedSubjects: ['mathematics', 'physics', 'chemistry', 'biology'],
                gradeRange: [9, 12],
                chapterLimits: { min: 5, max: 25 },
                topicLimits: { min: 3, max: 10 }
            },
            curriculum: {
                requiredChapters: {
                    mathematics: {
                        10: ['Real Numbers', 'Polynomials', 'Quadratic Equations'],
                        11: ['Sets', 'Relations and Functions', 'Trigonometric Functions'],
                        12: ['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices']
                    },
                    physics: {
                        11: ['Physical World', 'Units and Measurements', 'Motion in a Straight Line'],
                        12: ['Electric Charges and Fields', 'Electrostatic Potential and Capacitance']
                    },
                    chemistry: {
                        11: ['Some Basic Concepts of Chemistry', 'Structure of Atom'],
                        12: ['The Solid State', 'Solutions', 'Electrochemistry']
                    },
                    biology: {
                        11: ['The Living World', 'Biological Classification', 'Plant Kingdom'],
                        12: ['Reproduction in Organisms', 'Sexual Reproduction in Flowering Plants']
                    }
                }
            }
        };
    }

    // Main validation method
    async validateNCERTData(data) {
        const validationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            qualityScore: 0,
            metrics: {},
            recommendations: []
        };

        try {
            // Structural validation
            const structureValidation = this.validateStructure(data);
            this.mergeValidationResults(validationResult, structureValidation);

            // Content validation
            const contentValidation = this.validateContent(data);
            this.mergeValidationResults(validationResult, contentValidation);

            // Curriculum compliance validation
            const curriculumValidation = this.validateCurriculumCompliance(data);
            this.mergeValidationResults(validationResult, curriculumValidation);

            // Quality metrics calculation
            validationResult.metrics = this.calculateQualityMetrics(data);
            validationResult.qualityScore = this.calculateOverallQualityScore(validationResult.metrics);

            // Generate recommendations
            validationResult.recommendations = this.generateRecommendations(validationResult);

            console.log('NCERT data validation completed:', validationResult);
            return validationResult;

        } catch (error) {
            console.error('Error during validation:', error);
            validationResult.isValid = false;
            validationResult.errors.push(`Validation failed: ${error.message}`);
            return validationResult;
        }
    }

    validateStructure(data) {
        const result = { isValid: true, errors: [], warnings: [] };

        // Check if data exists and has expected structure
        if (!data || typeof data !== 'object') {
            result.isValid = false;
            result.errors.push('Data is null or not an object');
            return result;
        }

        // Validate subjects
        const subjects = Object.keys(data);
        const expectedSubjects = this.validationRules.structure.expectedSubjects;
        
        for (const expectedSubject of expectedSubjects) {
            if (!subjects.includes(expectedSubject)) {
                result.warnings.push(`Missing expected subject: ${expectedSubject}`);
            }
        }

        // Validate each subject structure
        for (const [subject, grades] of Object.entries(data)) {
            if (!expectedSubjects.includes(subject)) {
                result.warnings.push(`Unexpected subject found: ${subject}`);
                continue;
            }

            // Validate grades
            for (const [grade, gradeData] of Object.entries(grades)) {
                const gradeNum = parseInt(grade);
                const { gradeRange } = this.validationRules.structure;
                
                if (isNaN(gradeNum) || gradeNum < gradeRange[0] || gradeNum > gradeRange[1]) {
                    result.errors.push(`Invalid grade ${grade} for subject ${subject}`);
                    continue;
                }

                // Validate grade structure
                if (!gradeData.chapters || !gradeData.metadata) {
                    result.errors.push(`Missing chapters or metadata for ${subject} grade ${grade}`);
                }

                // Validate chapter count
                const chapterCount = Object.keys(gradeData.chapters || {}).length;
                const { chapterLimits } = this.validationRules.structure;
                
                if (chapterCount < chapterLimits.min) {
                    result.warnings.push(`Low chapter count (${chapterCount}) for ${subject} grade ${grade}`);
                } else if (chapterCount > chapterLimits.max) {
                    result.warnings.push(`High chapter count (${chapterCount}) for ${subject} grade ${grade}`);
                }
            }
        }

        return result;
    }

    validateContent(data) {
        const result = { isValid: true, errors: [], warnings: [] };
        const { content: contentRules } = this.validationRules;

        for (const [subject, grades] of Object.entries(data)) {
            for (const [grade, gradeData] of Object.entries(grades)) {
                for (const [chapterName, chapterData] of Object.entries(gradeData.chapters || {})) {
                    
                    // Validate required fields
                    for (const field of contentRules.requiredFields) {
                        if (field === 'subject' && !subject) {
                            result.errors.push(`Missing subject for chapter ${chapterName}`);
                        } else if (field === 'grade' && !grade) {
                            result.errors.push(`Missing grade for chapter ${chapterName}`);
                        } else if (field === 'chapter' && !chapterName) {
                            result.errors.push(`Missing chapter name`);
                        } else if (field === 'content' && !chapterData.content) {
                            result.errors.push(`Missing content for ${subject} grade ${grade} chapter ${chapterName}`);
                        }
                    }

                    // Validate content length
                    if (chapterData.content) {
                        const contentLength = chapterData.content.length;
                        if (contentLength < contentRules.minLength) {
                            result.warnings.push(`Short content (${contentLength} chars) for ${chapterName}`);
                        } else if (contentLength > contentRules.maxLength) {
                            result.warnings.push(`Long content (${contentLength} chars) for ${chapterName}`);
                        }

                        // Check for forbidden characters/patterns
                        for (const forbidden of contentRules.forbiddenChars) {
                            if (chapterData.content.includes(forbidden)) {
                                result.errors.push(`Forbidden pattern "${forbidden}" found in ${chapterName}`);
                            }
                        }

                        // Validate educational content patterns
                        this.validateEducationalContent(chapterData.content, chapterName, subject, result);
                    }

                    // Validate key topics
                    if (chapterData.keyTopics) {
                        const topicCount = chapterData.keyTopics.length;
                        const { topicLimits } = this.validationRules.structure;
                        
                        if (topicCount < topicLimits.min) {
                            result.warnings.push(`Few key topics (${topicCount}) for ${chapterName}`);
                        } else if (topicCount > topicLimits.max) {
                            result.warnings.push(`Many key topics (${topicCount}) for ${chapterName}`);
                        }
                    }
                }
            }
        }

        return result;
    }

    validateEducationalContent(content, chapterName, subject, result) {
        const contentLower = content.toLowerCase();
        
        // Subject-specific validation
        const subjectPatterns = {
            mathematics: ['equation', 'formula', 'theorem', 'proof', 'calculate', 'solve'],
            physics: ['force', 'energy', 'motion', 'field', 'wave', 'particle', 'law'],
            chemistry: ['element', 'compound', 'reaction', 'bond', 'molecule', 'atom'],
            biology: ['cell', 'organism', 'species', 'evolution', 'genetics', 'ecosystem']
        };

        const expectedPatterns = subjectPatterns[subject] || [];
        const foundPatterns = expectedPatterns.filter(pattern => contentLower.includes(pattern));
        
        if (foundPatterns.length === 0) {
            result.warnings.push(`No subject-specific terms found in ${chapterName} (${subject})`);
        }

        // Check for educational structure
        const educationalIndicators = [
            'definition', 'example', 'application', 'problem', 'solution',
            'remember', 'understand', 'apply', 'analyze', 'important'
        ];
        
        const foundIndicators = educationalIndicators.filter(indicator => 
            contentLower.includes(indicator)
        );
        
        if (foundIndicators.length < 2) {
            result.warnings.push(`Limited educational structure in ${chapterName}`);
        }
    }

    validateCurriculumCompliance(data) {
        const result = { isValid: true, errors: [], warnings: [] };
        const { requiredChapters } = this.validationRules.curriculum;

        for (const [subject, gradeChapters] of Object.entries(requiredChapters)) {
            if (!data[subject]) {
                result.warnings.push(`Subject ${subject} not found in data`);
                continue;
            }

            for (const [grade, expectedChapters] of Object.entries(gradeChapters)) {
                if (!data[subject][grade]) {
                    result.warnings.push(`Grade ${grade} not found for ${subject}`);
                    continue;
                }

                const actualChapters = Object.keys(data[subject][grade].chapters || {});
                
                for (const expectedChapter of expectedChapters) {
                    const found = actualChapters.some(actual => 
                        actual.toLowerCase().includes(expectedChapter.toLowerCase()) ||
                        expectedChapter.toLowerCase().includes(actual.toLowerCase())
                    );
                    
                    if (!found) {
                        result.warnings.push(
                            `Missing expected chapter "${expectedChapter}" in ${subject} grade ${grade}`
                        );
                    }
                }
            }
        }

        return result;
    }

    calculateQualityMetrics(data) {
        const metrics = {
            completeness: this.calculateCompleteness(data),
            accuracy: this.calculateAccuracy(data),
            consistency: this.calculateConsistency(data),
            coverage: this.calculateCoverage(data)
        };

        return metrics;
    }

    calculateCompleteness(data) {
        let totalExpected = 0;
        let totalFound = 0;

        const expectedSubjects = this.validationRules.structure.expectedSubjects;
        const expectedGrades = [9, 10, 11, 12];

        totalExpected = expectedSubjects.length * expectedGrades.length;
        
        for (const subject of expectedSubjects) {
            if (data[subject]) {
                for (const grade of expectedGrades) {
                    if (data[subject][grade] && data[subject][grade].chapters) {
                        totalFound++;
                    }
                }
            }
        }

        return totalFound / totalExpected;
    }

    calculateAccuracy(data) {
        // Simplified accuracy based on content validation
        let totalChapters = 0;
        let validChapters = 0;

        for (const [subject, grades] of Object.entries(data)) {
            for (const [grade, gradeData] of Object.entries(grades)) {
                for (const [chapterName, chapterData] of Object.entries(gradeData.chapters || {})) {
                    totalChapters++;
                    
                    // Check basic validity
                    if (chapterData.content && 
                        chapterData.content.length > 50 &&
                        chapterData.keyTopics &&
                        chapterData.keyTopics.length > 0) {
                        validChapters++;
                    }
                }
            }
        }

        return totalChapters > 0 ? validChapters / totalChapters : 0;
    }

    calculateConsistency(data) {
        // Check for consistent structure across subjects and grades
        let consistencyScore = 1.0;
        const structureTemplate = {
            hasChapters: false,
            hasMetadata: false,
            hasKeyTopics: false,
            hasLearningObjectives: false
        };

        // Analyze structure consistency
        for (const [subject, grades] of Object.entries(data)) {
            for (const [grade, gradeData] of Object.entries(grades)) {
                if (gradeData.chapters && Object.keys(gradeData.chapters).length === 0) {
                    consistencyScore -= 0.1;
                }
                if (!gradeData.metadata) {
                    consistencyScore -= 0.05;
                }
            }
        }

        return Math.max(0, consistencyScore);
    }

    calculateCoverage(data) {
        const { requiredChapters } = this.validationRules.curriculum;
        let totalRequired = 0;
        let covered = 0;

        for (const [subject, gradeChapters] of Object.entries(requiredChapters)) {
            for (const [grade, expectedChapters] of Object.entries(gradeChapters)) {
                totalRequired += expectedChapters.length;
                
                if (data[subject] && data[subject][grade] && data[subject][grade].chapters) {
                    const actualChapters = Object.keys(data[subject][grade].chapters);
                    
                    for (const expectedChapter of expectedChapters) {
                        const found = actualChapters.some(actual => 
                            actual.toLowerCase().includes(expectedChapter.toLowerCase())
                        );
                        if (found) covered++;
                    }
                }
            }
        }

        return totalRequired > 0 ? covered / totalRequired : 0;
    }

    calculateOverallQualityScore(metrics) {
        const weights = {
            completeness: 0.3,
            accuracy: 0.3,
            consistency: 0.2,
            coverage: 0.2
        };

        let score = 0;
        for (const [metric, value] of Object.entries(metrics)) {
            score += value * weights[metric];
        }

        return Math.round(score * 100);
    }

    generateRecommendations(validationResult) {
        const recommendations = [];
        const { metrics, errors, warnings } = validationResult;

        // Quality-based recommendations
        if (metrics.completeness < 0.8) {
            recommendations.push({
                type: 'completeness',
                priority: 'high',
                message: 'Add missing subjects or grade levels to improve completeness',
                action: 'Collect data for missing curriculum components'
            });
        }

        if (metrics.accuracy < 0.7) {
            recommendations.push({
                type: 'accuracy',
                priority: 'high',
                message: 'Improve content quality and validation',
                action: 'Review and enhance chapter content with educational experts'
            });
        }

        if (metrics.consistency < 0.8) {
            recommendations.push({
                type: 'consistency',
                priority: 'medium',
                message: 'Standardize data structure across all subjects',
                action: 'Apply consistent formatting and metadata structure'
            });
        }

        if (metrics.coverage < 0.6) {
            recommendations.push({
                type: 'coverage',
                priority: 'medium',
                message: 'Add missing chapters from NCERT curriculum',
                action: 'Focus on collecting data for core curriculum chapters'
            });
        }

        // Error-based recommendations
        if (errors.length > 10) {
            recommendations.push({
                type: 'errors',
                priority: 'critical',
                message: `${errors.length} critical errors found`,
                action: 'Fix structural and content errors before proceeding'
            });
        }

        // Warning-based recommendations
        if (warnings.length > 20) {
            recommendations.push({
                type: 'warnings',
                priority: 'low',
                message: `${warnings.length} warnings found`,
                action: 'Review warnings to improve data quality'
            });
        }

        return recommendations;
    }

    mergeValidationResults(target, source) {
        target.isValid = target.isValid && source.isValid;
        target.errors.push(...source.errors);
        target.warnings.push(...source.warnings);
    }

    // Generate validation report
    generateValidationReport(validationResult) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                overallScore: validationResult.qualityScore,
                status: validationResult.isValid ? 'PASSED' : 'FAILED',
                errorCount: validationResult.errors.length,
                warningCount: validationResult.warnings.length
            },
            metrics: validationResult.metrics,
            issues: {
                errors: validationResult.errors,
                warnings: validationResult.warnings
            },
            recommendations: validationResult.recommendations
        };

        return report;
    }
}

// Export for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NCERTDataValidator;
}

// Global instance for browser usage
if (typeof window !== 'undefined') {
    window.NCERTDataValidator = NCERTDataValidator;
}