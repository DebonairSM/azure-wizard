#!/usr/bin/env node
/**
 * Verify database has root node and options, and provide fix if needed
 */

import { getDatabase, closeDatabase } from '../db/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = getDatabase();

try {
    console.log('Checking database...\n');
    
    // Check root node
    const root = db.prepare('SELECT * FROM nodes WHERE id = ?').get('root');
    
    if (!root) {
        console.error('❌ Root node NOT FOUND in database!');
        console.log('\nTo fix: Run "npm run migrate" to populate the database.\n');
        process.exit(1);
    }
    
    console.log('✓ Root node found:');
    console.log(`  ID: ${root.id}`);
    console.log(`  Question: ${root.question || '(EMPTY - this is the problem!)'}`);
    console.log(`  Description: ${root.description || '(empty)'}`);
    console.log(`  NodeType: ${root.nodeType}\n`);
    
    // Check options
    const options = db.prepare('SELECT * FROM options WHERE nodeId = ? ORDER BY label').all('root');
    
    console.log(`✓ Options found: ${options.length}`);
    
    // Also check components to show why builder mode works
    const components = db.prepare('SELECT COUNT(*) as count FROM components').get();
    console.log(`✓ Components found: ${components.count} (this is why builder mode works!)`);
    
    if (options.length === 0) {
        console.error('\n❌ Root node has NO OPTIONS! This is why wizard mode shows nothing.');
        console.log(`   But builder mode works because it has ${components.count} components.`);
        console.log('\nTo fix: Run "npm run migrate" to populate nodes and options.\n');
        process.exit(1);
    }
    
    console.log('\nFirst 5 options:');
    options.slice(0, 5).forEach(opt => {
        console.log(`  - ${opt.label} (${opt.id})`);
    });
    
    if (options.length > 5) {
        console.log(`  ... and ${options.length - 5} more`);
    }
    
    // Check if question is empty
    if (!root.question) {
        console.error('\n⚠️  WARNING: Root node question is empty!');
        console.log('The question should be: "What type of solution?"');
        
        // Try to fix it
        const seedDataPath = join(__dirname, '..', 'data', 'seed-data.json');
        if (require('fs').existsSync(seedDataPath)) {
            const seedData = JSON.parse(readFileSync(seedDataPath, 'utf8'));
            const rootFromSeed = seedData.nodes.find(n => n.id === 'root');
            if (rootFromSeed && rootFromSeed.question) {
                console.log('\nAttempting to fix question...');
                db.prepare('UPDATE nodes SET question = ? WHERE id = ?').run(rootFromSeed.question, 'root');
                console.log('✓ Question updated!');
            }
        }
    }
    
    console.log('\n✓ Database looks good!');
    console.log('\nIf you still see nothing on the page:');
    console.log('1. Check the server console for debug logs');
    console.log('2. Hard refresh the browser (Ctrl+Shift+R)');
    console.log('3. Check browser console for errors\n');
    
} catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
} finally {
    closeDatabase();
}




