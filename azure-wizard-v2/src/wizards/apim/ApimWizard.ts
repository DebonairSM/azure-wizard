import { IWizard } from '../base/IWizard.js';
import { Node } from '../../shared/models/Node.js';
import { getDatabase } from '../../database/db.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ApimWizard implements IWizard {
  id = 'apim';
  name = 'API Management';
  description = 'Discover Azure API Management SKUs, tiers, and configuration options';

  getSchemaAdditions(): string {
    const schemaPath = join(__dirname, 'apim-schema.sql');
    return readFileSync(schemaPath, 'utf-8');
  }

  async getRootNodes(): Promise<Node[]> {
    const db = getDatabase();

    // Get unique categories/versions as root nodes
    const categories = db.prepare(`
      SELECT DISTINCT category, version
      FROM apim_offerings
      WHERE category IS NOT NULL
      ORDER BY version DESC, category
    `).all() as Array<{ category: string; version: string | null }>;

    const rootNodes: Node[] = [];
    let order = 0;

    // Group by version first
    const byVersion = new Map<string, string[]>();
    for (const cat of categories) {
      const version = cat.version || 'All Versions';
      if (!byVersion.has(version)) {
        byVersion.set(version, []);
      }
      byVersion.get(version)!.push(cat.category);
    }

    for (const [version, cats] of byVersion.entries()) {
      const versionNodeId = `apim-version-${version.toLowerCase().replace(/\s+/g, '-')}`;

      // Check if version node exists
      let versionNode = db.prepare(`
        SELECT * FROM nodes 
        WHERE id = ? AND wizard_id = ?
      `).get(versionNodeId, this.id) as Node | undefined;

      if (!versionNode) {
        db.prepare(`
          INSERT INTO nodes (id, wizard_id, name, description, node_type, display_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          versionNodeId,
          this.id,
          version,
          `APIM ${version} offerings`,
          'version',
          order++
        );
      }

      rootNodes.push({
        id: versionNodeId,
        wizardId: this.id,
        name: version,
        description: `APIM ${version} offerings`,
        nodeType: 'version',
        displayOrder: order - 1
      });
    }

    // Add Policies root node if policies exist
    const policyCount = db.prepare('SELECT COUNT(*) as count FROM apim_policies').get() as { count: number };
    if (policyCount.count > 0) {
      const policiesNodeId = 'apim-policies-root';
      let policiesNode = db.prepare(`
        SELECT * FROM nodes 
        WHERE id = ? AND wizard_id = ?
      `).get(policiesNodeId, this.id) as Node | undefined;

      if (!policiesNode) {
        db.prepare(`
          INSERT INTO nodes (id, wizard_id, name, description, node_type, display_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          policiesNodeId,
          this.id,
          'Policies',
          'APIM policy definitions and configurations',
          'policies-root',
          order++
        );
      }

      rootNodes.push({
        id: policiesNodeId,
        wizardId: this.id,
        name: 'Policies',
        description: 'APIM policy definitions and configurations',
        nodeType: 'policies-root',
        displayOrder: order - 1
      });
    }

    // If no categories, create a single root
    if (rootNodes.length === 0) {
      const rootNodeId = 'apim-root';
      rootNodes.push({
        id: rootNodeId,
        wizardId: this.id,
        name: 'API Management Offerings',
        description: 'Browse APIM SKUs and tiers',
        nodeType: 'root',
        displayOrder: 0
      });
    }

    return rootNodes;
  }

  async getNodeChildren(nodeId: string): Promise<Node[]> {
    const db = getDatabase();

    // Database uses snake_case columns
    const row = db.prepare(`
      SELECT * FROM nodes WHERE id = ? AND wizard_id = ?
    `).get(nodeId, this.id) as any;

    if (!row) {
      return [];
    }

    // Map snake_case to camelCase
    const node: Node = {
      id: row.id,
      wizardId: row.wizard_id,
      parentId: row.parent_id,
      name: row.name,
      description: row.description,
      nodeType: row.node_type,
      displayOrder: row.display_order,
      data: row.data
    };

    if (node.nodeType === 'version') {
      // Get categories for this version
      const version = node.name === 'All Versions' ? null : node.name;
      const categories = db.prepare(`
        SELECT DISTINCT category
        FROM apim_offerings
        WHERE (? IS NULL OR version = ?) AND category IS NOT NULL
        ORDER BY category
      `).all(version, version) as Array<{ category: string }>;

      const children: Node[] = [];
      let order = 0;

      for (const cat of categories) {
        const categoryNodeId = `apim-category-${cat.category.toLowerCase().replace(/\s+/g, '-')}-${version || 'all'}`;

        let categoryNode = db.prepare(`
          SELECT * FROM nodes 
          WHERE id = ? AND wizard_id = ?
        `).get(categoryNodeId, this.id) as Node | undefined;

        if (!categoryNode) {
          db.prepare(`
            INSERT INTO nodes (id, wizard_id, parent_id, name, description, node_type, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            categoryNodeId,
            this.id,
            nodeId,
            cat.category,
            `APIM ${cat.category} offerings`,
            'category',
            order++
          );
        }

        children.push({
          id: categoryNodeId,
          wizardId: this.id,
          parentId: nodeId,
          name: cat.category,
          description: `APIM ${cat.category} offerings`,
          nodeType: 'category',
          displayOrder: order - 1
        });
      }

      return children;
    } else if (node.nodeType === 'category' || node.nodeType === 'root') {
      // Get SKUs in this category
      const category = node.nodeType === 'category' ? node.name : null;
      const skus = db.prepare(`
        SELECT DISTINCT sku_name, sku_tier
        FROM apim_offerings
        WHERE (? IS NULL OR category = ?)
        ORDER BY sku_tier, sku_name
      `).all(category, category) as Array<{ sku_name: string; sku_tier: string }>;

      const children: Node[] = [];
      let order = 0;

      for (const sku of skus) {
        const skuNodeId = `apim-sku-${sku.sku_name.toLowerCase().replace(/\s+/g, '-')}`;

        // Get SKU description
        const skuData = db.prepare(`
          SELECT description FROM apim_offerings 
          WHERE sku_name = ? LIMIT 1
        `).get(sku.sku_name) as { description: string | null } | undefined;

        const skuRow = db.prepare(`
          SELECT * FROM nodes 
          WHERE id = ? AND wizard_id = ?
        `).get(skuNodeId, this.id) as any;

        if (!skuRow) {
          db.prepare(`
            INSERT INTO nodes (id, wizard_id, parent_id, name, description, node_type, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            skuNodeId,
            this.id,
            nodeId,
            `${sku.sku_name} (${sku.sku_tier})`,
            skuData?.description || null,
            'sku',
            order++
          );
        } else {
          order = (skuRow.display_order || 0) + 1;
        }

        children.push({
          id: skuNodeId,
          wizardId: this.id,
          parentId: nodeId,
          name: `${sku.sku_name} (${sku.sku_tier})`,
          description: skuData?.description || undefined,
          nodeType: 'sku',
          displayOrder: order - 1
        });
      }

      return children;
    } else if (node.nodeType === 'sku') {
      // Get SKU details as attributes
      const skuName = node.name.split(' (')[0]; // Extract SKU name
      const offering = db.prepare(`
        SELECT * FROM apim_offerings 
        WHERE sku_name = ? LIMIT 1
      `).get(skuName) as any;

      if (!offering) {
        return [];
      }

      const children: Node[] = [];
      let order = 0;

      // Create attribute nodes for key properties
      const attributes = [
        { name: 'SKU Tier', value: offering.sku_tier, type: 'string' },
        { name: 'Version', value: offering.version || 'N/A', type: 'string' },
        { name: 'Pricing Model', value: offering.pricing_model || 'N/A', type: 'string' },
        { name: 'SLA', value: offering.sla || 'N/A', type: 'string' },
        { name: 'VNet Support', value: offering.vnet_support ? 'Yes' : 'No', type: 'boolean' },
        { name: 'Multi-Region', value: offering.multi_region ? 'Yes' : 'No', type: 'boolean' },
        { name: 'Self-Hosted Gateway', value: offering.self_hosted_gateway ? 'Yes' : 'No', type: 'boolean' },
        { name: 'Developer Portal', value: offering.developer_portal ? 'Yes' : 'No', type: 'boolean' },
        { name: 'Analytics', value: offering.analytics ? 'Yes' : 'No', type: 'boolean' },
        { name: 'AI Gateway', value: offering.ai_gateway ? 'Yes' : 'No', type: 'boolean' },
        { name: 'Production Ready', value: offering.production_ready ? 'Yes' : 'No', type: 'boolean' }
      ];

      for (const attr of attributes) {
        if (attr.value === null || attr.value === 'N/A') continue;

        const attrNodeId = `apim-attr-${offering.id}-${attr.name.toLowerCase().replace(/\s+/g, '-')}`;

        let attrNode = db.prepare(`
          SELECT * FROM nodes 
          WHERE id = ? AND wizard_id = ?
        `).get(attrNodeId, this.id) as Node | undefined;

        if (!attrNode) {
          db.prepare(`
            INSERT INTO nodes (id, wizard_id, parent_id, name, description, node_type, display_order, data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            attrNodeId,
            this.id,
            nodeId,
            attr.name,
            String(attr.value),
            'attribute',
            order++,
            JSON.stringify({ value: attr.value, type: attr.type })
          );
        }

        children.push({
          id: attrNodeId,
          wizardId: this.id,
          parentId: nodeId,
          name: attr.name,
          description: String(attr.value),
          nodeType: 'attribute',
          displayOrder: order - 1,
          data: { value: attr.value, type: attr.type }
        });
      }

      return children;
    } else if (node.nodeType === 'policies-root') {
      // Get policy categories with counts, prioritize AI Gateway
      const categories = db.prepare(`
        SELECT 
          category,
          COUNT(*) as policy_count
        FROM apim_policies
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY 
          CASE category
            WHEN 'ai-gateway' THEN 1
            WHEN 'authentication' THEN 2
            WHEN 'rate-limiting' THEN 3
            WHEN 'security' THEN 4
            WHEN 'transformation' THEN 5
            WHEN 'caching' THEN 6
            WHEN 'routing' THEN 7
            WHEN 'logging' THEN 8
            WHEN 'error-handling' THEN 9
            WHEN 'advanced' THEN 10
            ELSE 11
          END,
          category
      `).all() as Array<{ category: string; policy_count: number }>;

      const children: Node[] = [];
      let order = 0;

      for (const cat of categories) {
        const categoryNodeId = `apim-policy-category-${cat.category.toLowerCase().replace(/\s+/g, '-')}`;

        const categoryRow = db.prepare(`
          SELECT * FROM nodes 
          WHERE id = ? AND wizard_id = ?
        `).get(categoryNodeId, this.id) as any;

        if (!categoryRow) {
          db.prepare(`
            INSERT INTO nodes (id, wizard_id, parent_id, name, description, node_type, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            categoryNodeId,
            this.id,
            nodeId,
            cat.category,
            `${cat.policy_count} APIM ${cat.category} policies`,
            'policy-category',
            order++
          );
        }

        children.push({
          id: categoryNodeId,
          wizardId: this.id,
          parentId: nodeId,
          name: cat.category,
          description: `${cat.policy_count} APIM ${cat.category} policies`,
          nodeType: 'policy-category',
          displayOrder: order - 1
        });
      }

      return children;
    } else if (node.nodeType === 'policy-category') {
      // Get policies in this category
      const category = node.name;
      const policies = db.prepare(`
        SELECT id, name, description
        FROM apim_policies
        WHERE category = ?
        ORDER BY name
      `).all(category) as Array<{ id: string; name: string; description: string | null }>;

      const children: Node[] = [];
      let order = 0;

      for (const policy of policies) {
        const policyNodeId = `apim-policy-${policy.id}`;

        let policyNode = db.prepare(`
          SELECT * FROM nodes 
          WHERE id = ? AND wizard_id = ?
        `).get(policyNodeId, this.id) as Node | undefined;

        if (!policyNode) {
          db.prepare(`
            INSERT INTO nodes (id, wizard_id, parent_id, name, description, node_type, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            policyNodeId,
            this.id,
            nodeId,
            policy.name,
            policy.description || null,
            'policy',
            order++
          );
        }

        children.push({
          id: policyNodeId,
          wizardId: this.id,
          parentId: nodeId,
          name: policy.name,
          description: policy.description || undefined,
          nodeType: 'policy',
          displayOrder: order - 1
        });
      }

      return children;
    }

    return [];
  }

  async getNodeData(nodeId: string): Promise<any> {
    const db = getDatabase();

    // Database uses snake_case columns
    const row = db.prepare(`
      SELECT * FROM nodes WHERE id = ? AND wizard_id = ?
    `).get(nodeId, this.id) as any;

    if (!row) {
      return null;
    }

    if (row.node_type === 'sku') {
      const skuName = row.name.split(' (')[0];
      const offering = db.prepare(`
        SELECT * FROM apim_offerings WHERE sku_name = ? LIMIT 1
      `).get(skuName) as any;

      if (offering) {
        return {
          offering: {
            ...offering,
            features: offering.features ? JSON.parse(offering.features) : [],
            capabilities: offering.capabilities ? JSON.parse(offering.capabilities) : [],
            limitations: offering.limitations ? JSON.parse(offering.limitations) : [],
            metadata: offering.metadata ? JSON.parse(offering.metadata) : null
          }
        };
      }
    } else if (row.node_type === 'policy') {
      const policyId = row.id.replace('apim-policy-', '');
      const policy = db.prepare(`
        SELECT * FROM apim_policies WHERE id = ? LIMIT 1
      `).get(policyId) as any;

      if (policy) {
        const metadata = policy.metadata ? JSON.parse(policy.metadata) : {};
        const relatedPolicies = metadata.relatedPolicies || [];
        
        // Get related policy details if they exist
        const relatedPolicyDetails: any[] = [];
        if (relatedPolicies.length > 0) {
          const placeholders = relatedPolicies.map(() => '?').join(',');
          const related = db.prepare(`
            SELECT id, name, category, description
            FROM apim_policies
            WHERE id IN (${placeholders})
          `).all(...relatedPolicies) as Array<{ id: string; name: string; category: string; description: string | null }>;
          
          relatedPolicyDetails.push(...related.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            description: p.description
          })));
        }

        return {
          policy: {
            ...policy,
            scope: policy.scope ? JSON.parse(policy.scope) : [],
            parameters: policy.parameters ? JSON.parse(policy.parameters) : {},
            xml_template: policy.xml_template ? JSON.parse(policy.xml_template) : {},
            compatibility: policy.compatibility ? JSON.parse(policy.compatibility) : {},
            examples: policy.examples ? JSON.parse(policy.examples) : [],
            metadata: metadata,
            relatedPolicies: relatedPolicyDetails
          }
        };
      }
    } else if (row.node_type === 'policy-category') {
      // Return category summary with policy count
      const category = row.name;
      const policyCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM apim_policies
        WHERE category = ?
      `).get(category) as { count: number };
      
      const policies = db.prepare(`
        SELECT id, name, description
        FROM apim_policies
        WHERE category = ?
        ORDER BY name
      `).all(category) as Array<{ id: string; name: string; description: string | null }>;

      return {
        category: {
          name: category,
          policyCount: policyCount.count,
          policies: policies.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description
          }))
        }
      };
    }

    return row.data ? JSON.parse(row.data) : null;
  }

  async loadData(): Promise<void> {
    const db = getDatabase();

    // Ensure migration table exists (older DBs may not have it yet)
    db.exec(`
      CREATE TABLE IF NOT EXISTS data_migrations (
        id TEXT PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if data already exists
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM apim_offerings').get() as { count: number };

    if (existingCount.count > 0) {
      console.log(`APIM data already loaded (${existingCount.count} offerings)`);
      return;
    }

    // Use migration function to load data from v1
    try {
      // idempotent migration marker
      const MIGRATION_ID = 'v1_to_v2_apim_2025-12-19';
      const { migrateApimOfferings } = await import('../../scripts/migrate-v1-data.js');
      await migrateApimOfferings();
      db.prepare('INSERT OR REPLACE INTO data_migrations (id) VALUES (?)').run(MIGRATION_ID);
      console.log('APIM offerings data loaded from v1 sources');
    } catch (error) {
      console.error('Error loading APIM offerings from v1:', error);
      console.log('Falling back to sample data...');
      
      // Fallback to sample data if migration fails
      const sampleOfferings = [
        {
          id: 'apim-consumption',
          sku_name: 'Consumption',
          sku_tier: 'Consumption',
          version: 'v2',
          category: 'consumption',
          description: 'Pay-per-use pricing model, no infrastructure management',
          pricing_model: 'pay-per-use',
          sla: '99.95%',
          vnet_support: false,
          multi_region: false,
          self_hosted_gateway: false,
          developer_portal: true,
          analytics: true,
          ai_gateway: true,
          production_ready: true,
          features: JSON.stringify(['Serverless', 'Auto-scaling', 'Global distribution']),
          capabilities: JSON.stringify(['API Gateway', 'Developer Portal', 'Analytics']),
          limitations: JSON.stringify(['No VNet support', 'No self-hosted gateway']),
          metadata: JSON.stringify({ maxScaleUnits: null, cachePerUnit: null })
        }
      ];

      const insert = db.prepare(`
        INSERT INTO apim_offerings (
          id, sku_name, sku_tier, version, category, description, pricing_model, sla,
          features, capabilities, limitations, vnet_support, multi_region,
          self_hosted_gateway, developer_portal, analytics, ai_gateway, production_ready, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const offering of sampleOfferings) {
        insert.run(
          offering.id,
          offering.sku_name,
          offering.sku_tier,
          offering.version,
          offering.category,
          offering.description,
          offering.pricing_model,
          offering.sla,
          offering.features,
          offering.capabilities,
          offering.limitations,
          offering.vnet_support ? 1 : 0,
          offering.multi_region ? 1 : 0,
          offering.self_hosted_gateway ? 1 : 0,
          offering.developer_portal ? 1 : 0,
          offering.analytics ? 1 : 0,
          offering.ai_gateway ? 1 : 0,
          offering.production_ready ? 1 : 0,
          offering.metadata
        );
      }

      console.log(`Loaded ${sampleOfferings.length} sample APIM offerings (fallback)`);
    }

    // Load APIM policies
    try {
      const { migrateApimPolicies } = await import('../../scripts/migrate-v1-data.js');
      await migrateApimPolicies();
      console.log('APIM policies data loaded from v1 sources');
    } catch (error) {
      console.error('Error loading APIM policies from v1:', error);
      // Policies are optional, so we don't fail if they can't be loaded
    }
  }
}

