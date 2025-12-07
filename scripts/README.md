# Scripts Directory

This directory contains consolidated scripts for managing the Azure Wizard database and running queries/tests.

## Consolidated Scripts

### 1. db-manager.js
Handles all database management operations.

**Commands:**
```bash
# Migrate JSON seed data to SQLite
node scripts/db-manager.js migrate-json

# Populate APIM offerings with detailed data
node scripts/db-manager.js populate-apim

# Migrate APIM offerings to azureOfferings table
node scripts/db-manager.js migrate-apim

# Ensure azureOfferings table exists
node scripts/db-manager.js ensure-table

# Run all operations in order
node scripts/db-manager.js all

# Show help
node scripts/db-manager.js help
```

**Replaces:**
- `migrate-json-to-sqlite.js`
- `populate-apim-offerings.js`
- `migrate-apim-to-azure-offerings.js`
- `ensure-azure-offerings-table.js`

### 2. db-query.js
Handles database queries and tests.

**Commands:**
```bash
# Run query examples on azureOfferings table
node scripts/db-query.js query

# Test AI Gateway data in apimOfferings table
node scripts/db-query.js test-ai-gateway

# Run all tests
node scripts/db-query.js test-all

# Show help
node scripts/db-query.js help
```

**Replaces:**
- `query-azure-offerings.js`
- `test-ai-gateway.js`

## Utility Scripts

These scripts remain separate as standalone utilities:

### kill-port.js
Kills a process using a specific port (Windows).

```bash
node scripts/kill-port.js 3030
```

### load-env.js
Loads OpenAI API key from .env and configures it for browser use.

```bash
node scripts/load-env.js
```

This script is automatically called by `server.js` during startup.

## NPM Scripts

Update your `package.json` scripts section to use the consolidated scripts:

```json
{
  "scripts": {
    "migrate": "node scripts/db-manager.js migrate-json",
    "populate-apim": "node scripts/db-manager.js populate-apim",
    "migrate-apim-to-azure": "node scripts/db-manager.js migrate-apim",
    "query-azure-offerings": "node scripts/db-query.js query",
    "test-ai-gateway": "node scripts/db-query.js test-ai-gateway"
  }
}
```

## Migration Guide

If you have been using the old scripts, here's how to migrate:

### Old Command → New Command

**Database Management:**
- `node scripts/migrate-json-to-sqlite.js` → `node scripts/db-manager.js migrate-json`
- `node scripts/populate-apim-offerings.js` → `node scripts/db-manager.js populate-apim`
- `node scripts/migrate-apim-to-azure-offerings.js` → `node scripts/db-manager.js migrate-apim`
- `node scripts/ensure-azure-offerings-table.js` → `node scripts/db-manager.js ensure-table`

**Queries & Tests:**
- `node scripts/query-azure-offerings.js` → `node scripts/db-query.js query`
- `node scripts/test-ai-gateway.js` → `node scripts/db-query.js test-ai-gateway`

**Utilities (unchanged):**
- `node scripts/kill-port.js [port]` - No change
- `node scripts/load-env.js` - No change

## Benefits of Consolidation

1. **Reduced File Count**: 8 scripts consolidated into 4 (2 main + 2 utilities)
2. **Consistent Interface**: All related operations use the same script with different commands
3. **Easier Maintenance**: Changes to database operations are in one file
4. **Better Organization**: Logical grouping of related functionality
5. **Simpler Documentation**: One place to understand all database operations

## Old Scripts (Deprecated)

The following scripts can be safely removed as their functionality is now in the consolidated scripts:

- `migrate-json-to-sqlite.js` (use `db-manager.js migrate-json`)
- `populate-apim-offerings.js` (use `db-manager.js populate-apim`)
- `migrate-apim-to-azure-offerings.js` (use `db-manager.js migrate-apim`)
- `ensure-azure-offerings-table.js` (use `db-manager.js ensure-table`)
- `query-azure-offerings.js` (use `db-query.js query`)
- `test-ai-gateway.js` (use `db-query.js test-ai-gateway`)

To remove old scripts:
```bash
rm scripts/migrate-json-to-sqlite.js
rm scripts/populate-apim-offerings.js
rm scripts/migrate-apim-to-azure-offerings.js
rm scripts/ensure-azure-offerings-table.js
rm scripts/query-azure-offerings.js
rm scripts/test-ai-gateway.js
```

## Script Architecture

```
scripts/
├── db-manager.js          # Database management (create, migrate, populate)
├── db-query.js           # Query examples and tests
├── kill-port.js          # Utility: Kill process on port
├── load-env.js           # Utility: Load environment variables
└── README.md             # This file
```

## Example Workflows

### Initial Setup
```bash
# 1. Migrate seed data to SQLite
node scripts/db-manager.js migrate-json

# 2. Populate APIM offerings
node scripts/db-manager.js populate-apim

# 3. Run tests to verify
node scripts/db-query.js test-ai-gateway
```

### Regular Updates
```bash
# Update APIM offerings data
node scripts/db-manager.js populate-apim

# Verify the update
node scripts/db-query.js query
```

### Schema Migration
```bash
# Migrate APIM data to new azureOfferings table
node scripts/db-manager.js migrate-apim

# Query the new table
node scripts/db-query.js query
```

### Complete Reset
```bash
# Run all operations in order
node scripts/db-manager.js all
```


