// Architecture diagram generation using Mermaid
// Generates visual diagrams showing resource relationships and data flow

/**
 * Generate Mermaid diagram for recipe architecture
 * @param {Object} recipe - Recipe object
 * @param {Array} selectedFeatures - Selected features
 * @returns {string} Mermaid diagram syntax
 */
export function generateArchitectureDiagram(recipe, selectedFeatures = []) {
    const hasSemanticCache = selectedFeatures.some(f => f.includes('semantic-caching'));
    const hasContentSafety = selectedFeatures.some(f => f.includes('content-safety'));
    const hasRealTime = selectedFeatures.some(f => f.includes('realtime'));
    const hasMCP = selectedFeatures.some(f => f.includes('mcp'));

    let diagram = 'graph TB\n';
    diagram += '    subgraph "Azure API Management"\n';
    diagram += '        APIM[API Management<br/>Premium v2]\n';
    diagram += '        API[LLM API]\n';
    diagram += '        POLICIES[AI Gateway Policies]\n';
    diagram += '    end\n\n';

    diagram += '    subgraph "LLM Providers"\n';
    if (selectedFeatures.some(f => f.includes('azure-openai'))) {
        diagram += '        AOAI[Azure OpenAI]\n';
    }
    if (selectedFeatures.some(f => f.includes('openai') && !f.includes('azure-openai'))) {
        diagram += '        OAI[OpenAI API]\n';
    }
    if (selectedFeatures.some(f => f.includes('microsoft-foundry'))) {
        diagram += '        FOUNDRY[Microsoft Foundry]\n';
    }
    if (selectedFeatures.some(f => f.includes('custom-llm'))) {
        diagram += '        CUSTOM[Custom LLM]\n';
    }
    if (selectedFeatures.some(f => f.includes('self-hosted'))) {
        diagram += '        SELF[Self-hosted Models]\n';
    }
    diagram += '    end\n\n';

    if (hasSemanticCache) {
        diagram += '    subgraph "Caching"\n';
        diagram += '        REDIS[Azure Cache<br/>for Redis]\n';
        diagram += '    end\n\n';
    }

    if (hasContentSafety) {
        diagram += '    subgraph "Content Safety"\n';
        diagram += '        CS[Azure AI<br/>Content Safety]\n';
        diagram += '    end\n\n';
    }

    diagram += '    subgraph "Monitoring"\n';
    diagram += '        MONITOR[Azure Monitor]\n';
    diagram += '        INSIGHTS[Application Insights]\n';
    diagram += '    end\n\n';

    // Connections
    diagram += '    CLIENT[Client Applications] -->|HTTPS/WebSocket| APIM\n';
    diagram += '    APIM --> API\n';
    diagram += '    API --> POLICIES\n';
    
    if (selectedFeatures.some(f => f.includes('azure-openai'))) {
        diagram += '    POLICIES -->|Token Limits| AOAI\n';
    }
    if (selectedFeatures.some(f => f.includes('openai') && !f.includes('azure-openai'))) {
        diagram += '    POLICIES -->|Token Limits| OAI\n';
    }
    if (selectedFeatures.some(f => f.includes('microsoft-foundry'))) {
        diagram += '    POLICIES --> FOUNDRY\n';
    }
    if (selectedFeatures.some(f => f.includes('custom-llm'))) {
        diagram += '    POLICIES --> CUSTOM\n';
    }
    if (selectedFeatures.some(f => f.includes('self-hosted'))) {
        diagram += '    POLICIES --> SELF\n';
    }

    if (hasSemanticCache) {
        diagram += '    POLICIES <-->|Cache Lookup/Store| REDIS\n';
    }

    if (hasContentSafety) {
        diagram += '    POLICIES -->|Content Analysis| CS\n';
        diagram += '    CS -->|Moderation Result| POLICIES\n';
    }

    diagram += '    APIM -->|Metrics & Logs| MONITOR\n';
    diagram += '    APIM -->|Telemetry| INSIGHTS\n';

    if (hasMCP) {
        diagram += '    subgraph "MCP Integration"\n';
        diagram += '        MCP[MCP Server]\n';
        diagram += '        AGENTS[AI Agents]\n';
        diagram += '    end\n';
        diagram += '    APIM -->|Expose as Tools| MCP\n';
        diagram += '    AGENTS -->|Tool Invocation| MCP\n';
    }

    // Styling
    diagram += '\n    classDef apim fill:#0078d4,stroke:#005a9e,stroke-width:2px,color:#fff\n';
    diagram += '    classDef llm fill:#107c10,stroke:#0e6b0e,stroke-width:2px,color:#fff\n';
    diagram += '    classDef cache fill:#ff8c00,stroke:#cc7000,stroke-width:2px,color:#fff\n';
    diagram += '    classDef monitor fill:#5c2d91,stroke:#4a2473,stroke-width:2px,color:#fff\n';
    diagram += '\n';
    diagram += '    class APIM,API,POLICIES apim\n';
    if (selectedFeatures.some(f => f.includes('azure-openai'))) {
        diagram += '    class AOAI llm\n';
    }
    if (selectedFeatures.some(f => f.includes('openai') && !f.includes('azure-openai'))) {
        diagram += '    class OAI llm\n';
    }
    if (hasSemanticCache) {
        diagram += '    class REDIS cache\n';
    }
    diagram += '    class MONITOR,INSIGHTS monitor\n';

    return diagram;
}

/**
 * Generate resource tree structure
 * @param {Object} recipe - Recipe object
 * @param {Array} selectedFeatures - Selected features
 * @returns {Array} Resource tree nodes
 */
export function generateResourceTree(recipe, selectedFeatures = []) {
    const resources = [];

    // Resource Group
    const resourceGroup = {
        id: 'rg',
        name: 'Resource Group',
        type: 'Microsoft.Resources/resourceGroups',
        children: []
    };

    // API Management
    const apim = {
        id: 'apim',
        name: 'API Management',
        type: 'Microsoft.ApiManagement/service',
        sku: 'PremiumV2',
        properties: {
            publisherName: 'Your Organization',
            publisherEmail: 'admin@example.com'
        },
        children: []
    };

    // API
    const api = {
        id: 'api',
        name: 'LLM API',
        type: 'Microsoft.ApiManagement/service/apis',
        properties: {
            displayName: 'LLM Gateway API',
            serviceUrl: 'https://api.openai.com/v1'
        },
        children: []
    };

    // Policies
    const policies = {
        id: 'policies',
        name: 'AI Gateway Policies',
        type: 'Microsoft.ApiManagement/service/apis/policies',
        children: []
    };

    if (selectedFeatures.some(f => f.includes('token-limits'))) {
        policies.children.push({
            id: 'token-limit-policy',
            name: 'Token Limit Policy',
            type: 'llm-token-limit',
            properties: { tokensPerMinute: 10000 }
        });
    }

    if (selectedFeatures.some(f => f.includes('content-safety'))) {
        policies.children.push({
            id: 'content-safety-policy',
            name: 'Content Safety Policy',
            type: 'llm-content-safety',
            properties: { contentSafetyResourceId: '/subscriptions/.../providers/...' }
        });
    }

    if (selectedFeatures.some(f => f.includes('semantic-caching'))) {
        policies.children.push({
            id: 'semantic-cache-policy',
            name: 'Semantic Cache Policy',
            type: 'llm-semantic-cache',
            properties: { similarityThreshold: 0.8 }
        });
    }

    if (selectedFeatures.some(f => f.includes('rate-limiting'))) {
        policies.children.push({
            id: 'rate-limit-policy',
            name: 'Rate Limit Policy',
            type: 'rate-limit',
            properties: { callsPerSecond: 100 }
        });
    }

    api.children.push(policies);
    apim.children.push(api);
    resourceGroup.children.push(apim);

    // Azure Cache for Redis
    if (selectedFeatures.some(f => f.includes('semantic-caching'))) {
        resourceGroup.children.push({
            id: 'redis',
            name: 'Azure Cache for Redis',
            type: 'Microsoft.Cache/redis',
            sku: 'Basic',
            properties: {
                capacity: 0,
                family: 'C',
                size: 'C0'
            },
            children: []
        });
    }

    // Azure AI Content Safety
    if (selectedFeatures.some(f => f.includes('content-safety'))) {
        resourceGroup.children.push({
            id: 'content-safety',
            name: 'Azure AI Content Safety',
            type: 'Microsoft.CognitiveServices/accounts',
            kind: 'ContentSafety',
            sku: 'S0',
            children: []
        });
    }

    // Application Insights
    if (selectedFeatures.some(f => f.includes('monitoring') || f.includes('metrics'))) {
        resourceGroup.children.push({
            id: 'insights',
            name: 'Application Insights',
            type: 'Microsoft.Insights/components',
            kind: 'web',
            children: []
        });
    }

    resources.push(resourceGroup);
    return resources;
}

