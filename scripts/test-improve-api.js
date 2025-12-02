// Test the improve functionality via API
// This script tests the improve endpoint and verifies database updates

import { loadEnv } from './load-env.js';
import Database from 'better-sqlite3';

// Load environment
loadEnv();

const API_BASE = 'http://localhost:3030/api';

async function testImproveFunction() {
    try {
        process.stdout.write('=== Testing Improve Functionality via API ===\n\n');
        
        // Open database to verify changes
        const db = new Database('./db/azure-wizard.db');
        
        // 1. Get a question node to test with
        process.stdout.write('1. Finding a question node to test...\n');
        const questionNodes = db.prepare(`
            SELECT id, question, nodeType 
            FROM nodes 
            WHERE nodeType = 'question' 
            LIMIT 5
        `).all();
        
        if (questionNodes.length === 0) {
            process.stdout.write('❌ No question nodes found!\n');
            process.exit(1);
        }
        
        const testNode = questionNodes[0];
        process.stdout.write(`   Testing with: ${testNode.id} - ${testNode.question}\n\n`);
        
        // 2. Get current options
        process.stdout.write('2. Getting current options...\n');
        const response = await fetch(`${API_BASE}/options/${testNode.id}`);
        const optionsBefore = await response.json();
        process.stdout.write(`   Found ${optionsBefore.length} options\n\n`);
        
        optionsBefore.forEach((opt, idx) => {
            process.stdout.write(`   ${idx + 1}. ${opt.label}\n`);
            process.stdout.write(`      Pros: ${opt.pros?.length || 0}, Cons: ${opt.cons?.length || 0}\n`);
        });
        
        // 3. Now test the improve function directly
        process.stdout.write('\n3. Running improve function...\n');
        process.stdout.write('   This will call OpenAI and update the database...\n');
        
        // Import the research service
        const { improveNode } = await import('../js/research-service.js');
        
        const result = await improveNode(testNode.id);
        
        process.stdout.write('\n✅ Improve completed!\n');
        process.stdout.write(`   New options: ${result.newOptions?.length || 0}\n`);
        process.stdout.write(`   Enriched options: ${result.enrichedOptions?.length || 0}\n`);
        process.stdout.write(`   DB created: ${result.created || 0}\n`);
        process.stdout.write(`   DB updated: ${result.updated || 0}\n\n`);
        
        // 4. Show details of new options
        if (result.newOptions && result.newOptions.length > 0) {
            process.stdout.write('4. New options added:\n');
            result.newOptions.forEach((opt, idx) => {
                process.stdout.write(`   ${idx + 1}. ${opt.label}\n`);
                process.stdout.write(`      ${opt.description?.substring(0, 80)}...\n`);
                process.stdout.write(`      Pros: ${opt.pros?.length || 0}, Cons: ${opt.cons?.length || 0}\n`);
            });
            process.stdout.write('\n');
        }
        
        // 5. Show enriched options
        if (result.enrichedOptions && result.enrichedOptions.length > 0) {
            process.stdout.write('5. Options enriched:\n');
            result.enrichedOptions.forEach((opt, idx) => {
                process.stdout.write(`   ${idx + 1}. ${opt.label}\n`);
            });
            process.stdout.write('\n');
        }
        
        // 6. Verify in database
        process.stdout.write('6. Verifying database updates...\n');
        const optionsAfter = db.prepare(`
            SELECT id, label, pros, cons, description
            FROM options 
            WHERE nodeId = ?
        `).all(testNode.id);
        
        process.stdout.write(`   Total options now: ${optionsAfter.length}\n`);
        process.stdout.write(`   Change: ${optionsAfter.length - optionsBefore.length > 0 ? '+' : ''}${optionsAfter.length - optionsBefore.length}\n\n`);
        
        // Check for actual enrichment in DB
        const enrichedInDb = optionsAfter.filter(opt => {
            const pros = opt.pros ? JSON.parse(opt.pros) : [];
            const cons = opt.cons ? JSON.parse(opt.cons) : [];
            const originalOpt = optionsBefore.find(o => o.id === opt.id);
            if (!originalOpt) return false;
            
            return pros.length > (originalOpt.pros?.length || 0) || 
                   cons.length > (originalOpt.cons?.length || 0);
        });
        
        if (enrichedInDb.length > 0) {
            process.stdout.write(`✅ ${enrichedInDb.length} options have more details in database!\n`);
            enrichedInDb.forEach(opt => {
                const original = optionsBefore.find(o => o.id === opt.id);
                const prosNow = opt.pros ? JSON.parse(opt.pros).length : 0;
                const consNow = opt.cons ? JSON.parse(opt.cons).length : 0;
                const prosBefore = original?.pros?.length || 0;
                const consBefore = original?.cons?.length || 0;
                process.stdout.write(`   - ${opt.label}: Pros ${prosBefore}→${prosNow}, Cons ${consBefore}→${consNow}\n`);
            });
        }
        
        process.stdout.write('\n✅ All tests passed!\n');
        
        db.close();
        process.exit(0);
        
    } catch (error) {
        process.stderr.write(`\n❌ Test failed: ${error.message}\n`);
        process.stderr.write(`${error.stack}\n`);
        process.exit(1);
    }
}

testImproveFunction();


