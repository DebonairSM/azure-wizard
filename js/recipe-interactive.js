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

    // Determine recipe type from nodeId or title
    const nodeId = recipe.nodeId || '';
    const title = (recipe.title || '').toLowerCase();
    const isApimRecipe = nodeId.includes('apim') || title.includes('api management');
    const isSqlRecipe = nodeId.includes('sql') || title.includes('sql');

    // API Management Premium v2 base cost (only for APIM recipes)
    if (isApimRecipe) {
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
    }
    // SQL Database costs (for SQL Server recipes)
    else if (isSqlRecipe) {
        const sqlServer = { min: 5, max: 30, name: 'SQL Server' };
        costs.monthly.breakdown.push(sqlServer);
        costs.monthly.min += sqlServer.min;
        costs.monthly.max += sqlServer.max;

        const sqlDatabase = { min: 5, max: 4000, name: 'Azure SQL Database' };
        costs.monthly.breakdown.push(sqlDatabase);
        costs.monthly.min += sqlDatabase.min;
        costs.monthly.max += sqlDatabase.max;
    }
    // Generic/default costs for other recipes
    else {
        // If no specific recipe type detected, don't add default costs
        // Recipes should define their own cost structure
        if (costs.monthly.breakdown.length === 0) {
            costs.monthly.min = 0;
            costs.monthly.max = 0;
        }
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
    // Determine recipe type from nodeId or title
    const nodeId = recipe.nodeId || '';
    const title = (recipe.title || '').toLowerCase();
    const isApimRecipe = nodeId.includes('apim') || title.includes('api management');
    const isSqlRecipe = nodeId.includes('sql') || title.includes('sql');

    const prerequisites = [
        {
            category: 'Azure Subscription',
            items: [
                'Active Azure subscription',
                'Contributor or Owner role on subscription'
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
                'Permission to create resource groups'
            ]
        }
    ];

    // Add recipe-specific prerequisites
    if (isApimRecipe) {
        prerequisites[0].items.push('API Management service quota available');
        prerequisites[2].items.push('Permission to create API Management services');
        
        if (selectedFeatures.some(f => f.includes('semantic-caching'))) {
            prerequisites[2].items.push('Permission to create Azure Cache for Redis');
        }
        
        if (selectedFeatures.some(f => f.includes('content-safety'))) {
            prerequisites[2].items.push('Permission to create Azure AI services');
        }
    } else if (isSqlRecipe) {
        prerequisites[0].items.push('SQL Database quota available');
        prerequisites[2].items.push('Permission to create SQL servers and databases');
    }

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
    // Determine recipe type from nodeId or title
    const nodeId = recipe.nodeId || '';
    const title = (recipe.title || '').toLowerCase();
    const isApimRecipe = nodeId.includes('apim') || title.includes('api management');
    const isSqlRecipe = nodeId.includes('sql') || title.includes('sql');

    const tips = [];

    // API Management specific tips
    if (isApimRecipe) {
        tips.push(
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
        );
    }
    // SQL Database specific tips
    else if (isSqlRecipe) {
        tips.push(
            {
                issue: 'SQL Database creation fails',
                solutions: [
                    'Verify you have sufficient quota for SQL Database in your subscription',
                    'Check that the server name is globally unique',
                    'Ensure you have Contributor or Owner permissions',
                    'Verify the selected service tier is available in your region'
                ]
            },
            {
                issue: 'Cannot connect to SQL Database',
                solutions: [
                    'Verify firewall rules allow your IP address or Azure services',
                    'Check that the server is running and accessible',
                    'Ensure connection string credentials are correct',
                    'Verify network security groups allow SQL port 1433'
                ]
            },
            {
                issue: 'Database performance issues',
                solutions: [
                    'Review database DTU/vCore usage in Azure Portal',
                    'Consider scaling up to a higher service tier',
                    'Check for long-running queries in Query Store',
                    'Review index usage and optimize queries'
                ]
            },
            {
                issue: 'Backup and restore issues',
                solutions: [
                    'Verify automated backup is enabled for your service tier',
                    'Check backup retention policy settings',
                    'Ensure sufficient storage quota for point-in-time restore',
                    'Verify restore permissions and point-in-time restore window'
                ]
            }
        );
    }
    // Generic tips for other recipes
    else {
        tips.push(
            {
                issue: 'Deployment fails',
                solutions: [
                    'Verify you have sufficient quota in your subscription',
                    'Check that resource names meet naming requirements',
                    'Ensure you have Contributor or Owner permissions',
                    'Try a different Azure region if quota is exhausted'
                ]
            },
            {
                issue: 'Cannot access deployed resources',
                solutions: [
                    'Verify network security groups and firewall rules',
                    'Check that resources are running and accessible',
                    'Ensure connection strings and credentials are correct',
                    'Review Azure service health status'
                ]
            }
        );
    }

    return tips;
}

