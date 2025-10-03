import fs from 'fs';

const API_BASE = 'http://localhost:5001/api';
const FRONTEND_BASE = 'http://localhost:5173';

// Test users with their credentials
const TEST_USERS = {
    super_admin: { email: 'venudadi@outlook.com', password: 'Test@123' },
    owner: { email: 'owner@test.com', password: 'Test@123' },
    admin: { email: 'admintest@test.com', password: 'Test@123' },
    center_director: { email: 'director@test.com', password: 'Test@123' },
    financial_manager: { email: 'finance@test.com', password: 'Test@123' },
    teacher: { email: 'teachertest@test.com', password: 'Test@123' },
    parent: { email: 'parenttest@test.com', password: 'Test@123' }
};

// Test results tracker
const testResults = {
    passed: 0,
    failed: 0,
    errors: [],
    details: []
};

// Helper function to log test results
function logTest(module, test, status, details = '') {
    const result = {
        module,
        test,
        status,
        details,
        timestamp: new Date().toISOString()
    };

    testResults.details.push(result);

    if (status === 'PASS') {
        testResults.passed++;
        console.log(`✅ ${module} - ${test}: PASS`);
    } else {
        testResults.failed++;
        testResults.errors.push(result);
        console.log(`❌ ${module} - ${test}: FAIL - ${details}`);
    }
}

// Test backend health
async function testBackendHealth() {
    console.log('\n🔍 Testing Backend Health...');
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();

        if (response.ok && data.status === 'OK') {
            logTest('Backend', 'Health Check', 'PASS', `Service: ${data.service}, Uptime: ${data.uptime}s`);
        } else {
            logTest('Backend', 'Health Check', 'FAIL', 'Health endpoint returned non-OK status');
        }
    } catch (error) {
        logTest('Backend', 'Health Check', 'FAIL', error.message);
    }
}

// Test login functionality for each role
async function testLoginByRole(role, credentials) {
    console.log(`\n🔍 Testing Login for ${role}...`);
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok && data.token) {
            logTest('Authentication', `Login as ${role}`, 'PASS', `Token received: ${data.token.substring(0, 20)}...`);
            return {
                success: true,
                token: data.token,
                sessionToken: data.sessionToken,
                csrfToken: data.csrfToken,
                user: data.user
            };
        } else if (response.status === 401) {
            logTest('Authentication', `Login as ${role}`, 'FAIL', `Invalid credentials: ${data.message}`);
        } else if (response.status === 403 && data.code === 'MUST_RESET_PASSWORD') {
            logTest('Authentication', `Login as ${role}`, 'INFO', 'Password reset required');
        } else if (data.require2FA) {
            logTest('Authentication', `Login as ${role}`, 'INFO', '2FA required');
        } else {
            logTest('Authentication', `Login as ${role}`, 'FAIL', data.message || 'Unknown error');
        }

        return { success: false };
    } catch (error) {
        logTest('Authentication', `Login as ${role}`, 'FAIL', error.message);
        return { success: false };
    }
}

// Test dashboard access
async function testDashboardAccess(role, authData) {
    console.log(`\n🔍 Testing Dashboard Access for ${role}...`);

    if (!authData || !authData.success) {
        logTest('Dashboard', `Access as ${role}`, 'SKIP', 'Login failed, skipping dashboard test');
        return;
    }

    try {
        // Test user profile endpoint
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${authData.token}`,
                'X-Session-Token': authData.sessionToken,
                'X-CSRF-Token': authData.csrfToken
            }
        });

        const data = await response.json();

        if (response.ok && data.user) {
            logTest('Dashboard', `Profile Access as ${role}`, 'PASS', `User: ${data.user.email}`);
        } else {
            logTest('Dashboard', `Profile Access as ${role}`, 'FAIL', data.message || 'Unknown error');
        }
    } catch (error) {
        logTest('Dashboard', `Profile Access as ${role}`, 'FAIL', error.message);
    }
}

// Test children management (admin/teacher)
async function testChildrenManagement(role, authData) {
    if (!authData || !authData.success) return;

    console.log(`\n🔍 Testing Children Management for ${role}...`);

    try {
        const response = await fetch(`${API_BASE}/students`, {
            headers: {
                'Authorization': `Bearer ${authData.token}`,
                'X-Session-Token': authData.sessionToken,
                'X-CSRF-Token': authData.csrfToken
            }
        });

        if (response.ok) {
            const data = await response.json();
            logTest('Children Management', `Get Children as ${role}`, 'PASS', `Retrieved ${Array.isArray(data) ? data.length : 'unknown'} children`);
        } else if (response.status === 403) {
            logTest('Children Management', `Get Children as ${role}`, 'INFO', 'Access forbidden (expected for some roles)');
        } else {
            const data = await response.json();
            logTest('Children Management', `Get Children as ${role}`, 'FAIL', data.message || 'Unknown error');
        }
    } catch (error) {
        logTest('Children Management', `Get Children as ${role}`, 'FAIL', error.message);
    }
}

// Test digital portfolio access (parent/teacher)
async function testDigitalPortfolio(role, authData) {
    if (!authData || !authData.success) return;

    console.log(`\n🔍 Testing Digital Portfolio for ${role}...`);

    try {
        // Use center/all for admin roles, skip for parent/teacher without child ID
        const endpoint = ['admin', 'owner', 'super_admin'].includes(role)
            ? `${API_BASE}/digital-portfolio/center/all`
            : null;

        if (!endpoint) {
            logTest('Digital Portfolio', `Access Portfolio as ${role}`, 'INFO', 'Skipped (requires child ID parameter)');
            return;
        }

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${authData.token}`,
                'X-Session-Token': authData.sessionToken,
                'X-CSRF-Token': authData.csrfToken
            }
        });

        if (response.ok) {
            const data = await response.json();
            logTest('Digital Portfolio', `Access Portfolio as ${role}`, 'PASS', `Retrieved ${Array.isArray(data) ? data.length : 'unknown'} items`);
        } else if (response.status === 403) {
            logTest('Digital Portfolio', `Access Portfolio as ${role}`, 'INFO', 'Access forbidden (expected for some roles)');
        } else {
            const data = await response.json();
            logTest('Digital Portfolio', `Access Portfolio as ${role}`, 'FAIL', data.message || 'Unknown error');
        }
    } catch (error) {
        logTest('Digital Portfolio', `Access Portfolio as ${role}`, 'FAIL', error.message);
    }
}

// Test messaging system
async function testMessaging(role, authData) {
    if (!authData || !authData.success) return;

    console.log(`\n🔍 Testing Messaging for ${role}...`);

    try {
        const response = await fetch(`${API_BASE}/messaging/threads`, {
            headers: {
                'Authorization': `Bearer ${authData.token}`,
                'X-Session-Token': authData.sessionToken,
                'X-CSRF-Token': authData.csrfToken
            }
        });

        if (response.ok) {
            const data = await response.json();
            logTest('Messaging', `Get Messages as ${role}`, 'PASS', `Retrieved ${Array.isArray(data) ? data.length : 'unknown'} threads`);
        } else if (response.status === 403) {
            logTest('Messaging', `Get Messages as ${role}`, 'INFO', 'Access forbidden (expected for some roles)');
        } else {
            const data = await response.json();
            logTest('Messaging', `Get Messages as ${role}`, 'FAIL', data.message || 'Unknown error');
        }
    } catch (error) {
        logTest('Messaging', `Get Messages as ${role}`, 'FAIL', error.message);
    }
}

// Test financial features (financial_manager/owner)
async function testFinancialFeatures(role, authData) {
    if (!authData || !authData.success) return;

    console.log(`\n🔍 Testing Financial Features for ${role}...`);

    try {
        const response = await fetch(`${API_BASE}/invoices`, {
            headers: {
                'Authorization': `Bearer ${authData.token}`,
                'X-Session-Token': authData.sessionToken,
                'X-CSRF-Token': authData.csrfToken
            }
        });

        if (response.ok) {
            const data = await response.json();
            logTest('Financial', `Get Invoices as ${role}`, 'PASS', `Retrieved ${Array.isArray(data) ? data.length : 'unknown'} invoices`);
        } else if (response.status === 403) {
            logTest('Financial', `Get Invoices as ${role}`, 'INFO', 'Access forbidden (expected for some roles)');
        } else {
            const data = await response.json();
            logTest('Financial', `Get Invoices as ${role}`, 'FAIL', data.message || 'Unknown error');
        }
    } catch (error) {
        logTest('Financial', `Get Invoices as ${role}`, 'FAIL', error.message);
    }
}

// Main test execution
async function runE2ETests() {
    console.log('🚀 Starting E2E Test Suite...\n');
    console.log('='.repeat(60));

    // Test 1: Backend Health
    await testBackendHealth();

    // Test 2: Login for all roles and test their specific features
    const authResults = {};

    for (const [role, credentials] of Object.entries(TEST_USERS)) {
        authResults[role] = await testLoginByRole(role, credentials);

        // Add a small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test 3: Dashboard access for each role
    for (const [role, authData] of Object.entries(authResults)) {
        await testDashboardAccess(role, authData);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test 4: Children management (admin, teacher)
    for (const role of ['admin', 'teacher']) {
        if (authResults[role]) {
            await testChildrenManagement(role, authResults[role]);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Test 5: Digital Portfolio (admin, owner, super_admin only - parent/teacher need child ID)
    for (const role of ['admin', 'owner', 'super_admin', 'parent', 'teacher']) {
        if (authResults[role]) {
            await testDigitalPortfolio(role, authResults[role]);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Test 6: Messaging (all roles)
    for (const [role, authData] of Object.entries(authResults)) {
        await testMessaging(role, authData);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test 7: Financial features (financial_manager, owner)
    for (const role of ['financial_manager', 'owner']) {
        if (authResults[role]) {
            await testFinancialFeatures(role, authResults[role]);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Total: ${testResults.passed + testResults.failed}`);
    console.log(`📉 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);

    if (testResults.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.errors.forEach(error => {
            console.log(`  - ${error.module} > ${error.test}: ${error.details}`);
        });
    }

    // Save detailed results to file
    const reportPath = './testing_logs/e2e_test_report.json';
    fs.mkdirSync('./testing_logs', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Run tests
runE2ETests().catch(console.error);
