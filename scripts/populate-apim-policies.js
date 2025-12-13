#!/usr/bin/env node
/**
 * Populate APIM Policies - Load policy definitions from seed data into database
 * 
 * Usage: node scripts/populate-apim-policies.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DATA_PATH = path.join(__dirname, '..', 'data', 'apim-policies-seed.json');

/**
 * Parse JSON array from text
 */
function parseJsonArray(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

/**
 * Stringify JSON object
 */
function stringifyJsonObject(obj) {
    if (!obj || typeof obj !== 'object') return null;
    return JSON.stringify(obj);
}

/**
 * Populate APIM policies from seed data
 */
function populateApimPolicies() {
    console.log('Loading APIM policies seed data...');
    
    // Read seed data
    if (!fs.existsSync(SEED_DATA_PATH)) {
        console.error(`Error: Seed data file not found at ${SEED_DATA_PATH}`);
        process.exit(1);
    }
    
    const seedData = JSON.parse(fs.readFileSync(SEED_DATA_PATH, 'utf8'));
    const policies = seedData.policies || [];
    
    console.log(`Found ${policies.length} policies in seed data`);
    
    // Initialize database
    const db = initDatabase();
    
    // Clear existing policies
    db.prepare('DELETE FROM apimPolicies').run();
    console.log('✓ Cleared existing APIM policies data');
    
    // Prepare insert statement
    const insert = db.prepare(`
        INSERT INTO apimPolicies (
            id, name, category, scope, description, parameters, xmlTemplate,
            bicepTemplate, documentation, compatibility, examples
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let inserted = 0;
    let errors = 0;
    
    // Insert policies
    for (const policy of policies) {
        try {
            insert.run(
                policy.id,
                policy.name,
                policy.category,
                stringifyJsonObject(policy.scope || []),
                policy.description || null,
                stringifyJsonObject(policy.parameters || {}),
                stringifyJsonObject(policy.xmlTemplate || {}),
                policy.bicepTemplate || null,
                policy.documentation || null,
                stringifyJsonObject(policy.compatibility || {}),
                stringifyJsonObject(policy.examples || [])
            );
            inserted++;
        } catch (error) {
            console.error(`Error inserting policy ${policy.id}:`, error.message);
            errors++;
        }
    }
    
    console.log(`✓ Inserted ${inserted} APIM policies`);
    if (errors > 0) {
        console.warn(`⚠ ${errors} errors encountered`);
    }
    
    // Show summary by category
    const byCategory = db.prepare(`
        SELECT category, COUNT(*) as count 
        FROM apimPolicies 
        GROUP BY category 
        ORDER BY category
    `).all();
    
    console.log('\nPolicies by category:');
    for (const row of byCategory) {
        console.log(`  ${row.category}: ${row.count}`);
    }
    
    // Show summary by scope
    const allPolicies = db.prepare('SELECT id, scope FROM apimPolicies').all();
    const scopeCounts = {
        global: 0,
        product: 0,
        api: 0,
        operation: 0
    };
    
    for (const policy of allPolicies) {
        const scopes = parseJsonArray(policy.scope) || [];
        for (const scope of scopes) {
            if (scopeCounts.hasOwnProperty(scope)) {
                scopeCounts[scope]++;
            }
        }
    }
    
    console.log('\nPolicies by scope:');
    for (const [scope, count] of Object.entries(scopeCounts)) {
        console.log(`  ${scope}: ${count}`);
    }
    
    closeDatabase();
    console.log('\n✓ APIM policies population complete');
    
    return true;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        populateApimPolicies();
        process.exit(0);
    } catch (error) {
        console.error('Error populating APIM policies:', error);
        process.exit(1);
    }
}

export { populateApimPolicies };
