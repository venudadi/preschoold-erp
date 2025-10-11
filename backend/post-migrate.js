import 'dotenv/config';
import pool from './db.js';

/**
 * POST-MIGRATION SCRIPT
 *
 * This script runs AFTER all migrations complete successfully.
 * It handles deferred operations that were skipped during migrations:
 * - Creating indexes on tables that didn't exist initially
 * - Adding foreign key constraints that were skipped
 * - Inserting default data
 */

console.log('🔧 Running post-migration tasks...\n');

async function createDeferredIndexes() {
  console.log('📊 Creating deferred indexes...');

  const indexes = [
    // Document management indexes
    { table: 'documents', name: 'idx_documents_category', column: 'category_id' },
    { table: 'documents', name: 'idx_documents_center', column: 'center_id' },
    { table: 'documents', name: 'idx_documents_status', column: 'status' },
    { table: 'document_versions', name: 'idx_document_versions_document', column: 'document_id' },
    { table: 'document_shares', name: 'idx_document_shares_document', column: 'document_id' },
    { table: 'document_access_logs', name: 'idx_document_access_logs_document', column: 'document_id' },
    { table: 'document_comments', name: 'idx_document_comments_document', column: 'document_id' },

    // Fee structure indexes
    { table: 'fee_structures', name: 'idx_fee_structures_academic_year', column: 'academic_year' },
    { table: 'fee_components', name: 'idx_fee_components_type', column: 'component_type' },

    // Invoice indexes
    { table: 'invoices', name: 'idx_invoices_billing_period', columns: ['billing_period_start', 'billing_period_end'] },
    { table: 'invoices', name: 'idx_invoices_parent_name', column: 'parent_name' },
    { table: 'invoices', name: 'idx_invoices_total_amount', column: 'total_amount' },

    // Staff assignments
    { table: 'staff_assignments', name: 'idx_staff_assignments_center_id', column: 'center_id' },
  ];

  let created = 0;
  let skipped = 0;

  for (const idx of indexes) {
    try {
      // Check if table exists
      const [tables] = await pool.query(
        'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
        [idx.table]
      );

      if (tables.length === 0) {
        console.log(`  ⚠️  Table ${idx.table} doesn't exist, skipping index ${idx.name}`);
        skipped++;
        continue;
      }

      // Check if index already exists
      const [existingIndexes] = await pool.query(
        'SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
        [idx.table, idx.name]
      );

      if (existingIndexes.length > 0) {
        console.log(`  ✓ Index ${idx.name} already exists on ${idx.table}`);
        skipped++;
        continue;
      }

      // Create the index
      const columns = idx.columns ? idx.columns.join(', ') : idx.column;
      await pool.query(`CREATE INDEX ${idx.name} ON ${idx.table}(${columns})`);
      console.log(`  ✅ Created index ${idx.name} on ${idx.table}(${columns})`);
      created++;
    } catch (err) {
      console.warn(`  ⚠️  Could not create index ${idx.name}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n  Summary: ${created} indexes created, ${skipped} skipped\n`);
}

async function insertDefaultData() {
  console.log('📝 Inserting default data where missing...');

  try {
    // Check if any centers exist
    const [centers] = await pool.query('SELECT COUNT(*) as count FROM centers');

    if (centers[0].count === 0) {
      console.log('  ℹ️  No centers found - skipping default data insertion');
      console.log('     (Default data will be created when first center is added)\n');
      return;
    }

    // Insert default document categories for each center
    const [existingCategories] = await pool.query(
      'SELECT COUNT(*) as count FROM document_categories'
    );

    if (existingCategories[0].count === 0) {
      console.log('  📁 Creating default document categories...');

      const categories = [
        { name: 'Administrative Documents', description: 'Official school administrative documents and policies' },
        { name: 'Student Records', description: 'Student-related documents and records' },
        { name: 'Staff Documents', description: 'Staff-related documents and certifications' },
        { name: 'Learning Materials', description: 'Educational resources and learning materials' },
        { name: 'Financial Records', description: 'Financial documents and reports' },
      ];

      const [centerList] = await pool.query('SELECT id FROM centers');

      for (const center of centerList) {
        for (const cat of categories) {
          try {
            await pool.query(
              'INSERT INTO document_categories (id, name, description, center_id) VALUES (UUID(), ?, ?, ?)',
              [cat.name, cat.description, center.id]
            );
          } catch (err) {
            if (err.errno !== 1062) { // Ignore duplicate entry errors
              console.warn(`    ⚠️  Could not create category "${cat.name}": ${err.message}`);
            }
          }
        }
      }
      console.log(`  ✅ Created default document categories for ${centerList.length} center(s)\n`);
    } else {
      console.log(`  ✓ Document categories already exist (${existingCategories[0].count} found)\n`);
    }
  } catch (err) {
    console.warn(`  ⚠️  Could not insert default data: ${err.message}\n`);
  }
}

async function verifySchema() {
  console.log('🔍 Verifying database schema...');

  try {
    const [tables] = await pool.query(
      'SELECT COUNT(*) as count FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()'
    );

    console.log(`  ✅ Total tables in database: ${tables[0].count}`);

    // Check for critical base tables
    const criticalTables = ['users', 'centers', 'children', 'parents', 'classrooms', 'invoices'];
    let allPresent = true;

    for (const tableName of criticalTables) {
      const [result] = await pool.query(
        'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
        [tableName]
      );

      if (result.length === 0) {
        console.log(`  ❌ Critical table missing: ${tableName}`);
        allPresent = false;
      }
    }

    if (allPresent) {
      console.log(`  ✅ All critical base tables present\n`);
    } else {
      console.log(`  ⚠️  Some critical tables are missing\n`);
    }
  } catch (err) {
    console.error(`  ❌ Could not verify schema: ${err.message}\n`);
  }
}

async function run() {
  try {
    await verifySchema();
    await createDeferredIndexes();
    await insertDefaultData();

    console.log('✅ Post-migration tasks completed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Post-migration error:', err);
    process.exit(1);
  }
}

run();
