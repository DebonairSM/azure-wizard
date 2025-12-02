#!/usr/bin/env node
/**
 * Check if root node and options exist in database
 */

import { getDatabase, closeDatabase } from '../db/database.js';

const db = getDatabase();

try {
    // Check root node
    const root = db.prepare('SELECT * FROM nodes WHERE id = ?').get('root');
    
    if (!root) {
        console.error('ERROR: Root node not found in database!');
        console.log('You need to run: node scripts/migrate-json-to-sqlite.js');
        process.exit(1);
    }
    
    console.log('✓ Root node found:');
    console.log(`  ID: ${root.id}`);
    console.log(`  Question: ${root.question || '(empty)'}`);
    console.log(`  Description: ${root.description || '(empty)'}`);
    console.log(`  NodeType: ${root.nodeType}`);
    
    // Check options
    const options = db.prepare('SELECT * FROM options WHERE nodeId = ? ORDER BY label').all('root');
    
    console.log(`\n✓ Options found: ${options.length}`);
    
    if (options.length === 0) {
        console.error('\nERROR: Root node has no options!');
        console.log('You need to run: node scripts/migrate-json-to-sqlite.js');
        process.exit(1);
    }
    
    console.log('\nFirst 5 options:');
    options.slice(0, 5).forEach(opt => {
        console.log(`  - ${opt.label} (${opt.id})`);
    });
    
    if (options.length > 5) {
        console.log(`  ... and ${options.length - 5} more`);
    }
    
    console.log('\n✓ Database looks good!');
    
} catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
} finally {
    closeDatabase();
}




