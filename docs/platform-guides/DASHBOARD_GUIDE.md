# Dashboard User Guide

**EduLLM Platform - Dashboard Tab Complete Guide**

---

## 📊 Overview

The Dashboard is the central hub of the EduLLM Platform. It provides real-time metrics, activity tracking, and curriculum coverage visualization.

---

## ✨ Features

### 1. Real-Time Metrics

Four key performance indicators updated automatically every 5 seconds:

- **Documents Indexed** - Total number of text chunks in the system
- **Queries Processed** - Number of search queries performed
- **Accuracy Rate** - Average precision across all experiments
- **Avg Response Time** - Average time to respond to queries

### 2. Activity Feed

Shows the latest 5 activities with timestamps:
- Data uploads
- Experiments created
- Reports generated
- System updates

Activities are automatically tracked and displayed with:
- Icon indicator
- Descriptive message
- Relative timestamp ("2 hours ago", "Just now", etc.)

### 3. Curriculum Coverage

Visual progress bars showing coverage percentage for:
- Mathematics (Blue)
- Physics (Purple)
- Chemistry (Pink)
- Biology (Green)

Coverage increases automatically when:
- NCERT PDFs are uploaded
- Content is indexed
- Data is processed

### 4. Quick Start Guide

Shown on first visit with three steps:
1. Upload NCERT Data
2. Start Chatting
3. Explore Features

Can be dismissed and won't show again.

---

## 🚀 Getting Started

### Step 1: Open the Platform

```bash
cd edullm-platform
# Serve the files (use any method)
python -m http.server 8080
# or
npx http-server -p 8080
```

Navigate to: `http://localhost:8080`

### Step 2: Run Tests

Open browser console (F12) and run:

```javascript
// Load test script
const script = document.createElement('script');
script.src = 'test-dashboard.js';
document.head.appendChild(script);
```

You should see:
- ✅ ALL TESTS PASSED!
- Dashboard demo data loaded
- Metrics displaying

### Step 3: Verify Dashboard

1. **Check Metrics Cards** - Should show numbers (not "0" or "--")
2. **Check Activity Feed** - Should show 3 demo activities
3. **Check Progress Bars** - Should show colored bars with percentages
4. **Auto-refresh** - Metrics should update every 5 seconds

---

## 🎮 Using the Dashboard

### View Current Status

Simply navigate to the Dashboard tab (it's the first tab, default view).

All metrics update automatically!

### Add Custom Activity

```javascript
window.dashboardManager.addActivity('icon-name', 'Your message here');
```

**Available Icons:**
- `upload` - Upload icon
- `flask` - Experiment icon
- `chart-line` - Analytics icon
- `brain` - AI/Processing icon
- `database` - Data icon
- `check` - Success icon

**Example:**
```javascript
window.dashboardManager.addActivity('upload', 'New Physics textbook uploaded');
```

### Manual Refresh

```javascript
window.dashboardManager.refresh();
```

### Update Specific Metrics

```javascript
// Set custom values
window.dashboardManager.metrics.documentsIndexed = 500;
window.dashboardManager.metrics.queriesProcessed = 120;
window.dashboardManager.metrics.accuracyRate = 92.5;
window.dashboardManager.metrics.avgResponseTime = 1.5;

// Update display
window.dashboardManager.updateMetricsDisplay();
window.dashboardManager.saveToStorage();
```

### Set Curriculum Coverage

```javascript
// Update coverage (0-100)
window.dashboardManager.curriculumCoverage.mathematics = 85;
window.dashboardManager.curriculumCoverage.physics = 70;
window.dashboardManager.curriculumCoverage.chemistry = 60;
window.dashboardManager.curriculumCoverage.biology = 50;

// Update display
window.dashboardManager.updateCurriculumDisplay();
window.dashboardManager.saveToStorage();
```

---

## 🔧 Advanced Features

### Export Dashboard Data

```javascript
window.dashboardManager.exportData();
```

Downloads JSON file with:
- All metrics
- Activity history
- Curriculum coverage
- Export timestamp

### Reset Dashboard

```javascript
window.dashboardManager.reset();
```

Clears all data (asks for confirmation first).

### Stop Auto-Refresh

```javascript
window.dashboardManager.stopAutoRefresh();
```

### Start Auto-Refresh

```javascript
window.dashboardManager.startAutoRefresh();
```

### Access Raw Data

```javascript
// View metrics
console.log(window.dashboardManager.metrics);

// View activities
console.log(window.dashboardManager.activities);

// View coverage
console.log(window.dashboardManager.curriculumCoverage);
```

---

## 🧪 Testing Scenarios

### Scenario 1: Fresh Install

```javascript
// Clear all data
window.dashboardManager.reset();

// Verify empty state
console.log('Docs:', window.dashboardManager.metrics.documentsIndexed); // Should be 0
console.log('Activities:', window.dashboardManager.activities.length); // Should be 0
```

### Scenario 2: Simulate Data Upload

```javascript
// Add upload activity
window.dashboardManager.addActivity('upload', 'NCERT Mathematics Grade 10 uploaded');

// Update metrics
window.dashboardManager.metrics.documentsIndexed = 150;
window.dashboardManager.curriculumCoverage.mathematics = 100;

// Refresh display
window.dashboardManager.refresh();
```

### Scenario 3: Simulate Experiment

```javascript
// Add experiment activity
window.dashboardManager.addActivity('flask', 'RAG optimization experiment started');

// Update metrics
window.dashboardManager.metrics.queriesProcessed += 30;
window.dashboardManager.metrics.accuracyRate = 88.5;
window.dashboardManager.metrics.avgResponseTime = 1.3;

// Refresh
window.dashboardManager.refresh();
```

### Scenario 4: Simulate Report Generation

```javascript
// Add report activity
window.dashboardManager.addActivity('chart-line', 'Weekly analytics report generated');

// Update metrics
window.dashboardManager.metrics.queriesProcessed += 5;

// Refresh
window.dashboardManager.refresh();
```

---

## 📊 Integration with Other Modules

### Auto-Integration with RAG System

When `window.ragSystem` exists, Dashboard automatically:
- Counts indexed documents
- Updates documents metric
- Shows in real-time

### Auto-Integration with Experiments

When `window.experimentTracker` exists, Dashboard automatically:
- Calculates accuracy from experiment metrics
- Computes average response time
- Updates every 5 seconds

### Auto-Integration with Data Upload

When PDFs are uploaded, Dashboard automatically:
- Increments curriculum coverage
- Adds upload activity
- Updates document count

---

## 🐛 Troubleshooting

### Issue: Metrics showing 0 or --

**Solution:**
```javascript
// Check if data exists
console.log('RAG System:', window.ragSystem?.data?.length);
console.log('Experiments:', window.experimentTracker?.getAllExperiments()?.length);

// Manually refresh
window.dashboardManager.refresh();
```

### Issue: Activities not showing

**Solution:**
```javascript
// Check activities array
console.log(window.dashboardManager.activities);

// Add test activity
window.dashboardManager.addActivity('test', 'Test activity');
```

### Issue: Progress bars at 0%

**Solution:**
```javascript
// Manually set coverage
window.dashboardManager.curriculumCoverage.mathematics = 25;
window.dashboardManager.updateCurriculumDisplay();
window.dashboardManager.saveToStorage();
```

### Issue: Auto-refresh not working

**Solution:**
```javascript
// Stop and restart
window.dashboardManager.stopAutoRefresh();
window.dashboardManager.startAutoRefresh();

// Check interval
console.log('Interval:', window.dashboardManager.updateInterval);
```

---

## 💡 Best Practices

1. **Regular Monitoring**
   - Check Dashboard daily for insights
   - Monitor accuracy trends
   - Track response time improvements

2. **Data Management**
   - Export data weekly for backup
   - Clear old activities periodically
   - Keep coverage updated

3. **Performance**
   - Let auto-refresh run (minimal overhead)
   - Export large datasets instead of storing
   - Reset if data becomes stale

4. **Activity Tracking**
   - Add activities for important events
   - Use consistent icon naming
   - Keep messages concise and clear

---

## 📈 Future Enhancements

Planned features for Dashboard:
- [ ] Charts and graphs for metrics
- [ ] Historical trend analysis
- [ ] Customizable metric cards
- [ ] Downloadable reports
- [ ] Alert thresholds
- [ ] Multiple dashboards
- [ ] Team collaboration features

---

## ✅ Dashboard Completion Checklist

- [x] Real-time metrics tracking
- [x] Activity feed with timestamps
- [x] Curriculum coverage visualization
- [x] Auto-refresh every 5 seconds
- [x] Data persistence (localStorage)
- [x] Integration with RAG system
- [x] Integration with experiments
- [x] Export functionality
- [x] Reset functionality
- [x] Quick start guide
- [x] Comprehensive testing
- [x] User documentation

---

## 📞 Support

If you encounter issues:

1. Run the test script: Load `test-dashboard.js`
2. Check browser console for errors
3. Verify localStorage: Check Application tab in DevTools
4. Try resetting: `window.dashboardManager.reset()`

---

**Dashboard Status: ✅ FULLY FUNCTIONAL**

**Last Updated:** 2025-01-11
**Version:** 1.0.0
**Module:** dashboard-manager.js
