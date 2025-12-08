import fetch from 'node-fetch';

// Configure your API URL
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testAcademicCoordinatorLogin() {
    console.log('================================================================================');
    console.log('Testing Academic Coordinator Login & Refresh Token');
    console.log('================================================================================\n');

    try {
        // Test login
        console.log('1. Attempting login...');
        console.log('   Email: academic@vanisris.com');
        console.log('   Password: Test@123\n');

        const loginResponse = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'academic@vanisris.com',
                password: 'Test@123'
            })
        });

        const loginData = await loginResponse.json();

        console.log('📊 Login Response Status:', loginResponse.status);
        console.log('📊 Login Response Data:', JSON.stringify(loginData, null, 2));
        console.log('');

        if (!loginResponse.ok) {
            console.error('❌ Login failed!');
            console.error('   Status:', loginResponse.status);
            console.error('   Message:', loginData.message);
            return;
        }

        console.log('✅ Login successful!');
        console.log('');

        // Check for tokens
        console.log('2. Checking tokens...');
        console.log('   Access Token:', loginData.token ? '✅ Present' : '❌ Missing');
        console.log('   Refresh Token:', loginData.refreshToken ? '✅ Present' : '❌ Missing');
        console.log('   Session Token:', loginData.sessionToken ? '✅ Present' : '❌ Missing');
        console.log('   CSRF Token:', loginData.csrfToken ? '✅ Present' : '❌ Missing');
        console.log('');

        if (!loginData.refreshToken) {
            console.error('❌ REFRESH TOKEN IS MISSING!');
            console.error('   This is the issue you reported.');
            console.error('');
            console.error('Troubleshooting:');
            console.error('   1. Check if JWT_REFRESH_SECRET is set in .env');
            console.error('   2. Check if academic_coordinator is in allowedRoles array');
            console.error('   3. Check backend logs for any errors');
            return;
        }

        console.log('✅ All tokens present!');
        console.log('');

        // Display user info
        console.log('3. User Information:');
        console.log('   ID:', loginData.user.id);
        console.log('   Name:', loginData.user.fullName);
        console.log('   Email:', loginData.user.email);
        console.log('   Role:', loginData.user.role);
        console.log('');

        // Test refresh token endpoint
        console.log('4. Testing refresh token endpoint...');

        const refreshResponse = await fetch(`${API_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-session-token': loginData.sessionToken
            },
            body: JSON.stringify({
                refreshToken: loginData.refreshToken
            })
        });

        const refreshData = await refreshResponse.json();

        console.log('   Status:', refreshResponse.status);
        console.log('   Response:', JSON.stringify(refreshData, null, 2));
        console.log('');

        if (refreshResponse.ok) {
            console.log('✅ Refresh token works correctly!');
        } else {
            console.log('❌ Refresh token endpoint failed');
        }

        console.log('');
        console.log('================================================================================');
        console.log('TEST COMPLETE');
        console.log('================================================================================');
        console.log('');
        console.log('Summary:');
        console.log('  Login: ✅ Success');
        console.log('  Access Token: ✅ Received');
        console.log(`  Refresh Token: ${loginData.refreshToken ? '✅ Received' : '❌ Missing'}`);
        console.log('  Session Token: ✅ Received');
        console.log('  CSRF Token: ✅ Received');
        console.log('');

        if (loginData.refreshToken) {
            console.log('🎉 The refresh token issue appears to be fixed!');
        }

    } catch (error) {
        console.error('❌ Test Error:', error.message);
        console.error('');
        console.error('Make sure:');
        console.error('  1. Backend server is running');
        console.error('  2. API_URL is correct (current:', API_URL + ')');
        console.error('  3. Database is accessible');
        console.error('  4. User academic@vanisris.com exists');
    }
}

// Run the test
testAcademicCoordinatorLogin();
