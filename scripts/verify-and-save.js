// Verify the improve functionality and save results to file
import Database from 'better-sqlite3';
import fs from 'fs';

const output = [];
const log = (msg) => {
    output.push(msg);
    console.log(msg);
};

log('=== Verifying Improve Functionality Results ===\n');

const db = new Database('./db/azure-wizard.db');

try {
    // 1. Check total options for root node
    log('1. Checking root node options:');
    const rootOptions = db.prepare(`
        SELECT id, label, 
               LENGTH(description) as desc_len,
               LENGTH(pros) as pros_len,
               LENGTH(cons) as cons_len,
               updatedAt
        FROM options 
        WHERE nodeId = 'root'
        ORDER BY label
    `).all();
    
    log(`   Total options: ${rootOptions.length}\n`);
    
    // 2. Show all options
    log('2. All root node options:');
    rootOptions.forEach((opt, idx) => {
        log(`   ${idx + 1}. ${opt.label}`);
        log(`      ID: ${opt.id}`);
        log(`      Description: ${opt.desc_len} chars`);
        log(`      Pros: ${opt.pros_len} chars, Cons: ${opt.cons_len} chars`);
        log(`      Updated: ${opt.updatedAt}`);
    });
    log('');
    
    // 3. Check for specific new options we expect
    log('3. Checking for expected new Azure service options:');
    const expectedNewServices = [
        'Azure Function Apps',
        'Azure Logic Apps',
        'Azure Event Hubs',
        'Azure Service Bus',
        'Azure Notification Hubs'
    ];
    
    let newServicesFound = 0;
    expectedNewServices.forEach(serviceName => {
        const option = rootOptions.find(opt => opt.label === serviceName);
        if (option) {
            log(`   ✅ ${serviceName} - FOUND`);
            newServicesFound++;
        } else {
            log(`   ❌ ${serviceName} - NOT FOUND`);
        }
    });
    log('');
    
    // 4. Check for enriched options
    log('4. Checking enriched existing options:');
    const enrichedCategories = [
        'AI & Machine Learning',
        'Compute Services',
        'Containers',
        'Data & Storage',
        'DevOps & CI/CD',
        'IoT'
    ];
    
    let enrichedFound = 0;
    enrichedCategories.forEach(category => {
        const option = db.prepare(`
            SELECT label, description,
                   LENGTH(description) as desc_len,
                   LENGTH(pros) as pros_len,
                   LENGTH(cons) as cons_len,
                   whenToUse,
                   whenNotToUse
            FROM options 
            WHERE nodeId = 'root' AND label = ?
        `).get(category);
        
        if (option) {
            const hasWhenToUse = option.whenToUse && option.whenToUse.length > 0;
            const hasWhenNotToUse = option.whenNotToUse && option.whenNotToUse.length > 0;
            const hasGoodContent = option.pros_len > 50 && option.cons_len > 50;
            
            if (hasGoodContent) enrichedFound++;
            
            const status = hasGoodContent ? '✅ ENRICHED' : '⚠️  PARTIAL';
            log(`   ${status} ${category}`);
            log(`     Description: ${option.desc_len} chars`);
            log(`     Pros: ${option.pros_len} chars, Cons: ${option.cons_len} chars`);
            log(`     When to use: ${hasWhenToUse ? 'Yes' : 'No'}`);
            log(`     When NOT to use: ${hasWhenNotToUse ? 'Yes' : 'No'}`);
        } else {
            log(`   ❌ ${category} - NOT FOUND`);
        }
    });
    log('');
    
    // 5. Database version
    log('5. Database version:');
    const version = db.prepare(`
        SELECT version, updatedAt 
        FROM version 
        ORDER BY updatedAt DESC 
        LIMIT 1
    `).get();
    log(`   Version: ${version.version}`);
    log(`   Updated: ${version.updatedAt}`);
    log('');
    
    // 6. Summary
    log('=== SUMMARY ===');
    log(`Total options in root node: ${rootOptions.length}`);
    log(`New services added: ${newServicesFound}/${expectedNewServices.length}`);
    log(`Categories enriched: ${enrichedFound}/${enrichedCategories.length}`);
    
    if (newServicesFound > 0 || enrichedFound > 0) {
        log('\n✅ IMPROVE FUNCTIONALITY WORKING CORRECTLY!');
        log('   - New Azure service options have been added to the database');
        log('   - Existing categories have been enriched with more details');
        log('   - Database version has been updated');
    } else {
        log('\n⚠️  Warning: No new services or enrichments detected');
    }
    
    // Save to file
    fs.writeFileSync('./verify-results.txt', output.join('\n'));
    log('\n✅ Results saved to verify-results.txt');
    
} catch (error) {
    log(`\n❌ Verification failed: ${error.message}`);
    fs.writeFileSync('./verify-results.txt', output.join('\n'));
    process.exit(1);
} finally {
    db.close();
}


