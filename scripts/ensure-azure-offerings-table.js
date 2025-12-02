#!/usr/bin/env node
/**
 * Ensure azureOfferings table exists in the database
 * This script creates the table if it doesn't exist
 */

import { initDatabase, closeDatabase, clearDatabaseCache } from '../db/database.js';

function ensureAzureOfferingsTable() {
    console.log('Ensuring azureOfferings table exists...\n');

    // Clear any existing database connection to force re-initialization
    clearDatabaseCache();

    // Initialize database (this will create the table if it doesn't exist)
    const db = initDatabase();

    try {
        // Check if table exists
        const tableExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='azureOfferings'
        `).get();

        if (tableExists) {
            console.log('✅ azureOfferings table exists');
            
            // Count existing records
            const count = db.prepare('SELECT COUNT(*) as count FROM azureOfferings').get();
            console.log(`   Records in table: ${count.count}`);
            
            if (count.count > 0) {
                const byService = db.prepare(`
                    SELECT serviceName, COUNT(*) as count
                    FROM azureOfferings
                    GROUP BY serviceName
                `).all();
                
                console.log('\n   Records by service:');
                byService.forEach(row => {
                    console.log(`   - ${row.serviceName}: ${row.count}`);
                });
            }
        } else {
            console.log('❌ azureOfferings table does not exist');
            console.log('   This should have been created automatically.');
            console.log('   Please check database.js initialization code.');
        }

        console.log('\n✅ Database initialization complete');
        console.log('   You can now run: npm run query-azure-offerings\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    }
}

// Run
try {
    ensureAzureOfferingsTable();
    closeDatabase();
    process.exit(0);
} catch (error) {
    console.error('Script error:', error);
    closeDatabase();
    process.exit(1);
}




