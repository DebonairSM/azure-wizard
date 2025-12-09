// Interactive recipe display components
// Provides expandable steps, code snippets, progress tracking, and visual components

/**
 * Generate code snippets for a recipe step
 * @param {Object} step - Recipe step
 * @param {Object} recipe - Full recipe object
 * @param {Array} selectedFeatures - Selected features
 * @returns {Object} Code snippets in different formats
 */
export function generateCodeSnippets(step, recipe, selectedFeatures = []) {
    const snippets = {
        azureCli: '',
        powershell: '',
        bicep: '',
        restApi: ''
    };

    // Step-specific code generation
    const stepNumber = step.number;
    const stepTitle = step.title?.toLowerCase() || '';

    // API Management creation
    if (stepTitle.includes('create api management') || stepNumber === 1) {
        snippets.azureCli = `# Create API Management instance
az apim create \\
  --resource-group myResourceGroup \\
  --name my-api-management \\
  --location eastus \\
  --sku-name PremiumV2 \\
  --publisher-email admin@example.com \\
  --publisher-name "My Organization"`;

        snippets.powershell = `# Create API Management instance
New-AzApiManagement \`
  -ResourceGroupName "myResourceGroup" \`
  -Name "my-api-management" \`
  -Location "eastus" \`
  -Sku "PremiumV2" \`
  -OrganizationName "My Organization" \`
  -AdminEmail "admin@example.com"`;

        snippets.bicep = `resource apimService 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: 'my-api-management'
  location: resourceGroup().location
  sku: {
    name: 'PremiumV2'
    capacity: 1
  }
  properties: {
    publisherName: 'My Organization'
    publisherEmail: 'admin@example.com'
  }
}`;
    }

    // Token limits policy
    if (stepTitle.includes('token limit') || stepNumber === 3) {
        snippets.azureCli = `# Configure token limit policy
az apim policy create \\
  --resource-group myResourceGroup \\
  --service-name my-api-management \\
  --api-id my-api \\
  --policy-format xml \\
  --policy-content '<policies>
  <inbound>
    <llm-token-limit tokens-per-minute="10000" />
  </inbound>
</policies>'`;

        snippets.bicep = `resource tokenLimitPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: apiResource
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
      <policies>
        <inbound>
          <llm-token-limit tokens-per-minute="10000" />
        </inbound>
      </policies>
    '''
  }
}`;
    }

    // Content Safety
    if (stepTitle.includes('content safety') || stepNumber === 4) {
        snippets.azureCli = `# Enable content safety
az apim policy create \\
  --resource-group myResourceGroup \\
  --service-name my-api-management \\
  --api-id my-api \\
  --policy-format xml \\
  --policy-content '<policies>
  <inbound>
    <llm-content-safety content-safety-resource-id="/subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.CognitiveServices/accounts/{account-name}" />
  </inbound>
</policies>'`;

        snippets.bicep = `resource contentSafetyPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: apiResource
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
      <policies>
        <inbound>
          <llm-content-safety content-safety-resource-id="/subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.CognitiveServices/accounts/{account-name}" />
        </inbound>
      </policies>
    '''
  }
}`;
    }

    // Semantic Caching
    if (stepTitle.includes('semantic caching') || stepNumber === 5) {
        snippets.azureCli = `# Set up semantic caching
az apim policy create \\
  --resource-group myResourceGroup \\
  --service-name my-api-management \\
  --api-id my-api \\
  --policy-format xml \\
  --policy-content '<policies>
  <inbound>
    <llm-semantic-cache-lookup cache-provider-id="redis-connection-string" similarity-threshold="0.8" />
  </inbound>
  <outbound>
    <llm-semantic-cache-store cache-provider-id="redis-connection-string" />
  </outbound>
</policies>'`;

        snippets.bicep = `resource semanticCachePolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: apiResource
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
      <policies>
        <inbound>
          <llm-semantic-cache-lookup cache-provider-id="redis-connection-string" similarity-threshold="0.8" />
        </inbound>
        <outbound>
          <llm-semantic-cache-store cache-provider-id="redis-connection-string" />
        </outbound>
      </policies>
    '''
  }
}`;
    }

    // LLM Metrics
    if (stepTitle.includes('llm metrics') || stepTitle.includes('metrics') || stepNumber === 6) {
        snippets.azureCli = `# Configure LLM metrics
az apim policy create \\
  --resource-group myResourceGroup \\
  --service-name my-api-management \\
  --api-id my-api \\
  --policy-format xml \\
  --policy-content '<policies>
  <inbound>
    <llm-emit-token-metric namespace="apim-llm" />
  </inbound>
</policies>'`;

        snippets.bicep = `resource llmMetricsPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: apiResource
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
      <policies>
        <inbound>
          <llm-emit-token-metric namespace="apim-llm" />
        </inbound>
      </policies>
    '''
  }
}`;
    }

    return snippets;
}

/**
 * Calculate estimated costs for recipe
 * @param {Object} recipe - Recipe object
 * @param {Array} selectedFeatures - Selected features
 * @returns {Object} Cost estimates
 */
export function calculateCosts(recipe, selectedFeatures = []) {
    const costs = {
        monthly: { min: 0, max: 0, breakdown: [] },
        oneTime: 0
    };

    // API Management Premium v2 base cost
    const apimBase = { min: 500, max: 2000, name: 'API Management Premium v2' };
    costs.monthly.breakdown.push(apimBase);
    costs.monthly.min += apimBase.min;
    costs.monthly.max += apimBase.max;

    // Azure Cache for Redis (if semantic caching selected)
    if (selectedFeatures.some(f => f.includes('semantic-caching'))) {
        const redis = { min: 15, max: 100, name: 'Azure Cache for Redis (Basic)' };
        costs.monthly.breakdown.push(redis);
        costs.monthly.min += redis.min;
        costs.monthly.max += redis.max;
    }

    // Azure AI Content Safety (if content safety selected)
    if (selectedFeatures.some(f => f.includes('content-safety'))) {
        const contentSafety = { min: 1, max: 50, name: 'Azure AI Content Safety' };
        costs.monthly.breakdown.push(contentSafety);
        costs.monthly.min += contentSafety.min;
        costs.monthly.max += contentSafety.max;
    }

    // Application Insights (if monitoring selected)
    if (selectedFeatures.some(f => f.includes('monitoring') || f.includes('metrics'))) {
        const insights = { min: 0, max: 20, name: 'Application Insights' };
        costs.monthly.breakdown.push(insights);
        costs.monthly.min += insights.min;
        costs.monthly.max += insights.max;
    }

    return costs;
}

/**
 * Calculate estimated deployment time
 * @param {Object} recipe - Recipe object
 * @param {Array} selectedFeatures - Selected features
 * @returns {Object} Time estimates
 */
export function calculateDeploymentTime(recipe, selectedFeatures = []) {
    const stepTimes = {
        1: { min: 10, max: 15, unit: 'minutes' }, // Create APIM
        2: { min: 5, max: 10, unit: 'minutes' },  // Import API
        3: { min: 5, max: 10, unit: 'minutes' },  // Token limits
        4: { min: 10, max: 20, unit: 'minutes' }, // Content safety
        5: { min: 15, max: 30, unit: 'minutes' }, // Semantic caching
        6: { min: 5, max: 10, unit: 'minutes' }, // Metrics
        7: { min: 10, max: 15, unit: 'minutes' }, // Real-time
        8: { min: 5, max: 10, unit: 'minutes' }   // Test
    };

    let totalMin = 0;
    let totalMax = 0;
    const stepBreakdown = [];

    if (recipe.steps && Array.isArray(recipe.steps)) {
        recipe.steps.forEach(step => {
            const stepNum = step.number;
            const time = stepTimes[stepNum] || { min: 5, max: 10, unit: 'minutes' };
            totalMin += time.min;
            totalMax += time.max;
            stepBreakdown.push({
                step: stepNum,
                title: step.title,
                min: time.min,
                max: time.max,
                unit: time.unit
            });
        });
    }

    return {
        total: { min: totalMin, max: totalMax, unit: 'minutes' },
        steps: stepBreakdown,
        quickSetup: totalMin,
        fullConfig: totalMax
    };
}

/**
 * Get prerequisites for recipe
 * @param {Object} recipe - Recipe object
 * @param {Array} selectedFeatures - Selected features
 * @returns {Array} Prerequisites list
 */
export function getPrerequisites(recipe, selectedFeatures = []) {
    const prerequisites = [
        {
            category: 'Azure Subscription',
            items: [
                'Active Azure subscription',
                'Contributor or Owner role on subscription',
                'API Management service quota available'
            ]
        },
        {
            category: 'Tools & CLI',
            items: [
                'Azure CLI (latest version)',
                'Azure PowerShell (optional)',
                'Bicep CLI (for Bicep deployment)'
            ]
        },
        {
            category: 'Permissions',
            items: [
                'Permission to create resource groups',
                'Permission to create API Management services',
                'Permission to create Azure Cache for Redis (if using semantic caching)',
                'Permission to create Azure AI services (if using content safety)'
            ]
        }
    ];

    if (selectedFeatures.some(f => f.includes('semantic-caching'))) {
        prerequisites.push({
            category: 'Semantic Caching',
            items: [
                'Azure Cache for Redis instance (or create new)',
                'Redis connection string'
            ]
        });
    }

    if (selectedFeatures.some(f => f.includes('content-safety'))) {
        prerequisites.push({
            category: 'Content Safety',
            items: [
                'Azure AI Content Safety resource',
                'Content Safety API key'
            ]
        });
    }

    return prerequisites;
}

/**
 * Get troubleshooting tips for recipe
 * @param {Object} recipe - Recipe object
 * @returns {Array} Troubleshooting tips
 */
export function getTroubleshootingTips(recipe) {
    return [
        {
            issue: 'API Management creation fails',
            solutions: [
                'Verify you have sufficient quota for API Management in your subscription',
                'Check that the service name is globally unique',
                'Ensure you have Contributor or Owner permissions',
                'Try a different Azure region if quota is exhausted'
            ]
        },
        {
            issue: 'Token limit policy not working',
            solutions: [
                'Verify the policy XML syntax is correct',
                'Check that the API is properly configured',
                'Ensure you are using Premium v2 tier (required for AI Gateway features)',
                'Review API Management logs for policy errors'
            ]
        },
        {
            issue: 'Content Safety integration fails',
            solutions: [
                'Verify Azure AI Content Safety resource exists and is accessible',
                'Check the resource ID format in the policy',
                'Ensure managed identity or API key is properly configured',
                'Verify Content Safety service is available in your region'
            ]
        },
        {
            issue: 'Semantic caching not working',
            solutions: [
                'Verify Redis connection string is correct',
                'Check Redis instance is running and accessible',
                'Ensure similarity threshold is between 0.0 and 1.0',
                'Verify embeddings API is configured correctly'
            ]
        },
        {
            issue: 'Deployment takes too long',
            solutions: [
                'API Management creation can take 30-60 minutes',
                'Check Azure service health status',
                'Verify network connectivity to Azure',
                'Consider using Azure Resource Manager templates for faster deployment'
            ]
        }
    ];
}

