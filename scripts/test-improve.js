// Test script for the improve functionality
import Database from 'better-sqlite3';
import { improveNode } from '../js/research-service.js';
import { loadEnv } from './load-env.js';

// Load environment variables
loadEnv();

const db = new Database('./db/azure-wizard.db');

console.log('=== Testing Improve Functionality ===\n');

// 1. List available question nodes
console.log('1. Available question nodes:');
const questionNodes = db.prepare(`
    SELECT id, question, nodeType 
    FROM nodes 
    WHERE nodeType = 'question' 
    LIMIT 10
`).all();

if (questionNodes.length === 0) {
    console.log('❌ No question nodes found in the database!');
    process.exit(1);
}

questionNodes.forEach((node, idx) => {
    console.log(`   ${idx + 1}. ${node.id} - ${node.question}`);
});

// 2. Pick a node to test (messaging node is good for testing)
const testNodeId = questionNodes[0].id;
console.log(`\n2. Testing with node: ${testNodeId}`);

// Get current options before improvement
console.log(`\n3. Current options for ${testNodeId}:`);
const optionsBefore = db.prepare(`
    SELECT id, label, description, pros, cons 
    FROM options 
    WHERE nodeId = ?
`).all(testNodeId);

console.log(`   Found ${optionsBefore.length} existing options:`);
optionsBefore.forEach((opt, idx) => {
    const pros = opt.pros ? JSON.parse(opt.pros) : [];
    const cons = opt.cons ? JSON.parse(opt.cons) : [];
    console.log(`   ${idx + 1}. ${opt.label}`);
    console.log(`      Pros: ${pros.length} items`);
    console.log(`      Cons: ${cons.length} items`);
    console.log(`      Description length: ${opt.description ? opt.description.length : 0} chars`);
});

// 3. Run the improve function
console.log(`\n4. Running improve function...`);
try {
    const result = await improveNode(testNodeId);
    
    console.log('\n✅ Improve function completed!');
    console.log(`   New options added: ${result.newOptions?.length || 0}`);
    console.log(`   Existing options enriched: ${result.enrichedOptions?.length || 0}`);
    console.log(`   Database records created: ${result.created || 0}`);
    console.log(`   Database records updated: ${result.updated || 0}`);
    
    // Show new options
    if (result.newOptions && result.newOptions.length > 0) {
        console.log('\n5. New options added:');
        result.newOptions.forEach((opt, idx) => {
            console.log(`   ${idx + 1}. ${opt.label}`);
            console.log(`      Description: ${opt.description?.substring(0, 60)}...`);
            console.log(`      Pros: ${opt.pros?.length || 0} items`);
            console.log(`      Cons: ${opt.cons?.length || 0} items`);
        });
    } else {
        console.log('\n5. No new options were added.');
    }
    
    // Show enriched options
    if (result.enrichedOptions && result.enrichedOptions.length > 0) {
        console.log('\n6. Options that were enriched:');
        result.enrichedOptions.forEach((opt, idx) => {
            console.log(`   ${idx + 1}. ${opt.label}`);
        });
    } else {
        console.log('\n6. No options were enriched.');
    }
    
    // 4. Verify database updates
    console.log(`\n7. Verifying database updates:`);
    const optionsAfter = db.prepare(`
        SELECT id, label, description, pros, cons 
        FROM options 
        WHERE nodeId = ?
    `).all(testNodeId);
    
    console.log(`   Total options after improvement: ${optionsAfter.length}`);
    console.log(`   Change: ${optionsAfter.length - optionsBefore.length > 0 ? '+' : ''}${optionsAfter.length - optionsBefore.length} options`);
    
    // Check for enrichment
    const enrichedCount = optionsAfter.filter(opt => {
        const pros = opt.pros ? JSON.parse(opt.pros) : [];
        const cons = opt.cons ? JSON.parse(opt.cons) : [];
        const originalOpt = optionsBefore.find(o => o.id === opt.id);
        if (!originalOpt) return false; // New option, not enriched
        
        const originalPros = originalOpt.pros ? JSON.parse(originalOpt.pros) : [];
        const originalCons = originalOpt.cons ? JSON.parse(originalOpt.cons) : [];
        
        return pros.length > originalPros.length || cons.length > originalCons.length;
    }).length;
    
    if (enrichedCount > 0) {
        console.log(`   ✅ ${enrichedCount} options have more details now!`);
    }
    
    // 5. Check Azure offerings table
    console.log(`\n8. Checking Azure offerings table:`);
    const offeringsCount = db.prepare('SELECT COUNT(*) as count FROM azureOfferings').get();
    console.log(`   Total Azure offerings in database: ${offeringsCount.count}`);
    
    // Check if any offerings related to this category
    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(testNodeId);
    if (node && node.question) {
        console.log(`   Node category: ${node.question}`);
    }
    
    console.log('\n✅ Test completed successfully!');
    
} catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
} finally {
    db.close();
}


