import { IWizard } from '../base/IWizard.js';
import { Node } from '../../shared/models/Node.js';
import { getDatabase } from '../../database/db.js';

export class AzureServicesWizard implements IWizard {
  id = 'azure-services';
  name = 'Azure Services';
  description = 'Discover Azure services, SKUs, and configuration options';

  async getRootNodes(): Promise<Node[]> {
    const db = getDatabase();
    
    // Get all unique service names as root nodes
    const services = db.prepare(`
      SELECT DISTINCT service_name, category
      FROM azure_services
      ORDER BY category, service_name
    `).all() as Array<{ service_name: string; category: string | null }>;

    // Group by category
    const categories = new Map<string, string[]>();
    
    for (const service of services) {
      const category = service.category || 'Other';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(service.service_name);
    }

    // Create category nodes
    const rootNodes: Node[] = [];
    let order = 0;

    for (const [category, serviceNames] of categories.entries()) {
      const categoryNodeId = `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Check if category node exists
      let categoryNode = db.prepare(`
        SELECT * FROM nodes 
        WHERE id = ? AND wizard_id = ?
      `).get(categoryNodeId, this.id) as Node | undefined;

      if (!categoryNode) {
        // Create category node
        db.prepare(`
          INSERT INTO nodes (id, wizard_id, name, description, node_type, display_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          categoryNodeId,
          this.id,
          category,
          `Azure services in the ${category} category`,
          'category',
          order++
        );
      }

      rootNodes.push({
        id: categoryNodeId,
        wizardId: this.id,
        name: category,
        description: `Azure services in the ${category} category`,
        nodeType: 'category',
        displayOrder: order - 1
      });
    }

    return rootNodes;
  }

  async getNodeChildren(nodeId: string): Promise<Node[]> {
    const db = getDatabase();
    
    // Get node to determine type (database uses snake_case columns)
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

    if (node.nodeType === 'category') {
      // Get services in this category
      const category = node.name;
      const services = db.prepare(`
        SELECT DISTINCT service_name
        FROM azure_services
        WHERE category = ?
        ORDER BY service_name
      `).all(category) as Array<{ service_name: string }>;

      const children: Node[] = [];
      let order = 0;

      for (const service of services) {
        const serviceNodeId = `service-${service.service_name.toLowerCase().replace(/\s+/g, '-')}`;
        
        // Get service description
        const serviceData = db.prepare(`
          SELECT description FROM azure_services 
          WHERE service_name = ? LIMIT 1
        `).get(service.service_name) as { description: string | null } | undefined;
        
        // Check if service node exists (database uses snake_case)
        const serviceRow = db.prepare(`
          SELECT * FROM nodes 
          WHERE id = ? AND wizard_id = ?
        `).get(serviceNodeId, this.id) as any;

        if (!serviceRow) {
          // Create service node
          db.prepare(`
            INSERT INTO nodes (id, wizard_id, parent_id, name, description, node_type, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            serviceNodeId,
            this.id,
            nodeId,
            service.service_name,
            serviceData?.description || null,
            'service',
            order++
          );
        } else {
          order = (serviceRow.display_order || 0) + 1;
        }

        children.push({
          id: serviceNodeId,
          wizardId: this.id,
          parentId: nodeId,
          name: service.service_name,
          description: serviceData?.description || undefined,
          nodeType: 'service',
          displayOrder: order - 1
        });
      }

      return children;
    } else if (node.nodeType === 'service') {
      // Get service details and attributes
      const serviceName = node.name;
      const service = db.prepare(`
        SELECT * FROM azure_services WHERE service_name = ? LIMIT 1
      `).get(serviceName) as any;

      if (!service) {
        return [];
      }

      // Get attributes as child nodes
      const attributes = db.prepare(`
        SELECT * FROM azure_service_attributes
        WHERE service_id = ?
        ORDER BY display_order, attribute_name
      `).all(service.id) as Array<{
        id: string;
        attribute_name: string;
        attribute_value: string | null;
        attribute_type: string | null;
      }>;

      const children: Node[] = [];
      let order = 0;

      for (const attr of attributes) {
        const attrNodeId = `attr-${attr.id}`;
        
        // Check if attribute node exists (database uses snake_case)
        const attrRow = db.prepare(`
          SELECT * FROM nodes 
          WHERE id = ? AND wizard_id = ?
        `).get(attrNodeId, this.id) as any;

        if (!attrRow) {
          // Create attribute node
          db.prepare(`
            INSERT INTO nodes (id, wizard_id, parent_id, name, description, node_type, display_order, data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            attrNodeId,
            this.id,
            nodeId,
            attr.attribute_name,
            attr.attribute_value || null,
            'attribute',
            order++,
            JSON.stringify({
              value: attr.attribute_value,
              type: attr.attribute_type
            })
          );
        } else {
          order = (attrRow.display_order || 0) + 1;
        }

        children.push({
          id: attrNodeId,
          wizardId: this.id,
          parentId: nodeId,
          name: attr.attribute_name,
          description: attr.attribute_value || undefined,
          nodeType: 'attribute',
          displayOrder: order - 1,
          data: {
            value: attr.attribute_value,
            type: attr.attribute_type
          }
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

    if (row.node_type === 'service') {
      // Get full service data
      const service = db.prepare(`
        SELECT * FROM azure_services WHERE service_name = ? LIMIT 1
      `).get(row.name) as any;

      if (service) {
        return {
          service: {
            ...service,
            metadata: service.metadata ? JSON.parse(service.metadata) : null
          },
          attributes: db.prepare(`
            SELECT * FROM azure_service_attributes
            WHERE service_id = ?
            ORDER BY display_order, attribute_name
          `).all(service.id)
        };
      }
    }

    return row.data ? JSON.parse(row.data) : null;
  }

  async loadData(): Promise<void> {
    const db = getDatabase();

    const MIGRATION_ID = 'v1_to_v2_azure_services_2025-12-19';

    // Ensure migration table exists (older DBs may not have it yet)
    db.exec(`
      CREATE TABLE IF NOT EXISTS data_migrations (
        id TEXT PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const requiredServiceIds = [
      'azsvc-functions',
      'azsvc-appservice',
      'azsvc-logicapps',
      'azsvc-servicebus',
      'azsvc-containerapps',
      'azsvc-eventgrid',
      'azsvc-eventhubs',
      'azsvc-relay',
      'azsvc-containerinstances',
      'azsvc-aks',
      'azsvc-batch'
    ];

    const migrationApplied = db
      .prepare('SELECT id FROM data_migrations WHERE id = ?')
      .get(MIGRATION_ID) as { id: string } | undefined;

    const missing = db
      .prepare(
        `SELECT id FROM azure_services
         WHERE id IN (${requiredServiceIds.map(() => '?').join(',')})`
      )
      .all(...requiredServiceIds) as Array<{ id: string }>;

    const existingIds = new Set(missing.map(r => r.id));
    const missingIds = requiredServiceIds.filter(id => !existingIds.has(id));

    if (migrationApplied && missingIds.length === 0) {
      console.log('Azure services data already migrated and complete');
      return;
    }

    if (migrationApplied && missingIds.length > 0) {
      console.log(`Azure services migration previously applied, but ${missingIds.length} services are missing. Re-running migration...`);
    } else {
      console.log('Running initial Azure services migration...');
    }

    // Remove any existing migrated rows (and attributes) before re-migrating.
    // We only remove the IDs we own to avoid impacting any user/custom rows.
    db.prepare(
      `DELETE FROM azure_service_attributes
       WHERE service_id IN (${requiredServiceIds.map(() => '?').join(',')})`
    ).run(...requiredServiceIds);

    db.prepare(
      `DELETE FROM azure_services
       WHERE id IN (${requiredServiceIds.map(() => '?').join(',')})`
    ).run(...requiredServiceIds);

    // Use migration function to load data from v1
    try {
      const { migrateAzureServices } = await import('../../scripts/migrate-v1-data.js');
      await migrateAzureServices();
      db.prepare('INSERT OR REPLACE INTO data_migrations (id) VALUES (?)').run(MIGRATION_ID);
      console.log('Azure services data loaded from v1 sources');
    } catch (error) {
      console.error('Error loading Azure services from v1:', error);
      console.log('Falling back to sample data...');
      
      // Fallback to sample data if migration fails
      const sampleServices = [
        {
          id: 'azure-functions',
          serviceName: 'Azure Functions',
          category: 'Compute',
          description: 'Serverless compute service for running event-driven code',
          metadata: JSON.stringify({
            pricingModel: 'consumption',
            regions: ['global']
          })
        },
        {
          id: 'azure-app-service',
          serviceName: 'Azure App Service',
          category: 'Compute',
          description: 'Platform-as-a-Service for hosting web apps, APIs, and mobile backends',
          metadata: JSON.stringify({
            pricingModel: 'tiered',
            regions: ['global']
          })
        }
      ];

      const insertService = db.prepare(`
        INSERT INTO azure_services (id, service_name, category, description, metadata)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const service of sampleServices) {
        insertService.run(
          service.id,
          service.serviceName,
          service.category,
          service.description,
          service.metadata
        );
      }

      console.log(`Loaded ${sampleServices.length} sample Azure services (fallback)`);
    }
  }
}


