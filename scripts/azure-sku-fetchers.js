/**
 * Azure SKU Fetchers
 * 
 * Service-specific functions to fetch Azure service offerings and SKUs.
 * Each fetcher returns an array of offerings in the standardized format.
 */

import { getServiceTemplates } from './azure-resource-templates.js';

// ============================================================================
// AZURE FUNCTIONS
// ============================================================================

/**
 * Fetch Azure Functions SKUs/Plans
 */
export async function fetchFunctionsSkus(options) {
    console.log('  Fetching Azure Functions plans...');
    
    const templates = getServiceTemplates('Functions');
    const offerings = [];

    // Consumption Plan
    offerings.push({
        id: 'functions-consumption',
        skuName: 'Consumption',
        skuTier: 'Consumption',
        category: 'serverless',
        description: 'Serverless, event-driven compute service that runs code on-demand without managing infrastructure',
        purpose: 'Ideal for event-driven scenarios with variable workloads and unpredictable scaling needs',
        pricingModel: 'pay-per-execution',
        pricingInfo: {
            model: 'Pay per execution and execution time',
            freeTier: '1 million executions and 400,000 GB-s free per month',
            billing: 'Per-execution with automatic scaling'
        },
        sla: '99.95%',
        features: [
            'Automatic scaling based on demand',
            'Pay only for execution time',
            'Event-driven triggers (HTTP, Timer, Queue, etc.)',
            'Integrated monitoring and logging',
            'Multiple runtime versions supported',
            'Built-in security with Azure AD integration'
        ],
        capabilities: [
            'Automatic scaling from 0 to many instances',
            'Maximum execution time of 5 minutes (default) or 10 minutes (configurable)',
            'Multiple language support (C#, JavaScript, Python, Java, PowerShell)',
            'Integrated with Azure services'
        ],
        limitations: [
            'Limited to 1.5 GB memory per instance',
            'Maximum execution timeout of 10 minutes',
            'Cold start latency for idle functions',
            'No VNET integration',
            'Shared compute resources'
        ],
        useCases: [
            'Event-driven microservices',
            'Scheduled tasks and automation',
            'API backends with variable traffic',
            'Data processing pipelines',
            'Integration workflows'
        ],
        attributes: {
            vnetIntegration: false,
            alwaysOn: false,
            maxMemoryMB: 1536,
            maxExecutionTimeMinutes: 10,
            durableFunctionsSupport: true,
            customDomains: true,
            deploymentSlots: false,
            privateEndpoints: false,
            scalingType: 'automatic'
        },
        regions: ['All Azure regions'],
        documentationLinks: [
            { title: 'Azure Functions Consumption Plan', url: 'https://learn.microsoft.com/azure/azure-functions/consumption-plan' },
            { title: 'Azure Functions Pricing', url: 'https://azure.microsoft.com/pricing/details/functions/' }
        ],
        isPreview: false,
        isRecommended: true,
        isProductionReady: true
    });

    // Flex Consumption Plan
    offerings.push({
        id: 'functions-flex-consumption',
        skuName: 'Flex Consumption',
        skuTier: 'Flex Consumption',
        category: 'serverless',
        description: 'Next-generation serverless plan with faster scaling, larger instances, and improved performance',
        purpose: 'For applications requiring faster cold starts, larger memory, and improved scaling performance',
        pricingModel: 'pay-per-use',
        pricingInfo: {
            model: 'Pay per execution time with per-second billing',
            billing: 'More granular billing with per-second pricing',
            note: 'Generally lower cost than Consumption for high-volume scenarios'
        },
        sla: '99.95%',
        features: [
            'Faster cold starts compared to Consumption',
            'Larger instance sizes available',
            'Per-second billing for better cost optimization',
            'Improved scaling performance',
            'VNET integration support',
            'All Consumption plan features'
        ],
        capabilities: [
            'Up to 4 GB memory per instance',
            'Faster scale-out performance',
            'Reduced cold start times',
            'Virtual network integration',
            'Improved concurrency handling'
        ],
        limitations: [
            'Currently in preview',
            'Limited regional availability',
            'May have feature parity gaps during preview'
        ],
        useCases: [
            'High-performance event processing',
            'Applications requiring faster cold starts',
            'Workloads needing VNET integration in serverless model',
            'Cost-sensitive high-volume applications'
        ],
        attributes: {
            vnetIntegration: true,
            alwaysOn: false,
            maxMemoryMB: 4096,
            maxExecutionTimeMinutes: 10,
            durableFunctionsSupport: true,
            customDomains: true,
            deploymentSlots: false,
            privateEndpoints: true,
            scalingType: 'automatic-enhanced'
        },
        regions: ['Selected Azure regions (expanding)'],
        documentationLinks: [
            { title: 'Flex Consumption Plan', url: 'https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan' }
        ],
        isPreview: true,
        isRecommended: false,
        isProductionReady: false
    });

    // Premium Plan (Elastic Premium)
    offerings.push({
        id: 'functions-premium',
        skuName: 'Premium',
        skuTier: 'Elastic Premium',
        category: 'dedicated',
        description: 'Dedicated plan with enhanced performance, VNET integration, and no cold start delays',
        purpose: 'For production workloads requiring predictable performance, VNET integration, and advanced features',
        pricingModel: 'per-unit',
        pricingInfo: {
            model: 'Pay for pre-warmed instances with elastic scaling',
            units: 'EP1, EP2, EP3 instance sizes',
            billing: 'Fixed cost per instance hour plus execution charges'
        },
        sla: '99.95%',
        features: [
            'No cold start with always-ready instances',
            'VNET integration for secure connectivity',
            'Larger instance sizes (up to 14 GB memory)',
            'Unlimited execution duration',
            'Private site access with private endpoints',
            'Advanced deployment features',
            'Pre-warmed instances'
        ],
        capabilities: [
            'Up to 14 GB memory per instance (EP3)',
            'Unlimited execution time',
            'Elastic scaling with minimum instances',
            'Full VNET integration',
            'Durable Functions support',
            'Deployment slots for staging'
        ],
        limitations: [
            'Higher cost than Consumption',
            'Requires minimum instance count',
            'More complex pricing model'
        ],
        useCases: [
            'Enterprise applications requiring VNET integration',
            'Long-running functions',
            'Applications requiring predictable performance',
            'Workloads needing private connectivity',
            'Production apps requiring deployment slots'
        ],
        attributes: {
            vnetIntegration: true,
            alwaysOn: true,
            maxMemoryMB: 14336,
            maxExecutionTimeMinutes: -1,
            durableFunctionsSupport: true,
            customDomains: true,
            deploymentSlots: true,
            privateEndpoints: true,
            scalingType: 'elastic',
            instanceSizes: ['EP1', 'EP2', 'EP3']
        },
        regions: ['All Azure regions'],
        documentationLinks: [
            { title: 'Premium Plan', url: 'https://learn.microsoft.com/azure/azure-functions/functions-premium-plan' }
        ],
        isPreview: false,
        isRecommended: true,
        isProductionReady: true
    });

    // Dedicated (App Service Plan)
    offerings.push({
        id: 'functions-dedicated',
        skuName: 'Dedicated',
        skuTier: 'App Service Plan',
        category: 'dedicated',
        description: 'Run functions on dedicated App Service plan with predictable billing and resource allocation',
        purpose: 'For scenarios requiring dedicated resources, existing App Service plan usage, or predictable costs',
        pricingModel: 'fixed-monthly',
        pricingInfo: {
            model: 'Pay for App Service plan regardless of function usage',
            units: 'Uses existing App Service plan tiers (Basic, Standard, Premium)',
            billing: 'Monthly per App Service plan'
        },
        sla: '99.95%',
        features: [
            'Run on existing App Service plans',
            'Predictable costs regardless of execution',
            'Full VNET integration',
            'No cold starts with Always On',
            'All App Service features available',
            'Better for long-running functions'
        ],
        capabilities: [
            'Uses App Service plan compute',
            'Unlimited execution time with Always On',
            'Full control over scaling',
            'Deployment slots',
            'Advanced deployment options'
        ],
        limitations: [
            'Pay for plan even when functions are idle',
            'Manual scaling configuration required',
            'Cost depends on App Service plan tier'
        ],
        useCases: [
            'Existing App Service plan with spare capacity',
            'Applications requiring predictable billing',
            'Long-running or continuously executing functions',
            'Functions needing specific VM sizes',
            'Cost optimization through plan sharing'
        ],
        attributes: {
            vnetIntegration: true,
            alwaysOn: true,
            maxMemoryMB: null,
            maxExecutionTimeMinutes: -1,
            durableFunctionsSupport: true,
            customDomains: true,
            deploymentSlots: true,
            privateEndpoints: true,
            scalingType: 'manual-or-autoscale',
            useAppServicePlan: true
        },
        regions: ['All Azure regions'],
        documentationLinks: [
            { title: 'Dedicated (App Service) Plan', url: 'https://learn.microsoft.com/azure/azure-functions/dedicated-plan' }
        ],
        isPreview: false,
        isRecommended: false,
        isProductionReady: true
    });

    console.log(`  ✓ Found ${offerings.length} Azure Functions plans`);
    return offerings;
}

// ============================================================================
// APP SERVICE
// ============================================================================

/**
 * Fetch App Service SKUs/Tiers
 * Platform as a Service (PaaS) offering for building, deploying, and scaling web apps and APIs quickly.
 */
export async function fetchAppServiceSkus(options) {
    console.log('  Fetching App Service plans...');
    
    const offerings = [];
    
    // Instance size specifications
    const instanceSpecs = {
        'B1': { cpu: 1, ramGB: 1.75, diskGB: 10, cores: '1 core', memory: '1.75 GB RAM' },
        'B2': { cpu: 2, ramGB: 3.5, diskGB: 10, cores: '2 cores', memory: '3.5 GB RAM' },
        'B3': { cpu: 4, ramGB: 7, diskGB: 50, cores: '4 cores', memory: '7 GB RAM' },
        'S1': { cpu: 1, ramGB: 1.75, diskGB: 50, cores: '1 core', memory: '1.75 GB RAM' },
        'S2': { cpu: 2, ramGB: 3.5, diskGB: 50, cores: '2 cores', memory: '3.5 GB RAM' },
        'S3': { cpu: 4, ramGB: 7, diskGB: 50, cores: '4 cores', memory: '7 GB RAM' },
        'P0v3': { cpu: 1, ramGB: 3.5, diskGB: 250, cores: '1 core', memory: '3.5 GB RAM' },
        'P1v3': { cpu: 2, ramGB: 7, diskGB: 250, cores: '2 cores', memory: '7 GB RAM' },
        'P2v3': { cpu: 4, ramGB: 14, diskGB: 250, cores: '4 cores', memory: '14 GB RAM' },
        'P3v3': { cpu: 8, ramGB: 28, diskGB: 250, cores: '8 cores', memory: '28 GB RAM' },
        'P4v3': { cpu: 16, ramGB: 32, diskGB: 250, cores: '16 cores', memory: '32 GB RAM' },
        'I1v2': { cpu: 2, ramGB: 7, diskGB: 250, cores: '2 cores', memory: '7 GB RAM' },
        'I2v2': { cpu: 4, ramGB: 14, diskGB: 250, cores: '4 cores', memory: '14 GB RAM' },
        'I3v2': { cpu: 8, ramGB: 28, diskGB: 250, cores: '8 cores', memory: '28 GB RAM' },
        'I4v2': { cpu: 16, ramGB: 56, diskGB: 250, cores: '16 cores', memory: '56 GB RAM' },
        'I5v2': { cpu: 32, ramGB: 112, diskGB: 250, cores: '32 cores', memory: '112 GB RAM' },
        'I6v2': { cpu: 64, ramGB: 192, diskGB: 250, cores: '64 cores', memory: '192 GB RAM' }
    };

    const appServiceTiers = [
        {
            id: 'appservice-free',
            skuName: 'Free',
            skuTier: 'Free',
            category: 'shared',
            description: 'Free tier for development and testing with shared resources. Platform as a Service (PaaS) offering for building, deploying, and scaling web apps and APIs quickly.',
            purpose: 'Learning, development, and testing without cost. Ideal for getting started with Azure App Service.',
            pricingModel: 'free',
            pricingInfo: {
                model: 'Free',
                limitations: 'Shared CPU, 1 GB disk, 60 CPU minutes/day',
                note: 'No charges for compute, storage, or bandwidth'
            },
            sla: null,
            features: [
                '10 apps per subscription',
                '1 GB disk space',
                'Shared compute resources',
                'Custom domains (no SSL)',
                'Built-in authentication',
                'Deployment from Git, GitHub, Bitbucket',
                'Continuous deployment',
                'WebJobs support',
                'Basic monitoring'
            ],
            capabilities: [
                'Basic web hosting',
                'No SLA guarantee',
                'Shared infrastructure',
                'Multiple deployment methods',
                'Built-in CI/CD',
                'WebJobs for background tasks',
                'Application Insights integration'
            ],
            limitations: [
                '60 CPU minutes per day limit',
                'No custom SSL certificates',
                'No deployment slots',
                'No auto-scaling',
                'No VNET integration',
                'No private endpoints',
                'Shared compute (performance varies)',
                'No Always On',
                'Apps may idle after 20 minutes'
            ],
            useCases: [
                'Learning and experimentation',
                'Personal projects',
                'Development and testing',
                'Proof of concept applications',
                'Student projects',
                'Non-production workloads'
            ],
            deploymentOptions: [
                'Git deployment',
                'GitHub Actions',
                'Azure DevOps',
                'FTP/S',
                'Local Git',
                'Zip deploy',
                'Docker containers'
            ],
            attributes: {
                maxApps: 10,
                diskSpaceGB: 1,
                cpuType: 'shared',
                ramMB: 1024,
                deploymentSlots: 0,
                autoScale: false,
                vnetIntegration: false,
                customSSL: false,
                alwaysOn: false,
                privateEndpoints: false,
                dailyBackups: false,
                stagingSlots: false,
                customDomains: true,
                webJobs: true,
                continuousDeployment: true
            },
            networking: {
                inboundIpType: 'shared',
                outboundIpType: 'shared',
                privateEndpoints: false,
                vnetIntegration: false,
                hybridConnections: false
            },
            scaling: {
                type: 'none',
                minInstances: 1,
                maxInstances: 1,
                autoScale: false,
                scaleOutRules: false,
                scaleInRules: false
            },
            isPreview: false,
            isRecommended: false,
            isProductionReady: false
        },
        {
            id: 'appservice-shared',
            skuName: 'Shared',
            skuTier: 'Shared',
            category: 'shared',
            description: 'Low-cost shared hosting for development with custom domains. Platform as a Service (PaaS) offering for building, deploying, and scaling web apps and APIs quickly.',
            purpose: 'Small development projects with custom domain requirements and basic SSL support.',
            pricingModel: 'fixed-monthly',
            pricingInfo: {
                model: 'Low monthly cost',
                note: 'Shared resources with metered compute',
                billing: 'Fixed monthly fee plus metered compute usage'
            },
            sla: null,
            features: [
                '100 apps per plan',
                'Shared compute resources',
                'Custom domains',
                'SNI SSL support',
                'Built-in authentication',
                'Deployment slots (1)',
                'WebJobs support',
                'Basic monitoring'
            ],
            capabilities: [
                'Custom domains',
                'SNI SSL support',
                'Shared resources',
                'Basic deployment slots',
                'Multiple deployment methods',
                'WebJobs for background tasks'
            ],
            limitations: [
                '240 CPU minutes per day limit',
                'Shared infrastructure',
                'No deployment slots (only production)',
                'No auto-scaling',
                'No VNET integration',
                'No private endpoints',
                'No Always On',
                'Shared compute (performance varies)'
            ],
            useCases: [
                'Development projects',
                'Low-traffic apps',
                'Personal websites',
                'Testing with custom domains',
                'Non-production workloads'
            ],
            deploymentOptions: [
                'Git deployment',
                'GitHub Actions',
                'Azure DevOps',
                'FTP/S',
                'Local Git',
                'Zip deploy',
                'Docker containers'
            ],
            attributes: {
                maxApps: 100,
                diskSpaceGB: 1,
                cpuType: 'shared',
                ramMB: 1024,
                deploymentSlots: 0,
                autoScale: false,
                vnetIntegration: false,
                customSSL: true,
                alwaysOn: false,
                privateEndpoints: false,
                dailyBackups: false,
                stagingSlots: false,
                customDomains: true,
                webJobs: true,
                continuousDeployment: true
            },
            networking: {
                inboundIpType: 'shared',
                outboundIpType: 'shared',
                privateEndpoints: false,
                vnetIntegration: false,
                hybridConnections: false
            },
            scaling: {
                type: 'none',
                minInstances: 1,
                maxInstances: 1,
                autoScale: false,
                scaleOutRules: false,
                scaleInRules: false
            },
            isPreview: false,
            isRecommended: false,
            isProductionReady: false
        },
        {
            id: 'appservice-basic',
            skuName: 'Basic',
            skuTier: 'Basic',
            category: 'dedicated',
            description: 'Dedicated compute for production workloads with manual scaling. Platform as a Service (PaaS) offering for building, deploying, and scaling web apps and APIs quickly.',
            purpose: 'Entry-level production hosting with dedicated resources and predictable performance.',
            pricingModel: 'per-unit',
            pricingInfo: {
                model: 'Monthly per instance',
                units: 'B1, B2, B3',
                billing: 'Fixed monthly cost per instance size',
                instanceSizes: ['B1', 'B2', 'B3'].map(size => ({
                    size,
                    ...instanceSpecs[size],
                    description: `${instanceSpecs[size].cores}, ${instanceSpecs[size].memory}, ${instanceSpecs[size].diskGB} GB storage`
                }))
            },
            sla: '99.95%',
            features: [
                'Dedicated compute resources',
                'Custom domains',
                'Manual scaling up to 3 instances',
                'SSL certificates (SNI and IP-based)',
                '99.95% SLA',
                'Always On support',
                'Deployment slots (1)',
                'WebJobs support',
                'Basic monitoring and diagnostics'
            ],
            capabilities: [
                'Up to 3 instances',
                'A-series compute (B1: 1 core/1.75 GB, B2: 2 cores/3.5 GB, B3: 4 cores/7 GB)',
                'Dedicated resources',
                'Always On to prevent cold starts',
                'Manual scaling',
                'Custom SSL certificates',
                'Basic deployment slots'
            ],
            limitations: [
                'No auto-scaling',
                'No deployment slots (only production)',
                'No VNET integration',
                'No private endpoints',
                'Manual scaling only',
                'Limited to 3 instances',
                'No zone redundancy'
            ],
            useCases: [
                'Small production apps',
                'Predictable traffic patterns',
                'Cost-sensitive workloads',
                'Entry-level production hosting',
                'Applications with steady load'
            ],
            deploymentOptions: [
                'Git deployment',
                'GitHub Actions',
                'Azure DevOps',
                'FTP/S',
                'Local Git',
                'Zip deploy',
                'Docker containers',
                'Container Registry'
            ],
            attributes: {
                cpuType: 'A-series',
                maxInstances: 3,
                deploymentSlots: 0,
                autoScale: false,
                vnetIntegration: false,
                customSSL: true,
                alwaysOn: true,
                privateEndpoints: false,
                dailyBackups: false,
                stagingSlots: false,
                instanceSizes: ['B1', 'B2', 'B3'],
                instanceSpecs: ['B1', 'B2', 'B3'].map(size => instanceSpecs[size])
            },
            networking: {
                inboundIpType: 'dedicated',
                outboundIpType: 'dedicated',
                privateEndpoints: false,
                vnetIntegration: false,
                hybridConnections: false
            },
            scaling: {
                type: 'manual',
                minInstances: 1,
                maxInstances: 3,
                autoScale: false,
                scaleOutRules: false,
                scaleInRules: false
            },
            isPreview: false,
            isRecommended: false,
            isProductionReady: true
        },
        {
            id: 'appservice-standard',
            skuName: 'Standard',
            skuTier: 'Standard',
            category: 'dedicated',
            description: 'Production-grade hosting with auto-scaling and deployment slots. Platform as a Service (PaaS) offering for building, deploying, and scaling web apps and APIs quickly.',
            purpose: 'Production applications requiring auto-scale, deployment slots, and staging environments.',
            pricingModel: 'per-unit',
            pricingInfo: {
                model: 'Monthly per instance',
                units: 'S1, S2, S3',
                billing: 'Fixed monthly cost per instance size',
                instanceSizes: ['S1', 'S2', 'S3'].map(size => ({
                    size,
                    ...instanceSpecs[size],
                    description: `${instanceSpecs[size].cores}, ${instanceSpecs[size].memory}, ${instanceSpecs[size].diskGB} GB storage`
                }))
            },
            sla: '99.95%',
            features: [
                'Auto-scale up to 10 instances',
                '5 deployment slots',
                'Daily automated backups',
                'Custom domains and SSL',
                '99.95% SLA',
                'Always On support',
                'Traffic Manager integration',
                'WebJobs support',
                'Advanced monitoring and diagnostics',
                'Application Insights integration'
            ],
            capabilities: [
                'Up to 10 instances',
                'A-series compute (S1: 1 core/1.75 GB, S2: 2 cores/3.5 GB, S3: 4 cores/7 GB)',
                'Auto-scaling based on metrics',
                '5 deployment slots for staging',
                'Daily backups with retention',
                'Custom SSL certificates',
                'Traffic Manager for global distribution'
            ],
            limitations: [
                'Limited to 10 instances',
                'No VNET integration',
                'No private endpoints',
                'No zone redundancy',
                'A-series compute (not latest generation)'
            ],
            useCases: [
                'Production web applications',
                'APIs with variable load',
                'Apps requiring staging slots',
                'Applications needing auto-scaling',
                'Multi-environment deployments'
            ],
            deploymentOptions: [
                'Git deployment',
                'GitHub Actions',
                'Azure DevOps',
                'FTP/S',
                'Local Git',
                'Zip deploy',
                'Docker containers',
                'Container Registry',
                'Slots for blue-green deployments'
            ],
            attributes: {
                cpuType: 'A-series',
                maxInstances: 10,
                deploymentSlots: 5,
                autoScale: true,
                vnetIntegration: false,
                customSSL: true,
                alwaysOn: true,
                privateEndpoints: false,
                dailyBackups: true,
                stagingSlots: true,
                instanceSizes: ['S1', 'S2', 'S3'],
                instanceSpecs: ['S1', 'S2', 'S3'].map(size => instanceSpecs[size])
            },
            networking: {
                inboundIpType: 'dedicated',
                outboundIpType: 'dedicated',
                privateEndpoints: false,
                vnetIntegration: false,
                hybridConnections: false,
                trafficManager: true
            },
            scaling: {
                type: 'automatic',
                minInstances: 1,
                maxInstances: 10,
                autoScale: true,
                scaleOutRules: true,
                scaleInRules: true,
                metrics: ['CPU', 'Memory', 'HTTP Queue Length', 'Data In', 'Data Out']
            },
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        },
        {
            id: 'appservice-premiumv3',
            skuName: 'Premium v3',
            skuTier: 'PremiumV3',
            category: 'premium',
            description: 'High-performance hosting with enhanced compute, VNET integration, and advanced features. Platform as a Service (PaaS) offering for building, deploying, and scaling web apps and APIs quickly.',
            purpose: 'Enterprise applications requiring high performance, security, scalability, and network isolation.',
            pricingModel: 'per-unit',
            pricingInfo: {
                model: 'Monthly per instance',
                units: 'P0v3, P1v3, P2v3, P3v3, P4v3',
                billing: 'Fixed monthly cost per instance size',
                instanceSizes: ['P0v3', 'P1v3', 'P2v3', 'P3v3', 'P4v3'].map(size => ({
                    size,
                    ...instanceSpecs[size],
                    description: `${instanceSpecs[size].cores}, ${instanceSpecs[size].memory}, ${instanceSpecs[size].diskGB} GB storage`
                }))
            },
            sla: '99.95%',
            features: [
                'Up to 30 instances',
                '20 deployment slots',
                'VNET integration',
                'Private endpoints',
                'Dv3-series compute (latest generation)',
                'Enhanced performance',
                'Zone redundancy',
                'Daily automated backups',
                'Custom domains and SSL',
                '99.95% SLA',
                'Always On support',
                'Traffic Manager integration',
                'WebJobs support',
                'Advanced monitoring',
                'Application Insights integration'
            ],
            capabilities: [
                'Up to 30 instances',
                'Dv3-series compute (P0v3: 1 core/3.5 GB, P1v3: 2 cores/7 GB, P2v3: 4 cores/14 GB, P3v3: 8 cores/28 GB, P4v3: 16 cores/32 GB)',
                'VNET integration for secure backends',
                'Private endpoints for inbound traffic',
                'Zone redundancy for high availability',
                '20 deployment slots',
                'Auto-scaling with advanced rules',
                'Custom SSL certificates',
                'Enhanced performance and throughput'
            ],
            limitations: [
                'Higher cost than Standard',
                'More complex setup for VNET integration',
                'Requires VNET configuration knowledge'
            ],
            useCases: [
                'Enterprise web applications',
                'High-traffic APIs',
                'Apps requiring VNET connectivity',
                'Mission-critical workloads',
                'Applications needing zone redundancy',
                'Regulated environments',
                'High-performance requirements'
            ],
            deploymentOptions: [
                'Git deployment',
                'GitHub Actions',
                'Azure DevOps',
                'FTP/S',
                'Local Git',
                'Zip deploy',
                'Docker containers',
                'Container Registry',
                'Slots for blue-green deployments',
                'Private container registries'
            ],
            attributes: {
                cpuType: 'Dv3-series',
                maxInstances: 30,
                deploymentSlots: 20,
                autoScale: true,
                vnetIntegration: true,
                customSSL: true,
                alwaysOn: true,
                privateEndpoints: true,
                dailyBackups: true,
                stagingSlots: true,
                zoneRedundancy: true,
                instanceSizes: ['P0v3', 'P1v3', 'P2v3', 'P3v3', 'P4v3'],
                instanceSpecs: ['P0v3', 'P1v3', 'P2v3', 'P3v3', 'P4v3'].map(size => instanceSpecs[size])
            },
            networking: {
                inboundIpType: 'dedicated',
                outboundIpType: 'dedicated',
                privateEndpoints: true,
                vnetIntegration: true,
                hybridConnections: true,
                trafficManager: true,
                privateLink: true
            },
            scaling: {
                type: 'automatic',
                minInstances: 1,
                maxInstances: 30,
                autoScale: true,
                scaleOutRules: true,
                scaleInRules: true,
                metrics: ['CPU', 'Memory', 'HTTP Queue Length', 'Data In', 'Data Out', 'HttpServerErrors'],
                scheduleBasedScaling: true
            },
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        },
        {
            id: 'appservice-isolatedv2',
            skuName: 'Isolated v2',
            skuTier: 'IsolatedV2',
            category: 'isolated',
            description: 'Maximum isolation and security with dedicated environment in your own VNET. Platform as a Service (PaaS) offering for building, deploying, and scaling web apps and APIs quickly.',
            purpose: 'Applications requiring complete network isolation, highest security, and compliance requirements.',
            pricingModel: 'per-unit',
            pricingInfo: {
                model: 'Premium pricing for isolated environment',
                units: 'I1v2, I2v2, I3v2, I4v2, I5v2, I6v2',
                billing: 'Fixed monthly cost per instance size plus App Service Environment base fee',
                instanceSizes: ['I1v2', 'I2v2', 'I3v2', 'I4v2', 'I5v2', 'I6v2'].map(size => ({
                    size,
                    ...instanceSpecs[size],
                    description: `${instanceSpecs[size].cores}, ${instanceSpecs[size].memory}, ${instanceSpecs[size].diskGB} GB storage`
                }))
            },
            sla: '99.95%',
            features: [
                'Runs in dedicated App Service Environment (ASE)',
                'Complete network isolation',
                'Deployed in your VNET',
                'Internal or external load balancer',
                'Up to 100 instances per environment',
                '20 deployment slots',
                'Dv3-series compute',
                'Zone redundancy',
                'Private endpoints',
                'Daily automated backups',
                'Custom domains and SSL',
                '99.95% SLA',
                'Always On support',
                'WebJobs support',
                'Advanced monitoring'
            ],
            capabilities: [
                'Up to 100 instances per environment',
                'Complete VNET isolation',
                'Private endpoints',
                'Zone redundancy',
                'Dedicated hardware',
                'Internal load balancer option',
                '20 deployment slots',
                'Dv3-series compute (I1v2: 2 cores/7 GB, I2v2: 4 cores/14 GB, I3v2: 8 cores/28 GB, I4v2: 16 cores/56 GB, I5v2: 32 cores/112 GB, I6v2: 64 cores/192 GB)',
                'Highest security and compliance'
            ],
            limitations: [
                'Highest cost',
                'Complex setup',
                'Requires App Service Environment',
                'Requires VNET and networking expertise',
                'Longer deployment time'
            ],
            useCases: [
                'Highly regulated industries',
                'Complete network isolation requirements',
                'Large-scale enterprise applications',
                'Compliance-driven workloads',
                'Government and financial services',
                'Healthcare applications',
                'Applications requiring internal-only access'
            ],
            deploymentOptions: [
                'Git deployment',
                'GitHub Actions',
                'Azure DevOps',
                'FTP/S',
                'Local Git',
                'Zip deploy',
                'Docker containers',
                'Container Registry',
                'Slots for blue-green deployments',
                'Private container registries',
                'VNET-connected deployment sources'
            ],
            attributes: {
                cpuType: 'Dv3-series',
                maxInstances: 100,
                deploymentSlots: 20,
                autoScale: true,
                vnetIntegration: true,
                customSSL: true,
                alwaysOn: true,
                privateEndpoints: true,
                dailyBackups: true,
                stagingSlots: true,
                zoneRedundancy: true,
                isolation: 'complete',
                appServiceEnvironment: true,
                instanceSizes: ['I1v2', 'I2v2', 'I3v2', 'I4v2', 'I5v2', 'I6v2'],
                instanceSpecs: ['I1v2', 'I2v2', 'I3v2', 'I4v2', 'I5v2', 'I6v2'].map(size => instanceSpecs[size])
            },
            networking: {
                inboundIpType: 'dedicated',
                outboundIpType: 'dedicated',
                privateEndpoints: true,
                vnetIntegration: true,
                hybridConnections: true,
                trafficManager: true,
                privateLink: true,
                internalLoadBalancer: true,
                externalLoadBalancer: true
            },
            scaling: {
                type: 'automatic',
                minInstances: 1,
                maxInstances: 100,
                autoScale: true,
                scaleOutRules: true,
                scaleInRules: true,
                metrics: ['CPU', 'Memory', 'HTTP Queue Length', 'Data In', 'Data Out', 'HttpServerErrors'],
                scheduleBasedScaling: true
            },
            isPreview: false,
            isRecommended: false,
            isProductionReady: true
        }
    ];

    for (const tier of appServiceTiers) {
        offerings.push({
            ...tier,
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'App Service Overview', url: 'https://learn.microsoft.com/azure/app-service/overview' },
                { title: 'App Service Plans', url: 'https://learn.microsoft.com/azure/app-service/overview-hosting-plans' },
                { title: 'App Service Pricing', url: 'https://azure.microsoft.com/pricing/details/app-service/' },
                { title: 'App Service Scaling', url: 'https://learn.microsoft.com/azure/app-service/manage-scale-up' },
                { title: 'App Service Networking', url: 'https://learn.microsoft.com/azure/app-service/networking-features' },
                { title: 'App Service Environment', url: 'https://learn.microsoft.com/azure/app-service/environment/intro' }
            ]
        });
    }

    console.log(`  ✓ Found ${offerings.length} App Service tiers`);
    return offerings;
}

// ============================================================================
// LOGIC APPS
// ============================================================================

/**
 * Fetch Logic Apps SKUs/Plans
 */
export async function fetchLogicAppsSkus(options) {
    console.log('  Fetching Logic Apps plans...');
    
    const offerings = [
        {
            id: 'logicapps-consumption',
            skuName: 'Consumption',
            skuTier: 'Consumption',
            category: 'serverless',
            description: 'Serverless workflow automation with pay-per-execution pricing',
            purpose: 'Event-driven workflows and integrations with automatic scaling',
            pricingModel: 'pay-per-execution',
            pricingInfo: {
                model: 'Pay per action execution',
                freeTier: '4,000 built-in action executions free per month',
                billing: 'Per-action with different pricing for connectors'
            },
            sla: '99.9%',
            features: [
                'Designer-based workflow creation',
                '200+ connectors',
                'Built-in triggers and actions',
                'Automatic scaling',
                'Pay only for executions',
                'Enterprise integration capabilities'
            ],
            capabilities: [
                'Stateful workflows only',
                'Automatic scaling based on demand',
                'Built-in and managed connectors',
                'B2B integration with Enterprise Integration Pack'
            ],
            limitations: [
                'No VNET integration',
                'Shared multi-tenant environment',
                'Cannot run stateless workflows',
                'Limited control over runtime'
            ],
            useCases: [
                'Integration scenarios',
                'Business process automation',
                'Event-driven workflows',
                'Data synchronization',
                'Alert and notification systems'
            ],
            attributes: {
                vnetIntegration: false,
                statefulWorkflows: true,
                statelessWorkflows: false,
                connectors: '200+',
                customConnectors: true,
                enterpriseIntegrationPack: true,
                privateEndpoints: false
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Logic Apps Consumption', url: 'https://learn.microsoft.com/azure/logic-apps/logic-apps-overview' },
                { title: 'Logic Apps Pricing', url: 'https://azure.microsoft.com/pricing/details/logic-apps/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        },
        {
            id: 'logicapps-standard',
            skuName: 'Standard',
            skuTier: 'Standard',
            category: 'dedicated',
            description: 'Single-tenant Logic Apps with VNET integration and enhanced performance',
            purpose: 'Enterprise workflows requiring VNET integration, predictable performance, and advanced features',
            pricingModel: 'per-unit',
            pricingInfo: {
                model: 'Pay for App Service plan hosting',
                units: 'Workflow Standard (WS) plans',
                billing: 'Monthly per plan with included executions'
            },
            sla: '99.95%',
            features: [
                'VNET integration',
                'Both stateful and stateless workflows',
                'Better performance and throughput',
                'Private endpoints',
                'More control over runtime',
                'Local development support'
            ],
            capabilities: [
                'Single-tenant isolation',
                'Stateful and stateless workflows',
                'VNET integration for secure connectivity',
                'Better performance characteristics',
                'VS Code extension for local development'
            ],
            limitations: [
                'Higher cost than Consumption',
                'More complex setup',
                'Requires App Service plan management'
            ],
            useCases: [
                'Enterprise integration scenarios',
                'Workflows requiring VNET connectivity',
                'High-performance workflow execution',
                'Regulated workloads requiring isolation',
                'Applications needing predictable performance'
            ],
            attributes: {
                vnetIntegration: true,
                statefulWorkflows: true,
                statelessWorkflows: true,
                connectors: '200+',
                customConnectors: true,
                enterpriseIntegrationPack: true,
                privateEndpoints: true,
                singleTenant: true,
                localDevelopment: true
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Logic Apps Standard', url: 'https://learn.microsoft.com/azure/logic-apps/single-tenant-overview-compare' },
                { title: 'Logic Apps Pricing', url: 'https://azure.microsoft.com/pricing/details/logic-apps/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        }
    ];

    console.log(`  ✓ Found ${offerings.length} Logic Apps plans`);
    return offerings;
}

// ============================================================================
// SERVICE BUS
// ============================================================================

/**
 * Fetch Service Bus SKUs/Tiers
 */
export async function fetchServiceBusSkus(options) {
    console.log('  Fetching Service Bus tiers...');
    
    const offerings = [
        {
            id: 'servicebus-basic',
            skuName: 'Basic',
            skuTier: 'Basic',
            category: 'messaging',
            description: 'Basic message queuing for simple scenarios with pay-as-you-go pricing',
            purpose: 'Simple queue-based messaging for development and lightweight production scenarios',
            pricingModel: 'pay-per-use',
            pricingInfo: {
                model: 'Pay per million operations',
                billing: 'Operations charged per million'
            },
            sla: '99.9%',
            features: [
                'Queues only (no topics/subscriptions)',
                'Up to 256 KB message size',
                'At-least-once delivery',
                'FIFO ordering',
                'Message TTL and dead lettering'
            ],
            capabilities: [
                'Queue-based messaging',
                'Basic reliability features',
                'Scheduled message delivery',
                'Sessions for ordered processing'
            ],
            limitations: [
                'No topics or subscriptions',
                'No transactions',
                'No geo-disaster recovery',
                'Maximum 256 KB message size',
                'No VNET integration'
            ],
            useCases: [
                'Simple queue-based messaging',
                'Point-to-point communication',
                'Task distribution',
                'Development and testing'
            ],
            attributes: {
                maxMessageSizeKB: 256,
                topics: false,
                transactions: false,
                geoDisasterRecovery: false,
                vnetIntegration: false,
                privateEndpoints: false
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Service Bus Tiers', url: 'https://learn.microsoft.com/azure/service-bus-messaging/service-bus-premium-messaging' },
                { title: 'Service Bus Pricing', url: 'https://azure.microsoft.com/pricing/details/service-bus/' }
            ],
            isPreview: false,
            isRecommended: false,
            isProductionReady: true
        },
        {
            id: 'servicebus-standard',
            skuName: 'Standard',
            skuTier: 'Standard',
            category: 'messaging',
            description: 'Full-featured messaging with topics, subscriptions, and advanced features',
            purpose: 'Production messaging scenarios with pub/sub patterns and advanced routing',
            pricingModel: 'pay-per-use',
            pricingInfo: {
                model: 'Pay per million operations',
                billing: 'Operations charged per million with additional features'
            },
            sla: '99.9%',
            features: [
                'Queues, topics, and subscriptions',
                'Up to 256 KB message size',
                'Topics for pub/sub messaging',
                'Message filtering and routing',
                'Transactions and duplicate detection'
            ],
            capabilities: [
                'Pub/sub messaging with topics',
                'Advanced message routing',
                'Transactions',
                'Duplicate detection',
                'Batching'
            ],
            limitations: [
                'Variable throughput (shared resources)',
                'Maximum 256 KB message size',
                'No geo-disaster recovery',
                'No VNET integration'
            ],
            useCases: [
                'Pub/sub messaging patterns',
                'Event distribution',
                'Microservices communication',
                'Message routing and filtering'
            ],
            attributes: {
                maxMessageSizeKB: 256,
                topics: true,
                transactions: true,
                geoDisasterRecovery: false,
                vnetIntegration: false,
                privateEndpoints: false
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Service Bus Tiers', url: 'https://learn.microsoft.com/azure/service-bus-messaging/service-bus-premium-messaging' },
                { title: 'Service Bus Pricing', url: 'https://azure.microsoft.com/pricing/details/service-bus/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        },
        {
            id: 'servicebus-premium',
            skuName: 'Premium',
            skuTier: 'Premium',
            category: 'messaging',
            description: 'Enterprise-grade messaging with dedicated resources, larger messages, and advanced features',
            purpose: 'Mission-critical messaging requiring predictable performance, isolation, and advanced security',
            pricingModel: 'per-unit',
            pricingInfo: {
                model: 'Fixed monthly per messaging unit',
                units: 'Messaging Units (1, 2, 4, 8, 16)',
                billing: 'Dedicated resources with predictable costs'
            },
            sla: '99.95%',
            features: [
                'Dedicated compute resources',
                'Up to 100 MB message size',
                'Geo-disaster recovery',
                'VNET integration',
                'Private endpoints',
                'Predictable performance',
                'Resource isolation'
            ],
            capabilities: [
                'All Standard features',
                'Larger message sizes (up to 100 MB)',
                'Dedicated processing power',
                'Network isolation',
                'Geo-DR pairing',
                'Availability zones'
            ],
            limitations: [
                'Higher cost',
                'Fixed capacity units (less flexible than consumption)'
            ],
            useCases: [
                'Enterprise messaging requirements',
                'High-throughput scenarios',
                'Large message processing',
                'Regulated environments requiring isolation',
                'Mission-critical workloads',
                'Applications requiring VNET connectivity'
            ],
            attributes: {
                maxMessageSizeMB: 100,
                topics: true,
                transactions: true,
                geoDisasterRecovery: true,
                vnetIntegration: true,
                privateEndpoints: true,
                dedicatedResources: true,
                availabilityZones: true,
                messagingUnits: [1, 2, 4, 8, 16]
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Service Bus Premium', url: 'https://learn.microsoft.com/azure/service-bus-messaging/service-bus-premium-messaging' },
                { title: 'Service Bus Pricing', url: 'https://azure.microsoft.com/pricing/details/service-bus/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        }
    ];

    console.log(`  ✓ Found ${offerings.length} Service Bus tiers`);
    return offerings;
}

// ============================================================================
// CONTAINER APPS
// ============================================================================

/**
 * Fetch Container Apps SKUs/Plans
 */
export async function fetchContainerAppsSkus(options) {
    console.log('  Fetching Container Apps plans...');
    
    const offerings = [
        {
            id: 'containerapps-consumption',
            skuName: 'Consumption',
            skuTier: 'Consumption',
            category: 'serverless',
            description: 'Serverless container hosting with automatic scaling and pay-per-use pricing',
            purpose: 'Run containerized applications without managing infrastructure',
            pricingModel: 'pay-per-use',
            pricingInfo: {
                model: 'Pay for vCPU and memory usage per second',
                freeTier: '180,000 vCPU-seconds and 360,000 GiB-seconds free per month',
                billing: 'Per-second billing for compute resources'
            },
            sla: '99.95%',
            features: [
                'Automatic scaling from 0 to many instances',
                'Built-in HTTPS ingress',
                'Dapr integration',
                'KEDA-based scaling',
                'Internal and external endpoints',
                'Managed certificates'
            ],
            capabilities: [
                'Scale to zero',
                'Up to 2 vCPU and 4 GB per container',
                'Multiple container support per app',
                'VNET integration',
                'Built-in observability'
            ],
            limitations: [
                'Maximum 2 vCPU per container',
                'Maximum 4 GB memory per container',
                'Shared environment'
            ],
            useCases: [
                'Microservices',
                'API backends',
                'Event-driven applications',
                'Background processing jobs',
                'Web applications'
            ],
            attributes: {
                maxVCPU: 2,
                maxMemoryGB: 4,
                scaleToZero: true,
                vnetIntegration: true,
                daprSupport: true,
                kedaScaling: true,
                privateEndpoints: false,
                workloadProfiles: false
            },
            regions: ['Most Azure regions'],
            documentationLinks: [
                { title: 'Container Apps Overview', url: 'https://learn.microsoft.com/azure/container-apps/overview' },
                { title: 'Container Apps Pricing', url: 'https://azure.microsoft.com/pricing/details/container-apps/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        },
        {
            id: 'containerapps-dedicated',
            skuName: 'Dedicated',
            skuTier: 'Dedicated',
            category: 'dedicated',
            description: 'Dedicated workload profiles with guaranteed resources and enhanced capabilities',
            purpose: 'Applications requiring guaranteed compute resources and predictable performance',
            pricingModel: 'per-unit',
            pricingInfo: {
                model: 'Pay for workload profile capacity',
                units: 'Various workload profile sizes',
                billing: 'Fixed capacity pricing'
            },
            sla: '99.95%',
            features: [
                'Dedicated compute resources',
                'Workload profiles for different needs',
                'Higher resource limits',
                'Better performance isolation',
                'All Consumption features'
            ],
            capabilities: [
                'Up to 4 vCPU and 8 GB per container',
                'Guaranteed compute resources',
                'Performance isolation',
                'Workload profile customization'
            ],
            limitations: [
                'Higher cost',
                'Currently in preview',
                'Limited regional availability'
            ],
            useCases: [
                'High-performance workloads',
                'Applications requiring resource guarantees',
                'Production workloads with strict SLAs',
                'Resource-intensive containers'
            ],
            attributes: {
                maxVCPU: 4,
                maxMemoryGB: 8,
                scaleToZero: false,
                vnetIntegration: true,
                daprSupport: true,
                kedaScaling: true,
                privateEndpoints: true,
                workloadProfiles: true,
                dedicatedResources: true
            },
            regions: ['Selected Azure regions'],
            documentationLinks: [
                { title: 'Workload Profiles', url: 'https://learn.microsoft.com/azure/container-apps/workload-profiles-overview' },
                { title: 'Container Apps Pricing', url: 'https://azure.microsoft.com/pricing/details/container-apps/' }
            ],
            isPreview: true,
            isRecommended: false,
            isProductionReady: false
        }
    ];

    console.log(`  ✓ Found ${offerings.length} Container Apps plans`);
    return offerings;
}

// ============================================================================
// EVENT GRID
// ============================================================================

/**
 * Fetch Event Grid SKUs/Tiers
 */
export async function fetchEventGridSkus(options) {
    console.log('  Fetching Event Grid tiers...');
    
    const offerings = [
        {
            id: 'eventgrid-basic',
            skuName: 'Basic',
            skuTier: 'Basic',
            category: 'eventing',
            description: 'Event routing service for event-driven architectures with pay-per-event pricing',
            purpose: 'Simple event routing and filtering for event-driven applications',
            pricingModel: 'pay-per-event',
            pricingInfo: {
                model: 'Pay per million operations',
                freeTier: '100,000 operations free per month',
                billing: 'Per million operations after free tier'
            },
            sla: '99.99%',
            features: [
                'Event routing and filtering',
                'Custom topics',
                'Built-in topics for Azure services',
                'Event subscriptions',
                'Dead lettering',
                'Retry policies'
            ],
            capabilities: [
                'Custom topics',
                'System topics for Azure services',
                'Event filtering',
                'Advanced filtering',
                'Dead letter queue support',
                'Manual handshake for webhooks'
            ],
            limitations: [
                'No private endpoints',
                'No VNET integration',
                'Maximum 1 MB event size',
                'No advanced routing features'
            ],
            useCases: [
                'Event-driven architectures',
                'Microservices communication',
                'Azure service event routing',
                'Custom application events',
                'Integration scenarios'
            ],
            attributes: {
                maxEventSizeMB: 1,
                privateEndpoints: false,
                vnetIntegration: false,
                advancedRouting: false,
                customDomains: false,
                deadLettering: true,
                retryPolicies: true
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Event Grid Overview', url: 'https://learn.microsoft.com/azure/event-grid/overview' },
                { title: 'Event Grid Pricing', url: 'https://azure.microsoft.com/pricing/details/event-grid/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        },
        {
            id: 'eventgrid-standard',
            skuName: 'Standard',
            skuTier: 'Standard',
            category: 'eventing',
            description: 'Enhanced event routing with private endpoints, VNET integration, and advanced features',
            purpose: 'Enterprise event routing requiring network isolation and advanced capabilities',
            pricingModel: 'pay-per-event',
            pricingInfo: {
                model: 'Pay per million operations',
                billing: 'Per million operations with additional features'
            },
            sla: '99.99%',
            features: [
                'All Basic features',
                'Private endpoints',
                'VNET integration',
                'Custom domains',
                'Advanced routing',
                'Managed identity support',
                'IP filtering'
            ],
            capabilities: [
                'Network isolation',
                'Private connectivity',
                'Custom domain support',
                'Advanced filtering and routing',
                'IP-based access control',
                'Managed identity authentication'
            ],
            limitations: [
                'Higher cost than Basic',
                'More complex setup',
                'Maximum 1 MB event size'
            ],
            useCases: [
                'Enterprise event routing',
                'Regulated environments',
                'VNET-connected applications',
                'Custom domain requirements',
                'Advanced security requirements'
            ],
            attributes: {
                maxEventSizeMB: 1,
                privateEndpoints: true,
                vnetIntegration: true,
                advancedRouting: true,
                customDomains: true,
                deadLettering: true,
                retryPolicies: true,
                managedIdentity: true,
                ipFiltering: true
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Event Grid Private Endpoints', url: 'https://learn.microsoft.com/azure/event-grid/configure-private-endpoints' },
                { title: 'Event Grid Pricing', url: 'https://azure.microsoft.com/pricing/details/event-grid/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        }
    ];

    console.log(`  ✓ Found ${offerings.length} Event Grid tiers`);
    return offerings;
}

// ============================================================================
// EVENT HUBS
// ============================================================================

/**
 * Fetch Event Hubs SKUs/Tiers
 */
export async function fetchEventHubsSkus(options) {
    console.log('  Fetching Event Hubs tiers...');
    
    const offerings = [
        {
            id: 'eventhubs-basic',
            skuName: 'Basic',
            skuTier: 'Basic',
            category: 'messaging',
            description: 'Entry-level event streaming with basic throughput and features',
            purpose: 'Low-volume event streaming and simple ingestion scenarios',
            pricingModel: 'pay-per-use',
            pricingInfo: {
                model: 'Pay per throughput unit',
                billing: 'Per throughput unit hour'
            },
            sla: '99.95%',
            features: [
                'Event streaming',
                'Kafka protocol support',
                'Capture to Azure Storage',
                'Basic monitoring',
                'Consumer groups'
            ],
            capabilities: [
                'Up to 1 throughput unit',
                'Up to 1 MB/s ingress, 2 MB/s egress',
                'Kafka protocol support',
                'Event capture',
                'Consumer groups'
            ],
            limitations: [
                'No auto-inflate',
                'No dedicated clusters',
                'Limited throughput',
                'No VNET integration',
                'No private endpoints'
            ],
            useCases: [
                'Low-volume event streaming',
                'Development and testing',
                'Simple event ingestion',
                'Cost-sensitive scenarios'
            ],
            attributes: {
                maxThroughputUnits: 1,
                maxIngressMBps: 1,
                maxEgressMBps: 2,
                kafkaSupport: true,
                autoInflate: false,
                vnetIntegration: false,
                privateEndpoints: false,
                dedicatedClusters: false,
                eventCapture: true
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Event Hubs Tiers', url: 'https://learn.microsoft.com/azure/event-hubs/event-hubs-faq' },
                { title: 'Event Hubs Pricing', url: 'https://azure.microsoft.com/pricing/details/event-hubs/' }
            ],
            isPreview: false,
            isRecommended: false,
            isProductionReady: true
        },
        {
            id: 'eventhubs-standard',
            skuName: 'Standard',
            skuTier: 'Standard',
            category: 'messaging',
            description: 'Production-grade event streaming with auto-inflate and enhanced features',
            purpose: 'Production event streaming with variable throughput and advanced capabilities',
            pricingModel: 'pay-per-use',
            pricingInfo: {
                model: 'Pay per throughput unit',
                billing: 'Per throughput unit hour with auto-inflate'
            },
            sla: '99.95%',
            features: [
                'All Basic features',
                'Auto-inflate',
                'Multiple consumer groups',
                'Event capture',
                'Archive to Data Lake',
                'Schema Registry'
            ],
            capabilities: [
                'Up to 20 throughput units',
                'Auto-scaling with auto-inflate',
                'Up to 20 MB/s ingress, 40 MB/s egress',
                'Schema Registry',
                'Event capture to Storage/Data Lake',
                'Multiple consumer groups'
            ],
            limitations: [
                'No dedicated clusters',
                'No VNET integration',
                'No private endpoints',
                'Shared infrastructure'
            ],
            useCases: [
                'Production event streaming',
                'Variable throughput scenarios',
                'Event ingestion pipelines',
                'Real-time analytics',
                'IoT data ingestion'
            ],
            attributes: {
                maxThroughputUnits: 20,
                maxIngressMBps: 20,
                maxEgressMBps: 40,
                kafkaSupport: true,
                autoInflate: true,
                vnetIntegration: false,
                privateEndpoints: false,
                dedicatedClusters: false,
                eventCapture: true,
                schemaRegistry: true
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Event Hubs Standard', url: 'https://learn.microsoft.com/azure/event-hubs/event-hubs-faq' },
                { title: 'Event Hubs Pricing', url: 'https://azure.microsoft.com/pricing/details/event-hubs/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        },
        {
            id: 'eventhubs-dedicated',
            skuName: 'Dedicated',
            skuTier: 'Dedicated',
            category: 'messaging',
            description: 'Single-tenant dedicated clusters with guaranteed capacity and isolation',
            purpose: 'High-throughput, mission-critical event streaming with guaranteed performance',
            pricingModel: 'per-unit',
            pricingInfo: {
                model: 'Fixed monthly per capacity unit',
                units: 'Capacity Units (1, 2, 4, 8, 12, 16)',
                billing: 'Monthly per capacity unit'
            },
            sla: '99.99%',
            features: [
                'Dedicated single-tenant clusters',
                'Guaranteed throughput',
                'VNET integration',
                'Private endpoints',
                'All Standard features',
                'Up to 100 TB storage per namespace'
            ],
            capabilities: [
                'Up to 16 capacity units',
                'Up to 2 GB/s ingress, 4 GB/s egress per unit',
                'Dedicated compute resources',
                'Network isolation',
                'Private connectivity',
                'Massive storage capacity'
            ],
            limitations: [
                'Higher cost',
                'Fixed capacity units',
                'Requires capacity planning'
            ],
            useCases: [
                'High-throughput event streaming',
                'Mission-critical workloads',
                'Regulated environments',
                'Predictable performance requirements',
                'Large-scale IoT scenarios'
            ],
            attributes: {
                maxCapacityUnits: 16,
                maxIngressGBps: 2,
                maxEgressGBps: 4,
                kafkaSupport: true,
                autoInflate: false,
                vnetIntegration: true,
                privateEndpoints: true,
                dedicatedClusters: true,
                eventCapture: true,
                schemaRegistry: true,
                maxStorageTB: 100,
                capacityUnits: [1, 2, 4, 8, 12, 16]
            },
            regions: ['Selected Azure regions'],
            documentationLinks: [
                { title: 'Event Hubs Dedicated', url: 'https://learn.microsoft.com/azure/event-hubs/event-hubs-dedicated-overview' },
                { title: 'Event Hubs Pricing', url: 'https://azure.microsoft.com/pricing/details/event-hubs/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        }
    ];

    console.log(`  ✓ Found ${offerings.length} Event Hubs tiers`);
    return offerings;
}

// ============================================================================
// AZURE RELAY
// ============================================================================

/**
 * Fetch Azure Relay SKUs/Tiers
 */
export async function fetchRelaySkus(options) {
    console.log('  Fetching Azure Relay tiers...');
    
    const offerings = [
        {
            id: 'relay-standard',
            skuName: 'Standard',
            skuTier: 'Standard',
            category: 'networking',
            description: 'Hybrid connectivity service enabling secure communication across network boundaries',
            purpose: 'Connect on-premises applications to cloud services without opening firewall ports',
            pricingModel: 'pay-per-use',
            pricingInfo: {
                model: 'Pay per relay hour and data transfer',
                freeTier: '5 relay hours free per month',
                billing: 'Per relay hour and per GB data transfer'
            },
            sla: '99.9%',
            features: [
                'Hybrid Connections',
                'WCF Relays',
                'TCP and HTTP protocols',
                'No firewall changes required',
                'Bi-directional communication',
                'WebSocket support'
            ],
            capabilities: [
                'Connect on-premises to cloud',
                'No inbound firewall rules needed',
                'Multiple protocol support',
                'Bi-directional messaging',
                'WebSocket connections',
                'Dynamic port allocation'
            ],
            limitations: [
                'No private endpoints',
                'Shared infrastructure',
                'Limited throughput',
                'No VNET integration'
            ],
            useCases: [
                'Hybrid cloud connectivity',
                'On-premises to cloud integration',
                'Legacy system connectivity',
                'Firewall traversal',
                'Secure cross-network communication'
            ],
            attributes: {
                hybridConnections: true,
                wcfRelays: true,
                tcpSupport: true,
                httpSupport: true,
                websocketSupport: true,
                privateEndpoints: false,
                vnetIntegration: false,
                maxConnections: null,
                dynamicPorts: true
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Azure Relay Overview', url: 'https://learn.microsoft.com/azure/azure-relay/relay-what-is-it' },
                { title: 'Azure Relay Pricing', url: 'https://azure.microsoft.com/pricing/details/service-bus/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        }
    ];

    console.log(`  ✓ Found ${offerings.length} Azure Relay tiers`);
    return offerings;
}

// ============================================================================
// CONTAINER INSTANCES
// ============================================================================

/**
 * Fetch Container Instances SKUs
 */
export async function fetchContainerInstancesSkus(options) {
    console.log('  Fetching Container Instances SKUs...');
    
    const offerings = [
        {
            id: 'containerinstances-consumption',
            skuName: 'Consumption',
            skuTier: 'Consumption',
            category: 'compute',
            description: 'Serverless containers with per-second billing and automatic scaling',
            purpose: 'Run containers without managing infrastructure, ideal for on-demand workloads',
            pricingModel: 'pay-per-use',
            pricingInfo: {
                model: 'Pay per vCPU and memory per second',
                billing: 'Per-second billing for compute resources'
            },
            sla: '99.9%',
            features: [
                'Per-second billing',
                'Automatic scaling',
                'Multiple container groups',
                'Public and private IPs',
                'Volume mounts',
                'Restart policies'
            ],
            capabilities: [
                'Up to 4 vCPU per container group',
                'Up to 16 GB memory per container group',
                'Linux and Windows containers',
                'GPU support (selected regions)',
                'Azure Files volume mounts',
                'Git repo volume mounts'
            ],
            limitations: [
                'No VNET integration',
                'No private endpoints',
                'Limited to 60 containers per group',
                'No persistent storage',
                'No load balancing'
            ],
            useCases: [
                'On-demand container workloads',
                'Batch processing',
                'Task automation',
                'Development and testing',
                'Event-driven containers',
                'CI/CD build agents'
            ],
            attributes: {
                maxVCPU: 4,
                maxMemoryGB: 16,
                maxContainersPerGroup: 60,
                vnetIntegration: false,
                privateEndpoints: false,
                gpuSupport: true,
                persistentStorage: false,
                loadBalancing: false,
                restartPolicies: ['Always', 'OnFailure', 'Never'],
                osTypes: ['Linux', 'Windows']
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Container Instances Overview', url: 'https://learn.microsoft.com/azure/container-instances/container-instances-overview' },
                { title: 'Container Instances Pricing', url: 'https://azure.microsoft.com/pricing/details/container-instances/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        },
        {
            id: 'containerinstances-dedicated',
            skuName: 'Dedicated',
            skuTier: 'Dedicated',
            category: 'compute',
            description: 'Dedicated container groups with guaranteed resources and VNET integration',
            purpose: 'Production containers requiring network isolation and predictable performance',
            pricingModel: 'per-unit',
            pricingInfo: {
                model: 'Fixed monthly per container group',
                billing: 'Monthly pricing for dedicated resources'
            },
            sla: '99.9%',
            features: [
                'All Consumption features',
                'VNET integration',
                'Private endpoints',
                'Guaranteed resources',
                'Better performance isolation'
            ],
            capabilities: [
                'VNET deployment',
                'Private connectivity',
                'Network isolation',
                'Guaranteed compute',
                'All Consumption capabilities'
            ],
            limitations: [
                'Higher cost',
                'Currently in preview',
                'Limited regional availability'
            ],
            useCases: [
                'Production container workloads',
                'VNET-connected containers',
                'Regulated environments',
                'Predictable performance requirements'
            ],
            attributes: {
                maxVCPU: 4,
                maxMemoryGB: 16,
                maxContainersPerGroup: 60,
                vnetIntegration: true,
                privateEndpoints: true,
                gpuSupport: true,
                persistentStorage: false,
                loadBalancing: false,
                dedicatedResources: true
            },
            regions: ['Selected Azure regions'],
            documentationLinks: [
                { title: 'Container Instances VNET', url: 'https://learn.microsoft.com/azure/container-instances/container-instances-vnet' },
                { title: 'Container Instances Pricing', url: 'https://azure.microsoft.com/pricing/details/container-instances/' }
            ],
            isPreview: true,
            isRecommended: false,
            isProductionReady: false
        }
    ];

    console.log(`  ✓ Found ${offerings.length} Container Instances SKUs`);
    return offerings;
}

// ============================================================================
// AZURE KUBERNETES SERVICE (AKS)
// ============================================================================

/**
 * Fetch AKS SKUs/Tiers
 */
export async function fetchAKSSkus(options) {
    console.log('  Fetching AKS tiers...');
    
    const offerings = [
        {
            id: 'aks-free',
            skuName: 'Free',
            skuTier: 'Free',
            category: 'kubernetes',
            description: 'Managed Kubernetes service with free control plane',
            purpose: 'Kubernetes orchestration with no control plane charges',
            pricingModel: 'pay-per-node',
            pricingInfo: {
                model: 'Pay only for node VMs, control plane is free',
                billing: 'Per node VM instance'
            },
            sla: '99.5%',
            features: [
                'Managed Kubernetes control plane',
                'Automatic upgrades',
                'Integrated monitoring',
                'Azure AD integration',
                'Network policies',
                'RBAC support'
            ],
            capabilities: [
                'Standard Kubernetes features',
                'Up to 5,000 nodes per cluster',
                'Up to 110 pods per node',
                'Azure CNI and kubenet networking',
                'Container Insights',
                'Azure Policy integration'
            ],
            limitations: [
                'No SLA guarantee',
                'Limited support options',
                'No advanced features',
                'No private cluster support',
                'No availability zones'
            ],
            useCases: [
                'Development and testing',
                'Small production workloads',
                'Cost-sensitive scenarios',
                'Learning Kubernetes'
            ],
            attributes: {
                controlPlaneFree: true,
                maxNodes: 5000,
                maxPodsPerNode: 110,
                privateCluster: false,
                availabilityZones: false,
                nodePools: true,
                autoScaling: true,
                networkPolicies: true,
                rbac: true,
                azureAdIntegration: true
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'AKS Overview', url: 'https://learn.microsoft.com/azure/aks/intro-kubernetes' },
                { title: 'AKS Pricing', url: 'https://azure.microsoft.com/pricing/details/kubernetes-service/' }
            ],
            isPreview: false,
            isRecommended: false,
            isProductionReady: true
        },
        {
            id: 'aks-standard',
            skuName: 'Standard',
            skuTier: 'Standard',
            category: 'kubernetes',
            description: 'Production-grade managed Kubernetes with SLA and advanced features',
            purpose: 'Production Kubernetes workloads requiring SLA guarantees and enterprise features',
            pricingModel: 'pay-per-node',
            pricingInfo: {
                model: 'Pay for node VMs, control plane included',
                billing: 'Per node VM instance'
            },
            sla: '99.95%',
            features: [
                'All Free tier features',
                '99.95% SLA',
                'Availability zones',
                'Private clusters',
                'Advanced networking',
                'GitOps support',
                'Azure Policy'
            ],
            capabilities: [
                'Availability zone support',
                'Private cluster deployment',
                'Advanced networking options',
                'GitOps with Flux',
                'Azure Policy for Kubernetes',
                'Workload identity',
                'Kubernetes secrets store CSI'
            ],
            limitations: [
                'Higher cost than Free',
                'More complex setup',
                'Requires node VM management'
            ],
            useCases: [
                'Production Kubernetes workloads',
                'Enterprise applications',
                'High availability requirements',
                'Regulated environments',
                'Multi-zone deployments'
            ],
            attributes: {
                controlPlaneFree: true,
                maxNodes: 5000,
                maxPodsPerNode: 110,
                privateCluster: true,
                availabilityZones: true,
                nodePools: true,
                autoScaling: true,
                networkPolicies: true,
                rbac: true,
                azureAdIntegration: true,
                gitOps: true,
                azurePolicy: true,
                workloadIdentity: true
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'AKS Production Best Practices', url: 'https://learn.microsoft.com/azure/aks/best-practices' },
                { title: 'AKS Pricing', url: 'https://azure.microsoft.com/pricing/details/kubernetes-service/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        }
    ];

    console.log(`  ✓ Found ${offerings.length} AKS tiers`);
    return offerings;
}

// ============================================================================
// AZURE BATCH
// ============================================================================

/**
 * Fetch Azure Batch SKUs
 */
export async function fetchBatchSkus(options) {
    console.log('  Fetching Azure Batch tiers...');
    
    const offerings = [
        {
            id: 'batch-user-subscription',
            skuName: 'User Subscription',
            skuTier: 'User Subscription',
            category: 'compute',
            description: 'Batch processing with user-managed subscription and quotas',
            purpose: 'Batch workloads using your own subscription quotas and limits',
            pricingModel: 'pay-per-use',
            pricingInfo: {
                model: 'Pay for compute nodes and storage',
                billing: 'Per VM instance and storage used'
            },
            sla: '99.9%',
            features: [
                'Large-scale parallel processing',
                'Automatic scaling',
                'Job scheduling',
                'Task dependencies',
                'Multiple VM sizes',
                'Linux and Windows support'
            ],
            capabilities: [
                'Up to 100,000 cores per account',
                'Automatic pool scaling',
                'Job and task management',
                'Task dependencies and retries',
                'Application packages',
                'Custom images'
            ],
            limitations: [
                'Uses your subscription quotas',
                'Requires quota management',
                'No dedicated capacity',
                'No SLA guarantee'
            ],
            useCases: [
                'Large-scale batch processing',
                'HPC workloads',
                'Rendering jobs',
                'Data processing pipelines',
                'Financial modeling'
            ],
            attributes: {
                maxCoresPerAccount: 100000,
                autoScaling: true,
                jobScheduling: true,
                taskDependencies: true,
                applicationPackages: true,
                customImages: true,
                linuxSupport: true,
                windowsSupport: true,
                dedicatedCapacity: false,
                quotaManagement: true
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Azure Batch Overview', url: 'https://learn.microsoft.com/azure/batch/batch-technical-overview' },
                { title: 'Azure Batch Pricing', url: 'https://azure.microsoft.com/pricing/details/batch/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
        },
        {
            id: 'batch-dedicated',
            skuName: 'Dedicated',
            skuTier: 'Dedicated',
            category: 'compute',
            description: 'Batch processing with dedicated capacity and guaranteed quotas',
            purpose: 'Mission-critical batch workloads requiring guaranteed capacity and SLA',
            pricingModel: 'per-unit',
            pricingInfo: {
                model: 'Fixed monthly for dedicated capacity',
                billing: 'Monthly per dedicated core allocation'
            },
            sla: '99.9%',
            features: [
                'All User Subscription features',
                'Dedicated capacity',
                'Guaranteed quotas',
                'SLA guarantee',
                'Priority support'
            ],
            capabilities: [
                'Dedicated core allocation',
                'Guaranteed capacity',
                'No quota limits',
                'Priority scheduling',
                'All User Subscription capabilities'
            ],
            limitations: [
                'Higher cost',
                'Requires capacity commitment',
                'Less flexible than User Subscription'
            ],
            useCases: [
                'Mission-critical batch processing',
                'Guaranteed capacity requirements',
                'Enterprise HPC workloads',
                'Regulated environments'
            ],
            attributes: {
                maxCoresPerAccount: null,
                autoScaling: true,
                jobScheduling: true,
                taskDependencies: true,
                applicationPackages: true,
                customImages: true,
                linuxSupport: true,
                windowsSupport: true,
                dedicatedCapacity: true,
                quotaManagement: false,
                slaGuarantee: true
            },
            regions: ['Selected Azure regions'],
            documentationLinks: [
                { title: 'Azure Batch Dedicated', url: 'https://learn.microsoft.com/azure/batch/batch-dedicated-nodes' },
                { title: 'Azure Batch Pricing', url: 'https://azure.microsoft.com/pricing/details/batch/' }
            ],
            isPreview: false,
            isRecommended: false,
            isProductionReady: true
        }
    ];

    console.log(`  ✓ Found ${offerings.length} Azure Batch SKUs`);
    return offerings;
}

// ============================================================================
// API MANAGEMENT (APIM)
// ============================================================================

/**
 * Fetch API Management SKUs/Tiers
 * 
 * Azure API Management SKU information sources:
 * - Azure REST API: /subscriptions/{subscriptionId}/providers/Microsoft.ApiManagement/skus
 * - Azure Pricing: https://azure.microsoft.com/pricing/details/api-management/
 * - Documentation: https://learn.microsoft.com/azure/api-management/api-management-tiers
 * - Azure CLI: az apim list-skus
 */
export async function fetchAPIMSkus(options) {
    console.log('  Fetching API Management SKUs...');
    
    const offerings = [
        {
            id: 'apim-consumption',
            skuName: 'Consumption',
            skuTier: 'Consumption',
            version: 'v1',
            category: 'serverless',
            description: 'Serverless, pay-as-you-go API Management tier ideal for prototyping, development, testing, and low-volume production scenarios',
            purpose: 'Ideal for serverless and pay-as-you-go scenarios, suitable for prototyping, development, testing, and low-volume production',
            pricingModel: 'pay-per-execution',
            pricingInfo: {
                model: 'Pay per API call execution',
                freeTier: 'First 1 million executions free per month',
                billing: 'Per-execution after free tier',
                note: 'No infrastructure management required'
            },
            sla: null,
            features: [
                'Automatic scaling based on demand',
                'Pay only for API calls executed',
                'No infrastructure management',
                'Basic security (authentication, authorization, rate limiting, IP filtering)',
                'Integrated developer portal',
                'Analytics and monitoring',
                'API versioning support',
                'Subscription and key management'
            ],
            capabilities: [
                'Automatic scaling from zero to many instances',
                'Up to 5 gateways per subscription',
                '500 subscriptions per gateway',
                '50 APIs per gateway',
                '1,000 API operations per gateway',
                'Maximum request duration of 30 seconds',
                'Maximum policy length of 4 KB',
                'Developer portal included',
                'Basic analytics'
            ],
            limitations: [
                'No SLA guarantee',
                'Limited to 5 gateways per subscription',
                '500 subscriptions per gateway limit',
                '50 APIs per gateway limit',
                '1,000 API operations per gateway limit',
                'Maximum request duration of 30 seconds',
                'Maximum policy length of 4 KB',
                'No VNET integration',
                'No private endpoints',
                'No self-hosted gateway',
                'No multi-region deployments'
            ],
            useCases: [
                'Prototyping and development',
                'Testing and evaluation',
                'Low-volume production APIs',
                'Serverless architectures',
                'Pay-as-you-go scenarios',
                'Event-driven API scenarios',
                'Microservices API gateway'
            ],
            attributes: {
                maxGateways: 5,
                maxSubscriptionsPerGateway: 500,
                maxApisPerGateway: 50,
                maxOperationsPerGateway: 1000,
                maxRequestDurationSeconds: 30,
                maxPolicyLengthKB: 4,
                vnetIntegration: false,
                privateEndpoints: false,
                selfHostedGateway: false,
                multiRegion: false,
                developerPortal: true,
                analytics: true,
                aiGateway: false,
                mcpSupport: false,
                websocketSupport: false,
                cacheSize: null,
                maxScaleUnits: null,
                scalingType: 'automatic'
            },
            networking: {
                vnetIntegration: false,
                privateEndpoints: false,
                publicEndpoint: true,
                hybridConnections: false
            },
            scaling: {
                type: 'automatic',
                minInstances: 0,
                maxInstances: null,
                scaleOutUnits: null,
                autoScale: true
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Consumption Tier Documentation', url: 'https://learn.microsoft.com/azure/api-management/api-management-consumption-tier' },
                { title: 'API Management Pricing', url: 'https://azure.microsoft.com/pricing/details/api-management/' },
                { title: 'API Management Overview', url: 'https://learn.microsoft.com/azure/api-management/api-management-key-concepts' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: false
        },
        {
            id: 'apim-developer',
            skuName: 'Developer',
            skuTier: 'Developer',
            version: 'v1',
            category: 'development',
            description: 'Non-production tier designed for development, testing, and evaluation with all features for building and experimenting with APIs',
            purpose: 'Designed for non-production use cases such as development, testing, and evaluation',
            pricingModel: 'fixed-monthly',
            pricingInfo: {
                model: 'Fixed monthly rate',
                note: 'Single scale-out unit only, no SLA',
                billing: 'Monthly flat fee'
            },
            sla: null,
            features: [
                'All API Management features',
                'Integrated developer portal',
                'Full policy support',
                'API versioning',
                'Subscriptions and keys',
                'Analytics',
                'Single scale-out unit'
            ],
            capabilities: [
                'Full feature set for development',
                'Developer portal included',
                'Policy configuration',
                'API versioning support',
                'Subscription management',
                'All standard policies',
                'Analytics and monitoring'
            ],
            limitations: [
                'No SLA guarantee',
                'Limited throughput (single unit)',
                'Single scale-out unit only',
                'Not suitable for live/production environments',
                'No VNET integration',
                'No private endpoints',
                'No multi-region deployments'
            ],
            useCases: [
                'Development and testing',
                'Evaluation and proof of concept',
                'Learning and experimentation',
                'Non-production API management',
                'Team development environments'
            ],
            attributes: {
                maxGateways: 1,
                maxSubscriptionsPerGateway: null,
                maxApisPerGateway: null,
                maxOperationsPerGateway: null,
                maxRequestDurationSeconds: null,
                maxPolicyLengthKB: null,
                vnetIntegration: false,
                privateEndpoints: false,
                selfHostedGateway: false,
                multiRegion: false,
                developerPortal: true,
                analytics: true,
                aiGateway: false,
                mcpSupport: false,
                websocketSupport: false,
                cacheSize: null,
                maxScaleUnits: 1,
                scalingType: 'fixed'
            },
            networking: {
                vnetIntegration: false,
                privateEndpoints: false,
                publicEndpoint: true,
                hybridConnections: false
            },
            scaling: {
                type: 'fixed',
                minInstances: 1,
                maxInstances: 1,
                scaleOutUnits: 1,
                autoScale: false
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Developer Tier Documentation', url: 'https://learn.microsoft.com/azure/api-management/api-management-tiers' },
                { title: 'API Management Pricing', url: 'https://azure.microsoft.com/pricing/details/api-management/' }
            ],
            isPreview: false,
            isRecommended: false,
            isProductionReady: false
        },
        {
            id: 'apim-basic',
            skuName: 'Basic',
            skuTier: 'Basic',
            version: 'v1',
            category: 'standard',
            description: 'Entry-level production tier with standard API gateway functionality, suitable for entry-level production use cases',
            purpose: 'Suitable for entry-level production use cases with SLA guarantee',
            pricingModel: 'per-unit',
            pricingInfo: {
                model: 'Fixed monthly rate per unit',
                units: 'Up to 2 scale-out units',
                billing: 'Monthly per unit',
                note: '50 MB cache per unit'
            },
            sla: '99.9%',
            features: [
                'Standard API gateway functionality',
                '50 MB cache per unit',
                'Up to 2 scale-out units',
                '99.9% SLA',
                'Developer portal',
                'Analytics and monitoring',
                'Full policy support',
                'API versioning'
            ],
            capabilities: [
                'Production-ready with SLA',
                'Basic scaling (up to 2 units)',
                'Caching support (50 MB per unit)',
                'Developer portal included',
                'Analytics and monitoring',
                'All standard policies',
                'Subscription management'
            ],
            limitations: [
                'No Virtual Network (VNET) support',
                'Limited scalability (max 2 units)',
                'Smaller cache size (50 MB per unit)',
                'No multi-region deployments',
                'No private endpoints',
                'No self-hosted gateway'
            ],
            useCases: [
                'Entry-level production APIs',
                'Small to medium workloads',
                'Cost-conscious production deployments',
                'Single-region deployments',
                'Standard API gateway needs'
            ],
            attributes: {
                maxGateways: null,
                maxSubscriptionsPerGateway: null,
                maxApisPerGateway: null,
                maxOperationsPerGateway: null,
                maxRequestDurationSeconds: null,
                maxPolicyLengthKB: null,
                vnetIntegration: false,
                privateEndpoints: false,
                selfHostedGateway: false,
                multiRegion: false,
                developerPortal: true,
                analytics: true,
                aiGateway: false,
                mcpSupport: false,
                websocketSupport: false,
                cacheSize: '50 MB',
                maxScaleUnits: 2,
                scalingType: 'manual'
            },
            networking: {
                vnetIntegration: false,
                privateEndpoints: false,
                publicEndpoint: true,
                hybridConnections: false
            },
            scaling: {
                type: 'manual',
                minInstances: 1,
                maxInstances: 2,
                scaleOutUnits: [1, 2],
                autoScale: false
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Basic Tier Documentation', url: 'https://learn.microsoft.com/azure/api-management/api-management-tiers' },
                { title: 'API Management Pricing', url: 'https://azure.microsoft.com/pricing/details/api-management/' }
            ],
            isPreview: false,
            isRecommended: false,
            isProductionReady: true
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
            pricingInfo: {
                model: 'Fixed monthly rate per unit',
                units: 'Up to 4 scale-out units',
                billing: 'Monthly per unit',
                note: '1 GB cache per unit'
            },
            sla: '99.9%',
            features: [
                '1 GB cache per unit',
                'Up to 4 scale-out units',
                '99.9% SLA',
                'VNET integration for secure, private connectivity',
                'Multi-region deployments',
                'Developer portal',
                'Analytics and monitoring',
                'Full policy support',
                'API versioning'
            ],
            capabilities: [
                'VNET integration for secure backends',
                'Multi-region support',
                'Enhanced caching (1 GB per unit)',
                'Better scalability (up to 4 units)',
                'Developer portal included',
                'Analytics and monitoring',
                'All standard and advanced policies',
                'Subscription management'
            ],
            limitations: [
                'Limited scalability compared to Premium tier',
                'No self-hosted gateway',
                'Limited to 4 scale-out units',
                'No private endpoints',
                'Smaller cache than Premium tier'
            ],
            useCases: [
                'Business-critical APIs',
                'Growing teams and organizations',
                'Multi-region deployments',
                'VNET integration requirements',
                'Medium to high-volume production',
                'Enterprise API programs'
            ],
            attributes: {
                maxGateways: null,
                maxSubscriptionsPerGateway: null,
                maxApisPerGateway: null,
                maxOperationsPerGateway: null,
                maxRequestDurationSeconds: null,
                maxPolicyLengthKB: null,
                vnetIntegration: true,
                privateEndpoints: false,
                selfHostedGateway: false,
                multiRegion: true,
                developerPortal: true,
                analytics: true,
                aiGateway: false,
                mcpSupport: false,
                websocketSupport: false,
                cacheSize: '1 GB',
                maxScaleUnits: 4,
                scalingType: 'manual'
            },
            networking: {
                vnetIntegration: true,
                privateEndpoints: false,
                publicEndpoint: true,
                hybridConnections: false
            },
            scaling: {
                type: 'manual',
                minInstances: 1,
                maxInstances: 4,
                scaleOutUnits: [1, 2, 3, 4],
                autoScale: false
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Standard Tier Documentation', url: 'https://learn.microsoft.com/azure/api-management/api-management-tiers' },
                { title: 'VNET Integration', url: 'https://learn.microsoft.com/azure/api-management/api-management-using-with-vnet' },
                { title: 'API Management Pricing', url: 'https://azure.microsoft.com/pricing/details/api-management/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
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
            pricingInfo: {
                model: 'Fixed monthly rate per unit',
                units: 'Up to 10 scale-out units per region (additional units available upon request)',
                billing: 'Monthly per unit',
                note: '5 GB cache per unit'
            },
            sla: '99.95%',
            features: [
                '5 GB cache per unit',
                'Up to 10 scale-out units per region',
                '99.95% SLA',
                'Multi-region active-active deployments',
                'Advanced VNET injection',
                'Self-hosted gateway for hybrid/multi-cloud',
                'Developer portal',
                'Analytics and monitoring',
                'Full policy support',
                'API versioning',
                'Private endpoints support'
            ],
            capabilities: [
                'Highest scalability (up to 10 units per region)',
                'Multi-region active-active deployments',
                'Advanced VNET injection',
                'Self-hosted gateway for hybrid scenarios',
                'Largest cache size (5 GB per unit)',
                'Developer portal included',
                'Analytics and monitoring',
                'All standard and advanced policies',
                'Private endpoints support',
                'Enterprise-grade features'
            ],
            limitations: [
                'Higher cost than Standard tier',
                'More complex setup and configuration',
                'Requires capacity planning'
            ],
            useCases: [
                'Enterprise-scale deployments',
                'High availability requirements',
                'Multi-region active-active scenarios',
                'Hybrid and multi-cloud strategies',
                'Compliance requirements',
                'Mission-critical APIs',
                'Large-scale API programs'
            ],
            attributes: {
                maxGateways: null,
                maxSubscriptionsPerGateway: null,
                maxApisPerGateway: null,
                maxOperationsPerGateway: null,
                maxRequestDurationSeconds: null,
                maxPolicyLengthKB: null,
                vnetIntegration: true,
                privateEndpoints: true,
                selfHostedGateway: true,
                multiRegion: true,
                developerPortal: true,
                analytics: true,
                aiGateway: false,
                mcpSupport: false,
                websocketSupport: false,
                cacheSize: '5 GB',
                maxScaleUnits: 10,
                scalingType: 'manual'
            },
            networking: {
                vnetIntegration: true,
                privateEndpoints: true,
                publicEndpoint: true,
                hybridConnections: true,
                vnetInjection: true
            },
            scaling: {
                type: 'manual',
                minInstances: 1,
                maxInstances: 10,
                scaleOutUnits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                autoScale: false
            },
            regions: ['All Azure regions'],
            documentationLinks: [
                { title: 'Premium Tier Documentation', url: 'https://learn.microsoft.com/azure/api-management/api-management-tiers' },
                { title: 'Self-hosted Gateway', url: 'https://learn.microsoft.com/azure/api-management/self-hosted-gateway-overview' },
                { title: 'API Management Pricing', url: 'https://azure.microsoft.com/pricing/details/api-management/' }
            ],
            isPreview: false,
            isRecommended: true,
            isProductionReady: true
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
            pricingInfo: {
                model: 'Fixed monthly rate per unit',
                note: 'Preview pricing may change upon general availability',
                billing: 'Monthly per unit'
            },
            sla: '99.95%',
            features: [
                'Faster deployment times (minutes instead of hours)',
                '99.95% SLA',
                'Integrated developer portal',
                'Improved architecture',
                'Enhanced performance',
                'All standard API Management features',
                'Analytics and monitoring'
            ],
            capabilities: [
                'Faster deployment (minutes vs hours)',
                'Improved architecture',
                'Better performance characteristics',
                'Production SLA (99.95%)',
                'Developer portal included',
                'Analytics and monitoring',
                'All standard policies'
            ],
            limitations: [
                'Public IP address (Private Link required for secure inbound)',
                'Currently in public preview',
                'Not recommended for production use until GA',
                'Features and pricing may change',
                'No VNET integration',
                'No private endpoints',
                'No multi-region deployments'
            ],
            useCases: [
                'Small teams and projects',
                'Projects requiring fast deployment',
                'Testing v2 architecture',
                'Evaluation of new architecture',
                'Non-production workloads'
            ],
            attributes: {
                maxGateways: null,
                maxSubscriptionsPerGateway: null,
                maxApisPerGateway: null,
                maxOperationsPerGateway: null,
                maxRequestDurationSeconds: null,
                maxPolicyLengthKB: null,
                vnetIntegration: false,
                privateEndpoints: false,
                selfHostedGateway: false,
                multiRegion: false,
                developerPortal: true,
                analytics: true,
                aiGateway: false,
                mcpSupport: false,
                websocketSupport: false,
                cacheSize: null,
                maxScaleUnits: null,
                scalingType: 'manual',
                deploymentTimeMinutes: true
            },
            networking: {
                vnetIntegration: false,
                privateEndpoints: false,
                publicEndpoint: true,
                hybridConnections: false,
                privateLink: true
            },
            scaling: {
                type: 'manual',
                minInstances: 1,
                maxInstances: null,
                scaleOutUnits: null,
                autoScale: false
            },
            regions: ['Selected Azure regions'],
            documentationLinks: [
                { title: 'API Management v2', url: 'https://learn.microsoft.com/azure/api-management/api-management-v2' },
                { title: 'API Management Pricing', url: 'https://azure.microsoft.com/pricing/details/api-management/' }
            ],
            isPreview: true,
            isRecommended: false,
            isProductionReady: false
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
            pricingInfo: {
                model: 'Fixed monthly rate per unit',
                note: 'Preview pricing may change upon general availability',
                billing: 'Monthly per unit'
            },
            sla: '99.95%',
            features: [
                'Faster deployment times',
                'VNET integration for secure outbound traffic',
                '99.95% SLA',
                'Integrated developer portal',
                'Connection to backends in VNETs or on-premises',
                'Improved architecture',
                'MCP (Model Context Protocol) support for AI agent integration',
                'REST API exposure as MCP tools for AI agents',
                'External MCP-compliant server integration',
                'WebSocket support',
                'All standard API Management features'
            ],
            capabilities: [
                'VNET integration (outbound)',
                'Faster deployment',
                'Secure backend connectivity',
                'Improved architecture',
                'MCP (Model Context Protocol) support for AI agents',
                'Tool discovery and invocation via MCP',
                'REST API exposure as MCP tools',
                'External MCP server integration',
                'Context-aware tool invocations',
                'WebSocket support for real-time APIs',
                'Production SLA (99.95%)',
                'Developer portal included',
                'Analytics and monitoring'
            ],
            limitations: [
                'Public IP address (Private Link required for secure inbound)',
                'Currently in public preview',
                'Not recommended for production use until GA',
                'Features and pricing may change',
                'No private endpoints',
                'No multi-region deployments',
                'No self-hosted gateway'
            ],
            useCases: [
                'VNET integration requirements',
                'Secure backend connectivity',
                'Testing v2 architecture',
                'MCP-compliant server integration',
                'WebSocket applications',
                'Real-time API requirements'
            ],
            attributes: {
                maxGateways: null,
                maxSubscriptionsPerGateway: null,
                maxApisPerGateway: null,
                maxOperationsPerGateway: null,
                maxRequestDurationSeconds: null,
                maxPolicyLengthKB: null,
                vnetIntegration: true,
                privateEndpoints: false,
                selfHostedGateway: false,
                multiRegion: false,
                developerPortal: true,
                analytics: true,
                aiGateway: false,
                mcpSupport: true,
                websocketSupport: true,
                cacheSize: null,
                maxScaleUnits: null,
                scalingType: 'manual',
                deploymentTimeMinutes: true
            },
            metadata: {
                mcpSupport: {
                    enabled: true,
                    protocolVersion: '1.0',
                    features: {
                        toolDiscovery: {
                            enabled: true,
                            description: 'Expose REST APIs as tools discoverable by AI agents via MCP'
                        },
                        toolInvocation: {
                            enabled: true,
                            authentication: true,
                            authorization: true,
                            description: 'Allow AI agents to invoke APIs as tools with proper authentication'
                        },
                        contextAwareness: {
                            enabled: true,
                            sessionManagement: true,
                            description: 'Maintain context across multiple tool invocations'
                        },
                        externalMcpServers: {
                            enabled: true,
                            integration: true,
                            description: 'Integrate with external MCP-compliant servers'
                        }
                    },
                    useCases: [
                        'AI agent tool integration',
                        'REST API exposure as MCP tools',
                        'Multi-agent workflows',
                        'Context-aware AI applications'
                    ],
                    limitations: [
                        'MCP support is available but full AI Gateway features require Premium v2',
                        'Token-based rate limiting and semantic caching not available in Standard v2',
                        'Content safety policies are limited compared to Premium v2'
                    ]
                }
            },
            networking: {
                vnetIntegration: true,
                privateEndpoints: false,
                publicEndpoint: true,
                hybridConnections: false,
                privateLink: true
            },
            scaling: {
                type: 'manual',
                minInstances: 1,
                maxInstances: null,
                scaleOutUnits: null,
                autoScale: false
            },
            regions: ['Selected Azure regions'],
            documentationLinks: [
                { title: 'API Management v2', url: 'https://learn.microsoft.com/azure/api-management/api-management-v2' },
                { title: 'MCP Support in v2', url: 'https://techcommunity.microsoft.com/blog/integrationsonazureblog/%F0%9F%9A%80-new-in-azure-api-management-mcp-in-v2-skus--external-mcp-compliant-server-sup/4440294' },
                { title: 'API Management Pricing', url: 'https://azure.microsoft.com/pricing/details/api-management/' }
            ],
            isPreview: true,
            isRecommended: false,
            isProductionReady: false
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
            pricingInfo: {
                model: 'Fixed monthly rate per unit',
                note: 'Unlimited included API calls, preview pricing may change upon general availability',
                billing: 'Monthly per unit with unlimited API calls'
            },
            sla: '99.95%',
            features: [
                'Superior capacity and highest entity limits',
                'Unlimited included API calls',
                'Comprehensive feature set',
                'New architecture eliminating management traffic from customer VNET',
                'Choice between VNET injection or VNET integration',
                'Enhanced security and simplified setup',
                'AI Gateway with comprehensive LLM management capabilities',
                'Token-based rate limiting and cost control',
                'Semantic caching for cost optimization (30-70% cost reduction)',
                'Content safety and prompt injection protection',
                'PII detection and sensitive data filtering',
                'Prompt management with versioning and templates',
                'Multi-model routing and load balancing',
                'Token tracking and usage analytics',
                'MCP (Model Context Protocol) support',
                'AI agent tool discovery and invocation',
                'Integration with Microsoft Foundry',
                'Support for Azure OpenAI, OpenAI, and custom LLM providers',
                'WebSocket support',
                'Real-time API support',
                'Faster deployment times',
                '99.95% SLA',
                'Multi-region deployments'
            ],
            capabilities: [
                'Highest capacity and entity limits',
                'Unlimited API calls included',
                'VNET injection or integration',
                'AI Gateway with enterprise-grade LLM governance',
                'Token limits (request, response, total) with hard enforcement',
                'Semantic caching with embedding-based similarity matching',
                'Content safety: prompt injection protection, content moderation, PII detection',
                'Token-based, request-based, and cost-based rate limiting',
                'Prompt management: versioning, templates, decorators',
                'Multi-model routing with load balancing and failover',
                'Comprehensive observability: token tracking, latency monitoring, cost attribution',
                'MCP support for AI agent tool discovery and invocation',
                'External MCP-compliant server integration',
                'Microsoft Foundry integration',
                'Support for multiple LLM providers (Azure OpenAI, OpenAI, custom)',
                'Self-hosted model support (Ollama, vLLM)',
                'WebSocket support for real-time APIs',
                'Multi-region active-active deployments',
                'Enterprise security: OAuth 2.1, Entra ID, RBAC, audit logging',
                'IP filtering and geographic restrictions',
                'Improved architecture',
                'Faster deployment',
                'Production SLA (99.95%)',
                'Developer portal included',
                'Advanced analytics and monitoring'
            ],
            limitations: [
                'Currently in public preview',
                'Features and pricing may change upon general availability',
                'Not recommended for production use until GA',
                'Requires evaluation before production deployment'
            ],
            useCases: [
                'Enterprise-wide API programs',
                'High availability requirements',
                'AI Gateway for LLM API management and governance',
                'OpenAI and Azure OpenAI service management',
                'AI agent orchestration and tool integration',
                'Semantic caching for cost-optimized LLM deployments',
                'Content safety and compliance for AI applications',
                'Token-based cost control and budget management',
                'Multi-model routing and load balancing',
                'Prompt management and versioning',
                'MCP-compliant server integration',
                'AI application security and PII protection',
                'Real-time API requirements',
                'WebSocket applications',
                'Multi-region deployments',
                'High-volume AI API scenarios',
                'Mission-critical AI APIs',
                'Microsoft Foundry AI workloads',
                'Compliance-sensitive AI deployments (GDPR, HIPAA)'
            ],
            attributes: {
                maxGateways: null,
                maxSubscriptionsPerGateway: null,
                maxApisPerGateway: null,
                maxOperationsPerGateway: null,
                maxRequestDurationSeconds: null,
                maxPolicyLengthKB: null,
                vnetIntegration: true,
                privateEndpoints: true,
                selfHostedGateway: false,
                multiRegion: true,
                developerPortal: true,
                analytics: true,
                aiGateway: true,
                mcpSupport: true,
                websocketSupport: true,
                cacheSize: null,
                maxScaleUnits: null,
                scalingType: 'manual',
                deploymentTimeMinutes: true,
                unlimitedApiCalls: true
            },
            metadata: {
                aiGatewayDetails: {
                    enabled: true,
                    integration: {
                        microsoftFoundry: true,
                        azureOpenAI: true,
                        openAI: true,
                        anthropic: false,
                        customLLMProviders: true,
                        selfHostedModels: true,
                        frameworks: ['Ollama', 'vLLM', 'Custom']
                    },
                    policies: {
                        tokenLimits: {
                            requestTokens: {
                                enabled: true,
                                configurable: true,
                                defaultLimit: 'configurable',
                                perProvider: true,
                                enforcement: 'hard-limit',
                                description: 'Enforce maximum input token limits per request to control costs and prevent abuse'
                            },
                            responseTokens: {
                                enabled: true,
                                configurable: true,
                                defaultLimit: 'configurable',
                                perProvider: true,
                                enforcement: 'hard-limit',
                                description: 'Limit maximum output tokens to control response sizes and costs'
                            },
                            totalTokens: {
                                enabled: true,
                                configurable: true,
                                perRequest: true,
                                perDay: true,
                                perMonth: true,
                                description: 'Total token limits per request, day, or month for cost control'
                            }
                        },
                        contentSafety: {
                            promptInjectionProtection: {
                                enabled: true,
                                detectionMethods: ['pattern-matching', 'behavioral-analysis', 'heuristic-detection'],
                                blocking: true,
                                logging: true,
                                configurable: true,
                                description: 'Detect and block prompt injection attacks, including jailbreak attempts'
                            },
                            contentModeration: {
                                enabled: true,
                                categories: ['violence', 'hate', 'self-harm', 'sexual', 'terrorism'],
                                severity: 'configurable',
                                action: ['block', 'log', 'flag'],
                                description: 'Content moderation for both input prompts and AI-generated responses'
                            },
                            piiDetection: {
                                enabled: true,
                                types: ['SSN', 'Credit Card', 'Email', 'Phone', 'IP Address', 'Custom Regex'],
                                masking: true,
                                redaction: true,
                                logging: true,
                                description: 'Detect and protect personally identifiable information in requests and responses'
                            },
                            sensitiveDataFiltering: {
                                enabled: true,
                                customPatterns: true,
                                compliance: ['GDPR', 'HIPAA', 'PCI-DSS', 'Custom'],
                                description: 'Filter sensitive data to prevent exposure in AI model interactions'
                            },
                            digitalWatermarking: {
                                enabled: false,
                                supported: false,
                                description: 'Watermark AI-generated content for traceability (future feature)'
                            }
                        },
                        semanticCaching: {
                            enabled: true,
                            cacheType: 'embedding-based',
                            similarityThreshold: {
                                configurable: true,
                                default: 0.85,
                                range: [0.0, 1.0],
                                description: 'Semantic similarity threshold for cache hits'
                            },
                            embeddingModel: {
                                supported: ['text-embedding-ada-002', 'text-embedding-3-small', 'text-embedding-3-large', 'Custom'],
                                default: 'text-embedding-ada-002',
                                customModels: true
                            },
                            ttl: {
                                configurable: true,
                                default: 3600,
                                unit: 'seconds',
                                maxTtl: 86400,
                                description: 'Time-to-live for cached responses'
                            },
                            cacheKeyGeneration: {
                                method: 'semantic-similarity',
                                includeContext: true,
                                includeParameters: true,
                                customKeyLogic: true
                            },
                            costOptimization: {
                                enabled: true,
                                reductionEstimate: '30-70%',
                                description: 'Reduce LLM API costs by serving semantically similar cached responses'
                            },
                            performanceImprovement: {
                                latencyReduction: 'significant',
                                throughputIncrease: true,
                                description: 'Improve response times for similar queries'
                            }
                        },
                        rateLimiting: {
                            tokenBased: {
                                enabled: true,
                                perUser: true,
                                perSubscription: true,
                                perAPI: true,
                                perProvider: true,
                                timeWindows: ['per-minute', 'per-hour', 'per-day', 'per-month'],
                                description: 'Rate limiting based on token consumption rather than request count'
                            },
                            requestBased: {
                                enabled: true,
                                traditionalRateLimiting: true,
                                perEndpoint: true,
                                description: 'Traditional request-based rate limiting for AI endpoints'
                            },
                            costBased: {
                                enabled: true,
                                budgetEnforcement: true,
                                alertThresholds: true,
                                automaticThrottling: true,
                                description: 'Rate limiting based on cost budgets to prevent overspending'
                            },
                            adaptiveRateLimiting: {
                                enabled: true,
                                basedOnModelPerformance: true,
                                basedOnBackendHealth: true,
                                description: 'Dynamically adjust rate limits based on model performance and availability'
                            }
                        },
                        promptManagement: {
                            promptVersioning: {
                                enabled: true,
                                versionControl: true,
                                rollback: true,
                                a_bTesting: true,
                                description: 'Version control for prompts with rollback and A/B testing capabilities'
                            },
                            promptTemplates: {
                                enabled: true,
                                templateLibrary: true,
                                variables: true,
                                inheritance: true,
                                description: 'Create, store, and reuse prompt templates with variable substitution'
                            },
                            promptDecorators: {
                                enabled: true,
                                standardization: true,
                                compliance: true,
                                description: 'Apply decorators to standardize prompts and ensure compliance'
                            },
                            promptInjection: {
                                enabled: true,
                                prevention: true,
                                detection: true,
                                description: 'Prevent unauthorized prompt modifications and injection attacks'
                            }
                        },
                        modelRouting: {
                            multiModelRouting: {
                                enabled: true,
                                loadBalancing: true,
                                failover: true,
                                modelSelection: ['round-robin', 'least-cost', 'performance-based', 'custom'],
                                description: 'Route requests across multiple models for load balancing and failover'
                            },
                            modelVersioning: {
                                enabled: true,
                                canaryDeployments: true,
                                gradualRollout: true,
                                description: 'Manage model versions with canary deployments and gradual rollouts'
                            },
                            costOptimization: {
                                enabled: true,
                                routeToLeastCost: true,
                                fallbackToExpensive: true,
                                description: 'Automatically route to cost-optimized models with fallback options'
                            }
                        },
                        observability: {
                            tokenTracking: {
                                enabled: true,
                                perRequest: true,
                                perUser: true,
                                perModel: true,
                                costAttribution: true,
                                description: 'Track token consumption and costs per request, user, and model'
                            },
                            latencyMonitoring: {
                                enabled: true,
                                p50: true,
                                p95: true,
                                p99: true,
                                modelComparison: true,
                                description: 'Monitor and compare latency metrics across different models'
                            },
                            errorTracking: {
                                enabled: true,
                                categorization: true,
                                alerting: true,
                                description: 'Track and categorize errors from AI model interactions'
                            },
                            usageAnalytics: {
                                enabled: true,
                                dashboards: true,
                                exports: true,
                                customReports: true,
                                description: 'Comprehensive analytics and reporting for AI API usage'
                            }
                        }
                    },
                    mcpSupport: {
                        enabled: true,
                        protocolVersion: '1.0',
                        features: {
                            toolDiscovery: {
                                enabled: true,
                                description: 'Expose REST APIs as tools discoverable by AI agents via MCP'
                            },
                            toolInvocation: {
                                enabled: true,
                                authentication: true,
                                authorization: true,
                                description: 'Allow AI agents to invoke APIs as tools with proper authentication'
                            },
                            contextAwareness: {
                                enabled: true,
                                sessionManagement: true,
                                description: 'Maintain context across multiple tool invocations'
                            },
                            externalMcpServers: {
                                enabled: true,
                                integration: true,
                                description: 'Integrate with external MCP-compliant servers'
                            }
                        },
                        useCases: [
                            'AI agent tool integration',
                            'REST API exposure as MCP tools',
                            'Multi-agent workflows',
                            'Context-aware AI applications'
                        ]
                    },
                    security: {
                        authentication: {
                            methods: ['OAuth 2.1', 'Microsoft Entra ID', 'API Keys', 'JWT', 'Certificate'],
                            default: 'OAuth 2.1',
                            multiMethod: true
                        },
                        authorization: {
                            rbac: true,
                            abac: false,
                            customPolicies: true,
                            description: 'Role-based and attribute-based access control for AI endpoints'
                        },
                        encryption: {
                            inTransit: 'TLS 1.2+',
                            atRest: true,
                            keyManagement: 'Azure Key Vault',
                            description: 'End-to-end encryption for AI API communications'
                        },
                        auditLogging: {
                            enabled: true,
                            compliance: ['GDPR', 'HIPAA', 'SOC 2', 'ISO 27001'],
                            retention: 'configurable',
                            description: 'Comprehensive audit logging for compliance and security monitoring'
                        },
                        ipFiltering: {
                            enabled: true,
                            whitelist: true,
                            blacklist: true,
                            geoFiltering: true,
                            description: 'IP-based access control and geographic filtering'
                        }
                    },
                    deploymentOptions: {
                        regions: {
                            supported: ['All Premium v2 regions'],
                            multiRegion: true,
                            activeActive: true,
                            description: 'Deploy AI Gateway across multiple regions for high availability'
                        },
                        networking: {
                            vnetIntegration: true,
                            vnetInjection: true,
                            privateEndpoints: true,
                            publicEndpoint: true,
                            description: 'Flexible networking options for secure AI API deployment'
                        },
                        isolation: {
                            dedicatedInstances: false,
                            sharedInfrastructure: true,
                            dataResidency: true,
                            description: 'Deployment isolation and data residency options'
                        }
                    },
                    costOptimization: {
                        semanticCaching: {
                            costReduction: '30-70%',
                            enabled: true,
                            description: 'Reduce LLM API costs through intelligent caching'
                        },
                        tokenOptimization: {
                            requestOptimization: true,
                            responseTruncation: true,
                            description: 'Optimize token usage to reduce costs'
                        },
                        modelSelection: {
                            automatic: true,
                            basedOnCost: true,
                            basedOnPerformance: true,
                            description: 'Automatically select cost-optimized models'
                        },
                        usageTracking: {
                            perUser: true,
                            perDepartment: true,
                            budgetAlerts: true,
                            description: 'Track and control AI API spending'
                        }
                    },
                    bestPractices: [
                        'Enable semantic caching for frequently asked questions',
                        'Set token limits to prevent cost overruns',
                        'Configure content safety policies for production workloads',
                        'Use token-based rate limiting for cost control',
                        'Implement PII detection for compliance',
                        'Monitor token consumption and costs regularly',
                        'Use prompt templates for consistency',
                        'Enable audit logging for security and compliance',
                        'Configure multi-model routing for high availability',
                        'Set up budget alerts and automatic throttling'
                    ],
                    limitations: [
                        'AI Gateway features are only available in Premium v2 tier',
                        'Semantic caching requires embedding model configuration',
                        'Some features may be in preview',
                        'Cost optimization depends on cache hit rates',
                        'MCP support requires MCP-compliant clients'
                    ]
                }
            },
            networking: {
                vnetIntegration: true,
                privateEndpoints: true,
                publicEndpoint: true,
                hybridConnections: true,
                vnetInjection: true,
                privateLink: true
            },
            scaling: {
                type: 'manual',
                minInstances: 1,
                maxInstances: null,
                scaleOutUnits: null,
                autoScale: false
            },
            regions: ['Selected Azure regions'],
            documentationLinks: [
                { title: 'API Management v2', url: 'https://learn.microsoft.com/azure/api-management/api-management-v2' },
                { title: 'AI Gateway', url: 'https://learn.microsoft.com/azure/api-management/api-management-ai-gateway' },
                { title: 'MCP Support in v2', url: 'https://techcommunity.microsoft.com/blog/integrationsonazureblog/%F0%9F%9A%80-new-in-azure-api-management-mcp-in-v2-skus--external-mcp-compliant-server-sup/4440294' },
                { title: 'API Management Pricing', url: 'https://azure.microsoft.com/pricing/details/api-management/' }
            ],
            isPreview: true,
            isRecommended: true,
            isProductionReady: false
        }
    ];

    console.log(`  ✓ Found ${offerings.length} API Management SKUs`);
    return offerings;
}
