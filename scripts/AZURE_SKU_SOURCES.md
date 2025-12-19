# Azure SKU Information Sources

This document outlines where Azure service SKU (Stock Keeping Unit) information can be found for populating the Azure Wizard database.

## Primary Sources

### 1. Azure REST APIs

**Resource Provider SKU API**
- Endpoint: `GET /subscriptions/{subscriptionId}/providers/Microsoft.{Provider}/skus`
- Example: `GET /subscriptions/{subscriptionId}/providers/Microsoft.ApiManagement/skus`
- Documentation: https://learn.microsoft.com/rest/api/azure/
- Provides: Available SKUs, capabilities, restrictions, locations

**Resource SKU API**
- Endpoint: `GET /subscriptions/{subscriptionId}/providers/Microsoft.Compute/skus`
- Documentation: https://learn.microsoft.com/rest/api/compute/resource-skus/list
- Provides: VM sizes, capabilities, availability by region

### 2. Azure Pricing Pages

**Official Pricing Documentation**
- Base URL: `https://azure.microsoft.com/pricing/details/{service-name}/`
- Example: https://azure.microsoft.com/pricing/details/api-management/
- Provides: Pricing tiers, features, limits, use cases
- Updated: Regularly updated with current pricing and features

**Pricing Calculator**
- URL: https://azure.microsoft.com/pricing/calculator/
- Provides: Interactive pricing with SKU details

### 3. Azure Documentation

**Service-Specific Documentation**
- Base URL: `https://learn.microsoft.com/azure/{service-name}/`
- Example: https://learn.microsoft.com/azure/api-management/api-management-tiers
- Provides: SKU comparisons, features, capabilities, limitations
- Sections: "Pricing tiers", "Service tiers", "SKU comparison"

**Azure Service Overview Pages**
- Often include SKU comparison tables
- Feature matrices
- Use case recommendations

### 4. Azure CLI

**List Available SKUs**
```bash
az apim list-skus
az vm list-sizes --location eastus
az sql db list-editions --location eastus
```

**Get Resource Provider Information**
```bash
az provider show --namespace Microsoft.ApiManagement
az provider list --query "[].namespace"
```

### 5. Azure PowerShell

**Get SKU Information**
```powershell
Get-AzApiManagementSku
Get-AzComputeResourceSku -Location "eastus"
Get-AzSqlServerServiceObjective
```

### 6. Azure Resource Manager Templates

**Template Reference**
- URL: https://learn.microsoft.com/azure/templates/
- Provides: SKU definitions in ARM/Bicep format
- Example: https://learn.microsoft.com/azure/templates/microsoft.apimanagement/service

### 7. Azure Portal

**Service Creation UI**
- When creating resources, the portal shows available SKUs
- Feature comparisons
- Pricing information

## Data Structure for SKU Information

When fetching SKU information, collect the following:

### Core Information
- **SKU Name**: e.g., "Consumption", "Standard", "Premium"
- **SKU Tier**: Service tier level
- **Version**: Service version (v1, v2, etc.)
- **Category**: Classification (serverless, dedicated, premium, etc.)

### Pricing
- **Pricing Model**: pay-per-use, fixed-monthly, per-unit, etc.
- **Pricing Details**: Free tier, billing units, cost structure
- **SLA**: Service level agreement percentage

### Features
- **Features**: List of included features
- **Capabilities**: What the SKU can do
- **Limitations**: Restrictions and limits
- **Use Cases**: Recommended scenarios

### Technical Details
- **Attributes**: Technical specifications (VNET support, scaling, etc.)
- **Networking**: Network capabilities
- **Scaling**: Scaling options and limits
- **Regions**: Regional availability

### Metadata
- **Documentation Links**: Official documentation
- **Preview Status**: Is it in preview?
- **Production Ready**: Is it production-ready?
- **Recommended**: Is it recommended for common use cases?

## Implementation Pattern

The `azure-sku-fetchers.js` file follows this pattern:

1. **Service-Specific Fetcher Function**: `fetch{Service}Skus(options)`
2. **Structured Data**: Returns array of offering objects
3. **Consistent Schema**: All offerings follow the same structure
4. **Documentation Links**: Include references to official sources

## Example: API Management

For API Management, information was gathered from:

1. **Azure Documentation**: https://learn.microsoft.com/azure/api-management/api-management-tiers
2. **Pricing Page**: https://azure.microsoft.com/pricing/details/api-management/
3. **REST API**: Microsoft.ApiManagement resource provider
4. **Service-Specific Docs**: v2 architecture, AI Gateway, MCP support

## Automation Opportunities

### REST API Integration
- Query Azure REST APIs programmatically
- Parse SKU responses
- Update database automatically

### Documentation Scraping
- Parse Azure documentation pages
- Extract SKU comparison tables
- Extract feature matrices

### Pricing Page Parsing
- Extract pricing information
- Parse tier comparisons
- Update pricing data

## Best Practices

1. **Verify Multiple Sources**: Cross-reference information from multiple sources
2. **Document Sources**: Include documentation links in SKU data
3. **Regular Updates**: Azure services evolve; update SKU data regularly
4. **Version Tracking**: Track when SKU information was last updated
5. **Preview Handling**: Clearly mark preview SKUs and features
6. **Regional Variations**: Note regional availability differences

## Next Steps

To add SKU information for other Azure services:

1. Identify the service's resource provider namespace
2. Check Azure documentation for SKU/tier information
3. Review pricing pages for feature comparisons
4. Query REST APIs if available
5. Create fetcher function following the established pattern
6. Add to discovery script
7. Test and validate

## Resources

- Azure REST API Reference: https://learn.microsoft.com/rest/api/azure/
- Azure Pricing: https://azure.microsoft.com/pricing/
- Azure Documentation: https://learn.microsoft.com/azure/
- Azure CLI Reference: https://learn.microsoft.com/cli/azure/
- Azure PowerShell Reference: https://learn.microsoft.com/powershell/azure/














