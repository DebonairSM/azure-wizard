-- APIM-specific schema additions

CREATE TABLE IF NOT EXISTS apim_offerings (
  id TEXT PRIMARY KEY,
  sku_name TEXT NOT NULL,
  sku_tier TEXT NOT NULL,
  version TEXT,
  category TEXT,
  description TEXT,
  pricing_model TEXT,
  sla TEXT,
  features TEXT, -- JSON array
  capabilities TEXT, -- JSON array
  limitations TEXT, -- JSON array
  vnet_support BOOLEAN DEFAULT 0,
  multi_region BOOLEAN DEFAULT 0,
  self_hosted_gateway BOOLEAN DEFAULT 0,
  developer_portal BOOLEAN DEFAULT 0,
  analytics BOOLEAN DEFAULT 0,
  ai_gateway BOOLEAN DEFAULT 0,
  production_ready BOOLEAN DEFAULT 0,
  metadata TEXT, -- JSON object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apim_offerings_sku_tier ON apim_offerings(sku_tier);
CREATE INDEX IF NOT EXISTS idx_apim_offerings_category ON apim_offerings(category);
CREATE INDEX IF NOT EXISTS idx_apim_offerings_version ON apim_offerings(version);

-- APIM Policies table
CREATE TABLE IF NOT EXISTS apim_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  scope TEXT, -- JSON array
  description TEXT,
  parameters TEXT, -- JSON object
  xml_template TEXT, -- JSON object
  documentation TEXT,
  compatibility TEXT, -- JSON object
  examples TEXT, -- JSON array
  metadata TEXT, -- JSON object (source, relatedPolicies, etc.)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apim_policies_category ON apim_policies(category);
CREATE INDEX IF NOT EXISTS idx_apim_policies_name ON apim_policies(name);

