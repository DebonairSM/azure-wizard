// Quick test script to verify APIM offerings data
import { getDatabase, initDatabase } from '../db/database.js';

const db = initDatabase();

try {
    const count = db.prepare('SELECT COUNT(*) as count FROM apimOfferings').get();
    console.log(`Total APIM offerings: ${count.count}`);
    
    if (count.count > 0) {
        const offerings = db.prepare('SELECT id, skuName, skuTier, version, category FROM apimOfferings LIMIT 5').all();
        console.log('Sample offerings:');
        offerings.forEach(offering => {
            console.log(`  - ${offering.skuName} (${offering.skuTier}) - ${offering.version} - ${offering.category}`);
        });
    } else {
        console.log('No offerings found. Run populate-apim-offerings.js first.');
    }
} catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('no such table')) {
        console.log('Table does not exist. The database may need to be initialized.');
    }
}




