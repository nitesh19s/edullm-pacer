/**
 * Enhanced PDF Processing Module
 *
 * Provides advanced PDF processing capabilities for NCERT textbooks
 * including better text extraction, structure recognition, and
 * handling of images, equations, and tables.
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class EnhancedPDFProcessor {
    constructor() {
        this.pdfDoc = null;
        this.metadata = {};
        this.processingOptions = {
            preserveFormatting: true,
            extractImages: true,
            detectEquations: true,
            detectTables: true,
            detectLists: true,
            detectHeadings: true,
            minLineSpacing: 1.2,
            minParagraphSpacing: 1.5
        };
        this.initialized = false;
    }

    /**
     * Initialize the PDF processor
     */
    async initialize() {
        if (this.initialized) return;

        // Check if PDF.js is available
        if (typeof pdfjsLib === 'undefined') {
            console.warn('PDF.js library not loaded. Using basic processing.');
            this.useFallback = true;
        } else {
            // Configure PDF.js worker
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            this.useFallback = false;
        }

        this.initialized = true;
        console.log('✅ Enhanced PDF Processor initialized');
    }

    /**
     * Process PDF file with enhanced extraction
     *
     * @param {File} file - PDF file
     * @param {object} options - Processing options
     * @returns {object} Extracted content
     */
    async processPDF(file, options = {}) {
        await this.initialize();

        const opts = { ...this.processingOptions, ...options };

        try {
            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();

            // Use enhanced processing if PDF.js available
            if (!this.useFallback && typeof pdfjsLib !== 'undefined') {
                return await this.processWithPDFJS(arrayBuffer, opts);
            } else {
                return await this.processWithFallback(file, opts);
            }
        } catch (error) {
            console.error('Error processing PDF:', error);
            throw error;
        }
    }

    /**
     * Process PDF using PDF.js library (enhanced)
     *
     * @param {ArrayBuffer} arrayBuffer - PDF data
     * @param {object} options - Processing options
     * @returns {object} Extracted content
     */
    async processWithPDFJS(arrayBuffer, options) {
        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        this.pdfDoc = await loadingTask.promise;

        // Extract metadata
        this.metadata = await this.extractMetadata();

        const numPages = this.pdfDoc.numPages;
        const pages = [];

        console.log(`Processing ${numPages} pages with enhanced extraction...`);

        // Process each page
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await this.pdfDoc.getPage(pageNum);
            const pageContent = await this.processPage(page, options);

            pages.push({
                pageNumber: pageNum,
                ...pageContent
            });

            // Progress callback
            if (options.onProgress) {
                options.onProgress(pageNum, numPages);
            }
        }

        // Detect document structure
        const structure = this.detectDocumentStructure(pages);

        // Extract chapters and sections
        const chapters = this.extractChapters(pages, structure);

        return {
            metadata: this.metadata,
            numPages,
            pages,
            structure,
            chapters,
            statistics: this.calculateStatistics(pages)
        };
    }

    /**
     * Process individual page with PDF.js
     *
     * @param {PDFPageProxy} page - PDF page
     * @param {object} options - Processing options
     * @returns {object} Page content
     */
    async processPage(page, options) {
        // Get text content
        const textContent = await page.getTextContent();

        // Get viewport for dimensions
        const viewport = page.getViewport({ scale: 1.0 });

        // Extract structured text
        const structuredText = this.extractStructuredText(
            textContent,
            viewport,
            options
        );

        // Extract images if enabled
        let images = [];
        if (options.extractImages) {
            images = await this.extractImages(page);
        }

        // Detect elements
        const elements = this.detectPageElements(structuredText, options);

        return {
            width: viewport.width,
            height: viewport.height,
            text: structuredText.text,
            blocks: structuredText.blocks,
            images,
            elements
        };
    }

    /**
     * Extract structured text from page with formatting
     *
     * @param {object} textContent - PDF.js text content
     * @param {object} viewport - Page viewport
     * @param {object} options - Processing options
     * @returns {object} Structured text
     */
    extractStructuredText(textContent, viewport, options) {
        const blocks = [];
        let currentBlock = null;
        let lastY = null;
        let lastFontSize = null;

        // Group text items into blocks
        for (const item of textContent.items) {
            const y = viewport.height - item.transform[5]; // Convert to top-down coordinates
            const fontSize = Math.abs(item.transform[0]);
            const text = item.str;

            if (!text.trim()) continue;

            // Detect new block based on spacing
            const isNewBlock = lastY === null ||
                Math.abs(y - lastY) > fontSize * options.minParagraphSpacing ||
                Math.abs(fontSize - lastFontSize) > 1;

            if (isNewBlock) {
                if (currentBlock && currentBlock.text.trim()) {
                    blocks.push(currentBlock);
                }

                currentBlock = {
                    text: text,
                    x: item.transform[4],
                    y: y,
                    fontSize: fontSize,
                    fontName: item.fontName || 'unknown',
                    width: item.width,
                    lines: [text]
                };
            } else {
                // Add space if needed
                if (currentBlock.text && !currentBlock.text.endsWith(' ')) {
                    currentBlock.text += ' ';
                }
                currentBlock.text += text;
                currentBlock.lines.push(text);
                currentBlock.width += item.width;
            }

            lastY = y;
            lastFontSize = fontSize;
        }

        // Add final block
        if (currentBlock && currentBlock.text.trim()) {
            blocks.push(currentBlock);
        }

        // Combine blocks into full text
        const fullText = blocks.map(b => b.text).join('\n\n');

        return {
            text: fullText,
            blocks
        };
    }

    /**
     * Extract images from page
     *
     * @param {PDFPageProxy} page - PDF page
     * @returns {array} Extracted images
     */
    async extractImages(page) {
        const images = [];

        try {
            const operatorList = await page.getOperatorList();

            // Look for image operations
            for (let i = 0; i < operatorList.fnArray.length; i++) {
                const op = operatorList.fnArray[i];

                // OPS.paintImageXObject or OPS.paintInlineImageXObject
                if (op === pdfjsLib.OPS.paintImageXObject ||
                    op === pdfjsLib.OPS.paintInlineImageXObject) {

                    images.push({
                        type: 'image',
                        index: images.length,
                        operator: op,
                        // Additional image metadata can be extracted here
                    });
                }
            }
        } catch (error) {
            console.warn('Error extracting images:', error);
        }

        return images;
    }

    /**
     * Detect page elements (headings, lists, equations, tables)
     *
     * @param {object} structuredText - Structured text
     * @param {object} options - Detection options
     * @returns {object} Detected elements
     */
    detectPageElements(structuredText, options) {
        const elements = {
            headings: [],
            lists: [],
            equations: [],
            tables: [],
            paragraphs: []
        };

        for (const block of structuredText.blocks) {
            const text = block.text.trim();

            // Detect headings
            if (options.detectHeadings) {
                if (this.isHeading(block, structuredText.blocks)) {
                    elements.headings.push({
                        text,
                        level: this.detectHeadingLevel(block),
                        fontSize: block.fontSize,
                        y: block.y
                    });
                    continue;
                }
            }

            // Detect lists
            if (options.detectLists) {
                if (this.isList(text)) {
                    elements.lists.push({
                        text,
                        type: this.detectListType(text),
                        y: block.y
                    });
                    continue;
                }
            }

            // Detect equations
            if (options.detectEquations) {
                if (this.isEquation(text)) {
                    elements.equations.push({
                        text,
                        y: block.y
                    });
                    continue;
                }
            }

            // Detect tables (basic heuristic)
            if (options.detectTables) {
                if (this.isTableRow(text)) {
                    elements.tables.push({
                        text,
                        y: block.y
                    });
                    continue;
                }
            }

            // Regular paragraph
            elements.paragraphs.push({
                text,
                fontSize: block.fontSize,
                y: block.y
            });
        }

        return elements;
    }

    /**
     * Check if block is a heading
     */
    isHeading(block, allBlocks) {
        // Heading heuristics:
        // 1. Larger font size than average
        // 2. Shorter text
        // 3. Not ending with period

        const avgFontSize = allBlocks.reduce((sum, b) => sum + b.fontSize, 0) / allBlocks.length;
        const text = block.text.trim();

        return block.fontSize > avgFontSize * 1.2 &&
               text.length < 100 &&
               !text.endsWith('.');
    }

    /**
     * Detect heading level
     */
    detectHeadingLevel(block) {
        // Simple heuristic based on font size
        if (block.fontSize > 24) return 1;
        if (block.fontSize > 18) return 2;
        if (block.fontSize > 14) return 3;
        return 4;
    }

    /**
     * Check if text is a list
     */
    isList(text) {
        const listPatterns = [
            /^[\d]+[.)]/, // Numbered list: 1. or 1)
            /^[•\-*]/, // Bullet list
            /^[a-z][.)]/, // Lettered list: a. or a)
            /^[ivxIVX]+[.)]/ // Roman numerals
        ];

        return listPatterns.some(pattern => pattern.test(text.trim()));
    }

    /**
     * Detect list type
     */
    detectListType(text) {
        if (/^[\d]+/.test(text)) return 'numbered';
        if (/^[•\-*]/.test(text)) return 'bullet';
        if (/^[a-z]/.test(text)) return 'lettered';
        return 'unknown';
    }

    /**
     * Check if text contains mathematical equation
     */
    isEquation(text) {
        const equationPatterns = [
            /[=+\-×÷∫∑∏√]/,  // Math symbols
            /\^\d+/,          // Superscripts
            /_{?[a-z0-9]+}?/i, // Subscripts
            /\\[a-z]+/,       // LaTeX commands
            /[∈∉⊂⊃∩∪]/       // Set theory
        ];

        // Check if text is short and contains math symbols
        return text.length < 200 &&
               equationPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Check if text is part of a table
     */
    isTableRow(text) {
        // Simple heuristic: contains multiple tabs or aligned spaces
        const tabCount = (text.match(/\t/g) || []).length;
        const multipleSpaces = (text.match(/\s{3,}/g) || []).length;

        return tabCount > 1 || multipleSpaces > 2;
    }

    /**
     * Extract document metadata
     */
    async extractMetadata() {
        const metadata = await this.pdfDoc.getMetadata();

        return {
            title: metadata.info.Title || 'Unknown',
            author: metadata.info.Author || 'Unknown',
            subject: metadata.info.Subject || '',
            keywords: metadata.info.Keywords || '',
            creator: metadata.info.Creator || '',
            producer: metadata.info.Producer || '',
            creationDate: metadata.info.CreationDate || '',
            modificationDate: metadata.info.ModDate || ''
        };
    }

    /**
     * Detect document structure (chapters, sections)
     */
    detectDocumentStructure(pages) {
        const structure = {
            chapters: [],
            sections: [],
            hierarchy: []
        };

        for (const page of pages) {
            if (!page.elements) continue;

            for (const heading of page.elements.headings) {
                const item = {
                    text: heading.text,
                    level: heading.level,
                    pageNumber: page.pageNumber,
                    y: heading.y
                };

                if (heading.level === 1) {
                    structure.chapters.push(item);
                } else if (heading.level === 2) {
                    structure.sections.push(item);
                }

                structure.hierarchy.push(item);
            }
        }

        return structure;
    }

    /**
     * Extract chapters with content
     */
    extractChapters(pages, structure) {
        const chapters = [];

        // Group content by chapters
        for (let i = 0; i < structure.chapters.length; i++) {
            const chapter = structure.chapters[i];
            const nextChapter = structure.chapters[i + 1];

            const startPage = chapter.pageNumber;
            const endPage = nextChapter ? nextChapter.pageNumber - 1 : pages.length;

            // Collect all content in this chapter
            const content = {
                headings: [],
                paragraphs: [],
                equations: [],
                lists: [],
                images: []
            };

            for (let p = startPage; p <= endPage; p++) {
                const page = pages[p - 1];
                if (!page || !page.elements) continue;

                content.headings.push(...page.elements.headings);
                content.paragraphs.push(...page.elements.paragraphs);
                content.equations.push(...page.elements.equations);
                content.lists.push(...page.elements.lists);
                content.images.push(...page.images);
            }

            chapters.push({
                title: chapter.text,
                level: chapter.level,
                startPage,
                endPage,
                content,
                text: this.combineChapterText(content)
            });
        }

        return chapters;
    }

    /**
     * Combine chapter content into text
     */
    combineChapterText(content) {
        const parts = [];

        // Add headings and paragraphs in order
        const allElements = [
            ...content.headings.map(h => ({ ...h, type: 'heading' })),
            ...content.paragraphs.map(p => ({ ...p, type: 'paragraph' }))
        ].sort((a, b) => a.y - b.y);

        for (const elem of allElements) {
            if (elem.type === 'heading') {
                parts.push(`\n## ${elem.text}\n`);
            } else {
                parts.push(elem.text);
            }
        }

        return parts.join('\n\n');
    }

    /**
     * Calculate extraction statistics
     */
    calculateStatistics(pages) {
        const stats = {
            totalPages: pages.length,
            totalBlocks: 0,
            totalHeadings: 0,
            totalParagraphs: 0,
            totalEquations: 0,
            totalLists: 0,
            totalImages: 0,
            averageBlocksPerPage: 0,
            averageWordsPerPage: 0
        };

        let totalWords = 0;

        for (const page of pages) {
            if (!page.blocks) continue;

            stats.totalBlocks += page.blocks.length;

            if (page.elements) {
                stats.totalHeadings += page.elements.headings.length;
                stats.totalParagraphs += page.elements.paragraphs.length;
                stats.totalEquations += page.elements.equations.length;
                stats.totalLists += page.elements.lists.length;
                stats.totalImages += page.images.length;
            }

            // Count words
            const words = page.text.split(/\s+/).filter(w => w.length > 0);
            totalWords += words.length;
        }

        stats.averageBlocksPerPage = (stats.totalBlocks / stats.totalPages).toFixed(2);
        stats.averageWordsPerPage = (totalWords / stats.totalPages).toFixed(2);

        return stats;
    }

    /**
     * Fallback processing (use existing DataProcessor method)
     *
     * @param {File} file - PDF file
     * @param {object} options - Processing options
     * @returns {object} Extracted content
     */
    async processWithFallback(file, options) {
        console.log('Using fallback PDF processing...');

        // Use the existing PDF processing if available
        if (window.dataProcessor && window.dataProcessor.processPDF) {
            const text = await window.dataProcessor.processPDF(file);

            return {
                metadata: {
                    title: file.name,
                    author: 'Unknown',
                    subject: 'NCERT Textbook'
                },
                numPages: 1,
                pages: [{
                    pageNumber: 1,
                    text,
                    blocks: [{ text }],
                    images: [],
                    elements: {
                        headings: [],
                        paragraphs: [{ text }],
                        equations: [],
                        lists: [],
                        tables: []
                    }
                }],
                structure: {
                    chapters: [],
                    sections: [],
                    hierarchy: []
                },
                chapters: [],
                statistics: {
                    totalPages: 1,
                    totalBlocks: 1,
                    totalHeadings: 0,
                    totalParagraphs: 1,
                    totalEquations: 0,
                    totalLists: 0,
                    totalImages: 0
                }
            };
        }

        throw new Error('No PDF processing capability available');
    }

    /**
     * Convert enhanced extraction to NCERT format
     *
     * @param {object} extracted - Enhanced extraction result
     * @param {object} metadata - NCERT metadata (subject, grade, etc.)
     * @returns {object} NCERT formatted data
     */
    convertToNCERTFormat(extracted, metadata) {
        const ncertData = {
            subject: metadata.subject || 'Unknown',
            grade: metadata.grade || 'Unknown',
            language: metadata.language || 'English',
            chapters: [],
            metadata: {
                ...extracted.metadata,
                processingDate: new Date().toISOString(),
                enhancedExtraction: true
            }
        };

        // Convert chapters
        for (const chapter of extracted.chapters) {
            ncertData.chapters.push({
                title: chapter.title,
                content: chapter.text,
                pageRange: `${chapter.startPage}-${chapter.endPage}`,
                statistics: {
                    headings: chapter.content.headings.length,
                    paragraphs: chapter.content.paragraphs.length,
                    equations: chapter.content.equations.length,
                    lists: chapter.content.lists.length,
                    images: chapter.content.images.length
                }
            });
        }

        return ncertData;
    }

    /**
     * Extract text with better quality
     *
     * @param {File} file - PDF file
     * @returns {string} Extracted text
     */
    async extractText(file) {
        const result = await this.processPDF(file);
        return result.pages.map(p => p.text).join('\n\n');
    }

    /**
     * Extract specific page
     *
     * @param {File} file - PDF file
     * @param {number} pageNumber - Page number
     * @returns {object} Page content
     */
    async extractPage(file, pageNumber) {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;

        const page = await pdfDoc.getPage(pageNumber);
        return await this.processPage(page, this.processingOptions);
    }

    /**
     * Extract chapters only
     *
     * @param {File} file - PDF file
     * @returns {array} Chapters
     */
    async extractChaptersOnly(file) {
        const result = await this.processPDF(file);
        return result.chapters;
    }
}

// Initialize and export
window.enhancedPDFProcessor = new EnhancedPDFProcessor();
console.log('✅ Enhanced PDF Processor module loaded');
