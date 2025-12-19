#!/usr/bin/env node
/**
 * Migration Script: V1 Data to V2 Wizards
 *
 * Migrates Azure service data and APIM data from v1 sources to v2 database.
 *
 * IMPORTANT:
 * - This file is under `src/` so it is compiled into `dist/`.
 * - Wizards import it at runtime from `dist/scripts/migrate-v1-data.js`.
 */

import { getDatabase, closeDatabase } from '../database/db.js';
import { readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to v1 data sources (relative to v2 directory)
const V1_ROOT = join(__dirname, '..', '..', '..');
const V1_SKU_FETCHERS = join(V1_ROOT, 'scripts', 'azure-sku-fetchers.js');
const V1_APIM_POLICIES = join(V1_ROOT, 'data', 'apim-policies-seed.json');

interface V1Offering {
  id: string;
  skuName: string;
  skuTier: string;
  category?: string;
  description?: string;
  purpose?: string;
  pricingModel?: string;
  pricingInfo?: any;
  sla?: string;
  features?: string[];
  capabilities?: string[];
  limitations?: string[];
  useCases?: string[];
  attributes?: any;
  regions?: string[];
  documentationLinks?: Array<{ title: string; url: string }>;
  isPreview?: boolean;
  isRecommended?: boolean;
  isProductionReady?: boolean;
  serviceName?: string;
}

interface ApimPolicy {
  id: string;
  name: string;
  category: string;
  scope: string[];
  description?: string;
  parameters?: any;
  xmlTemplate?: any;
  documentation?: string;
  compatibility?: any;
  examples?: any[];
  relatedPolicies?: string[];
}

/**
 * Dynamically import v1 SKU fetchers
 * Note: v1 uses ESM exports but is consumed by v2's migration via createRequire for compatibility.
 */
async function getV1Fetchers() {
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const absolutePath = resolve(V1_SKU_FETCHERS);
    const module = require(absolutePath);

    return {
      fetchFunctionsSkus: module.fetchFunctionsSkus,
      fetchAppServiceSkus: module.fetchAppServiceSkus,
      fetchLogicAppsSkus: module.fetchLogicAppsSkus,
      fetchServiceBusSkus: module.fetchServiceBusSkus,
      fetchContainerAppsSkus: module.fetchContainerAppsSkus,
      fetchEventGridSkus: module.fetchEventGridSkus,
      fetchEventHubsSkus: module.fetchEventHubsSkus,
      fetchRelaySkus: module.fetchRelaySkus,
      fetchContainerInstancesSkus: module.fetchContainerInstancesSkus,
      fetchAKSSkus: module.fetchAKSSkus,
      fetchBatchSkus: module.fetchBatchSkus,
      fetchAPIMSkus: module.fetchAPIMSkus
    };
  } catch (error) {
    console.error('Error loading v1 SKU fetchers:', error);
    throw error;
  }
}

function getServiceDisplayName(serviceKey: string): string {
  const map: Record<string, string> = {
    Functions: 'Azure Functions',
    AppService: 'Azure App Service',
    LogicApps: 'Azure Logic Apps',
    ServiceBus: 'Azure Service Bus',
    ContainerApps: 'Azure Container Apps',
    ContainerInstances: 'Azure Container Instances',
    EventGrid: 'Azure Event Grid',
    EventHubs: 'Azure Event Hubs',
    Relay: 'Azure Relay',
    AKS: 'Azure Kubernetes Service (AKS)',
    Batch: 'Azure Batch'
  };
  return map[serviceKey] || serviceKey;
}

/**
 * Map v1 service key to v2 category (stable, not dependent on offering.serviceName)
 */
function mapServiceToCategory(serviceKey: string): string {
  const categoryMap: Record<string, string> = {
    Functions: 'Compute',
    AppService: 'Compute',
    ContainerApps: 'Compute',
    ContainerInstances: 'Compute',
    AKS: 'Compute',
    Batch: 'Compute',
    LogicApps: 'Integration',
    ServiceBus: 'Integration',
    EventGrid: 'Integration',
    EventHubs: 'Integration',
    Relay: 'Integration',
    'API Management': 'Integration'
  };

  return categoryMap[serviceKey] || 'Other';
}

/**
 * Migrate Azure services from v1 to v2
 */
async function migrateAzureServices() {
  console.log('\n=== Migrating Azure Services ===');

  const db = getDatabase();
  const fetchers = await getV1Fetchers();

  const services = [
    { key: 'Functions', fetcher: fetchers.fetchFunctionsSkus },
    { key: 'AppService', fetcher: fetchers.fetchAppServiceSkus },
    { key: 'LogicApps', fetcher: fetchers.fetchLogicAppsSkus },
    { key: 'ServiceBus', fetcher: fetchers.fetchServiceBusSkus },
    { key: 'ContainerApps', fetcher: fetchers.fetchContainerAppsSkus },
    { key: 'EventGrid', fetcher: fetchers.fetchEventGridSkus },
    { key: 'EventHubs', fetcher: fetchers.fetchEventHubsSkus },
    { key: 'Relay', fetcher: fetchers.fetchRelaySkus },
    { key: 'ContainerInstances', fetcher: fetchers.fetchContainerInstancesSkus },
    { key: 'AKS', fetcher: fetchers.fetchAKSSkus },
    { key: 'Batch', fetcher: fetchers.fetchBatchSkus }
  ];

  const insertService = db.prepare(`
    INSERT OR REPLACE INTO azure_services (id, service_name, category, description, metadata)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAttribute = db.prepare(`
    INSERT OR REPLACE INTO azure_service_attributes (id, service_id, attribute_name, attribute_value, attribute_type, display_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let totalServices = 0;
  let totalAttributes = 0;

  for (const service of services) {
    try {
      console.log(`\nProcessing ${service.key}...`);
      const offerings = (await service.fetcher({})) as V1Offering[];

      if (!offerings || offerings.length === 0) {
        console.warn(`  ⚠ No offerings returned for ${service.key}`);
        continue;
      }

      const displayName = getServiceDisplayName(service.key);
      const category = mapServiceToCategory(service.key);
      const firstOffering = offerings[0];

      const serviceId = `azsvc-${service.key.toLowerCase()}`;
      const metadata = {
        source: 'v1-sku-fetchers',
        serviceKey: service.key,
        pricingModels: [...new Set(offerings.map(o => o.pricingModel).filter(Boolean))],
        skuCount: offerings.length,
        regions: firstOffering.regions || [],
        documentationLinks: firstOffering.documentationLinks || []
      };

      insertService.run(
        serviceId,
        displayName,
        category,
        firstOffering.description || `${displayName} service`,
        JSON.stringify(metadata)
      );

      totalServices++;

      // Attributes
      let attrOrder = 0;
      const commonAttrs = [
        { name: 'Service Key', value: service.key, type: 'string' },
        { name: 'Category', value: category, type: 'string' },
        { name: 'SKU Count', value: String(offerings.length), type: 'number' }
      ];

      for (const attr of commonAttrs) {
        insertAttribute.run(
          `${serviceId}-attr-${attrOrder}`,
          serviceId,
          attr.name,
          attr.value,
          attr.type,
          attrOrder
        );
        attrOrder++;
        totalAttributes++;
      }

      if (firstOffering.attributes) {
        for (const [key, value] of Object.entries(firstOffering.attributes)) {
          if (value === null || value === undefined) continue;
          const attrType =
            typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';
          insertAttribute.run(
            `${serviceId}-attr-${attrOrder}`,
            serviceId,
            key,
            String(value),
            attrType,
            attrOrder
          );
          attrOrder++;
          totalAttributes++;
        }
      }

      if (firstOffering.features && firstOffering.features.length > 0) {
        insertAttribute.run(
          `${serviceId}-attr-${attrOrder}`,
          serviceId,
          'Features',
          JSON.stringify(firstOffering.features),
          'json',
          attrOrder
        );
        attrOrder++;
        totalAttributes++;
      }

      if (firstOffering.capabilities && firstOffering.capabilities.length > 0) {
        insertAttribute.run(
          `${serviceId}-attr-${attrOrder}`,
          serviceId,
          'Capabilities',
          JSON.stringify(firstOffering.capabilities),
          'json',
          attrOrder
        );
        attrOrder++;
        totalAttributes++;
      }

      if (firstOffering.limitations && firstOffering.limitations.length > 0) {
        insertAttribute.run(
          `${serviceId}-attr-${attrOrder}`,
          serviceId,
          'Limitations',
          JSON.stringify(firstOffering.limitations),
          'json',
          attrOrder
        );
        attrOrder++;
        totalAttributes++;
      }

      console.log(`  ✓ Loaded ${offerings.length} offerings for ${service.key}`);
    } catch (error) {
      console.error(`  ✗ Error processing ${service.key}:`, error);
    }
  }

  console.log(`\n✓ Migrated ${totalServices} services with ${totalAttributes} attributes`);
}

/**
 * Migrate APIM offerings from v1
 */
async function migrateApimOfferings() {
  console.log('\n=== Migrating APIM Offerings ===');

  const db = getDatabase();
  const fetchers = await getV1Fetchers();

  try {
    const offerings = await fetchers.fetchAPIMSkus({});

    const insert = db.prepare(`
      INSERT OR REPLACE INTO apim_offerings (
        id, sku_name, sku_tier, version, category, description, pricing_model, sla,
        features, capabilities, limitations, vnet_support, multi_region,
        self_hosted_gateway, developer_portal, analytics, ai_gateway, production_ready, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;

    for (const offering of offerings) {
      const metadata: any = {
        pricingInfo: offering.pricingInfo,
        regions: offering.regions,
        documentationLinks: offering.documentationLinks,
        useCases: offering.useCases,
        deploymentOptions: offering.deploymentOptions
      };

      const attrs = offering.attributes || {};

      insert.run(
        offering.id,
        offering.skuName,
        offering.skuTier,
        offering.version || null,
        offering.category || null,
        offering.description || null,
        offering.pricingModel || null,
        offering.sla || null,
        offering.features ? JSON.stringify(offering.features) : null,
        offering.capabilities ? JSON.stringify(offering.capabilities) : null,
        offering.limitations ? JSON.stringify(offering.limitations) : null,
        attrs.vnetSupport || attrs.vnetIntegration || false ? 1 : 0,
        attrs.multiRegion || false ? 1 : 0,
        attrs.selfHostedGateway || false ? 1 : 0,
        attrs.developerPortal !== false ? 1 : 0,
        attrs.analytics !== false ? 1 : 0,
        attrs.aiGateway || false ? 1 : 0,
        offering.isProductionReady !== false ? 1 : 0,
        JSON.stringify(metadata)
      );

      inserted++;
    }

    console.log(`✓ Migrated ${inserted} APIM offerings`);
  } catch (error) {
    console.error('Error migrating APIM offerings:', error);
    throw error;
  }
}

/**
 * Migrate APIM policies
 */
async function migrateApimPolicies() {
  console.log('\n=== Migrating APIM Policies ===');

  const db = getDatabase();

  try {
    const policiesRaw = readFileSync(V1_APIM_POLICIES, 'utf-8');
    const policiesData = JSON.parse(policiesRaw) as { version?: string; policies: ApimPolicy[] };
    const policies = policiesData.policies;

    const insert = db.prepare(`
      INSERT OR REPLACE INTO apim_policies (
        id, name, category, scope, description, parameters, xml_template, documentation,
        compatibility, examples, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;

    for (const policy of policies) {
      // Build metadata object with source and related policies
      const metadata: any = {
        source: 'v1-apim-policies-seed',
        version: '2025.01.20'
      };
      
      if (policy.relatedPolicies && policy.relatedPolicies.length > 0) {
        metadata.relatedPolicies = policy.relatedPolicies;
      }

      insert.run(
        policy.id,
        policy.name,
        policy.category,
        JSON.stringify(policy.scope || []),
        policy.description || null,
        policy.parameters ? JSON.stringify(policy.parameters) : null,
        policy.xmlTemplate ? JSON.stringify(policy.xmlTemplate) : null,
        policy.documentation || null,
        policy.compatibility ? JSON.stringify(policy.compatibility) : null,
        policy.examples ? JSON.stringify(policy.examples) : null,
        JSON.stringify(metadata)
      );
      inserted++;
    }

    console.log(`✓ Migrated ${inserted} APIM policies`);
  } catch (error) {
    console.error('Error migrating APIM policies:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('Starting V1 to V2 data migration...\n');

  try {
    await migrateAzureServices();
    await migrateApimOfferings();
    await migrateApimPolicies();

    console.log('\n=== Migration Complete ===');
    console.log('All data has been migrated successfully.');
  } catch (error) {
    console.error('\n=== Migration Failed ===');
    console.error(error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { migrateAzureServices, migrateApimOfferings, migrateApimPolicies };


