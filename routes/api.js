// API routes for data access
import express from 'express';
import { getDatabase } from '../db/database.js';
import { 
    fetchFunctionsSkus, 
    fetchAppServiceSkus, 
    fetchLogicAppsSkus, 
    fetchServiceBusSkus,
    fetchContainerAppsSkus,
    fetchEventGridSkus,
    fetchEventHubsSkus,
    fetchRelaySkus,
    fetchContainerInstancesSkus,
    fetchAKSSkus,
    fetchBatchSkus,
    fetchAPIMSkus
} from '../scripts/azure-sku-fetchers.js';

const router = express.Router();

/**
 * Parse JSON array from text
 */
function parseJsonArray(text) {
    if (!text) return [];
    try {
        return JSON.parse(text);
    } catch {
        return [];
    }
}

/**
 * Parse JSON object from text
 */
function parseJsonObject(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

/**
 * GET /api/version - Get current data version
 */
router.get('/version', (req, res) => {
    try {
        const db = getDatabase();
        const version = db.prepare(`
            SELECT version, updatedAt FROM version ORDER BY updatedAt DESC LIMIT 1
        `).get();
        
        res.json(version || { version: '1.0.0', updatedAt: null });
    } catch (error) {
        console.error('Error getting version:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/nodes/:id - Get node by ID
 */
router.get('/nodes/:id', (req, res) => {
    try {
        const db = getDatabase();
        const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
        
        if (!node) {
            return res.status(404).json({ error: 'Node not found' });
        }
        
        // Parse JSON fields
        node.tags = parseJsonArray(node.tags);
        node.azObjectives = parseJsonArray(node.azObjectives);
        node.roleFocus = parseJsonArray(node.roleFocus);
        
        res.json(node);
    } catch (error) {
        console.error('Error getting node:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/nodes - Get all nodes or search
 */
router.get('/nodes', (req, res) => {
    try {
        const db = getDatabase();
        const { search, tag, nodeType } = req.query;
        
        let query = 'SELECT * FROM nodes WHERE 1=1';
        const params = [];
        
        if (search) {
            query += ' AND (question LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        if (nodeType) {
            query += ' AND nodeType = ?';
            params.push(nodeType);
        }
        
        query += ' ORDER BY id';
        
        const nodes = db.prepare(query).all(...params);
        
        // Parse JSON fields
        const parsedNodes = nodes.map(node => ({
            ...node,
            tags: parseJsonArray(node.tags),
            azObjectives: parseJsonArray(node.azObjectives),
            roleFocus: parseJsonArray(node.roleFocus)
        }));
        
        // Filter by tag if specified (client-side since SQLite doesn't handle JSON arrays well)
        let filteredNodes = parsedNodes;
        if (tag) {
            filteredNodes = parsedNodes.filter(node => 
                node.tags && node.tags.includes(tag)
            );
        }
        
        res.json(filteredNodes);
    } catch (error) {
        console.error('Error getting nodes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/options/:nodeId - Get options for a node
 */
router.get('/options/:nodeId', (req, res) => {
    try {
        const db = getDatabase();
        let options;
        
        if (req.params.nodeId === 'all') {
            // Get all options
            options = db.prepare('SELECT * FROM options ORDER BY nodeId, label').all();
        } else {
            // Get options for specific node
            options = db.prepare(`
                SELECT * FROM options WHERE nodeId = ? ORDER BY label
            `).all(req.params.nodeId);
        }
        
        const parsedOptions = options.map(opt => ({
            ...opt,
            pros: parseJsonArray(opt.pros),
            cons: parseJsonArray(opt.cons)
        }));
        
        res.json(parsedOptions);
    } catch (error) {
        console.error('Error getting options:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/paths - Get path from node/option or all paths
 */
router.get('/paths', (req, res) => {
    try {
        const db = getDatabase();
        const { fromNodeId, fromOptionId, all } = req.query;
        
        if (all === 'true') {
            // Get all paths
            const paths = db.prepare('SELECT * FROM paths ORDER BY fromNodeId, fromOptionId').all();
            return res.json(paths);
        }
        
        if (!fromNodeId || !fromOptionId) {
            return res.status(400).json({ error: 'Missing fromNodeId or fromOptionId' });
        }
        
        const path = db.prepare(`
            SELECT * FROM paths 
            WHERE fromNodeId = ? AND fromOptionId = ?
        `).get(fromNodeId, fromOptionId);
        
        if (!path) {
            return res.status(404).json({ error: 'Path not found' });
        }
        
        res.json(path);
    } catch (error) {
        console.error('Error getting path:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/recipes/:nodeId - Get recipe for node or all recipes
 */
router.get('/recipes/:nodeId', (req, res) => {
    try {
        const db = getDatabase();
        
        // Check if requesting all recipes via query param
        if (req.query.all === 'true') {
            const recipes = db.prepare('SELECT * FROM recipes ORDER BY id').all();
            const parsedRecipes = recipes.map(recipe => ({
                ...recipe,
                steps: parseJsonObject(recipe.steps),
                bicepOutline: parseJsonObject(recipe.bicepOutline),
                terraformOutline: parseJsonObject(recipe.terraformOutline),
                links: parseJsonArray(recipe.links),
                configSchema: parseJsonObject(recipe.configSchema)
            }));
            return res.json(parsedRecipes);
        }
        
        const recipe = db.prepare(`
            SELECT * FROM recipes WHERE nodeId = ?
        `).get(req.params.nodeId);
        
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        // Parse JSON fields
        recipe.steps = parseJsonObject(recipe.steps);
        recipe.bicepOutline = parseJsonObject(recipe.bicepOutline);
        recipe.terraformOutline = parseJsonObject(recipe.terraformOutline);
        recipe.links = parseJsonArray(recipe.links);
        recipe.configSchema = parseJsonObject(recipe.configSchema);
        
        res.json(recipe);
    } catch (error) {
        console.error('Error getting recipe:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/components - Get all components
 */
router.get('/components', (req, res) => {
    try {
        const db = getDatabase();
        const { category, search } = req.query;
        
        let query = 'SELECT * FROM components WHERE 1=1';
        const params = [];
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        query += ' ORDER BY name';
        
        const components = db.prepare(query).all(...params);
        
        // Parse JSON fields
        const parsedComponents = components.map(comp => ({
            ...comp,
            configSchema: parseJsonObject(comp.configSchema),
            tags: parseJsonArray(comp.tags),
            pros: parseJsonArray(comp.pros),
            cons: parseJsonArray(comp.cons),
            azObjectives: parseJsonArray(comp.azObjectives)
        }));
        
        // Filter by search if specified
        let filtered = parsedComponents;
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = parsedComponents.filter(comp =>
                (comp.name && comp.name.toLowerCase().includes(searchLower)) ||
                (comp.description && comp.description.toLowerCase().includes(searchLower))
            );
        }
        
        res.json(filtered);
    } catch (error) {
        console.error('Error getting components:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/components/:id - Get component by ID
 */
router.get('/components/:id', (req, res) => {
    try {
        const db = getDatabase();
        const component = db.prepare('SELECT * FROM components WHERE id = ?').get(req.params.id);
        
        if (!component) {
            return res.status(404).json({ error: 'Component not found' });
        }
        
        // Parse JSON fields
        component.configSchema = parseJsonObject(component.configSchema);
        component.tags = parseJsonArray(component.tags);
        component.pros = parseJsonArray(component.pros);
        component.cons = parseJsonArray(component.cons);
        component.azObjectives = parseJsonArray(component.azObjectives);
        
        res.json(component);
    } catch (error) {
        console.error('Error getting component:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/compatibility - Get compatibility rules
 */
router.get('/compatibility', (req, res) => {
    try {
        const db = getDatabase();
        const { componentId1, componentId2 } = req.query;
        
        let query = 'SELECT * FROM compatibilityRules WHERE 1=1';
        const params = [];
        
        if (componentId1) {
            query += ' AND (componentId1 = ? OR componentId2 = ?)';
            params.push(componentId1, componentId1);
        }
        
        if (componentId2) {
            query += ' AND (componentId1 = ? OR componentId2 = ?)';
            params.push(componentId2, componentId2);
        }
        
        const rules = db.prepare(query).all(...params);
        res.json(rules);
    } catch (error) {
        console.error('Error getting compatibility rules:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/nodes - Create node
 */
router.post('/nodes', (req, res) => {
    try {
        const db = getDatabase();
        const { id, question, description, nodeType, tags, azObjectives, roleFocus } = req.body;
        
        if (!id || !nodeType) {
            return res.status(400).json({ error: 'Missing required fields: id, nodeType' });
        }
        
        const insert = db.prepare(`
            INSERT INTO nodes (id, question, description, nodeType, tags, azObjectives, roleFocus)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        insert.run(
            id,
            question || null,
            description || null,
            nodeType,
            tags ? JSON.stringify(tags) : null,
            azObjectives ? JSON.stringify(azObjectives) : null,
            roleFocus ? JSON.stringify(roleFocus) : null
        );
        
        res.status(201).json({ id, message: 'Node created' });
    } catch (error) {
        console.error('Error creating node:', error);
        if (error.code === 'SQLITE_CONSTRAINT' || error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(409).json({ error: 'Node already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

/**
 * POST /api/options - Create option
 */
router.post('/options', (req, res) => {
    try {
        const db = getDatabase();
        const { id, nodeId, label, description, pros, cons, whenToUse, whenNotToUse } = req.body;
        
        if (!id || !nodeId || !label) {
            return res.status(400).json({ error: 'Missing required fields: id, nodeId, label' });
        }
        
        const insert = db.prepare(`
            INSERT INTO options (id, nodeId, label, description, pros, cons, whenToUse, whenNotToUse)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        insert.run(
            id,
            nodeId,
            label,
            description || null,
            pros ? JSON.stringify(pros) : null,
            cons ? JSON.stringify(cons) : null,
            whenToUse || null,
            whenNotToUse || null
        );
        
        // Update version
        db.prepare(`INSERT INTO version (version, updatedAt) VALUES (datetime('now'), CURRENT_TIMESTAMP)`).run();
        
        res.status(201).json({ id, message: 'Option created' });
    } catch (error) {
        console.error('Error creating option:', error);
        if (error.code === 'SQLITE_CONSTRAINT' || error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(409).json({ error: 'Option already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

/**
 * PUT /api/options/:id - Update option
 */
router.put('/options/:id', (req, res) => {
    try {
        const db = getDatabase();
        const { nodeId, label, description, pros, cons, whenToUse, whenNotToUse } = req.body;
        
        // Check if option exists
        const existing = db.prepare('SELECT id FROM options WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Option not found' });
        }
        
        const update = db.prepare(`
            UPDATE options 
            SET nodeId = COALESCE(?, nodeId),
                label = COALESCE(?, label),
                description = ?,
                pros = ?,
                cons = ?,
                whenToUse = ?,
                whenNotToUse = ?
            WHERE id = ?
        `);
        
        update.run(
            nodeId || null,
            label || null,
            description || null,
            pros ? JSON.stringify(pros) : null,
            cons ? JSON.stringify(cons) : null,
            whenToUse || null,
            whenNotToUse || null,
            req.params.id
        );
        
        // Update version
        db.prepare(`INSERT INTO version (version, updatedAt) VALUES (datetime('now'), CURRENT_TIMESTAMP)`).run();
        
        res.json({ id: req.params.id, message: 'Option updated' });
    } catch (error) {
        console.error('Error updating option:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/options/batch - Batch create or update options
 */
router.post('/options/batch', (req, res) => {
    try {
        const db = getDatabase();
        const { newOptions = [], enrichedOptions = [] } = req.body;
        
        if (!Array.isArray(newOptions) || !Array.isArray(enrichedOptions)) {
            return res.status(400).json({ error: 'newOptions and enrichedOptions must be arrays' });
        }
        
        const insert = db.prepare(`
            INSERT INTO options (id, nodeId, label, description, pros, cons, whenToUse, whenNotToUse)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        let created = 0;
        let updated = 0;
        
        // Insert new options
        for (const opt of newOptions) {
            if (!opt.id || !opt.nodeId || !opt.label) {
                console.warn('Skipping invalid option:', opt);
                continue;
            }
            
            try {
                insert.run(
                    opt.id,
                    opt.nodeId,
                    opt.label,
                    opt.description || null,
                    opt.pros ? JSON.stringify(opt.pros) : null,
                    opt.cons ? JSON.stringify(opt.cons) : null,
                    opt.whenToUse || null,
                    opt.whenNotToUse || null
                );
                created++;
            } catch (error) {
                if (error.code === 'SQLITE_CONSTRAINT') {
                    // Option already exists, skip
                    console.warn(`Option ${opt.id} already exists, skipping`);
                } else {
                    throw error;
                }
            }
        }
        
        // Update enriched options (match by nodeId and label)
        for (const opt of enrichedOptions) {
            if (!opt.label || !opt.nodeId) {
                console.warn('Skipping enriched option without label or nodeId:', opt);
                continue;
            }
            
            // Find the option by nodeId and label
            const existing = db.prepare(`
                SELECT id, nodeId, label FROM options 
                WHERE nodeId = ? AND LOWER(label) = LOWER(?)
            `).get(opt.nodeId, opt.label);
            
            if (existing) {
                // Build dynamic update query to only update provided fields
                const updates = [];
                const values = [];
                
                if (opt.description !== undefined) {
                    updates.push('description = ?');
                    values.push(opt.description || null);
                }
                if (opt.pros !== undefined) {
                    updates.push('pros = ?');
                    values.push(opt.pros ? JSON.stringify(opt.pros) : null);
                }
                if (opt.cons !== undefined) {
                    updates.push('cons = ?');
                    values.push(opt.cons ? JSON.stringify(opt.cons) : null);
                }
                if (opt.whenToUse !== undefined) {
                    updates.push('whenToUse = ?');
                    values.push(opt.whenToUse || null);
                }
                if (opt.whenNotToUse !== undefined) {
                    updates.push('whenNotToUse = ?');
                    values.push(opt.whenNotToUse || null);
                }
                
                if (updates.length > 0) {
                    values.push(existing.nodeId, opt.label);
                    const updateQuery = db.prepare(`
                        UPDATE options 
                        SET ${updates.join(', ')}
                        WHERE nodeId = ? AND LOWER(label) = LOWER(?)
                    `);
                    updateQuery.run(...values);
                    updated++;
                }
            } else {
                console.warn(`Enriched option "${opt.label}" not found for nodeId ${opt.nodeId}`);
            }
        }
        
        // Update version
        db.prepare(`INSERT INTO version (version, updatedAt) VALUES (datetime('now'), CURRENT_TIMESTAMP)`).run();
        
        res.json({ 
            message: 'Batch update completed',
            created,
            updated
        });
    } catch (error) {
        console.error('Error in batch update:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/paths - Create path
 */
router.post('/paths', (req, res) => {
    try {
        const db = getDatabase();
        const { fromNodeId, fromOptionId, toNodeId } = req.body;
        
        if (!fromNodeId || !fromOptionId || !toNodeId) {
            return res.status(400).json({ error: 'Missing required fields: fromNodeId, fromOptionId, toNodeId' });
        }
        
        const insert = db.prepare(`
            INSERT INTO paths (fromNodeId, fromOptionId, toNodeId)
            VALUES (?, ?, ?)
        `);
        
        insert.run(fromNodeId, fromOptionId, toNodeId);
        
        res.status(201).json({ message: 'Path created' });
    } catch (error) {
        console.error('Error creating path:', error);
        if (error.code === 'SQLITE_CONSTRAINT' || error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(409).json({ error: 'Path already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

/**
 * POST /api/recipes - Create or update recipe
 */
router.post('/recipes', (req, res) => {
    try {
        const db = getDatabase();
        const { id, nodeId, title, steps, bicepOutline, terraformOutline, links, skillLevel, estimatedTime } = req.body;
        
        if (!nodeId) {
            return res.status(400).json({ error: 'Missing required field: nodeId' });
        }
        
        const recipeId = id || nodeId;
        
        // Check if exists
        const existing = db.prepare('SELECT id FROM recipes WHERE nodeId = ?').get(nodeId);
        
        if (existing) {
            // Update
            const update = db.prepare(`
                UPDATE recipes 
                SET title = ?, steps = ?, bicepOutline = ?, terraformOutline = ?, 
                    links = ?, skillLevel = ?, estimatedTime = ?, updatedAt = CURRENT_TIMESTAMP
                WHERE nodeId = ?
            `);
            
            update.run(
                title || null,
                steps ? JSON.stringify(steps) : null,
                bicepOutline ? JSON.stringify(bicepOutline) : null,
                terraformOutline ? JSON.stringify(terraformOutline) : null,
                links ? JSON.stringify(links) : null,
                skillLevel || null,
                estimatedTime || null,
                nodeId
            );
            
            res.json({ id: recipeId, message: 'Recipe updated' });
        } else {
            // Insert
            const insert = db.prepare(`
                INSERT INTO recipes (id, nodeId, title, steps, bicepOutline, terraformOutline, links, skillLevel, estimatedTime)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            insert.run(
                recipeId,
                nodeId,
                title || null,
                steps ? JSON.stringify(steps) : null,
                bicepOutline ? JSON.stringify(bicepOutline) : null,
                terraformOutline ? JSON.stringify(terraformOutline) : null,
                links ? JSON.stringify(links) : null,
                skillLevel || null,
                estimatedTime || null
            );
            
            res.status(201).json({ id: recipeId, message: 'Recipe created' });
        }
    } catch (error) {
        console.error('Error creating recipe:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-offerings - Get all APIM offerings or filter by criteria
 */
router.get('/apim-offerings', (req, res) => {
    try {
        const db = getDatabase();
        const { skuTier, version, category, productionReady, feature } = req.query;
        
        let query = 'SELECT * FROM apimOfferings WHERE 1=1';
        const params = [];
        
        if (skuTier) {
            query += ' AND skuTier = ?';
            params.push(skuTier);
        }
        
        if (version) {
            query += ' AND version = ?';
            params.push(version);
        }
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (productionReady !== undefined) {
            query += ' AND productionReady = ?';
            params.push(productionReady === 'true' ? 1 : 0);
        }
        
        if (feature) {
            // Filter by feature flags
            const featureMap = {
                'vnet': 'vnetSupport = 1',
                'multiRegion': 'multiRegion = 1',
                'selfHostedGateway': 'selfHostedGateway = 1',
                'developerPortal': 'developerPortal = 1',
                'analytics': 'analytics = 1',
                'aiGateway': 'aiGateway = 1',
                'mcp': 'mcpSupport = 1',
                'websocket': 'websocketSupport = 1'
            };
            if (featureMap[feature]) {
                query += ` AND ${featureMap[feature]}`;
            }
        }
        
        query += ' ORDER BY skuTier, version';
        
        const offerings = db.prepare(query).all(...params);
        
        // Parse JSON fields
        const parsedOfferings = offerings.map(offering => ({
            ...offering,
            pricingInfo: parseJsonObject(offering.pricingInfo),
            features: parseJsonArray(offering.features),
            capabilities: parseJsonArray(offering.capabilities),
            limitations: parseJsonArray(offering.limitations),
            useCases: parseJsonArray(offering.useCases),
            documentationLinks: parseJsonArray(offering.documentationLinks),
            aiGatewayDetails: parseJsonObject(offering.aiGatewayDetails),
            vnetSupport: offering.vnetSupport === 1,
            multiRegion: offering.multiRegion === 1,
            selfHostedGateway: offering.selfHostedGateway === 1,
            developerPortal: offering.developerPortal === 1,
            analytics: offering.analytics === 1,
            aiGateway: offering.aiGateway === 1,
            mcpSupport: offering.mcpSupport === 1,
            websocketSupport: offering.websocketSupport === 1,
            productionReady: offering.productionReady === 1
        }));
        
        res.json(parsedOfferings);
    } catch (error) {
        console.error('Error getting APIM offerings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-offerings/:id - Get specific APIM offering by ID
 */
router.get('/apim-offerings/:id', (req, res) => {
    try {
        const db = getDatabase();
        const offering = db.prepare('SELECT * FROM apimOfferings WHERE id = ?').get(req.params.id);
        
        if (!offering) {
            return res.status(404).json({ error: 'APIM offering not found' });
        }
        
        // Parse JSON fields
        const parsedOffering = {
            ...offering,
            pricingInfo: parseJsonObject(offering.pricingInfo),
            features: parseJsonArray(offering.features),
            capabilities: parseJsonArray(offering.capabilities),
            limitations: parseJsonArray(offering.limitations),
            useCases: parseJsonArray(offering.useCases),
            documentationLinks: parseJsonArray(offering.documentationLinks),
            aiGatewayDetails: parseJsonObject(offering.aiGatewayDetails),
            vnetSupport: offering.vnetSupport === 1,
            multiRegion: offering.multiRegion === 1,
            selfHostedGateway: offering.selfHostedGateway === 1,
            developerPortal: offering.developerPortal === 1,
            analytics: offering.analytics === 1,
            aiGateway: offering.aiGateway === 1,
            mcpSupport: offering.mcpSupport === 1,
            websocketSupport: offering.websocketSupport === 1,
            productionReady: offering.productionReady === 1
        };
        
        res.json(parsedOffering);
    } catch (error) {
        console.error('Error getting APIM offering:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-offerings/summary/categories - Get offerings grouped by category
 */
router.get('/apim-offerings/summary/categories', (req, res) => {
    try {
        const db = getDatabase();
        const summary = db.prepare(`
            SELECT 
                category,
                COUNT(*) as count,
                GROUP_CONCAT(skuName) as skuNames
            FROM apimOfferings
            GROUP BY category
            ORDER BY category
        `).all();
        
        res.json(summary);
    } catch (error) {
        console.error('Error getting APIM offerings summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-offerings/summary/versions - Get offerings grouped by version
 */
router.get('/apim-offerings/summary/versions', (req, res) => {
    try {
        const db = getDatabase();
        const summary = db.prepare(`
            SELECT 
                version,
                COUNT(*) as count,
                GROUP_CONCAT(skuName) as skuNames
            FROM apimOfferings
            GROUP BY version
            ORDER BY version
        `).all();
        
        res.json(summary);
    } catch (error) {
        console.error('Error getting APIM offerings summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-offerings/ai-gateway-features - Get AI Gateway feature matrix across all tiers
 */
router.get('/apim-offerings/ai-gateway-features', (req, res) => {
    try {
        const db = getDatabase();
        const offerings = db.prepare(`
            SELECT 
                id, 
                skuName, 
                skuTier,
                version,
                aiGateway,
                mcpSupport,
                websocketSupport,
                aiGatewayDetails
            FROM apimOfferings
            ORDER BY 
                CASE version 
                    WHEN 'v2' THEN 2 
                    WHEN 'v1' THEN 1 
                    ELSE 0 
                END DESC,
                CASE category
                    WHEN 'premium' THEN 4
                    WHEN 'v2' THEN 3
                    WHEN 'standard' THEN 2
                    WHEN 'consumption' THEN 1
                    ELSE 0
                END DESC
        `).all();
        
        // Build feature matrix
        const featureMatrix = offerings.map(offering => {
            const details = parseJsonObject(offering.aiGatewayDetails);
            
            return {
                id: offering.id,
                skuName: offering.skuName,
                skuTier: offering.skuTier,
                version: offering.version,
                aiGatewaySupported: offering.aiGateway === 1,
                aiGatewaySupportLevel: details?.level || (offering.aiGateway === 1 ? 'basic' : 'none'),
                features: {
                    trafficMediation: {
                        supported: details?.trafficMediation ? true : false,
                        apiImportTypes: details?.trafficMediation?.apiImportTypes || [],
                        modelDeployments: details?.trafficMediation?.modelDeployments || [],
                        mcpCapabilities: details?.trafficMediation?.mcpCapabilities || {}
                    },
                    tokenRateLimiting: details?.scalabilityPolicies?.tokenRateLimiting?.supported || false,
                    semanticCaching: details?.scalabilityPolicies?.semanticCaching?.supported || false,
                    loadBalancing: details?.scalabilityPolicies?.loadBalancing?.supported || false,
                    circuitBreaker: details?.scalabilityPolicies?.circuitBreaker?.supported || false,
                    contentModeration: details?.securityPolicies?.contentModeration?.supported || false,
                    tokenMetrics: details?.observability?.tokenMetrics?.supported || false,
                    promptLogging: details?.observability?.logging?.promptLogging || false,
                    mcpServer: offering.mcpSupport === 1,
                    websocket: offering.websocketSupport === 1
                }
            };
        });
        
        res.json(featureMatrix);
    } catch (error) {
        console.error('Error getting AI Gateway features:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-offerings/:id/ai-gateway - Get detailed AI Gateway info for specific tier
 */
router.get('/apim-offerings/:id/ai-gateway', (req, res) => {
    try {
        const db = getDatabase();
        const offering = db.prepare(`
            SELECT 
                id,
                skuName,
                skuTier,
                version,
                aiGateway,
                mcpSupport,
                websocketSupport,
                aiGatewayDetails
            FROM apimOfferings 
            WHERE id = ?
        `).get(req.params.id);
        
        if (!offering) {
            return res.status(404).json({ error: 'APIM offering not found' });
        }
        
        const aiGatewayDetails = parseJsonObject(offering.aiGatewayDetails);
        
        if (!aiGatewayDetails || !aiGatewayDetails.supported) {
            return res.json({
                id: offering.id,
                skuName: offering.skuName,
                skuTier: offering.skuTier,
                version: offering.version,
                supported: false,
                reason: aiGatewayDetails?.reason || 'AI Gateway features are not available in this tier'
            });
        }
        
        res.json({
            id: offering.id,
            skuName: offering.skuName,
            skuTier: offering.skuTier,
            version: offering.version,
            supported: true,
            ...aiGatewayDetails
        });
    } catch (error) {
        console.error('Error getting AI Gateway details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-offerings/ai-gateway/policies - Get all AI Gateway policies across tiers
 * Query params: policyType (tokenRateLimiting, semanticCaching, loadBalancing, circuitBreaker, contentModeration, tokenMetrics)
 */
router.get('/apim-offerings/ai-gateway/policies', (req, res) => {
    try {
        const db = getDatabase();
        const { policyType } = req.query;
        
        const offerings = db.prepare(`
            SELECT 
                id,
                skuName,
                skuTier,
                version,
                aiGateway,
                aiGatewayDetails
            FROM apimOfferings
            WHERE aiGateway = 1
            ORDER BY 
                CASE version 
                    WHEN 'v2' THEN 2 
                    WHEN 'v1' THEN 1 
                    ELSE 0 
                END DESC,
                skuTier DESC
        `).all();
        
        const policies = offerings.map(offering => {
            const details = parseJsonObject(offering.aiGatewayDetails);
            
            if (!details || !details.scalabilityPolicies) {
                return null;
            }
            
            let policyData = null;
            
            if (!policyType || policyType === 'all') {
                policyData = details.scalabilityPolicies;
            } else {
                const policyMap = {
                    tokenRateLimiting: details.scalabilityPolicies?.tokenRateLimiting,
                    semanticCaching: details.scalabilityPolicies?.semanticCaching,
                    loadBalancing: details.scalabilityPolicies?.loadBalancing,
                    circuitBreaker: details.scalabilityPolicies?.circuitBreaker,
                    contentModeration: details.securityPolicies?.contentModeration,
                    tokenMetrics: details.observability?.tokenMetrics
                };
                policyData = policyMap[policyType];
            }
            
            return {
                tier: {
                    id: offering.id,
                    skuName: offering.skuName,
                    skuTier: offering.skuTier,
                    version: offering.version
                },
                policies: policyData
            };
        }).filter(p => p !== null);
        
        res.json(policies);
    } catch (error) {
        console.error('Error getting AI Gateway policies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-offerings/ai-gateway/comparison - Compare AI Gateway capabilities between tiers
 * Query params: tiers (comma-separated list of offering IDs)
 */
router.get('/apim-offerings/ai-gateway/comparison', (req, res) => {
    try {
        const db = getDatabase();
        const { tiers } = req.query;
        
        if (!tiers) {
            return res.status(400).json({ error: 'Missing required parameter: tiers (comma-separated offering IDs)' });
        }
        
        const tierIds = tiers.split(',').map(t => t.trim());
        const placeholders = tierIds.map(() => '?').join(',');
        
        const offerings = db.prepare(`
            SELECT 
                id,
                skuName,
                skuTier,
                version,
                aiGateway,
                mcpSupport,
                websocketSupport,
                aiGatewayDetails
            FROM apimOfferings
            WHERE id IN (${placeholders})
            ORDER BY 
                CASE version 
                    WHEN 'v2' THEN 2 
                    WHEN 'v1' THEN 1 
                    ELSE 0 
                END DESC,
                skuTier DESC
        `).all(...tierIds);
        
        const comparison = offerings.map(offering => {
            const details = parseJsonObject(offering.aiGatewayDetails);
            
            return {
                tier: {
                    id: offering.id,
                    skuName: offering.skuName,
                    skuTier: offering.skuTier,
                    version: offering.version
                },
                supported: offering.aiGateway === 1,
                supportLevel: details?.level || 'none',
                capabilities: {
                    trafficMediation: details?.trafficMediation || null,
                    scalabilityPolicies: details?.scalabilityPolicies || null,
                    securityPolicies: details?.securityPolicies || null,
                    resiliency: details?.resiliency || null,
                    observability: details?.observability || null,
                    developerExperience: details?.developerExperience || null
                },
                limitations: details?.limitations || [],
                documentation: details?.documentation || []
            };
        });
        
        res.json(comparison);
    } catch (error) {
        console.error('Error comparing AI Gateway capabilities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/azure-offerings - Get Azure offerings from extensible table
 * Query params: serviceName, version, skuTier, category, isProductionReady, isRecommended
 */
router.get('/azure-offerings', (req, res) => {
    try {
        const db = getDatabase();
        const { serviceName, version, skuTier, category, isProductionReady, isRecommended } = req.query;
        
        let query = 'SELECT * FROM azureOfferings WHERE 1=1';
        const params = [];
        
        if (serviceName) {
            query += ' AND serviceName = ?';
            params.push(serviceName);
        }
        
        if (version) {
            query += ' AND version = ?';
            params.push(version);
        }
        
        if (skuTier) {
            query += ' AND skuTier = ?';
            params.push(skuTier);
        }
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (isProductionReady !== undefined) {
            query += ' AND isProductionReady = ?';
            params.push(isProductionReady === 'true' ? 1 : 0);
        }
        
        if (isRecommended !== undefined) {
            query += ' AND isRecommended = ?';
            params.push(isRecommended === 'true' ? 1 : 0);
        }
        
        query += ' ORDER BY serviceName, skuTier';
        
        const offerings = db.prepare(query).all(...params);
        
        // Parse JSON fields
        const parsedOfferings = offerings.map(offering => ({
            ...offering,
            pricingInfo: parseJsonObject(offering.pricingInfo),
            features: parseJsonArray(offering.features),
            capabilities: parseJsonArray(offering.capabilities),
            limitations: parseJsonArray(offering.limitations),
            useCases: parseJsonArray(offering.useCases),
            deploymentOptions: parseJsonArray(offering.deploymentOptions),
            attributes: parseJsonObject(offering.attributes),
            networking: parseJsonObject(offering.networking),
            scaling: parseJsonObject(offering.scaling),
            regions: parseJsonArray(offering.regions),
            documentationLinks: parseJsonArray(offering.documentationLinks),
            metadata: parseJsonObject(offering.metadata),
            isPreview: offering.isPreview === 1,
            isRecommended: offering.isRecommended === 1,
            isProductionReady: offering.isProductionReady === 1
        }));
        
        res.json(parsedOfferings);
    } catch (error) {
        console.error('Error getting Azure offerings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/azure-offerings/:id - Get specific Azure offering by ID
 */
router.get('/azure-offerings/:id', (req, res) => {
    try {
        const db = getDatabase();
        const offering = db.prepare('SELECT * FROM azureOfferings WHERE id = ?').get(req.params.id);
        
        if (!offering) {
            return res.status(404).json({ error: 'Azure offering not found' });
        }
        
        // Parse JSON fields
        const parsedOffering = {
            ...offering,
            pricingInfo: parseJsonObject(offering.pricingInfo),
            features: parseJsonArray(offering.features),
            capabilities: parseJsonArray(offering.capabilities),
            limitations: parseJsonArray(offering.limitations),
            useCases: parseJsonArray(offering.useCases),
            deploymentOptions: parseJsonArray(offering.deploymentOptions),
            attributes: parseJsonObject(offering.attributes),
            networking: parseJsonObject(offering.networking),
            scaling: parseJsonObject(offering.scaling),
            regions: parseJsonArray(offering.regions),
            documentationLinks: parseJsonArray(offering.documentationLinks),
            metadata: parseJsonObject(offering.metadata),
            isPreview: offering.isPreview === 1,
            isRecommended: offering.isRecommended === 1,
            isProductionReady: offering.isProductionReady === 1
        };
        
        res.json(parsedOffering);
    } catch (error) {
        console.error('Error getting Azure offering:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-v2-tiers - Get all APIM V2 tiers from Azure offerings table
 */
router.get('/apim-v2-tiers', (req, res) => {
    try {
        const db = getDatabase();
        const offerings = db.prepare(`
            SELECT * FROM azureOfferings 
            WHERE serviceName = 'API Management' 
            AND version = 'v2'
            ORDER BY 
                CASE skuTier
                    WHEN 'Basic v2' THEN 1
                    WHEN 'Standard v2' THEN 2
                    WHEN 'Premium v2' THEN 3
                    ELSE 4
                END
        `).all();
        
        // Parse JSON fields
        const parsedOfferings = offerings.map(offering => ({
            ...offering,
            pricingInfo: parseJsonObject(offering.pricingInfo),
            features: parseJsonArray(offering.features),
            capabilities: parseJsonArray(offering.capabilities),
            limitations: parseJsonArray(offering.limitations),
            useCases: parseJsonArray(offering.useCases),
            deploymentOptions: parseJsonArray(offering.deploymentOptions),
            attributes: parseJsonObject(offering.attributes),
            networking: parseJsonObject(offering.networking),
            scaling: parseJsonObject(offering.scaling),
            regions: parseJsonArray(offering.regions),
            documentationLinks: parseJsonArray(offering.documentationLinks),
            isPreview: offering.isPreview === 1,
            isRecommended: offering.isRecommended === 1,
            isProductionReady: offering.isProductionReady === 1
        }));
        
        res.json(parsedOfferings);
    } catch (error) {
        console.error('Error getting APIM V2 tiers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-v2-tiers/:tier - Get specific APIM V2 tier (basic-v2, standard-v2, premium-v2)
 */
router.get('/apim-v2-tiers/:tier', (req, res) => {
    try {
        const db = getDatabase();
        const tierId = `apim-${req.params.tier}`;
        const offering = db.prepare(`
            SELECT * FROM azureOfferings 
            WHERE id = ? AND serviceName = 'API Management' AND version = 'v2'
        `).get(tierId);
        
        if (!offering) {
            return res.status(404).json({ error: 'APIM V2 tier not found' });
        }
        
        // Parse JSON fields
        const parsedOffering = {
            ...offering,
            pricingInfo: parseJsonObject(offering.pricingInfo),
            features: parseJsonArray(offering.features),
            capabilities: parseJsonArray(offering.capabilities),
            limitations: parseJsonArray(offering.limitations),
            useCases: parseJsonArray(offering.useCases),
            deploymentOptions: parseJsonArray(offering.deploymentOptions),
            attributes: parseJsonObject(offering.attributes),
            networking: parseJsonObject(offering.networking),
            scaling: parseJsonObject(offering.scaling),
            regions: parseJsonArray(offering.regions),
            documentationLinks: parseJsonArray(offering.documentationLinks),
            isPreview: offering.isPreview === 1,
            isRecommended: offering.isRecommended === 1,
            isProductionReady: offering.isProductionReady === 1
        };
        
        res.json(parsedOffering);
    } catch (error) {
        console.error('Error getting APIM V2 tier:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-compare/:v2TierId/:classicTierId - Compare V2 vs Classic APIM tiers
 * Returns a side-by-side comparison of key features
 */
router.get('/apim-compare/:v2TierId/:classicTierId', (req, res) => {
    try {
        const db = getDatabase();
        
        // Get V2 tier from azureOfferings
        const v2Tier = db.prepare(`
            SELECT * FROM azureOfferings 
            WHERE id = ? AND serviceName = 'API Management' AND version = 'v2'
        `).get(req.params.v2TierId);
        
        // Get classic tier from apimOfferings
        const classicTier = db.prepare(`
            SELECT * FROM apimOfferings WHERE id = ?
        `).get(req.params.classicTierId);
        
        if (!v2Tier) {
            return res.status(404).json({ error: 'V2 tier not found' });
        }
        
        if (!classicTier) {
            return res.status(404).json({ error: 'Classic tier not found' });
        }
        
        // Parse JSON fields for v2Tier
        const parsedV2 = {
            ...v2Tier,
            pricingInfo: parseJsonObject(v2Tier.pricingInfo),
            features: parseJsonArray(v2Tier.features),
            capabilities: parseJsonArray(v2Tier.capabilities),
            limitations: parseJsonArray(v2Tier.limitations),
            attributes: parseJsonObject(v2Tier.attributes),
            networking: parseJsonObject(v2Tier.networking),
            scaling: parseJsonObject(v2Tier.scaling)
        };
        
        // Parse JSON fields for classicTier
        const parsedClassic = {
            ...classicTier,
            pricingInfo: parseJsonObject(classicTier.pricingInfo),
            features: parseJsonArray(classicTier.features),
            capabilities: parseJsonArray(classicTier.capabilities),
            limitations: parseJsonArray(classicTier.limitations)
        };
        
        // Build comparison object
        const comparison = {
            v2Tier: {
                id: parsedV2.id,
                name: parsedV2.skuName,
                sla: parsedV2.sla,
                deploymentTime: parsedV2.attributes?.deploymentTime || 'N/A',
                maxScaleUnits: parsedV2.attributes?.maxScaleUnits || 'N/A',
                vnetSupport: parsedV2.attributes?.vnetSupport || false,
                vnetIntegration: parsedV2.attributes?.vnetIntegration || false,
                vnetInjection: parsedV2.attributes?.vnetInjection || false,
                multiRegion: parsedV2.attributes?.multiRegion || false,
                selfHostedGateway: parsedV2.attributes?.selfHostedGateway || false,
                availabilityZones: parsedV2.attributes?.availabilityZones || false,
                workspaces: parsedV2.attributes?.workspaces || false,
                networking: parsedV2.networking,
                features: parsedV2.features,
                limitations: parsedV2.limitations
            },
            classicTier: {
                id: parsedClassic.id,
                name: parsedClassic.skuName,
                sla: parsedClassic.sla || 'N/A',
                deploymentTime: 'Hours',
                maxScaleUnits: parsedClassic.maxScaleUnits || 'N/A',
                vnetSupport: parsedClassic.vnetSupport === 1,
                multiRegion: parsedClassic.multiRegion === 1,
                selfHostedGateway: parsedClassic.selfHostedGateway === 1,
                features: parsedClassic.features,
                limitations: parsedClassic.limitations
            },
            differences: {
                deploymentSpeed: 'V2: minutes vs Classic: hours',
                networkingModel: parsedV2.networking?.description || 'Different networking capabilities',
                scalingSpeed: parsedV2.scaling?.scalingSpeed || 'V2 offers faster scaling',
                analyticsApproach: 'V2 uses Azure Monitor; Classic has built-in analytics',
                migrationSupport: 'Cannot migrate from Classic to V2 tiers'
            }
        };
        
        res.json(comparison);
    } catch (error) {
        console.error('Error comparing APIM tiers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-all-tiers - Get all APIM tiers (both classic and V2) for comprehensive overview
 */
router.get('/apim-all-tiers', (req, res) => {
    try {
        const db = getDatabase();
        
        // Get classic tiers from apimOfferings
        const classicTiers = db.prepare(`
            SELECT id, skuName, skuTier, version, category, sla, productionReady, 'classic' as source
            FROM apimOfferings
            ORDER BY 
                CASE category
                    WHEN 'consumption' THEN 1
                    WHEN 'standard' THEN 2
                    WHEN 'premium' THEN 3
                    ELSE 4
                END
        `).all();
        
        // Get V2 tiers from azureOfferings
        const v2Tiers = db.prepare(`
            SELECT id, skuName, skuTier, version, category, sla, isProductionReady, 'v2' as source
            FROM azureOfferings
            WHERE serviceName = 'API Management' AND version = 'v2'
            ORDER BY 
                CASE skuTier
                    WHEN 'Basic v2' THEN 1
                    WHEN 'Standard v2' THEN 2
                    WHEN 'Premium v2' THEN 3
                    ELSE 4
                END
        `).all();
        
        // Normalize and combine
        const normalizedClassic = classicTiers.map(t => ({
            id: t.id,
            name: t.skuName,
            tier: t.skuTier,
            version: t.version || 'v1',
            category: t.category,
            sla: t.sla || 'None',
            productionReady: t.productionReady === 1,
            source: 'classic',
            tableSource: 'apimOfferings'
        }));
        
        const normalizedV2 = v2Tiers.map(t => ({
            id: t.id,
            name: t.skuName,
            tier: t.skuTier,
            version: t.version,
            category: t.category,
            sla: t.sla || 'None',
            productionReady: t.isProductionReady === 1,
            source: 'v2',
            tableSource: 'azureOfferings'
        }));
        
        res.json({
            classic: normalizedClassic,
            v2: normalizedV2,
            all: [...normalizedClassic, ...normalizedV2]
        });
    } catch (error) {
        console.error('Error getting all APIM tiers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/azure-resources/load - Load Azure resources and SKUs
 * Body: { service?: string } - Optional service name to load specific service
 */
router.post('/azure-resources/load', async (req, res) => {
    try {
        const db = getDatabase();
        const { service } = req.body;
        
        // Define all services
        const allServices = [
            { name: 'Functions', fetcher: fetchFunctionsSkus },
            { name: 'AppService', fetcher: fetchAppServiceSkus },
            { name: 'ContainerApps', fetcher: fetchContainerAppsSkus },
            { name: 'ContainerInstances', fetcher: fetchContainerInstancesSkus },
            { name: 'AKS', fetcher: fetchAKSSkus },
            { name: 'Batch', fetcher: fetchBatchSkus },
            { name: 'LogicApps', fetcher: fetchLogicAppsSkus },
            { name: 'ServiceBus', fetcher: fetchServiceBusSkus },
            { name: 'EventGrid', fetcher: fetchEventGridSkus },
            { name: 'EventHubs', fetcher: fetchEventHubsSkus },
            { name: 'Relay', fetcher: fetchRelaySkus }
        ];
        
        // Filter to specific service if requested
        const servicesToLoad = service 
            ? allServices.filter(s => s.name.toLowerCase() === service.toLowerCase())
            : allServices;
        
        if (servicesToLoad.length === 0) {
            return res.status(400).json({ error: `Service '${service}' not found` });
        }
        
        let totalLoaded = 0;
        const results = [];
        
        // Prepare insert statement
        const insertStmt = db.prepare(`
            INSERT OR REPLACE INTO azureOfferings (
                id, serviceName, skuName, skuTier, version, category,
                description, purpose, pricingModel, pricingInfo, sla,
                features, capabilities, limitations, useCases,
                deploymentOptions, attributes, networking, scaling,
                regions, documentationLinks,
                isPreview, isRecommended, isProductionReady,
                createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        // Load each service
        for (const serviceDef of servicesToLoad) {
            try {
                console.log(`Loading ${serviceDef.name}...`);
                const offerings = await serviceDef.fetcher({});
                
                if (!offerings || offerings.length === 0) {
                    results.push({ service: serviceDef.name, loaded: 0, error: 'No offerings found' });
                    continue;
                }
                
                let serviceLoaded = 0;
                for (const offering of offerings) {
                    const existing = db.prepare('SELECT id, createdAt FROM azureOfferings WHERE id = ?').get(offering.id);
                    const isNew = !existing;
                    const timestamp = new Date().toISOString();
                    
                    insertStmt.run(
                        offering.id,
                        serviceDef.name,
                        offering.skuName,
                        offering.skuTier || null,
                        offering.version || null,
                        offering.category || null,
                        offering.description || null,
                        offering.purpose || null,
                        offering.pricingModel || null,
                        offering.pricingInfo ? JSON.stringify(offering.pricingInfo) : null,
                        offering.sla || null,
                        offering.features ? JSON.stringify(offering.features) : null,
                        offering.capabilities ? JSON.stringify(offering.capabilities) : null,
                        offering.limitations ? JSON.stringify(offering.limitations) : null,
                        offering.useCases ? JSON.stringify(offering.useCases) : null,
                        offering.deploymentOptions ? JSON.stringify(offering.deploymentOptions) : null,
                        offering.attributes ? JSON.stringify(offering.attributes) : null,
                        offering.networking ? JSON.stringify(offering.networking) : null,
                        offering.scaling ? JSON.stringify(offering.scaling) : null,
                        offering.regions ? JSON.stringify(offering.regions) : null,
                        offering.documentationLinks ? JSON.stringify(offering.documentationLinks) : null,
                        offering.isPreview ? 1 : 0,
                        offering.isRecommended ? 1 : 0,
                        offering.isProductionReady ? 1 : 0,
                        isNew ? timestamp : (existing ? existing.createdAt : timestamp),
                        timestamp
                    );
                    
                    serviceLoaded++;
                    totalLoaded++;
                }
                
                results.push({ service: serviceDef.name, loaded: serviceLoaded });
                console.log(`Loaded ${serviceLoaded} offerings for ${serviceDef.name}`);
            } catch (error) {
                console.error(`Error loading ${serviceDef.name}:`, error);
                results.push({ service: serviceDef.name, loaded: 0, error: error.message });
            }
        }
        
        res.json({ 
            success: true, 
            loaded: totalLoaded,
            results 
        });
    } catch (error) {
        console.error('Error loading Azure resources:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

/**
 * GET /api/apim-policies - Get all APIM policies or filter by criteria
 */
router.get('/apim-policies', (req, res) => {
    try {
        const db = getDatabase();
        const { category, scope, search } = req.query;
        
        let query = 'SELECT * FROM apimPolicies WHERE 1=1';
        const params = [];
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        query += ' ORDER BY category, name';
        
        const policies = db.prepare(query).all(...params);
        
        // Parse JSON fields
        const parsedPolicies = policies.map(policy => ({
            ...policy,
            scope: parseJsonArray(policy.scope),
            parameters: parseJsonObject(policy.parameters),
            xmlTemplate: parseJsonObject(policy.xmlTemplate),
            compatibility: parseJsonObject(policy.compatibility),
            examples: parseJsonArray(policy.examples)
        }));
        
        // Filter by scope if specified (client-side since SQLite doesn't handle JSON arrays well)
        let filteredPolicies = parsedPolicies;
        if (scope) {
            filteredPolicies = parsedPolicies.filter(policy => 
                policy.scope && policy.scope.includes(scope)
            );
        }
        
        res.json(filteredPolicies);
    } catch (error) {
        console.error('Error getting APIM policies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-policies/:id - Get specific APIM policy by ID
 */
router.get('/apim-policies/:id', (req, res) => {
    try {
        const db = getDatabase();
        const policy = db.prepare('SELECT * FROM apimPolicies WHERE id = ?').get(req.params.id);
        
        if (!policy) {
            return res.status(404).json({ error: 'APIM policy not found' });
        }
        
        // Parse JSON fields
        const parsedPolicy = {
            ...policy,
            scope: parseJsonArray(policy.scope),
            parameters: parseJsonObject(policy.parameters),
            xmlTemplate: parseJsonObject(policy.xmlTemplate),
            compatibility: parseJsonObject(policy.compatibility),
            examples: parseJsonArray(policy.examples)
        };
        
        res.json(parsedPolicy);
    } catch (error) {
        console.error('Error getting APIM policy:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-policies/categories - Get policies grouped by category
 */
router.get('/apim-policies/categories', (req, res) => {
    try {
        const db = getDatabase();
        const summary = db.prepare(`
            SELECT 
                category,
                COUNT(*) as count,
                GROUP_CONCAT(name) as policyNames
            FROM apimPolicies
            GROUP BY category
            ORDER BY category
        `).all();
        
        res.json(summary);
    } catch (error) {
        console.error('Error getting APIM policy categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/apim-policy-configurations - Create or update policy configuration
 */
router.post('/apim-policy-configurations', (req, res) => {
    try {
        const db = getDatabase();
        const { id, policyId, scope, scopeId, configuration, bicepResource } = req.body;
        
        if (!policyId || !scope) {
            return res.status(400).json({ error: 'Missing required fields: policyId, scope' });
        }
        
        const configId = id || `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Check if exists
        const existing = db.prepare('SELECT id FROM apimPolicyConfigurations WHERE id = ?').get(configId);
        
        if (existing) {
            // Update
            const update = db.prepare(`
                UPDATE apimPolicyConfigurations 
                SET policyId = ?, scope = ?, scopeId = ?, configuration = ?, bicepResource = ?, updatedAt = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            
            update.run(
                policyId,
                scope,
                scopeId || null,
                configuration ? JSON.stringify(configuration) : null,
                bicepResource || null,
                configId
            );
            
            res.json({ id: configId, message: 'Policy configuration updated' });
        } else {
            // Insert
            const insert = db.prepare(`
                INSERT INTO apimPolicyConfigurations (id, policyId, scope, scopeId, configuration, bicepResource)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            
            insert.run(
                configId,
                policyId,
                scope,
                scopeId || null,
                configuration ? JSON.stringify(configuration) : null,
                bicepResource || null
            );
            
            res.status(201).json({ id: configId, message: 'Policy configuration created' });
        }
    } catch (error) {
        console.error('Error creating/updating policy configuration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/apim-policy-configurations/:id - Get policy configuration by ID
 */
router.get('/apim-policy-configurations/:id', (req, res) => {
    try {
        const db = getDatabase();
        const config = db.prepare('SELECT * FROM apimPolicyConfigurations WHERE id = ?').get(req.params.id);
        
        if (!config) {
            return res.status(404).json({ error: 'Policy configuration not found' });
        }
        
        // Parse JSON fields
        const parsedConfig = {
            ...config,
            configuration: parseJsonObject(config.configuration)
        };
        
        res.json(parsedConfig);
    } catch (error) {
        console.error('Error getting policy configuration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/apim-policies/generate-bicep - Generate Bicep template from policy configurations
 */
router.post('/apim-policies/generate-bicep', async (req, res) => {
    try {
        const { configurations, scope, scopeId, parentResource } = req.body;
        
        if (!configurations || !Array.isArray(configurations) || configurations.length === 0) {
            return res.status(400).json({ error: 'Missing or empty configurations array' });
        }
        
        if (!scope) {
            return res.status(400).json({ error: 'Missing required field: scope' });
        }
        
        // Import policy generator
        const { generateCombinedBicep } = await import('../js/apim-policy-generator.js');
        
        // Generate combined Bicep for all configurations
        const bicep = await generateCombinedBicep(configurations, scope, scopeId, parentResource || 'apiResource');
        
        res.json({
            bicep: bicep,
            resources: 1
        });
    } catch (error) {
        console.error('Error generating Bicep:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

export default router;

