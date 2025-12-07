#!/usr/bin/env node
/**
 * Database Query & Test - Consolidated query and testing script
 * 
 * Commands:
 *   query             - Run query examples on azureOfferings table
 *   test-ai-gateway   - Test AI Gateway data in apimOfferings table
 *   test-all          - Run all tests
 */

import fs from 'fs';
import { initDatabase, closeDatabase } from '../db/database.js';

// ============================================================================
// COMMAND: QUERY AZURE OFFERINGS
// ============================================================================

function queryAzureOfferings() {
    console.log('\n' + '='.repeat(60));
    console.log('AZURE OFFERINGS QUERY EXAMPLES');
    console.log('='.repeat(60) + '\n');

    const db = initDatabase();

    try {
        const tableExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='azureOfferings'
        `).get();

        if (!tableExists) {
            console.log('❌ azureOfferings table does not exist yet.');
            console.log('\nThe table should be created automatically by database initialization.');
            console.log('Try running: node scripts/db-manager.js migrate-apim\n');
            return false;
        }

        // Example 1: All API Management offerings
        console.log('1. All API Management offerings:');
        console.log('-'.repeat(60));
        const allApim = db.prepare(`
            SELECT id, skuName, version, category, isProductionReady
            FROM azureOfferings
            WHERE serviceName = 'API Management'
            ORDER BY version, skuName
        `).all();

        if (allApim.length === 0) {
            console.log('   No offerings found. Run: node scripts/db-manager.js migrate-apim');
        } else {
            allApim.forEach(offering => {
                const status = offering.isProductionReady ? '✓ Production' : '○ Preview/Dev';
                console.log(`   ${offering.skuName} (${offering.version || 'v1'}) - ${offering.category} - ${status}`);
            });
        }

        // Example 2: Offerings with VNET support
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

        // Example 4: Summary statistics
        console.log('\n4. Summary statistics:');
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

        console.log('\n' + '='.repeat(60));
        console.log('💡 Query patterns available for use in application code.\n');

        return true;

    } catch (error) {
        console.error('\n❌ Query error:', error);
        return false;
    }
}

// ============================================================================
// COMMAND: TEST AI GATEWAY
// ============================================================================

function testAiGateway() {
    console.log('\n' + '='.repeat(60));
    console.log('AI GATEWAY DATABASE TESTS');
    console.log('='.repeat(60) + '\n');

    const db = initDatabase();

    const results = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    // Test 1: Check if aiGatewayDetails column exists
    try {
        const columns = db.prepare(`PRAGMA table_info(apimOfferings)`).all();
        const hasColumn = columns.some(col => col.name === 'aiGatewayDetails');
        results.tests.push({
            name: 'aiGatewayDetails column exists',
            passed: hasColumn,
            details: hasColumn ? 'Column found' : 'Column not found'
        });
    } catch (error) {
        results.tests.push({
            name: 'aiGatewayDetails column exists',
            passed: false,
            error: error.message
        });
    }

    // Test 2: Check Premium v2 has full AI Gateway support
    try {
        const offering = db.prepare(`
            SELECT id, skuName, aiGateway, aiGatewayDetails 
            FROM apimOfferings 
            WHERE id = 'apim-premium-v2'
        `).get();
        
        const details = offering?.aiGatewayDetails ? JSON.parse(offering.aiGatewayDetails) : null;
        const hasFullSupport = details && details.supported && details.level === 'full';
        
        results.tests.push({
            name: 'Premium v2 has full AI Gateway support',
            passed: hasFullSupport,
            details: {
                offering: offering?.skuName || 'Not found',
                aiGatewayFlag: offering?.aiGateway === 1,
                detailsPresent: !!details,
                supportLevel: details?.level || 'none',
                trafficMediationTypes: details?.trafficMediation?.apiImportTypes?.length || 0,
                policies: Object.keys(details?.scalabilityPolicies || {}).length
            }
        });
    } catch (error) {
        results.tests.push({
            name: 'Premium v2 has full AI Gateway support',
            passed: false,
            error: error.message
        });
    }

    // Test 3: Check Standard v2 has partial AI Gateway support
    try {
        const offering = db.prepare(`
            SELECT id, skuName, aiGateway, aiGatewayDetails 
            FROM apimOfferings 
            WHERE id = 'apim-standard-v2'
        `).get();
        
        const details = offering?.aiGatewayDetails ? JSON.parse(offering.aiGatewayDetails) : null;
        const hasPartialSupport = details && details.supported && details.level === 'partial';
        
        results.tests.push({
            name: 'Standard v2 has partial AI Gateway support',
            passed: hasPartialSupport,
            details: {
                offering: offering?.skuName || 'Not found',
                supportLevel: details?.level || 'none',
                limitations: details?.limitations?.length || 0
            }
        });
    } catch (error) {
        results.tests.push({
            name: 'Standard v2 has partial AI Gateway support',
            passed: false,
            error: error.message
        });
    }

    // Test 4: Check v1 tiers have no AI Gateway support
    try {
        const offering = db.prepare(`
            SELECT id, skuName, aiGateway, aiGatewayDetails 
            FROM apimOfferings 
            WHERE id = 'apim-premium'
        `).get();
        
        const details = offering?.aiGatewayDetails ? JSON.parse(offering.aiGatewayDetails) : null;
        const noSupport = !details || !details.supported;
        
        results.tests.push({
            name: 'v1 Premium has no AI Gateway support',
            passed: noSupport,
            details: {
                offering: offering?.skuName || 'Not found',
                aiGatewayFlag: offering?.aiGateway === 1,
                detailsPresent: !!details,
                supported: details?.supported || false,
                reason: details?.reason || 'N/A'
            }
        });
    } catch (error) {
        results.tests.push({
            name: 'v1 Premium has no AI Gateway support',
            passed: false,
            error: error.message
        });
    }

    // Test 5: Count offerings with AI Gateway details
    try {
        const offerings = db.prepare(`SELECT id, skuName, aiGatewayDetails FROM apimOfferings`).all();
        const withDetails = offerings.filter(o => o.aiGatewayDetails).length;
        const total = offerings.length;
        
        results.tests.push({
            name: 'All offerings have AI Gateway details',
            passed: withDetails === total,
            details: {
                total: total,
                withDetails: withDetails,
                percentage: total > 0 ? Math.round((withDetails / total) * 100) : 0
            }
        });
    } catch (error) {
        results.tests.push({
            name: 'All offerings have AI Gateway details',
            passed: false,
            error: error.message
        });
    }

    // Test 6: Verify Premium v2 documentation links
    try {
        const offering = db.prepare(`
            SELECT aiGatewayDetails FROM apimOfferings WHERE id = 'apim-premium-v2'
        `).get();
        
        const details = offering?.aiGatewayDetails ? JSON.parse(offering.aiGatewayDetails) : null;
        const hasDocLinks = details && details.documentation && details.documentation.length > 0;
        
        results.tests.push({
            name: 'Premium v2 has documentation links',
            passed: hasDocLinks,
            details: {
                linkCount: details?.documentation?.length || 0,
                sampleLinks: details?.documentation?.slice(0, 3).map(d => d.title) || []
            }
        });
    } catch (error) {
        results.tests.push({
            name: 'Premium v2 has documentation links',
            passed: false,
            error: error.message
        });
    }

    // Calculate summary
    const passed = results.tests.filter(t => t.passed).length;
    const total = results.tests.length;
    results.summary = {
        total: total,
        passed: passed,
        failed: total - passed,
        passRate: Math.round((passed / total) * 100) + '%'
    };

    // Write results to file
    try {
        const outputPath = 'temp/ai-gateway-test-results.json';
        fs.mkdirSync('temp', { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`Test results saved to: ${outputPath}\n`);
    } catch (error) {
        console.log('(Could not save test results to file)\n');
    }

    // Display results
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Pass Rate: ${results.summary.passRate}`);
    console.log('='.repeat(60));
    console.log('\nTest Details:');
    
    results.tests.forEach((test, i) => {
        console.log(`\n${i + 1}. ${test.name}: ${test.passed ? '✓ PASS' : '✗ FAIL'}`);
        if (test.details) {
            console.log(`   ${JSON.stringify(test.details, null, 2).split('\n').join('\n   ')}`);
        }
        if (test.error) {
            console.log(`   Error: ${test.error}`);
        }
    });
    
    console.log('\n' + '='.repeat(60) + '\n');

    return passed === total;
}

// ============================================================================
// MAIN CLI
// ============================================================================

const command = process.argv[2] || 'help';

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('DATABASE QUERY & TEST');
    console.log('='.repeat(60));

    let success = false;

    try {
        switch (command) {
            case 'query':
                success = queryAzureOfferings();
                break;
            
            case 'test-ai-gateway':
                success = testAiGateway();
                break;
            
            case 'test-all':
                console.log('\nRunning all tests...\n');
                success = testAiGateway();
                break;
            
            case 'help':
            default:
                console.log('\nUsage: node db-query.js <command>\n');
                console.log('Commands:');
                console.log('  query             - Run query examples on azureOfferings table');
                console.log('  test-ai-gateway   - Test AI Gateway data in apimOfferings table');
                console.log('  test-all          - Run all tests');
                console.log('  help              - Show this help message\n');
                success = true;
                break;
        }

        console.log('='.repeat(60));
        console.log(success ? '✓ Operation completed successfully' : '✗ Operation had failures');
        console.log('='.repeat(60) + '\n');

        closeDatabase();
        process.exit(success ? 0 : 1);

    } catch (error) {
        console.error('\n❌ Error:', error);
        closeDatabase();
        process.exit(1);
    }
}

main();
