#!/usr/bin/env node
// Quick verification of improve functionality results
import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';

const db = new Database('./db/azure-wizard.db');
const results = [];

results.push('=== IMPROVE FUNCTIONALITY VERIFICATION ===\n');

// Count all options
const totalOptions = db.prepare(`
    SELECT COUNT(*) as count FROM options WHERE nodeId = 'root'
`).get();
results.push(`Total root node options: ${totalOptions.count}\n`);

// List all options with details
results.push('All options:');
const options = db.prepare(`
    SELECT label, 
           LENGTH(description) as desc_len,
           LENGTH(pros) as pros_len,
           LENGTH(cons) as cons_len,
           CASE 
               WHEN LENGTH(whenToUse) > 0 THEN 'Yes'
               ELSE 'No'
           END as has_when_to_use,
           CASE 
               WHEN LENGTH(whenNotToUse) > 0 THEN 'Yes'
               ELSE 'No'
           END as has_when_not_to_use
    FROM options 
    WHERE nodeId = 'root'
    ORDER BY label
`).all();

options.forEach((opt, idx) => {
    results.push(`\n${idx + 1}. ${opt.label}`);
    results.push(`   Description: ${opt.desc_len} chars`);
    results.push(`   Pros: ${opt.pros_len} chars`);
    results.push(`   Cons: ${opt.cons_len} chars`);
    results.push(`   When to use: ${opt.has_when_to_use}`);
    results.push(`   When NOT to use: ${opt.has_when_not_to_use}`);
});

// Check for new services
results.push('\n\nNew Azure service options (expected):');
const newServices = [
    'Azure Function Apps',
    'Azure Logic Apps',
    'Azure Event Hubs',
    'Azure Service Bus',
    'Azure Notification Hubs'
];

let foundCount = 0;
newServices.forEach(service => {
    const found = options.find(o => o.label === service);
    if (found) {
        results.push(`   ✅ ${service}`);
        foundCount++;
    } else {
        results.push(`   ❌ ${service} (not found)`);
    }
});

// Summary
results.push(`\n\n=== SUMMARY ===`);
results.push(`Total options: ${totalOptions.count}`);
results.push(`New services found: ${foundCount}/${newServices.length}`);
results.push(`\n${foundCount > 0 ? '✅ IMPROVE FUNCTIONALITY WORKING!' : '⚠️  No new services detected'}`);

// Database version
const version = db.prepare(`
    SELECT version, updatedAt FROM version ORDER BY updatedAt DESC LIMIT 1
`).get();
results.push(`\nDatabase version: ${version.version}`);
results.push(`Last updated: ${version.updatedAt}`);

db.close();

// Output
const output = results.join('\n');
console.log(output);

// Save to file
try {
    writeFileSync('./VERIFICATION-RESULTS.txt', output);
    console.log('\n✅ Results saved to VERIFICATION-RESULTS.txt');
} catch (err) {
    console.error('Could not save to file:', err.message);
}


