#!/usr/bin/env node
/**
 * Example script showing how to query the new azureOfferings table
 * Demonstrates querying both structured columns and JSON attributes
 */

import { initDatabase, closeDatabase } from '../db/database.js';

/**
 * Query examples for azureOfferings table
 */
function queryExamples() {
    console.log('Azure Offerings Query Examples\n');
    console.log('='.repeat(60));

    const db = initDatabase();

    try {
        // Check if table exists
        const tableExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='azureOfferings'
        `).get();

        if (!tableExists) {
            console.log('❌ azureOfferings table does not exist yet.');
            console.log('\nThe table should be created automatically by database initialization.');
            console.log('If this error persists, try running: npm run migrate-apim-to-azure');
            console.log('Or restart your server to trigger database initialization.\n');
            return;
        }

        // Example 1: Query all offerings for a service
        console.log('\n1. All API Management offerings:');
        console.log('-'.repeat(60));
        const allApim = db.prepare(`
            SELECT id, skuName, version, category, isProductionReady
            FROM azureOfferings
            WHERE serviceName = 'API Management'
            ORDER BY version, skuName
        `).all();

        if (allApim.length === 0) {
            console.log('   No offerings found. Run: npm run migrate-apim-to-azure');
        } else {
            allApim.forEach(offering => {
                const status = offering.isProductionReady ? '✓ Production' : '○ Preview/Dev';
                console.log(`   ${offering.skuName} (${offering.version || 'v1'}) - ${offering.category} - ${status}`);
            });
        }

        // Example 2: Query using JSON attributes
        console.log('\n2. Offerings with VNET support (using JSON attributes):');
        console.log('-'.repeat(60));
        try {
            const vnetOfferings = db.prepare(`
                SELECT skuName, version, category
                FROM azureOfferings
                WHERE serviceName = 'API Management'
                  AND json_extract(attributes, '$.vnetSupport') = 1
                ORDER BY version, skuName
            `).all();

            if (vnetOfferings.length === 0) {
                console.log('   No offerings with VNET support found.');
            } else {
                vnetOfferings.forEach(offering => {
                    console.log(`   ${offering.skuName} (${offering.version || 'v1'})`);
                });
            }
        } catch (error) {
            console.log('   JSON extraction not available (SQLite version may be too old)');
            console.log('   Alternative: Query the attributes column directly');
        }

        // Example 3: Production-ready offerings
        console.log('\n3. Production-ready offerings:');
        console.log('-'.repeat(60));
        const production = db.prepare(`
            SELECT skuName, version, category, sla
            FROM azureOfferings
            WHERE serviceName = 'API Management'
              AND isProductionReady = 1
            ORDER BY version, skuName
        `).all();

        if (production.length === 0) {
            console.log('   No production-ready offerings found.');
        } else {
            production.forEach(offering => {
                console.log(`   ${offering.skuName} (${offering.version || 'v1'}) - SLA: ${offering.sla || 'N/A'}`);
            });
        }

        // Example 4: Preview/Development offerings
        console.log('\n4. Preview/Development offerings:');
        console.log('-'.repeat(60));
        const preview = db.prepare(`
            SELECT skuName, version, category, isPreview
            FROM azureOfferings
            WHERE serviceName = 'API Management'
              AND (isPreview = 1 OR isProductionReady = 0)
            ORDER BY version, skuName
        `).all();

        if (preview.length === 0) {
            console.log('   No preview offerings found.');
        } else {
            preview.forEach(offering => {
                const type = offering.isPreview ? 'Preview' : 'Development';
                console.log(`   ${offering.skuName} (${offering.version || 'v1'}) - ${type}`);
            });
        }

        // Example 5: Summary statistics
        console.log('\n5. Summary statistics:');
        console.log('-'.repeat(60));
        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN isProductionReady = 1 THEN 1 ELSE 0 END) as production,
                SUM(CASE WHEN isPreview = 1 THEN 1 ELSE 0 END) as preview,
                COUNT(DISTINCT version) as versions,
                COUNT(DISTINCT category) as categories
            FROM azureOfferings
            WHERE serviceName = 'API Management'
        `).get();

        if (stats && stats.total > 0) {
            console.log(`   Total offerings: ${stats.total}`);
            console.log(`   Production-ready: ${stats.production || 0}`);
            console.log(`   Preview: ${stats.preview || 0}`);
            console.log(`   Versions: ${stats.versions || 0}`);
            console.log(`   Categories: ${stats.categories || 0}`);
        } else {
            console.log('   No statistics available.');
        }

        // Example 6: Get full details for a specific offering
        console.log('\n6. Detailed view (example - first offering):');
        console.log('-'.repeat(60));
        const firstOffering = db.prepare(`
            SELECT * FROM azureOfferings
            WHERE serviceName = 'API Management'
            LIMIT 1
        `).get();

        if (firstOffering) {
            console.log(`   ID: ${firstOffering.id}`);
            console.log(`   SKU: ${firstOffering.skuName} (${firstOffering.skuTier})`);
            console.log(`   Version: ${firstOffering.version || 'N/A'}`);
            console.log(`   Category: ${firstOffering.category || 'N/A'}`);
            console.log(`   Description: ${firstOffering.description?.substring(0, 80) || 'N/A'}...`);
            
            if (firstOffering.attributes) {
                try {
                    const attrs = JSON.parse(firstOffering.attributes);
                    console.log(`   Attributes: ${Object.keys(attrs).join(', ')}`);
                } catch {
                    console.log(`   Attributes: ${firstOffering.attributes.substring(0, 50)}...`);
                }
            }
        } else {
            console.log('   No offerings found.');
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n💡 Tip: You can use these query patterns in your application code.');
        console.log('   The new schema supports both structured queries and flexible JSON attributes.\n');

    } catch (error) {
        console.error('\n❌ Query error:', error);
        throw error;
    }
}

// Run queries
try {
    queryExamples();
    closeDatabase();
    process.exit(0);
} catch (error) {
    console.error('Query error:', error);
    closeDatabase();
    process.exit(1);
}




