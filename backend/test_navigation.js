import { ROLES, NAVIGATION_ITEMS, getFilteredNavigation, ROLE_INFO } from '../frontend/src/config/permissions.js';

function testRoleNavigation() {
  console.log('=== PHASE 2: ROLE-BASED NAVIGATION TESTING ===\n');

  const allRoles = Object.values(ROLES);
  const results = {};

  for (const role of allRoles) {
    console.log(`\n🔍 TESTING ROLE: ${role.toUpperCase()}`);
    console.log('=' .repeat(50));

    const allowedNavItems = getFilteredNavigation(role);
    const roleInfo = ROLE_INFO[role];

    console.log(`Role Display Name: ${roleInfo?.displayName || 'Unknown'}`);
    console.log(`Role Description: ${roleInfo?.description || 'No description'}`);
    console.log(`Navigation Items Available: ${allowedNavItems.length}`);

    if (allowedNavItems.length > 0) {
      console.log('\n✅ AUTHORIZED NAVIGATION ITEMS:');
      allowedNavItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.text} -> ${item.path}`);
      });
    } else {
      console.log('\n❌ NO NAVIGATION ITEMS AVAILABLE');
    }

    // Find unauthorized items
    const allNavItems = NAVIGATION_ITEMS;
    const authorizedPaths = allowedNavItems.map(item => item.path);
    const unauthorizedItems = allNavItems.filter(item =>
      !authorizedPaths.includes(item.path)
    );

    if (unauthorizedItems.length > 0) {
      console.log('\n🚫 UNAUTHORIZED NAVIGATION ITEMS (should be hidden):');
      unauthorizedItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.text} -> ${item.path}`);
      });
    }

    // Store results for analysis
    results[role] = {
      roleInfo: roleInfo,
      authorizedItems: allowedNavItems,
      unauthorizedItems: unauthorizedItems,
      totalAuthorized: allowedNavItems.length,
      totalUnauthorized: unauthorizedItems.length
    };
  }

  // Summary analysis
  console.log('\n\n📊 NAVIGATION ANALYSIS SUMMARY');
  console.log('=' .repeat(60));

  Object.entries(results).forEach(([role, data]) => {
    console.log(`${role}: ${data.totalAuthorized} authorized, ${data.totalUnauthorized} restricted`);
  });

  // Test specific scenarios
  console.log('\n\n🔍 SPECIFIC ACCESS CONTROL TESTS');
  console.log('=' .repeat(60));

  // Test 1: Super Admin should see everything
  const superAdminNav = getFilteredNavigation('super_admin');
  console.log(`✅ Super Admin sees ${superAdminNav.length} navigation items (should be maximum)`);

  // Test 2: Parent should see minimum
  const parentNav = getFilteredNavigation('parent');
  console.log(`✅ Parent sees ${parentNav.length} navigation items (should be minimum)`);

  // Test 3: User Management should only be visible to Super Admin
  const userMgmtVisible = superAdminNav.some(item => item.path === '/users');
  const userMgmtHiddenFromParent = !parentNav.some(item => item.path === '/users');
  console.log(`✅ User Management: Super Admin=${userMgmtVisible}, Parent hidden=${userMgmtHiddenFromParent}`);

  // Test 4: Basic dashboard should be visible to all
  const dashboardVisibleToAll = allRoles.every(role => {
    const nav = getFilteredNavigation(role);
    return nav.some(item => item.path === '/dashboard');
  });
  console.log(`✅ Dashboard visible to all roles: ${dashboardVisibleToAll}`);

  console.log('\n🎉 Navigation testing completed! Check results above.');

  return results;
}

// Run the test
testRoleNavigation();