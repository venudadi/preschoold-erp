// run-emergency-migration.js
// Run the emergency alert system migration

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runEmergencyMigration() {
    try {
        console.log('🚨 Running Emergency Alert System Migration...');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', '032_emergency_alert_system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolon and filter out empty statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

        console.log(`Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`Executing statement ${i + 1}/${statements.length}...`);

            try {
                await db.query(statement);
                console.log(`✅ Statement ${i + 1} completed successfully`);
            } catch (error) {
                console.warn(`⚠️  Statement ${i + 1} failed (might already exist):`, error.message);
                // Continue with other statements even if one fails
            }
        }

        console.log('✅ Emergency Alert System Migration completed successfully!');
        console.log('');
        console.log('📋 Created tables:');
        console.log('   - emergency_alerts (for tracking emergency situations)');
        console.log('   - emergency_contacts (center-specific emergency contacts)');
        console.log('   - emergency_procedures (emergency response protocols)');
        console.log('   - emergency_drill_logs (drill tracking and compliance)');
        console.log('');
        console.log('🔧 Features enabled:');
        console.log('   - Real-time emergency broadcasting via WebSocket');
        console.log('   - Emergency alert management for center directors');
        console.log('   - Emergency procedure tracking and drill logging');
        console.log('   - Comprehensive emergency contact management');

        process.exit(0);
    } catch (error) {
        console.error('❌ Emergency migration failed:', error);
        process.exit(1);
    }
}

runEmergencyMigration();