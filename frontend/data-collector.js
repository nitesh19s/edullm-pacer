// NCERT Data Collection and Processing System
class NCERTDataCollector {
    constructor() {
        this.baseUrl = 'https://ncert.nic.in';
        this.textbookData = {};
        this.processedContent = {};
        this.curriculum = this.initializeCurriculumStructure();
    }

    initializeCurriculumStructure() {
        return {
            mathematics: {
                9: {
                    chapters: [
                        'Number Systems',
                        'Polynomials',
                        'Coordinate Geometry',
                        'Linear Equations in Two Variables',
                        'Introduction to Euclid\'s Geometry',
                        'Lines and Angles',
                        'Triangles',
                        'Quadrilaterals',
                        'Areas of Parallelograms and Triangles',
                        'Circles',
                        'Constructions',
                        'Heron\'s Formula',
                        'Surface Areas and Volumes',
                        'Statistics',
                        'Probability'
                    ]
                },
                10: {
                    chapters: [
                        'Real Numbers',
                        'Polynomials',
                        'Pair of Linear Equations in Two Variables',
                        'Quadratic Equations',
                        'Arithmetic Progressions',
                        'Triangles',
                        'Coordinate Geometry',
                        'Introduction to Trigonometry',
                        'Some Applications of Trigonometry',
                        'Circles',
                        'Constructions',
                        'Areas Related to Circles',
                        'Surface Areas and Volumes',
                        'Statistics',
                        'Probability'
                    ]
                },
                11: {
                    chapters: [
                        'Sets',
                        'Relations and Functions',
                        'Trigonometric Functions',
                        'Principle of Mathematical Induction',
                        'Complex Numbers and Quadratic Equations',
                        'Linear Inequalities',
                        'Permutations and Combinations',
                        'Binomial Theorem',
                        'Sequences and Series',
                        'Straight Lines',
                        'Conic Sections',
                        'Introduction to Three Dimensional Geometry',
                        'Limits and Derivatives',
                        'Mathematical Reasoning',
                        'Statistics',
                        'Probability'
                    ]
                },
                12: {
                    chapters: [
                        'Relations and Functions',
                        'Inverse Trigonometric Functions',
                        'Matrices',
                        'Determinants',
                        'Continuity and Differentiability',
                        'Application of Derivatives',
                        'Integrals',
                        'Application of Integrals',
                        'Differential Equations',
                        'Vector Algebra',
                        'Three Dimensional Geometry',
                        'Linear Programming',
                        'Probability'
                    ]
                }
            },
            physics: {
                11: {
                    chapters: [
                        'Physical World',
                        'Units and Measurements',
                        'Motion in a Straight Line',
                        'Motion in a Plane',
                        'Laws of Motion',
                        'Work, Energy and Power',
                        'System of Particles and Rotational Motion',
                        'Gravitation',
                        'Mechanical Properties of Solids',
                        'Mechanical Properties of Fluids',
                        'Thermal Properties of Matter',
                        'Thermodynamics',
                        'Kinetic Theory',
                        'Oscillations',
                        'Waves'
                    ]
                },
                12: {
                    chapters: [
                        'Electric Charges and Fields',
                        'Electrostatic Potential and Capacitance',
                        'Current Electricity',
                        'Moving Charges and Magnetism',
                        'Magnetism and Matter',
                        'Electromagnetic Induction',
                        'Alternating Current',
                        'Electromagnetic Waves',
                        'Ray Optics and Optical Instruments',
                        'Wave Optics',
                        'Dual Nature of Radiation and Matter',
                        'Atoms',
                        'Nuclei',
                        'Semiconductor Electronics'
                    ]
                }
            },
            chemistry: {
                11: {
                    chapters: [
                        'Some Basic Concepts of Chemistry',
                        'Structure of Atom',
                        'Classification of Elements and Periodicity in Properties',
                        'Chemical Bonding and Molecular Structure',
                        'States of Matter',
                        'Thermodynamics',
                        'Equilibrium',
                        'Redox Reactions',
                        'Hydrogen',
                        'The s-Block Elements',
                        'The p-Block Elements',
                        'Organic Chemistry - Some Basic Principles and Techniques',
                        'Hydrocarbons',
                        'Environmental Chemistry'
                    ]
                },
                12: {
                    chapters: [
                        'The Solid State',
                        'Solutions',
                        'Electrochemistry',
                        'Chemical Kinetics',
                        'Surface Chemistry',
                        'General Principles and Processes of Isolation of Elements',
                        'The p-Block Elements',
                        'The d and f Block Elements',
                        'Coordination Compounds',
                        'Haloalkanes and Haloarenes',
                        'Alcohols, Phenols and Ethers',
                        'Aldehydes, Ketones and Carboxylic Acids',
                        'Amines',
                        'Biomolecules',
                        'Polymers',
                        'Chemistry in Everyday Life'
                    ]
                }
            },
            biology: {
                11: {
                    chapters: [
                        'The Living World',
                        'Biological Classification',
                        'Plant Kingdom',
                        'Animal Kingdom',
                        'Morphology of Flowering Plants',
                        'Anatomy of Flowering Plants',
                        'Structural Organisation in Animals',
                        'Cell: The Unit of Life',
                        'Biomolecules',
                        'Cell Cycle and Cell Division',
                        'Transport in Plants',
                        'Mineral Nutrition',
                        'Photosynthesis in Higher Plants',
                        'Respiration in Plants',
                        'Plant Growth and Development',
                        'Digestion and Absorption',
                        'Breathing and Exchange of Gases',
                        'Body Fluids and Circulation',
                        'Excretory Products and their Elimination',
                        'Locomotion and Movement',
                        'Neural Control and Coordination',
                        'Chemical Coordination and Integration'
                    ]
                },
                12: {
                    chapters: [
                        'Reproduction in Organisms',
                        'Sexual Reproduction in Flowering Plants',
                        'Human Reproduction',
                        'Reproductive Health',
                        'Principles of Inheritance and Variation',
                        'Molecular Basis of Inheritance',
                        'Evolution',
                        'Human Health and Disease',
                        'Strategies for Enhancement in Food Production',
                        'Microbes in Human Welfare',
                        'Biotechnology: Principles and Processes',
                        'Biotechnology and its Applications',
                        'Organisms and Populations',
                        'Ecosystem',
                        'Biodiversity and Conservation',
                        'Environmental Issues'
                    ]
                }
            }
        };
    }

    // Simulate data collection from NCERT PDFs
    async collectNCERTData() {
        console.log('Starting NCERT data collection...');
        
        // Since we cannot directly download PDFs, we'll create a comprehensive sample dataset
        // based on the actual NCERT curriculum structure
        this.textbookData = await this.generateSampleTextbookContent();
        
        console.log('NCERT data collection completed');
        return this.textbookData;
    }

    async generateSampleTextbookContent() {
        const content = {};
        
        for (const [subject, grades] of Object.entries(this.curriculum)) {
            content[subject] = {};
            
            for (const [grade, gradeData] of Object.entries(grades)) {
                content[subject][grade] = {
                    chapters: await this.generateChapterContent(subject, grade, gradeData.chapters),
                    metadata: {
                        grade: grade,
                        subject: subject,
                        board: 'NCERT',
                        language: 'English',
                        year: '2024-25'
                    }
                };
            }
        }
        
        return content;
    }

    async generateChapterContent(subject, grade, chapters) {
        const chapterContent = {};
        
        for (const chapter of chapters) {
            chapterContent[chapter] = {
                title: chapter,
                content: await this.getChapterContent(subject, grade, chapter),
                keyTopics: this.extractKeyTopics(subject, chapter),
                learningObjectives: this.generateLearningObjectives(subject, chapter),
                exercises: this.generateExercises(subject, chapter),
                vocabulary: this.extractVocabulary(subject, chapter)
            };
        }
        
        return chapterContent;
    }

    async getChapterContent(subject, grade, chapter) {
        // This would ideally extract text from actual NCERT PDFs
        // For now, we'll provide representative content samples
        
        const contentSamples = {
            mathematics: {
                'Quadratic Equations': `
                    A quadratic equation in the variable x is an equation of the form ax² + bx + c = 0, 
                    where a, b, c are real numbers and a ≠ 0. The values of the variable x which satisfy 
                    the equation are called roots or solutions of the quadratic equation.
                    
                    Methods of solving quadratic equations:
                    1. Factorization method
                    2. Completing the square method
                    3. Using quadratic formula: x = (-b ± √(b² - 4ac)) / 2a
                    
                    The discriminant D = b² - 4ac determines the nature of roots:
                    - If D > 0, the equation has two distinct real roots
                    - If D = 0, the equation has two equal real roots
                    - If D < 0, the equation has no real roots
                `,
                'Real Numbers': `
                    Real numbers include all rational and irrational numbers. Rational numbers can be 
                    expressed as p/q where p and q are integers and q ≠ 0. Irrational numbers cannot 
                    be expressed in the form p/q.
                    
                    Euclid's Division Lemma: Given positive integers a and b, there exist unique integers 
                    q and r such that a = bq + r, where 0 ≤ r < b.
                    
                    Fundamental Theorem of Arithmetic: Every composite number can be expressed as a 
                    product of primes, and this factorization is unique.
                `,
                'Sets': `
                    A set is a well-defined collection of objects. These objects are called elements 
                    or members of the set. Sets are usually denoted by capital letters A, B, C, etc.
                    
                    Types of sets:
                    1. Empty set (∅): A set with no elements
                    2. Finite set: A set with finite number of elements  
                    3. Infinite set: A set with infinite number of elements
                    4. Universal set: The set containing all elements under consideration
                    
                    Set operations include union (∪), intersection (∩), and complement.
                `
            },
            physics: {
                'Electric Charges and Fields': `
                    Electric charge is a fundamental property of matter. There are two types of charges:
                    positive and negative. Like charges repel each other, unlike charges attract.
                    
                    Coulomb's Law: The force between two point charges is given by:
                    F = k(q₁q₂)/r²
                    where k = 1/(4πε₀) = 9 × 10⁹ N⋅m²/C²
                    
                    Electric field is defined as the force per unit positive charge:
                    E = F/q = kQ/r²
                    
                    Gauss's Law: The electric flux through any closed surface is proportional to 
                    the net charge enclosed: ∮E⋅dA = Q/ε₀
                `,
                'Thermodynamics': `
                    Thermodynamics deals with the study of heat, work, temperature, and energy.
                    
                    First Law of Thermodynamics: Energy cannot be created or destroyed, only 
                    transformed from one form to another. ΔU = Q - W
                    
                    Second Law of Thermodynamics: Heat cannot spontaneously flow from a colder 
                    to a hotter body. The entropy of an isolated system always increases.
                    
                    Heat engines convert thermal energy into mechanical work with efficiency 
                    η = W/Q₁ = 1 - Q₂/Q₁
                `,
                'Waves': `
                    A wave is a disturbance that travels through space and time, transferring energy 
                    without transferring matter. Waves can be classified as:
                    1. Mechanical waves (require a medium)
                    2. Electromagnetic waves (do not require a medium)
                    
                    Wave equation: v = fλ where v is velocity, f is frequency, λ is wavelength
                    
                    Properties of waves include reflection, refraction, interference, and diffraction.
                `
            },
            chemistry: {
                'Structure of Atom': `
                    The atom consists of a nucleus containing protons and neutrons, surrounded by 
                    electrons in orbitals. The atomic number (Z) equals the number of protons.
                    
                    Bohr's Model: Electrons revolve around the nucleus in fixed orbits with 
                    quantized energy levels. E = -13.6/n² eV for hydrogen atom.
                    
                    Quantum mechanical model describes electrons as waves with probability 
                    distributions called orbitals (s, p, d, f).
                    
                    Electronic configuration follows Aufbau principle, Pauli exclusion principle, 
                    and Hund's rule.
                `,
                'Chemical Bonding': `
                    Chemical bonds form when atoms combine to achieve stable electronic configuration.
                    
                    Types of bonds:
                    1. Ionic bonds: Transfer of electrons between metal and non-metal
                    2. Covalent bonds: Sharing of electrons between non-metals
                    3. Metallic bonds: Delocalized electrons in metals
                    
                    VSEPR theory predicts molecular geometry based on electron pair repulsion.
                    Hybridization explains bonding in molecules (sp³, sp², sp).
                `,
                'Organic Chemistry': `
                    Organic chemistry studies carbon compounds. Carbon forms four covalent bonds 
                    and can form chains, rings, and complex structures.
                    
                    Functional groups determine chemical properties:
                    - Alcohols (-OH)
                    - Aldehydes (-CHO)  
                    - Ketones (C=O)
                    - Carboxylic acids (-COOH)
                    
                    Isomerism: Compounds with same molecular formula but different structures.
                    Types include structural isomerism and stereoisomerism.
                `
            },
            biology: {
                'Cell: The Unit of Life': `
                    The cell is the basic structural and functional unit of life. All living organisms 
                    are composed of cells.
                    
                    Types of cells:
                    1. Prokaryotic cells: No membrane-bound nucleus (bacteria)
                    2. Eukaryotic cells: Membrane-bound nucleus and organelles
                    
                    Cell organelles include nucleus, mitochondria, endoplasmic reticulum, 
                    Golgi apparatus, ribosomes, lysosomes, and chloroplasts (in plants).
                    
                    Cell membrane is selectively permeable and controls entry/exit of substances.
                `,
                'Photosynthesis': `
                    Photosynthesis is the process by which plants convert light energy into chemical 
                    energy. Overall equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂
                    
                    Two stages:
                    1. Light-dependent reactions (photo phase): Occur in thylakoids
                    2. Light-independent reactions (dark phase/Calvin cycle): Occur in stroma
                    
                    Chlorophyll absorbs light energy and converts CO₂ and H₂O into glucose.
                    Factors affecting photosynthesis: light intensity, CO₂ concentration, temperature.
                `,
                'Genetics': `
                    Genetics is the study of heredity and variation. Genes are units of inheritance 
                    located on chromosomes.
                    
                    Mendel's Laws:
                    1. Law of dominance
                    2. Law of segregation  
                    3. Law of independent assortment
                    
                    DNA structure: Double helix with complementary base pairs (A-T, G-C).
                    Central dogma: DNA → RNA → Protein
                    
                    Genetic disorders can be caused by gene mutations or chromosomal abnormalities.
                `
            }
        };
        
        return contentSamples[subject]?.[chapter] || `Content for ${chapter} in ${subject} Grade ${grade}. This chapter covers fundamental concepts and principles related to ${chapter.toLowerCase()}.`;
    }

    extractKeyTopics(subject, chapter) {
        const topicMaps = {
            mathematics: {
                'Quadratic Equations': ['Quadratic formula', 'Discriminant', 'Nature of roots', 'Factorization', 'Completing the square'],
                'Real Numbers': ['Rational numbers', 'Irrational numbers', 'Euclid\'s division lemma', 'Fundamental theorem of arithmetic', 'HCF and LCM'],
                'Sets': ['Set notation', 'Types of sets', 'Set operations', 'Venn diagrams', 'De Morgan\'s laws']
            },
            physics: {
                'Electric Charges and Fields': ['Coulomb\'s law', 'Electric field', 'Gauss\'s law', 'Electric potential', 'Capacitance'],
                'Thermodynamics': ['First law', 'Second law', 'Heat engines', 'Entropy', 'Carnot cycle'],
                'Waves': ['Wave equation', 'Interference', 'Diffraction', 'Standing waves', 'Doppler effect']
            },
            chemistry: {
                'Structure of Atom': ['Atomic models', 'Quantum numbers', 'Electronic configuration', 'Periodic trends'],
                'Chemical Bonding': ['Ionic bonding', 'Covalent bonding', 'VSEPR theory', 'Hybridization', 'Molecular orbitals'],
                'Organic Chemistry': ['Functional groups', 'Isomerism', 'Nomenclature', 'Reaction mechanisms']
            },
            biology: {
                'Cell: The Unit of Life': ['Cell theory', 'Cell organelles', 'Cell membrane', 'Prokaryotes vs eukaryotes'],
                'Photosynthesis': ['Light reactions', 'Calvin cycle', 'Chloroplast structure', 'Factors affecting photosynthesis'],
                'Genetics': ['Mendel\'s laws', 'DNA structure', 'Gene expression', 'Genetic disorders']
            }
        };
        
        return topicMaps[subject]?.[chapter] || ['Key concepts', 'Principles', 'Applications', 'Problem solving'];
    }

    generateLearningObjectives(subject, chapter) {
        return [
            `Understand the fundamental concepts of ${chapter}`,
            `Apply ${chapter} principles to solve problems`,
            `Analyze real-world applications of ${chapter}`,
            `Evaluate different approaches to ${chapter} problems`
        ];
    }

    generateExercises(subject, chapter) {
        const exercises = [];
        for (let i = 1; i <= 10; i++) {
            exercises.push({
                question: `Exercise ${i}: Problem related to ${chapter}`,
                difficulty: i <= 3 ? 'Easy' : i <= 7 ? 'Medium' : 'Hard',
                type: i % 2 === 0 ? 'Numerical' : 'Conceptual'
            });
        }
        return exercises;
    }

    extractVocabulary(subject, chapter) {
        const vocabularyMaps = {
            mathematics: {
                'Quadratic Equations': ['Coefficient', 'Discriminant', 'Root', 'Parabola', 'Vertex'],
                'Real Numbers': ['Rational', 'Irrational', 'Prime', 'Composite', 'Algorithm']
            },
            physics: {
                'Electric Charges and Fields': ['Charge', 'Field', 'Potential', 'Flux', 'Permittivity'],
                'Thermodynamics': ['Heat', 'Work', 'Energy', 'Entropy', 'Efficiency']
            },
            chemistry: {
                'Structure of Atom': ['Orbital', 'Quantum', 'Electron', 'Nucleus', 'Isotope'],
                'Chemical Bonding': ['Covalent', 'Ionic', 'Hybridization', 'Resonance', 'Polarity']
            },
            biology: {
                'Cell: The Unit of Life': ['Organelle', 'Membrane', 'Nucleus', 'Cytoplasm', 'Mitochondria'],
                'Photosynthesis': ['Chlorophyll', 'Stroma', 'Thylakoid', 'ATP', 'NADPH']
            }
        };
        
        return vocabularyMaps[subject]?.[chapter] || ['Term1', 'Term2', 'Term3', 'Term4', 'Term5'];
    }

    // Process collected data for the EduLLM platform
    processDataForPlatform() {
        const processedData = {
            subjects: Object.keys(this.textbookData),
            totalChapters: 0,
            searchIndex: {},
            conceptGraph: {},
            chunks: []
        };

        for (const [subject, grades] of Object.entries(this.textbookData)) {
            for (const [grade, gradeData] of Object.entries(grades)) {
                for (const [chapterName, chapterData] of Object.entries(gradeData.chapters)) {
                    processedData.totalChapters++;
                    
                    // Create search index
                    const searchKey = `${subject}_${grade}_${chapterName}`.toLowerCase().replace(/\s+/g, '_');
                    processedData.searchIndex[searchKey] = {
                        subject,
                        grade,
                        chapter: chapterName,
                        content: chapterData.content,
                        keyTopics: chapterData.keyTopics,
                        vocabulary: chapterData.vocabulary
                    };
                    
                    // Create chunks for RAG
                    const chunks = this.createChunks(chapterData.content, subject, grade, chapterName);
                    processedData.chunks.push(...chunks);
                    
                    // Build concept graph
                    this.buildConceptGraph(processedData.conceptGraph, subject, chapterName, chapterData.keyTopics);
                }
            }
        }

        return processedData;
    }

    createChunks(content, subject, grade, chapter, chunkSize = 500) {
        const chunks = [];
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        let currentChunk = '';
        let chunkIndex = 0;
        
        for (const sentence of sentences) {
            if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
                chunks.push({
                    id: `${subject}_${grade}_${chapter}_chunk_${chunkIndex}`,
                    content: currentChunk.trim(),
                    metadata: {
                        subject,
                        grade,
                        chapter,
                        source: `NCERT ${subject} Grade ${grade}`,
                        chunkIndex
                    }
                });
                currentChunk = sentence;
                chunkIndex++;
            } else {
                currentChunk += sentence + '.';
            }
        }
        
        if (currentChunk.trim().length > 0) {
            chunks.push({
                id: `${subject}_${grade}_${chapter}_chunk_${chunkIndex}`,
                content: currentChunk.trim(),
                metadata: {
                    subject,
                    grade,
                    chapter,
                    source: `NCERT ${subject} Grade ${grade}`,
                    chunkIndex
                }
            });
        }
        
        return chunks;
    }

    buildConceptGraph(graph, subject, chapter, keyTopics) {
        if (!graph[subject]) {
            graph[subject] = {};
        }
        
        graph[subject][chapter] = {
            topics: keyTopics,
            connections: this.findRelatedConcepts(subject, chapter, keyTopics)
        };
    }

    findRelatedConcepts(subject, chapter, keyTopics) {
        // This would ideally use NLP to find semantic relationships
        // For now, we'll use predefined relationships
        const connections = [];
        
        if (subject === 'mathematics') {
            if (chapter.includes('Equation')) {
                connections.push('Algebra', 'Polynomials', 'Coordinate Geometry');
            }
            if (chapter.includes('Geometry')) {
                connections.push('Triangles', 'Circles', 'Coordinate Geometry');
            }
        } else if (subject === 'physics') {
            if (chapter.includes('Electric')) {
                connections.push('Magnetism', 'Current Electricity', 'Electromagnetic Induction');
            }
            if (chapter.includes('Wave')) {
                connections.push('Oscillations', 'Optics', 'Sound');
            }
        }
        
        return connections;
    }

    // Save processed data
    saveProcessedData(processedData) {
        try {
            localStorage.setItem('ncertProcessedData', JSON.stringify(processedData));
            console.log('NCERT data saved to localStorage');
            return true;
        } catch (error) {
            console.error('Error saving NCERT data:', error);
            return false;
        }
    }

    // Load processed data
    loadProcessedData() {
        try {
            const data = localStorage.getItem('ncertProcessedData');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading NCERT data:', error);
            return null;
        }
    }

    // Get statistics about collected data
    getDataStatistics() {
        const processedData = this.processDataForPlatform();
        return {
            totalSubjects: processedData.subjects.length,
            totalChapters: processedData.totalChapters,
            totalChunks: processedData.chunks.length,
            averageChunkSize: processedData.chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / processedData.chunks.length,
            subjectDistribution: this.getSubjectDistribution(processedData)
        };
    }

    getSubjectDistribution(processedData) {
        const distribution = {};
        for (const chunk of processedData.chunks) {
            distribution[chunk.metadata.subject] = (distribution[chunk.metadata.subject] || 0) + 1;
        }
        return distribution;
    }
}

// Export for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NCERTDataCollector;
}

// Global instance for browser usage
if (typeof window !== 'undefined') {
    window.NCERTDataCollector = NCERTDataCollector;
}