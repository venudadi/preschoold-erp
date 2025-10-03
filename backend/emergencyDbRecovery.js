#!/usr/bin/env node

/**
 * Emergency Database Recovery Script
 * Creates all missing tables and handles database errors
 */

import { initializeAllTables, ensureTableExists } from './utils/dbTableValidator.js';
import pool from './db.js';

async function emergencyRecovery() {
  console.log('🚨 Starting Emergency Database Recovery...');
  
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    connection.release();
    
    // Initialize all tables
    console.log('🔧 Initializing all required tables...');
    const results = await initializeAllTables();
    
    // Report results
    const successful = Object.entries(results).filter(([, success]) => success);
    const failed = Object.entries(results).filter(([, success]) => !success);
    
    console.log('\n📊 Recovery Results:');
    console.log(`✅ Successful tables: ${successful.length}`);
    successful.forEach(([table]) => console.log(`   - ${table}`));
    
    if (failed.length > 0) {
      console.log(`❌ Failed tables: ${failed.length}`);
      failed.forEach(([table]) => console.log(`   - ${table}`));
    }
    
    // Verify critical tables
    const criticalTables = [
      'users', 'centers', 'children', 'classrooms', 
      'invoices', 'invoice_requests', 'attendance'
    ];
    
    console.log('\n🔍 Verifying critical tables...');
    for (const table of criticalTables) {
      try {
        const [result] = await pool.query(
          `SELECT COUNT(*) as count FROM information_schema.tables 
           WHERE table_schema = DATABASE() AND table_name = ?`,
          [table]
        );
        
        if (result[0].count > 0) {
          console.log(`✅ ${table} - OK`);
        } else {
          console.log(`❌ ${table} - MISSING`);
        }
      } catch (error) {
        console.log(`❌ ${table} - ERROR: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Emergency recovery completed!');
    
  } catch (error) {
    console.error('💥 Recovery failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run recovery if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  emergencyRecovery();
}

export default emergencyRecovery;