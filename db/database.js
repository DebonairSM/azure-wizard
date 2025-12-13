// Database connection and initialization
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'data', 'wizard.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

/**
 * Initialize database connection and schema
 * @returns {Database}
 */
export function initDatabase() {
    if (db) {
        return db;
    }

    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Open database
    db = new Database(DB_PATH);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Initialize schema if tables don't exist
    if (!tableExists('nodes')) {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        db.exec(schema);
        console.log('Database schema initialized');
    }
    
    // Ensure apimOfferings table exists (for existing databases)
    if (!tableExists('apimOfferings')) {
        const apimTableSchema = `
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
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_apimOfferings_skuTier ON apimOfferings(skuTier);
            CREATE INDEX IF NOT EXISTS idx_apimOfferings_category ON apimOfferings(category);
            CREATE INDEX IF NOT EXISTS idx_apimOfferings_version ON apimOfferings(version);
            CREATE INDEX IF NOT EXISTS idx_apimOfferings_productionReady ON apimOfferings(productionReady);
        `;
        db.exec(apimTableSchema);
        console.log('APIM offerings table created');
    }

    // Ensure azureOfferings table exists (for existing databases)
    if (!tableExists('azureOfferings')) {
        const azureOfferingsSchema = `
            CREATE TABLE IF NOT EXISTS azureOfferings (
                id TEXT PRIMARY KEY,
                serviceName TEXT NOT NULL,
                skuName TEXT NOT NULL,
                skuTier TEXT,
                version TEXT,
                category TEXT,
                metadata TEXT,
                description TEXT,
                purpose TEXT,
                pricingModel TEXT,
                pricingInfo TEXT,
                sla TEXT,
                features TEXT,
                capabilities TEXT,
                limitations TEXT,
                useCases TEXT,
                deploymentOptions TEXT,
                attributes TEXT,
                networking TEXT,
                scaling TEXT,
                regions TEXT,
                documentationLinks TEXT,
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
        `;
        db.exec(azureOfferingsSchema);
        console.log('Azure offerings table created');
    }

    // Ensure apimPolicies table exists (for existing databases)
    if (!tableExists('apimPolicies')) {
        const apimPoliciesSchema = `
            CREATE TABLE IF NOT EXISTS apimPolicies (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                scope TEXT,
                description TEXT,
                parameters TEXT,
                xmlTemplate TEXT,
                bicepTemplate TEXT,
                documentation TEXT,
                compatibility TEXT,
                examples TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_apimPolicies_category ON apimPolicies(category);
            CREATE INDEX IF NOT EXISTS idx_apimPolicies_name ON apimPolicies(name);
        `;
        db.exec(apimPoliciesSchema);
        console.log('APIM policies table created');
    }

    // Ensure apimPolicyConfigurations table exists (for existing databases)
    if (!tableExists('apimPolicyConfigurations')) {
        const apimPolicyConfigurationsSchema = `
            CREATE TABLE IF NOT EXISTS apimPolicyConfigurations (
                id TEXT PRIMARY KEY,
                policyId TEXT NOT NULL,
                scope TEXT NOT NULL,
                scopeId TEXT,
                configuration TEXT,
                bicepResource TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (policyId) REFERENCES apimPolicies(id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_apimPolicyConfigurations_policyId ON apimPolicyConfigurations(policyId);
            CREATE INDEX IF NOT EXISTS idx_apimPolicyConfigurations_scope ON apimPolicyConfigurations(scope);
            CREATE INDEX IF NOT EXISTS idx_apimPolicyConfigurations_scopeId ON apimPolicyConfigurations(scopeId);
        `;
        db.exec(apimPolicyConfigurationsSchema);
        console.log('APIM policy configurations table created');
    }

    return db;
}

/**
 * Check if a table exists
 * @param {string} tableName
 * @returns {boolean}
 */
function tableExists(tableName) {
    const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
    `).get(tableName);
    return !!result;
}

/**
 * Get database instance
 * @returns {Database}
 */
export function getDatabase() {
    if (!db) {
        return initDatabase();
    }
    return db;
}

/**
 * Clear database cache (useful after migrations)
 */
export function clearDatabaseCache() {
    if (db) {
        db.close();
        db = null;
    }
}

/**
 * Close database connection
 */
export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}

