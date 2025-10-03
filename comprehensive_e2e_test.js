/**
 * Comprehensive End-to-End Testing Suite
 * Tests all functionality and identifies optimization opportunities
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5001';
const TEST_RESULTS = [];
const PERFORMANCE_METRICS = [];
const ISSUES_FOUND = [];

// Test credentials from TEST_CREDENTIALS.txt
const TEST_USERS = {
    super_admin: { email: 'superadmin@preschool.com', password: 'Test@123' },
    owner: { email: 'owner@preschool.com', password: 'Test@123' },
    financial_manager: { email: 'finance@preschool.com', password: 'Test@123' },
    center_director: { email: 'director@preschool.com', password: 'Test@123' },
    admin: { email: 'admin@preschool.com', password: 'Test@123' },
    academic_coordinator: { email: 'academic@preschool.com', password: 'Test@123' },
    teacher: { email: 'teacher@preschool.com', password: 'Test@123' },
    parent: { email: 'parent@preschool.com', password: 'Test@123' }
};

// Store auth tokens
const AUTH_TOKENS = {};

class E2ETestSuite {
    constructor() {
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    // Utility: Make HTTP request with timing
    async makeRequest(method, endpoint, data = null, token = null, role = null) {
        const startTime = Date.now();
        const url = `${BASE_URL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            if (AUTH_TOKENS[role]?.sessionToken) {
                headers['X-Session-Token'] = AUTH_TOKENS[role].sessionToken;
            }
            if (AUTH_TOKENS[role]?.csrfToken) {
                headers['X-CSRF-Token'] = AUTH_TOKENS[role].csrfToken;
            }
        }

        try {
            const options = {
                method,
                headers
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            const responseTime = Date.now() - startTime;
            const contentType = response.headers.get('content-type');

            let responseData;
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            PERFORMANCE_METRICS.push({
                endpoint,
                method,
                responseTime,
                status: response.status,
                role
            });

            // Flag slow requests
            if (responseTime > 2000) {
                ISSUES_FOUND.push({
                    type: 'performance',
                    severity: 'warning',
                    message: `Slow response: ${endpoint} took ${responseTime}ms`,
                    endpoint,
                    responseTime
                });
            }

            return {
                success: response.ok,
                status: response.status,
                data: responseData,
                responseTime
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            ISSUES_FOUND.push({
                type: 'error',
                severity: 'critical',
                message: `Request failed: ${endpoint} - ${error.message}`,
                endpoint,
                error: error.message
            });

            return {
                success: false,
                status: 0,
                error: error.message,
                responseTime
            };
        }
    }

    // Test result logging
    logTest(testName, passed, details = {}) {
        this.totalTests++;
        if (passed) {
            this.passedTests++;
            console.log(`  ✅ ${testName}`);
        } else {
            this.failedTests++;
            console.log(`  ❌ ${testName}`);
            if (details.error) {
                console.log(`     Error: ${details.error}`);
            }
        }

        TEST_RESULTS.push({
            testName,
            passed,
            ...details
        });
    }

    // 1. Authentication Tests
    async testAuthentication() {
        console.log('\n🔐 Testing Authentication...');

        for (const [role, credentials] of Object.entries(TEST_USERS)) {
            const result = await this.makeRequest('POST', '/api/auth/login', credentials);

            if (result.success && result.data.token) {
                AUTH_TOKENS[role] = {
                    token: result.data.token,
                    sessionToken: result.data.sessionToken,
                    csrfToken: result.data.csrfToken,
                    user: result.data.user
                };
                this.logTest(`Login as ${role}`, true, { responseTime: result.responseTime });
            } else {
                this.logTest(`Login as ${role}`, false, { error: result.error || result.data?.message });
            }
        }
    }

    // 2. Dashboard Access Tests
    async testDashboardAccess() {
        console.log('\n📊 Testing Dashboard Access...');

        for (const [role, auth] of Object.entries(AUTH_TOKENS)) {
            if (!auth) continue;

            const result = await this.makeRequest('GET', '/api/analytics/overview', null, auth.token, role);
            this.logTest(`${role} dashboard access`, result.success, {
                status: result.status,
                responseTime: result.responseTime
            });
        }
    }

    // 3. Financial Manager Specific Tests
    async testFinancialManager() {
        console.log('\n💰 Testing Financial Manager Features...');

        const fmAuth = AUTH_TOKENS.financial_manager;
        if (!fmAuth) {
            console.log('  ⚠️  Financial Manager not authenticated, skipping...');
            return;
        }

        // Test dashboard
        const dashboard = await this.makeRequest('GET', '/api/financial-manager/dashboard', null, fmAuth.token, 'financial_manager');
        this.logTest('FM Dashboard', dashboard.success, {
            responseTime: dashboard.responseTime,
            dataReceived: !!dashboard.data?.overview
        });

        // Test budget limits
        const budgetLimits = await this.makeRequest('GET', '/api/financial-manager/budget-limits', null, fmAuth.token, 'financial_manager');
        this.logTest('FM Budget Limits', budgetLimits.success, { responseTime: budgetLimits.responseTime });

        // Test expenses view
        const expenses = await this.makeRequest('GET', '/api/expenses', null, fmAuth.token, 'financial_manager');
        this.logTest('FM Expenses View', expenses.success, { responseTime: expenses.responseTime });

        // Test expense logging
        const newExpense = {
            amount: 1000,
            category: 'supplies',
            description: 'Test expense entry',
            date: new Date().toISOString().split('T')[0]
        };
        const logExpense = await this.makeRequest('POST', '/api/expenses/log', newExpense, fmAuth.token, 'financial_manager');
        this.logTest('FM Log Expense', logExpense.success, { responseTime: logExpense.responseTime });

        // Test export
        const exportTest = await this.makeRequest('GET', '/api/expenses/export', null, fmAuth.token, 'financial_manager');
        this.logTest('FM Export Expenses', exportTest.success, { responseTime: exportTest.responseTime });
    }

    // 4. Role-Based Access Control Tests
    async testRBACEnforcement() {
        console.log('\n🔒 Testing Role-Based Access Control...');

        // Test parent cannot access admin endpoints
        const parentAuth = AUTH_TOKENS.parent;
        if (parentAuth) {
            const result = await this.makeRequest('GET', '/api/staff', null, parentAuth.token, 'parent');
            this.logTest('Parent blocked from staff endpoint', !result.success && result.status === 403, {
                status: result.status
            });
        }

        // Test teacher cannot access financial endpoints
        const teacherAuth = AUTH_TOKENS.teacher;
        if (teacherAuth) {
            const result = await this.makeRequest('GET', '/api/financial-manager/dashboard', null, teacherAuth.token, 'teacher');
            this.logTest('Teacher blocked from financial endpoint', !result.success && result.status === 403, {
                status: result.status
            });
        }
    }

    // 5. Database Performance Tests
    async testDatabasePerformance() {
        console.log('\n🗄️  Testing Database Performance...');

        const superAdminAuth = AUTH_TOKENS.super_admin;
        if (!superAdminAuth) return;

        // Test heavy query (all users)
        const usersQuery = await this.makeRequest('GET', '/api/owners', null, superAdminAuth.token, 'super_admin');
        this.logTest('Fetch all users', usersQuery.success, {
            responseTime: usersQuery.responseTime,
            slowQuery: usersQuery.responseTime > 1000
        });

        // Test children query
        const childrenQuery = await this.makeRequest('GET', '/api/children', null, superAdminAuth.token, 'super_admin');
        this.logTest('Fetch children', childrenQuery.success, {
            responseTime: childrenQuery.responseTime
        });

        // Test centers query
        const centersQuery = await this.makeRequest('GET', '/api/centers', null, superAdminAuth.token, 'super_admin');
        this.logTest('Fetch centers', centersQuery.success, {
            responseTime: centersQuery.responseTime
        });
    }

    // 6. API Endpoint Coverage
    async testCriticalEndpoints() {
        console.log('\n🌐 Testing Critical Endpoints...');

        const adminAuth = AUTH_TOKENS.admin;
        if (!adminAuth) return;

        const endpoints = [
            { method: 'GET', path: '/api/classrooms', name: 'Classrooms' },
            { method: 'GET', path: '/api/attendance', name: 'Attendance' },
            { method: 'GET', path: '/api/invoices', name: 'Invoices' }
        ];

        for (const endpoint of endpoints) {
            const result = await this.makeRequest(endpoint.method, endpoint.path, null, adminAuth.token, 'admin');
            this.logTest(`${endpoint.name} endpoint`, result.success, {
                status: result.status,
                responseTime: result.responseTime
            });
        }
    }

    // 7. Concurrent Request Stress Test
    async testConcurrentRequests() {
        console.log('\n⚡ Testing Concurrent Request Handling...');

        const superAdminAuth = AUTH_TOKENS.super_admin;
        if (!superAdminAuth) return;

        const startTime = Date.now();
        const promises = [];

        // Make 10 concurrent requests
        for (let i = 0; i < 10; i++) {
            promises.push(
                this.makeRequest('GET', '/api/analytics/overview', null, superAdminAuth.token, 'super_admin')
            );
        }

        const results = await Promise.all(promises);
        const totalTime = Date.now() - startTime;
        const successCount = results.filter(r => r.success).length;

        this.logTest('Concurrent requests (10)', successCount === 10, {
            totalTime,
            successRate: `${successCount}/10`,
            avgResponseTime: totalTime / 10
        });

        if (totalTime > 5000) {
            ISSUES_FOUND.push({
                type: 'performance',
                severity: 'warning',
                message: `Concurrent requests took ${totalTime}ms (expected < 5000ms)`,
                totalTime
            });
        }
    }

    // 8. Error Handling Tests
    async testErrorHandling() {
        console.log('\n🚨 Testing Error Handling...');

        // Test invalid credentials
        const invalidLogin = await this.makeRequest('POST', '/api/auth/login', {
            email: 'invalid@test.com',
            password: 'wrongpassword'
        });
        this.logTest('Invalid login returns 401', invalidLogin.status === 401, {
            status: invalidLogin.status
        });

        // Test unauthorized access
        const noAuthAccess = await this.makeRequest('GET', '/api/staff');
        this.logTest('No auth returns 401', noAuthAccess.status === 401, {
            status: noAuthAccess.status
        });

        // Test invalid data
        const invalidData = await this.makeRequest('POST', '/api/auth/login', {
            email: 'notanemail',
            password: '123'
        });
        this.logTest('Invalid data handled', !invalidData.success, {
            status: invalidData.status
        });
    }

    // Generate comprehensive report
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📋 COMPREHENSIVE E2E TEST REPORT');
        console.log('='.repeat(80));

        // Summary
        console.log('\n📊 SUMMARY:');
        console.log(`   Total Tests: ${this.totalTests}`);
        console.log(`   ✅ Passed: ${this.passedTests} (${(this.passedTests/this.totalTests*100).toFixed(1)}%)`);
        console.log(`   ❌ Failed: ${this.failedTests} (${(this.failedTests/this.totalTests*100).toFixed(1)}%)`);

        // Performance Analysis
        console.log('\n⚡ PERFORMANCE ANALYSIS:');
        const avgResponseTime = PERFORMANCE_METRICS.reduce((sum, m) => sum + m.responseTime, 0) / PERFORMANCE_METRICS.length;
        const slowRequests = PERFORMANCE_METRICS.filter(m => m.responseTime > 1000);
        const fastestRequest = PERFORMANCE_METRICS.reduce((min, m) => m.responseTime < min.responseTime ? m : min);
        const slowestRequest = PERFORMANCE_METRICS.reduce((max, m) => m.responseTime > max.responseTime ? m : max);

        console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
        console.log(`   Fastest: ${fastestRequest.endpoint} (${fastestRequest.responseTime}ms)`);
        console.log(`   Slowest: ${slowestRequest.endpoint} (${slowestRequest.responseTime}ms)`);
        console.log(`   Slow Requests (>1s): ${slowRequests.length}`);

        // Issues Found
        console.log('\n🔍 ISSUES FOUND:');
        if (ISSUES_FOUND.length === 0) {
            console.log('   ✅ No critical issues detected!');
        } else {
            const critical = ISSUES_FOUND.filter(i => i.severity === 'critical');
            const warnings = ISSUES_FOUND.filter(i => i.severity === 'warning');

            console.log(`   🚨 Critical: ${critical.length}`);
            console.log(`   ⚠️  Warnings: ${warnings.length}`);

            console.log('\n   Critical Issues:');
            critical.forEach(issue => {
                console.log(`      - ${issue.message}`);
            });

            console.log('\n   Warnings:');
            warnings.slice(0, 5).forEach(issue => {
                console.log(`      - ${issue.message}`);
            });
        }

        // Optimization Recommendations
        console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
        const recommendations = this.generateRecommendations();
        recommendations.forEach((rec, i) => {
            console.log(`   ${i + 1}. ${rec}`);
        });

        // Save detailed report to file
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.totalTests,
                passed: this.passedTests,
                failed: this.failedTests,
                successRate: (this.passedTests/this.totalTests*100).toFixed(1) + '%'
            },
            performance: {
                avgResponseTime: avgResponseTime.toFixed(0) + 'ms',
                slowRequests: slowRequests.length,
                metrics: PERFORMANCE_METRICS
            },
            issues: ISSUES_FOUND,
            testResults: TEST_RESULTS,
            recommendations
        };

        fs.writeFileSync(
            path.join(process.cwd(), 'E2E_TEST_REPORT.json'),
            JSON.stringify(reportData, null, 2)
        );

        console.log('\n💾 Detailed report saved to: E2E_TEST_REPORT.json');
        console.log('='.repeat(80));
    }

    generateRecommendations() {
        const recommendations = [];

        // Response time recommendations
        const avgTime = PERFORMANCE_METRICS.reduce((sum, m) => sum + m.responseTime, 0) / PERFORMANCE_METRICS.length;
        if (avgTime > 500) {
            recommendations.push('Add database indexes for frequently queried fields');
            recommendations.push('Implement Redis caching for dashboard data');
        }

        // Slow endpoint recommendations
        const slowEndpoints = PERFORMANCE_METRICS.filter(m => m.responseTime > 1000);
        if (slowEndpoints.length > 0) {
            recommendations.push(`Optimize slow endpoints: ${[...new Set(slowEndpoints.map(e => e.endpoint))].join(', ')}`);
        }

        // Error recommendations
        const errors = ISSUES_FOUND.filter(i => i.type === 'error');
        if (errors.length > 0) {
            recommendations.push('Fix failing endpoints to ensure 100% API reliability');
        }

        // General recommendations
        recommendations.push('Enable response compression (gzip) on backend');
        recommendations.push('Implement pagination for large dataset endpoints');
        recommendations.push('Add request rate limiting to prevent abuse');
        recommendations.push('Set up monitoring and alerting for production');

        return recommendations;
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Comprehensive E2E Testing...');
        console.log('   Target: ' + BASE_URL);
        console.log('   Date: ' + new Date().toISOString());

        try {
            await this.testAuthentication();
            await this.testDashboardAccess();
            await this.testFinancialManager();
            await this.testRBACEnforcement();
            await this.testDatabasePerformance();
            await this.testCriticalEndpoints();
            await this.testConcurrentRequests();
            await this.testErrorHandling();

            this.generateReport();
        } catch (error) {
            console.error('\n❌ Test suite failed:', error);
            process.exit(1);
        }
    }
}

// Run tests
const testSuite = new E2ETestSuite();
testSuite.runAllTests().then(() => {
    process.exit(testSuite.failedTests > 0 ? 1 : 0);
});
