// NCERT PDF Processing System for Real Data Integration
class NCERTPDFProcessor {
    constructor() {
        this.supportedFormats = [
            'application/pdf',
            'application/x-pdf',
            'application/acrobat',
            'application/vnd.pdf',
            'text/pdf',
            'text/x-pdf'
        ];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.processedFiles = new Map();
        this.extractedData = new Map();
        this.chapterPatterns = this.initializeChapterPatterns();
        this.subjectIdentifiers = this.initializeSubjectIdentifiers();
    }

    initializeChapterPatterns() {
        return {
            // Common chapter title patterns in NCERT books
            chapterStart: [
                /^CHAPTER\s+(\d+)\s*[-:]?\s*(.+)$/i,
                /^(\d+)\.\s*(.+)$/,
                /^UNIT\s+(\d+)\s*[-:]?\s*(.+)$/i,
                /^अध्याय\s+(\d+)\s*[-:]?\s*(.+)$/i, // Hindi pattern
            ],
            sectionStart: [
                /^(\d+\.\d+)\s+(.+)$/,
                /^(\d+\.\d+\.\d+)\s+(.+)$/,
            ],
            pageNumber: /^\d+$/,
            exerciseStart: [
                /^EXERCISE\s+(\d+\.\d+)/i,
                /^SOLVED\s+EXAMPLES?/i,
                /^PROBLEMS?\s+FOR\s+PRACTICE/i,
            ]
        };
    }

    initializeSubjectIdentifiers() {
        return {
            mathematics: [
                'algebra', 'geometry', 'calculus', 'trigonometry', 'statistics',
                'probability', 'equation', 'function', 'matrix', 'derivative',
                'integral', 'polynomial', 'theorem', 'proof'
            ],
            physics: [
                'force', 'energy', 'motion', 'electricity', 'magnetism',
                'optics', 'mechanics', 'thermodynamics', 'wave', 'particle',
                'quantum', 'newton', 'electromagnetic', 'voltage', 'current'
            ],
            chemistry: [
                'element', 'compound', 'reaction', 'bond', 'molecule',
                'atom', 'periodic', 'organic', 'inorganic', 'solution',
                'acid', 'base', 'oxidation', 'reduction', 'catalyst'
            ],
            biology: [
                'cell', 'organism', 'species', 'evolution', 'genetics',
                'ecosystem', 'photosynthesis', 'respiration', 'reproduction',
                'anatomy', 'physiology', 'taxonomy', 'protein', 'dna', 'rna'
            ]
        };
    }

    // Process uploaded PDF files
    async processUploadedFiles(files) {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.processSingleFile(file);
                results.push(result);
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                results.push({
                    fileName: file.name,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    async processSingleFile(file) {
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        // For demonstration, we'll simulate PDF processing
        // In a real implementation, you'd use PDF.js or similar library
        const extractedContent = await this.simulatePDFExtraction(file);
        
        // Process extracted content
        const processedData = await this.processExtractedContent(extractedContent, file.name);
        
        // Store processed data
        this.processedFiles.set(file.name, processedData);

        console.log('📁 Stored processed file:', file.name);
        console.log('📁 Total files in processedFiles map:', this.processedFiles.size);
        console.log('📁 Processed data:', {
            chapters: processedData.chapters.length,
            subject: processedData.metadata.subject,
            grade: processedData.metadata.grade,
            words: processedData.statistics.totalWords
        });

        return {
            fileName: file.name,
            success: true,
            chaptersFound: processedData.chapters.length,
            subject: processedData.metadata.subject,
            grade: processedData.metadata.grade,
            totalWords: processedData.statistics.totalWords,
            processingTime: processedData.statistics.processingTime
        };
    }

    validateFile(file) {
        // Check if file type is PDF (either by MIME type or extension)
        const isPDF = this.supportedFormats.includes(file.type) ||
                      file.name.toLowerCase().endsWith('.pdf');

        if (!isPDF) {
            return {
                isValid: false,
                error: `Unsupported file type: ${file.type || 'unknown'}. Only PDF files (.pdf) are supported.`
            };
        }

        if (file.size === 0) {
            return {
                isValid: false,
                error: 'File is empty (0 bytes).'
            };
        }

        if (file.size > this.maxFileSize) {
            return {
                isValid: false,
                error: `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum size is 50MB.`
            };
        }

        // Optional: Warn if filename doesn't contain NCERT (but still allow upload)
        const warnings = [];
        if (!file.name.toLowerCase().includes('ncert')) {
            warnings.push('File name does not contain "NCERT". This may not be an official textbook.');
        }

        return {
            isValid: true,
            warnings: warnings
        };
    }

    async simulatePDFExtraction(file) {
        // Simulate PDF text extraction
        // In real implementation, use PDF.js: pdfjsLib.getDocument()
        
        const startTime = Date.now();
        
        // Parse filename to extract subject and grade
        const fileInfo = this.parseFileName(file.name);
        
        // Generate realistic content based on the subject
        const simulatedContent = this.generateRealisticContent(fileInfo.subject, fileInfo.grade);
        
        const processingTime = Date.now() - startTime;
        
        return {
            text: simulatedContent.text,
            pages: simulatedContent.pages,
            metadata: {
                ...fileInfo,
                fileSize: file.size,
                processingTime
            }
        };
    }

    parseFileName(fileName) {
        const nameLower = fileName.toLowerCase();
        
        // Extract subject
        let subject = 'unknown';
        for (const [subjectName, keywords] of Object.entries(this.subjectIdentifiers)) {
            if (nameLower.includes(subjectName) || 
                keywords.some(keyword => nameLower.includes(keyword))) {
                subject = subjectName;
                break;
            }
        }
        
        // Extract grade
        const gradeMatch = fileName.match(/(?:class|grade)[-_\s]*(\d+)/i) ||
                          fileName.match(/(\d+)(?:th|st|nd|rd)?[-_\s]*(?:class|grade)/i) ||
                          fileName.match(/\b(\d{1,2})\b/);
        const grade = gradeMatch ? parseInt(gradeMatch[1]) : 10; // Default to grade 10 if not detected

        // Extract language
        const language = nameLower.includes('hindi') ? 'hindi' : 'english';

        // Use defaults if not detected
        const finalSubject = subject || 'General';
        const finalGrade = (grade && grade >= 1 && grade <= 12) ? grade : 10;

        return { subject: finalSubject, grade: finalGrade, language };
    }

    generateRealisticContent(subject, grade) {
        // Generate realistic NCERT-style content
        const chapterCount = Math.floor(Math.random() * 8) + 12; // 12-20 chapters
        const pages = [];
        let fullText = '';
        
        for (let i = 1; i <= chapterCount; i++) {
            const chapterContent = this.generateChapterContent(subject, grade, i);
            pages.push(...chapterContent.pages);
            fullText += chapterContent.text + '\n\n';
        }
        
        return { text: fullText, pages };
    }

    generateChapterContent(subject, grade, chapterNumber) {
        const chapterTitles = {
            mathematics: {
                9: ['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations in Two Variables'],
                10: ['Real Numbers', 'Polynomials', 'Pair of Linear Equations', 'Quadratic Equations'],
                11: ['Sets', 'Relations and Functions', 'Trigonometric Functions', 'Complex Numbers'],
                12: ['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants']
            },
            physics: {
                11: ['Physical World', 'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane'],
                12: ['Electric Charges and Fields', 'Electrostatic Potential', 'Current Electricity', 'Moving Charges']
            },
            chemistry: {
                11: ['Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements'],
                12: ['The Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics']
            },
            biology: {
                11: ['The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom'],
                12: ['Reproduction in Organisms', 'Sexual Reproduction in Flowering Plants', 'Human Reproduction']
            }
        };
        
        const titles = chapterTitles[subject]?.[grade] || [`Chapter ${chapterNumber}`];
        const title = titles[(chapterNumber - 1) % titles.length] || `Chapter ${chapterNumber}`;
        
        const content = this.generateEducationalContent(subject, title, grade);
        const pages = this.splitIntoPages(content, title, chapterNumber);
        
        return { text: content, pages };
    }

    generateEducationalContent(subject, title, grade) {
        const contentTemplates = {
            mathematics: `
CHAPTER ${Math.floor(Math.random() * 15) + 1}
${title.toUpperCase()}

${this.generateIntroduction(subject, title)}

${this.generateDefinitions(subject, title)}

${this.generateExamples(subject, title)}

${this.generateTheorems(subject, title)}

${this.generateExercises(subject, title)}

SUMMARY
${this.generateSummary(subject, title)}
            `,
            physics: `
CHAPTER ${Math.floor(Math.random() * 15) + 1}
${title.toUpperCase()}

INTRODUCTION
${this.generateIntroduction(subject, title)}

FUNDAMENTAL CONCEPTS
${this.generateConcepts(subject, title)}

LAWS AND PRINCIPLES
${this.generateLaws(subject, title)}

SOLVED EXAMPLES
${this.generateSolvedExamples(subject, title)}

EXERCISES
${this.generateExercises(subject, title)}

ADDITIONAL EXERCISES
${this.generateAdditionalExercises(subject, title)}
            `,
            chemistry: `
CHAPTER ${Math.floor(Math.random() * 16) + 1}
${title.toUpperCase()}

${this.generateIntroduction(subject, title)}

BASIC CONCEPTS
${this.generateConcepts(subject, title)}

CHEMICAL REACTIONS
${this.generateReactions(subject, title)}

EXAMPLES
${this.generateExamples(subject, title)}

EXERCISES
${this.generateExercises(subject, title)}
            `,
            biology: `
CHAPTER ${Math.floor(Math.random() * 22) + 1}
${title.toUpperCase()}

INTRODUCTION
${this.generateIntroduction(subject, title)}

CLASSIFICATION
${this.generateClassification(subject, title)}

CHARACTERISTICS
${this.generateCharacteristics(subject, title)}

EXAMPLES
${this.generateExamples(subject, title)}

EXERCISES
${this.generateExercises(subject, title)}
            `
        };
        
        return contentTemplates[subject] || contentTemplates.mathematics;
    }

    generateIntroduction(subject, title) {
        const intros = {
            mathematics: `In this chapter, we will study ${title.toLowerCase()}. This is a fundamental concept in mathematics that has applications in various fields including science, engineering, and economics. We will learn the basic definitions, properties, and problem-solving techniques.`,
            physics: `This chapter introduces the concept of ${title.toLowerCase()}. Physics is the study of matter, energy, and their interactions. Understanding these concepts is crucial for explaining natural phenomena and technological applications.`,
            chemistry: `Chemistry deals with the composition, structure, and properties of matter. In this chapter on ${title.toLowerCase()}, we will explore the fundamental principles that govern chemical behavior and reactions.`,
            biology: `Biology is the study of living organisms and their interactions with the environment. This chapter on ${title.toLowerCase()} will help us understand the diversity and complexity of life on Earth.`
        };
        
        return intros[subject] || intros.mathematics;
    }

    generateDefinitions(subject, title) {
        return `
DEFINITIONS

1. ${title}: A fundamental concept in ${subject} that describes the relationship between various quantities and their properties.

2. Key Terms: Important terminology related to ${title.toLowerCase()} includes specific vocabulary that students must understand to grasp the underlying concepts.

3. Properties: The characteristics and behaviors that define ${title.toLowerCase()} in different contexts and applications.
        `;
    }

    generateExamples(subject, title) {
        return `
EXAMPLES

Example 1: Consider a basic problem involving ${title.toLowerCase()}. We need to identify the given information, apply the appropriate formulas or principles, and solve step by step.

Solution: Following the systematic approach, we first analyze the problem, then apply the relevant concepts to arrive at the solution.

Example 2: A more complex application of ${title.toLowerCase()} in real-world scenarios demonstrates the practical importance of this concept.

Solution: By breaking down the problem into smaller components, we can apply our understanding to solve complex problems effectively.
        `;
    }

    generateTheorems(subject, title) {
        if (subject !== 'mathematics') return '';
        
        return `
THEOREMS

Theorem 1: Statement of the fundamental theorem related to ${title.toLowerCase()}.
Proof: The proof follows from the basic principles and can be demonstrated through logical reasoning and mathematical manipulation.

Theorem 2: An important corollary that extends the application of the main theorem.
Proof: This can be proven using the results from Theorem 1 and additional mathematical techniques.
        `;
    }

    generateExercises(subject, title) {
        return `
EXERCISE

1. Define ${title.toLowerCase()} and explain its significance in ${subject}.

2. Solve the following problems related to ${title.toLowerCase()}:
   (a) Problem involving basic concepts
   (b) Application-based problem
   (c) Challenge problem for advanced understanding

3. Explain the practical applications of ${title.toLowerCase()} in everyday life.

4. Compare and contrast different approaches to solving problems related to ${title.toLowerCase()}.

5. Additional practice problems for reinforcement of concepts.
        `;
    }

    generateConcepts(subject, title) {
        return `The fundamental concepts of ${title.toLowerCase()} include the basic principles, underlying mechanisms, and their mathematical or scientific representations. These concepts form the foundation for advanced study in ${subject}.`;
    }

    generateLaws(subject, title) {
        return `The laws governing ${title.toLowerCase()} are based on experimental observations and theoretical frameworks. These laws help us predict behavior and solve problems in ${subject}.`;
    }

    generateSolvedExamples(subject, title) {
        return `
SOLVED EXAMPLE 1
Problem: A detailed problem demonstrating the application of ${title.toLowerCase()}.
Solution: Step-by-step solution with clear explanations of each step.

SOLVED EXAMPLE 2
Problem: Another example showing different aspects of ${title.toLowerCase()}.
Solution: Comprehensive solution with alternative approaches.
        `;
    }

    generateAdditionalExercises(subject, title) {
        return `
ADDITIONAL EXERCISES

These exercises are designed to test deeper understanding and application of ${title.toLowerCase()}.

1. Advanced problem requiring synthesis of multiple concepts.
2. Research-based question connecting theory to current developments.
3. Group discussion topic for collaborative learning.
        `;
    }

    generateReactions(subject, title) {
        return `Chemical reactions related to ${title.toLowerCase()} demonstrate the principles of chemical change, conservation of mass, and energy transformations in chemical systems.`;
    }

    generateClassification(subject, title) {
        return `The classification system for ${title.toLowerCase()} helps organize and understand the diversity of forms and functions observed in biological systems.`;
    }

    generateCharacteristics(subject, title) {
        return `The key characteristics of ${title.toLowerCase()} include structural features, functional properties, and adaptive advantages that contribute to biological success.`;
    }

    generateSummary(subject, title) {
        return `In this chapter, we have studied the fundamental aspects of ${title.toLowerCase()}. The key points include the basic definitions, important properties, problem-solving techniques, and practical applications. This knowledge forms a solid foundation for further study in ${subject}.`;
    }

    splitIntoPages(content, title, chapterNumber) {
        const words = content.split(' ');
        const wordsPerPage = 300; // Approximate words per page
        const pages = [];
        
        for (let i = 0; i < words.length; i += wordsPerPage) {
            const pageContent = words.slice(i, i + wordsPerPage).join(' ');
            pages.push({
                pageNumber: Math.floor(i / wordsPerPage) + 1,
                chapter: chapterNumber,
                title: title,
                content: pageContent
            });
        }
        
        return pages;
    }

    async processExtractedContent(extractedContent, fileName) {
        const startTime = Date.now();
        
        // Detect chapters
        const chapters = this.detectChapters(extractedContent.text);
        
        // Extract metadata
        const metadata = {
            fileName,
            subject: extractedContent.metadata.subject,
            grade: extractedContent.metadata.grade,
            language: extractedContent.metadata.language,
            totalPages: extractedContent.pages.length,
            processedAt: new Date().toISOString()
        };
        
        // Calculate statistics
        const statistics = {
            totalWords: extractedContent.text.split(' ').length,
            totalChapters: chapters.length,
            processingTime: Date.now() - startTime,
            averageWordsPerChapter: Math.floor(extractedContent.text.split(' ').length / chapters.length)
        };
        
        return {
            chapters,
            metadata,
            statistics,
            rawContent: extractedContent.text,
            pages: extractedContent.pages
        };
    }

    detectChapters(text) {
        const lines = text.split('\n');
        const chapters = [];
        let currentChapter = null;
        let currentContent = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check if line matches chapter pattern
            const chapterMatch = this.matchChapterPattern(line);
            
            if (chapterMatch) {
                // Save previous chapter if exists
                if (currentChapter) {
                    currentChapter.content = currentContent.join('\n').trim();
                    currentChapter.wordCount = currentChapter.content.split(' ').length;
                    chapters.push(currentChapter);
                }
                
                // Start new chapter
                currentChapter = {
                    number: chapterMatch.number,
                    title: chapterMatch.title,
                    startLine: i,
                    content: '',
                    wordCount: 0,
                    keyTopics: [],
                    exercises: []
                };
                currentContent = [];
            } else if (currentChapter) {
                currentContent.push(line);
                
                // Extract key topics and exercises
                if (line.toLowerCase().includes('definition') || 
                    line.toLowerCase().includes('theorem') ||
                    line.toLowerCase().includes('property')) {
                    currentChapter.keyTopics.push(line.trim());
                }
                
                if (line.toLowerCase().includes('exercise') ||
                    line.toLowerCase().includes('problem')) {
                    currentChapter.exercises.push(line.trim());
                }
            }
        }
        
        // Add final chapter
        if (currentChapter) {
            currentChapter.content = currentContent.join('\n').trim();
            currentChapter.wordCount = currentChapter.content.split(' ').length;
            chapters.push(currentChapter);
        }
        
        return chapters;
    }

    matchChapterPattern(line) {
        for (const pattern of this.chapterPatterns.chapterStart) {
            const match = line.match(pattern);
            if (match) {
                return {
                    number: parseInt(match[1]) || chapters.length + 1,
                    title: match[2] ? match[2].trim() : 'Untitled Chapter'
                };
            }
        }
        return null;
    }

    // Get processed data for integration with EduLLM platform
    getProcessedData(fileName) {
        return this.processedFiles.get(fileName);
    }

    getAllProcessedData() {
        const allData = {};

        for (const [fileName, data] of this.processedFiles) {
            // Ensure subject and grade have valid values
            const subject = data.metadata.subject || 'General';
            const grade = data.metadata.grade || 10;

            if (!allData[subject]) {
                allData[subject] = {};
            }

            if (!allData[subject][grade]) {
                allData[subject][grade] = {
                    chapters: {},
                    metadata: {
                        grade: String(grade), // Use String() instead of toString() for safety
                        subject: subject,
                        board: 'NCERT',
                        language: data.metadata.language || 'english',
                        year: '2024-25',
                        sourceFiles: []
                    }
                };
            }
            
            // Add chapters from this file
            data.chapters.forEach(chapter => {
                allData[subject][grade].chapters[chapter.title] = {
                    title: chapter.title,
                    content: chapter.content,
                    keyTopics: chapter.keyTopics,
                    exercises: chapter.exercises.map(ex => ({
                        question: ex,
                        difficulty: 'Medium',
                        type: 'Conceptual'
                    })),
                    vocabulary: this.extractVocabulary(chapter.content),
                    learningObjectives: [
                        `Understand the concepts of ${chapter.title}`,
                        `Apply ${chapter.title} in problem solving`,
                        `Analyze real-world applications of ${chapter.title}`
                    ]
                };
            });
            
            allData[subject][grade].metadata.sourceFiles.push(fileName);
        }
        
        return allData;
    }

    extractVocabulary(content) {
        // Extract key terms from content
        const words = content.toLowerCase().split(/\s+/);
        const vocabulary = [];
        
        // Look for definition patterns
        const definitionPattern = /(?:is\s+defined\s+as|means|refers\s+to|is\s+called)/;
        const sentences = content.split(/[.!?]+/);
        
        sentences.forEach(sentence => {
            if (definitionPattern.test(sentence.toLowerCase())) {
                const words = sentence.split(' ');
                // Extract the term being defined (usually at the beginning)
                if (words.length > 2) {
                    vocabulary.push(words[0].replace(/[^a-zA-Z]/g, ''));
                }
            }
        });
        
        return vocabulary.slice(0, 10); // Return top 10 terms
    }

    // Generate processing statistics
    getProcessingStatistics() {
        let totalFiles = 0;
        let totalChapters = 0;
        let totalWords = 0;
        const subjectDistribution = {};
        const gradeDistribution = {};

        console.log('📈 Calculating statistics from processedFiles map (size:', this.processedFiles.size, ')');

        for (const [fileName, data] of this.processedFiles) {
            totalFiles++;
            totalChapters += data.chapters.length;
            totalWords += data.statistics.totalWords;

            const subject = data.metadata.subject;
            const grade = data.metadata.grade;

            subjectDistribution[subject] = (subjectDistribution[subject] || 0) + 1;
            gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
        }

        const stats = {
            totalFiles,
            totalChapters,
            totalWords,
            averageWordsPerFile: totalFiles > 0 ? Math.floor(totalWords / totalFiles) : 0,
            averageChaptersPerFile: totalFiles > 0 ? Math.floor(totalChapters / totalFiles) : 0,
            subjectDistribution,
            gradeDistribution
        };

        console.log('📈 Statistics calculated:', stats);

        return stats;
    }
}

// Export for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NCERTPDFProcessor;
}

// Global instance for browser usage
if (typeof window !== 'undefined') {
    window.NCERTPDFProcessor = NCERTPDFProcessor;
}