// Script to populate APIM offerings with detailed information
import { getDatabase, initDatabase } from '../db/database.js';

const APIM_OFFERINGS = [
    {
        id: 'apim-consumption',
        skuName: 'Consumption',
        skuTier: 'Consumption',
        version: 'v1',
        category: 'consumption',
        description: 'Serverless, pay-as-you-go API Management tier ideal for prototyping, development, testing, and low-volume production scenarios',
        purpose: 'Ideal for serverless and pay-as-you-go scenarios, suitable for prototyping, development, testing, and low-volume production',
        pricingModel: 'pay-per-execution',
        pricingInfo: JSON.stringify({
            freeTier: 'First 1 million executions free per month',
            pricing: 'Pay-per-execution after free tier',
            billing: 'Per-execution model'
        }),
        sla: null,
        features: JSON.stringify([
            'Automatic scaling',
            'Basic security (authentication, authorization, rate limiting, IP filtering)',
            'Integrated developer portal',
            'Analytics',
            'No infrastructure management required'
        ]),
        capabilities: JSON.stringify([
            'Automatic scaling',
            'Basic security features',
            'Developer portal',
            'Analytics'
        ]),
        limitations: JSON.stringify([
            'No SLA',
            'Limited to 5 gateways per subscription',
            '500 subscriptions per gateway',
            '50 APIs per gateway',
            '1,000 API operations per gateway',
            'Maximum request duration of 30 seconds',
            'Maximum policy length of 4 KB'
        ]),
        useCases: JSON.stringify([
            'Prototyping',
            'Development and testing',
            'Low-volume production',
            'Serverless architectures',
            'Pay-as-you-go scenarios'
        ]),
        maxScaleUnits: null,
        cachePerUnit: null,
        vnetSupport: false,
        multiRegion: false,
        selfHostedGateway: false,
        developerPortal: true,
        analytics: true,
        aiGateway: false,
        mcpSupport: false,
        websocketSupport: false,
        productionReady: false,
        documentationLinks: JSON.stringify([
            { label: 'Consumption Tier Documentation', url: 'https://docs.microsoft.com/azure/api-management/api-management-consumption-tier' },
            { label: 'API Management Pricing', url: 'https://azure.microsoft.com/pricing/details/api-management/' }
        ])
    },
    {
        id: 'apim-developer',
        skuName: 'Developer',
        skuTier: 'Developer',
        version: 'v1',
        category: 'standard',
        description: 'Non-production tier designed for development, testing, and evaluation with all features for building and experimenting with APIs',
        purpose: 'Designed for non-production use cases such as development, testing, and evaluation',
        pricingModel: 'fixed-monthly',
        pricingInfo: JSON.stringify({
            pricing: 'Fixed monthly rate',
            note: 'Single scale-out unit only'
        }),
        sla: null,
        features: JSON.stringify([
            'All API Management features',
            'Integrated developer portal',
            'Single scale-out unit',
            'Full policy support',
            'API versioning',
            'Subscriptions and keys'
        ]),
        capabilities: JSON.stringify([
            'Full feature set for development',
            'Developer portal',
            'Policy configuration',
            'API versioning'
        ]),
        limitations: JSON.stringify([
            'No SLA',
            'Limited throughput',
            'Single scale-out unit only',
            'Not suitable for live/production environments'
        ]),
        useCases: JSON.stringify([
            'Development',
            'Testing',
            'Evaluation',
            'Learning and experimentation'
        ]),
        maxScaleUnits: 1,
        cachePerUnit: null,
        vnetSupport: false,
        multiRegion: false,
        selfHostedGateway: false,
        developerPortal: true,
        analytics: true,
        aiGateway: false,
        mcpSupport: false,
        websocketSupport: false,
        productionReady: false,
        documentationLinks: JSON.stringify([
            { label: 'Developer Tier Documentation', url: 'https://docs.microsoft.com/azure/api-management/api-management-tiers' }
        ])
    },
    {
        id: 'apim-basic',
        skuName: 'Basic',
        skuTier: 'Basic',
        version: 'v1',
        category: 'standard',
        description: 'Entry-level production tier with standard API gateway functionality, suitable for entry-level production use cases',
        purpose: 'Suitable for entry-level production use cases',
        pricingModel: 'per-unit',
        pricingInfo: JSON.stringify({
            pricing: 'Fixed monthly rate per unit',
            units: 'Up to 2 scale-out units'
        }),
        sla: '99.9%',
        features: JSON.stringify([
            'Standard API gateway functionality',
            '50 MB cache per unit',
            'Up to 2 scale-out units',
            '99.9% SLA',
            'Developer portal',
            'Analytics'
        ]),
        capabilities: JSON.stringify([
            'Production-ready',
            'Basic scaling',
            'Caching',
            'SLA guarantee'
        ]),
        limitations: JSON.stringify([
            'No Virtual Network (VNET) support',
            'Limited scalability compared to higher tiers',
            'Smaller cache size',
            'Limited to 2 scale-out units'
        ]),
        useCases: JSON.stringify([
            'Entry-level production',
            'Small to medium workloads',
            'Cost-conscious production deployments'
        ]),
        maxScaleUnits: 2,
        cachePerUnit: '50 MB',
        vnetSupport: false,
        multiRegion: false,
        selfHostedGateway: false,
        developerPortal: true,
        analytics: true,
        aiGateway: false,
        mcpSupport: false,
        websocketSupport: false,
        productionReady: true,
        documentationLinks: JSON.stringify([
            { label: 'Basic Tier Documentation', url: 'https://docs.microsoft.com/azure/api-management/api-management-tiers' }
        ])
    },
    {
        id: 'apim-standard',
        skuName: 'Standard',
        skuTier: 'Standard',
        version: 'v1',
        category: 'standard',
        description: 'Balanced price and performance tier for growing teams and business-critical APIs with VNET integration',
        purpose: 'Balances price and performance for growing teams and business-critical APIs',
        pricingModel: 'per-unit',
        pricingInfo: JSON.stringify({
            pricing: 'Fixed monthly rate per unit',
            units: 'Up to 4 scale-out units'
        }),
        sla: '99.9%',
        features: JSON.stringify([
            '1 GB cache per unit',
            'Up to 4 scale-out units',
            '99.9% SLA',
            'VNET integration for secure, private connectivity',
            'Multi-region deployments',
            'Developer portal',
            'Analytics'
        ]),
        capabilities: JSON.stringify([
            'VNET integration',
            'Multi-region support',
            'Enhanced caching',
            'Better scalability'
        ]),
        limitations: JSON.stringify([
            'Limited scalability compared to Premium tier',
            'No self-hosted gateway',
            'Limited to 4 scale-out units'
        ]),
        useCases: JSON.stringify([
            'Business-critical APIs',
            'Growing teams',
            'Multi-region deployments',
            'VNET integration requirements'
        ]),
        maxScaleUnits: 4,
        cachePerUnit: '1 GB',
        vnetSupport: true,
        multiRegion: true,
        selfHostedGateway: false,
        developerPortal: true,
        analytics: true,
        aiGateway: false,
        mcpSupport: false,
        websocketSupport: false,
        productionReady: true,
        documentationLinks: JSON.stringify([
            { label: 'Standard Tier Documentation', url: 'https://docs.microsoft.com/azure/api-management/api-management-tiers' },
            { label: 'VNET Integration', url: 'https://docs.microsoft.com/azure/api-management/api-management-using-with-vnet' }
        ])
    },
    {
        id: 'apim-premium',
        skuName: 'Premium',
        skuTier: 'Premium',
        version: 'v1',
        category: 'premium',
        description: 'Enterprise-scale tier with stringent reliability and compliance needs, supporting multi-region active-active deployments',
        purpose: 'Geared toward enterprise-scale deployments with stringent reliability and compliance needs',
        pricingModel: 'per-unit',
        pricingInfo: JSON.stringify({
            pricing: 'Fixed monthly rate per unit',
            units: 'Up to 10 scale-out units per region (additional units available upon request)'
        }),
        sla: '99.95%',
        features: JSON.stringify([
            '5 GB cache per unit',
            'Up to 10 scale-out units per region',
            '99.95% SLA',
            'Multi-region active-active deployments',
            'Advanced VNET injection',
            'Self-hosted gateway for hybrid/multi-cloud',
            'Developer portal',
            'Analytics'
        ]),
        capabilities: JSON.stringify([
            'Highest scalability',
            'Multi-region active-active',
            'Advanced VNET injection',
            'Self-hosted gateway',
            'Enterprise features'
        ]),
        limitations: JSON.stringify([
            'Higher cost',
            'More complex setup'
        ]),
        useCases: JSON.stringify([
            'Enterprise-scale deployments',
            'High availability requirements',
            'Multi-region active-active',
            'Hybrid and multi-cloud strategies',
            'Compliance requirements'
        ]),
        maxScaleUnits: 10,
        cachePerUnit: '5 GB',
        vnetSupport: true,
        multiRegion: true,
        selfHostedGateway: true,
        developerPortal: true,
        analytics: true,
        aiGateway: false,
        mcpSupport: false,
        websocketSupport: false,
        productionReady: true,
        documentationLinks: JSON.stringify([
            { label: 'Premium Tier Documentation', url: 'https://docs.microsoft.com/azure/api-management/api-management-tiers' },
            { label: 'Self-hosted Gateway', url: 'https://docs.microsoft.com/azure/api-management/self-hosted-gateway-overview' }
        ])
    },
    {
        id: 'apim-basic-v2',
        skuName: 'Basic v2',
        skuTier: 'BasicV2',
        version: 'v2',
        category: 'v2',
        description: 'v2 architecture tier for small teams and projects with faster deployment and scaling',
        purpose: 'Intended for small teams and projects with improved architecture',
        pricingModel: 'per-unit',
        pricingInfo: JSON.stringify({
            pricing: 'Fixed monthly rate per unit',
            note: 'Preview pricing may change'
        }),
        sla: '99.95%',
        features: JSON.stringify([
            'Faster deployment times (minutes instead of hours)',
            '99.95% SLA',
            'Integrated developer portal',
            'Improved architecture',
            'Enhanced performance'
        ]),
        capabilities: JSON.stringify([
            'Faster deployment',
            'Improved architecture',
            'Better performance',
            'Production SLA'
        ]),
        limitations: JSON.stringify([
            'Public IP address (Private Link required for secure inbound)',
            'Currently in preview',
            'Not recommended for production use',
            'Features and pricing may change'
        ]),
        useCases: JSON.stringify([
            'Small teams',
            'Projects requiring fast deployment',
            'Testing v2 architecture'
        ]),
        maxScaleUnits: null,
        cachePerUnit: null,
        vnetSupport: false,
        multiRegion: false,
        selfHostedGateway: false,
        developerPortal: true,
        analytics: true,
        aiGateway: false,
        mcpSupport: false,
        websocketSupport: false,
        productionReady: false,
        documentationLinks: JSON.stringify([
            { label: 'API Management v2', url: 'https://docs.microsoft.com/azure/api-management/api-management-v2' }
        ])
    },
    {
        id: 'apim-standard-v2',
        skuName: 'Standard v2',
        skuTier: 'StandardV2',
        version: 'v2',
        category: 'v2',
        description: 'v2 architecture tier with VNET integration for secure outbound traffic to backends in virtual networks or on-premises',
        purpose: 'Supports VNET integration for secure outbound traffic',
        pricingModel: 'per-unit',
        pricingInfo: JSON.stringify({
            pricing: 'Fixed monthly rate per unit',
            note: 'Preview pricing may change'
        }),
        sla: '99.95%',
        features: JSON.stringify([
            'Faster deployment times',
            'VNET integration for secure outbound traffic',
            '99.95% SLA',
            'Integrated developer portal',
            'Connection to backends in VNETs or on-premises',
            'Improved architecture'
        ]),
        capabilities: JSON.stringify([
            'VNET integration (outbound)',
            'Faster deployment',
            'Secure backend connectivity',
            'Improved architecture'
        ]),
        limitations: JSON.stringify([
            'Public IP address (Private Link required for secure inbound)',
            'Currently in preview',
            'Not recommended for production use',
            'Features and pricing may change'
        ]),
        useCases: JSON.stringify([
            'VNET integration requirements',
            'Secure backend connectivity',
            'Testing v2 architecture'
        ]),
        maxScaleUnits: null,
        cachePerUnit: null,
        vnetSupport: true,
        multiRegion: false,
        selfHostedGateway: false,
        developerPortal: true,
        analytics: true,
        aiGateway: false,
        mcpSupport: true,
        websocketSupport: true,
        productionReady: false,
        documentationLinks: JSON.stringify([
            { label: 'API Management v2', url: 'https://docs.microsoft.com/azure/api-management/api-management-v2' },
            { label: 'MCP Support in v2', url: 'https://techcommunity.microsoft.com/blog/integrationsonazureblog/%F0%9F%9A%80-new-in-azure-api-management-mcp-in-v2-skus--external-mcp-compliant-server-sup/4440294' }
        ])
    },
    {
        id: 'apim-premium-v2',
        skuName: 'Premium v2',
        skuTier: 'PremiumV2',
        version: 'v2',
        category: 'v2',
        description: 'Enterprise-wide API programs requiring high availability and performance with comprehensive feature set and unlimited included API calls',
        purpose: 'Designed for enterprise-wide API programs requiring high availability and performance',
        pricingModel: 'per-unit',
        pricingInfo: JSON.stringify({
            pricing: 'Fixed monthly rate per unit',
            note: 'Unlimited included API calls, preview pricing may change'
        }),
        sla: '99.95%',
        features: JSON.stringify([
            'Superior capacity and highest entity limits',
            'Unlimited included API calls',
            'Comprehensive feature set',
            'New architecture eliminating management traffic from customer VNET',
            'Choice between VNET injection or VNET integration',
            'Enhanced security and simplified setup',
            'AI Gateway features',
            'MCP (Model Context Protocol) support',
            'WebSocket support',
            'Real-time API support'
        ]),
        capabilities: JSON.stringify([
            'Highest capacity',
            'Unlimited API calls',
            'VNET injection or integration',
            'AI Gateway',
            'MCP support',
            'WebSocket support',
            'Enterprise features'
        ]),
        limitations: JSON.stringify([
            'Currently in public preview',
            'Features and pricing may change upon general availability'
        ]),
        useCases: JSON.stringify([
            'Enterprise-wide API programs',
            'High availability requirements',
            'AI Gateway scenarios',
            'MCP-compliant server integration',
            'Real-time API requirements',
            'WebSocket applications'
        ]),
        maxScaleUnits: null,
        cachePerUnit: null,
        vnetSupport: true,
        multiRegion: true,
        selfHostedGateway: false,
        developerPortal: true,
        analytics: true,
        aiGateway: true,
        mcpSupport: true,
        websocketSupport: true,
        productionReady: false,
        documentationLinks: JSON.stringify([
            { label: 'API Management v2', url: 'https://docs.microsoft.com/azure/api-management/api-management-v2' },
            { label: 'AI Gateway', url: 'https://docs.microsoft.com/azure/api-management/api-management-ai-gateway' },
            { label: 'MCP Support in v2', url: 'https://techcommunity.microsoft.com/blog/integrationsonazureblog/%F0%9F%9A%80-new-in-azure-api-management-mcp-in-v2-skus--external-mcp-compliant-server-sup/4440294' }
        ])
    }
];

/**
 * Populate APIM offerings table
 */
function populateApimOfferings() {
    const db = initDatabase();
    
    // Check if table exists, create if not
    const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='apimOfferings'
    `).get();
    
    if (!tableExists) {
        console.log('Creating apimOfferings table...');
        const schema = `
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
        db.exec(schema);
    }
    
    // Clear existing data
    db.prepare('DELETE FROM apimOfferings').run();
    console.log('Cleared existing APIM offerings data');
    
    // Insert offerings
    const insert = db.prepare(`
        INSERT INTO apimOfferings (
            id, skuName, skuTier, version, category, description, purpose,
            pricingModel, pricingInfo, sla, features, capabilities, limitations,
            useCases, maxScaleUnits, cachePerUnit, vnetSupport, multiRegion,
            selfHostedGateway, developerPortal, analytics, aiGateway, mcpSupport,
            websocketSupport, productionReady, documentationLinks
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
    `);
    
    const insertMany = db.transaction((offerings) => {
        for (const offering of offerings) {
            insert.run(
                offering.id,
                offering.skuName,
                offering.skuTier,
                offering.version,
                offering.category,
                offering.description,
                offering.purpose,
                offering.pricingModel,
                offering.pricingInfo,
                offering.sla,
                offering.features,
                offering.capabilities,
                offering.limitations,
                offering.useCases,
                offering.maxScaleUnits,
                offering.cachePerUnit,
                offering.vnetSupport ? 1 : 0,
                offering.multiRegion ? 1 : 0,
                offering.selfHostedGateway ? 1 : 0,
                offering.developerPortal ? 1 : 0,
                offering.analytics ? 1 : 0,
                offering.aiGateway ? 1 : 0,
                offering.mcpSupport ? 1 : 0,
                offering.websocketSupport ? 1 : 0,
                offering.productionReady ? 1 : 0,
                offering.documentationLinks
            );
        }
    });
    
    insertMany(APIM_OFFERINGS);
    console.log(`Inserted ${APIM_OFFERINGS.length} APIM offerings`);
    
    // Display summary
    const count = db.prepare('SELECT COUNT(*) as count FROM apimOfferings').get();
    console.log(`Total APIM offerings in database: ${count.count}`);
    
    const byVersion = db.prepare(`
        SELECT version, COUNT(*) as count 
        FROM apimOfferings 
        GROUP BY version
    `).all();
    console.log('Offerings by version:', byVersion);
    
    const byCategory = db.prepare(`
        SELECT category, COUNT(*) as count 
        FROM apimOfferings 
        GROUP BY category
    `).all();
    console.log('Offerings by category:', byCategory);
}

// Run the script
try {
    populateApimOfferings();
    console.log('APIM offerings populated successfully!');
    process.exit(0);
} catch (error) {
    console.error('Error populating APIM offerings:', error);
    process.exit(1);
}




