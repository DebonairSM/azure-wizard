console.log('Starting test...');

import Database from 'better-sqlite3';

console.log('Opening database...');
const db = new Database('./db/azure-wizard.db');

console.log('Querying nodes...');
const nodes = db.prepare('SELECT COUNT(*) as count FROM nodes').get();
console.log('Node count:', nodes);

console.log('Querying question nodes...');
const questionNodes = db.prepare(`
    SELECT id, question, nodeType 
    FROM nodes 
    WHERE nodeType = 'question' 
    LIMIT 5
`).all();

console.log('Question nodes found:', questionNodes.length);
questionNodes.forEach(node => {
    console.log(`- ${node.id}: ${node.question}`);
});

db.close();
console.log('Done!');


