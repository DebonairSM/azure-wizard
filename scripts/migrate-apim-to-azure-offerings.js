#!/usr/bin/env node
/**
 * Migrate APIM offerings from apimOfferings table to azureOfferings table
 * This script converts the service-specific schema to the generic extensible schema
 */

import { initDatabase, closeDatabase } from '../db/database.js';

/**
 * Migrate APIM offerings to azureOfferings table
 */
function migrateApimToAzureOfferings() {
    console.log('Starting migration from apimOfferings to azureOfferings...\n');

    const db = initDatabase();

    try {
        // Check if apimOfferings table exists and has data
        const apimExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='apimOfferings'
        `).get();

        if (!apimExists) {
            console.log('No apimOfferings table found. Nothing to migrate.');
            return;
        }

        const apimCount = db.prepare('SELECT COUNT(*) as count FROM apimOfferings').get();
        console.log(`Found ${apimCount.count} APIM offerings to migrate`);

        if (apimCount.count === 0) {
            console.log('No APIM offerings found. Nothing to migrate.');
            console.log('\n✅ azureOfferings table is ready for use.');
            console.log('   You can now add Azure service offerings directly to this table.\n');
            return;
        }

        // Always ensure azureOfferings table exists
        const azureExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='azureOfferings'
        `).get();

        if (!azureExists) {
            console.log('Creating azureOfferings table...');
            const schema = `
                CREATE TABLE IF NOT EXISTS azureOfferings (
                    id TEXT PRIMARY KEY,
                    serviceName TEXT NOT NULL,
                    skuName TEXT NOT NULL,
                    skuTier TEXT,
                    version TEXT,
                    category TEXT,
                    metadata TEXT,
                    description TEXT,
                    purpose TEXT,
                    pricingModel TEXT,
                    pricingInfo TEXT,
                    sla TEXT,
                    features TEXT,
                    capabilities TEXT,
                    limitations TEXT,
                    useCases TEXT,
                    deploymentOptions TEXT,
                    attributes TEXT,
                    networking TEXT,
                    scaling TEXT,
                    regions TEXT,
                    documentationLinks TEXT,
                    isPreview BOOLEAN DEFAULT 0,
                    isRecommended BOOLEAN DEFAULT 0,
                    isProductionReady BOOLEAN DEFAULT 0,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_azureOfferings_serviceName ON azureOfferings(serviceName);
                CREATE INDEX IF NOT EXISTS idx_azureOfferings_skuTier ON azureOfferings(skuTier);
                CREATE INDEX IF NOT EXISTS idx_azureOfferings_version ON azureOfferings(version);
                CREATE INDEX IF NOT EXISTS idx_azureOfferings_category ON azureOfferings(category);
                CREATE INDEX IF NOT EXISTS idx_azureOfferings_isProductionReady ON azureOfferings(isProductionReady);
            `;
            db.exec(schema);
            console.log('✅ azureOfferings table created\n');
        } else {
            console.log('✅ azureOfferings table already exists\n');
        }

        // Check for existing migrations
        const existingMigrations = db.prepare(`
            SELECT COUNT(*) as count 
            FROM azureOfferings 
            WHERE serviceName = 'API Management'
        `).get();

        if (existingMigrations.count > 0) {
            console.log(`\n⚠️  Warning: Found ${existingMigrations.count} existing API Management offerings in azureOfferings table.`);
            console.log('This migration will skip records that already exist (by ID).');
        }

        // Get all APIM offerings
        const apimOfferings = db.prepare('SELECT * FROM apimOfferings').all();
        console.log(`\nMigrating ${apimOfferings.length} offerings...\n`);

        // Prepare insert statement
        const insertAzureOffering = db.prepare(`
            INSERT OR IGNORE INTO azureOfferings (
                id, serviceName, skuName, skuTier, version, category,
                description, purpose, pricingModel, pricingInfo, sla,
                features, capabilities, limitations, useCases,
                attributes, documentationLinks, isProductionReady,
                createdAt, updatedAt
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        `);

        // Migration transaction
        const migrateTransaction = db.transaction((offerings) => {
            let migrated = 0;
            let skipped = 0;

            for (const offering of offerings) {
                // Check if already exists
                const exists = db.prepare('SELECT id FROM azureOfferings WHERE id = ?').get(offering.id);
                if (exists) {
                    skipped++;
                    continue;
                }

                // Convert boolean columns to JSON attributes
                const attributes = {
                    vnetSupport: offering.vnetSupport === 1 || offering.vnetSupport === true,
                    multiRegion: offering.multiRegion === 1 || offering.multiRegion === true,
                    selfHostedGateway: offering.selfHostedGateway === 1 || offering.selfHostedGateway === true,
                    developerPortal: offering.developerPortal === 1 || offering.developerPortal === true,
                    analytics: offering.analytics === 1 || offering.analytics === true,
                    aiGateway: offering.aiGateway === 1 || offering.aiGateway === true,
                    mcpSupport: offering.mcpSupport === 1 || offering.mcpSupport === true,
                    websocketSupport: offering.websocketSupport === 1 || offering.websocketSupport === true,
                    maxScaleUnits: offering.maxScaleUnits,
                    cachePerUnit: offering.cachePerUnit
                };

                // Create metadata object with service-specific details
                const metadata = {
                    maxScaleUnits: offering.maxScaleUnits,
                    cachePerUnit: offering.cachePerUnit
                };

                // Create scaling information
                const scaling = {
                    maxScaleUnits: offering.maxScaleUnits,
                    cachePerUnit: offering.cachePerUnit
                };

                // Create networking information
                const networking = {
                    vnetSupport: offering.vnetSupport === 1 || offering.vnetSupport === true,
                    multiRegion: offering.multiRegion === 1 || offering.multiRegion === true,
                    selfHostedGateway: offering.selfHostedGateway === 1 || offering.selfHostedGateway === true
                };

                // Determine if preview based on category
                const isPreview = offering.category === 'v2' || 
                                 offering.category === 'preview' ||
                                 offering.skuName?.toLowerCase().includes('preview');

                try {
                    insertAzureOffering.run(
                        offering.id,
                        'API Management',
                        offering.skuName,
                        offering.skuTier,
                        offering.version || null,
                        offering.category || null,
                        offering.description || null,
                        offering.purpose || null,
                        offering.pricingModel || null,
                        offering.pricingInfo || null,
                        offering.sla || null,
                        offering.features || null,
                        offering.capabilities || null,
                        offering.limitations || null,
                        offering.useCases || null,
                        null, // deploymentOptions
                        JSON.stringify(attributes),
                        offering.documentationLinks || null,
                        offering.productionReady === 1 || offering.productionReady === true ? 1 : 0,
                        offering.createdAt || null,
                        offering.updatedAt || null
                    );

                    // Update metadata, scaling, and networking if they have values
                    if (metadata.maxScaleUnits !== null || metadata.cachePerUnit) {
                        db.prepare('UPDATE azureOfferings SET metadata = ? WHERE id = ?').run(
                            JSON.stringify(metadata),
                            offering.id
                        );
                    }

                    if (scaling.maxScaleUnits !== null || scaling.cachePerUnit) {
                        db.prepare('UPDATE azureOfferings SET scaling = ? WHERE id = ?').run(
                            JSON.stringify(scaling),
                            offering.id
                        );
                    }

                    if (networking.vnetSupport || networking.multiRegion || networking.selfHostedGateway) {
                        db.prepare('UPDATE azureOfferings SET networking = ? WHERE id = ?').run(
                            JSON.stringify(networking),
                            offering.id
                        );
                    }

                    if (isPreview) {
                        db.prepare('UPDATE azureOfferings SET isPreview = 1 WHERE id = ?').run(offering.id);
                    }

                    migrated++;
                    console.log(`  ✓ Migrated: ${offering.skuName} (${offering.version || 'v1'})`);
                } catch (error) {
                    console.error(`  ✗ Error migrating ${offering.skuName}:`, error.message);
                }
            }

            return { migrated, skipped };
        });

        const result = migrateTransaction(apimOfferings);

        console.log(`\n✅ Migration completed!`);
        console.log(`   - Migrated: ${result.migrated} offerings`);
        if (result.skipped > 0) {
            console.log(`   - Skipped: ${result.skipped} offerings (already exist)`);
        }

        // Display summary
        const summary = db.prepare(`
            SELECT 
                version,
                COUNT(*) as count,
                SUM(CASE WHEN isProductionReady = 1 THEN 1 ELSE 0 END) as productionReady
            FROM azureOfferings
            WHERE serviceName = 'API Management'
            GROUP BY version
        `).all();

        console.log(`\n📊 Summary by version:`);
        for (const row of summary) {
            console.log(`   - ${row.version || 'N/A'}: ${row.count} offerings (${row.productionReady} production-ready)`);
        }

        const byCategory = db.prepare(`
            SELECT 
                category,
                COUNT(*) as count
            FROM azureOfferings
            WHERE serviceName = 'API Management'
            GROUP BY category
        `).all();

        console.log(`\n📊 Summary by category:`);
        for (const row of byCategory) {
            console.log(`   - ${row.category || 'N/A'}: ${row.count} offerings`);
        }

        console.log(`\n💡 Next steps:`);
        console.log(`   1. Test your application with the new azureOfferings table`);
        console.log(`   2. Update your code to query azureOfferings instead of apimOfferings`);
        console.log(`   3. Once verified, you can optionally remove the apimOfferings table`);
        console.log(`   4. Use azureOfferings for all future Azure service offerings\n`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    }
}

// Run migration
try {
    migrateApimToAzureOfferings();
    closeDatabase();
    process.exit(0);
} catch (error) {
    console.error('Migration error:', error);
    closeDatabase();
    process.exit(1);
}




