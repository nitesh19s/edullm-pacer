# Knowledge Graph User Guide

**EduLLM Platform - Knowledge Graph Feature Complete Guide**

---

## 🔬 Overview

The Knowledge Graph visualizes concepts and their relationships extracted from your educational content, helping you understand how topics connect and discover patterns in your curriculum.

**Key Features:**
- 🌐 Interactive graph visualization
- 🎨 Multiple layout algorithms
- 🔍 Concept extraction from documents
- 📊 Relationship mapping
- 🎯 Subject-based filtering
- 💾 Export functionality

---

## 🎯 Why Knowledge Graphs Matter

### The Problem

Educational content contains interconnected concepts, but these relationships are often:
- ❌ Hidden in dense text
- ❌ Difficult to visualize
- ❌ Hard to navigate
- ❌ Not obvious to learners

### The Solution

Knowledge graphs make concept relationships visible:
- ✅ Visual representation of connections
- ✅ Easy navigation between topics
- ✅ Discover related concepts
- ✅ Understand curriculum structure

### Example

**Without Knowledge Graph:**
```
Reading text: "Pythagoras theorem... Newton's laws... force..."
Question: How are these concepts related?
Answer: Hard to tell without reading everything
```

**With Knowledge Graph:**
```
Visual graph shows:
Pythagoras → Geometry → Triangle → Physics → Force → Newton
Clear path between concepts!
```

---

## 🚀 Quick Start

### Step 1: Navigate to Knowledge Graph

Click **"Knowledge Graph"** in the sidebar (fourth item under Features)

### Step 2: Build Graph

- Click **"Build Graph"** button
- Graph is automatically created from your chunked documents
- Wait for visualization to render

### Step 3: Explore Concepts

- **Click nodes** to see concept details
- **Hover** to highlight connections
- **Pan** by dragging background
- **Zoom** with mouse wheel

### Step 4: Customize View

- **Change layout**: Select from dropdown (Force/Circular/Hierarchy)
- **Adjust depth**: Use slider to show more/fewer connections
- **Filter subjects**: Check/uncheck subject filters
- **Toggle labels**: Show/hide concept names

---

## 🎛️ Controls Explained

### Visualization Mode

**What it does:** Changes how nodes are arranged

**Options:**
- **Force-Directed** (default): Nodes repel each other, connected nodes attract
- **Circular**: Arranges nodes in a circle
- **Hierarchical**: Groups by subject in levels

**When to use each:**

**Force-Directed:**
```
Best for: Discovering clusters and natural groupings
Example: Finding which concepts are most interconnected
Use when: Exploring relationships without preconceptions
```

**Circular:**
```
Best for: Seeing all connections at once
Example: Overview of entire curriculum
Use when: Need to see big picture
```

**Hierarchical:**
```
Best for: Subject-based organization
Example: Mathematics at top, Physics below, etc.
Use when: Need to see subject boundaries
```

### Depth Level

**What it does:** Controls how many relationship levels to show

**Range:** 1-5

**Impact:**
- **Level 1**: Only direct connections (A → B)
- **Level 2**: Friends of friends (A → B → C)
- **Level 3**: Extended network (A → B → C → D)
- **Level 4-5**: Very large networks

**Recommendations:**
- **Level 1-2**: Focused exploration, clear structure
- **Level 3**: Balanced view (recommended)
- **Level 4-5**: Comprehensive but may be cluttered

**Example:**
```
Concept: "Force"

Depth 1: Force → Acceleration, Mass, Newton
Depth 2: Force → Acceleration → Velocity → Speed → Distance
Depth 3: ... continues to show more distant relationships
```

### Show Labels

**What it does:** Toggles concept names on/off

**When to show:**
- ✅ Exploring specific concepts
- ✅ Teaching/presentation mode
- ✅ Smaller graphs (< 30 nodes)

**When to hide:**
- ✅ Large graphs (> 30 nodes)
- ✅ Focus on structure only
- ✅ Less screen clutter

### Subject Filters

**What it does:** Shows only concepts from selected subjects

**Subjects:**
- Mathematics (blue)
- Physics (green)
- Chemistry (orange)
- Biology (purple)
- General (gray)

**Use Cases:**

**Single Subject:**
```
Goal: Understand Mathematics curriculum
Action: Uncheck all except Mathematics
Result: See only math concepts and relationships
```

**Related Subjects:**
```
Goal: See Physics-Mathematics connections
Action: Check only Physics and Mathematics
Result: Interdisciplinary concept map
```

---

## 📊 Understanding the Graph

### Nodes (Circles)

**Size Meaning:**
- **Large nodes**: Many connections (central concepts)
- **Medium nodes**: Moderate connections
- **Small nodes**: Few connections (peripheral concepts)

**Color Meaning:**
- **Blue**: Mathematics
- **Green**: Physics
- **Orange**: Chemistry
- **Purple**: Biology
- **Gray**: General/Interdisciplinary

**Example Interpretation:**
```
Large blue node = Important mathematical concept with many connections
Small green node = Specific physics concept with few connections
```

### Edges (Lines)

**Thickness Meaning:**
- **Thick lines**: Strong relationship (concepts co-occur frequently)
- **Thin lines**: Weak relationship (occasional co-occurrence)

**Relationship Types:**
```
Co-occurrence: Concepts appear together in text
Example: "Force" and "Acceleration" often appear together
         → Strong relationship (thick line)
```

### Graph Patterns

**Star Pattern:**
```
    A
   /|\
  B C D

Central concept (A) connected to many peripherals
Example: "Newton" connected to "Force", "Motion", "Laws"
```

**Chain Pattern:**
```
A → B → C → D

Sequential concepts
Example: "Algebra" → "Equation" → "Solution" → "Proof"
```

**Cluster Pattern:**
```
  A   D
 /|\ /|\
B C E F G

Multiple interconnected groups
Example: Math cluster + Physics cluster
```

---

## 📝 Statistics Explained

### Total Concepts

Number of unique concepts extracted from documents

**Interpretation:**
- **10-30**: Small focused curriculum
- **30-80**: Medium-sized curriculum
- **80+**: Large comprehensive curriculum

### Total Relationships

Number of connections between concepts

**Interpretation:**
- More relationships = More interconnected curriculum
- Fewer relationships = More isolated topics

### Average Connections Per Node

Average number of connections each concept has

**Formula:** Total Edges × 2 / Total Nodes

**Interpretation:**
- **1-2**: Sparse graph, isolated concepts
- **3-5**: Well-connected graph (ideal)
- **6+**: Densely connected, possibly cluttered

### Graph Density

Percentage of possible connections that exist

**Formula:** Actual Edges / Possible Edges

**Interpretation:**
- **0-20%**: Sparse (concepts mostly independent)
- **20-50%**: Moderate (good balance)
- **50-100%**: Dense (highly interconnected)

**Example:**
```
10 nodes, 15 edges
Possible edges = 10 × 9 / 2 = 45
Density = 15 / 45 = 33% (moderate)
```

### Subject Distribution

Number of concepts per subject

**Use:**
- Identify curriculum balance
- Find underrepresented subjects
- Plan content additions

---

## 🔧 Advanced Usage

### Building Custom Graphs

```javascript
// Build from specific chunks
const selectedChunks = window.chunkingManager.chunks.slice(0, 10);
await window.knowledgeGraphManager.buildGraphFromChunks(selectedChunks);
```

### Extracting Concepts

```javascript
// Extract concepts from custom text
const text = "Your educational content here...";
const concepts = window.knowledgeGraphManager.extractConcepts(text);

console.log(`Extracted ${concepts.length} concepts:`);
concepts.forEach(c => {
    console.log(`- ${c.text} (${c.subject}, freq: ${c.frequency})`);
});
```

### Analyzing Relationships

```javascript
// Get connections for a specific node
const nodeId = 0;
const connectionCount = window.knowledgeGraphManager.getNodeConnections(nodeId);
const connectedNodes = window.knowledgeGraphManager.getConnectedNodes(nodeId);

console.log(`Node ${nodeId} has ${connectionCount} connections:`);
connectedNodes.forEach(n => {
    console.log(`- ${n.label} (${n.subject})`);
});
```

### Changing Visualization Settings

```javascript
// Switch to circular layout
window.knowledgeGraphManager.settings.visualizationMode = 'circular';
window.knowledgeGraphManager.renderGraph();

// Adjust node size algorithm
window.knowledgeGraphManager.settings.nodeSize = 'importance';  // or 'connections', 'uniform'
window.knowledgeGraphManager.renderGraph();

// Change color scheme
window.knowledgeGraphManager.settings.colorScheme = 'importance';  // or 'subject', 'type'
window.knowledgeGraphManager.renderGraph();
```

### Finding Important Concepts

```javascript
// Get most connected concept
const stats = window.knowledgeGraphManager.statistics;
console.log('Most connected:', stats.mostConnectedConcept.label);

// Sort nodes by importance
const sortedNodes = window.knowledgeGraphManager.graph.nodes
    .sort((a, b) => b.importance - a.importance);

console.log('Top 5 most important concepts:');
sortedNodes.slice(0, 5).forEach((n, i) => {
    console.log(`${i + 1}. ${n.label} (${(n.importance * 100).toFixed(0)}%)`);
});
```

---

## 🎓 Educational Use Cases

### Use Case 1: Curriculum Planning

**Goal:** Identify gaps in curriculum coverage

**Steps:**
1. Build graph from all course materials
2. Check subject distribution statistics
3. Look for isolated nodes (concepts with few connections)
4. Identify missing links between subjects

**Example:**
```
Graph shows:
- Mathematics: 45 concepts
- Physics: 30 concepts
- Chemistry: 15 concepts  ← Underrepresented!
- Biology: 25 concepts

Action: Add more chemistry content
```

### Use Case 2: Lesson Planning

**Goal:** Design lessons that build on prior knowledge

**Steps:**
1. Select target concept (e.g., "Newton's Laws")
2. View connected concepts
3. Identify prerequisites (concepts connected to target)
4. Design lesson sequence following connection path

**Example:**
```
Target: "Newton's Laws"
Connected: "Force", "Mass", "Acceleration"
Prerequisites: "Motion", "Velocity"

Lesson sequence:
1. Motion
2. Velocity
3. Force, Mass, Acceleration
4. Newton's Laws
```

### Use Case 3: Student Exploration

**Goal:** Help students discover related topics

**Steps:**
1. Student asks about concept (e.g., "Pythagoras")
2. Show concept in knowledge graph
3. Student clicks connected nodes
4. Discovers related concepts organically

**Example:**
```
Student query: "What is Pythagoras theorem?"
Graph shows connections:
Pythagoras → Triangle → Geometry → Area → Perimeter
Student explores each connection naturally
```

### Use Case 4: Assessment Design

**Goal:** Create comprehensive assessments

**Steps:**
1. Build graph from course content
2. Identify central concepts (large nodes)
3. Design questions covering central concepts
4. Include questions on concept relationships

**Example:**
```
Central concepts: "Force", "Energy", "Motion"
Assessment questions:
- Define Force (concept knowledge)
- Explain relationship between Force and Motion (connection knowledge)
- Apply Force concepts to Energy problems (integration)
```

---

## 🐛 Troubleshooting

### Issue: Empty Graph

**Symptoms:** "No knowledge graph available" message

**Causes:**
- No chunks available
- All chunks too short
- No recognizable concepts

**Solutions:**
```javascript
// Check if chunks exist
console.log(window.chunkingManager.chunks.length);

// If no chunks, chunk some documents first
await window.chunkingManager.loadDocument('doc_id');

// Rebuild graph
await window.knowledgeGraphManager.rebuildGraph();
```

### Issue: Too Many Nodes

**Symptoms:** Graph is cluttered and slow

**Solutions:**
1. **Reduce max nodes:**
```javascript
window.knowledgeGraphManager.settings.maxNodes = 30;
await window.knowledgeGraphManager.rebuildGraph();
```

2. **Increase min relationship strength:**
```javascript
window.knowledgeGraphManager.settings.minRelationshipStrength = 0.5;
await window.knowledgeGraphManager.rebuildGraph();
```

3. **Use subject filters:**
- Uncheck some subjects to reduce visible nodes

### Issue: Too Few Connections

**Symptoms:** Nodes are isolated, few/no edges

**Solutions:**
1. **Lower min relationship strength:**
```javascript
window.knowledgeGraphManager.settings.minRelationshipStrength = 0.2;
await window.knowledgeGraphManager.rebuildGraph();
```

2. **Increase chunk overlap:**
```javascript
// In chunking manager
window.chunkingManager.settings.overlap = 100;
await window.chunkingManager.rechunk();

// Rebuild graph
await window.knowledgeGraphManager.rebuildGraph();
```

### Issue: Layout Looks Wrong

**Symptoms:** Nodes overlapping or poorly arranged

**Solutions:**
1. **Try different layout:**
```javascript
// Circular often works better for small graphs
window.knowledgeGraphManager.settings.visualizationMode = 'circular';
window.knowledgeGraphManager.renderGraph();
```

2. **Rebuild graph:**
```javascript
await window.knowledgeGraphManager.rebuildGraph();
```

### Issue: Can't See Concept Details

**Symptoms:** Clicking nodes doesn't show details panel

**Solutions:**
```javascript
// Check if panel exists
console.log(document.getElementById('conceptDetails'));

// Force update
const node = window.knowledgeGraphManager.graph.nodes[0];
window.knowledgeGraphManager.showConceptDetails(node);
```

---

## 💡 Pro Tips

### Tip 1: Start with Force Layout

```
First time viewing graph?
Use Force-Directed layout to see natural clusters
Then switch to other layouts for different perspectives
```

### Tip 2: Depth Level Sweet Spot

```
For most use cases:
Depth 2-3 provides best balance
Depth 1 = Too limited
Depth 4-5 = Too cluttered
```

### Tip 3: Subject Filtering for Focus

```
Studying specific subject?
Filter to show only that subject
Reduces cognitive load
Highlights subject-specific structure
```

### Tip 4: Export for Documentation

```javascript
// Export graph for reports/presentations
window.knowledgeGraphManager.exportGraph();

// Include in documentation:
// - Curriculum maps
// - Course structure diagrams
// - Lesson planning materials
```

### Tip 5: Combine with RAG Chat

```
Workflow:
1. Explore graph to find interesting concept
2. Click "Explore in RAG Chat"
3. Ask detailed questions about concept
4. Return to graph to explore related concepts
5. Repeat!
```

### Tip 6: Regular Updates

```javascript
// After adding new content:
1. Rechunk documents
   await window.chunkingManager.rechunk()

2. Rebuild graph
   await window.knowledgeGraphManager.rebuildGraph()

3. Explore new connections
```

### Tip 7: Size Indicates Importance

```
When planning lessons/assessments:
- Focus on large nodes (central concepts)
- Ensure students understand these first
- Use small nodes for enrichment
```

---

## 📊 Optimization Guide

### Goal: Clear, Useful Visualization

**Step 1: Start with Defaults**
```javascript
maxNodes: 50
minRelationshipStrength: 0.3
visualizationMode: 'force'
depthLevel: 2
```

**Step 2: Evaluate**
- Is graph too cluttered? → Reduce maxNodes or increase minRelationshipStrength
- Is graph too sparse? → Increase maxNodes or decrease minRelationshipStrength
- Can't see structure? → Try different layout

**Step 3: Iterate**

**If graph is cluttered:**
```javascript
window.knowledgeGraphManager.settings.maxNodes = 30;
window.knowledgeGraphManager.settings.minRelationshipStrength = 0.4;
await window.knowledgeGraphManager.rebuildGraph();
```

**If graph is too sparse:**
```javascript
window.knowledgeGraphManager.settings.maxNodes = 80;
window.knowledgeGraphManager.settings.minRelationshipStrength = 0.2;
await window.knowledgeGraphManager.rebuildGraph();
```

**If layout is poor:**
```javascript
// Try each layout
['force', 'circular', 'hierarchy'].forEach(mode => {
    window.knowledgeGraphManager.settings.visualizationMode = mode;
    window.knowledgeGraphManager.renderGraph();
    // Pause to evaluate visually
});
```

---

## 🎯 Quick Reference

### Optimal Settings by Use Case

```
Curriculum Overview:
- Mode: Hierarchical
- Depth: 2
- Max Nodes: 50
- Subject Filters: All

Focused Study:
- Mode: Force-Directed
- Depth: 3
- Max Nodes: 30
- Subject Filters: Selected subjects only

Lesson Planning:
- Mode: Hierarchical
- Depth: 2
- Max Nodes: 40
- Subject Filters: Relevant subjects

Exploration:
- Mode: Force-Directed
- Depth: 3-4
- Max Nodes: 80
- Subject Filters: All

Presentation:
- Mode: Circular
- Depth: 1-2
- Max Nodes: 20
- Labels: On
```

### Keyboard Shortcuts

```
(Future feature - planned)
Space: Toggle labels
+/-: Zoom in/out
Arrow keys: Pan
R: Reset view
F: Fit to screen
```

---

## 🔗 Integration with Other Features

### Dashboard

**Automatic Tracking:**
- Graph building events logged in activity feed
- Concept count shown in metrics
- Subject distribution tracked

### Smart Chunking

**Data Flow:**
```
Chunking Manager → Chunks → Knowledge Graph Manager → Graph
```

**Best Practices:**
- Use semantic chunking for better concept extraction
- Higher overlap = More connections in graph
- Optimal chunk size: 400-600 words

### RAG Chat

**Workflow:**
1. Explore graph to find concept
2. Click "Explore in RAG Chat"
3. RAG Chat auto-fills query
4. Get detailed answer with sources
5. Related concepts in answer link back to graph

**Example:**
```
Graph: Click "Force" node
Action: Click "Explore in RAG Chat"
RAG Chat: Auto-queries "Explain Force"
Answer: Includes related concepts: "acceleration", "mass", "Newton"
Graph: Click these concepts to continue exploring
```

---

## 📊 Feature Status

✅ Concept extraction from text
✅ Relationship building
✅ Force-directed layout
✅ Circular layout
✅ Hierarchical layout
✅ Interactive node selection
✅ Subject filtering
✅ Statistics calculation
✅ Export functionality
✅ RAG Chat integration

**Knowledge Graph: 100% Complete**

---

## 🎯 Research Applications

### For PhD Research (Curriculum Analysis)

**Use Case 1: Concept Coverage Analysis**
```javascript
// Analyze concept distribution across curriculum
const stats = window.knowledgeGraphManager.getStatistics();
console.log('Subject Distribution:', stats.subjectDistribution);

// Calculate coverage metrics
const totalConcepts = stats.totalConcepts;
Object.entries(stats.subjectDistribution).forEach(([subject, count]) => {
    const percentage = (count / totalConcepts * 100).toFixed(1);
    console.log(`${subject}: ${percentage}%`);
});
```

**Use Case 2: Relationship Density Analysis**
```javascript
// Measure interconnectedness
const density = window.knowledgeGraphManager.statistics.graphDensity;
console.log(`Graph Density: ${(density * 100).toFixed(1)}%`);

// Compare to theoretical maximum
const nodes = window.knowledgeGraphManager.graph.nodes.length;
const actualEdges = window.knowledgeGraphManager.graph.edges.length;
const maxPossibleEdges = (nodes * (nodes - 1)) / 2;
console.log(`Actual edges: ${actualEdges} of ${maxPossibleEdges} possible`);
```

**Use Case 3: Central Concept Identification**
```javascript
// Find key concepts (for learning path design)
const nodes = window.knowledgeGraphManager.graph.nodes;
const centralConcepts = nodes
    .map(node => ({
        label: node.label,
        connections: window.knowledgeGraphManager.getNodeConnections(node.id),
        importance: node.importance
    }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 10);

console.log('Top 10 Central Concepts:');
centralConcepts.forEach((c, i) => {
    console.log(`${i + 1}. ${c.label} (${c.connections} connections, ${(c.importance * 100).toFixed(0)}% importance)`);
});
```

---

**Master knowledge graphs, master curriculum structure! 🔬✨**
