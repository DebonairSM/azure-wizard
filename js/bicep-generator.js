// Bicep template generation from recipe and selected features
// Generates Infrastructure as Code templates for Azure deployments

import { getPrerequisites, calculateDeploymentTime, calculateCosts } from './recipe-interactive.js';

/**
 * Generate Bicep template for recipe
 * @param {Object} recipe - Recipe object
 * @param {Array} selectedFeatures - Selected features
 * @param {Object} parameters - Custom parameters
 * @returns {Object} Bicep files (main, parameters, etc.)
 */
export function generateBicepTemplate(recipe, selectedFeatures = [], parameters = {}) {
    const mainBicep = generateMainBicep(recipe, selectedFeatures, parameters);
    const parametersBicep = generateParametersBicep(recipe, selectedFeatures, parameters);
    const outputsBicep = generateOutputsBicep(recipe, selectedFeatures);

    return {
        main: mainBicep,
        parameters: parametersBicep,
        outputs: outputsBicep
    };
}

/**
 * Generate main Bicep file
 */
function generateMainBicep(recipe, selectedFeatures, parameters) {
    let bicep = `@description('Bicep template for ${recipe.title || 'Azure deployment'}')
@allowed([
  'PremiumV2'
])
@description('API Management SKU')
param apimSku string = 'PremiumV2'

@description('API Management service name')
param apimServiceName string

@description('Resource group location')
param location string = resourceGroup().location

@description('Publisher name')
param publisherName string = 'My Organization'

@description('Publisher email')
param publisherEmail string = 'admin@example.com'

// Variables
var apimServiceId = resourceId('Microsoft.ApiManagement/service', apimServiceName)

// API Management Service
resource apimService 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: apimServiceName
  location: location
  sku: {
    name: apimSku
    capacity: 1
  }
  properties: {
    publisherName: publisherName
    publisherEmail: publisherEmail
  }
  tags: {
    environment: 'production'
    managedBy: 'azure-wizard'
  }
}

// API
resource apiResource 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apimService
  name: 'llm-gateway-api'
  properties: {
    displayName: 'LLM Gateway API'
    serviceUrl: 'https://api.openai.com/v1'
    path: 'llm'
    protocols: [
      'https'
    ]
  }
}

`;

    // Add policies based on selected features
    if (selectedFeatures.some(f => f.includes('token-limits'))) {
        bicep += generateTokenLimitPolicy(parameters);
    }

    if (selectedFeatures.some(f => f.includes('content-safety'))) {
        bicep += generateContentSafetyPolicy(parameters);
    }

    if (selectedFeatures.some(f => f.includes('semantic-caching'))) {
        bicep += generateSemanticCachePolicy(parameters);
    }

    if (selectedFeatures.some(f => f.includes('rate-limiting'))) {
        bicep += generateRateLimitPolicy(parameters);
    }

    // Azure Cache for Redis (if semantic caching selected)
    if (selectedFeatures.some(f => f.includes('semantic-caching'))) {
        bicep += generateRedisCache(parameters);
    }

    // Azure AI Content Safety (if content safety selected)
    if (selectedFeatures.some(f => f.includes('content-safety'))) {
        bicep += generateContentSafetyResource(parameters);
    }

    // Application Insights (if monitoring selected)
    if (selectedFeatures.some(f => f.includes('monitoring') || f.includes('metrics'))) {
        bicep += generateApplicationInsights(parameters);
    }

    return bicep;
}

/**
 * Generate token limit policy
 */
function generateTokenLimitPolicy(parameters) {
    const tokensPerMinute = parameters.tokensPerMinute || 10000;
    return `
// Token Limit Policy
resource tokenLimitPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: apiResource
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
      <policies>
        <inbound>
          <llm-token-limit tokens-per-minute="${tokensPerMinute}" />
        </inbound>
        <backend>
          <forward-request />
        </backend>
        <outbound />
        <on-error />
      </policies>
    '''
  }
}
`;
}

/**
 * Generate content safety policy
 */
function generateContentSafetyPolicy(parameters) {
    const contentSafetyResourceId = parameters.contentSafetyResourceId || '/subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.CognitiveServices/accounts/{account-name}';
    return `
// Content Safety Policy
resource contentSafetyPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: apiResource
  name: 'content-safety-policy'
  properties: {
    format: 'xml'
    value: '''
      <policies>
        <inbound>
          <llm-content-safety content-safety-resource-id="${contentSafetyResourceId}" />
        </inbound>
        <backend>
          <forward-request />
        </backend>
        <outbound />
        <on-error />
      </policies>
    '''
  }
}
`;
}

/**
 * Generate semantic cache policy
 */
function generateSemanticCachePolicy(parameters) {
    const similarityThreshold = parameters.similarityThreshold || 0.8;
    const redisConnectionString = parameters.redisConnectionString || 'redis-connection-string';
    return `
// Semantic Cache Policy
resource semanticCachePolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: apiResource
  name: 'semantic-cache-policy'
  properties: {
    format: 'xml'
    value: '''
      <policies>
        <inbound>
          <llm-semantic-cache-lookup cache-provider-id="${redisConnectionString}" similarity-threshold="${similarityThreshold}" />
        </inbound>
        <backend>
          <forward-request />
        </backend>
        <outbound>
          <llm-semantic-cache-store cache-provider-id="${redisConnectionString}" />
        </outbound>
        <on-error />
      </policies>
    '''
  }
}
`;
}

/**
 * Generate rate limit policy
 */
function generateRateLimitPolicy(parameters) {
    const callsPerSecond = parameters.callsPerSecond || 100;
    return `
// Rate Limit Policy
resource rateLimitPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: apiResource
  name: 'rate-limit-policy'
  properties: {
    format: 'xml'
    value: '''
      <policies>
        <inbound>
          <rate-limit calls="${callsPerSecond}" renewal-period="1" />
        </inbound>
        <backend>
          <forward-request />
        </backend>
        <outbound />
        <on-error />
      </policies>
    '''
  }
}
`;
}

/**
 * Generate Redis Cache resource
 */
function generateRedisCache(parameters) {
    const redisName = parameters.redisName || 'llm-cache-redis';
    return `
// Azure Cache for Redis
resource redisCache 'Microsoft.Cache/redis@2023-04-01' = {
  name: redisName
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
  }
  tags: {
    environment: 'production'
    managedBy: 'azure-wizard'
  }
}

// Output Redis connection string
output redisConnectionString string = '${redisCache.properties.hostName}:${redisCache.properties.sslPort},ssl=true,password=${redisCache.listKeys().primaryKey}'
`;
}

/**
 * Generate Content Safety resource
 */
function generateContentSafetyResource(parameters) {
    const contentSafetyName = parameters.contentSafetyName || 'llm-content-safety';
    return `
// Azure AI Content Safety
resource contentSafety 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: contentSafetyName
  location: location
  kind: 'ContentSafety'
  sku: {
    name: 'S0'
  }
  properties: {
    apiProperties: {
      statisticsEnabled: true
    }
  }
  tags: {
    environment: 'production'
    managedBy: 'azure-wizard'
  }
}

// Output Content Safety resource ID
output contentSafetyResourceId string = contentSafety.id
`;
}

/**
 * Generate Application Insights
 */
function generateApplicationInsights(parameters) {
    const insightsName = parameters.insightsName || 'llm-gateway-insights';
    return `
// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: insightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'rest'
  }
  tags: {
    environment: 'production'
    managedBy: 'azure-wizard'
  }
}

// Output Application Insights instrumentation key
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
`;
}

/**
 * Generate parameters file
 */
function generateParametersBicep(recipe, selectedFeatures, parameters) {
    return `@description('Parameters for ${recipe.title || 'Azure deployment'}')

param apimServiceName = {
  value: 'my-api-management-${Date.now()}'
}

param publisherName = {
  value: 'My Organization'
}

param publisherEmail = {
  value: 'admin@example.com'
}

param location = {
  value: 'eastus'
}

`;
}

/**
 * Generate outputs
 */
function generateOutputsBicep(recipe, selectedFeatures) {
    let outputs = `
// Outputs
output apimServiceUrl string = 'https://${apimServiceName}.azure-api.net'
output apimServiceId string = apimService.id
output apiUrl string = 'https://${apimServiceName}.azure-api.net/llm'
`;

    if (selectedFeatures.some(f => f.includes('semantic-caching'))) {
        outputs += `output redisConnectionString string = redisConnectionString
`;
    }

    if (selectedFeatures.some(f => f.includes('content-safety'))) {
        outputs += `output contentSafetyResourceId string = contentSafetyResourceId
`;
    }

    if (selectedFeatures.some(f => f.includes('monitoring') || f.includes('metrics'))) {
        outputs += `output appInsightsInstrumentationKey string = appInsightsInstrumentationKey
`;
    }

    return outputs;
}

/**
 * Generate deployment script (Azure CLI)
 */
export function generateDeploymentScript(recipe, selectedFeatures, parameters) {
    return `#!/bin/bash
# Deployment script for ${recipe.title || 'Azure deployment'}
# Generated by Azure Wizard

set -e

RESOURCE_GROUP="myResourceGroup"
LOCATION="eastus"
APIM_SERVICE_NAME="my-api-management-${Date.now()}"

echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "Deploying Bicep template..."
az deployment group create \\
  --resource-group $RESOURCE_GROUP \\
  --template-file main.bicep \\
  --parameters @parameters.bicep \\
  --parameters apimServiceName=$APIM_SERVICE_NAME

echo "Deployment complete!"
echo "API Management URL: https://$APIM_SERVICE_NAME.azure-api.net"
`;
}

/**
 * Generate deployment script (PowerShell)
 */
export function generateDeploymentScriptPowerShell(recipe, selectedFeatures, parameters) {
    return `# Deployment script for ${recipe.title || 'Azure deployment'}
# Generated by Azure Wizard

$ErrorActionPreference = "Stop"

$ResourceGroup = "myResourceGroup"
$Location = "eastus"
$ApimServiceName = "my-api-management-$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "Creating resource group..."
New-AzResourceGroup -Name $ResourceGroup -Location $Location

Write-Host "Deploying Bicep template..."
New-AzResourceGroupDeployment \`
  -ResourceGroupName $ResourceGroup \`
  -TemplateFile "main.bicep" \`
  -TemplateParameterFile "parameters.bicep" \`
  -apimServiceName $ApimServiceName

Write-Host "Deployment complete!"
Write-Host "API Management URL: https://$ApimServiceName.azure-api.net"
`;
}

/**
 * Generate README
 */
export async function generateReadme(recipe, selectedFeatures, parameters) {
    // Import helper functions dynamically
    const { getPrerequisites, calculateDeploymentTime, calculateCosts } = await import('./recipe-interactive.js');
    
    const prerequisites = getPrerequisites(recipe, selectedFeatures);
    const time = calculateDeploymentTime(recipe, selectedFeatures);
    const costs = calculateCosts(recipe, selectedFeatures);

    return `# ${recipe.title || 'Azure Deployment'}

This deployment was generated by Azure Wizard.

## Overview

${recipe.description || 'Deploy Azure resources using Infrastructure as Code.'}

## Prerequisites

${prerequisites.map(cat => `### ${cat.category}\n${cat.items.map(item => `- ${item}`).join('\n')}`).join('\n\n')}

## Deployment

### Option 1: Azure CLI

\`\`\`bash
chmod +x deploy.sh
./deploy.sh
\`\`\`

### Option 2: PowerShell

\`\`\`powershell
.\\deploy.ps1
\`\`\`

### Option 3: Manual Deployment

\`\`\`bash
az deployment group create \\
  --resource-group myResourceGroup \\
  --template-file main.bicep \\
  --parameters @parameters.bicep
\`\`\`

## Estimated Deployment Time

- Quick setup: ${time.quickSetup} ${time.total.unit}
- Full configuration: ${time.fullConfig} ${time.total.unit}

## Estimated Costs

Monthly costs: $${costs.monthly.min} - $${costs.monthly.max}

${costs.monthly.breakdown.map(item => `- ${item.name}: $${item.min} - $${item.max}`).join('\n')}

## Selected Features

${selectedFeatures.map(f => `- ${f}`).join('\n')}

## Post-Deployment

1. Configure API endpoints
2. Set up authentication
3. Test API calls
4. Monitor usage and costs

## Troubleshooting

See the troubleshooting section in the wizard for common issues and solutions.

## Support

For more information, visit the Azure Wizard.
`;
}

