/**
 * RAG Chat Manager
 * Complete RAG (Retrieval-Augmented Generation) chat system
 * Handles query processing, vector search, context building, and LLM generation
 */

class RAGChatManager {
    constructor() {
        this.chatHistory = [];
        this.currentFilters = {
            subject: 'all',
            grade: 'all',
            source: 'all'
        };
        this.settings = {
            topK: 3,
            temperature: 0.7,
            maxTokens: 500,
            includeExamples: true,
            includeCitations: true
        };
        this.isProcessing = false;
        this.initialized = false;
    }

    /**
     * Initialize RAG Chat
     */
    async initialize() {
        console.log('💬 Initializing RAG Chat Manager...');

        try {
            // Load chat history from localStorage
            this.loadChatHistory();

            // Setup UI event listeners
            this.setupEventListeners();

            // Initialize with welcome message if first time
            if (this.chatHistory.length === 0) {
                this.addAssistantMessage(
                    'Welcome to EduLLM! I\'m your AI assistant specialized in educational content. ' +
                    'Ask me anything about your curriculum, and I\'ll provide answers with relevant source citations.',
                    []
                );
            } else {
                // Restore chat history
                this.renderChatHistory();
            }

            this.initialized = true;
            console.log('✅ RAG Chat Manager initialized');

            return true;
        } catch (error) {
            console.error('❌ RAG Chat initialization error:', error);
            return false;
        }
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Send button
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            sendButton.addEventListener('click', () => this.handleSendMessage());
        }

        // Enter key in input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });
        }

        // Filter changes
        const subjectFilter = document.getElementById('subjectFilter');
        const gradeFilter = document.getElementById('gradeFilter');
        const sourceFilter = document.getElementById('sourceFilter');

        if (subjectFilter) {
            subjectFilter.addEventListener('change', (e) => {
                this.currentFilters.subject = e.target.value;
                console.log('Filter updated:', this.currentFilters);
            });
        }

        if (gradeFilter) {
            gradeFilter.addEventListener('change', (e) => {
                this.currentFilters.grade = e.target.value;
                console.log('Filter updated:', this.currentFilters);
            });
        }

        if (sourceFilter) {
            sourceFilter.addEventListener('change', (e) => {
                this.currentFilters.source = e.target.value;
                console.log('Filter updated:', this.currentFilters);
            });
        }

        console.log('✅ Event listeners setup complete');
    }

    /**
     * Handle sending a message
     */
    async handleSendMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;

        const message = input.value.trim();
        if (!message) return;

        if (this.isProcessing) {
            console.log('⚠️  Already processing a message');
            return;
        }

        // Clear input
        input.value = '';

        // Add user message to chat
        this.addUserMessage(message);

        // Process query with RAG
        await this.processRAGQuery(message);
    }

    /**
     * Main RAG processing pipeline
     */
    async processRAGQuery(userQuery) {
        console.log('🔍 RAG Query Started:', userQuery);

        this.isProcessing = true;
        this.showTypingIndicator();

        const startTime = Date.now();

        try {
            // Step 1: Pre-process query
            const cleanQuery = this.preprocessQuery(userQuery);
            console.log('✨ Query cleaned:', cleanQuery);

            // Step 2: Check if we have data
            const hasData = this.checkDataAvailability();
            if (!hasData) {
                this.addAssistantMessage(
                    'I don\'t have any curriculum data loaded yet. ' +
                    'Please upload NCERT PDFs from the Data Upload page first.',
                    []
                );
                this.hideTypingIndicator();
                this.isProcessing = false;
                return;
            }

            // Step 3: Retrieve relevant context
            const retrievedChunks = await this.retrieveContext(cleanQuery);
            console.log(`📦 Retrieved ${retrievedChunks.length} chunks`);

            if (retrievedChunks.length === 0) {
                this.addAssistantMessage(
                    'I couldn\'t find relevant information in the curriculum for your question. ' +
                    'Try rephrasing or asking about a different topic.',
                    []
                );
                this.hideTypingIndicator();
                this.isProcessing = false;
                return;
            }

            // Step 4: Check if LLM is configured
            const llmConfigured = this.isLLMConfigured();

            let response;
            if (llmConfigured) {
                // Step 5a: Generate response with LLM
                response = await this.generateLLMResponse(userQuery, retrievedChunks);
            } else {
                // Step 5b: Generate response without LLM (template-based)
                response = this.generateTemplateResponse(userQuery, retrievedChunks);
            }

            // Step 6: Display response
            this.addAssistantMessage(response.text, response.sources);

            // Step 7: Track metrics
            const duration = Date.now() - startTime;
            try {
                this.trackQueryMetrics(userQuery, retrievedChunks, duration);
            } catch (metricsError) {
                console.warn('⚠️ Failed to track metrics:', metricsError.message);
            }

            // Step 8: Add to dashboard activity
            try {
                if (window.dashboardManager) {
                    window.dashboardManager.addActivity(
                        'comments',
                        `RAG query processed: "${userQuery.substring(0, 30)}..."`
                    );
                }
            } catch (dashboardError) {
                console.warn('⚠️ Failed to log dashboard activity:', dashboardError.message);
            }

            console.log(`✅ RAG Query Complete (${duration}ms)`);

        } catch (error) {
            console.error('❌ RAG Query Error:', error);
            this.addAssistantMessage(
                'Sorry, I encountered an error processing your question. Please try again.',
                []
            );
        } finally {
            this.hideTypingIndicator();
            this.isProcessing = false;
        }
    }

    /**
     * Pre-process query
     */
    preprocessQuery(query) {
        return query.trim().toLowerCase();
    }

    /**
     * Check if data is available
     */
    checkDataAvailability() {
        // Check ragSystem
        if (window.ragSystem && window.ragSystem.data && window.ragSystem.data.length > 0) {
            return true;
        }

        // Check embeddingManager
        if (window.embeddingManager && window.embeddingManager.documents &&
            window.embeddingManager.documents.length > 0) {
            return true;
        }

        // Check vectorStore
        if (window.vectorStore && window.vectorStore.items && window.vectorStore.items.length > 0) {
            return true;
        }

        return false;
    }

    /**
     * Retrieve relevant context chunks
     */
    async retrieveContext(query) {
        const topK = this.settings.topK;
        let results = [];

        // Try ragSystem first
        if (window.ragSystem && window.ragSystem.find) {
            results = window.ragSystem.find(query, topK * 3); // Get more for filtering
            results = results.map(r => ({
                text: r.text,
                score: r.score,
                metadata: r.info || {}
            }));
        }
        // Try embeddingManager
        else if (window.embeddingManager && window.embeddingManager.search) {
            results = window.embeddingManager.search(query, topK * 3);
            results = results.map(r => ({
                text: r.text,
                score: r.score,
                metadata: r.metadata || {}
            }));
        }
        // Try vectorStore
        else if (window.vectorStore && window.vectorStore.search) {
            try {
                const searchResults = await window.vectorStore.search(query, {
                    topK: topK * 3, // Get more results for filtering
                    collection: 'ncert'
                });
                results = searchResults.map(r => ({
                    text: r.content || r.text,
                    score: r.score,
                    metadata: r.metadata || {}
                }));
            } catch (error) {
                console.error('Vector store search error:', error);
                return [];
            }
        }

        // Apply filters
        results = this.applyFilters(results);

        // Return top K after filtering
        return results.slice(0, topK);
    }

    /**
     * Apply filters to search results
     */
    applyFilters(results) {
        let filtered = results;

        // Filter by subject
        if (this.currentFilters.subject && this.currentFilters.subject !== 'all') {
            filtered = filtered.filter(r => {
                const subject = r.metadata?.subject;
                if (!subject) return false;
                return subject.toLowerCase() === this.currentFilters.subject.toLowerCase();
            });
            console.log(`📚 Filtered by subject "${this.currentFilters.subject}": ${filtered.length} results`);
        }

        // Filter by grade
        if (this.currentFilters.grade && this.currentFilters.grade !== 'all') {
            filtered = filtered.filter(r => {
                const grade = r.metadata?.grade;
                if (!grade) return false;
                return String(grade) === String(this.currentFilters.grade);
            });
            console.log(`🎓 Filtered by grade "${this.currentFilters.grade}": ${filtered.length} results`);
        }

        // Filter by source
        if (this.currentFilters.source && this.currentFilters.source !== 'all') {
            filtered = filtered.filter(r => {
                const source = r.metadata?.source;
                if (!source) return false;
                return source.toLowerCase().includes(this.currentFilters.source.toLowerCase());
            });
            console.log(`📖 Filtered by source "${this.currentFilters.source}": ${filtered.length} results`);
        }

        return filtered;
    }

    /**
     * Check if LLM is configured
     */
    isLLMConfigured() {
        // Check local models first (preferred)
        if (window.localModelManager && window.localModelManager.isInitialized()) {
            return true;
        }

        // Check API-based LLM service
        return window.llmService && window.llmService.isConfigured;
    }

    /**
     * Generate response using LLM
     */
    async generateLLMResponse(query, chunks) {
        // Build context
        const context = chunks.map((chunk, i) =>
            `[Context ${i + 1}]\n${chunk.text}`
        ).join('\n\n');

        // Build prompt
        const prompt = `You are an educational AI assistant specialized in NCERT curriculum.
Use the following context to answer the student's question accurately.
Always cite the source.

CONTEXT:
${context}

QUESTION: ${query}

Provide a clear, accurate answer based on the context above.`;

        try {
            let response;

            // Try local models first (FREE)
            if (window.localModelManager && window.localModelManager.isInitialized()) {
                console.log('🤖 Using local model for RAG response');
                const result = await window.localModelManager.generateResponse(prompt, {
                    temperature: 0.7,
                    maxTokens: 500
                });
                response = { text: result };
            }
            // Fallback to API-based LLM
            else if (window.llmService && window.llmService.isConfigured) {
                console.log('🌐 Using API-based LLM for RAG response');
                response = await window.llmService.generateResponse(prompt);
            }
            else {
                throw new Error('No LLM configured');
            }

            return {
                text: response.text,
                sources: this.extractSources(chunks)
            };
        } catch (error) {
            console.error('LLM generation error:', error);
            // Fallback to template
            return this.generateTemplateResponse(query, chunks);
        }
    }

    /**
     * Generate response without LLM (template-based)
     */
    generateTemplateResponse(query, chunks) {
        const topChunk = chunks[0];

        let response = `Based on the curriculum content:\n\n`;
        response += `${topChunk.text}\n\n`;

        if (chunks.length > 1 && this.settings.includeExamples) {
            response += `\nAdditional information:\n`;
            response += `${chunks[1].text.substring(0, 200)}...\n`;
        }

        if (this.settings.includeCitations) {
            response += `\n📚 This information is from your curriculum data.`;
        }

        return {
            text: response,
            sources: this.extractSources(chunks)
        };
    }

    /**
     * Extract sources from chunks
     */
    extractSources(chunks) {
        return chunks.map(chunk => ({
            title: chunk.metadata.source || 'NCERT Content',
            section: chunk.metadata.chapter || chunk.metadata.section || '',
            score: chunk.score
        }));
    }

    /**
     * Add user message to chat
     */
    addUserMessage(message) {
        const chatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role: 'user',
            content: message,
            timestamp: Date.now()
        };

        this.chatHistory.push(chatMessage);
        this.renderMessage(chatMessage);
        this.saveChatHistory();
        this.scrollToBottom();
    }

    /**
     * Add assistant message to chat
     */
    addAssistantMessage(message, sources = []) {
        const chatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: message,
            sources: sources,
            timestamp: Date.now()
        };

        this.chatHistory.push(chatMessage);
        this.renderMessage(chatMessage);
        this.saveChatHistory();
        this.scrollToBottom();
    }

    /**
     * Add system message to chat
     */
    addSystemMessage(message) {
        const chatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role: 'system',
            content: message,
            timestamp: Date.now()
        };

        this.chatHistory.push(chatMessage);
        this.renderMessage(chatMessage);
        this.saveChatHistory();
    }

    /**
     * Render a single message
     */
    renderMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        // Create message container
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}-message`;

        // Create avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = message.role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        // Create message bubble
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';

        // Create message text
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        const formattedContent = this.formatMessageContent(message.content);
        textDiv.innerHTML = formattedContent;

        // Add sources if available
        if (message.sources && message.sources.length > 0 && this.settings.includeCitations) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.className = 'message-sources';

            message.sources.forEach(source => {
                const sourceTag = document.createElement('span');
                sourceTag.className = 'source-tag';
                sourceTag.textContent = `${source.title || source}`;
                sourcesDiv.appendChild(sourceTag);
            });

            textDiv.appendChild(sourcesDiv);
        }

        // Add timestamp
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.formatTime(message.timestamp);

        // Assemble message
        bubbleDiv.appendChild(textDiv);
        bubbleDiv.appendChild(timeDiv);

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubbleDiv);

        chatMessages.appendChild(messageDiv);
    }

    /**
     * Render entire chat history
     */
    renderChatHistory() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        // Clear existing messages
        chatMessages.innerHTML = '';

        // Add date divider
        const dateDiv = document.createElement('div');
        dateDiv.className = 'message-date';
        dateDiv.textContent = 'Today';
        chatMessages.appendChild(dateDiv);

        // Render all messages
        this.chatHistory.forEach(message => {
            this.renderMessage(message);
        });

        this.scrollToBottom();
    }

    /**
     * Format message content (support markdown-like syntax)
     */
    formatMessageContent(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
            .replace(/\n/g, '<br>');                            // Line breaks
    }

    /**
     * Format timestamp
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.style.display = 'flex';
        }
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    /**
     * Track query metrics
     */
    trackQueryMetrics(query, chunks, duration) {
        // Save to localStorage for analytics
        const metrics = {
            query: query,
            chunksRetrieved: chunks.length,
            topScore: chunks[0]?.score || 0,
            duration: duration,
            timestamp: Date.now()
        };

        // Add to query history
        const history = JSON.parse(localStorage.getItem('query_history') || '[]');
        history.push(metrics);

        // Keep last 100 queries
        if (history.length > 100) {
            history.shift();
        }

        localStorage.setItem('query_history', JSON.stringify(history));

        console.log('📊 Metrics tracked:', metrics);
    }

    /**
     * Save chat history to localStorage
     */
    saveChatHistory() {
        try {
            localStorage.setItem('rag_chat_history', JSON.stringify(this.chatHistory));
        } catch (error) {
            console.warn('Could not save chat history:', error);
        }
    }

    /**
     * Load chat history from localStorage
     */
    loadChatHistory() {
        try {
            const saved = localStorage.getItem('rag_chat_history');
            if (saved) {
                this.chatHistory = JSON.parse(saved);
                console.log(`📥 Loaded ${this.chatHistory.length} messages from history`);
            }
        } catch (error) {
            console.warn('Could not load chat history:', error);
            this.chatHistory = [];
        }
    }

    /**
     * Clear chat history
     */
    clearChat() {
        if (!confirm('Are you sure you want to clear the chat history?')) {
            return;
        }

        this.chatHistory = [];
        localStorage.removeItem('rag_chat_history');

        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }

        // Add welcome message
        this.addAssistantMessage(
            'Chat history cleared. How can I help you today?',
            []
        );

        console.log('🗑️  Chat history cleared');
    }

    /**
     * Export chat history
     */
    exportChat() {
        const data = {
            chatHistory: this.chatHistory,
            exportDate: new Date().toISOString(),
            messageCount: this.chatHistory.length
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('📥 Chat history exported');
    }

    /**
     * Get chat statistics
     */
    getStatistics() {
        const userMessages = this.chatHistory.filter(m => m.role === 'user').length;
        const assistantMessages = this.chatHistory.filter(m => m.role === 'assistant').length;

        return {
            totalMessages: this.chatHistory.length,
            userMessages: userMessages,
            assistantMessages: assistantMessages,
            oldestMessage: this.chatHistory[0]?.timestamp,
            newestMessage: this.chatHistory[this.chatHistory.length - 1]?.timestamp
        };
    }
}

// Initialize global instance
window.ragChatManager = new RAGChatManager();

console.log('💬 RAG Chat Manager loaded');
