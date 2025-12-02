#!/usr/bin/env node
/**
 * CLI tool to add a new option to the database
 */

import { getDatabase, closeDatabase } from '../db/database.js';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise(resolve => rl.question(prompt, resolve));
}

async function addOption() {
    try {
        const db = getDatabase();
        
        console.log('Add a new option to a node\n');
        
        const id = await question('Option ID: ');
        if (!id) {
            console.error('Option ID is required');
            process.exit(1);
        }
        
        // Check if option exists
        const existing = db.prepare('SELECT id FROM options WHERE id = ?').get(id);
        if (existing) {
            console.error(`Option with ID "${id}" already exists`);
            process.exit(1);
        }
        
        const nodeId = await question('Node ID: ');
        if (!nodeId) {
            console.error('Node ID is required');
            process.exit(1);
        }
        
        // Verify node exists
        const node = db.prepare('SELECT id FROM nodes WHERE id = ?').get(nodeId);
        if (!node) {
            console.error(`Node "${nodeId}" not found`);
            process.exit(1);
        }
        
        const label = await question('Label: ');
        if (!label) {
            console.error('Label is required');
            process.exit(1);
        }
        
        const description = await question('Description: ');
        
        const prosInput = await question('Pros (comma-separated): ');
        const pros = prosInput ? prosInput.split(',').map(p => p.trim()) : [];
        
        const consInput = await question('Cons (comma-separated): ');
        const cons = consInput ? consInput.split(',').map(c => c.trim()) : [];
        
        const whenToUse = await question('When to use: ');
        const whenNotToUse = await question('When not to use: ');
        
        const insert = db.prepare(`
            INSERT INTO options (id, nodeId, label, description, pros, cons, whenToUse, whenNotToUse)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        insert.run(
            id,
            nodeId,
            label,
            description || null,
            pros.length > 0 ? JSON.stringify(pros) : null,
            cons.length > 0 ? JSON.stringify(cons) : null,
            whenToUse || null,
            whenNotToUse || null
        );
        
        // Update version
        const version = new Date().toISOString().split('T')[0].replace(/-/g, '.');
        db.prepare(`
            INSERT INTO version (version, updatedAt)
            VALUES (?, CURRENT_TIMESTAMP)
        `).run(version);
        
        console.log(`\nOption "${id}" added successfully!`);
        console.log(`Version updated to: ${version}`);
        
    } catch (error) {
        console.error('Error adding option:', error);
        process.exit(1);
    } finally {
        closeDatabase();
        rl.close();
    }
}

addOption();





