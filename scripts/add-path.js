#!/usr/bin/env node
/**
 * CLI tool to add a new path to the database
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

async function addPath() {
    try {
        const db = getDatabase();
        
        console.log('Add a new path (connection between nodes)\n');
        
        const fromNodeId = await question('From Node ID: ');
        if (!fromNodeId) {
            console.error('From Node ID is required');
            process.exit(1);
        }
        
        // Verify from node exists
        const fromNode = db.prepare('SELECT id FROM nodes WHERE id = ?').get(fromNodeId);
        if (!fromNode) {
            console.error(`Node "${fromNodeId}" not found`);
            process.exit(1);
        }
        
        const fromOptionId = await question('From Option ID: ');
        if (!fromOptionId) {
            console.error('From Option ID is required');
            process.exit(1);
        }
        
        // Verify option exists
        const option = db.prepare('SELECT id FROM options WHERE id = ?').get(fromOptionId);
        if (!option) {
            console.error(`Option "${fromOptionId}" not found`);
            process.exit(1);
        }
        
        const toNodeId = await question('To Node ID: ');
        if (!toNodeId) {
            console.error('To Node ID is required');
            process.exit(1);
        }
        
        // Verify to node exists
        const toNode = db.prepare('SELECT id FROM nodes WHERE id = ?').get(toNodeId);
        if (!toNode) {
            console.error(`Node "${toNodeId}" not found`);
            process.exit(1);
        }
        
        // Check if path already exists
        const existing = db.prepare(`
            SELECT * FROM paths 
            WHERE fromNodeId = ? AND fromOptionId = ?
        `).get(fromNodeId, fromOptionId);
        
        if (existing) {
            const update = db.prepare(`
                UPDATE paths SET toNodeId = ? 
                WHERE fromNodeId = ? AND fromOptionId = ?
            `);
            update.run(toNodeId, fromNodeId, fromOptionId);
            console.log(`\nPath updated successfully!`);
        } else {
            const insert = db.prepare(`
                INSERT INTO paths (fromNodeId, fromOptionId, toNodeId)
                VALUES (?, ?, ?)
            `);
            insert.run(fromNodeId, fromOptionId, toNodeId);
            console.log(`\nPath added successfully!`);
        }
        
        // Update version
        const version = new Date().toISOString().split('T')[0].replace(/-/g, '.');
        db.prepare(`
            INSERT INTO version (version, updatedAt)
            VALUES (?, CURRENT_TIMESTAMP)
        `).run(version);
        
        console.log(`Version updated to: ${version}`);
        
    } catch (error) {
        console.error('Error adding path:', error);
        if (error.code === 'SQLITE_CONSTRAINT') {
            console.error('Foreign key constraint failed. Check that all nodes and options exist.');
        }
        process.exit(1);
    } finally {
        closeDatabase();
        rl.close();
    }
}

addPath();





