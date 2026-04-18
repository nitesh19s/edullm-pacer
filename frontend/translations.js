/**
 * Language Translations for EduLLM Platform
 * Supports: English (en), Hindi (hi), Bilingual (en + hi)
 */

const translations = {
    // Navigation & Menu
    nav: {
        dashboard: {
            en: 'Dashboard',
            hi: 'डैशबोर्ड'
        },
        features: {
            en: 'Features',
            hi: 'विशेषताएँ'
        },
        ragChat: {
            en: 'RAG Chat',
            hi: 'RAG चैट'
        },
        smartChunking: {
            en: 'Smart Chunking',
            hi: 'स्मार्ट चंकिंग'
        },
        knowledgeGraph: {
            en: 'Knowledge Graph',
            hi: 'ज्ञान ग्राफ'
        },
        researchTools: {
            en: 'Research Tools',
            hi: 'अनुसंधान उपकरण'
        },
        analytics: {
            en: 'Analytics',
            hi: 'विश्लेषण'
        },
        comparisons: {
            en: 'Comparisons',
            hi: 'तुलना'
        },
        abTesting: {
            en: 'A/B Testing',
            hi: 'A/B परीक्षण'
        },
        progression: {
            en: 'Learning Progression',
            hi: 'सीखने की प्रगति'
        },
        gaps: {
            en: 'Curriculum Gaps',
            hi: 'पाठ्यक्रम अंतराल'
        },
        crossSubject: {
            en: 'Cross-Subject Analytics',
            hi: 'क्रॉस-विषय विश्लेषण'
        },
        management: {
            en: 'Management',
            hi: 'प्रबंधन'
        },
        dataUpload: {
            en: 'Data Upload',
            hi: 'डेटा अपलोड'
        },
        database: {
            en: 'Database',
            hi: 'डेटाबेस'
        },
        experiments: {
            en: 'Experiments',
            hi: 'प्रयोग'
        },
        settings: {
            en: 'Settings',
            hi: 'सेटिंग्स'
        }
    },

    // Dashboard Section
    dashboard: {
        title: {
            en: 'Interactive Dashboard',
            hi: 'इंटरैक्टिव डैशबोर्ड'
        },
        subtitle: {
            en: 'Real-time metrics, analytics, and insights for your EduLLM platform',
            hi: 'आपके EduLLM प्लेटफ़ॉर्म के लिए रीयल-टाइम मेट्रिक्स, विश्लेषण और अंतर्दृष्टि'
        },
        refresh: {
            en: 'Refresh Dashboard',
            hi: 'डैशबोर्ड रीफ्रेश करें'
        },
        export: {
            en: 'Export Data',
            hi: 'डेटा निर्यात करें'
        },
        systemHealth: {
            en: 'System Health:',
            hi: 'सिस्टम स्वास्थ्य:'
        },
        excellent: {
            en: 'Excellent',
            hi: 'उत्कृष्ट'
        },
        good: {
            en: 'Good',
            hi: 'अच्छा'
        },
        fair: {
            en: 'Fair',
            hi: 'ठीक'
        },
        uptime: {
            en: 'Uptime',
            hi: 'अपटाइम'
        },
        errors: {
            en: 'Errors',
            hi: 'त्रुटियाँ'
        },
        performance: {
            en: 'Performance',
            hi: 'प्रदर्शन'
        },
        quickChat: {
            en: 'Quick Chat',
            hi: 'त्वरित चैट'
        },
        uploadPDF: {
            en: 'Upload PDF',
            hi: 'PDF अपलोड करें'
        },
        runExperiment: {
            en: 'Run Experiment',
            hi: 'प्रयोग चलाएं'
        },
        quickStart: {
            en: 'Quick Start',
            hi: 'त्वरित प्रारंभ'
        },
        getStarted: {
            en: 'Get started with EduLLM Platform in 3 simple steps:',
            hi: '3 सरल चरणों में EduLLM प्लेटफ़ॉर्म के साथ शुरुआत करें:'
        },
        uploadNCERT: {
            en: 'Upload NCERT Data',
            hi: 'NCERT डेटा अपलोड करें'
        },
        uploadNCERTDesc: {
            en: 'Upload NCERT PDF textbooks to populate the platform',
            hi: 'प्लेटफ़ॉर्म को पॉप्युलेट करने के लिए NCERT PDF पाठ्यपुस्तकें अपलोड करें'
        },
        goToUpload: {
            en: 'Go to Upload',
            hi: 'अपलोड पर जाएं'
        },
        startChatting: {
            en: 'Start Chatting',
            hi: 'चैट शुरू करें'
        },
        startChattingDesc: {
            en: 'Ask questions about the curriculum using RAG chat',
            hi: 'RAG चैट का उपयोग करके पाठ्यक्रम के बारे में प्रश्न पूछें'
        },
        startChat: {
            en: 'Start Chat',
            hi: 'चैट शुरू करें'
        },
        exploreFeatures: {
            en: 'Explore Features',
            hi: 'सुविधाएँ देखें'
        },
        exploreFeaturesDesc: {
            en: 'Explore chunking, knowledge graphs, and more',
            hi: 'चंकिंग, ज्ञान ग्राफ और अधिक देखें'
        },
        viewChunks: {
            en: 'View Chunks',
            hi: 'चंक्स देखें'
        },
        timeRange: {
            today: {
                en: 'Today',
                hi: 'आज'
            },
            week: {
                en: 'This Week',
                hi: 'इस सप्ताह'
            },
            month: {
                en: 'This Month',
                hi: 'इस महीने'
            },
            all: {
                en: 'All Time',
                hi: 'सभी समय'
            }
        },
        documentsIndexed: {
            en: 'Documents Indexed',
            hi: 'अनुक्रमित दस्तावेज़'
        },
        queriesProcessed: {
            en: 'Queries Processed',
            hi: 'प्रोसेस्ड क्वेरी'
        },
        accuracyRate: {
            en: 'Accuracy Rate',
            hi: 'सटीकता दर'
        },
        avgResponseTime: {
            en: 'Avg Response Time',
            hi: 'औसत प्रतिक्रिया समय'
        },
        thisWeek: {
            en: 'this week',
            hi: 'इस सप्ताह'
        },
        chunks: {
            en: 'Chunks',
            hi: 'चंक्स'
        },
        vectors: {
            en: 'Vectors',
            hi: 'वेक्टर'
        },
        size: {
            en: 'Size',
            hi: 'आकार'
        },
        today: {
            en: 'Today',
            hi: 'आज'
        },
        week: {
            en: 'Week',
            hi: 'सप्ताह'
        },
        avgDay: {
            en: 'Avg/Day',
            hi: 'औसत/दिन'
        },
        precision: {
            en: 'Precision',
            hi: 'परिशुद्धता'
        },
        recall: {
            en: 'Recall',
            hi: 'रिकॉल'
        },
        p50: {
            en: 'P50',
            hi: 'P50'
        },
        p95: {
            en: 'P95',
            hi: 'P95'
        },
        p99: {
            en: 'P99',
            hi: 'P99'
        },
        clickForAnalytics: {
            en: 'Click for full analytics',
            hi: 'पूर्ण विश्लेषण के लिए क्लिक करें'
        },
        curriculumCoverage: {
            en: 'Curriculum Coverage',
            hi: 'पाठ्यक्रम कवरेज'
        },
        recentQueries: {
            en: 'Recent Queries',
            hi: 'हाल की क्वेरी'
        },
        topQueries: {
            en: 'Top Queries',
            hi: 'शीर्ष क्वेरी'
        },
        activityFeed: {
            en: 'Activity Feed',
            hi: 'गतिविधि फ़ीड'
        },
        liveIndicator: {
            en: 'LIVE',
            hi: 'लाइव'
        },
        viewAll: {
            en: 'View All',
            hi: 'सभी देखें'
        },
        trending: {
            en: 'Trending',
            hi: 'ट्रेंडिंग'
        },
        clear: {
            en: 'Clear',
            hi: 'साफ़ करें'
        },
        performanceOverTime: {
            en: 'Performance Over Time',
            hi: 'समय के साथ प्रदर्शन'
        },
        subjectDistribution: {
            en: 'Subject Distribution',
            hi: 'विषय वितरण'
        },
        responseTime: {
            en: 'Response Time',
            hi: 'प्रतिक्रिया समय'
        },
        accuracy: {
            en: 'Accuracy',
            hi: 'सटीकता'
        },
        queryVolume: {
            en: 'Query Volume',
            hi: 'क्वेरी वॉल्यूम'
        },
        storageUsage: {
            en: 'Storage Usage',
            hi: 'भंडारण उपयोग'
        },
        systemStatistics: {
            en: 'System Statistics',
            hi: 'सिस्टम आँकड़े'
        },
        online: {
            en: 'Online',
            hi: 'ऑनलाइन'
        },
        databaseObjects: {
            en: 'Database Objects',
            hi: 'डेटाबेस ऑब्जेक्ट्स'
        },
        stores: {
            en: 'stores',
            hi: 'स्टोर'
        },
        totalDocuments: {
            en: 'Total Documents',
            hi: 'कुल दस्तावेज़'
        },
        totalChunks: {
            en: 'Total Chunks',
            hi: 'कुल चंक्स'
        },
        embeddingsGenerated: {
            en: 'Embeddings Generated',
            hi: 'जेनरेट किए गए एंबेडिंग'
        },
        graphConcepts: {
            en: 'Graph Concepts',
            hi: 'ग्राफ अवधारणाएँ'
        },
        activeExperiments: {
            en: 'Active Experiments',
            hi: 'सक्रिय प्रयोग'
        }
    },

    // RAG Chat Section
    ragChat: {
        title: {
            en: 'RAG-Enhanced Chat Interface',
            hi: 'RAG-संवर्धित चैट इंटरफ़ेस'
        },
        subtitle: {
            en: 'Interactive chat with retrieval-augmented generation and source citations',
            hi: 'पुनर्प्राप्ति-संवर्धित जेनरेशन और स्रोत उद्धरणों के साथ इंटरैक्टिव चैट'
        }
    },

    // Smart Chunking Section
    chunking: {
        title: {
            en: 'Smart Chunking Interface',
            hi: 'स्मार्ट चंकिंग इंटरफ़ेस'
        },
        subtitle: {
            en: 'Visualize and optimize document segmentation for better retrieval',
            hi: 'बेहतर पुनर्प्राप्ति के लिए दस्तावेज़ विभाजन को विज़ुअलाइज़ और ऑप्टिमाइज़ करें'
        }
    },

    // Knowledge Graph Section
    knowledgeGraph: {
        title: {
            en: 'Knowledge Graph Visualization',
            hi: 'ज्ञान ग्राफ विज़ुअलाइज़ेशन'
        },
        subtitle: {
            en: 'Explore conceptual relationships and educational pathways',
            hi: 'वैचारिक संबंधों और शैक्षिक मार्गों का अन्वेषण करें'
        }
    },

    // Data Upload Section
    upload: {
        title: {
            en: 'NCERT Data Upload',
            hi: 'NCERT डेटा अपलोड'
        },
        subtitle: {
            en: 'Upload NCERT PDF textbooks to enhance the platform with real curriculum data',
            hi: 'वास्तविक पाठ्यक्रम डेटा के साथ प्लेटफ़ॉर्म को बढ़ाने के लिए NCERT PDF पाठ्यपुस्तकें अपलोड करें'
        }
    },

    // Experiments Section
    experiments: {
        title: {
            en: 'Research Experiments',
            hi: 'अनुसंधान प्रयोग'
        },
        subtitle: {
            en: 'Track and compare RAG system experiments for your research',
            hi: 'अपने अनुसंधान के लिए RAG सिस्टम प्रयोगों को ट्रैक और तुलना करें'
        }
    },

    // Settings Section
    settings: {
        title: {
            en: 'Platform Settings',
            hi: 'प्लेटफ़ॉर्म सेटिंग्स'
        },
        subtitle: {
            en: 'Configure localization, privacy, and research parameters',
            hi: 'स्थानीयकरण, गोपनीयता और अनुसंधान पैरामीटर कॉन्फ़िगर करें'
        }
    },

    // Analytics Section
    analytics: {
        title: {
            en: 'Analytics Dashboard',
            hi: 'विश्लेषण डैशबोर्ड'
        },
        subtitle: {
            en: 'Comprehensive research analytics and insights',
            hi: 'व्यापक अनुसंधान विश्लेषण और अंतर्दृष्टि'
        }
    },

    // Comparisons Section
    comparisons: {
        title: {
            en: 'Baseline Comparisons',
            hi: 'बेसलाइन तुलना'
        },
        subtitle: {
            en: 'Compare different RAG approaches systematically',
            hi: 'विभिन्न RAG दृष्टिकोणों की व्यवस्थित रूप से तुलना करें'
        }
    },

    // A/B Testing Section
    abTesting: {
        title: {
            en: 'A/B Testing',
            hi: 'A/B परीक्षण'
        },
        subtitle: {
            en: 'Run controlled experiments to optimize RAG performance',
            hi: 'RAG प्रदर्शन को अनुकूलित करने के लिए नियंत्रित प्रयोग चलाएं'
        }
    },

    // Database Management Section
    dbManagement: {
        title: {
            en: 'Database Management',
            hi: 'डेटाबेस प्रबंधन'
        },
        subtitle: {
            en: 'Manage backups, monitor health, and control your database',
            hi: 'बैकअप प्रबंधित करें, स्वास्थ्य की निगरानी करें और अपने डेटाबेस को नियंत्रित करें'
        },
        health: {
            title: {
                en: 'Database Health',
                hi: 'डेटाबेस स्वास्थ्य'
            },
            status: {
                en: 'Status',
                hi: 'स्थिति'
            },
            connection: {
                en: 'Connection',
                hi: 'कनेक्शन'
            },
            storage: {
                en: 'Storage',
                hi: 'भंडारण'
            },
            performance: {
                en: 'Performance',
                hi: 'प्रदर्शन'
            },
            healthy: {
                en: 'HEALTHY',
                hi: 'स्वस्थ'
            },
            warning: {
                en: 'WARNING',
                hi: 'चेतावनी'
            },
            critical: {
                en: 'CRITICAL',
                hi: 'गंभीर'
            },
            connected: {
                en: 'Connected',
                hi: 'जुड़ा हुआ'
            },
            disconnected: {
                en: 'Disconnected',
                hi: 'डिस्कनेक्ट'
            },
            active: {
                en: 'Active',
                hi: 'सक्रिय'
            },
            avgQueryTime: {
                en: 'Avg query time',
                hi: 'औसत क्वेरी समय'
            },
            queries: {
                en: 'queries',
                hi: 'क्वेरी'
            },
            refresh: {
                en: 'Refresh',
                hi: 'रीफ्रेश'
            }
        },
        statistics: {
            title: {
                en: 'Database Statistics',
                hi: 'डेटाबेस आँकड़े'
            },
            totalStores: {
                en: 'Total Stores',
                hi: 'कुल स्टोर'
            },
            totalRecords: {
                en: 'Total Records',
                hi: 'कुल रिकॉर्ड'
            },
            cacheHitRate: {
                en: 'Cache Hit Rate',
                hi: 'कैश हिट रेट'
            },
            totalQueries: {
                en: 'Total Queries',
                hi: 'कुल क्वेरी'
            },
            storeName: {
                en: 'Store Name',
                hi: 'स्टोर नाम'
            },
            records: {
                en: 'Records',
                hi: 'रिकॉर्ड'
            },
            indexes: {
                en: 'Indexes',
                hi: 'इंडेक्स'
            },
            actions: {
                en: 'Actions',
                hi: 'क्रियाएँ'
            },
            validate: {
                en: 'Validate',
                hi: 'सत्यापित करें'
            }
        },
        backup: {
            title: {
                en: 'Backup Management',
                hi: 'बैकअप प्रबंधन'
            },
            create: {
                en: 'Create Backup',
                hi: 'बैकअप बनाएं'
            },
            cleanup: {
                en: 'Cleanup Old Backups',
                hi: 'पुराने बैकअप साफ़ करें'
            },
            restore: {
                en: 'Restore',
                hi: 'पुनर्स्थापित करें'
            },
            download: {
                en: 'Download',
                hi: 'डाउनलोड'
            },
            delete: {
                en: 'Delete',
                hi: 'हटाएं'
            },
            stores: {
                en: 'stores',
                hi: 'स्टोर'
            },
            full: {
                en: 'full',
                hi: 'पूर्ण'
            },
            partial: {
                en: 'partial',
                hi: 'आंशिक'
            }
        },
        exportImport: {
            title: {
                en: 'Export & Import',
                hi: 'निर्यात और आयात'
            },
            exportTitle: {
                en: 'Export Database',
                hi: 'डेटाबेस निर्यात करें'
            },
            exportDesc: {
                en: 'Export entire database or specific stores to JSON file.',
                hi: 'संपूर्ण डेटाबेस या विशिष्ट स्टोर को JSON फ़ाइल में निर्यात करें।'
            },
            selectStores: {
                en: 'Select Stores (leave empty for all)',
                hi: 'स्टोर चुनें (सभी के लिए खाली छोड़ें)'
            },
            selectAll: {
                en: 'Select All',
                hi: 'सभी चुनें'
            },
            exportToFile: {
                en: 'Export to File',
                hi: 'फ़ाइल में निर्यात करें'
            },
            importTitle: {
                en: 'Import Database',
                hi: 'डेटाबेस आयात करें'
            },
            importDesc: {
                en: 'Import data from previously exported JSON file.',
                hi: 'पहले निर्यात की गई JSON फ़ाइल से डेटा आयात करें।'
            },
            selectFile: {
                en: 'Select JSON File',
                hi: 'JSON फ़ाइल चुनें'
            },
            clearBeforeImport: {
                en: 'Clear existing data before import',
                hi: 'आयात से पहले मौजूदा डेटा साफ़ करें'
            },
            skipErrors: {
                en: 'Skip errors and continue import',
                hi: 'त्रुटियों को छोड़ें और आयात जारी रखें'
            },
            importFromFile: {
                en: 'Import from File',
                hi: 'फ़ाइल से आयात करें'
            },
            importing: {
                en: 'Importing...',
                hi: 'आयात हो रहा है...'
            }
        },
        advanced: {
            title: {
                en: 'Advanced Operations',
                hi: 'उन्नत संचालन'
            },
            runBenchmark: {
                en: 'Run Benchmark',
                hi: 'बेंचमार्क चलाएं'
            },
            benchmarkDesc: {
                en: 'Test database performance with CRUD operations.',
                hi: 'CRUD संचालन के साथ डेटाबेस प्रदर्शन का परीक्षण करें।'
            },
            runTest: {
                en: 'Run Test',
                hi: 'परीक्षण चलाएं'
            },
            validateData: {
                en: 'Validate Data',
                hi: 'डेटा सत्यापित करें'
            },
            validateDesc: {
                en: 'Check data integrity across all stores.',
                hi: 'सभी स्टोर में डेटा अखंडता जांचें।'
            },
            clearCache: {
                en: 'Clear Cache',
                hi: 'कैश साफ़ करें'
            },
            clearCacheDesc: {
                en: 'Clear in-memory cache to free up memory.',
                hi: 'मेमोरी खाली करने के लिए इन-मेमोरी कैश साफ़ करें।'
            },
            clear: {
                en: 'Clear',
                hi: 'साफ़ करें'
            },
            databaseInfo: {
                en: 'Database Info',
                hi: 'डेटाबेस जानकारी'
            },
            databaseInfoDesc: {
                en: 'View detailed database information.',
                hi: 'विस्तृत डेटाबेस जानकारी देखें।'
            },
            viewInfo: {
                en: 'View Info',
                hi: 'जानकारी देखें'
            }
        },
        danger: {
            title: {
                en: 'Danger Zone',
                hi: 'खतरा क्षेत्र'
            },
            warning: {
                en: 'Warning:',
                hi: 'चेतावनी:'
            },
            warningText: {
                en: 'These operations cannot be undone. Please ensure you have a backup before proceeding.',
                hi: 'इन कार्यों को पूर्ववत नहीं किया जा सकता। कृपया आगे बढ़ने से पहले सुनिश्चित करें कि आपके पास बैकअप है।'
            },
            clearAllData: {
                en: 'Clear All Data',
                hi: 'सभी डेटा साफ़ करें'
            },
            deleteDatabase: {
                en: 'Delete Database',
                hi: 'डेटाबेस हटाएं'
            }
        }
    },

    // Common Buttons & Actions
    common: {
        close: {
            en: 'Close',
            hi: 'बंद करें'
        },
        cancel: {
            en: 'Cancel',
            hi: 'रद्द करें'
        },
        confirm: {
            en: 'Confirm',
            hi: 'पुष्टि करें'
        },
        save: {
            en: 'Save',
            hi: 'सहेजें'
        },
        delete: {
            en: 'Delete',
            hi: 'हटाएं'
        },
        edit: {
            en: 'Edit',
            hi: 'संपादित करें'
        },
        view: {
            en: 'View',
            hi: 'देखें'
        },
        loading: {
            en: 'Loading...',
            hi: 'लोड हो रहा है...'
        },
        success: {
            en: 'Success',
            hi: 'सफलता'
        },
        error: {
            en: 'Error',
            hi: 'त्रुटि'
        },
        warning: {
            en: 'Warning',
            hi: 'चेतावनी'
        }
    },

    // Notifications & Messages
    messages: {
        dbConnected: {
            en: 'Database connected successfully',
            hi: 'डेटाबेस सफलतापूर्वक कनेक्ट हो गया'
        },
        dbDisconnected: {
            en: 'Failed to connect to database',
            hi: 'डेटाबेस से कनेक्ट करने में विफल'
        },
        backupCreated: {
            en: 'Backup created successfully',
            hi: 'बैकअप सफलतापूर्वक बनाया गया'
        },
        backupFailed: {
            en: 'Failed to create backup',
            hi: 'बैकअप बनाने में विफल'
        },
        dataExported: {
            en: 'Database exported successfully',
            hi: 'डेटाबेस सफलतापूर्वक निर्यात किया गया'
        },
        dataImported: {
            en: 'Data imported successfully',
            hi: 'डेटा सफलतापूर्वक आयात किया गया'
        },
        cacheCleared: {
            en: 'Cache cleared successfully',
            hi: 'कैश सफलतापूर्वक साफ़ किया गया'
        }
    },

    // Language Selector
    language: {
        english: {
            en: 'English',
            hi: 'अंग्रेज़ी'
        },
        hindi: {
            en: 'Hindi',
            hi: 'हिंदी'
        },
        bilingual: {
            en: 'Bilingual',
            hi: 'द्विभाषी'
        }
    },

    // OpenAI Integration
    openai: {
        title: {
            en: 'OpenAI Configuration',
            hi: 'OpenAI कॉन्फ़िगरेशन'
        },
        subtitle: {
            en: 'Configure and test OpenAI API integration',
            hi: 'OpenAI API एकीकरण को कॉन्फ़िगर और परीक्षण करें'
        },
        apiKey: {
            en: 'API Key',
            hi: 'API कुंजी'
        },
        setApiKey: {
            en: 'Set API Key',
            hi: 'API कुंजी सेट करें'
        },
        testApiKey: {
            en: 'Test API Key',
            hi: 'API कुंजी परीक्षण करें'
        },
        configured: {
            en: 'Configured',
            hi: 'कॉन्फ़िगर किया गया'
        },
        notConfigured: {
            en: 'Not Configured',
            hi: 'कॉन्फ़िगर नहीं'
        },
        valid: {
            en: 'Valid',
            hi: 'मान्य'
        },
        invalid: {
            en: 'Invalid',
            hi: 'अमान्य'
        },
        testing: {
            en: 'Testing...',
            hi: 'परीक्षण हो रहा है...'
        },
        testResult: {
            en: 'Test Result',
            hi: 'परीक्षण परिणाम'
        },
        modelsAvailable: {
            en: 'Models Available',
            hi: 'उपलब्ध मॉडल'
        },
        chatModels: {
            en: 'Chat Models',
            hi: 'चैट मॉडल'
        },
        embeddingModels: {
            en: 'Embedding Models',
            hi: 'एंबेडिंग मॉडल'
        },
        defaultModel: {
            en: 'Default Model',
            hi: 'डिफ़ॉल्ट मॉडल'
        },
        chatCompletion: {
            en: 'Chat Completion',
            hi: 'चैट पूर्णता'
        },
        embeddings: {
            en: 'Embeddings',
            hi: 'एंबेडिंग'
        },
        createEmbedding: {
            en: 'Create Embedding',
            hi: 'एंबेडिंग बनाएं'
        },
        testChat: {
            en: 'Test Chat',
            hi: 'चैट परीक्षण करें'
        },
        testEmbeddings: {
            en: 'Test Embeddings',
            hi: 'एंबेडिंग परीक्षण करें'
        },
        testRAG: {
            en: 'Test RAG Workflow',
            hi: 'RAG वर्कफ़्लो परीक्षण करें'
        },
        runAllTests: {
            en: 'Run All Tests',
            hi: 'सभी परीक्षण चलाएं'
        },
        testsPassed: {
            en: 'Tests Passed',
            hi: 'परीक्षण पास'
        },
        testsFailed: {
            en: 'Tests Failed',
            hi: 'परीक्षण विफल'
        },
        tokensUsed: {
            en: 'Tokens Used',
            hi: 'उपयोग किए गए टोकन'
        },
        responseTime: {
            en: 'Response Time',
            hi: 'प्रतिक्रिया समय'
        },
        temperature: {
            en: 'Temperature',
            hi: 'तापमान'
        },
        maxTokens: {
            en: 'Max Tokens',
            hi: 'अधिकतम टोकन'
        },
        model: {
            en: 'Model',
            hi: 'मॉडल'
        },
        prompt: {
            en: 'Prompt',
            hi: 'प्रॉम्प्ट'
        },
        response: {
            en: 'Response',
            hi: 'प्रतिक्रिया'
        },
        dimensions: {
            en: 'Dimensions',
            hi: 'आयाम'
        },
        context: {
            en: 'Context',
            hi: 'संदर्भ'
        },
        query: {
            en: 'Query',
            hi: 'क्वेरी'
        }
    },

    // Backend API Integration
    apiIntegration: {
        title: {
            en: 'Backend API Integration',
            hi: 'बैकएंड API एकीकरण'
        },
        subtitle: {
            en: 'Configure and test backend API connection',
            hi: 'बैकएंड API कनेक्शन कॉन्फ़िगर और परीक्षण करें'
        },
        connectionStatus: {
            en: 'Connection Status',
            hi: 'कनेक्शन स्थिति'
        },
        connected: {
            en: 'Connected',
            hi: 'जुड़ा हुआ'
        },
        disconnected: {
            en: 'Disconnected',
            hi: 'डिस्कनेक्ट'
        },
        connecting: {
            en: 'Connecting...',
            hi: 'कनेक्ट हो रहा है...'
        },
        testConnection: {
            en: 'Test Connection',
            hi: 'कनेक्शन परीक्षण करें'
        },
        apiMode: {
            en: 'API Mode',
            hi: 'API मोड'
        },
        localMode: {
            en: 'Local Mode',
            hi: 'लोकल मोड'
        },
        autoMode: {
            en: 'Auto Mode',
            hi: 'ऑटो मोड'
        },
        fallbackEnabled: {
            en: 'Fallback Enabled',
            hi: 'फ़ॉलबैक सक्षम'
        },
        baseURL: {
            en: 'Base URL',
            hi: 'बेस URL'
        },
        apiVersion: {
            en: 'API Version',
            hi: 'API संस्करण'
        },
        healthCheck: {
            en: 'Health Check',
            hi: 'स्वास्थ्य जाँच'
        },
        apiKeySet: {
            en: 'API Key Set',
            hi: 'API कुंजी सेट'
        },
        runTests: {
            en: 'Run Integration Tests',
            hi: 'एकीकरण परीक्षण चलाएं'
        },
        runDemo: {
            en: 'Run Demo Workflow',
            hi: 'डेमो वर्कफ़्लो चलाएं'
        },
        totalTests: {
            en: 'Total Tests',
            hi: 'कुल परीक्षण'
        },
        passRate: {
            en: 'Pass Rate',
            hi: 'पास दर'
        }
    },

    // Research Features
    research: {
        title: {
            en: 'Research Features',
            hi: 'अनुसंधान सुविधाएँ'
        },
        progression: {
            title: {
                en: 'Learning Progression',
                hi: 'सीखने की प्रगति'
            },
            subtitle: {
                en: 'Track student learning journey and concept mastery',
                hi: 'छात्र की सीखने की यात्रा और अवधारणा प्रवीणता को ट्रैक करें'
            },
            studentId: {
                en: 'Student ID',
                hi: 'छात्र आईडी'
            },
            totalInteractions: {
                en: 'Total Interactions',
                hi: 'कुल इंटरैक्शन'
            },
            successRate: {
                en: 'Success Rate',
                hi: 'सफलता दर'
            },
            masteryLevel: {
                en: 'Mastery Level',
                hi: 'प्रवीणता स्तर'
            },
            mastered: {
                en: 'Mastered',
                hi: 'महारत हासिल'
            },
            learning: {
                en: 'Learning',
                hi: 'सीख रहे हैं'
            },
            struggling: {
                en: 'Struggling',
                hi: 'संघर्ष कर रहे हैं'
            },
            conceptName: {
                en: 'Concept Name',
                hi: 'अवधारणा नाम'
            },
            attempts: {
                en: 'Attempts',
                hi: 'प्रयास'
            },
            successes: {
                en: 'Successes',
                hi: 'सफलताएँ'
            }
        },
        gaps: {
            title: {
                en: 'Curriculum Gap Analysis',
                hi: 'पाठ्यक्रम अंतर विश्लेषण'
            },
            subtitle: {
                en: 'Identify and address learning gaps in curriculum',
                hi: 'पाठ्यक्रम में सीखने के अंतराल की पहचान करें और समाधान करें'
            },
            totalGaps: {
                en: 'Total Gaps',
                hi: 'कुल अंतराल'
            },
            criticalGaps: {
                en: 'Critical Gaps',
                hi: 'गंभीर अंतराल'
            },
            moderateGaps: {
                en: 'Moderate Gaps',
                hi: 'मध्यम अंतराल'
            },
            minorGaps: {
                en: 'Minor Gaps',
                hi: 'छोटे अंतराल'
            },
            gapType: {
                en: 'Gap Type',
                hi: 'अंतराल प्रकार'
            },
            severity: {
                en: 'Severity',
                hi: 'गंभीरता'
            },
            recommendations: {
                en: 'Recommendations',
                hi: 'सिफारिशें'
            }
        },
        crossSubject: {
            title: {
                en: 'Cross-Subject Analysis',
                hi: 'क्रॉस-विषय विश्लेषण'
            },
            subtitle: {
                en: 'Analyze performance patterns across multiple subjects',
                hi: 'कई विषयों में प्रदर्शन पैटर्न का विश्लेषण करें'
            },
            subjects: {
                en: 'Subjects',
                hi: 'विषय'
            },
            averagePerformance: {
                en: 'Average Performance',
                hi: 'औसत प्रदर्शन'
            },
            strongAreas: {
                en: 'Strong Areas',
                hi: 'मजबूत क्षेत्र'
            },
            weakAreas: {
                en: 'Weak Areas',
                hi: 'कमजोर क्षेत्र'
            },
            correlations: {
                en: 'Correlations',
                hi: 'सहसंबंध'
            }
        }
    },

    // Vector Database
    vectorDB: {
        title: {
            en: 'Vector Database',
            hi: 'वेक्टर डेटाबेस'
        },
        collections: {
            en: 'Collections',
            hi: 'संग्रह'
        },
        documents: {
            en: 'Documents',
            hi: 'दस्तावेज़'
        },
        createCollection: {
            en: 'Create Collection',
            hi: 'संग्रह बनाएं'
        },
        collectionName: {
            en: 'Collection Name',
            hi: 'संग्रह नाम'
        },
        description: {
            en: 'Description',
            hi: 'विवरण'
        },
        addDocuments: {
            en: 'Add Documents',
            hi: 'दस्तावेज़ जोड़ें'
        },
        queryCollection: {
            en: 'Query Collection',
            hi: 'संग्रह क्वेरी करें'
        },
        searchQuery: {
            en: 'Search Query',
            hi: 'खोज क्वेरी'
        },
        topResults: {
            en: 'Top Results',
            hi: 'शीर्ष परिणाम'
        },
        similarity: {
            en: 'Similarity',
            hi: 'समानता'
        },
        metadata: {
            en: 'Metadata',
            hi: 'मेटाडेटा'
        },
        text: {
            en: 'Text',
            hi: 'टेक्स्ट'
        },
        embedding: {
            en: 'Embedding',
            hi: 'एंबेडिंग'
        },
        vectorDimensions: {
            en: 'Vector Dimensions',
            hi: 'वेक्टर आयाम'
        }
    },

    // Testing & Demo
    testing: {
        title: {
            en: 'Testing & Demo',
            hi: 'परीक्षण और डेमो'
        },
        integrationTests: {
            en: 'Integration Tests',
            hi: 'एकीकरण परीक्षण'
        },
        demoWorkflow: {
            en: 'Demo Workflow',
            hi: 'डेमो वर्कफ़्लो'
        },
        testSuite: {
            en: 'Test Suite',
            hi: 'परीक्षण सूट'
        },
        runningTests: {
            en: 'Running Tests...',
            hi: 'परीक्षण चल रहे हैं...'
        },
        testComplete: {
            en: 'Test Complete',
            hi: 'परीक्षण पूर्ण'
        },
        allTestsPassed: {
            en: 'All Tests Passed',
            hi: 'सभी परीक्षण पास'
        },
        someTestsFailed: {
            en: 'Some Tests Failed',
            hi: 'कुछ परीक्षण विफल'
        },
        generateTestData: {
            en: 'Generate Test Data',
            hi: 'परीक्षण डेटा जेनरेट करें'
        },
        testDataGenerated: {
            en: 'Test Data Generated',
            hi: 'परीक्षण डेटा जेनरेट किया गया'
        },
        clearTestData: {
            en: 'Clear Test Data',
            hi: 'परीक्षण डेटा साफ़ करें'
        }
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = translations;
}

console.log('📚 Translations loaded: English, Hindi, Bilingual support enabled');
