/**
 * Azure Resource Templates
 * 
 * Template definitions and common patterns for Azure services.
 * These templates provide default values and structures for service offerings.
 */

/**
 * Get service-specific templates
 */
export function getServiceTemplates(serviceName) {
    const templates = {
        Functions: {
            commonAttributes: {
                durableFunctionsSupport: true,
                customDomains: true
            },
            documentationBase: 'https://learn.microsoft.com/azure/azure-functions/'
        },
        AppService: {
            commonAttributes: {
                customDomains: true
            },
            documentationBase: 'https://learn.microsoft.com/azure/app-service/'
        },
        LogicApps: {
            commonAttributes: {
                connectors: '200+',
                customConnectors: true,
                enterpriseIntegrationPack: true
            },
            documentationBase: 'https://learn.microsoft.com/azure/logic-apps/'
        },
        ServiceBus: {
            commonAttributes: {
                messageOrdering: true,
                deadLettering: true
            },
            documentationBase: 'https://learn.microsoft.com/azure/service-bus-messaging/'
        },
        ContainerApps: {
            commonAttributes: {
                daprSupport: true,
                kedaScaling: true
            },
            documentationBase: 'https://learn.microsoft.com/azure/container-apps/'
        }
    };

    return templates[serviceName] || {};
}

/**
 * Common SLA values
 */
export const COMMON_SLAS = {
    NONE: null,
    STANDARD: '99.9%',
    HIGH: '99.95%',
    PREMIUM: '99.99%'
};

/**
 * Common pricing models
 */
export const PRICING_MODELS = {
    FREE: 'free',
    PAY_PER_USE: 'pay-per-use',
    PAY_PER_EXECUTION: 'pay-per-execution',
    PER_UNIT: 'per-unit',
    FIXED_MONTHLY: 'fixed-monthly'
};

/**
 * Common categories
 */
export const CATEGORIES = {
    SERVERLESS: 'serverless',
    DEDICATED: 'dedicated',
    SHARED: 'shared',
    PREMIUM: 'premium',
    ISOLATED: 'isolated',
    MESSAGING: 'messaging'
};

/**
 * Create a base offering template
 */
export function createBaseOffering(serviceName, skuName, category) {
    return {
        id: `${serviceName.toLowerCase().replace(/\s+/g, '-')}-${skuName.toLowerCase().replace(/\s+/g, '-')}`,
        skuName,
        category,
        regions: ['All Azure regions'],
        isPreview: false,
        isRecommended: false,
        isProductionReady: true
    };
}
