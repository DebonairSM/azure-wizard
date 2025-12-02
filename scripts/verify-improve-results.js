// Verify the improve functionality results in the database
import Database from 'better-sqlite3';

console.log('=== Verifying Improve Functionality Results ===\n');

const db = new Database('./db/azure-wizard.db');

try {
    // 1. Check total options for root node
    console.log('1. Checking root node options:');
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
    
    console.log(`   Total options: ${rootOptions.length}\n`);
    
    // 2. Show new options (those with recent timestamps)
    const recentOptions = rootOptions.filter(opt => {
        const updated = new Date(opt.updatedAt);
        const now = new Date();
        const diffMinutes = (now - updated) / 1000 / 60;
        return diffMinutes < 10; // Updated in last 10 minutes
    });
    
    if (recentOptions.length > 0) {
        console.log(`2. Recently updated/created options (last 10 min): ${recentOptions.length}`);
        recentOptions.forEach(opt => {
            console.log(`   - ${opt.label}`);
            console.log(`     Description: ${opt.desc_len} chars`);
            console.log(`     Pros: ${opt.pros_len} chars`);
            console.log(`     Cons: ${opt.cons_len} chars`);
            console.log(`     Updated: ${opt.updatedAt}`);
        });
        console.log();
    }
    
    // 3. Check for specific new options we expect
    console.log('3. Checking for expected new Azure service options:');
    const expectedNewServices = [
        'Azure Function Apps',
        'Azure Logic Apps',
        'Azure Event Hubs',
        'Azure Service Bus',
        'Azure Notification Hubs'
    ];
    
    expectedNewServices.forEach(serviceName => {
        const option = rootOptions.find(opt => opt.label === serviceName);
        if (option) {
            console.log(`   ✅ ${serviceName} - FOUND`);
        } else {
            console.log(`   ❌ ${serviceName} - NOT FOUND`);
        }
    });
    console.log();
    
    // 4. Check for enriched options (should have more details now)
    console.log('4. Checking enriched existing options:');
    const enrichedCategories = [
        'AI & Machine Learning',
        'Compute Services',
        'Containers',
        'Data & Storage',
        'DevOps & CI/CD',
        'IoT'
    ];
    
    enrichedCategories.forEach(category => {
        const option = db.prepare(`
            SELECT label, 
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
            const status = hasWhenToUse && hasWhenNotToUse ? '✅ ENRICHED' : '⚠️  PARTIAL';
            console.log(`   ${status} ${category}`);
            console.log(`     Description: ${option.desc_len} chars`);
            console.log(`     Pros: ${option.pros_len} chars`);
            console.log(`     Cons: ${option.cons_len} chars`);
            console.log(`     When to use: ${hasWhenToUse ? 'Yes' : 'No'}`);
            console.log(`     When NOT to use: ${hasWhenNotToUse ? 'Yes' : 'No'}`);
        } else {
            console.log(`   ❌ ${category} - NOT FOUND`);
        }
    });
    console.log();
    
    // 5. Show a sample of the enriched data
    console.log('5. Sample enriched option (AI & Machine Learning):');
    const aiOption = db.prepare(`
        SELECT * FROM options 
        WHERE nodeId = 'root' AND label = 'AI & Machine Learning'
    `).get();
    
    if (aiOption) {
        console.log(`   Description: ${aiOption.description}`);
        const pros = aiOption.pros ? JSON.parse(aiOption.pros) : [];
        console.log(`   Pros (${pros.length}):`);
        pros.forEach((pro, idx) => {
            console.log(`     ${idx + 1}. ${pro}`);
        });
        const cons = aiOption.cons ? JSON.parse(aiOption.cons) : [];
        console.log(`   Cons (${cons.length}):`);
        cons.forEach((con, idx) => {
            console.log(`     ${idx + 1}. ${con}`);
        });
    }
    console.log();
    
    // 6. Check database version
    console.log('6. Database version:');
    const version = db.prepare(`
        SELECT version, updatedAt 
        FROM version 
        ORDER BY updatedAt DESC 
        LIMIT 1
    `).get();
    console.log(`   Version: ${version.version}`);
    console.log(`   Updated: ${version.updatedAt}`);
    console.log();
    
    // 7. Summary
    console.log('=== Summary ===');
    console.log(`✅ Total options in root node: ${rootOptions.length}`);
    console.log(`✅ Recently updated: ${recentOptions.length}`);
    
    const newServicesFound = expectedNewServices.filter(s => 
        rootOptions.find(opt => opt.label === s)
    ).length;
    console.log(`✅ New services added: ${newServicesFound}/${expectedNewServices.length}`);
    
    const enrichedFound = enrichedCategories.filter(c => {
        const opt = rootOptions.find(o => o.label === c);
        return opt && opt.pros_len > 100 && opt.cons_len > 100;
    }).length;
    console.log(`✅ Categories enriched: ${enrichedFound}/${enrichedCategories.length}`);
    
    console.log('\n✅ Verification complete!');
    
} catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
} finally {
    db.close();
}


