#!/usr/bin/env node
/**
 * Export database data to JSON files for simplified wizard system
 */

import { getDatabase, closeDatabase } from '../database/db.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WIZARDS_DIR = join(__dirname, '..', 'wizards');

/**
 * Export Azure Services to JSON files
 */
function exportAzureServices() {
  console.log('\n=== Exporting Azure Services ===');
  const db = getDatabase();
  
  const wizardDir = join(WIZARDS_DIR, 'azure-services');
  mkdirSync(wizardDir, { recursive: true });

  // Create _index.json
  const index = {
    id: 'azure-services',
    name: 'Azure Services',
    description: 'Discover Azure services, SKUs, pricing, and configuration options',
    version: '1.0.0'
  };
  writeFileSync(join(wizardDir, '_index.json'), JSON.stringify(index, null, 2));

  // Get all services grouped by category
  const services = db.prepare(`
    SELECT 
      service_name,
      category,
      description,
      metadata
    FROM azure_services
    ORDER BY category, service_name
  `).all() as Array<{
    service_name: string;
    category: string;
    description: string | null;
    metadata: string | null;
  }>;

  // Group by category
  const byCategory = new Map<string, typeof services>();
  for (const service of services) {
    const category = service.category || 'other';
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(service);
  }

  // Create category directories and service files
  let exported = 0;
  for (const [category, categoryServices] of byCategory.entries()) {
    const categoryDir = join(wizardDir, category);
    mkdirSync(categoryDir, { recursive: true });

    for (const service of categoryServices) {
      const serviceId = service.service_name.toLowerCase().replace(/\s+/g, '-');
      
      // Get attributes for this service
      const serviceRow = db.prepare(`
        SELECT id FROM azure_services WHERE service_name = ? LIMIT 1
      `).get(service.service_name) as { id: string } | undefined;
      
      let attributes: any[] = [];
      if (serviceRow) {
        attributes = db.prepare(`
          SELECT 
            attribute_name,
            attribute_value,
            attribute_type,
            display_order
          FROM azure_service_attributes
          WHERE service_id = ?
          ORDER BY display_order, attribute_name
        `).all(serviceRow.id) as any[];
      }

      // Build service JSON
      const serviceData: any = {
        id: serviceId,
        name: service.service_name,
        category: category,
        description: service.description || ''
      };

      if (attributes.length > 0) {
        serviceData.attributes = attributes.map(attr => ({
          name: attr.attribute_name,
          value: attr.attribute_value,
          type: attr.attribute_type
        }));
      }

      if (service.metadata) {
        try {
          serviceData.metadata = JSON.parse(service.metadata);
        } catch (e) {
          // Ignore parse errors
        }
      }

      const filePath = join(categoryDir, `${serviceId}.json`);
      writeFileSync(filePath, JSON.stringify(serviceData, null, 2));
      exported++;
    }
  }

  console.log(`✓ Exported ${exported} Azure services to ${byCategory.size} categories`);
}

/**
 * Export APIM Policies to JSON files
 */
function exportApimPolicies() {
  console.log('\n=== Exporting APIM Policies ===');
  const db = getDatabase();
  
  const wizardDir = join(WIZARDS_DIR, 'apim');
  mkdirSync(wizardDir, { recursive: true });

  // Create _index.json
  const index = {
    id: 'apim',
    name: 'API Management',
    description: 'Discover Azure API Management SKUs, tiers, and policy configurations',
    version: '1.0.0'
  };
  writeFileSync(join(wizardDir, '_index.json'), JSON.stringify(index, null, 2));

  // Get all policies grouped by category
  const policies = db.prepare(`
    SELECT 
      id,
      name,
      category,
      scope,
      description,
      parameters,
      xml_template,
      documentation,
      compatibility,
      examples,
      metadata
    FROM apim_policies
    WHERE category IS NOT NULL
    ORDER BY category, name
  `).all() as any[];

  // Group by category
  const byCategory = new Map<string, typeof policies>();
  for (const policy of policies) {
    const category = policy.category || 'other';
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(policy);
  }

  // Create policies directory
  const policiesDir = join(wizardDir, 'policies');
  mkdirSync(policiesDir, { recursive: true });

  // Create category subdirectories and policy files
  let exported = 0;
  for (const [category, categoryPolicies] of byCategory.entries()) {
    const categoryDir = join(policiesDir, category);
    mkdirSync(categoryDir, { recursive: true });

    for (const policy of categoryPolicies) {
      const policyData: any = {
        id: policy.id,
        name: policy.name,
        category: policy.category,
        description: policy.description || '',
        scope: policy.scope ? JSON.parse(policy.scope) : [],
        parameters: policy.parameters ? JSON.parse(policy.parameters) : {},
        xmlTemplate: policy.xml_template ? JSON.parse(policy.xml_template) : {},
        documentation: policy.documentation || '',
        compatibility: policy.compatibility ? JSON.parse(policy.compatibility) : {},
        examples: policy.examples ? JSON.parse(policy.examples) : []
      };

      if (policy.metadata) {
        try {
          const metadata = JSON.parse(policy.metadata);
          if (metadata.relatedPolicies) {
            policyData.relatedPolicies = metadata.relatedPolicies;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      const filePath = join(categoryDir, `${policy.id}.json`);
      writeFileSync(filePath, JSON.stringify(policyData, null, 2));
      exported++;
    }
  }

  console.log(`✓ Exported ${exported} APIM policies to ${byCategory.size} categories`);
}

/**
 * Export APIM SKUs to JSON files
 */
function exportApimSkus() {
  console.log('\n=== Exporting APIM SKUs ===');
  const db = getDatabase();
  
  const wizardDir = join(WIZARDS_DIR, 'apim');
  const skusDir = join(wizardDir, 'skus');
  mkdirSync(skusDir, { recursive: true });

  // Get all SKUs grouped by tier
  const skus = db.prepare(`
    SELECT 
      sku_name,
      sku_tier,
      version,
      category,
      description,
      pricing_model,
      sla,
      features,
      capabilities,
      limitations,
      vnet_support,
      multi_region,
      self_hosted_gateway,
      developer_portal,
      analytics,
      ai_gateway,
      production_ready,
      metadata
    FROM apim_offerings
    ORDER BY sku_tier, sku_name
  `).all() as any[];

  // Group by tier
  const byTier = new Map<string, typeof skus>();
  for (const sku of skus) {
    const tier = sku.sku_tier || 'other';
    if (!byTier.has(tier)) {
      byTier.set(tier, []);
    }
    byTier.get(tier)!.push(sku);
  }

  // Create tier files
  let exported = 0;
  for (const [tier, tierSkus] of byTier.entries()) {
    const tierData = {
      id: tier.toLowerCase(),
      name: tier,
      skus: tierSkus.map(sku => ({
        name: sku.sku_name,
        tier: sku.sku_tier,
        version: sku.version,
        category: sku.category,
        description: sku.description,
        pricingModel: sku.pricing_model,
        sla: sku.sla,
        features: sku.features ? JSON.parse(sku.features) : [],
        capabilities: sku.capabilities ? JSON.parse(sku.capabilities) : [],
        limitations: sku.limitations ? JSON.parse(sku.limitations) : [],
        vnetSupport: sku.vnet_support === 1,
        multiRegion: sku.multi_region === 1,
        selfHostedGateway: sku.self_hosted_gateway === 1,
        developerPortal: sku.developer_portal === 1,
        analytics: sku.analytics === 1,
        aiGateway: sku.ai_gateway === 1,
        productionReady: sku.production_ready === 1,
        metadata: sku.metadata ? JSON.parse(sku.metadata) : {}
      }))
    };

    const filePath = join(skusDir, `${tier.toLowerCase()}.json`);
    writeFileSync(filePath, JSON.stringify(tierData, null, 2));
    exported += tierSkus.length;
  }

  console.log(`✓ Exported ${exported} APIM SKUs to ${byTier.size} tier files`);
}

/**
 * Main export function
 */
async function main() {
  console.log('Starting data export to JSON files...\n');

  try {
    exportAzureServices();
    exportApimPolicies();
    exportApimSkus();

    console.log('\n=== Export Complete ===');
    console.log('All data has been exported to JSON files in wizards/ directory.');
  } catch (error) {
    console.error('\n=== Export Failed ===');
    console.error(error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('export-to-json')) {
  main();
}

export { exportAzureServices, exportApimPolicies, exportApimSkus };

