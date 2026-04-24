/**
 * Dashboard Testing Script
 * Complete test suite for Dashboard functionality
 */

(async function testDashboard() {
    console.log('🧪 TESTING DASHBOARD - COMPLETE FUNCTIONALITY');
    console.log('='.repeat(60));

    let testsPassed = 0;
    let testsFailed = 0;

    // Helper function for tests
    function test(name, condition) {
        if (condition) {
            console.log(`✅ ${name}`);
            testsPassed++;
        } else {
            console.error(`❌ ${name}`);
            testsFailed++;
        }
    }

    // Test 1: Dashboard Manager Loaded
    console.log('\n📦 Test 1: Module Loading');
    test('Dashboard Manager exists', typeof window.dashboardManager === 'object');
    test('Dashboard Manager initialized', window.dashboardManager.initialized === true);

    // Test 2: Metrics System
    console.log('\n📊 Test 2: Metrics System');
    test('Metrics object exists', window.dashboardManager.metrics !== undefined);
    test('Documents metric exists', typeof window.dashboardManager.metrics.documentsIndexed === 'number');
    test('Queries metric exists', typeof window.dashboardManager.metrics.queriesProcessed === 'number');
    test('Accuracy metric exists', typeof window.dashboardManager.metrics.accuracyRate !== 'undefined');
    test('Response time metric exists', typeof window.dashboardManager.metrics.avgResponseTime !== 'undefined');

    // Test 3: Activity Tracking
    console.log('\n📝 Test 3: Activity Tracking');
    test('Activities array exists', Array.isArray(window.dashboardManager.activities));

    // Add test activity
    window.dashboardManager.addActivity('test', 'Test activity added');
    test('Can add activity', window.dashboardManager.activities.length > 0);
    test('Activity has correct structure',
        window.dashboardManager.activities[0].icon &&
        window.dashboardManager.activities[0].message &&
        window.dashboardManager.activities[0].timestamp
    );

    // Test 4: Curriculum Coverage
    console.log('\n📚 Test 4: Curriculum Coverage');
    test('Coverage object exists', window.dashboardManager.curriculumCoverage !== undefined);
    test('Mathematics coverage exists', typeof window.dashboardManager.curriculumCoverage.mathematics === 'number');
    test('Physics coverage exists', typeof window.dashboardManager.curriculumCoverage.physics === 'number');
    test('Chemistry coverage exists', typeof window.dashboardManager.curriculumCoverage.chemistry === 'number');
    test('Biology coverage exists', typeof window.dashboardManager.curriculumCoverage.biology === 'number');

    // Test 5: Storage Functionality
    console.log('\n💾 Test 5: Data Persistence');
    window.dashboardManager.saveToStorage();
    test('Can save to localStorage',
        localStorage.getItem('dashboard_metrics') !== null
    );
    test('Can save activities',
        localStorage.getItem('dashboard_activities') !== null
    );
    test('Can save coverage',
        localStorage.getItem('dashboard_coverage') !== null
    );

    // Test 6: Refresh Functionality
    console.log('\n🔄 Test 6: Refresh System');
    try {
        window.dashboardManager.refreshMetrics();
        test('Can refresh metrics', true);
    } catch (error) {
        test('Can refresh metrics', false);
    }

    // Test 7: UI Elements
    console.log('\n🖥️  Test 7: UI Integration');
    test('Documents element exists', document.getElementById('documentsIndexed') !== null);
    test('Queries element exists', document.getElementById('queriesProcessed') !== null);
    test('Accuracy element exists', document.getElementById('accuracyRate') !== null);
    test('Response time element exists', document.getElementById('avgResponseTime') !== null);
    test('Activity list exists', document.querySelector('.activity-list') !== null);
    test('Coverage list exists', document.querySelector('.coverage-list') !== null);

    // Test 8: Display Updates
    console.log('\n🎨 Test 8: Display Updates');
    try {
        window.dashboardManager.updateMetricsDisplay();
        test('Can update metrics display', true);
    } catch (error) {
        test('Can update metrics display', false);
    }

    try {
        window.dashboardManager.updateActivityDisplay();
        test('Can update activity display', true);
    } catch (error) {
        test('Can update activity display', false);
    }

    try {
        window.dashboardManager.updateCurriculumDisplay();
        test('Can update curriculum display', true);
    } catch (error) {
        test('Can update curriculum display', false);
    }

    // Test 9: Auto-refresh
    console.log('\n⏰ Test 9: Auto-refresh');
    test('Auto-refresh interval exists', window.dashboardManager.updateInterval !== null);

    // Test 10: Utility Functions
    console.log('\n🛠️  Test 10: Utility Functions');
    test('formatNumber works',
        window.dashboardManager.formatNumber(1000) === '1,000'
    );
    test('formatTimeAgo works',
        typeof window.dashboardManager.formatTimeAgo(Date.now()) === 'string'
    );

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

    if (testsFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Dashboard is fully functional!');
    } else {
        console.log('\n⚠️  Some tests failed. Review errors above.');
    }

    // Bonus: Demo Dashboard Functionality
    console.log('\n' + '='.repeat(60));
    console.log('🎬 DASHBOARD DEMO');
    console.log('='.repeat(60));

    console.log('\n1️⃣  Adding demo activities...');
    window.dashboardManager.addActivity('upload', 'Sample NCERT data uploaded');
    window.dashboardManager.addActivity('flask', 'New experiment created');
    window.dashboardManager.addActivity('chart-line', 'Analytics report generated');
    console.log('   ✅ 3 activities added');

    console.log('\n2️⃣  Setting demo metrics...');
    window.dashboardManager.metrics.documentsIndexed = 150;
    window.dashboardManager.metrics.queriesProcessed = 45;
    window.dashboardManager.metrics.accuracyRate = 87.5;
    window.dashboardManager.metrics.avgResponseTime = 1.8;
    console.log('   ✅ Metrics updated');

    console.log('\n3️⃣  Setting curriculum coverage...');
    window.dashboardManager.curriculumCoverage.mathematics = 75;
    window.dashboardManager.curriculumCoverage.physics = 60;
    window.dashboardManager.curriculumCoverage.chemistry = 45;
    window.dashboardManager.curriculumCoverage.biology = 30;
    console.log('   ✅ Coverage updated');

    console.log('\n4️⃣  Refreshing displays...');
    window.dashboardManager.updateMetricsDisplay();
    window.dashboardManager.updateActivityDisplay();
    window.dashboardManager.updateCurriculumDisplay();
    console.log('   ✅ All displays refreshed');

    console.log('\n5️⃣  Saving to localStorage...');
    window.dashboardManager.saveToStorage();
    console.log('   ✅ Data persisted');

    console.log('\n' + '='.repeat(60));
    console.log('✅ DASHBOARD DEMO COMPLETE!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Navigate to Dashboard tab to see the changes');
    console.log('   2. Check that all metrics are displaying correctly');
    console.log('   3. Verify activity feed shows 3 items');
    console.log('   4. Confirm curriculum progress bars are visible');
    console.log('\n💡 Useful Commands:');
    console.log('   window.dashboardManager.refresh() - Manual refresh');
    console.log('   window.dashboardManager.addActivity(icon, msg) - Add activity');
    console.log('   window.dashboardManager.exportData() - Export data');
    console.log('   window.dashboardManager.reset() - Reset dashboard');

    return {
        passed: testsPassed,
        failed: testsFailed,
        success: testsFailed === 0
    };
})();
