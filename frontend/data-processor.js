// NCERT Data Processing and Integration Pipeline
class NCERTDataProcessor {
    constructor() {
        this.collector = new NCERTDataCollector();
        this.vectorStore = new Map();
        this.searchIndex = new Map();
        this.conceptGraph = new Map();
        this.processedData = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        console.log('Initializing NCERT Data Processor...');
        
        // Try to load existing processed data
        this.processedData = this.collector.loadProcessedData();
        
        if (!this.processedData) {
            // Collect and process fresh data
            console.log('No existing data found. Collecting fresh NCERT data...');
            await this.collector.collectNCERTData();
            this.processedData = this.collector.processDataForPlatform();
            this.collector.saveProcessedData(this.processedData);
        }
        
        // Build indexes and stores
        await this.buildSearchIndex();
        await this.buildVectorStore();
        await this.buildConceptGraph();
        
        this.isInitialized = true;
        console.log('NCERT Data Processor initialized successfully');
    }

    async buildSearchIndex() {
        console.log('Building search index...');
        
        for (const [key, data] of Object.entries(this.processedData.searchIndex)) {
            // Create searchable text combining all relevant fields
            const searchableText = [
                data.subject,
                data.chapter,
                data.content,
                data.keyTopics.join(' '),
                data.vocabulary.join(' ')
            ].join(' ').toLowerCase();
            
            this.searchIndex.set(key, {
                ...data,
                searchableText,
                keywords: this.extractKeywords(searchableText)
            });
        }
        
        console.log(`Search index built with ${this.searchIndex.size} entries`);
    }

    async buildVectorStore() {
        console.log('Building vector store...');
        
        for (const chunk of this.processedData.chunks) {
            // Simulate vector embeddings (in a real implementation, you'd use actual embeddings)
            const vector = this.simulateEmbedding(chunk.content);
            
            this.vectorStore.set(chunk.id, {
                vector,
                content: chunk.content,
                metadata: chunk.metadata,
                similarity: (query) => this.calculateSimilarity(query, chunk.content)
            });
        }
        
        console.log(`Vector store built with ${this.vectorStore.size} chunks`);
    }

    async buildConceptGraph() {
        console.log('Building concept graph...');
        
        for (const [subject, chapters] of Object.entries(this.processedData.conceptGraph)) {
            this.conceptGraph.set(subject, new Map());
            
            for (const [chapter, chapterData] of Object.entries(chapters)) {
                this.conceptGraph.get(subject).set(chapter, {
                    topics: chapterData.topics,
                    connections: chapterData.connections,
                    relatedConcepts: this.findRelatedConcepts(subject, chapter, chapterData.topics)
                });
            }
        }
        
        console.log(`Concept graph built for ${this.conceptGraph.size} subjects`);
    }

    extractKeywords(text) {
        // Simple keyword extraction (in practice, you'd use NLP libraries)
        return text
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !this.isStopWord(word))
            .slice(0, 20); // Top 20 keywords
    }

    isStopWord(word) {
        const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'cannot', 'this', 'that', 'these', 'those'];
        return stopWords.includes(word.toLowerCase());
    }

    simulateEmbedding(text) {
        // Simulate vector embedding (in practice, use actual embedding models)
        const words = text.toLowerCase().split(/\s+/);
        const vector = new Array(384).fill(0); // Common embedding dimension
        
        // Simple hash-based simulation
        for (let i = 0; i < words.length; i++) {
            const hash = this.simpleHash(words[i]);
            for (let j = 0; j < vector.length; j++) {
                vector[j] += Math.sin(hash + j) * 0.1;
            }
        }
        
        // Normalize vector
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        return vector.map(val => val / magnitude);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    calculateSimilarity(query, content) {
        // Simple similarity calculation based on common words
        const queryWords = new Set(query.toLowerCase().split(/\s+/));
        const contentWords = content.toLowerCase().split(/\s+/);
        
        let commonWords = 0;
        for (const word of contentWords) {
            if (queryWords.has(word)) {
                commonWords++;
            }
        }
        
        return commonWords / Math.max(queryWords.size, contentWords.length);
    }

    findRelatedConcepts(subject, chapter, topics) {
        const related = [];
        
        // Find related concepts based on common keywords
        for (const [key, data] of this.searchIndex) {
            if (data.subject === subject && data.chapter !== chapter) {
                const commonTopics = topics.filter(topic => 
                    data.keyTopics.some(t => t.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(t.toLowerCase()))
                );
                
                if (commonTopics.length > 0) {
                    related.push({
                        chapter: data.chapter,
                        commonTopics,
                        score: commonTopics.length / topics.length
                    });
                }
            }
        }
        
        return related.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    // Search functionality
    async search(query, filters = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        const results = [];
        const queryLower = query.toLowerCase();
        
        for (const [key, data] of this.searchIndex) {
            // Apply filters
            if (filters.subject && data.subject !== filters.subject) continue;
            if (filters.grade && data.grade !== filters.grade) continue;
            
            // Calculate relevance score
            let score = 0;
            
            // Exact matches get higher scores
            if (data.searchableText.includes(queryLower)) {
                score += 10;
            }
            
            // Keyword matches
            const queryWords = queryLower.split(/\s+/);
            for (const word of queryWords) {
                if (data.keywords.includes(word)) {
                    score += 5;
                }
                if (data.keyTopics.some(topic => topic.toLowerCase().includes(word))) {
                    score += 3;
                }
            }
            
            if (score > 0) {
                results.push({
                    ...data,
                    score,
                    relevance: score / queryWords.length
                });
            }
        }
        
        return results.sort((a, b) => b.score - a.score);
    }

    // RAG functionality
    async retrieveAndGenerate(query, filters = {}, topK = 3) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        // Retrieve relevant chunks
        const relevantChunks = await this.retrieveRelevantChunks(query, filters, topK);
        
        // Generate response based on retrieved chunks
        const response = this.generateResponse(query, relevantChunks);
        
        return {
            response: response.text,
            sources: response.sources,
            relevantChunks,
            confidence: response.confidence
        };
    }

    async retrieveRelevantChunks(query, filters = {}, topK = 3) {
        const candidates = [];

        console.log(`🔍 Searching with filters:`, filters);
        console.log(`📊 Vector store has ${this.vectorStore.size} chunks`);

        let filteredCount = 0;
        let matchedCount = 0;

        for (const [chunkId, chunkData] of this.vectorStore) {
            filteredCount++;

            // Apply filters (CASE-INSENSITIVE)
            if (filters.subject && filters.subject !== 'all') {
                const chunkSubject = (chunkData.metadata.subject || '').toLowerCase();
                const filterSubject = (filters.subject || '').toLowerCase();
                if (chunkSubject !== filterSubject) {
                    continue;
                }
            }

            if (filters.grade && filters.grade !== 'all') {
                const chunkGrade = String(chunkData.metadata.grade || '');
                const filterGrade = String(filters.grade || '');
                if (chunkGrade !== filterGrade) {
                    continue;
                }
            }

            if (filters.source && filters.source !== 'all') {
                const chunkSource = (chunkData.metadata.source || '').toLowerCase();
                const filterSource = (filters.source || '').toLowerCase();
                if (!chunkSource.includes(filterSource)) {
                    continue;
                }
            }

            matchedCount++;

            // Calculate similarity
            const similarity = chunkData.similarity(query);

            if (similarity > 0.1) { // Minimum similarity threshold
                candidates.push({
                    ...chunkData,
                    chunkId,
                    similarity
                });
            }
        }

        console.log(`✅ Filtered: ${matchedCount}/${filteredCount} chunks matched filters`);
        console.log(`🎯 Found ${candidates.length} candidates with similarity > 0.1`);

        const topResults = candidates
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);

        console.log(`📦 Returning top ${topResults.length} results`);

        return topResults;
    }

    generateResponse(query, relevantChunks) {
        if (relevantChunks.length === 0) {
            return {
                text: "I couldn't find specific information related to your query in the NCERT curriculum. Could you please rephrase your question or be more specific about the subject and topic?",
                sources: [],
                confidence: 0
            };
        }
        
        // Combine relevant content
        const combinedContent = relevantChunks.map(chunk => chunk.content).join('\n\n');
        const sources = [...new Set(relevantChunks.map(chunk => chunk.metadata.source))];
        
        // Generate contextual response
        const response = this.createContextualResponse(query, combinedContent, relevantChunks[0].metadata);
        
        return {
            text: response,
            sources,
            confidence: relevantChunks[0].similarity
        };
    }

    createContextualResponse(query, content, metadata) {
        const queryLower = query.toLowerCase();
        
        // Extract the most relevant part of the content
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const relevantSentences = sentences.filter(sentence => 
            queryLower.split(/\s+/).some(word => 
                sentence.toLowerCase().includes(word) && word.length > 3
            )
        ).slice(0, 3);
        
        let response = relevantSentences.length > 0 ? relevantSentences.join('. ') + '.' : content.substring(0, 500) + '...';
        
        // Add contextual information
        if (queryLower.includes('example') || queryLower.includes('application')) {
            response += `\n\nThis concept from ${metadata.subject} Grade ${metadata.grade} has practical applications in problem-solving and real-world scenarios.`;
        }
        
        if (queryLower.includes('formula') || queryLower.includes('equation')) {
            response += `\n\nRefer to the relevant formulas and mathematical expressions in the ${metadata.chapter} chapter for detailed calculations.`;
        }
        
        return response;
    }

    // Get curriculum structure
    getCurriculumStructure() {
        if (!this.isInitialized) {
            return this.collector.curriculum;
        }
        
        const structure = {};
        for (const [subject, chapters] of this.conceptGraph) {
            structure[subject] = {};
            for (const [chapter, data] of chapters) {
                structure[subject][chapter] = {
                    topics: data.topics,
                    connections: data.connections.length
                };
            }
        }
        return structure;
    }

    // Get data statistics
    getStatistics() {
        if (!this.isInitialized) {
            return { error: 'Data processor not initialized' };
        }
        
        return {
            totalChunks: this.vectorStore.size,
            totalConcepts: this.searchIndex.size,
            subjects: this.conceptGraph.size,
            averageChunkSize: this.calculateAverageChunkSize(),
            subjectDistribution: this.getSubjectDistribution()
        };
    }

    calculateAverageChunkSize() {
        let totalSize = 0;
        let count = 0;
        
        for (const [, chunkData] of this.vectorStore) {
            totalSize += chunkData.content.length;
            count++;
        }
        
        return count > 0 ? Math.round(totalSize / count) : 0;
    }

    getSubjectDistribution() {
        const distribution = {};
        
        for (const [, chunkData] of this.vectorStore) {
            const subject = chunkData.metadata.subject;
            distribution[subject] = (distribution[subject] || 0) + 1;
        }
        
        return distribution;
    }

    // Advanced search with semantic understanding
    async semanticSearch(query, filters = {}, options = {}) {
        const { 
            topK = 5, 
            includeRelated = true, 
            minSimilarity = 0.1 
        } = options;
        
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        // Get direct matches
        const directMatches = await this.search(query, filters);
        
        // Get semantic matches from vector store
        const semanticMatches = [];
        for (const [chunkId, chunkData] of this.vectorStore) {
            const similarity = chunkData.similarity(query);
            if (similarity >= minSimilarity) {
                semanticMatches.push({
                    chunkId,
                    ...chunkData,
                    similarity,
                    type: 'semantic'
                });
            }
        }
        
        // Combine and rank results
        const allResults = [
            ...directMatches.map(r => ({ ...r, type: 'direct' })),
            ...semanticMatches
        ];
        
        const rankedResults = allResults
            .sort((a, b) => (b.score || b.similarity) - (a.score || a.similarity))
            .slice(0, topK);
        
        // Add related concepts if requested
        if (includeRelated && rankedResults.length > 0) {
            const relatedConcepts = this.findRelatedConceptsForQuery(query, rankedResults[0]);
            return {
                results: rankedResults,
                relatedConcepts,
                totalResults: allResults.length
            };
        }
        
        return {
            results: rankedResults,
            totalResults: allResults.length
        };
    }

    findRelatedConceptsForQuery(query, topResult) {
        const subject = topResult.subject || topResult.metadata?.subject;
        const chapter = topResult.chapter || topResult.metadata?.chapter;
        
        if (!subject || !this.conceptGraph.has(subject)) {
            return [];
        }
        
        const subjectGraph = this.conceptGraph.get(subject);
        const related = [];
        
        for (const [chapterName, chapterData] of subjectGraph) {
            if (chapterName !== chapter) {
                const queryWords = query.toLowerCase().split(/\s+/);
                const topicMatches = chapterData.topics.filter(topic =>
                    queryWords.some(word => topic.toLowerCase().includes(word))
                );
                
                if (topicMatches.length > 0) {
                    related.push({
                        chapter: chapterName,
                        subject,
                        matchingTopics: topicMatches,
                        allTopics: chapterData.topics
                    });
                }
            }
        }
        
        return related.slice(0, 3);
    }
}

// Export for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NCERTDataProcessor;
}

// Global instance for browser usage
if (typeof window !== 'undefined') {
    window.NCERTDataProcessor = NCERTDataProcessor;
}