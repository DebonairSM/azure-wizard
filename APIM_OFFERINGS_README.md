# APIM Offerings Database

This document describes the detailed APIM (Azure API Management) offerings information that has been added to the database.

## Overview

The APIM offerings table stores detailed information about all available Azure API Management SKU tiers, their features, capabilities, limitations, and use cases. This goes beyond the basic component information and provides comprehensive details for decision-making.

## Database Schema

The `apimOfferings` table includes:

- **Basic Information**: SKU name, tier, version (v1/v2), category
- **Descriptions**: Purpose, description, use cases
- **Pricing**: Pricing model, pricing information (JSON)
- **Features**: Features, capabilities, limitations (JSON arrays)
- **Technical Details**: SLA, max scale units, cache per unit
- **Feature Flags**: VNET support, multi-region, self-hosted gateway, developer portal, analytics, AI Gateway, MCP support, WebSocket support, production readiness
- **Documentation**: Links to official documentation (JSON array)

## Available Offerings

### v1 Tiers

1. **Consumption** - Serverless, pay-as-you-go
2. **Developer** - Non-production tier
3. **Basic** - Entry-level production
4. **Standard** - Business-critical with VNET
5. **Premium** - Enterprise-scale

### v2 Tiers (Preview)

6. **Basic v2** - Small teams, faster deployment
7. **Standard v2** - VNET integration, MCP support
8. **Premium v2** - Enterprise with AI Gateway, MCP, WebSocket

## API Endpoints

### Get All Offerings
```
GET /api/apim-offerings
```

Query parameters:
- `skuTier` - Filter by SKU tier (e.g., "Premium", "Consumption")
- `version` - Filter by version ("v1" or "v2")
- `category` - Filter by category ("consumption", "standard", "premium", "v2")
- `productionReady` - Filter by production readiness (true/false)
- `feature` - Filter by feature (vnet, multiRegion, selfHostedGateway, developerPortal, analytics, aiGateway, mcp, websocket)

### Get Specific Offering
```
GET /api/apim-offerings/:id
```

### Get Summary by Category
```
GET /api/apim-offerings/summary/categories
```

### Get Summary by Version
```
GET /api/apim-offerings/summary/versions
```

## Populating the Database

To populate the APIM offerings data:

```bash
npm run populate-apim
```

Or directly:
```bash
node scripts/populate-apim-offerings.js
```

## Data Categories

The offerings are categorized as:

- **consumption**: Pay-as-you-go model
- **standard**: Fixed pricing tiers (Developer, Basic, Standard)
- **premium**: Enterprise tiers (Premium)
- **v2**: v2 architecture tiers (Basic v2, Standard v2, Premium v2)

## Feature Comparison

Key features tracked:

- **VNET Support**: Virtual Network integration
- **Multi-Region**: Multi-region deployment support
- **Self-Hosted Gateway**: Hybrid/multi-cloud gateway support
- **Developer Portal**: Integrated developer portal
- **Analytics**: Built-in analytics
- **AI Gateway**: AI Gateway features (LLM policies, content safety, semantic caching)
- **MCP Support**: Model Context Protocol support for AI agents
- **WebSocket Support**: Real-time API support via WebSockets
- **Production Ready**: Suitable for production use

## Example Usage

### Get all production-ready offerings:
```javascript
fetch('/api/apim-offerings?productionReady=true')
  .then(r => r.json())
  .then(offerings => console.log(offerings));
```

### Get all v2 offerings with MCP support:
```javascript
fetch('/api/apim-offerings?version=v2&feature=mcp')
  .then(r => r.json())
  .then(offerings => console.log(offerings));
```

### Get Premium tier details:
```javascript
fetch('/api/apim-offerings/apim-premium')
  .then(r => r.json())
  .then(offering => console.log(offering));
```

## Data Structure

Each offering includes:

```json
{
  "id": "apim-premium",
  "skuName": "Premium",
  "skuTier": "Premium",
  "version": "v1",
  "category": "premium",
  "description": "...",
  "purpose": "...",
  "pricingModel": "per-unit",
  "pricingInfo": { ... },
  "sla": "99.95%",
  "features": [ ... ],
  "capabilities": [ ... ],
  "limitations": [ ... ],
  "useCases": [ ... ],
  "maxScaleUnits": 10,
  "cachePerUnit": "5 GB",
  "vnetSupport": true,
  "multiRegion": true,
  "selfHostedGateway": true,
  "developerPortal": true,
  "analytics": true,
  "aiGateway": false,
  "mcpSupport": false,
  "websocketSupport": false,
  "productionReady": true,
  "documentationLinks": [ ... ]
}
```




