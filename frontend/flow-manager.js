// EduLLM Platform Flow Management System
// Manages page-by-page flow, navigation, and user experience

class FlowManager {
    constructor(platform) {
        this.platform = platform;
        this.currentPage = 'dashboard';
        this.pageHistory = [];
        this.flowState = {
            isFirstVisit: true,
            onboardingCompleted: false,
            currentStep: null,
            visitedPages: new Set(),
            pageData: {}
        };
        this.pageFlow = this.initializePageFlow();
        this.init();
    }

    initializePageFlow() {
        return {
            dashboard: {
                name: 'Dashboard',
                description: 'Overview and statistics',
                order: 1,
                nextPages: ['rag', 'upload', 'settings'],
                prerequisites: [],
                quickActions: [
                    { label: 'Start Chat', action: 'navigate', target: 'rag' },
                    { label: 'Upload Data', action: 'navigate', target: 'upload' }
                ],
                helpText: 'Welcome! Start by uploading NCERT data or explore the RAG chat interface.'
            },
            rag: {
                name: 'RAG Chat',
                description: 'Interactive AI chat with NCERT curriculum',
                order: 2,
                nextPages: ['chunking', 'knowledge', 'dashboard'],
                prerequisites: [],
                quickActions: [
                    { label: 'View Chunks', action: 'navigate', target: 'chunking' },
                    { label: 'Explore Graph', action: 'navigate', target: 'knowledge' }
                ],
                helpText: 'Ask questions about NCERT curriculum. Use filters to narrow down subjects and grades.'
            },
            chunking: {
                name: 'Smart Chunking',
                description: 'Document segmentation visualization',
                order: 3,
                nextPages: ['rag', 'knowledge', 'upload'],
                prerequisites: [],
                quickActions: [
                    { label: 'Try Chat', action: 'navigate', target: 'rag' },
                    { label: 'Upload More', action: 'navigate', target: 'upload' }
                ],
                helpText: 'Visualize how documents are segmented into chunks for better retrieval.'
            },
            knowledge: {
                name: 'Knowledge Graph',
                description: 'Concept relationship visualization',
                order: 4,
                nextPages: ['rag', 'chunking', 'dashboard'],
                prerequisites: [],
                quickActions: [
                    { label: 'Ask Questions', action: 'navigate', target: 'rag' },
                    { label: 'View Chunks', action: 'navigate', target: 'chunking' }
                ],
                helpText: 'Explore relationships between concepts in the NCERT curriculum.'
            },
            upload: {
                name: 'Data Upload',
                description: 'Upload and process NCERT PDFs',
                order: 5,
                nextPages: ['dashboard', 'rag', 'chunking'],
                prerequisites: [],
                quickActions: [
                    { label: 'View Dashboard', action: 'navigate', target: 'dashboard' },
                    { label: 'Start Chat', action: 'navigate', target: 'rag' }
                ],
                helpText: 'Upload NCERT PDF textbooks to enhance the platform with real curriculum data.'
            },
            experiments: {
                name: 'Experiments',
                description: 'Research experiment tracking',
                order: 6,
                nextPages: ['analytics', 'comparisons', 'abtesting'],
                prerequisites: [],
                quickActions: [
                    { label: 'New Experiment', action: 'custom', target: 'createExperiment' },
                    { label: 'Index Data', action: 'custom', target: 'indexData' }
                ],
                helpText: 'Track and compare RAG system experiments. Create experiments, run tests, and analyze results.'
            },
            analytics: {
                name: 'Analytics Dashboard',
                description: 'Comprehensive research analytics and insights',
                order: 7,
                nextPages: ['comparisons', 'experiments', 'abtesting'],
                prerequisites: [],
                quickActions: [
                    { label: 'Generate Report', action: 'custom', target: 'generateReport' },
                    { label: 'View Experiments', action: 'navigate', target: 'experiments' }
                ],
                helpText: 'View comprehensive analytics, generate reports, and gain insights from your RAG research.'
            },
            comparisons: {
                name: 'Baseline Comparisons',
                description: 'Compare different RAG approaches',
                order: 8,
                nextPages: ['analytics', 'experiments', 'abtesting'],
                prerequisites: [],
                quickActions: [
                    { label: 'New Comparison', action: 'custom', target: 'createComparison' },
                    { label: 'View Analytics', action: 'navigate', target: 'analytics' }
                ],
                helpText: 'Compare different RAG configurations systematically with statistical analysis.'
            },
            abtesting: {
                name: 'A/B Testing',
                description: 'Controlled experiment management',
                order: 9,
                nextPages: ['analytics', 'comparisons', 'experiments'],
                prerequisites: [],
                quickActions: [
                    { label: 'Create Test', action: 'custom', target: 'createABTest' },
                    { label: 'Running Tests', action: 'custom', target: 'viewRunningTests' }
                ],
                helpText: 'Run controlled A/B tests to optimize RAG system performance with statistical significance.'
            },
            progression: {
                name: 'Progression Tracking',
                description: 'Track student learning progression and concept mastery',
                order: 10,
                nextPages: ['gaps', 'crosssubject', 'analytics', 'experiments'],
                prerequisites: [],
                quickActions: [
                    { label: 'Analyze Gaps', action: 'navigate', target: 'gaps' },
                    { label: 'Cross-Subject', action: 'navigate', target: 'crosssubject' }
                ],
                helpText: 'Track learning progression, concept mastery levels, and student development over time.'
            },
            gaps: {
                name: 'Curriculum Gap Analysis',
                description: 'Identify missing concepts and knowledge gaps',
                order: 11,
                nextPages: ['progression', 'crosssubject', 'analytics'],
                prerequisites: [],
                quickActions: [
                    { label: 'Track Progression', action: 'navigate', target: 'progression' },
                    { label: 'Cross-Subject', action: 'navigate', target: 'crosssubject' }
                ],
                helpText: 'Identify curriculum gaps, missing prerequisite knowledge, and areas requiring additional focus.'
            },
            crosssubject: {
                name: 'Cross-Subject Analytics',
                description: 'Analyze learning patterns across multiple subjects',
                order: 12,
                nextPages: ['progression', 'gaps', 'analytics'],
                prerequisites: [],
                quickActions: [
                    { label: 'Track Progression', action: 'navigate', target: 'progression' },
                    { label: 'Analyze Gaps', action: 'navigate', target: 'gaps' }
                ],
                helpText: 'Analyze performance patterns, concept connections, and learning relationships across different subjects.'
            },
            settings: {
                name: 'Settings',
                description: 'Platform configuration',
                order: 13,
                nextPages: ['dashboard'],
                prerequisites: [],
                quickActions: [
                    { label: 'Back to Dashboard', action: 'navigate', target: 'dashboard' }
                ],
                helpText: 'Configure platform settings, privacy, and research parameters.'
            },
            pacer: {
                name: 'PACER Results',
                description: 'Experiment results and paper tables',
                order: 14,
                nextPages: ['dashboard'],
                prerequisites: [],
                quickActions: [],
                helpText: 'View PACER experiment results, CAS metrics, and inter-rater agreement.'
            }
        };
    }

    async init() {
        // Check if first visit
        const visited = await this.platform.database.getSetting('firstVisit');
        this.flowState.isFirstVisit = visited === null;
        
        const onboarding = await this.platform.database.getSetting('onboardingCompleted');
        this.flowState.onboardingCompleted = onboarding === true;

        // Load page history
        this.loadPageHistory();

        // Setup flow navigation
        this.setupFlowNavigation();

        // Show onboarding if first visit
        if (this.flowState.isFirstVisit && !this.flowState.onboardingCompleted) {
            this.showOnboarding();
        }
    }

    // Navigate to a page with flow management
    async navigateToPage(pageName, options = {}) {
        const { skipHistory = false, showHelp = true, data = {} } = options;

        // Validate page exists
        if (!this.pageFlow[pageName]) {
            console.error(`Page ${pageName} not found`);
            return false;
        }

        // Check prerequisites
        const page = this.pageFlow[pageName];
        if (page.prerequisites.length > 0) {
            const canAccess = await this.checkPrerequisites(page.prerequisites);
            if (!canAccess) {
                this.showPrerequisiteWarning(page);
                return false;
            }
        }

        // Save current page data
        if (!skipHistory && this.currentPage) {
            this.savePageData(this.currentPage);
        }

        // Add to history
        if (!skipHistory) {
            this.pageHistory.push({
                page: this.currentPage,
                timestamp: new Date().toISOString()
            });
        }

        // Update current page
        const previousPage = this.currentPage;
        this.currentPage = pageName;
        this.flowState.visitedPages.add(pageName);

        // Store page data
        this.flowState.pageData[pageName] = data;

        // Navigate using platform (use direct method to avoid recursion)
        this.platform.switchSectionDirect(pageName);

        // Show page-specific help
        if (showHelp && this.flowState.isFirstVisit) {
            this.showPageHelp(pageName);
        }

        // Show page-specific elements
        this.showPageElements(pageName);

        // Update flow indicators
        this.updateFlowIndicators();

        // Log navigation
        await this.platform.database.logInteraction({
            type: 'navigation',
            section: pageName,
            action: 'page_navigation',
            metadata: {
                from: previousPage,
                to: pageName,
                flow: true
            }
        });

        return true;
    }

    // Check prerequisites for a page
    async checkPrerequisites(prerequisites) {
        for (const prereq of prerequisites) {
            switch (prereq.type) {
                case 'data_required':
                    const hasData = this.platform.isDataLoaded;
                    if (!hasData) return false;
                    break;
                case 'page_visited':
                    if (!this.flowState.visitedPages.has(prereq.page)) {
                        return false;
                    }
                    break;
                case 'setting_required':
                    const setting = await this.platform.database.getSetting(prereq.setting);
                    if (!setting) return false;
                    break;
            }
        }
        return true;
    }

    // Show prerequisite warning
    showPrerequisiteWarning(page) {
        const message = `Please complete the following before accessing ${page.name}: ${page.prerequisites.map(p => p.message).join(', ')}`;
        this.platform.showNotification(message, 'warning');
    }

    // Save page data before leaving
    savePageData(pageName) {
        // Save any page-specific state
        const page = this.pageFlow[pageName];
        if (page.saveData) {
            page.saveData();
        }
    }

    // Show onboarding flow
    showOnboarding() {
        const onboardingSteps = [
            {
                page: 'dashboard',
                title: 'Welcome to EduLLM Platform',
                content: 'Your educational AI research platform for NCERT curriculum data.',
                action: 'Next'
            },
            {
                page: 'upload',
                title: 'Upload NCERT Data',
                content: 'Start by uploading NCERT PDF textbooks to populate the platform with curriculum data.',
                action: 'Next'
            },
            {
                page: 'rag',
                title: 'Interactive RAG Chat',
                content: 'Ask questions about the curriculum and get AI-powered responses with source citations.',
                action: 'Next'
            },
            {
                page: 'chunking',
                title: 'Smart Chunking',
                content: 'Visualize how documents are segmented for optimal retrieval performance.',
                action: 'Next'
            },
            {
                page: 'knowledge',
                title: 'Knowledge Graph',
                content: 'Explore relationships between concepts across the curriculum.',
                action: 'Get Started'
            }
        ];

        this.startOnboardingFlow(onboardingSteps);
    }

    // Start onboarding flow
    async startOnboardingFlow(steps) {
        let currentStep = 0;

        const showStep = async (stepIndex) => {
            if (stepIndex >= steps.length) {
                await this.completeOnboarding();
                return;
            }

            const step = steps[stepIndex];
            this.showOnboardingModal(step, async () => {
                // Navigate to step page
                await this.navigateToPage(step.page, { skipHistory: true, showHelp: false });
                currentStep++;
                setTimeout(() => showStep(currentStep), 500);
            });
        };

        showStep(0);
    }

    // Show onboarding modal
    showOnboardingModal(step, onNext) {
        const modal = document.createElement('div');
        modal.className = 'onboarding-modal';
        modal.innerHTML = `
            <div class="onboarding-content">
                <div class="onboarding-header">
                    <h2>${step.title}</h2>
                    <button class="onboarding-skip" onclick="this.closest('.onboarding-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="onboarding-body">
                    <p>${step.content}</p>
                </div>
                <div class="onboarding-footer">
                    <button class="btn-secondary onboarding-skip-btn" onclick="this.closest('.onboarding-modal').remove()">
                        Skip Tour
                    </button>
                    <button class="btn-primary onboarding-next-btn">
                        ${step.action}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.onboarding-next-btn').addEventListener('click', () => {
            modal.remove();
            onNext();
        });

        modal.querySelector('.onboarding-skip').addEventListener('click', () => {
            modal.remove();
            this.completeOnboarding();
        });

        modal.querySelector('.onboarding-skip-btn').addEventListener('click', () => {
            modal.remove();
            this.completeOnboarding();
        });
    }

    // Complete onboarding
    async completeOnboarding() {
        this.flowState.onboardingCompleted = true;
        await this.platform.database.saveSetting('onboardingCompleted', true);
        await this.platform.database.saveSetting('firstVisit', false);
        this.platform.showNotification('Welcome to EduLLM Platform!', 'success');
    }

    // Show page-specific help
    showPageHelp(pageName) {
        const page = this.pageFlow[pageName];
        if (!page || !page.helpText) return;

        // Show help tooltip
        const helpBanner = document.createElement('div');
        helpBanner.className = 'page-help-banner';
        helpBanner.innerHTML = `
            <div class="help-content">
                <i class="fas fa-info-circle"></i>
                <span>${page.helpText}</span>
                <button class="help-close" onclick="this.closest('.page-help-banner').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        const section = document.getElementById(pageName);
        if (section) {
            section.insertBefore(helpBanner, section.firstChild);
        }

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (helpBanner.parentNode) {
                helpBanner.remove();
            }
        }, 10000);
    }

    // Show page-specific elements
    showPageElements(pageName) {
        // Dashboard - Show quick start guide on first visit
        if (pageName === 'dashboard' && this.flowState.isFirstVisit) {
            const quickStart = document.getElementById('dashboard-quick-start');
            if (quickStart) {
                quickStart.style.display = 'block';
            }
        }

        // RAG Chat - Show tips on first visit
        if (pageName === 'rag' && this.flowState.isFirstVisit) {
            const tips = document.getElementById('rag-tips');
            if (tips) {
                tips.style.display = 'block';
            }
        }

        // Chunking - Show info on first visit
        if (pageName === 'chunking' && this.flowState.isFirstVisit) {
            const info = document.getElementById('chunking-info');
            if (info) {
                info.style.display = 'block';
            }
        }

        // Knowledge Graph - Show info on first visit
        if (pageName === 'knowledge' && this.flowState.isFirstVisit) {
            const info = document.getElementById('knowledge-info');
            if (info) {
                info.style.display = 'block';
            }
        }

        // Upload - Show instructions on first visit
        if (pageName === 'upload' && this.flowState.isFirstVisit) {
            const instructions = document.getElementById('upload-instructions');
            if (instructions) {
                instructions.style.display = 'block';
            }
        }
    }

    // Update flow indicators (breadcrumbs, progress)
    updateFlowIndicators() {
        this.updateBreadcrumbs();
        this.updateQuickActions();
        this.updateProgressIndicator();
    }

    // Update breadcrumbs
    updateBreadcrumbs() {
        let breadcrumbContainer = document.getElementById('breadcrumb-container');
        
        const currentSection = document.getElementById(this.currentPage);
        if (!currentSection) return;

        if (!breadcrumbContainer) {
            breadcrumbContainer = document.createElement('div');
            breadcrumbContainer.id = 'breadcrumb-container';
            breadcrumbContainer.className = 'breadcrumb-container';
            const sectionHeader = currentSection.querySelector('.section-header');
            if (sectionHeader) {
                currentSection.insertBefore(breadcrumbContainer, sectionHeader);
            } else {
                currentSection.insertBefore(breadcrumbContainer, currentSection.firstChild);
            }
        }

        const currentPage = this.pageFlow[this.currentPage];
        if (!currentPage) return;

        const breadcrumbs = [
            { name: 'Home', page: 'dashboard' },
            { name: currentPage.name, page: this.currentPage }
        ];

        breadcrumbContainer.innerHTML = breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return `
                <span class="breadcrumb-item ${isLast ? 'active' : ''}" 
                      ${!isLast ? `onclick="window.eduLLM.flowManager.navigateToPage('${crumb.page}')"` : ''}>
                    ${crumb.name}
                    ${!isLast ? '<i class="fas fa-chevron-right"></i>' : ''}
                </span>
            `;
        }).join('');
    }

    // Update quick actions
    updateQuickActions() {
        const currentPage = this.pageFlow[this.currentPage];
        if (!currentPage || !currentPage.quickActions) return;

        let quickActionsContainer = document.getElementById('quick-actions-container');
        
        if (!quickActionsContainer) {
            quickActionsContainer = document.createElement('div');
            quickActionsContainer.id = 'quick-actions-container';
            quickActionsContainer.className = 'quick-actions-container';
            const section = document.getElementById(this.currentPage);
            if (section) {
                const sectionHeader = section.querySelector('.section-header');
                if (sectionHeader) {
                    sectionHeader.appendChild(quickActionsContainer);
                }
            }
        }

        quickActionsContainer.innerHTML = `
            <div class="quick-actions">
                ${currentPage.quickActions.map(action => `
                    <button class="quick-action-btn" onclick="window.eduLLM.flowManager.handleQuickAction('${action.action}', '${action.target}')">
                        <i class="fas fa-arrow-right"></i>
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Handle quick action
    async handleQuickAction(action, target) {
        switch (action) {
            case 'navigate':
                await this.navigateToPage(target);
                break;
            case 'action':
                // Handle custom actions
                break;
        }
    }

    // Update progress indicator
    updateProgressIndicator() {
        const totalPages = Object.keys(this.pageFlow).length;
        const visitedCount = this.flowState.visitedPages.size;
        const progress = (visitedCount / totalPages) * 100;

        let progressContainer = document.getElementById('flow-progress-container');
        
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'flow-progress-container';
            progressContainer.className = 'flow-progress-container';
            const header = document.querySelector('.header');
            if (header) {
                const headerContent = header.querySelector('.header-content');
                if (headerContent) {
                    headerContent.appendChild(progressContainer);
                }
            }
        }

        if (this.flowState.isFirstVisit && !this.flowState.onboardingCompleted) {
            progressContainer.innerHTML = `
                <div class="flow-progress">
                    <span class="progress-label">Progress: ${visitedCount}/${totalPages} pages</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
        } else {
            progressContainer.innerHTML = '';
        }
    }

    // Setup flow navigation
    setupFlowNavigation() {
        // Add back button functionality
        this.addBackButton();
        
        // Add keyboard navigation
        this.setupKeyboardNavigation();
        
        // Add page transition animations
        this.setupPageTransitions();
    }

    // Add back button
    addBackButton() {
        // Back button will be added to each page dynamically
    }

    // Setup keyboard navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Alt + Left Arrow = Go back
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goBack();
            }
            
            // Alt + Right Arrow = Go forward
            if (e.altKey && e.key === 'ArrowRight') {
                e.preventDefault();
                this.goForward();
            }
        });
    }

    // Go back in history
    async goBack() {
        if (this.pageHistory.length > 0) {
            const previous = this.pageHistory.pop();
            await this.navigateToPage(previous.page, { skipHistory: true });
        }
    }

    // Go forward (if we had forward history)
    goForward() {
        // Implementation for forward navigation if needed
    }

    // Setup page transitions
    setupPageTransitions() {
        // Add transition classes to sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        });
    }

    // Load page history from database
    async loadPageHistory() {
        try {
            const history = await this.platform.database.getSetting('pageHistory');
            if (history) {
                this.pageHistory = history;
            }
        } catch (error) {
            console.error('Error loading page history:', error);
        }
    }

    // Save page history to database
    async savePageHistory() {
        try {
            await this.platform.database.saveSetting('pageHistory', this.pageHistory);
        } catch (error) {
            console.error('Error saving page history:', error);
        }
    }

    // Get suggested next page
    getSuggestedNextPage() {
        const currentPage = this.pageFlow[this.currentPage];
        if (!currentPage || !currentPage.nextPages) return null;

        // Find first unvisited page
        for (const nextPage of currentPage.nextPages) {
            if (!this.flowState.visitedPages.has(nextPage)) {
                return nextPage;
            }
        }

        // Return first next page if all visited
        return currentPage.nextPages[0] || null;
    }

    // Get flow statistics
    getFlowStatistics() {
        return {
            currentPage: this.currentPage,
            visitedPages: Array.from(this.flowState.visitedPages),
            totalPages: Object.keys(this.pageFlow).length,
            progress: (this.flowState.visitedPages.size / Object.keys(this.pageFlow).length) * 100,
            historyLength: this.pageHistory.length
        };
    }

    // Reset flow state
    async resetFlow() {
        this.flowState.visitedPages.clear();
        this.pageHistory = [];
        this.flowState.pageData = {};
        await this.platform.database.saveSetting('onboardingCompleted', false);
        await this.platform.database.saveSetting('firstVisit', true);
        this.flowState.isFirstVisit = true;
        this.flowState.onboardingCompleted = false;
    }
}

// Export for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlowManager;
}

// Global instance for browser usage
if (typeof window !== 'undefined') {
    window.FlowManager = FlowManager;
}

