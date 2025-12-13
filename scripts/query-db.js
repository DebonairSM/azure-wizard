#!/usr/bin/env node
/**
 * Quick database query script
 * Usage: node scripts/query-db.js "SELECT * FROM table WHERE condition"
 */

import { initDatabase, closeDatabase } from '../db/database.js';

const query = process.argv[2];

if (!query) {
    console.error('Usage: node scripts/query-db.js "SELECT ... FROM ... WHERE ..."');
    process.exit(1);
}

const db = initDatabase();

try {
    const result = db.prepare(query).all();
    
    if (result.length === 0) {
        console.log('No results found.');
    } else {
        // Pretty print JSON results
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    console.error('Query error:', error.message);
    process.exit(1);
} finally {
    closeDatabase();
}





