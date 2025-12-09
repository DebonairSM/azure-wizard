#!/usr/bin/env node
/**
 * Azure Resource Discovery Script
 * 
 * Automatically discovers Azure service offerings and SKUs from various sources
 * and populates the azureOfferings table in the database.
 * 
 * Usage:
 *   node azure-resource-discovery.js [options]
 * 
 * Options:
 *   --service <name>    Discover specific service (Functions, AppService, LogicApps, etc.)
 *   --enrich           Use AI to enrich descriptions, pros/cons, use cases
 *   --dry-run          Show what would be discovered without writing to database
 *   --force            Force refresh all data (re-fetch everything)
 *   --help             Show help
 */

import { initDatabase, closeDatabase } from '../db/database.js';
import { 
    fetchFunctionsSkus, 
    fetchAppServiceSkus, 
    fetchLogicAppsSkus, 
    fetchServiceBusSkus,
    fetchContainerAppsSkus,
    fetchEventGridSkus,
    fetchEventHubsSkus,
    fetchRelaySkus,
    fetchContainerInstancesSkus,
    fetchAKSSkus,
    fetchBatchSkus,
    fetchAPIMSkus
} from './azure-sku-fetchers.js';
import { enrichOfferings, isAiEnrichmentAvailable } from './ai-enrichment.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PRIORITY_SERVICES = {
    compute: [
        { name: 'Functions', fetcher: fetchFunctionsSkus },
        { name: 'AppService', fetcher: fetchAppServiceSkus },
        { name: 'ContainerApps', fetcher: fetchContainerAppsSkus },
        { name: 'ContainerInstances', fetcher: fetchContainerInstancesSkus },
        { name: 'AKS', fetcher: fetchAKSSkus },
        { name: 'Batch', fetcher: fetchBatchSkus }
    ],
    integration: [
        { name: 'LogicApps', fetcher: fetchLogicAppsSkus },
        { name: 'ServiceBus', fetcher: fetchServiceBusSkus },
        { name: 'EventGrid', fetcher: fetchEventGridSkus },
        { name: 'EventHubs', fetcher: fetchEventHubsSkus },
        { name: 'Relay', fetcher: fetchRelaySkus },
        { name: 'API Management', fetcher: fetchAPIMSkus }
    ]
};

// ============================================================================
// COMMAND LINE PARSING
// ============================================================================

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        service: null,
        enrich: false,
        dryRun: false,
        force: false,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--service' && i + 1 < args.length) {
            options.service = args[++i];
        } else if (arg === '--enrich') {
            options.enrich = true;
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--force') {
            options.force = true;
        } else if (arg === '--help' || arg === '-h') {
            options.help = true;
        }
    }

    return options;
}

function showHelp() {
    console.log(`
Azure Resource Discovery Script

Usage:
  node azure-resource-discovery.js [options]

Options:
  --service <name>    Discover specific service (Functions, AppService, LogicApps, etc.)
  --enrich           Use AI to enrich descriptions, pros/cons, use cases
  --dry-run          Show what would be discovered without writing to database
  --force            Force refresh all data (re-fetch everything)
  --help, -h         Show this help message

Examples:
  # Discover all priority services
  node azure-resource-discovery.js

  # Discover Azure Functions only
  node azure-resource-discovery.js --service Functions

  # Dry run to preview changes
  node azure-resource-discovery.js --dry-run

  # Discover with AI enrichment
  node azure-resource-discovery.js --enrich

Available Services:
  Compute & Runtime:
    - Functions
    - AppService
    - ContainerApps
    - ContainerInstances
    - AKS
    - Batch

  Integration & Messaging:
    - LogicApps
    - ServiceBus
    - EventGrid
    - EventHubs
    - Relay
    - API Management
`);
}

// ============================================================================
// DISCOVERY FUNCTIONS
// ============================================================================

/**
 * Get all services to discover based on options
 */
function getServicesToDiscover(options) {
    if (options.service) {
        // Find specific service
        const allServices = [...PRIORITY_SERVICES.compute, ...PRIORITY_SERVICES.integration];
        const service = allServices.find(s => s.name.toLowerCase() === options.service.toLowerCase());
        
        if (!service) {
            console.error(`❌ Service '${options.service}' not found.`);
            console.log('\nAvailable services:');
            allServices.forEach(s => console.log(`  - ${s.name}`));
            return null;
        }
        
        return [service];
    }

    // Return all priority services
    return [...PRIORITY_SERVICES.compute, ...PRIORITY_SERVICES.integration];
}

/**
 * Discover offerings for a single service
 */
async function discoverService(service, options, db) {
    console.log(`\n[${'='.repeat(60)}]`);
    console.log(`[${service.name}] Discovering offerings...`);
    console.log(`[${'='.repeat(60)}]`);

    try {
        // Fetch SKUs using service-specific fetcher
        let offerings = await service.fetcher(options);

        if (!offerings || offerings.length === 0) {
            console.log(`  ℹ No offerings found for ${service.name}`);
            return { service: service.name, new: 0, updated: 0, unchanged: 0, offerings: [] };
        }

        console.log(`  ✓ Found ${offerings.length} offerings for ${service.name}`);

        // AI enrichment if requested
        if (options.enrich && isAiEnrichmentAvailable()) {
            offerings = await enrichOfferings(offerings, service.name, {
                delayMs: 1000,
                maxConcurrent: 2
            });
        }

        // Analyze changes
        const result = await analyzeChanges(service.name, offerings, db, options);

        // Display summary
        console.log(`\n  Summary:`);
        console.log(`    - Total offerings: ${offerings.length}`);
        console.log(`    - New: ${result.new}`);
        console.log(`    - Updated: ${result.updated}`);
        console.log(`    - Unchanged: ${result.unchanged}`);

        return result;

    } catch (error) {
        console.error(`  ❌ Error discovering ${service.name}:`, error.message);
        return { service: service.name, new: 0, updated: 0, unchanged: 0, error: error.message, offerings: [] };
    }
}

/**
 * Analyze changes between discovered offerings and database
 */
async function analyzeChanges(serviceName, offerings, db, options) {
    const result = {
        service: serviceName,
        new: 0,
        updated: 0,
        unchanged: 0,
        offerings: []
    };

    if (options.dryRun) {
        // In dry-run mode, just check what exists
        for (const offering of offerings) {
            const existing = db.prepare(`
                SELECT id FROM azureOfferings 
                WHERE serviceName = ? AND skuName = ?
            `).get(serviceName, offering.skuName);

            if (!existing) {
                result.new++;
                console.log(`    [NEW] ${offering.skuName}`);
            } else if (options.force) {
                result.updated++;
                console.log(`    [UPDATE] ${offering.skuName}`);
            } else {
                result.unchanged++;
            }

            result.offerings.push({
                ...offering,
                changeType: existing ? (options.force ? 'update' : 'unchanged') : 'new'
            });
        }
    } else {
        // Actually insert/update in database
        const insertStmt = db.prepare(`
            INSERT OR REPLACE INTO azureOfferings (
                id, serviceName, skuName, skuTier, version, category,
                description, purpose, pricingModel, pricingInfo, sla,
                features, capabilities, limitations, useCases,
                deploymentOptions, attributes, networking, scaling,
                regions, documentationLinks, metadata,
                isPreview, isRecommended, isProductionReady,
                createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const offering of offerings) {
            const existing = db.prepare(`
                SELECT id, updatedAt FROM azureOfferings 
                WHERE id = ?
            `).get(offering.id);

            const isNew = !existing;
            const timestamp = isNew ? new Date().toISOString() : existing.updatedAt;

            insertStmt.run(
                offering.id,
                serviceName,
                offering.skuName,
                offering.skuTier || null,
                offering.version || null,
                offering.category || null,
                offering.description || null,
                offering.purpose || null,
                offering.pricingModel || null,
                offering.pricingInfo ? JSON.stringify(offering.pricingInfo) : null,
                offering.sla || null,
                offering.features ? JSON.stringify(offering.features) : null,
                offering.capabilities ? JSON.stringify(offering.capabilities) : null,
                offering.limitations ? JSON.stringify(offering.limitations) : null,
                offering.useCases ? JSON.stringify(offering.useCases) : null,
                offering.deploymentOptions ? JSON.stringify(offering.deploymentOptions) : null,
                offering.attributes ? JSON.stringify(offering.attributes) : null,
                offering.networking ? JSON.stringify(offering.networking) : null,
                offering.scaling ? JSON.stringify(offering.scaling) : null,
                offering.regions ? JSON.stringify(offering.regions) : null,
                offering.documentationLinks ? JSON.stringify(offering.documentationLinks) : null,
                offering.metadata ? JSON.stringify(offering.metadata) : null,
                offering.isPreview ? 1 : 0,
                offering.isRecommended ? 1 : 0,
                offering.isProductionReady ? 1 : 0,
                isNew ? timestamp : timestamp,
                new Date().toISOString()
            );

            if (isNew) {
                result.new++;
                console.log(`    [NEW] ${offering.skuName}`);
            } else {
                result.updated++;
                console.log(`    [UPDATED] ${offering.skuName}`);
            }

            result.offerings.push({
                ...offering,
                changeType: isNew ? 'new' : 'updated'
            });
        }
    }

    return result;
}

/**
 * Log discovery to changelog table
 */
function logToChangelog(db, results) {
    const insertLog = db.prepare(`
        INSERT INTO azureResourceChangelog (serviceName, skuName, changeType, changeDetails)
        VALUES (?, ?, ?, ?)
    `);

    for (const result of results) {
        for (const offering of result.offerings) {
            if (offering.changeType === 'new' || offering.changeType === 'updated') {
                insertLog.run(
                    result.service,
                    offering.skuName,
                    offering.changeType === 'new' ? 'added' : 'updated',
                    JSON.stringify({
                        skuTier: offering.skuTier,
                        category: offering.category,
                        timestamp: new Date().toISOString()
                    })
                );
            }
        }
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log('\n' + '='.repeat(70));
    console.log('AZURE RESOURCE DISCOVERY');
    console.log('='.repeat(70));

    const options = parseArgs();

    if (options.help) {
        showHelp();
        return;
    }

    console.log('\nOptions:');
    console.log(`  Service: ${options.service || 'All priority services'}`);
    console.log(`  Enrich: ${options.enrich ? 'Yes' : 'No'}`);
    console.log(`  Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
    console.log(`  Force Refresh: ${options.force ? 'Yes' : 'No'}`);

    // Get services to discover
    const services = getServicesToDiscover(options);
    if (!services) {
        process.exit(1);
    }

    // Initialize database
    const db = initDatabase();

    // Ensure changelog table exists
    db.exec(`
        CREATE TABLE IF NOT EXISTS azureResourceChangelog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            serviceName TEXT,
            skuName TEXT,
            changeType TEXT,
            changeDetails TEXT,
            detectedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    try {
        // Discover each service
        const results = [];
        
        for (const service of services) {
            const result = await discoverService(service, options, db);
            results.push(result);
        }

        // Log to changelog (unless dry-run)
        if (!options.dryRun) {
            logToChangelog(db, results);
        }

        // Display final summary
        console.log('\n' + '='.repeat(70));
        console.log('DISCOVERY SUMMARY');
        console.log('='.repeat(70));

        const totalNew = results.reduce((sum, r) => sum + r.new, 0);
        const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
        const totalUnchanged = results.reduce((sum, r) => sum + r.unchanged, 0);
        const totalOfferings = totalNew + totalUpdated + totalUnchanged;

        console.log(`\nTotal offerings discovered: ${totalOfferings}`);
        console.log(`  - New: ${totalNew}`);
        console.log(`  - Updated: ${totalUpdated}`);
        console.log(`  - Unchanged: ${totalUnchanged}`);

        if (options.dryRun) {
            console.log('\n⚠ DRY RUN MODE - No changes were written to the database');
        } else {
            console.log('\n✓ Changes have been written to the database');
        }

        console.log('\n' + '='.repeat(70));
        console.log('✓ Discovery completed successfully');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('\n❌ Discovery failed:', error);
        console.error(error.stack);
        process.exit(1);
    } finally {
        closeDatabase();
    }
}

// Run if called directly
const scriptPath = process.argv[1].replace(/\\/g, '/');
const isMainModule = import.meta.url.endsWith(scriptPath.split('/').pop());
if (isMainModule) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { discoverService, analyzeChanges };
