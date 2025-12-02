# Database Schema Extensibility Analysis

## Current Issues (Fixed)

### 1. Duplicate Table Definition
The `apimOfferings` table was defined twice in `schema.sql`, which could cause conflicts. This has been resolved.

### 2. Schema Rigidity
The original schema had many hardcoded boolean columns for specific features:
- `vnetSupport`, `multiRegion`, `selfHostedGateway`
- `aiGateway`, `mcpSupport`, `websocketSupport`
- `developerPortal`, `analytics`, `productionReady`

**Problem:** When Azure adds new features, you need to:
- Run `ALTER TABLE` migrations
- Update all existing records
- Modify application code
- Handle migration rollbacks

### 3. Service-Specific Design
The schema was tailored only for API Management, requiring separate tables for each Azure service (SQL Database, Storage, Functions, etc.).

## Improved Schema Design

### New `azureOfferings` Table
A generic, extensible table that works for all Azure services:

**Key Improvements:**
1. **JSON-based attributes** - New features can be added without schema changes
2. **Service-agnostic** - Works for APIM, SQL Database, Storage, Functions, etc.
3. **Flexible metadata** - Service-specific details stored in JSON
4. **Easy updates** - Update JSON fields without ALTER TABLE

**Example Usage:**

```sql
-- API Management offering
INSERT INTO azureOfferings (id, serviceName, skuName, attributes) VALUES (
    'apim-consumption',
    'API Management',
    'Consumption',
    '{"vnetSupport": false, "multiRegion": false, "aiGateway": false}'
);

-- SQL Database offering  
INSERT INTO azureOfferings (id, serviceName, skuName, attributes) VALUES (
    'sql-db-basic',
    'SQL Database',
    'Basic',
    '{"maxSizeGB": 2, "backupRetentionDays": 7, "zoneRedundancy": false}'
);
```

**Querying JSON attributes:**

```sql
-- Find offerings with VNET support
SELECT * FROM azureOfferings 
WHERE json_extract(attributes, '$.vnetSupport') = 1;

-- Find all APIM v2 offerings with AI Gateway
SELECT * FROM azureOfferings
WHERE serviceName = 'API Management'
  AND version = 'v2'
  AND json_extract(attributes, '$.aiGateway') = 1;
```

## Migration Strategy

### Option 1: Keep Legacy Table (Recommended for now)
- Keep `apimOfferings` for backward compatibility
- New services use `azureOfferings`
- Gradually migrate APIM data when convenient

### Option 2: Migrate Immediately
Create a migration script to move APIM data:

```javascript
// Migrate APIM offerings to azureOfferings
const apimRows = db.prepare('SELECT * FROM apimOfferings').all();
for (const row of apimRows) {
    const attributes = {
        vnetSupport: row.vnetSupport,
        multiRegion: row.multiRegion,
        selfHostedGateway: row.selfHostedGateway,
        developerPortal: row.developerPortal,
        analytics: row.analytics,
        aiGateway: row.aiGateway,
        mcpSupport: row.mcpSupport,
        websocketSupport: row.websocketSupport
    };
    
    db.prepare(`
        INSERT INTO azureOfferings (
            id, serviceName, skuName, skuTier, version, category,
            description, purpose, pricingModel, pricingInfo, sla,
            features, capabilities, limitations, useCases,
            attributes, isProductionReady, documentationLinks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        row.id,
        'API Management',
        row.skuName,
        row.skuTier,
        row.version,
        row.category,
        row.description,
        row.purpose,
        row.pricingModel,
        row.pricingInfo,
        row.sla,
        row.features,
        row.capabilities,
        row.limitations,
        row.useCases,
        JSON.stringify(attributes),
        row.productionReady,
        row.documentationLinks
    );
}
```

## Best Practices for Extensibility

### 1. Use JSON for Variable Attributes
Store frequently-changing or service-specific attributes in JSON:

```json
{
  "vnetSupport": true,
  "multiRegion": true,
  "maxScaleUnits": 10,
  "cachePerUnit": "5 GB",
  "newFeatureAdded2025": true  // No schema change needed!
}
```

### 2. Use Structured Tables for Queryable Fields
Keep commonly-queried fields as columns:

- `serviceName`, `skuName`, `version` (for filtering)
- `isProductionReady`, `isPreview` (for flags)
- `pricingModel`, `sla` (for comparison)

### 3. Use Arrays for Multi-Valued Data
Store lists in JSON arrays:

```json
{
  "features": ["Feature A", "Feature B"],
  "regions": ["East US", "West US", "Europe"]
}
```

### 4. Version Your Schema
Track schema versions to manage migrations:

```sql
INSERT INTO version (version) VALUES ('1.1.0');
```

## Adding New Azure Services

With the new schema, adding a new service is simple:

```sql
-- Add Azure Functions Premium offering
INSERT INTO azureOfferings (
    id, serviceName, skuName, skuTier, version,
    description, pricingModel, attributes
) VALUES (
    'functions-premium',
    'Azure Functions',
    'Premium',
    'Premium',
    'v3',
    'Premium plan with dedicated VMs',
    'per-second',
    '{
        "alwaysReadyInstances": 1,
        "maximumInstances": 20,
        "vnetIntegration": true,
        "coldStart": false,
        "ephemeralOSDisk": true
    }'
);
```

No schema changes required!

## Querying the Flexible Schema

### Simple Queries
```sql
-- All offerings for a service
SELECT * FROM azureOfferings WHERE serviceName = 'API Management';

-- Production-ready offerings
SELECT * FROM azureOfferings WHERE isProductionReady = 1;
```

### JSON Attribute Queries
```sql
-- Offerings with specific attribute
SELECT * FROM azureOfferings 
WHERE json_extract(attributes, '$.vnetSupport') = 1;

-- Offerings with numeric attributes
SELECT * FROM azureOfferings
WHERE json_extract(attributes, '$.maxScaleUnits') >= 5;
```

### Complex Queries
```sql
-- Production-ready APIM v2 offerings with AI Gateway
SELECT * FROM azureOfferings
WHERE serviceName = 'API Management'
  AND version = 'v2'
  AND isProductionReady = 1
  AND json_extract(attributes, '$.aiGateway') = 1;
```

## Conclusion

The new `azureOfferings` table provides:

✅ **Extensibility** - Add new features without schema changes  
✅ **Genericity** - Works for all Azure services  
✅ **Queryability** - Still supports efficient queries  
✅ **Maintainability** - Easier to update and extend  
✅ **Flexibility** - Accommodates service-specific needs  

This approach follows the **Entity-Attribute-Value (EAV) pattern** where variable attributes are stored in JSON, while common queryable fields remain as columns for performance.




