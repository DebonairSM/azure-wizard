-- Azure Wizard Database Schema

-- Version tracking
CREATE TABLE IF NOT EXISTS version (
    version TEXT PRIMARY KEY,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Nodes table
CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    question TEXT,
    description TEXT,
    nodeType TEXT NOT NULL,
    tags TEXT, -- JSON array stored as text
    azObjectives TEXT, -- JSON array stored as text
    roleFocus TEXT, -- JSON array stored as text
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nodes_nodeType ON nodes(nodeType);
CREATE INDEX IF NOT EXISTS idx_nodes_question ON nodes(question);

-- Options table
CREATE TABLE IF NOT EXISTS options (
    id TEXT PRIMARY KEY,
    nodeId TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    pros TEXT, -- JSON array stored as text
    cons TEXT, -- JSON array stored as text
    whenToUse TEXT,
    whenNotToUse TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nodeId) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_options_nodeId ON options(nodeId);

-- Paths table
CREATE TABLE IF NOT EXISTS paths (
    fromNodeId TEXT NOT NULL,
    fromOptionId TEXT NOT NULL,
    toNodeId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (fromNodeId, fromOptionId),
    FOREIGN KEY (fromNodeId) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (fromOptionId) REFERENCES options(id) ON DELETE CASCADE,
    FOREIGN KEY (toNodeId) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_paths_fromNodeId ON paths(fromNodeId);
CREATE INDEX IF NOT EXISTS idx_paths_fromOptionId ON paths(fromOptionId);
CREATE INDEX IF NOT EXISTS idx_paths_toNodeId ON paths(toNodeId);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    nodeId TEXT NOT NULL UNIQUE,
    title TEXT,
    steps TEXT, -- JSON array stored as text
    bicepOutline TEXT, -- JSON object stored as text
    terraformOutline TEXT, -- JSON object stored as text
    links TEXT, -- JSON array stored as text
    skillLevel TEXT,
    estimatedTime TEXT,
    configSchema TEXT, -- JSON object stored as text - configuration options for this recipe
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nodeId) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipes_nodeId ON recipes(nodeId);

-- Components table
CREATE TABLE IF NOT EXISTS components (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    configSchema TEXT, -- JSON object stored as text
    tags TEXT, -- JSON array stored as text
    pros TEXT, -- JSON array stored as text
    cons TEXT, -- JSON array stored as text
    recipeNodeId TEXT,
    azObjectives TEXT, -- JSON array stored as text
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);

-- Compatibility rules table
CREATE TABLE IF NOT EXISTS compatibilityRules (
    componentId1 TEXT NOT NULL,
    componentId2 TEXT NOT NULL,
    type TEXT NOT NULL, -- 'error', 'warning', 'info', 'success'
    reason TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (componentId1, componentId2),
    FOREIGN KEY (componentId1) REFERENCES components(id) ON DELETE CASCADE,
    FOREIGN KEY (componentId2) REFERENCES components(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_compatibility_componentId1 ON compatibilityRules(componentId1);
CREATE INDEX IF NOT EXISTS idx_compatibility_componentId2 ON compatibilityRules(componentId2);
CREATE INDEX IF NOT EXISTS idx_compatibility_type ON compatibilityRules(type);

-- Azure Service Offerings - Generic table for all Azure service SKUs/tiers
-- This schema uses a flexible JSON-based approach for easy extensibility
CREATE TABLE IF NOT EXISTS azureOfferings (
    id TEXT PRIMARY KEY,
    serviceName TEXT NOT NULL, -- e.g., 'API Management', 'Storage Account', 'SQL Database'
    skuName TEXT NOT NULL, -- e.g., 'Consumption', 'Developer', 'Basic', 'Standard', 'Premium'
    skuTier TEXT, -- Service tier/level
    version TEXT, -- Service version if applicable (e.g., 'v1', 'v2')
    category TEXT, -- Categorization (e.g., 'consumption', 'standard', 'premium', 'preview')
    
    -- Core information stored as JSON for flexibility
    metadata TEXT, -- JSON object with service-specific metadata
    
    -- Common fields
    description TEXT,
    purpose TEXT,
    pricingModel TEXT, -- 'pay-per-use', 'fixed-monthly', 'per-unit', etc.
    pricingInfo TEXT, -- JSON object with detailed pricing
    sla TEXT, -- SLA percentage or 'None'
    
    -- Structured arrays stored as JSON for easy querying and updates
    features TEXT, -- JSON array of features
    capabilities TEXT, -- JSON array of capabilities
    limitations TEXT, -- JSON array of limitations
    useCases TEXT, -- JSON array of use cases
    deploymentOptions TEXT, -- JSON array of deployment options
    
    -- Flexible attributes stored as JSON object
    -- This allows adding new features without schema changes
    attributes TEXT, -- JSON object: {"vnetSupport": true, "multiRegion": false, "aiGateway": true, ...}
    
    -- Service-specific details as JSON
    networking TEXT, -- JSON object with networking capabilities
    scaling TEXT, -- JSON object with scaling information
    regions TEXT, -- JSON array of supported regions
    
    -- Links and documentation
    documentationLinks TEXT, -- JSON array of documentation links
    
    -- Flags
    isPreview BOOLEAN DEFAULT 0,
    isRecommended BOOLEAN DEFAULT 0,
    isProductionReady BOOLEAN DEFAULT 0,
    
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_azureOfferings_serviceName ON azureOfferings(serviceName);
CREATE INDEX IF NOT EXISTS idx_azureOfferings_skuTier ON azureOfferings(skuTier);
CREATE INDEX IF NOT EXISTS idx_azureOfferings_version ON azureOfferings(version);
CREATE INDEX IF NOT EXISTS idx_azureOfferings_category ON azureOfferings(category);
CREATE INDEX IF NOT EXISTS idx_azureOfferings_isProductionReady ON azureOfferings(isProductionReady);

-- Legacy APIM Offerings table (backward compatibility)
-- Consider migrating to azureOfferings with serviceName='API Management'
CREATE TABLE IF NOT EXISTS apimOfferings (
    id TEXT PRIMARY KEY,
    skuName TEXT NOT NULL,
    skuTier TEXT NOT NULL,
    version TEXT,
    category TEXT,
    description TEXT,
    purpose TEXT,
    pricingModel TEXT,
    pricingInfo TEXT,
    sla TEXT,
    features TEXT,
    capabilities TEXT,
    limitations TEXT,
    useCases TEXT,
    maxScaleUnits INTEGER,
    cachePerUnit TEXT,
    vnetSupport BOOLEAN DEFAULT 0,
    multiRegion BOOLEAN DEFAULT 0,
    selfHostedGateway BOOLEAN DEFAULT 0,
    developerPortal BOOLEAN DEFAULT 0,
    analytics BOOLEAN DEFAULT 0,
    aiGateway BOOLEAN DEFAULT 0,
    mcpSupport BOOLEAN DEFAULT 0,
    websocketSupport BOOLEAN DEFAULT 0,
    productionReady BOOLEAN DEFAULT 0,
    documentationLinks TEXT,
    aiGatewayDetails TEXT, -- JSON object with comprehensive AI Gateway capabilities
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apimOfferings_skuTier ON apimOfferings(skuTier);
CREATE INDEX IF NOT EXISTS idx_apimOfferings_category ON apimOfferings(category);
CREATE INDEX IF NOT EXISTS idx_apimOfferings_version ON apimOfferings(version);
CREATE INDEX IF NOT EXISTS idx_apimOfferings_productionReady ON apimOfferings(productionReady);

-- Azure Resource Changelog - Track discovered changes in Azure offerings
CREATE TABLE IF NOT EXISTS azureResourceChangelog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serviceName TEXT NOT NULL,
    skuName TEXT,
    changeType TEXT NOT NULL, -- 'added', 'removed', 'updated', 'deprecated'
    changeDetails TEXT, -- JSON with before/after details
    detectedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_changelog_serviceName ON azureResourceChangelog(serviceName);
CREATE INDEX IF NOT EXISTS idx_changelog_changeType ON azureResourceChangelog(changeType);
CREATE INDEX IF NOT EXISTS idx_changelog_detectedAt ON azureResourceChangelog(detectedAt);

