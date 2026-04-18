/**
 * RAG Orchestrator
 *
 * Coordinates LLM Service + Vector Store for complete RAG pipeline
 * Handles document ingestion, retrieval, and answer generation
 *
 * @version 1.0.0
 * @author EduLLM Platform
 */

class RAGOrchestrator {
    constructor() {
        this.llmService = null;
        this.vectorStore = null;
        this.isInitialized = false;

        // Configuration
        this.config = {
            retrievalTopK: 5,
            retrievalMinScore: 0.5,
            contextMaxTokens: 2000,
            answerMaxTokens: 1000,
            includeSourceCitations: true
        };

        // Statistics
        this.stats = {
            totalQueries: 0,
            totalDocuments: 0,
            avgRetrievalTime: 0,
            avgGenerationTime: 0,
            lastQueryAt: null
        };
    }

    /**
     * Initialize RAG orchestrator
     */
    async initialize() {
        if (this.isInitialized) return true;

        try {
            console.log('🤖 Initializing RAG Orchestrator...');

            // Get LLM service - Try local models first, then API-based services
            this.llmService = window.localModelManager || window.enhancedLLMService || window.llmService;
            if (!this.llmService) {
                throw new Error('LLM Service not available');
            }

            // Get Vector Store
            this.vectorStore = window.enhancedVectorStore || window.vectorStore;
            if (!this.vectorStore) {
                throw new Error('Vector Store not available');
            }

            // Check if LLM is configured
            let llmConfigured = false;

            // Check local model manager
            if (window.localModelManager && window.localModelManager.isInitialized()) {
                llmConfigured = true;
                console.log('✅ Using Local Models (No API costs!)');
            }
            // Check API-based services
            else if (this.llmService.isProviderConfigured) {
                llmConfigured = this.llmService.isProviderConfigured(this.llmService.getCurrentProvider());
            } else if (this.llmService.isConfigured !== undefined) {
                llmConfigured = this.llmService.isConfigured;
            }

            if (!llmConfigured) {
                console.warn('⚠️ No LLM configured');
                console.log('💡 Options:');
                console.log('   1. Configure local models (Settings → Local AI Models) - FREE');
                console.log('   2. Configure API service (Settings → LLM Configuration) - Paid');
            }

            this.isInitialized = true;
            console.log('✅ RAG Orchestrator initialized');
            console.log(`   LLM: ${this.llmService.constructor.name}`);
            console.log(`   Vector Store: ${this.vectorStore.constructor.name}`);

            return true;
        } catch (error) {
            console.error('❌ RAG Orchestrator initialization failed:', error);
            return false;
        }
    }

    /**
     * Add document to knowledge base
     */
    async addDocument(content, metadata = {}) {
        if (!this.vectorStore.addDocument) {
            throw new Error('Vector store does not support document addition');
        }

        try {
            console.log(`📚 Adding document to knowledge base...`);

            const result = await this.vectorStore.addDocument(content, metadata);

            this.stats.totalDocuments++;

            console.log(`✅ Document added: ${result.chunkCount} chunks`);

            return result;
        } catch (error) {
            console.error('❌ Failed to add document:', error);
            throw error;
        }
    }

    /**
     * Process and add PDF document (Enhanced with structure recognition)
     */
    async addPDFDocument(pdfFile, metadata = {}) {
        try {
            console.log(`📄 Processing PDF: ${pdfFile.name}`);

            let pdfText = '';
            let structuredData = null;

            // Try enhanced PDF processor first (better quality)
            if (window.enhancedPDFProcessor) {
                console.log('   Using Enhanced PDF Processor (structure-aware)');
                try {
                    structuredData = await window.enhancedPDFProcessor.processPDF(pdfFile, {
                        preserveFormatting: true,
                        detectHeadings: true,
                        detectTables: true,
                        detectEquations: true
                    });

                    // Extract text from structured data
                    pdfText = structuredData.pages
                        .map(page => page.content)
                        .join('\n\n');

                    console.log(`   ✅ Enhanced extraction: ${structuredData.pages.length} pages, ${structuredData.metadata.totalWords} words`);
                    console.log(`   Found: ${structuredData.chapters?.length || 0} chapters, ${structuredData.sections?.length || 0} sections`);

                } catch (enhancedError) {
                    console.warn('   Enhanced processor failed, falling back to basic processor');
                    console.warn(enhancedError.message);
                }
            }

            // Fallback to basic PDF processor if enhanced failed or not available
            if (!pdfText || pdfText.trim().length === 0) {
                const pdfProcessor = window.pdfProcessor;
                if (!pdfProcessor) {
                    throw new Error('PDF Processor not available');
                }

                console.log('   Using basic PDF Processor');
                pdfText = await pdfProcessor.extractText(pdfFile);
            }

            if (!pdfText || pdfText.trim().length === 0) {
                throw new Error('No text extracted from PDF');
            }

            // Add to vector store with enhanced metadata
            const docMetadata = {
                ...metadata,
                fileName: pdfFile.name,
                fileSize: pdfFile.size,
                fileType: 'pdf',
                addedAt: new Date().toISOString(),
                // Include structured data if available
                ...(structuredData && {
                    pageCount: structuredData.pages.length,
                    chapterCount: structuredData.chapters?.length || 0,
                    sectionCount: structuredData.sections?.length || 0,
                    totalWords: structuredData.metadata?.totalWords || 0,
                    hasImages: structuredData.metadata?.imageCount > 0,
                    hasEquations: structuredData.metadata?.equationCount > 0,
                    hasTables: structuredData.metadata?.tableCount > 0,
                    processingMethod: 'enhanced'
                })
            };

            console.log(`   Adding document to vector store: ${pdfText.length} characters`);
            return await this.addDocument(pdfText, docMetadata);

        } catch (error) {
            console.error('❌ Failed to process PDF:', error);
            throw error;
        }
    }

    /**
     * Retrieve relevant context for a query
     */
    async retrieve(query, options = {}) {
        const startTime = Date.now();

        try {
            const retrievalOptions = {
                topK: options.topK || this.config.retrievalTopK,
                collection: options.collection,
                filter: options.filter,
                minScore: options.minScore || this.config.retrievalMinScore
            };

            console.log(`🔍 Retrieving context for: "${query.substring(0, 50)}..."`);

            const results = await this.vectorStore.search(query, retrievalOptions);

            const retrievalTime = Date.now() - startTime;

            // Update stats
            this.updateRetrievalStats(retrievalTime);

            console.log(`✅ Retrieved ${results.length} relevant chunks in ${retrievalTime}ms`);

            return results;
        } catch (error) {
            console.error('❌ Retrieval failed:', error);
            throw error;
        }
    }

    /**
     * Generate answer using RAG pipeline
     */
    async generateAnswer(query, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        this.stats.totalQueries++;
        this.stats.lastQueryAt = Date.now();

        try {
            console.log(`💬 Generating RAG answer for: "${query.substring(0, 50)}..."`);

            // Step 1: Retrieve relevant context
            const retrievalStart = Date.now();
            const retrievedChunks = await this.retrieve(query, options);

            if (retrievedChunks.length === 0) {
                console.warn('⚠️ No relevant context found');
                return {
                    answer: "I don't have enough information to answer that question based on the available documents.",
                    sources: [],
                    confidence: 'low'
                };
            }

            const retrievalTime = Date.now() - retrievalStart;

            // Step 2: Build context from retrieved chunks
            const context = this.buildContext(retrievedChunks);

            console.log(`   Context built: ${context.text.length} chars from ${retrievedChunks.length} chunks`);

            // Step 3: Generate answer using LLM
            const generationStart = Date.now();

            const prompt = this.buildRAGPrompt(query, context.text, options);

            let llmResponse;

            // Use appropriate method based on service type
            if (window.localModelManager && this.llmService === window.localModelManager) {
                // Local model manager - use generateRAGAnswer or generateText
                if (this.llmService.generateRAGAnswer) {
                    llmResponse = await this.llmService.generateRAGAnswer(
                        query,
                        context.text,
                        {
                            maxTokens: options.maxTokens || this.config.answerMaxTokens,
                            temperature: options.temperature
                        }
                    );
                } else {
                    llmResponse = await this.llmService.generateText(prompt, {
                        maxTokens: options.maxTokens || this.config.answerMaxTokens,
                        temperature: options.temperature
                    });
                }
            } else {
                // API-based services - use generateResponse
                llmResponse = await this.llmService.generateResponse(
                    prompt,
                    options.conversationHistory || [],
                    {
                        subject: options.subject,
                        grade: options.grade,
                        maxTokens: options.maxTokens || this.config.answerMaxTokens,
                        temperature: options.temperature
                    }
                );
            }

            const generationTime = Date.now() - generationStart;

            // Update stats
            this.updateGenerationStats(generationTime);

            console.log(`✅ Answer generated in ${generationTime}ms`);

            // Step 4: Format response with sources
            const response = {
                answer: llmResponse.content,
                sources: this.config.includeSourceCitations ? context.sources : [],
                metadata: {
                    retrievalTime,
                    generationTime,
                    totalTime: retrievalTime + generationTime,
                    chunksUsed: retrievedChunks.length,
                    model: llmResponse.model,
                    provider: llmResponse.provider,
                    tokens: llmResponse.usage
                },
                confidence: this.assessConfidence(retrievedChunks)
            };

            return response;

        } catch (error) {
            console.error('❌ RAG answer generation failed:', error);
            throw error;
        }
    }

    /**
     * Build context from retrieved chunks
     */
    buildContext(chunks) {
        let text = '';
        const sources = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            // Add chunk to context
            text += `[Context ${i + 1}]\n${chunk.content}\n\n`;

            // Track source
            if (chunk.metadata) {
                sources.push({
                    index: i + 1,
                    score: chunk.score,
                    metadata: chunk.metadata
                });
            }
        }

        return { text, sources };
    }

    /**
     * Build RAG prompt
     */
    buildRAGPrompt(query, context, options = {}) {
        let prompt = `You are answering a question based on the provided context from educational documents.\n\n`;

        prompt += `CONTEXT:\n${context}\n\n`;

        prompt += `QUESTION: ${query}\n\n`;

        prompt += `INSTRUCTIONS:\n`;
        prompt += `1. Answer the question using ONLY the information from the context above\n`;
        prompt += `2. If the context doesn't contain enough information, say so clearly\n`;
        prompt += `3. Be accurate, concise, and educational\n`;
        prompt += `4. Use examples from the context when helpful\n`;
        prompt += `5. Format your answer clearly with proper structure\n`;

        if (options.subject) {
            prompt += `6. Focus on ${options.subject} concepts\n`;
        }

        if (options.grade) {
            prompt += `7. Use language appropriate for Grade ${options.grade} students\n`;
        }

        prompt += `\nANSWER:`;

        return prompt;
    }

    /**
     * Assess confidence based on retrieval scores
     */
    assessConfidence(chunks) {
        if (chunks.length === 0) return 'none';

        const avgScore = chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length;

        if (avgScore >= 0.8) return 'high';
        if (avgScore >= 0.6) return 'medium';
        if (avgScore >= 0.4) return 'low';
        return 'very_low';
    }

    /**
     * Update retrieval statistics
     */
    updateRetrievalStats(time) {
        if (this.stats.avgRetrievalTime === 0) {
            this.stats.avgRetrievalTime = time;
        } else {
            this.stats.avgRetrievalTime = (this.stats.avgRetrievalTime * 0.9) + (time * 0.1);
        }
    }

    /**
     * Update generation statistics
     */
    updateGenerationStats(time) {
        if (this.stats.avgGenerationTime === 0) {
            this.stats.avgGenerationTime = time;
        } else {
            this.stats.avgGenerationTime = (this.stats.avgGenerationTime * 0.9) + (time * 0.1);
        }
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return {
            ...this.stats,
            vectorStoreStats: this.vectorStore ? this.vectorStore.getStatistics() : null,
            llmStats: this.llmService ? this.llmService.getStatistics() : null,
            config: { ...this.config }
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('✅ RAG configuration updated');
    }

    /**
     * Clear knowledge base
     */
    async clearKnowledgeBase() {
        if (this.vectorStore) {
            this.vectorStore.clear();
            this.stats.totalDocuments = 0;
            console.log('🗑️ Knowledge base cleared');
        }
    }

    /**
     * Export knowledge base
     */
    exportKnowledgeBase() {
        if (this.vectorStore && this.vectorStore.exportToJSON) {
            return this.vectorStore.exportToJSON();
        }
        throw new Error('Export not supported');
    }

    /**
     * Import knowledge base
     */
    async importKnowledgeBase(jsonString) {
        if (this.vectorStore && this.vectorStore.importFromJSON) {
            await this.vectorStore.importFromJSON(jsonString);
            console.log('✅ Knowledge base imported');
        } else {
            throw new Error('Import not supported');
        }
    }
}

// Create global instance
window.ragOrchestrator = new RAGOrchestrator();

console.log('✅ RAG Orchestrator module loaded');
