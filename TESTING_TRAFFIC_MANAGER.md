# Testing Traffic Manager Implementation

## Step 1: Migrate Updated Data to Database

The seed data JSON has been updated with Traffic Manager configSchema. Migrate it to the database:

```bash
npm run migrate
```

This loads the updated recipes (including Traffic Manager configSchema) into the SQLite database.

## Step 2: Start the Server

```bash
npm start
```

Open http://localhost:3030 in your browser.

## Step 3: Verify configSchema in UI

1. Navigate to any APIM recipe (e.g., navigate through: Root → API Management → choose any APIM recipe)
2. Once at the recipe page, scroll to the "Configuration Options" section
3. Verify you see three Traffic Manager options:
   - **Enable Traffic Manager** (boolean, default: false)
   - **Traffic Manager Routing Method** (string, default: Performance, options: Performance, Priority, Weighted, Geographic, Subnet, MultiValue)
   - **Monitor Protocol** (string, default: HTTP, options: HTTP, HTTPS, TCP)

### Test on Multiple Recipes

Test these APIM recipes to ensure configSchema appears in all:
- `apim-ai-gateway-recipe`
- `apim-mcp-recipe`
- `apim-classic-recipe`
- `apim-v2-recipe`
- `apim-consumption-recipe`
- `apim-developer-recipe`
- `apim-basic-recipe`
- `apim-standard-recipe`
- `apim-premium-recipe`

## Step 4: Test Dynamic Step Addition

### Option A: Via URL Parameters (Manual Testing)

Since the UI doesn't yet have a form to submit configSchema values, you can test via query parameters:

1. Navigate to an APIM recipe URL with parameters:
   ```
   http://localhost:3030/?node=apim-ai-gateway-recipe&parameters={"trafficManagerEnabled":true,"trafficManagerRoutingMethod":"Performance"}
   ```

2. Check the recipe steps - you should see a new step like:
   - **"Configure Traffic Manager (Performance Routing)"**
   - Description should mention the routing method

### Option B: Direct API Test

Test the recipe endpoint directly:

```bash
# Test without Traffic Manager (should have normal steps)
curl "http://localhost:3030/api/recipes/apim-ai-gateway-recipe"

# Test with Traffic Manager enabled (need to modify wizard.js to pass parameters)
# This requires updating the UI to pass parameters from configSchema form
```

### Option C: Database Query Test

Query the database directly to verify configSchema was added:

```bash
# Using sqlite3 command line (if installed)
sqlite3 data/wizard.db "SELECT nodeId, json_extract(configSchema, '$.trafficManagerEnabled') FROM recipes WHERE nodeId LIKE 'apim-%recipe'"
```

## Step 5: Test Bicep Generation

The Bicep generation requires parameters to be passed. To test:

1. You'll need to modify the UI to capture configSchema values and pass them as parameters
2. Or test directly in code by calling the generator:

```javascript
// In browser console or Node.js test script
import { generateBicepTemplate } from './js/bicep-generator.js';

const recipe = {
  title: "API Management AI Gateway",
  configSchema: {
    trafficManagerEnabled: { default: true },
    trafficManagerRoutingMethod: { default: "Performance" },
    trafficManagerMonitorProtocol: { default: "HTTP" }
  },
  bicepOutline: { resources: ["Microsoft.ApiManagement/service"] }
};

const parameters = {
  trafficManagerEnabled: true,
  trafficManagerRoutingMethod: "Performance",
  trafficManagerMonitorProtocol: "HTTP",
  apimServiceName: "my-apim-service"
};

const bicep = generateBicepTemplate(recipe, [], parameters);
console.log(bicep.main); // Should include Traffic Manager resource
console.log(bicep.outputs); // Should include trafficManagerUrl output
```

### Verify Bicep Output Contains:

- `resource tmProfile 'Microsoft.Network/trafficManagerProfiles@2022-04-01'`
- `trafficRoutingMethod: 'Performance'` (or your selected method)
- `dnsConfig` with `relativeName`
- `monitorConfig` with protocol, port, path
- `endpoints` array with APIM service endpoint
- Output: `trafficManagerUrl` and `trafficManagerProfileName`

## Step 6: Test Diagram Generation

1. Navigate to an APIM recipe
2. Enable Traffic Manager (via parameters in URL or UI)
3. Check the Architecture Diagram section
4. Verify:
   - Traffic Manager appears in a "Global Load Balancing" subgraph
   - Shows routing method (e.g., "Performance Routing")
   - Client Applications connect to Traffic Manager
   - Traffic Manager connects to APIM

### Test Diagram Function Directly

```javascript
// In browser console
const recipe = {
  configSchema: {
    trafficManagerEnabled: { default: true },
    trafficManagerRoutingMethod: { default: "Performance" }
  }
};

// Import and test (requires module access)
// Should show Traffic Manager in diagram
```

## Step 7: Test Resource Tree

1. Navigate to an APIM recipe with Traffic Manager enabled
2. Check the Resource Tree section
3. Verify:
   - Traffic Manager Profile appears in the tree
   - Shows routing method property
   - Shows monitor protocol property
   - Has APIM Endpoint as a child node

## Step 8: Test Code Snippets

1. Navigate to an APIM recipe
2. Enable Traffic Manager (which adds the Traffic Manager step)
3. Expand the Traffic Manager step
4. Check the Code Snippets section
5. Verify all tabs have Traffic Manager code:
   - **Azure CLI**: `az network traffic-manager profile create`
   - **PowerShell**: `New-AzTrafficManagerProfile`
   - **Bicep**: `resource tmProfile 'Microsoft.Network/trafficManagerProfiles@2022-04-01'`
   - **REST API**: PUT request to Traffic Manager endpoint

## Step 9: Test Different Routing Methods

Test each routing method to ensure descriptions are correct:

1. Test with `trafficManagerRoutingMethod: "Priority"` - should mention failover
2. Test with `trafficManagerRoutingMethod: "Weighted"` - should mention weight distribution
3. Test with `trafficManagerRoutingMethod: "Geographic"` - should mention geographic routing
4. Test with `trafficManagerRoutingMethod: "Subnet"` - should mention IP subnet routing
5. Test with `trafficManagerRoutingMethod: "MultiValue"` - should mention multiple endpoints

## Step 10: Test Backward Compatibility

1. Navigate to APIM recipe **without** Traffic Manager parameters (or with `trafficManagerEnabled: false`)
2. Verify:
   - No Traffic Manager step appears
   - No Traffic Manager in diagrams
   - No Traffic Manager in resource tree
   - Recipe works normally (backward compatible)

## Quick Verification Checklist

- [ ] configSchema appears in UI for all 9 APIM recipes
- [ ] Traffic Manager step appears when `trafficManagerEnabled: true`
- [ ] Step includes correct routing method in title and description
- [ ] Bicep generation includes Traffic Manager resource
- [ ] Bicep outputs include `trafficManagerUrl`
- [ ] Architecture diagram shows Traffic Manager when enabled
- [ ] Resource tree includes Traffic Manager when enabled
- [ ] Code snippets generated for Traffic Manager step
- [ ] All routing methods work correctly
- [ ] Backward compatible (works when disabled)

## Troubleshooting

### configSchema Not Appearing

1. Check database was migrated: `npm run migrate`
2. Verify JSON syntax in seed-data.json is valid
3. Check browser console for errors

### Steps Not Appearing Dynamically

1. Check that parameters are being passed to `getRecipeForNode()`
2. Verify the recipe has `configSchema.trafficManagerEnabled` defined
3. Check server console for errors

### Bicep Generation Issues

1. Verify parameters object includes `trafficManagerEnabled: true`
2. Check that `recipe.configSchema` exists and has Traffic Manager fields
3. Verify Bicep syntax is valid (use `az bicep build` to validate)

## Next Steps for Full Integration

To fully integrate Traffic Manager configuration:

1. **Update UI** to capture configSchema values from the Configuration Options section
2. **Pass parameters** to recipe when navigating/rendering
3. **Update wizard.js route** to accept and pass parameters from query string
4. **Add form** in UI to enable/configure Traffic Manager before viewing recipe

The backend implementation is complete - it just needs UI integration to pass the configuration values.



