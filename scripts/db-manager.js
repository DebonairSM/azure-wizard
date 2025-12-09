#!/usr/bin/env node
/**
 * Database Manager - Consolidated database operations script
 * 
 * Commands:
 *   migrate-json       - Migrate data from seed-data.json to SQLite
 *   migrate-apim       - Migrate APIM offerings to azureOfferings table
 *   populate-apim      - Populate APIM offerings with detailed data
 *   ensure-table       - Ensure azureOfferings table exists
 *   all                - Run all operations in order
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase, clearDatabaseCache } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_PATH = path.join(__dirname, '..', 'data', 'seed-data.json');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function parseJsonArray(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function stringifyJsonArray(arr) {
    if (!arr || !Array.isArray(arr)) return null;
    return JSON.stringify(arr);
}

function stringifyJsonObject(obj) {
    if (!obj || typeof obj !== 'object') return null;
    return JSON.stringify(obj);
}

function createAiGatewayDetails(tier) {
    // No AI Gateway support for v1 tiers and Basic v2
    if (tier.version === 'v1' || tier.id === 'apim-basic-v2') {
        return JSON.stringify({
            supported: false,
            reason: tier.version === 'v1' 
                ? 'AI Gateway features are only available in v2 architecture (Standard v2 and Premium v2)'
                : 'AI Gateway features require Standard v2 or Premium v2 tier'
        });
    }
    
    // Partial support for Standard v2
    if (tier.id === 'apim-standard-v2') {
        return JSON.stringify({
            supported: true,
            level: 'partial',
            trafficMediation: {
                apiImportTypes: ['openai-compatible', 'passthrough-llm', 'foundry', 'mcp-server'],
                modelDeployments: ['foundry', 'azure-openai', 'self-hosted'],
                apiTypes: ['chat-completions', 'responses'],
                mcpCapabilities: {
                    exposeRestAsMcp: true,
                    passthroughToMcp: true
                }
            },
            scalabilityPolicies: {
                tokenRateLimiting: {
                    policyName: 'llm-token-limit',
                    supported: true,
                    capabilities: ['tpm-limit', 'token-quota', 'pre-calculation'],
                    configOptions: ['tokens-per-minute', 'counter-key', 'estimate-prompt-tokens', 'remaining-tokens-variable-name'],
                    documentation: 'https://learn.microsoft.com/en-us/azure/api-management/llm-token-limit-policy'
                },
                semanticCaching: {
                    policies: ['llm-semantic-cache-store', 'llm-semantic-cache-lookup'],
                    supported: true,
                    requirements: ['azure-managed-redis', 'redisearch'],
                    capabilities: ['vector-proximity', 'embeddings-api'],
                    documentation: 'https://learn.microsoft.com/en-us/azure/api-management/llm-semantic-cache-lookup-policy'
                },
                loadBalancing: {
                    supported: true,
                    strategies: ['round-robin', 'weighted', 'priority-based'],
                    backendPoolSupport: true,
                    ptuOptimization: true,
                    documentation: 'https://learn.microsoft.com/en-us/azure/api-management/backends'
                },
                circuitBreaker: {
                    supported: true,
                    capabilities: ['dynamic-trip', 'retry-after-header', 'health-monitoring'],
                    documentation: 'https://learn.microsoft.com/en-us/azure/api-management/backends'
                }
            },
            securityPolicies: {
                managedIdentity: true,
                oauthCredentialManager: true,
                contentModeration: {
                    policyName: 'azure-openai-emit-token-metric',
                    supported: true,
                    integration: 'azure-ai-content-safety',
                    capabilities: ['prompt-moderation', 'response-filtering'],
                    documentation: 'https://learn.microsoft.com/en-us/azure/api-management/azure-openai-emit-token-metric-policy'
                }
            },
            resiliency: {
                backendConfiguration: true,
                multiRegion: false,
                scaleUnits: null,
                geographicDistribution: false
            },
            observability: {
                tokenMetrics: {
                    policyName: 'llm-emit-token-metric',
                    supported: true,
                    integration: ['azure-monitor', 'application-insights'],
                    customDimensions: true,
                    documentation: 'https://learn.microsoft.com/en-us/azure/api-management/llm-emit-token-metric-policy'
                },
                logging: {
                    promptLogging: true,
                    completionLogging: true,
                    tokenTracking: true,
                    dashboard: true
                }
            },
            developerExperience: {
                apiCenterIntegration: true,
                developerPortal: true,
                selfService: true,
                policyToolkit: true,
                copilotStudioConnector: false
            },
            limitations: [
                'No A2A agent API support',
                'Limited to basic load balancing strategies',
                'No session-aware load balancing',
                'Single region deployment only'
            ],
            documentation: [
                {
                    title: 'AI Gateway Capabilities',
                    url: 'https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities'
                },
                {
                    title: 'Import Microsoft Foundry API',
                    url: 'https://learn.microsoft.com/en-us/azure/api-management/import-foundry-api'
                },
                {
                    title: 'Import Language Model API',
                    url: 'https://learn.microsoft.com/en-us/azure/api-management/import-language-model-api'
                },
                {
                    title: 'Expose REST API as MCP Server',
                    url: 'https://learn.microsoft.com/en-us/azure/api-management/expose-rest-api-as-mcp-server'
                },
                {
                    title: 'Token Rate Limiting',
                    url: 'https://learn.microsoft.com/en-us/azure/api-management/llm-token-limit-policy'
                },
                {
                    title: 'Semantic Caching Setup',
                    url: 'https://learn.microsoft.com/en-us/azure/api-management/enable-semantic-caching'
                }
            ]
        });
    }
    
    // Full support for Premium v2
    if (tier.id === 'apim-premium-v2') {
        return JSON.stringify({
            supported: true,
            level: 'full',
            trafficMediation: {
                apiImportTypes: ['openai-compatible', 'passthrough-llm', 'foundry', 'mcp-server', 'a2a-agent'],
                modelDeployments: ['foundry', 'azure-openai', 'amazon-bedrock', 'self-hosted', 'third-party'],
                apiTypes: ['chat-completions', 'responses', 'realtime', 'embeddings'],
                mcpCapabilities: {
                    exposeRestAsMcp: true,
                    passthroughToMcp: true,
                    mcpServerDiscovery: true
                },
                importWizards: {
                    foundryModel: true,
                    languageModel: true,
                    mcpServer: true,
                    a2aAgent: true
                }
            },
            scalabilityPolicies: {
                tokenRateLimiting: {
                    policyName: 'llm-token-limit',
                    supported: true,
                    capabilities: ['tpm-limit', 'token-quota', 'pre-calculation', 'per-consumer-limits'],
                    configOptions: [
                        'tokens-per-minute', 'tokens-per-hour', 'tokens-per-day', 
                        'tokens-per-week', 'tokens-per-month', 'tokens-per-year',
                        'counter-key', 'estimate-prompt-tokens', 'remaining-tokens-variable-name'
                    ],
                    counterKeys: ['subscription-id', 'ip-address', 'custom-expression'],
                    documentation: 'https://learn.microsoft.com/en-us/azure/api-management/llm-token-limit-policy'
                },
                semanticCaching: {
                    policies: ['llm-semantic-cache-store', 'llm-semantic-cache-lookup'],
                    supported: true,
                    requirements: ['azure-managed-redis', 'redisearch'],
                    capabilities: ['vector-proximity', 'embeddings-api', 'cache-invalidation'],
                    cacheProviders: ['azure-managed-redis', 'external-redis'],
                    documentation: 'https://learn.microsoft.com/en-us/azure/api-management/enable-semantic-caching'
                },
                loadBalancing: {
                    supported: true,
                    strategies: ['round-robin', 'weighted', 'priority-based', 'session-aware'],
                    backendPoolSupport: true,
                    ptuOptimization: true,
                    payAsYouGoFallback: true,
                    documentation: 'https://learn.microsoft.com/en-us/azure/api-management/backends'
                },
                circuitBreaker: {
                    supported: true,
                    capabilities: ['dynamic-trip', 'retry-after-header', 'health-monitoring', 'custom-trip-duration'],
                    tripDurationSource: 'retry-after-header',
                    documentation: 'https://learn.microsoft.com/en-us/azure/api-management/backends'
                },
                scaling: {
                    autoScale: true,
                    scaleUnits: 'configurable',
                    multiRegion: true,
                    globalCdn: true
                }
            },
            securityPolicies: {
                managedIdentity: true,
                oauthCredentialManager: true,
                contentModeration: {
                    policyName: 'azure-openai-emit-token-metric',
                    supported: true,
                    integration: 'azure-ai-content-safety',
                    capabilities: ['prompt-moderation', 'response-filtering', 'content-classification'],
                    moderationActions: ['block', 'flag', 'log'],
                    documentation: 'https://learn.microsoft.com/en-us/azure/api-management/azure-openai-emit-token-metric-policy'
                },
                authentication: {
                    methods: ['managed-identity', 'oauth', 'api-key', 'certificate'],
                    credentialManager: true
                },
                authorization: {
                    rbac: true,
                    policyBasedAccess: true
                }
            },
            resiliency: {
                backendConfiguration: true,
                multiRegion: true,
                scaleUnits: 'unlimited',
                geographicDistribution: true,
                activeActive: true,
                failover: true,
                disasterRecovery: true
            },
            observability: {
                tokenMetrics: {
                    policyName: 'llm-emit-token-metric',
                    supported: true,
                    integration: ['azure-monitor', 'application-insights'],
                    customDimensions: true,
                    dimensions: ['client-ip', 'api-id', 'subscription-id', 'user-id', 'custom'],
                    namespace: 'configurable',
                    documentation: 'https://learn.microsoft.com/en-us/azure/api-management/llm-emit-token-metric-policy'
                },
                logging: {
                    promptLogging: true,
                    completionLogging: true,
                    tokenTracking: true,
                    dashboard: true,
                    detailedAnalytics: true,
                    costTracking: true
                },
                monitoring: {
                    azureMonitor: true,
                    applicationInsights: true,
                    customDashboards: true,
                    alerting: true
                }
            },
            developerExperience: {
                apiCenterIntegration: true,
                developerPortal: true,
                selfService: true,
                policyToolkit: true,
                copilotStudioConnector: true,
                apiCatalog: true,
                mcpServerRegistry: true
            },
            advancedFeatures: {
                realTimeApis: true,
                websocketSupport: true,
                streamingResponses: true,
                batchProcessing: false,
                customPolicies: true
            },
            documentation: [
                { title: 'AI Gateway Capabilities', url: 'https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities' },
                { title: 'Import Microsoft Foundry API', url: 'https://learn.microsoft.com/en-us/azure/api-management/import-foundry-api' },
                { title: 'Import Language Model API', url: 'https://learn.microsoft.com/en-us/azure/api-management/import-language-model-api' },
                { title: 'Expose REST API as MCP Server', url: 'https://learn.microsoft.com/en-us/azure/api-management/expose-rest-api-as-mcp-server' },
                { title: 'Expose and Govern MCP Server', url: 'https://learn.microsoft.com/en-us/azure/api-management/expose-mcp-server' },
                { title: 'Import A2A Agent API', url: 'https://learn.microsoft.com/en-us/azure/api-management/import-a2a-agent-api' },
                { title: 'Token Rate Limiting', url: 'https://learn.microsoft.com/en-us/azure/api-management/llm-token-limit-policy' },
                { title: 'Semantic Caching Setup', url: 'https://learn.microsoft.com/en-us/azure/api-management/enable-semantic-caching' },
                { title: 'Backend Load Balancing', url: 'https://learn.microsoft.com/en-us/azure/api-management/backends' },
                { title: 'Content Safety Integration', url: 'https://learn.microsoft.com/en-us/azure/api-management/azure-openai-content-safety-policy' },
                { title: 'Token Metrics and Logging', url: 'https://learn.microsoft.com/en-us/azure/api-management/llm-emit-token-metric-policy' },
                { title: 'API Center Integration', url: 'https://learn.microsoft.com/en-us/azure/api-management/enable-api-center-integration' },
                { title: 'AI Gateway Labs', url: 'https://aka.ms/apim/ai-gateway/labs' },
                { title: 'AI Gateway Workshop', url: 'https://aka.ms/apim/ai-gateway/workshop' }
            ]
        });
    }
    
    return JSON.stringify({ supported: false });
}

// ============================================================================
// COMMAND: MIGRATE JSON TO SQLITE
// ============================================================================

async function migrateJsonToSqlite() {
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATE JSON TO SQLITE');
    console.log('='.repeat(60) + '\n');

    if (!fs.existsSync(JSON_PATH)) {
        console.error(`❌ JSON file not found: ${JSON_PATH}`);
        return false;
    }

    const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`✓ Loaded JSON data version: ${jsonData.version}`);

    const db = initDatabase();

    try {
        const transaction = db.transaction(() => {
            console.log('Clearing existing data...');
            db.prepare('DELETE FROM compatibilityRules').run();
            db.prepare('DELETE FROM components').run();
            db.prepare('DELETE FROM recipes').run();
            db.prepare('DELETE FROM paths').run();
            db.prepare('DELETE FROM options').run();
            db.prepare('DELETE FROM nodes').run();
            db.prepare('DELETE FROM version').run();

            console.log('Inserting version...');
            db.prepare(`INSERT INTO version (version, updatedAt) VALUES (?, CURRENT_TIMESTAMP)`).run(jsonData.version || '1.0.0');

            console.log(`Inserting ${jsonData.nodes?.length || 0} nodes...`);
            const insertNode = db.prepare(`
                INSERT INTO nodes (id, question, description, nodeType, tags, azObjectives, roleFocus)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            for (const node of jsonData.nodes || []) {
                insertNode.run(
                    node.id, node.question || null, node.description || null, node.nodeType || 'question',
                    stringifyJsonArray(node.tags), stringifyJsonArray(node.azObjectives), stringifyJsonArray(node.roleFocus)
                );
            }

            const nodeIds = new Set((jsonData.nodes || []).map(n => n.id));

            console.log(`Inserting ${jsonData.options?.length || 0} options...`);
            const insertOption = db.prepare(`
                INSERT INTO options (id, nodeId, label, description, pros, cons, whenToUse, whenNotToUse)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const optionIds = new Set();
            let optionsInserted = 0;
            for (const option of jsonData.options || []) {
                if (!nodeIds.has(option.nodeId)) continue;
                insertOption.run(
                    option.id, option.nodeId, option.label, option.description || null,
                    stringifyJsonArray(option.pros), stringifyJsonArray(option.cons),
                    option.whenToUse || null, option.whenNotToUse || null
                );
                optionIds.add(option.id);
                optionsInserted++;
            }
            console.log(`✓ Inserted ${optionsInserted} options`);

            console.log(`Inserting ${jsonData.paths?.length || 0} paths...`);
            const insertPath = db.prepare(`INSERT INTO paths (fromNodeId, fromOptionId, toNodeId) VALUES (?, ?, ?)`);
            const insertedPaths = new Set();
            let pathsInserted = 0;
            for (const path of jsonData.paths || []) {
                const pathKey = `${path.fromNodeId}|${path.fromOptionId}`;
                if (insertedPaths.has(pathKey)) continue;
                if (!nodeIds.has(path.fromNodeId) || !optionIds.has(path.fromOptionId) || !nodeIds.has(path.toNodeId)) continue;
                try {
                    insertPath.run(path.fromNodeId, path.fromOptionId, path.toNodeId);
                    insertedPaths.add(pathKey);
                    pathsInserted++;
                } catch (error) {
                    if (error.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') throw error;
                }
            }
            console.log(`✓ Inserted ${pathsInserted} paths`);

            console.log(`Inserting ${jsonData.recipes?.length || 0} recipes...`);
            const insertRecipe = db.prepare(`
                INSERT INTO recipes (id, nodeId, title, steps, bicepOutline, terraformOutline, links, skillLevel, estimatedTime, configSchema)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            let recipesInserted = 0;
            for (const recipe of jsonData.recipes || []) {
                if (!nodeIds.has(recipe.nodeId)) continue;
                insertRecipe.run(
                    recipe.id || recipe.nodeId, recipe.nodeId, recipe.title || null,
                    stringifyJsonObject(recipe.steps), stringifyJsonObject(recipe.bicepOutline),
                    stringifyJsonObject(recipe.terraformOutline), stringifyJsonArray(recipe.links),
                    recipe.skillLevel || null, recipe.estimatedTime || null,
                    stringifyJsonObject(recipe.configSchema)
                );
                recipesInserted++;
            }
            console.log(`✓ Inserted ${recipesInserted} recipes`);

            console.log(`Inserting ${jsonData.components?.length || 0} components...`);
            const insertComponent = db.prepare(`
                INSERT INTO components (id, name, category, description, configSchema, tags, pros, cons, recipeNodeId, azObjectives)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const componentIds = new Set();
            let componentsInserted = 0;
            for (const component of jsonData.components || []) {
                if (component.recipeNodeId && !nodeIds.has(component.recipeNodeId)) continue;
                insertComponent.run(
                    component.id, component.name, component.category, component.description || null,
                    stringifyJsonObject(component.configSchema), stringifyJsonArray(component.tags),
                    stringifyJsonArray(component.pros), stringifyJsonArray(component.cons),
                    component.recipeNodeId || null, stringifyJsonArray(component.azObjectives)
                );
                componentIds.add(component.id);
                componentsInserted++;
            }
            console.log(`✓ Inserted ${componentsInserted} components`);

            console.log(`Inserting ${jsonData.compatibilityRules?.length || 0} compatibility rules...`);
            const insertRule = db.prepare(`
                INSERT INTO compatibilityRules (componentId1, componentId2, type, reason)
                VALUES (?, ?, ?, ?)
            `);
            const insertedRules = new Set();
            let rulesInserted = 0;
            for (const rule of jsonData.compatibilityRules || []) {
                const [id1, id2] = rule.componentId1 < rule.componentId2 
                    ? [rule.componentId1, rule.componentId2]
                    : [rule.componentId2, rule.componentId1];
                const ruleKey = `${id1}|${id2}`;
                if (insertedRules.has(ruleKey)) continue;
                if (!componentIds.has(rule.componentId1) || !componentIds.has(rule.componentId2)) continue;
                try {
                    insertRule.run(rule.componentId1, rule.componentId2, rule.type, rule.reason || null);
                    insertedRules.add(ruleKey);
                    rulesInserted++;
                } catch (error) {
                    if (error.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') throw error;
                }
            }
            console.log(`✓ Inserted ${rulesInserted} compatibility rules`);
        });

        transaction();
        console.log('\n✓ Migration completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Migration failed:', error);
        return false;
    }
}

// ============================================================================
// COMMAND: POPULATE APIM OFFERINGS
// ============================================================================

const APIM_OFFERINGS = [
    {
        id: 'apim-consumption', skuName: 'Consumption', skuTier: 'Consumption', version: 'v1', category: 'consumption',
        description: 'Serverless, pay-as-you-go API Management tier ideal for prototyping, development, testing, and low-volume production scenarios',
        purpose: 'Ideal for serverless and pay-as-you-go scenarios, suitable for prototyping, development, testing, and low-volume production',
        pricingModel: 'pay-per-execution',
        pricingInfo: JSON.stringify({ freeTier: 'First 1 million executions free per month', pricing: 'Pay-per-execution after free tier', billing: 'Per-execution model' }),
        sla: null,
        features: JSON.stringify(['Automatic scaling', 'Basic security (authentication, authorization, rate limiting, IP filtering)', 'Integrated developer portal', 'Analytics', 'No infrastructure management required']),
        capabilities: JSON.stringify(['Automatic scaling', 'Basic security features', 'Developer portal', 'Analytics']),
        limitations: JSON.stringify(['No SLA', 'Limited to 5 gateways per subscription', '500 subscriptions per gateway', '50 APIs per gateway', '1,000 API operations per gateway', 'Maximum request duration of 30 seconds', 'Maximum policy length of 4 KB']),
        useCases: JSON.stringify(['Prototyping', 'Development and testing', 'Low-volume production', 'Serverless architectures', 'Pay-as-you-go scenarios']),
        maxScaleUnits: null, cachePerUnit: null, vnetSupport: false, multiRegion: false, selfHostedGateway: false,
        developerPortal: true, analytics: true, aiGateway: false, mcpSupport: false, websocketSupport: false, productionReady: false,
        documentationLinks: JSON.stringify([
            { label: 'Consumption Tier Documentation', url: 'https://docs.microsoft.com/azure/api-management/api-management-consumption-tier' },
            { label: 'API Management Pricing', url: 'https://azure.microsoft.com/pricing/details/api-management/' }
        ])
    },
    {
        id: 'apim-developer', skuName: 'Developer', skuTier: 'Developer', version: 'v1', category: 'standard',
        description: 'Non-production tier designed for development, testing, and evaluation with all features for building and experimenting with APIs',
        purpose: 'Designed for non-production use cases such as development, testing, and evaluation',
        pricingModel: 'fixed-monthly',
        pricingInfo: JSON.stringify({ pricing: 'Fixed monthly rate', note: 'Single scale-out unit only' }),
        sla: null,
        features: JSON.stringify(['All API Management features', 'Integrated developer portal', 'Single scale-out unit', 'Full policy support', 'API versioning', 'Subscriptions and keys']),
        capabilities: JSON.stringify(['Full feature set for development', 'Developer portal', 'Policy configuration', 'API versioning']),
        limitations: JSON.stringify(['No SLA', 'Limited throughput', 'Single scale-out unit only', 'Not suitable for live/production environments']),
        useCases: JSON.stringify(['Development', 'Testing', 'Evaluation', 'Learning and experimentation']),
        maxScaleUnits: 1, cachePerUnit: null, vnetSupport: false, multiRegion: false, selfHostedGateway: false,
        developerPortal: true, analytics: true, aiGateway: false, mcpSupport: false, websocketSupport: false, productionReady: false,
        documentationLinks: JSON.stringify([{ label: 'Developer Tier Documentation', url: 'https://docs.microsoft.com/azure/api-management/api-management-tiers' }])
    },
    {
        id: 'apim-basic', skuName: 'Basic', skuTier: 'Basic', version: 'v1', category: 'standard',
        description: 'Entry-level production tier with standard API gateway functionality, suitable for entry-level production use cases',
        purpose: 'Suitable for entry-level production use cases',
        pricingModel: 'per-unit',
        pricingInfo: JSON.stringify({ pricing: 'Fixed monthly rate per unit', units: 'Up to 2 scale-out units' }),
        sla: '99.9%',
        features: JSON.stringify(['Standard API gateway functionality', '50 MB cache per unit', 'Up to 2 scale-out units', '99.9% SLA', 'Developer portal', 'Analytics']),
        capabilities: JSON.stringify(['Production-ready', 'Basic scaling', 'Caching', 'SLA guarantee']),
        limitations: JSON.stringify(['No Virtual Network (VNET) support', 'Limited scalability compared to higher tiers', 'Smaller cache size', 'Limited to 2 scale-out units']),
        useCases: JSON.stringify(['Entry-level production', 'Small to medium workloads', 'Cost-conscious production deployments']),
        maxScaleUnits: 2, cachePerUnit: '50 MB', vnetSupport: false, multiRegion: false, selfHostedGateway: false,
        developerPortal: true, analytics: true, aiGateway: false, mcpSupport: false, websocketSupport: false, productionReady: true,
        documentationLinks: JSON.stringify([{ label: 'Basic Tier Documentation', url: 'https://docs.microsoft.com/azure/api-management/api-management-tiers' }])
    },
    {
        id: 'apim-standard', skuName: 'Standard', skuTier: 'Standard', version: 'v1', category: 'standard',
        description: 'Balanced price and performance tier for growing teams and business-critical APIs with VNET integration',
        purpose: 'Balances price and performance for growing teams and business-critical APIs',
        pricingModel: 'per-unit',
        pricingInfo: JSON.stringify({ pricing: 'Fixed monthly rate per unit', units: 'Up to 4 scale-out units' }),
        sla: '99.9%',
        features: JSON.stringify(['1 GB cache per unit', 'Up to 4 scale-out units', '99.9% SLA', 'VNET integration for secure, private connectivity', 'Multi-region deployments', 'Developer portal', 'Analytics']),
        capabilities: JSON.stringify(['VNET integration', 'Multi-region support', 'Enhanced caching', 'Better scalability']),
        limitations: JSON.stringify(['Limited scalability compared to Premium tier', 'No self-hosted gateway', 'Limited to 4 scale-out units']),
        useCases: JSON.stringify(['Business-critical APIs', 'Growing teams', 'Multi-region deployments', 'VNET integration requirements']),
        maxScaleUnits: 4, cachePerUnit: '1 GB', vnetSupport: true, multiRegion: true, selfHostedGateway: false,
        developerPortal: true, analytics: true, aiGateway: false, mcpSupport: false, websocketSupport: false, productionReady: true,
        documentationLinks: JSON.stringify([
            { label: 'Standard Tier Documentation', url: 'https://docs.microsoft.com/azure/api-management/api-management-tiers' },
            { label: 'VNET Integration', url: 'https://docs.microsoft.com/azure/api-management/api-management-using-with-vnet' }
        ])
    },
    {
        id: 'apim-premium', skuName: 'Premium', skuTier: 'Premium', version: 'v1', category: 'premium',
        description: 'Enterprise-scale tier with stringent reliability and compliance needs, supporting multi-region active-active deployments',
        purpose: 'Geared toward enterprise-scale deployments with stringent reliability and compliance needs',
        pricingModel: 'per-unit',
        pricingInfo: JSON.stringify({ pricing: 'Fixed monthly rate per unit', units: 'Up to 10 scale-out units per region (additional units available upon request)' }),
        sla: '99.95%',
        features: JSON.stringify(['5 GB cache per unit', 'Up to 10 scale-out units per region', '99.95% SLA', 'Multi-region active-active deployments', 'Advanced VNET injection', 'Self-hosted gateway for hybrid/multi-cloud', 'Developer portal', 'Analytics']),
        capabilities: JSON.stringify(['Highest scalability', 'Multi-region active-active', 'Advanced VNET injection', 'Self-hosted gateway', 'Enterprise features']),
        limitations: JSON.stringify(['Higher cost', 'More complex setup']),
        useCases: JSON.stringify(['Enterprise-scale deployments', 'High availability requirements', 'Multi-region active-active', 'Hybrid and multi-cloud strategies', 'Compliance requirements']),
        maxScaleUnits: 10, cachePerUnit: '5 GB', vnetSupport: true, multiRegion: true, selfHostedGateway: true,
        developerPortal: true, analytics: true, aiGateway: false, mcpSupport: false, websocketSupport: false, productionReady: true,
        documentationLinks: JSON.stringify([
            { label: 'Premium Tier Documentation', url: 'https://docs.microsoft.com/azure/api-management/api-management-tiers' },
            { label: 'Self-hosted Gateway', url: 'https://docs.microsoft.com/azure/api-management/self-hosted-gateway-overview' }
        ])
    },
    {
        id: 'apim-basic-v2', skuName: 'Basic v2', skuTier: 'BasicV2', version: 'v2', category: 'v2',
        description: 'v2 architecture tier for small teams and projects with faster deployment and scaling',
        purpose: 'Intended for small teams and projects with improved architecture',
        pricingModel: 'per-unit',
        pricingInfo: JSON.stringify({ pricing: 'Fixed monthly rate per unit', note: 'Preview pricing may change' }),
        sla: '99.95%',
        features: JSON.stringify(['Faster deployment times (minutes instead of hours)', '99.95% SLA', 'Integrated developer portal', 'Improved architecture', 'Enhanced performance']),
        capabilities: JSON.stringify(['Faster deployment', 'Improved architecture', 'Better performance', 'Production SLA']),
        limitations: JSON.stringify(['Public IP address (Private Link required for secure inbound)', 'Currently in preview', 'Not recommended for production use', 'Features and pricing may change']),
        useCases: JSON.stringify(['Small teams', 'Projects requiring fast deployment', 'Testing v2 architecture']),
        maxScaleUnits: null, cachePerUnit: null, vnetSupport: false, multiRegion: false, selfHostedGateway: false,
        developerPortal: true, analytics: true, aiGateway: false, mcpSupport: false, websocketSupport: false, productionReady: false,
        documentationLinks: JSON.stringify([{ label: 'API Management v2', url: 'https://docs.microsoft.com/azure/api-management/api-management-v2' }])
    },
    {
        id: 'apim-standard-v2', skuName: 'Standard v2', skuTier: 'StandardV2', version: 'v2', category: 'v2',
        description: 'v2 architecture tier with VNET integration for secure outbound traffic to backends in virtual networks or on-premises',
        purpose: 'Supports VNET integration for secure outbound traffic',
        pricingModel: 'per-unit',
        pricingInfo: JSON.stringify({ pricing: 'Fixed monthly rate per unit', note: 'Preview pricing may change' }),
        sla: '99.95%',
        features: JSON.stringify(['Faster deployment times', 'VNET integration for secure outbound traffic', '99.95% SLA', 'Integrated developer portal', 'Connection to backends in VNETs or on-premises', 'Improved architecture']),
        capabilities: JSON.stringify(['VNET integration (outbound)', 'Faster deployment', 'Secure backend connectivity', 'Improved architecture']),
        limitations: JSON.stringify(['Public IP address (Private Link required for secure inbound)', 'Currently in preview', 'Not recommended for production use', 'Features and pricing may change']),
        useCases: JSON.stringify(['VNET integration requirements', 'Secure backend connectivity', 'Testing v2 architecture']),
        maxScaleUnits: null, cachePerUnit: null, vnetSupport: true, multiRegion: false, selfHostedGateway: false,
        developerPortal: true, analytics: true, aiGateway: false, mcpSupport: true, websocketSupport: true, productionReady: false,
        documentationLinks: JSON.stringify([
            { label: 'API Management v2', url: 'https://docs.microsoft.com/azure/api-management/api-management-v2' },
            { label: 'MCP Support in v2', url: 'https://techcommunity.microsoft.com/blog/integrationsonazureblog/%F0%9F%9A%80-new-in-azure-api-management-mcp-in-v2-skus--external-mcp-compliant-server-sup/4440294' }
        ])
    },
    {
        id: 'apim-premium-v2', skuName: 'Premium v2', skuTier: 'PremiumV2', version: 'v2', category: 'v2',
        description: 'Enterprise-wide API programs requiring high availability and performance with comprehensive feature set and unlimited included API calls',
        purpose: 'Designed for enterprise-wide API programs requiring high availability and performance',
        pricingModel: 'per-unit',
        pricingInfo: JSON.stringify({ pricing: 'Fixed monthly rate per unit', note: 'Unlimited included API calls, preview pricing may change' }),
        sla: '99.95%',
        features: JSON.stringify(['Superior capacity and highest entity limits', 'Unlimited included API calls', 'Comprehensive feature set', 'New architecture eliminating management traffic from customer VNET', 'Choice between VNET injection or VNET integration', 'Enhanced security and simplified setup', 'AI Gateway features', 'MCP (Model Context Protocol) support', 'WebSocket support', 'Real-time API support']),
        capabilities: JSON.stringify(['Highest capacity', 'Unlimited API calls', 'VNET injection or integration', 'AI Gateway', 'MCP support', 'WebSocket support', 'Enterprise features']),
        limitations: JSON.stringify(['Currently in public preview', 'Features and pricing may change upon general availability']),
        useCases: JSON.stringify(['Enterprise-wide API programs', 'High availability requirements', 'AI Gateway scenarios', 'MCP-compliant server integration', 'Real-time API requirements', 'WebSocket applications']),
        maxScaleUnits: null, cachePerUnit: null, vnetSupport: true, multiRegion: true, selfHostedGateway: false,
        developerPortal: true, analytics: true, aiGateway: true, mcpSupport: true, websocketSupport: true, productionReady: false,
        documentationLinks: JSON.stringify([
            { label: 'API Management v2', url: 'https://docs.microsoft.com/azure/api-management/api-management-v2' },
            { label: 'AI Gateway', url: 'https://docs.microsoft.com/azure/api-management/api-management-ai-gateway' },
            { label: 'MCP Support in v2', url: 'https://techcommunity.microsoft.com/blog/integrationsonazureblog/%F0%9F%9A%80-new-in-azure-api-management-mcp-in-v2-skus--external-mcp-compliant-server-sup/4440294' }
        ])
    }
];

function populateApimOfferings() {
    console.log('\n' + '='.repeat(60));
    console.log('POPULATE APIM OFFERINGS');
    console.log('='.repeat(60) + '\n');

    const db = initDatabase();
    
    const tableExists = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='apimOfferings'
    `).get();
    
    if (!tableExists) {
        console.log('Creating apimOfferings table...');
        const schema = `
            CREATE TABLE IF NOT EXISTS apimOfferings (
                id TEXT PRIMARY KEY, skuName TEXT NOT NULL, skuTier TEXT NOT NULL,
                version TEXT, category TEXT, description TEXT, purpose TEXT,
                pricingModel TEXT, pricingInfo TEXT, sla TEXT, features TEXT,
                capabilities TEXT, limitations TEXT, useCases TEXT,
                maxScaleUnits INTEGER, cachePerUnit TEXT,
                vnetSupport BOOLEAN DEFAULT 0, multiRegion BOOLEAN DEFAULT 0,
                selfHostedGateway BOOLEAN DEFAULT 0, developerPortal BOOLEAN DEFAULT 0,
                analytics BOOLEAN DEFAULT 0, aiGateway BOOLEAN DEFAULT 0,
                mcpSupport BOOLEAN DEFAULT 0, websocketSupport BOOLEAN DEFAULT 0,
                productionReady BOOLEAN DEFAULT 0, documentationLinks TEXT,
                aiGatewayDetails TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_apimOfferings_skuTier ON apimOfferings(skuTier);
            CREATE INDEX IF NOT EXISTS idx_apimOfferings_category ON apimOfferings(category);
            CREATE INDEX IF NOT EXISTS idx_apimOfferings_version ON apimOfferings(version);
            CREATE INDEX IF NOT EXISTS idx_apimOfferings_productionReady ON apimOfferings(productionReady);
        `;
        db.exec(schema);
    }
    
    const columns = db.prepare(`PRAGMA table_info(apimOfferings)`).all();
    const hasAiGatewayDetails = columns.some(col => col.name === 'aiGatewayDetails');
    
    if (!hasAiGatewayDetails) {
        console.log('Adding aiGatewayDetails column...');
        db.exec('ALTER TABLE apimOfferings ADD COLUMN aiGatewayDetails TEXT');
    }
    
    db.prepare('DELETE FROM apimOfferings').run();
    console.log('✓ Cleared existing APIM offerings data');
    
    const insert = db.prepare(`
        INSERT INTO apimOfferings (
            id, skuName, skuTier, version, category, description, purpose,
            pricingModel, pricingInfo, sla, features, capabilities, limitations,
            useCases, maxScaleUnits, cachePerUnit, vnetSupport, multiRegion,
            selfHostedGateway, developerPortal, analytics, aiGateway, mcpSupport,
            websocketSupport, productionReady, documentationLinks, aiGatewayDetails
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((offerings) => {
        for (const offering of offerings) {
            const aiGatewayDetails = createAiGatewayDetails(offering);
            insert.run(
                offering.id, offering.skuName, offering.skuTier, offering.version, offering.category,
                offering.description, offering.purpose, offering.pricingModel, offering.pricingInfo,
                offering.sla, offering.features, offering.capabilities, offering.limitations,
                offering.useCases, offering.maxScaleUnits, offering.cachePerUnit,
                offering.vnetSupport ? 1 : 0, offering.multiRegion ? 1 : 0, offering.selfHostedGateway ? 1 : 0,
                offering.developerPortal ? 1 : 0, offering.analytics ? 1 : 0, offering.aiGateway ? 1 : 0,
                offering.mcpSupport ? 1 : 0, offering.websocketSupport ? 1 : 0, offering.productionReady ? 1 : 0,
                offering.documentationLinks, aiGatewayDetails
            );
        }
    });
    
    insertMany(APIM_OFFERINGS);
    console.log(`✓ Inserted ${APIM_OFFERINGS.length} APIM offerings`);
    
    const byVersion = db.prepare(`SELECT version, COUNT(*) as count FROM apimOfferings GROUP BY version`).all();
    const byCategory = db.prepare(`SELECT category, COUNT(*) as count FROM apimOfferings GROUP BY category`).all();
    console.log('Offerings by version:', byVersion);
    console.log('Offerings by category:', byCategory);
    
    return true;
}

// ============================================================================
// COMMAND: MIGRATE APIM TO AZURE OFFERINGS
// ============================================================================

function migrateApimToAzureOfferings() {
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATE APIM TO AZURE OFFERINGS');
    console.log('='.repeat(60) + '\n');

    const db = initDatabase();

    try {
        const apimExists = db.prepare(`
            SELECT name FROM sqlite_master WHERE type='table' AND name='apimOfferings'
        `).get();

        if (!apimExists) {
            console.log('❌ No apimOfferings table found. Nothing to migrate.');
            return false;
        }

        const apimCount = db.prepare('SELECT COUNT(*) as count FROM apimOfferings').get();
        console.log(`Found ${apimCount.count} APIM offerings to migrate`);

        if (apimCount.count === 0) {
            console.log('No APIM offerings found. Nothing to migrate.');
            return false;
        }

        const apimOfferings = db.prepare('SELECT * FROM apimOfferings').all();
        console.log(`\nMigrating ${apimOfferings.length} offerings...\n`);

        const insertAzureOffering = db.prepare(`
            INSERT OR IGNORE INTO azureOfferings (
                id, serviceName, skuName, skuTier, version, category,
                description, purpose, pricingModel, pricingInfo, sla,
                features, capabilities, limitations, useCases,
                attributes, documentationLinks, isProductionReady,
                createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const migrateTransaction = db.transaction((offerings) => {
            let migrated = 0;
            let skipped = 0;

            for (const offering of offerings) {
                const exists = db.prepare('SELECT id FROM azureOfferings WHERE id = ?').get(offering.id);
                if (exists) {
                    skipped++;
                    continue;
                }

                const attributes = {
                    vnetSupport: offering.vnetSupport === 1,
                    multiRegion: offering.multiRegion === 1,
                    selfHostedGateway: offering.selfHostedGateway === 1,
                    developerPortal: offering.developerPortal === 1,
                    analytics: offering.analytics === 1,
                    aiGateway: offering.aiGateway === 1,
                    mcpSupport: offering.mcpSupport === 1,
                    websocketSupport: offering.websocketSupport === 1,
                    maxScaleUnits: offering.maxScaleUnits,
                    cachePerUnit: offering.cachePerUnit
                };

                try {
                    insertAzureOffering.run(
                        offering.id, 'API Management', offering.skuName, offering.skuTier,
                        offering.version || null, offering.category || null,
                        offering.description || null, offering.purpose || null,
                        offering.pricingModel || null, offering.pricingInfo || null,
                        offering.sla || null, offering.features || null,
                        offering.capabilities || null, offering.limitations || null,
                        offering.useCases || null, JSON.stringify(attributes),
                        offering.documentationLinks || null,
                        offering.productionReady === 1 ? 1 : 0,
                        offering.createdAt || null, offering.updatedAt || null
                    );

                    migrated++;
                    console.log(`  ✓ Migrated: ${offering.skuName} (${offering.version || 'v1'})`);
                } catch (error) {
                    console.error(`  ✗ Error migrating ${offering.skuName}:`, error.message);
                }
            }

            return { migrated, skipped };
        });

        const result = migrateTransaction(apimOfferings);

        console.log(`\n✓ Migration completed!`);
        console.log(`   - Migrated: ${result.migrated} offerings`);
        if (result.skipped > 0) {
            console.log(`   - Skipped: ${result.skipped} offerings (already exist)`);
        }

        return true;

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        return false;
    }
}

// ============================================================================
// COMMAND: ENSURE TABLE
// ============================================================================

function ensureAzureOfferingsTable() {
    console.log('\n' + '='.repeat(60));
    console.log('ENSURE AZURE OFFERINGS TABLE');
    console.log('='.repeat(60) + '\n');

    clearDatabaseCache();
    const db = initDatabase();

    try {
        const tableExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='azureOfferings'
        `).get();

        if (tableExists) {
            console.log('✓ azureOfferings table exists');
            const count = db.prepare('SELECT COUNT(*) as count FROM azureOfferings').get();
            console.log(`  Records in table: ${count.count}`);
            
            if (count.count > 0) {
                const byService = db.prepare(`
                    SELECT serviceName, COUNT(*) as count
                    FROM azureOfferings
                    GROUP BY serviceName
                `).all();
                console.log('\n  Records by service:');
                byService.forEach(row => console.log(`  - ${row.serviceName}: ${row.count}`));
            }
        } else {
            console.log('❌ azureOfferings table does not exist');
            console.log('   This should have been created automatically.');
        }

        return true;

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        return false;
    }
}

// ============================================================================
// MAIN CLI
// ============================================================================

const command = process.argv[2] || 'help';

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('DATABASE MANAGER');
    console.log('='.repeat(60));

    let success = false;

    try {
        switch (command) {
            case 'migrate-json':
                success = await migrateJsonToSqlite();
                break;
            
            case 'populate-apim':
                success = populateApimOfferings();
                break;
            
            case 'migrate-apim':
                success = migrateApimToAzureOfferings();
                break;
            
            case 'ensure-table':
                success = ensureAzureOfferingsTable();
                break;
            
            case 'all':
                console.log('\nRunning all operations...\n');
                success = await migrateJsonToSqlite();
                if (success) success = populateApimOfferings();
                if (success) success = migrateApimToAzureOfferings();
                if (success) success = ensureAzureOfferingsTable();
                break;
            
            case 'help':
            default:
                console.log('\nUsage: node db-manager.js <command>\n');
                console.log('Commands:');
                console.log('  migrate-json    - Migrate data from seed-data.json to SQLite');
                console.log('  populate-apim   - Populate APIM offerings with detailed data');
                console.log('  migrate-apim    - Migrate APIM offerings to azureOfferings table');
                console.log('  ensure-table    - Ensure azureOfferings table exists');
                console.log('  all             - Run all operations in order');
                console.log('  help            - Show this help message\n');
                success = true;
                break;
        }

        console.log('\n' + '='.repeat(60));
        console.log(success ? '✓ Operation completed successfully' : '✗ Operation failed');
        console.log('='.repeat(60) + '\n');

        closeDatabase();
        process.exit(success ? 0 : 1);

    } catch (error) {
        console.error('\n❌ Error:', error);
        closeDatabase();
        process.exit(1);
    }
}

main();
