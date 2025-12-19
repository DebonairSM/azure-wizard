-- Azure Wizard V2 Database Schema

-- Wizards table
CREATE TABLE IF NOT EXISTS wizards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Nodes table (shared across all wizards)
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  wizard_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  node_type TEXT, -- 'category', 'service', 'sku', 'attribute', etc.
  display_order INTEGER DEFAULT 0,
  data TEXT, -- JSON for wizard-specific data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wizard_id) REFERENCES wizards(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nodes_wizard_id ON nodes(wizard_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_node_type ON nodes(node_type);

-- Azure services (shared data)
CREATE TABLE IF NOT EXISTS azure_services (
  id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_azure_services_category ON azure_services(category);
CREATE INDEX IF NOT EXISTS idx_azure_services_service_name ON azure_services(service_name);

-- Azure service attributes (for detailed drill-down)
CREATE TABLE IF NOT EXISTS azure_service_attributes (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT, -- Can be text or JSON
  attribute_type TEXT, -- 'string', 'number', 'boolean', 'json'
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES azure_services(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_azure_service_attributes_service_id ON azure_service_attributes(service_id);
CREATE INDEX IF NOT EXISTS idx_azure_service_attributes_name ON azure_service_attributes(attribute_name);

-- Data migrations (idempotent one-time data tasks)
CREATE TABLE IF NOT EXISTS data_migrations (
  id TEXT PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);




