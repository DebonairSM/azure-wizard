#!/usr/bin/env node
/**
 * Helper script to write JSON data directly to seed-data.json
 * Can be called from the browser via fetch or run directly from command line
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'seed-data.json');

if (require.main === module) {
    // Called from command line
    const data = process.stdin.read();
    if (data) {
        try {
            const jsonData = JSON.parse(data.toString());
            fs.writeFileSync(DATA_FILE, JSON.stringify(jsonData, null, 2), 'utf8');
            console.log(JSON.stringify({ success: true, version: jsonData.version }));
            process.exit(0);
        } catch (error) {
            console.error(JSON.stringify({ success: false, error: error.message }));
            process.exit(1);
        }
    } else {
        // Read from file path argument
        const filePath = process.argv[2];
        if (!filePath) {
            console.error(JSON.stringify({ success: false, error: 'No data provided' }));
            process.exit(1);
        }
        try {
            const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            fs.writeFileSync(DATA_FILE, JSON.stringify(jsonData, null, 2), 'utf8');
            console.log(JSON.stringify({ success: true, version: jsonData.version }));
            process.exit(0);
        } catch (error) {
            console.error(JSON.stringify({ success: false, error: error.message }));
            process.exit(1);
        }
    }
}

module.exports = { DATA_FILE };








