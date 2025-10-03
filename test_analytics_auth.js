// Test analytics endpoint with super admin auth

const response = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'venudadi@outlook.com', password: 'Test@123' })
});

const authData = await response.json();
console.log('✅ Login successful');
console.log('Role:', authData.user.role);
console.log('Token:', authData.token.substring(0, 30) + '...');

// Now test analytics endpoint
const analyticsResponse = await fetch('http://localhost:5001/api/analytics/overview', {
    headers: {
        'Authorization': `Bearer ${authData.token}`,
        'X-Session-Token': authData.sessionToken,
        'X-CSRF-Token': authData.csrfToken
    }
});

console.log('\n📊 Analytics Endpoint Test:');
console.log('Status:', analyticsResponse.status, analyticsResponse.statusText);

if (analyticsResponse.ok) {
    const data = await analyticsResponse.json();
    console.log('✅ Analytics data received:', Object.keys(data));
} else {
    const error = await analyticsResponse.text();
    console.log('❌ Error:', error);
}
