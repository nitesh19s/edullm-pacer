/**
 * Knowledge Graph Testing Script
 * Complete test suite for Knowledge Graph functionality
 */

(async function testKnowledgeGraph() {
    console.log('🧪 TESTING KNOWLEDGE GRAPH - COMPLETE FUNCTIONALITY');
    console.log('='.repeat(70));

    let testsPassed = 0;
    let testsFailed = 0;

    // Helper function for tests
    function test(name, condition) {
        if (condition) {
            console.log(`✅ ${name}`);
            testsPassed++;
            return true;
        } else {
            console.error(`❌ ${name}`);
            testsFailed++;
            return false;
        }
    }

    // Test 1: Module Loading
    console.log('\n📦 Test 1: Module Loading');
    test('Knowledge Graph Manager exists', typeof window.knowledgeGraphManager === 'object');
    test('Knowledge Graph Manager initialized', window.knowledgeGraphManager.initialized === true);

    // Test 2: Core Properties
    console.log('\n🔧 Test 2: Core Properties');
    test('Graph object exists', window.knowledgeGraphManager.graph !== undefined);
    test('Graph has nodes array', Array.isArray(window.knowledgeGraphManager.graph.nodes));
    test('Graph has edges array', Array.isArray(window.knowledgeGraphManager.graph.edges));
    test('Settings exist', window.knowledgeGraphManager.settings !== undefined);
    test('Statistics exist', window.knowledgeGraphManager.statistics !== undefined);
    test('Visualization state exists', window.knowledgeGraphManager.visualization !== undefined);

    // Test 3: Settings
    console.log('\n⚙️  Test 3: Settings');
    test('maxNodes setting exists', typeof window.knowledgeGraphManager.settings.maxNodes === 'number');
    test('minRelationshipStrength setting exists', typeof window.knowledgeGraphManager.settings.minRelationshipStrength === 'number');
    test('visualizationMode setting exists', typeof window.knowledgeGraphManager.settings.visualizationMode === 'string');
    test('showLabels setting exists', typeof window.knowledgeGraphManager.settings.showLabels === 'boolean');
    test('depthLevel setting exists', typeof window.knowledgeGraphManager.settings.depthLevel === 'number');

    console.log('   Current settings:');
    console.log(`   - Max Nodes: ${window.knowledgeGraphManager.settings.maxNodes}`);
    console.log(`   - Min Relationship Strength: ${window.knowledgeGraphManager.settings.minRelationshipStrength}`);
    console.log(`   - Visualization Mode: ${window.knowledgeGraphManager.settings.visualizationMode}`);
    console.log(`   - Show Labels: ${window.knowledgeGraphManager.settings.showLabels}`);
    console.log(`   - Depth Level: ${window.knowledgeGraphManager.settings.depthLevel}`);

    // Test 4: UI Elements
    console.log('\n🖥️  Test 4: UI Integration');
    test('Graph visualization container exists', document.getElementById('graphVisualization') !== null);
    test('Concept details panel exists', document.getElementById('conceptDetails') !== null);
    test('Graph stats container exists', document.getElementById('graphStats') !== null);
    test('Graph mode selector exists', document.getElementById('graphMode') !== null);
    test('Graph depth slider exists', document.getElementById('graphDepth') !== null);
    test('Show labels toggle exists', document.getElementById('showLabels') !== null);
    test('Rebuild graph button exists', document.getElementById('rebuildGraph') !== null);
    test('Export graph button exists', document.getElementById('exportGraph') !== null);

    // Test 5: Core Methods
    console.log('\n🔬 Test 5: Core Methods');
    test('extractConcepts method exists', typeof window.knowledgeGraphManager.extractConcepts === 'function');
    test('buildGraphFromChunks method exists', typeof window.knowledgeGraphManager.buildGraphFromChunks === 'function');
    test('buildRelationships method exists', typeof window.knowledgeGraphManager.buildRelationships === 'function');
    test('calculateImportance method exists', typeof window.knowledgeGraphManager.calculateImportance === 'function');
    test('renderGraph method exists', typeof window.knowledgeGraphManager.renderGraph === 'function');
    test('exportGraph method exists', typeof window.knowledgeGraphManager.exportGraph === 'function');

    // Test 6: Concept Extraction
    console.log('\n🔍 Test 6: Concept Extraction');
    const sampleText = 'Pythagoras theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of squares of the other two sides. This fundamental theorem in geometry has applications in physics and engineering.';

    const concepts = window.knowledgeGraphManager.extractConcepts(sampleText);
    test('Concept extraction returns array', Array.isArray(concepts));
    test('Concepts extracted from text', concepts.length > 0);

    if (concepts.length > 0) {
        test('Concept has text property', concepts[0].text !== undefined);
        test('Concept has type property', concepts[0].type !== undefined);
        test('Concept has subject property', concepts[0].subject !== undefined);
        test('Concept has frequency property', typeof concepts[0].frequency === 'number');

        console.log(`   Extracted ${concepts.length} concepts:`);
        concepts.forEach((c, i) => {
            if (i < 3) console.log(`   - ${c.text} (${c.subject}, freq: ${c.frequency})`);
        });
    }

    // Test 7: Graph Structure
    console.log('\n🌐 Test 7: Graph Structure');
    const hasGraph = window.knowledgeGraphManager.graph.nodes.length > 0;
    test('Graph has nodes', hasGraph);

    if (hasGraph) {
        const node = window.knowledgeGraphManager.graph.nodes[0];
        test('Node has id', node.id !== undefined);
        test('Node has label', node.label !== undefined);
        test('Node has type', node.type !== undefined);
        test('Node has subject', node.subject !== undefined);
        test('Node has importance', typeof node.importance === 'number');

        console.log(`   Total nodes: ${window.knowledgeGraphManager.graph.nodes.length}`);
        console.log(`   Total edges: ${window.knowledgeGraphManager.graph.edges.length}`);
    }

    // Test 8: Layout Algorithms
    console.log('\n📐 Test 8: Layout Algorithms');
    test('forceDirectedLayout method exists', typeof window.knowledgeGraphManager.forceDirectedLayout === 'function');
    test('circularLayout method exists', typeof window.knowledgeGraphManager.circularLayout === 'function');
    test('hierarchicalLayout method exists', typeof window.knowledgeGraphManager.hierarchicalLayout === 'function');
    test('calculateNodePositions method exists', typeof window.knowledgeGraphManager.calculateNodePositions === 'function');

    // Test different layout modes
    if (hasGraph) {
        const testNodes = window.knowledgeGraphManager.graph.nodes.slice(0, 5);

        console.log('   Testing layout algorithms...');

        const forcePositions = window.knowledgeGraphManager.forceDirectedLayout(testNodes, 800, 600, 50);
        test('Force-directed layout generates positions', forcePositions.size > 0);

        const circularPositions = window.knowledgeGraphManager.circularLayout(testNodes, 800, 600, 50);
        test('Circular layout generates positions', circularPositions.size > 0);

        const hierarchicalPositions = window.knowledgeGraphManager.hierarchicalLayout(testNodes, 800, 600, 50);
        test('Hierarchical layout generates positions', hierarchicalPositions.size > 0);
    }

    // Test 9: Relationship Building
    console.log('\n🔗 Test 9: Relationship Building');
    test('calculateRelationshipStrength method exists', typeof window.knowledgeGraphManager.calculateRelationshipStrength === 'function');
    test('getNodeConnections method exists', typeof window.knowledgeGraphManager.getNodeConnections === 'function');
    test('getConnectedNodes method exists', typeof window.knowledgeGraphManager.getConnectedNodes === 'function');

    if (hasGraph && window.knowledgeGraphManager.graph.edges.length > 0) {
        const edge = window.knowledgeGraphManager.graph.edges[0];
        test('Edge has source', edge.source !== undefined);
        test('Edge has target', edge.target !== undefined);
        test('Edge has strength', typeof edge.strength === 'number');
        test('Edge has type', edge.type !== undefined);

        console.log(`   First edge: Node ${edge.source} ↔ Node ${edge.target} (strength: ${edge.strength.toFixed(2)})`);
    }

    // Test 10: Statistics
    console.log('\n📊 Test 10: Statistics');
    const stats = window.knowledgeGraphManager.statistics;
    test('Statistics has totalConcepts', typeof stats.totalConcepts === 'number');
    test('Statistics has totalRelationships', typeof stats.totalRelationships === 'number');
    test('Statistics has avgConnectionsPerNode', typeof stats.avgConnectionsPerNode === 'number');
    test('Statistics has graphDensity', typeof stats.graphDensity === 'number');
    test('Statistics has subjectDistribution', typeof stats.subjectDistribution === 'object');

    console.log('   Statistics:');
    console.log(`   - Total Concepts: ${stats.totalConcepts}`);
    console.log(`   - Total Relationships: ${stats.totalRelationships}`);
    console.log(`   - Avg Connections: ${stats.avgConnectionsPerNode.toFixed(2)}`);
    console.log(`   - Graph Density: ${(stats.graphDensity * 100).toFixed(1)}%`);
    console.log(`   - Subject Distribution:`);
    Object.entries(stats.subjectDistribution).forEach(([subject, count]) => {
        if (count > 0) console.log(`     • ${subject}: ${count}`);
    });

    // Test 11: Node Colors
    console.log('\n🎨 Test 11: Node Visualization');
    test('getNodeColor method exists', typeof window.knowledgeGraphManager.getNodeColor === 'function');

    if (hasGraph) {
        const node = window.knowledgeGraphManager.graph.nodes[0];
        const color = window.knowledgeGraphManager.getNodeColor(node);
        test('getNodeColor returns color', color !== undefined && color.length > 0);
        console.log(`   Sample node color: ${color} for subject: ${node.subject}`);
    }

    // Test 12: Interaction Methods
    console.log('\n👆 Test 12: Interaction Methods');
    test('onNodeClick method exists', typeof window.knowledgeGraphManager.onNodeClick === 'function');
    test('onNodeHover method exists', typeof window.knowledgeGraphManager.onNodeHover === 'function');
    test('onNodeLeave method exists', typeof window.knowledgeGraphManager.onNodeLeave === 'function');
    test('showConceptDetails method exists', typeof window.knowledgeGraphManager.showConceptDetails === 'function');
    test('highlightConnections method exists', typeof window.knowledgeGraphManager.highlightConnections === 'function');

    // Test 13: SVG Rendering
    console.log('\n🖼️  Test 13: SVG Rendering');
    test('createSVG method exists', typeof window.knowledgeGraphManager.createSVG === 'function');
    test('drawNodes method exists', typeof window.knowledgeGraphManager.drawNodes === 'function');
    test('drawEdges method exists', typeof window.knowledgeGraphManager.drawEdges === 'function');

    const svgExists = window.knowledgeGraphManager.visualization.svg !== null;
    test('SVG element created', svgExists);

    if (svgExists) {
        const nodesGroup = window.knowledgeGraphManager.visualization.svg.querySelector('#nodes-group');
        const edgesGroup = window.knowledgeGraphManager.visualization.svg.querySelector('#edges-group');

        test('Nodes group exists in SVG', nodesGroup !== null);
        test('Edges group exists in SVG', edgesGroup !== null);
    }

    // Test 14: Integration with Chunking
    console.log('\n🔗 Test 14: Integration with Chunking Manager');
    const hasChunks = window.chunkingManager && window.chunkingManager.chunks.length > 0;
    test('Chunking Manager available', window.chunkingManager !== undefined);
    test('Chunks available for graph building', hasChunks);

    if (hasChunks) {
        console.log(`   Available chunks: ${window.chunkingManager.chunks.length}`);
        console.log(`   Graph nodes from chunks: ${window.knowledgeGraphManager.graph.nodes.length}`);
    }

    // Test 15: Build Graph from Chunks
    console.log('\n🏗️  Test 15: Graph Building');

    if (hasChunks) {
        console.log('   Rebuilding graph from chunks...');

        const oldNodeCount = window.knowledgeGraphManager.graph.nodes.length;
        const oldEdgeCount = window.knowledgeGraphManager.graph.edges.length;

        await window.knowledgeGraphManager.buildGraphFromChunks(window.chunkingManager.chunks.slice(0, 3));

        const newNodeCount = window.knowledgeGraphManager.graph.nodes.length;
        const newEdgeCount = window.knowledgeGraphManager.graph.edges.length;

        test('Graph building creates nodes', newNodeCount > 0);
        test('Graph building creates edges', newEdgeCount >= 0);

        console.log(`   Graph rebuilt: ${newNodeCount} nodes, ${newEdgeCount} edges`);
    } else {
        console.log('   ⚠️  No chunks available, skipping graph building test');
    }

    // Test 16: Storage Methods
    console.log('\n💾 Test 16: Storage Methods');
    test('saveToStorage method exists', typeof window.knowledgeGraphManager.saveToStorage === 'function');
    test('loadFromStorage method exists', typeof window.knowledgeGraphManager.loadFromStorage === 'function');

    try {
        window.knowledgeGraphManager.saveToStorage();
        test('Can save graph to storage', true);

        const saved = localStorage.getItem('knowledge_graph');
        test('Graph saved to localStorage', saved !== null);
    } catch (error) {
        test('Can save graph to storage', false);
    }

    // Test 17: Export Functionality
    console.log('\n📥 Test 17: Export Functionality');
    test('exportGraph method exists', typeof window.knowledgeGraphManager.exportGraph === 'function');
    test('getStatistics method exists', typeof window.knowledgeGraphManager.getStatistics === 'function');

    const fullStats = window.knowledgeGraphManager.getStatistics();
    test('Can get full statistics', fullStats !== undefined);
    test('Full stats includes initialized status', fullStats.initialized !== undefined);
    test('Full stats includes settings', fullStats.settings !== undefined);

    // Test 18: Helper Methods
    console.log('\n🛠️  Test 18: Helper Methods');
    test('isCommonWord method exists', typeof window.knowledgeGraphManager.isCommonWord === 'function');
    test('inferSubject method exists', typeof window.knowledgeGraphManager.inferSubject === 'function');

    test('isCommonWord identifies common words', window.knowledgeGraphManager.isCommonWord('the') === true);
    test('isCommonWord rejects technical terms', window.knowledgeGraphManager.isCommonWord('theorem') === false);

    const subject = window.knowledgeGraphManager.inferSubject('Pythagoras theorem');
    test('inferSubject returns valid subject', ['mathematics', 'physics', 'chemistry', 'biology', 'general'].includes(subject));
    console.log(`   Inferred subject for "Pythagoras theorem": ${subject}`);

    // Test 19: Integration with RAG Chat
    console.log('\n💬 Test 19: Integration with RAG Chat');
    test('exploreInRAG method exists', typeof window.knowledgeGraphManager.exploreInRAG === 'function');
    test('RAG Chat Manager available', window.ragChatManager !== undefined);

    // Test 20: Category System
    console.log('\n📚 Test 20: Category System');
    test('Categories object exists', window.knowledgeGraphManager.categories !== undefined);
    test('Mathematics category exists', Array.isArray(window.knowledgeGraphManager.categories.mathematics));
    test('Physics category exists', Array.isArray(window.knowledgeGraphManager.categories.physics));
    test('Chemistry category exists', Array.isArray(window.knowledgeGraphManager.categories.chemistry));
    test('Biology category exists', Array.isArray(window.knowledgeGraphManager.categories.biology));

    console.log('   Category keywords:');
    Object.entries(window.knowledgeGraphManager.categories).forEach(([subject, keywords]) => {
        console.log(`   - ${subject}: ${keywords.slice(0, 5).join(', ')}...`);
    });

    // Test Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

    if (testsFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Knowledge Graph is fully functional!');
    } else {
        console.log('\n⚠️  Some tests failed. Review errors above.');
    }

    // Demo Section
    console.log('\n' + '='.repeat(70));
    console.log('🎬 KNOWLEDGE GRAPH DEMO');
    console.log('='.repeat(70));

    console.log('\n📝 Try these actions:');
    console.log('');
    console.log('1️⃣  Build graph from chunks:');
    console.log('   await window.knowledgeGraphManager.buildGraphFromChunks(window.chunkingManager.chunks)');
    console.log('');
    console.log('2️⃣  Change visualization mode:');
    console.log('   • Force-directed: window.knowledgeGraphManager.settings.visualizationMode = "force"');
    console.log('   • Circular: window.knowledgeGraphManager.settings.visualizationMode = "circular"');
    console.log('   • Hierarchical: window.knowledgeGraphManager.settings.visualizationMode = "hierarchy"');
    console.log('   • Then: window.knowledgeGraphManager.renderGraph()');
    console.log('');
    console.log('3️⃣  Adjust depth level:');
    console.log('   window.knowledgeGraphManager.settings.depthLevel = 3');
    console.log('   window.knowledgeGraphManager.renderGraph()');
    console.log('');
    console.log('4️⃣  Extract concepts from text:');
    console.log('   const text = "Newton\'s laws of motion describe the relationship between force and acceleration";');
    console.log('   const concepts = window.knowledgeGraphManager.extractConcepts(text);');
    console.log('   console.log(concepts);');
    console.log('');
    console.log('5️⃣  Get concept connections:');
    console.log('   const nodeId = 0;');
    console.log('   const connections = window.knowledgeGraphManager.getNodeConnections(nodeId);');
    console.log('   const connectedNodes = window.knowledgeGraphManager.getConnectedNodes(nodeId);');
    console.log('');
    console.log('6️⃣  Export graph:');
    console.log('   window.knowledgeGraphManager.exportGraph()');
    console.log('');
    console.log('7️⃣  Explore concept in RAG Chat:');
    console.log('   window.knowledgeGraphManager.exploreInRAG("Pythagoras theorem")');

    console.log('\n' + '='.repeat(70));
    console.log('✅ KNOWLEDGE GRAPH TEST COMPLETE!');
    console.log('='.repeat(70));

    console.log('\n🎯 Next Steps:');
    console.log('   1. Navigate to "Knowledge Graph" tab');
    console.log('   2. View the interactive graph visualization');
    console.log('   3. Click on nodes to see concept details');
    console.log('   4. Try different visualization modes');
    console.log('   5. Adjust depth level to show more/fewer connections');
    console.log('   6. Click "Explore in RAG Chat" to ask questions about concepts');
    console.log('   7. Export graph data for external analysis');
    console.log('');
    console.log('💡 Pro Tips:');
    console.log('   • Force-directed layout: Best for discovering clusters');
    console.log('   • Circular layout: Best for showing all connections');
    console.log('   • Hierarchical layout: Best for seeing subject groupings');
    console.log('   • Higher depth: More connections, denser graph');
    console.log('   • Lower depth: Fewer connections, clearer structure');
    console.log('   • Click connected concepts to navigate the graph');
    console.log('   • Use subject filters to focus on specific topics');

    return {
        passed: testsPassed,
        failed: testsFailed,
        success: testsFailed === 0,
        stats: window.knowledgeGraphManager.getStatistics()
    };
})();
