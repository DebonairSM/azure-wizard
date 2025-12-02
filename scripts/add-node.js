#!/usr/bin/env node
/**
 * CLI tool to add a new node to the database
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

async function addNode() {
    try {
        const db = getDatabase();
        
        console.log('Add a new node to the wizard\n');
        
        const id = await question('Node ID: ');
        if (!id) {
            console.error('Node ID is required');
            process.exit(1);
        }
        
        // Check if node exists
        const existing = db.prepare('SELECT id FROM nodes WHERE id = ?').get(id);
        if (existing) {
            console.error(`Node with ID "${id}" already exists`);
            process.exit(1);
        }
        
        const nodeType = await question('Node type (root/question/terminal) [question]: ') || 'question';
        const questionText = await question('Question: ');
        const description = await question('Description: ');
        
        const tagsInput = await question('Tags (comma-separated): ');
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];
        
        const azObjectivesInput = await question('AZ-204 Objectives (comma-separated): ');
        const azObjectives = azObjectivesInput ? azObjectivesInput.split(',').map(o => o.trim()) : [];
        
        const roleFocusInput = await question('Role Focus (comma-separated): ');
        const roleFocus = roleFocusInput ? roleFocusInput.split(',').map(r => r.trim()) : [];
        
        const insert = db.prepare(`
            INSERT INTO nodes (id, question, description, nodeType, tags, azObjectives, roleFocus)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        insert.run(
            id,
            questionText || null,
            description || null,
            nodeType,
            tags.length > 0 ? JSON.stringify(tags) : null,
            azObjectives.length > 0 ? JSON.stringify(azObjectives) : null,
            roleFocus.length > 0 ? JSON.stringify(roleFocus) : null
        );
        
        // Update version
        const version = new Date().toISOString().split('T')[0].replace(/-/g, '.');
        db.prepare(`
            INSERT INTO version (version, updatedAt)
            VALUES (?, CURRENT_TIMESTAMP)
        `).run(version);
        
        console.log(`\nNode "${id}" added successfully!`);
        console.log(`Version updated to: ${version}`);
        
    } catch (error) {
        console.error('Error adding node:', error);
        process.exit(1);
    } finally {
        closeDatabase();
        rl.close();
    }
}

addNode();





