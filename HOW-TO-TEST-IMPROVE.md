# How to Test the Improve Functionality

## Quick Start

The improve functionality is already working! Here's how to test it yourself:

### Option 1: Test via Browser (Easiest)

1. **Open the application**
   ```
   http://localhost:3030
   ```

2. **Look for the "Improve" button**
   - It appears on question-type nodes (nodes with multiple choice options)
   - The root node "What type of solution?" has an Improve button

3. **Click the Improve button**
   - Button will change to "Improving..."
   - Wait ~60-120 seconds for OpenAI to analyze and respond
   - Page will auto-refresh when complete

4. **Verify the results**
   - Scroll through the options
   - You should see new Azure services added
   - Existing options should have more detailed descriptions

### Option 2: Test via Browser Console

1. Open Developer Tools (F12)

2. Click the Improve button

3. Watch the console for these messages:
   ```
   Batch update result: {...}
   Data version changed: X -> Y
   Data loaded successfully
   ```

4. Check for any new options added (you'll see them logged)

### Option 3: Test Programmatically

Create a test script:

```javascript
// test-improve.mjs
import { improveNode } from './js/research-service.js';
import { loadEnv } from './scripts/load-env.js';

loadEnv(); // Load OpenAI API key

// Test on root node
const result = await improveNode('root');

console.log('New options added:', result.newOptions?.length || 0);
console.log('Options enriched:', result.enrichedOptions?.length || 0);
console.log('Database records created:', result.created || 0);
console.log('Database records updated:', result.updated || 0);
```

Run it:
```bash
node test-improve.mjs
```

### Option 4: Verify Database Updates

Check the database directly:

#### Using SQLite command line:
```bash
sqlite3 db/azure-wizard.db

# Count options for root node
SELECT COUNT(*) FROM options WHERE nodeId='root';

# List all option labels
SELECT label FROM options WHERE nodeId='root' ORDER BY label;

# Check version
SELECT * FROM version ORDER BY updatedAt DESC LIMIT 1;

.exit
```

#### Using Node.js:
```javascript
import Database from 'better-sqlite3';

const db = new Database('./db/azure-wizard.db');

// Count options
const count = db.prepare('SELECT COUNT(*) as count FROM options WHERE nodeId = ?').get('root');
console.log('Total options:', count.count);

// List options with details
const options = db.prepare(`
    SELECT label, LENGTH(pros) as pros_len, LENGTH(cons) as cons_len 
    FROM options WHERE nodeId = ? 
    ORDER BY label
`).all('root');

options.forEach(o => {
    console.log(`- ${o.label}: ${o.pros_len} chars of pros, ${o.cons_len} chars of cons`);
});

db.close();
```

### Option 5: Test via API

```bash
# Get all options for root node
curl http://localhost:3030/api/options/root

# Get version info
curl http://localhost:3030/api/version
```

## What to Look For

### New Options Should Include:
- Azure Function Apps
- Azure Logic Apps
- Azure Event Hubs
- Azure Service Bus
- Azure Notification Hubs

### Enriched Options Should Have:
- AI & Machine Learning (enhanced)
- Compute Services (enhanced)
- Containers (enhanced)
- Data & Storage (enhanced)
- DevOps & CI/CD (enhanced)
- IoT (enhanced)
- Media Services (enhanced)

### Each Option Should Have:
- **label**: Service name
- **description**: 1-2 sentence description (100+ characters)
- **pros**: Array of advantages (3+ items)
- **cons**: Array of disadvantages (2+ items)
- **whenToUse**: Guidance on when to use (50+ characters)
- **whenNotToUse**: Guidance on when NOT to use (50+ characters)

## Expected Results

After running improve on the root node:

1. **Before Improve**:
   - ~6-10 basic category options
   - Minimal pros/cons
   - Short descriptions

2. **After Improve**:
   - 12-15+ options (original + new services)
   - Comprehensive pros/cons (3-5 items each)
   - Detailed descriptions (100-200+ characters)
   - "When to use" guidance
   - "When NOT to use" guidance

## Testing Other Nodes

You can test improve on any question-type node:

1. **Navigate to a question node**
   - Click through the wizard to reach any decision point
   - Look for the green "Improve" button

2. **Click Improve**
   - System will analyze that specific category
   - Will add missing Azure services relevant to that category
   - Will enrich existing options with more details

3. **Example nodes to test**:
   - Messaging services node
   - Storage services node
   - Database services node
   - Each will get category-specific improvements

## Troubleshooting

### Improve button not visible
- Check that you're on a "question" type node (not terminal/recipe node)
- Check browser console for errors

### "Improving..." hangs
- OpenAI API can take 60-120 seconds for comprehensive analysis
- Check browser console for errors
- Verify OpenAI API key is set correctly

### No new options appear
- Check browser console for "Batch update result"
- Verify database was updated (use Method 4 above)
- Check for errors in the console

### JSON parsing error
- This has been fixed in the latest code
- If you see it, make sure you have the latest version of openai-service.js

## Performance Notes

- **Normal execution time**: 60-120 seconds
- **API model used**: gpt-4o-mini (cost-effective)
- **Database operations**: Very fast (<100ms after API response)
- **UI refresh**: Automatic

## Files Created/Modified

When you run improve, these are updated:

1. **Database**: `db/azure-wizard.db`
   - `options` table: New rows and updated rows
   - `version` table: New version entry

2. **JSON backup** (optional): `data/seed-data.json`
   - Browser may prompt to save
   - Keeps JSON in sync with database

## Next Steps

Once you've verified improve works on the root node, you can:

1. Test on other categories/nodes
2. Use it to keep the knowledge base current
3. Add it to your regular maintenance workflow
4. Customize the OpenAI prompts for your specific needs

## Support

If you encounter issues:

1. Check `IMPROVE-FUNCTIONALITY-VERIFIED.md` for detailed test results
2. Review browser console logs
3. Verify OpenAI API key is configured
4. Check database permissions

---

Last updated: December 2, 2025
Status: ✅ Fully functional and tested


