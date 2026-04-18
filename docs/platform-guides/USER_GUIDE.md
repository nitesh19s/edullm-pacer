# EduLLM Platform - User Guide

**Complete Guide for Using the Platform**

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [RAG Chat](#rag-chat)
4. [Data Upload](#data-upload)
5. [Chunking](#chunking)
6. [Knowledge Graph](#knowledge-graph)
7. [Experiments](#experiments)
8. [Analytics](#analytics)
9. [Settings](#settings)
10. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## Getting Started

### First Launch

When you first open the EduLLM platform:

1. **Automatic Demo Data**: The platform loads sample data automatically
2. **Welcome Message**: Dashboard shows you around
3. **Sample Chat**: Pre-loaded Q&A pairs in RAG Chat
4. **Ready to Use**: All features are immediately accessible

### Navigation

The platform has 8 main sections accessible via the top navigation bar:

- **Dashboard** - Overview and metrics
- **RAG Chat** - AI-powered question answering
- **Data Upload** - Upload and manage PDFs
- **Chunking** - Process and segment documents
- **Knowledge Graph** - Visualize relationships
- **Experiments** - Test RAG configurations
- **Analytics** - Usage insights
- **Settings** - Configure platform

---

## Dashboard

### Overview

The Dashboard provides real-time metrics and system status.

### Key Metrics

**Documents Indexed**
- Total text chunks stored in database
- Default: 12,847 documents
- Updates automatically when you upload PDFs

**Queries Processed**
- Number of RAG queries executed
- Default: 3,421 queries
- Increments with each chat question

**Accuracy Rate**
- RAG response quality metric
- Based on experiment results
- Default: 94.7%

**Average Response Time**
- Time to generate responses
- Default: 1.2 seconds
- Varies based on query complexity

### Curriculum Coverage

Visual progress bars showing coverage by subject:
- **Mathematics**: 85%
- **Physics**: 72%
- **Chemistry**: 68%
- **Biology**: 91%

Coverage increases when you upload subject-specific PDFs.

### Recent Activity

Shows last 5 activities:
- File uploads
- Experiments run
- Chat queries
- System updates

### Quick Actions

- **Refresh Dashboard**: Update all metrics
- **Reset Data**: Clear all dashboard data (with confirmation)
- **Export Data**: Download metrics as JSON

---

## RAG Chat

### Overview

The RAG (Retrieval-Augmented Generation) Chat is a WhatsApp-style interface for asking questions about educational content.

### Interface Layout

**Chat Header**
- AI Assistant icon and status (Online)
- Quick filters for subject, grade, and source
- Settings and options menu

**Message Area**
- User messages (right side)
- AI responses (left side with robot avatar)
- Source citations as colored badges
- Timestamps for all messages

**Input Area**
- Attach button (for future file uploads)
- Text input field
- Send button (or press Enter)

### Using Chat

1. **Type Your Question**
   ```
   What is the Pythagorean theorem?
   ```

2. **Press Enter or Click Send**
   - Typing indicator appears
   - System searches for relevant content
   - AI generates response with sources

3. **View Response**
   - Answer appears in chat bubble
   - Source citations shown as badges
   - Timestamp indicates when response was sent

### Filtering Results

Use the header filters to narrow search:

**Subject Filter**
- All subjects (default)
- Mathematics
- Physics
- Chemistry
- Biology

**Grade Filter**
- All grades (default)
- Grade 9
- Grade 10
- Grade 11
- Grade 12

**Source Filter**
- All sources (default)
- NCERT Textbooks
- Reference Materials
- Practice Problems

### Sample Questions

Try these example questions:

**Mathematics**
- "What is the quadratic formula?"
- "Explain the Pythagorean theorem with an example"
- "How do you solve linear equations?"

**Physics**
- "What is Newton's first law of motion?"
- "Explain Ohm's law"
- "What is the difference between speed and velocity?"

**Chemistry**
- "What are acids and bases?"
- "Explain the periodic table"
- "What is a chemical reaction?"

**Biology**
- "What is photosynthesis?"
- "Describe the structure of a cell"
- "What is the human digestive system?"

### Chat Features

**Clear Chat**
- Removes all messages
- Shows confirmation dialog
- Adds new welcome message

**Export Chat**
- Download chat history as JSON
- Includes all messages, timestamps, sources
- Useful for analysis and record-keeping

**Chat Statistics**
- Total messages
- User vs AI message counts
- Date range of conversation

---

## Data Upload

### Overview

Upload NCERT PDFs and other educational documents to populate the platform with real content.

### Upload Process

1. **Select Files**
   - Drag and drop PDFs onto upload area
   - Or click "Browse Files" to select

2. **Add Metadata**
   - Subject (Mathematics, Physics, etc.)
   - Grade level (9-12)
   - Chapter name
   - Additional tags

3. **Process File**
   - Click "Upload and Process"
   - Wait for PDF extraction
   - Review processing status

4. **Verify Results**
   - Check extraction quality
   - View document statistics
   - Confirm chunks generated

### File Requirements

**Supported Formats**
- PDF files only
- Text-based PDFs (not scanned images)
- Maximum size: 50 MB per file

**Naming Convention**
- Include "NCERT" for validation
- Example: `NCERT_Math_Class10_Ch1.pdf`

**Content Requirements**
- Clear text (not handwritten)
- Standard NCERT format
- Complete chapters preferred

### Upload Statistics

After processing, view:
- **Pages Extracted**: Number of PDF pages
- **Text Length**: Total characters
- **Chunks Generated**: Number of segments
- **Processing Time**: Duration in seconds
- **Quality Score**: Extraction quality (0-100%)

### Managing Uploads

**View Uploaded Files**
- List of all processed documents
- Metadata and statistics
- Processing status

**Delete Files**
- Remove documents from database
- Clears associated chunks and embeddings
- Confirmation required

**Re-process Files**
- Re-extract with different settings
- Update metadata
- Regenerate embeddings

---

## Chunking

### Overview

The Chunking section shows how documents are segmented into smaller pieces for RAG processing.

### Chunking Strategies

**1. Sentence-Based (Recommended)**
- Splits text at sentence boundaries
- Preserves natural language flow
- Good for question answering
- Example: "The Pythagorean theorem states..."

**2. Semantic Chunking**
- Groups related sentences together
- Maintains topic coherence
- Better for conceptual questions
- Slower processing time

**3. Fixed-Size**
- Equal-length chunks (e.g., 500 characters)
- Optional overlap (e.g., 50 characters)
- Fast and consistent
- May split sentences mid-way

### Using the Chunking Interface

1. **Select Document**
   - Choose from uploaded PDFs
   - View document metadata

2. **Choose Strategy**
   - Select chunking method
   - Configure parameters

3. **Process**
   - Click "Generate Chunks"
   - Wait for processing
   - View results

4. **Review Chunks**
   - Scroll through generated segments
   - Check quality and coherence
   - Adjust settings if needed

### Chunking Parameters

**Sentence-Based**
- Max sentences per chunk: 3-10
- Minimum chunk length: 50-200 chars

**Semantic**
- Similarity threshold: 0.5-0.9
- Max chunk length: 500-2000 chars

**Fixed-Size**
- Chunk size: 200-1000 chars
- Overlap: 0-100 chars

### Chunk Display

Each chunk shows:
- **Chunk ID**: Unique identifier
- **Text**: Content of the chunk
- **Length**: Character count
- **Source**: Original document and page
- **Metadata**: Subject, grade, chapter

### Exporting Chunks

**Export Options**
- JSON format for analysis
- CSV for spreadsheet import
- Text file for manual review

---

## Knowledge Graph

### Overview

The Knowledge Graph visualizes relationships between curriculum concepts.

### Graph Elements

**Nodes**
- Represent concepts (e.g., "Pythagorean Theorem")
- Color-coded by subject
- Size indicates importance

**Edges**
- Connect related concepts
- Show prerequisite relationships
- Indicate topic associations

### Interacting with the Graph

**Navigation**
- **Pan**: Click and drag background
- **Zoom**: Mouse wheel or pinch gesture
- **Select**: Click on nodes to highlight

**Node Details**
- Click a node to see:
  - Concept name
  - Subject and grade
  - Related topics
  - Learning resources

**Filtering**
- Subject filter: Show only specific subjects
- Grade filter: Show concepts for grade level
- Search: Find concepts by name

### Graph Types

**1. Concept Map**
- Shows all curriculum concepts
- Connections indicate relationships
- Default view

**2. Prerequisite Graph**
- Directed graph showing learning order
- Arrows point from prerequisite to dependent
- Useful for curriculum planning

**3. Topic Clusters**
- Groups related concepts together
- Color-coded by subject area
- Shows topic boundaries

### Graph Actions

**Add Concept**
- Manually add new nodes
- Define relationships
- Set metadata

**Edit Concept**
- Update concept details
- Modify connections
- Change properties

**Delete Concept**
- Remove from graph
- Option to keep or delete connections

**Export Graph**
- PNG image for presentations
- JSON data for analysis
- DOT format for GraphViz

---

## Experiments

### Overview

The Experiments section allows you to test different RAG configurations and compare results.

### Creating an Experiment

1. **Name Your Experiment**
   ```
   Example: "Testing Top-K Values"
   ```

2. **Set Description**
   ```
   Example: "Compare retrieval quality with K=3, K=5, K=10"
   ```

3. **Configure Parameters**
   - Top-K: Number of chunks to retrieve (3-10)
   - Temperature: LLM randomness (0.0-1.0)
   - Max Tokens: Response length (100-2000)
   - Embedding Model: USE or MiniLM

4. **Add Tags** (optional)
   ```
   Tags: retrieval, performance, baseline
   ```

5. **Create Experiment**
   - Click "Create"
   - Experiment appears in list

### Running Experiments

1. **Select Experiment**
   - Click on experiment from list
   - View configuration details

2. **Run Experiment**
   - Click "Run Experiment"
   - Enter test queries or use defaults
   - Wait for completion

3. **View Results**
   - Metrics: Precision, Recall, F1-score
   - Response time
   - Retrieved chunks quality
   - Generated responses

### Experiment Metrics

**Precision**
- Percentage of retrieved chunks that are relevant
- Higher is better (0-100%)

**Recall**
- Percentage of relevant chunks that were retrieved
- Higher is better (0-100%)

**F1-Score**
- Harmonic mean of precision and recall
- Balanced quality metric (0-100%)

**Response Time**
- Time to generate answer
- Lower is better (seconds)

### A/B Testing

Compare two configurations:

1. **Create Variant A**
   - Configure baseline settings
   - Run experiment

2. **Create Variant B**
   - Modify one parameter
   - Run with same test queries

3. **Compare Results**
   - Side-by-side metrics
   - Statistical significance
   - Winner determination

### Baselines

Save experiment results as baselines:

1. **Create Baseline**
   - Name it (e.g., "Production Config")
   - Save current metrics

2. **Compare to Baseline**
   - Run new experiments
   - Compare against saved baseline
   - Track improvements

### Experiment History

View all past experiments:
- Sort by date, name, or performance
- Filter by tags or status
- Export results as JSON/CSV

---

## Analytics

### Overview

The Analytics section provides insights into platform usage and performance.

### Available Metrics

**Usage Analytics**
- Daily active users
- Queries per day
- Peak usage times
- Most asked questions

**Performance Metrics**
- Average response time
- Query success rate
- Error rate
- System uptime

**Content Analytics**
- Most retrieved documents
- Popular topics
- Subject distribution
- Grade level usage

**Quality Metrics**
- User satisfaction scores
- Response accuracy
- Citation relevance
- Feedback ratings

### Viewing Analytics

**Dashboard View**
- Key metrics at a glance
- Trend charts
- Quick insights

**Detailed Reports**
- Drill down into specific metrics
- Custom date ranges
- Export functionality

**Comparison View**
- Compare time periods
- Benchmark against baselines
- Identify trends

### Exporting Analytics

**Export Formats**
- PDF reports
- JSON data
- CSV for Excel
- PNG charts

---

## Settings

### Overview

Configure platform behavior and preferences.

### Embedding Settings

**Model Selection**
- Universal Sentence Encoder (default)
- MiniLM (faster)
- Custom API endpoint

**Embedding Parameters**
- Dimension: 512 (USE) or 384 (MiniLM)
- Batch size: 1-100
- Cache embeddings: On/Off

### RAG Settings

**Retrieval Parameters**
- Top-K results: 3-10 (default: 3)
- Similarity threshold: 0.0-1.0 (default: 0.5)
- Include examples: On/Off
- Include citations: On/Off

**Generation Parameters**
- Temperature: 0.0-1.0 (default: 0.7)
- Max tokens: 100-2000 (default: 500)
- Model: Select LLM

### LLM Integration

**API Configuration**
- Endpoint URL: `https://api.example.com/v1/chat`
- API Key: (stored locally only)
- Model name: `gpt-3.5-turbo` or custom
- Timeout: 10-60 seconds

**Testing Connection**
- Click "Test API"
- Verify response
- Check latency

### UI Preferences

**Theme**
- Light mode (default)
- Dark mode
- Auto (system preference)

**Language**
- English (default)
- Hindi (coming soon)

**Display**
- Compact view: On/Off
- Show avatars: On/Off
- Timestamps: Relative / Absolute

### Data Management

**Storage**
- View storage usage
- Clear cache
- Export all data
- Import data backup

**Privacy**
- Clear chat history
- Delete uploaded files
- Reset dashboard metrics
- Factory reset (all data)

### Advanced Settings

**Performance**
- Enable caching: On/Off
- Preload models: On/Off
- Batch processing: On/Off

**Developer**
- Console logging: On/Off
- Debug mode: On/Off
- Performance profiling: On/Off

---

## FAQ & Troubleshooting

### Frequently Asked Questions

**Q: Do I need an internet connection?**
A: Only for initial model downloads. After that, everything runs locally.

**Q: Where is my data stored?**
A: All data is stored locally in your browser using IndexedDB. Nothing is sent to external servers.

**Q: Can I use this offline?**
A: Yes, after initial setup. All processing happens in-browser.

**Q: What file formats are supported?**
A: Currently only PDF files with extractable text.

**Q: How much storage does the platform use?**
A: Depends on uploaded content. Typically 50-200 MB for a full NCERT curriculum.

**Q: Can I export my data?**
A: Yes, all data can be exported as JSON from Settings or individual sections.

**Q: Is my API key safe?**
A: Yes, API keys are stored only in your browser's local storage, never transmitted.

**Q: Can multiple users share data?**
A: No, data is per-browser. Export/import to share between devices.

### Common Issues

**Issue: Chat not responding**
- Check if data is loaded (Dashboard shows counts > 0)
- Verify RAG system initialized (check console)
- Try refreshing the page

**Issue: PDF upload fails**
- Ensure file is a text-based PDF (not scanned)
- Check file size < 50 MB
- Verify filename contains "NCERT"

**Issue: Embeddings taking too long**
- Switch to MiniLM model (faster)
- Reduce batch size in settings
- Process fewer documents at once

**Issue: Dashboard metrics reset to zero**
- Refresh page (metrics load from database)
- Check browser storage not full
- Export data before clearing browser cache

**Issue: Knowledge graph not displaying**
- Check browser WebGL support
- Try a different browser
- Reduce number of nodes displayed

**Issue: Slow performance**
- Clear cache in Settings
- Disable preloading in Advanced Settings
- Use Chrome or Edge for best performance

### Getting Help

**Browser Console**
- Press F12 to open DevTools
- Check Console tab for errors
- All system logs visible with emoji prefixes

**Export Logs**
- Settings → Advanced → Export Debug Logs
- Share with support team

**Reset Platform**
- Settings → Data Management → Factory Reset
- Clears all data and starts fresh
- Export data first if needed

---

## Best Practices

### For Students

1. **Ask Specific Questions**: Better results than vague queries
2. **Use Filters**: Narrow by subject and grade for focused answers
3. **Check Citations**: Verify sources for accuracy
4. **Save Important Chats**: Export chat history for study notes

### For Teachers

1. **Upload Quality Content**: Use official NCERT PDFs
2. **Create Experiments**: Test different RAG configurations
3. **Monitor Analytics**: Track student usage patterns
4. **Regular Backups**: Export data periodically

### For Researchers

1. **Document Experiments**: Use detailed names and descriptions
2. **Save Baselines**: Track improvements over time
3. **Export Everything**: Keep copies of all experimental data
4. **Use Analytics**: Generate insights from usage data

---

## Keyboard Shortcuts

- `Enter` - Send chat message
- `Ctrl/Cmd + K` - Focus chat input
- `Ctrl/Cmd + /` - Open settings
- `Ctrl/Cmd + E` - Export current view
- `Esc` - Close dialogs/modals

---

**For more technical details, see DEVELOPER_GUIDE.md**

**For deployment instructions, see DEPLOYMENT.md**
