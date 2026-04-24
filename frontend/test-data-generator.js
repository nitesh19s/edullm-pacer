/**
 * EduLLM Platform - Test Data Generator
 *
 * Generates realistic test data for all platform features
 */

class TestDataGenerator {
    constructor() {
        this.subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Physics', 'Chemistry', 'Biology'];
        this.grades = [9, 10, 11, 12];
        this.providers = ['openai', 'anthropic', 'google'];
        this.models = {
            openai: ['gpt-3.5-turbo', 'gpt-4'],
            anthropic: ['claude-2', 'claude-instant'],
            google: ['gemini-pro']
        };
    }

    /**
     * Generate random integer between min and max
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate random float between min and max
     */
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Pick random item from array
     */
    randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Generate random date within last N days
     */
    randomDate(daysAgo = 30) {
        const now = Date.now();
        const ago = daysAgo * 24 * 60 * 60 * 1000;
        return new Date(now - Math.random() * ago);
    }

    /**
     * Generate student ID
     */
    generateStudentId(index = null) {
        if (index !== null) {
            return `student_${String(index).padStart(3, '0')}`;
        }
        return `student_${this.randomInt(1, 999).toString().padStart(3, '0')}`;
    }

    /**
     * Generate concept ID
     */
    generateConceptId(subject, index) {
        const subjectCode = subject.substring(0, 4).toLowerCase();
        return `${subjectCode}_${String(index).padStart(3, '0')}`;
    }

    // ==================== EXPERIMENT DATA ====================

    /**
     * Generate experiment data
     */
    generateExperiment(index = null) {
        const provider = this.randomItem(this.providers);
        const experimentTypes = [
            'RAG Performance Test',
            'Prompt Engineering Experiment',
            'Model Comparison Study',
            'Temperature Optimization',
            'Token Limit Analysis'
        ];

        return {
            name: `${this.randomItem(experimentTypes)} ${index || this.randomInt(1, 100)}`,
            description: `Automated test experiment ${index || 'generated'} for evaluation purposes`,
            configuration: {
                provider,
                model: this.randomItem(this.models[provider]),
                temperature: this.randomFloat(0.3, 1.0),
                maxTokens: this.randomItem([512, 1024, 2048, 4096]),
                topP: this.randomFloat(0.8, 1.0),
                parameters: {
                    systemPrompt: 'You are a helpful educational assistant.',
                    responseFormat: 'text'
                }
            },
            metadata: {
                createdBy: 'test_user',
                purpose: 'integration_testing',
                expectedDuration: this.randomInt(5, 60)
            }
        };
    }

    /**
     * Generate experiment run data
     */
    generateExperimentRun(experimentId) {
        const numTestCases = this.randomInt(5, 20);
        const testCases = [];

        for (let i = 0; i < numTestCases; i++) {
            testCases.push({
                id: `tc_${i + 1}`,
                input: `Test question ${i + 1} about ${this.randomItem(this.subjects)}`,
                expected: `Expected answer for question ${i + 1}`,
                metadata: {
                    subject: this.randomItem(this.subjects),
                    difficulty: this.randomInt(1, 10)
                }
            });
        }

        return {
            testCases,
            configuration: {
                parallel: this.randomInt(0, 1) === 1,
                timeout: this.randomInt(30000, 120000)
            }
        };
    }

    // ==================== RESEARCH FEATURES DATA ====================

    /**
     * Generate learning interaction
     */
    generateInteraction(studentId, conceptIndex = null) {
        const subject = this.randomItem(this.subjects);
        const grade = this.randomItem(this.grades);
        const conceptId = conceptIndex
            ? this.generateConceptId(subject, conceptIndex)
            : this.generateConceptId(subject, this.randomInt(1, 50));

        const success = this.randomFloat(0, 1) > 0.3; // 70% success rate
        const difficulty = this.randomInt(1, 10);

        return {
            studentId,
            conceptId,
            conceptName: `${subject} Concept ${conceptIndex || this.randomInt(1, 50)}`,
            subject,
            grade,
            difficulty,
            success,
            responseTime: this.randomInt(500, 5000),
            confidence: this.randomFloat(0.5, 1.0),
            context: {
                attemptNumber: this.randomInt(1, 5),
                sessionDuration: this.randomInt(60, 3600),
                timestamp: this.randomDate(30).toISOString()
            }
        };
    }

    /**
     * Generate multiple interactions for a student
     */
    generateStudentInteractions(studentId, count = 50) {
        const interactions = [];

        for (let i = 0; i < count; i++) {
            interactions.push(this.generateInteraction(studentId, i + 1));
        }

        return interactions;
    }

    /**
     * Generate curriculum gap analysis request
     */
    generateGapAnalysisRequest(studentId) {
        return {
            studentId,
            targetGrade: this.randomItem(this.grades),
            targetSubject: this.randomItem(this.subjects)
        };
    }

    /**
     * Generate cross-subject analysis request
     */
    generateCrossSubjectRequest(studentId) {
        return {
            studentId
        };
    }

    // ==================== VECTOR DATABASE DATA ====================

    /**
     * Generate collection data
     */
    generateCollection(index = null) {
        const collectionTypes = [
            'NCERT Textbooks',
            'Practice Questions',
            'Concept Definitions',
            'Example Solutions',
            'Reference Materials'
        ];

        return {
            name: `${this.randomItem(collectionTypes)} ${index || this.randomInt(1, 100)}`,
            description: `Test collection for ${this.randomItem(this.subjects)} Grade ${this.randomItem(this.grades)}`,
            metadata: {
                subject: this.randomItem(this.subjects),
                grade: this.randomItem(this.grades),
                createdAt: this.randomDate(60).toISOString()
            }
        };
    }

    /**
     * Generate documents for collection
     */
    generateDocuments(count = 10) {
        const documents = [];
        const topics = [
            'Linear Equations',
            'Quadratic Functions',
            'Photosynthesis',
            'Chemical Reactions',
            'Grammar Rules',
            'Historical Events'
        ];

        for (let i = 0; i < count; i++) {
            const topic = this.randomItem(topics);

            documents.push({
                text: `This is a detailed explanation of ${topic}. ` +
                      `It covers the fundamental concepts, examples, and applications. ` +
                      `Document ${i + 1} in the collection.`,
                embedding: this.generateEmbedding(384), // Simulated embedding
                metadata: {
                    topic,
                    subject: this.randomItem(this.subjects),
                    grade: this.randomItem(this.grades),
                    source: 'NCERT',
                    page: this.randomInt(1, 500),
                    chapter: this.randomInt(1, 15)
                }
            });
        }

        return documents;
    }

    /**
     * Generate simulated embedding vector
     */
    generateEmbedding(dimensions = 384) {
        const embedding = [];
        for (let i = 0; i < dimensions; i++) {
            embedding.push(this.randomFloat(-1, 1));
        }
        return embedding;
    }

    /**
     * Generate query for vector search
     */
    generateQuery() {
        const queries = [
            'Explain quadratic equations',
            'What is photosynthesis?',
            'Define Newton\'s laws of motion',
            'Describe the water cycle',
            'What are prime numbers?',
            'Explain chemical bonding'
        ];

        return this.randomItem(queries);
    }

    // ==================== RAG CHAT DATA ====================

    /**
     * Generate chat message
     */
    generateChatMessage(sessionId = null) {
        const questions = [
            'Can you explain this concept?',
            'What is the formula for this?',
            'How do I solve this problem?',
            'Give me an example.',
            'What are the key points?'
        ];

        return {
            sessionId,
            message: this.randomItem(questions),
            context: {
                subject: this.randomItem(this.subjects),
                grade: this.randomItem(this.grades),
                topic: 'General Concept'
            }
        };
    }

    /**
     * Generate conversation (multiple messages)
     */
    generateConversation(messageCount = 5) {
        const messages = [];

        for (let i = 0; i < messageCount; i++) {
            messages.push(this.generateChatMessage());
        }

        return messages;
    }

    // ==================== ANALYTICS DATA ====================

    /**
     * Generate report generation request
     */
    generateReportRequest() {
        return {
            type: this.randomItem(['summary', 'detailed', 'comparison']),
            dateRange: {
                start: this.randomDate(30).toISOString(),
                end: new Date().toISOString()
            }
        };
    }

    /**
     * Generate baseline data
     */
    generateBaseline(index = null) {
        return {
            name: `Baseline ${index || this.randomInt(1, 100)}`,
            experimentId: `exp_${this.randomInt(100, 999)}`,
            metrics: {
                precision: this.randomFloat(0.7, 0.95),
                recall: this.randomFloat(0.7, 0.95),
                f1Score: this.randomFloat(0.7, 0.95),
                avgResponseTime: this.randomInt(800, 2000)
            }
        };
    }

    /**
     * Generate A/B test data
     */
    generateABTest(index = null) {
        const providerA = this.randomItem(this.providers);
        const providerB = this.randomItem(this.providers);

        return {
            name: `A/B Test ${index || this.randomInt(1, 100)}`,
            variantA: {
                provider: providerA,
                model: this.randomItem(this.models[providerA]),
                temperature: this.randomFloat(0.3, 0.8)
            },
            variantB: {
                provider: providerB,
                model: this.randomItem(this.models[providerB]),
                temperature: this.randomFloat(0.3, 0.8)
            },
            testCases: this.randomInt(10, 50)
        };
    }

    // ==================== BULK DATA GENERATION ====================

    /**
     * Generate complete test dataset
     */
    generateCompleteDataset() {
        return {
            experiments: Array.from({ length: 10 }, (_, i) => this.generateExperiment(i + 1)),
            students: Array.from({ length: 5 }, (_, i) => {
                const studentId = this.generateStudentId(i + 1);
                return {
                    studentId,
                    interactions: this.generateStudentInteractions(studentId, 30)
                };
            }),
            collections: Array.from({ length: 5 }, (_, i) => ({
                ...this.generateCollection(i + 1),
                documents: this.generateDocuments(20)
            })),
            chatConversations: Array.from({ length: 10 }, () => this.generateConversation(5)),
            baselines: Array.from({ length: 5 }, (_, i) => this.generateBaseline(i + 1)),
            abTests: Array.from({ length: 5 }, (_, i) => this.generateABTest(i + 1))
        };
    }

    /**
     * Export dataset as JSON
     */
    exportDataset() {
        const dataset = this.generateCompleteDataset();
        return JSON.stringify(dataset, null, 2);
    }

    /**
     * Save dataset to localStorage
     */
    saveToLocalStorage(key = 'edullm_test_dataset') {
        const dataset = this.generateCompleteDataset();
        localStorage.setItem(key, JSON.stringify(dataset));
        console.log(`✅ Test dataset saved to localStorage: ${key}`);
        return dataset;
    }

    /**
     * Load dataset from localStorage
     */
    loadFromLocalStorage(key = 'edullm_test_dataset') {
        const data = localStorage.getItem(key);
        if (data) {
            const dataset = JSON.parse(data);
            console.log(`✅ Test dataset loaded from localStorage: ${key}`);
            return dataset;
        }
        console.warn(`⚠️  No dataset found in localStorage: ${key}`);
        return null;
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.TestDataGenerator = TestDataGenerator;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestDataGenerator;
}
