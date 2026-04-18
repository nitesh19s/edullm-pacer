# EduLLM Platform - Page-by-Page Flow Guide

## Overview

This document outlines the complete page-by-page flow of the EduLLM Platform, including navigation, user experience, and data flow between pages.

## Page Flow Architecture

### Flow Order
1. **Dashboard** → Overview and statistics
2. **Data Upload** → Upload NCERT PDFs
3. **RAG Chat** → Interactive AI chat
4. **Smart Chunking** → Document visualization
5. **Knowledge Graph** → Concept relationships
6. **Settings** → Platform configuration

## Page-by-Page Flow

### 1. Dashboard Page

**Purpose**: Overview and platform statistics

**Entry Points**:
- Default landing page
- Navigation from any page
- After data upload completion

**User Flow**:
1. User lands on Dashboard
2. Views platform statistics
3. Sees recent activity
4. Checks curriculum coverage
5. **Quick Actions**:
   - "Start Chat" → Navigate to RAG Chat
   - "Upload Data" → Navigate to Data Upload

**Data Flow**:
- Loads statistics from database
- Displays real-time metrics
- Shows recent interactions

**Next Steps**:
- Upload data (if no data exists)
- Start chat (if data exists)
- Explore other features

---

### 2. Data Upload Page

**Purpose**: Upload and process NCERT PDF textbooks

**Entry Points**:
- Dashboard "Upload Data" action
- Navigation menu
- First-time user onboarding

**User Flow**:
1. User arrives at Upload page
2. Sees upload area with instructions
3. **Option A**: Drag & drop PDF files
4. **Option B**: Click to browse files
5. Files are validated
6. Processing progress shown
7. Results displayed
8. **Action**: "Integrate Data into Platform"
9. Data saved to database
10. **Quick Actions**:
    - "View Dashboard" → See updated statistics
    - "Start Chat" → Test with uploaded data

**Data Flow**:
- Files validated
- PDFs processed
- Chapters extracted
- Data saved to database
- Platform updated

**Next Steps**:
- View Dashboard (see updated stats)
- Start Chat (test with new data)
- View Chunks (see how data is segmented)

---

### 3. RAG Chat Page

**Purpose**: Interactive AI chat with NCERT curriculum

**Entry Points**:
- Dashboard "Start Chat" action
- Navigation menu
- After data upload

**User Flow**:
1. User arrives at RAG Chat
2. Sees chat interface with filters
3. **Optional**: Set filters (Subject, Grade, Source)
4. Types question in chat input
5. Message sent
6. AI processes query
7. Response displayed with sources
8. Conversation continues
9. **Quick Actions**:
    - "View Chunks" → See document segmentation
    - "Explore Graph" → View concept relationships

**Data Flow**:
- Query processed through RAG system
- Relevant chunks retrieved
- Response generated
- Chat history saved to database
- Statistics updated

**Next Steps**:
- Continue conversation
- View chunks used in response
- Explore knowledge graph
- Adjust filters for different queries

---

### 4. Smart Chunking Page

**Purpose**: Visualize document segmentation

**Entry Points**:
- RAG Chat "View Chunks" action
- Navigation menu
- After data processing

**User Flow**:
1. User arrives at Chunking page
2. Selects document from dropdown
3. Adjusts chunk size slider
4. Adjusts overlap slider
5. Sees chunk statistics
6. Views chunk visualization
7. Clicks chunk for details
8. **Quick Actions**:
    - "Try Chat" → Test chunking in RAG
    - "Upload More" → Add more documents

**Data Flow**:
- Loads chunks from database
- Displays chunk statistics
- Shows chunk content
- Updates visualization

**Next Steps**:
- Adjust parameters
- Test in RAG chat
- Upload more documents
- Explore knowledge graph

---

### 5. Knowledge Graph Page

**Purpose**: Visualize concept relationships

**Entry Points**:
- RAG Chat "Explore Graph" action
- Navigation menu
- After data processing

**User Flow**:
1. User arrives at Knowledge Graph
2. Selects focus topic
3. Adjusts relationship depth
4. Graph renders
5. Clicks nodes for details
6. Explores connections
7. **Quick Actions**:
    - "Ask Questions" → Navigate to RAG Chat
    - "View Chunks" → See document chunks

**Data Flow**:
- Loads knowledge graph from database
- Renders nodes and connections
- Shows concept details
- Updates visualization

**Next Steps**:
- Explore different topics
- Ask questions about concepts
- View related chunks
- Navigate to other pages

---

### 6. Settings Page

**Purpose**: Platform configuration

**Entry Points**:
- Navigation menu
- User preferences

**User Flow**:
1. User arrives at Settings
2. Configures educational localization
3. Sets privacy preferences
4. Adjusts research parameters
5. Saves settings
6. Settings persisted to database
7. **Quick Actions**:
    - "Back to Dashboard" → Return to overview

**Data Flow**:
- Loads settings from database
- Updates form values
- Saves to database
- Applies settings immediately

**Next Steps**:
- Return to Dashboard
- Test settings in other pages
- Export configuration

---

## Navigation Flow

### Primary Navigation
- **Dashboard** ↔ **RAG Chat** ↔ **Smart Chunking** ↔ **Knowledge Graph** ↔ **Data Upload** ↔ **Settings**

### Quick Navigation
- Breadcrumbs: Home → Current Page
- Quick Actions: Context-aware buttons
- Keyboard Shortcuts: Ctrl/Cmd + 1-6

### Flow Indicators
- **Breadcrumbs**: Show current location
- **Progress Bar**: Show exploration progress (first visit)
- **Help Banners**: Contextual guidance

---

## First-Time User Flow

### Onboarding Sequence
1. **Welcome Modal** → Dashboard overview
2. **Upload Guide** → Data Upload page
3. **Chat Introduction** → RAG Chat page
4. **Chunking Demo** → Smart Chunking page
5. **Graph Tour** → Knowledge Graph page
6. **Completion** → Ready to use

### First-Time Experience
- Onboarding modals guide user
- Progress indicator shows exploration
- Help banners on each page
- Quick actions suggest next steps

---

## Data Flow Between Pages

### Dashboard → Upload
- User sees need for data
- Navigates to upload
- Uploads files
- Returns to dashboard with updated stats

### Upload → Chat
- Data processed
- User wants to test
- Navigates to chat
- Queries new data

### Chat → Chunking
- User curious about chunks
- Views chunks used in response
- Adjusts chunking parameters
- Returns to chat with better understanding

### Chunking → Knowledge Graph
- User wants to see relationships
- Explores concept connections
- Returns to chat with context

### Any Page → Settings
- User wants to configure
- Adjusts settings
- Returns to previous page
- Settings applied

---

## State Management

### Page State
- Current page tracked
- Page history maintained
- Visited pages recorded
- Page data stored

### Data State
- Statistics persisted
- Chat history saved
- Settings stored
- Upload status tracked

### Flow State
- First visit flag
- Onboarding status
- Progress tracking
- Help visibility

---

## User Experience Enhancements

### Page Transitions
- Smooth fade animations
- Slide transitions
- Loading states
- Error handling

### Contextual Help
- Help banners on first visit
- Tooltips for complex features
- Onboarding modals
- Quick action suggestions

### Progress Tracking
- Breadcrumbs show location
- Progress bar shows exploration
- Visited pages tracked
- Completion indicators

---

## Best Practices

### Navigation
- Always provide clear navigation paths
- Use breadcrumbs for orientation
- Offer quick actions for common tasks
- Maintain page history

### Data Flow
- Save state before navigation
- Load data on page entry
- Update statistics after actions
- Persist important data

### User Guidance
- Show help on first visit
- Provide contextual tips
- Suggest next steps
- Track user progress

---

*Flow Management System Version: 1.0*  
*Last Updated: January 2025*



