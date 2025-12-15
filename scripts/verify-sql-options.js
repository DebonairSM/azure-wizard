#!/usr/bin/env node
/**
 * Quick verification script to check SQL Server options in the database
 */

import { initDatabase, closeDatabase } from '../db/database.js';

const db = initDatabase();

try {
    console.log('\n' + '='.repeat(60));
    console.log('SQL SERVER OPTIONS VERIFICATION');
    console.log('='.repeat(60) + '\n');

    // Check the node exists
    const node = db.prepare(`
        SELECT id, question, description 
        FROM nodes 
        WHERE id = 'sql-server-options'
    `).get();

    if (!node) {
        console.log('❌ sql-server-options node not found!');
        process.exit(1);
    }

    console.log('✓ Node found:');
    console.log(`  ID: ${node.id}`);
    console.log(`  Question: ${node.question}`);
    console.log(`  Description: ${node.description}\n`);

    // Check all options for this node
    const options = db.prepare(`
        SELECT id, label, description 
        FROM options 
        WHERE nodeId = 'sql-server-options'
        ORDER BY id
    `).all();

    console.log(`✓ Found ${options.length} option(s):\n`);
    
    options.forEach((option, index) => {
        console.log(`${index + 1}. ${option.label}`);
        console.log(`   ID: ${option.id}`);
        console.log(`   Description: ${option.description}`);
        console.log('');
    });

    // Check if the new option exists
    const vmOption = options.find(opt => opt.id === 'opt-sql-server-vm');
    
    if (vmOption) {
        console.log('✅ SUCCESS: SQL Server VM option is in the database!\n');
    } else {
        console.log('❌ WARNING: SQL Server VM option (opt-sql-server-vm) not found!\n');
    }

    // Check the recipe node
    const recipeNode = db.prepare(`
        SELECT id, nodeType 
        FROM nodes 
        WHERE id = 'sql-server-vm-recipe'
    `).get();

    if (recipeNode) {
        console.log('✅ Recipe node found: sql-server-vm-recipe\n');
    } else {
        console.log('❌ Recipe node (sql-server-vm-recipe) not found!\n');
    }

    // Check the transition
    const transition = db.prepare(`
        SELECT fromNodeId, fromOptionId, toNodeId 
        FROM paths 
        WHERE fromNodeId = 'sql-server-options' 
          AND fromOptionId = 'opt-sql-server-vm'
    `).get();

    if (transition) {
        console.log('✅ Transition found:');
        console.log(`   ${transition.fromNodeId} -> ${transition.fromOptionId} -> ${transition.toNodeId}\n`);
    } else {
        console.log('❌ Transition not found!\n');
    }

    console.log('='.repeat(60));
    console.log('Verification complete!\n');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
} finally {
    closeDatabase();
}



