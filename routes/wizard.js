// Wizard routes for server-side rendering
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Get root node
 */
function getRootNode(db) {
    return db.prepare(`
        SELECT * FROM nodes WHERE nodeType = 'root' LIMIT 1
    `).get();
}

/**
 * Get node by ID
 */
function getNodeById(db, nodeId) {
    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(nodeId);
    if (!node) return null;
    
    // Parse JSON fields
    node.tags = parseJsonArray(node.tags);
    node.azObjectives = parseJsonArray(node.azObjectives);
    node.roleFocus = parseJsonArray(node.roleFocus);
    
    return node;
}

/**
 * Get options for a node
 */
function getOptionsForNode(db, nodeId) {
    const options = db.prepare(`
        SELECT * FROM options WHERE nodeId = ? ORDER BY label
    `).all(nodeId);
    
    // Debug: Log what we're finding
    if (nodeId === 'root' && options.length === 0) {
        const allOptions = db.prepare('SELECT COUNT(*) as count FROM options').get();
        const rootOptions = db.prepare('SELECT id, nodeId, label FROM options WHERE nodeId = ?').all('root');
        console.log(`[getOptionsForNode] DEBUG: Total options in DB: ${allOptions.count}`);
        console.log(`[getOptionsForNode] DEBUG: Root options found: ${rootOptions.length}`);
        if (rootOptions.length > 0) {
            console.log(`[getOptionsForNode] DEBUG: First root option:`, rootOptions[0]);
        }
    }
    
    return options.map(opt => ({
        ...opt,
        pros: parseJsonArray(opt.pros),
        cons: parseJsonArray(opt.cons)
    }));
}

/**
 * Get next node from path
 */
function getNextNodeId(db, fromNodeId, optionId) {
    const path = db.prepare(`
        SELECT toNodeId FROM paths 
        WHERE fromNodeId = ? AND fromOptionId = ?
    `).get(fromNodeId, optionId);
    
    return path ? path.toNodeId : null;
}

/**
 * Get full path from a node back to root (for breadcrumb reconstruction)
 * Returns array of { fromNodeId, fromOptionId, toNodeId, optionLabel } in order from root to target
 */
function getPathToNode(db, targetNodeId) {
    if (!targetNodeId) return [];
    
    const rootNode = getRootNode(db);
    if (!rootNode || targetNodeId === rootNode.id) {
        return [];
    }
    
    // Trace backwards from target to root by finding which paths lead to each node
    const path = [];
    const visited = new Set(); // Prevent infinite loops
    let current = targetNodeId;
    
    while (current && current !== rootNode.id && !visited.has(current)) {
        visited.add(current);
        
        // Find all paths that lead TO current node
        const incomingPaths = db.prepare(`
            SELECT p.fromNodeId, p.fromOptionId, p.toNodeId, o.label as optionLabel
            FROM paths p
            LEFT JOIN options o ON p.fromNodeId = o.nodeId AND p.fromOptionId = o.id
            WHERE p.toNodeId = ?
        `).all(current);
        
        if (incomingPaths.length === 0) {
            break; // Can't go further back
        }
        
        // Use the first path (if multiple, just pick one)
        const incomingPath = incomingPaths[0];
        path.unshift({
            fromNodeId: incomingPath.fromNodeId,
            fromOptionId: incomingPath.fromOptionId,
            toNodeId: incomingPath.toNodeId,
            optionLabel: incomingPath.optionLabel || null
        });
        
        current = incomingPath.fromNodeId;
    }
    
    return path;
}

/**
 * Get recipe for node - ALWAYS fetches fresh from database (no caching)
 * @param {Object} db - Database connection
 * @param {string} nodeId - Node ID
 * @param {Array<string>} selectedFeatures - Optional array of selected feature IDs for filtering
 */
function getRecipeForNode(db, nodeId, selectedFeatures = null) {
    // Always query database directly - no caching
    const recipe = db.prepare(`
        SELECT * FROM recipes WHERE nodeId = ?
    `).get(nodeId);
    
    if (!recipe) return null;
    
    // Parse JSON fields
    recipe.steps = parseJsonObject(recipe.steps);
    recipe.bicepOutline = parseJsonObject(recipe.bicepOutline);
    recipe.terraformOutline = parseJsonObject(recipe.terraformOutline);
    recipe.links = parseJsonArray(recipe.links);
    recipe.configSchema = parseJsonObject(recipe.configSchema);
    
    // If this is an AI Gateway recipe, filter steps based on selected features
    if (nodeId === 'apim-ai-gateway-recipe' && selectedFeatures && selectedFeatures.length > 0) {
        // Map features to recipe step numbers (handle both old and new granular feature IDs)
        const featureToStepMap = {
            // Token Limits (granular)
            'token-limits': 3,
            'token-limits-request': 3,
            'token-limits-response': 3,
            'token-limits-total': 3,
            'token-limits-precalc': 3,
            'token-limits-per-consumer': 3,
            'token-limits-counter-key': 3,
            // Content Safety (granular)
            'content-safety': 4,
            'content-safety-prompt-injection': 4,
            'content-safety-moderation': 4,
            'content-safety-pii': 4,
            'content-safety-custom-filters': 4,
            // Semantic Caching (granular)
            'semantic-caching': 5,
            'semantic-caching-basic': 5,
            'semantic-caching-threshold': 5,
            'semantic-caching-provider': 5,
            'semantic-caching-invalidation': 5,
            'semantic-caching-cost-opt': 5,
            // Rate Limiting (granular)
            'rate-limiting': 6,
            'rate-limiting-token-based': 6,
            'rate-limiting-request-based': 6,
            'rate-limiting-cost-based': 6,
            'rate-limiting-scope': 6,
            // Monitoring
            'llm-metrics': 6,
            'custom-metrics': 6,
            'alerting': 6,
            'dashboards': 6,
            'log-aggregation': 6,
            'performance-monitoring': 6,
            'cost-tracking': 6,
            // Real-time
            'realtime-api': 7,
            'realtime-websocket': 7,
            'realtime-streaming': 7,
            'realtime-token-limits': 7,
            'realtime-connection-mgmt': 7
        };
        
        // Always include core steps (1, 2, 8)
        const requiredSteps = [1, 2, 8];
        
        // Get step numbers for selected features
        const selectedStepNumbers = new Set(requiredSteps);
        selectedFeatures.forEach(featureId => {
            const stepNum = featureToStepMap[featureId];
            if (stepNum !== null && stepNum !== undefined) {
                selectedStepNumbers.add(stepNum);
            }
        });
        
        // Filter steps array
        if (recipe.steps && Array.isArray(recipe.steps)) {
            recipe.steps = recipe.steps.filter(step => {
                const stepNum = step.number;
                return selectedStepNumbers.has(stepNum);
            });
            
            // Add conditional steps based on selected features
            let stepCounter = recipe.steps.length;
            
            // MCP Support
            if (selectedFeatures.some(f => f.startsWith('mcp-'))) {
                recipe.steps.push({
                    number: ++stepCounter,
                    title: "Configure MCP Support",
                    description: "Set up Model Context Protocol endpoints for tool discovery and invocation by AI agents"
                });
            }
            
            // Load Balancing
            if (selectedFeatures.includes('load-balancing')) {
                recipe.steps.push({
                    number: ++stepCounter,
                    title: "Configure Load Balancing",
                    description: "Set up load balancing across multiple backend providers"
                });
            }
            
            // Circuit Breaker
            if (selectedFeatures.includes('circuit-breaker')) {
                recipe.steps.push({
                    number: ++stepCounter,
                    title: "Configure Circuit Breaker",
                    description: "Set up circuit breaker policies to protect against backend failures"
                });
            }
            
            // Authentication
            if (selectedFeatures.some(f => f.startsWith('auth-'))) {
                recipe.steps.push({
                    number: ++stepCounter,
                    title: "Configure Authentication",
                    description: "Set up authentication policies (OAuth, API keys, certificates, or managed identity)"
                });
            }
            
            // Authorization
            if (selectedFeatures.some(f => f.startsWith('authz-'))) {
                recipe.steps.push({
                    number: ++stepCounter,
                    title: "Configure Authorization",
                    description: "Set up authorization policies (RBAC or policy-based access control)"
                });
            }
            
            // Transformation
            if (selectedFeatures.some(f => f.startsWith('transform-'))) {
                recipe.steps.push({
                    number: ++stepCounter,
                    title: "Configure Request/Response Transformation",
                    description: "Set up transformation policies for headers, body, or query parameters"
                });
            }
            
            // Resilience
            if (selectedFeatures.some(f => f.startsWith('retry-') || f.startsWith('timeout-') || f.startsWith('fallback-') || f === 'health-check')) {
                recipe.steps.push({
                    number: ++stepCounter,
                    title: "Configure Resilience Policies",
                    description: "Set up retry, timeout, fallback, and health check policies"
                });
            }
            
            // Renumber steps sequentially
            recipe.steps.forEach((step, index) => {
                step.number = index + 1;
            });
        }
    }
    
    // CRITICAL: Only add AI Gateway details for APIM AI Gateway recipes
    // For all other recipes, explicitly remove aiGatewayDetails to prevent contamination
    if (nodeId === 'apim-ai-gateway-recipe') {
        // Direct database query - always fresh, no cache
        const aiGatewayData = db.prepare(`
            SELECT metadata FROM azureOfferings 
            WHERE id = 'apim-premium-v2' AND serviceName = 'API Management'
        `).get();
        
        if (aiGatewayData && aiGatewayData.metadata) {
            const metadata = parseJsonObject(aiGatewayData.metadata);
            if (metadata && metadata.aiGatewayDetails) {
                recipe.aiGatewayDetails = metadata.aiGatewayDetails;
                
                // Filter AI Gateway details based on selected features
                if (selectedFeatures && selectedFeatures.length > 0) {
                    recipe.aiGatewayDetails = filterAiGatewayDetails(recipe.aiGatewayDetails, selectedFeatures);
                }
            }
        }
    } else {
        // Explicitly remove aiGatewayDetails from non-APIM recipes to prevent contamination
        if (recipe.aiGatewayDetails) {
            delete recipe.aiGatewayDetails;
        }
    }
    
    return recipe;
}

/**
 * Filter AI Gateway details based on selected features
 * @param {Object} aiGatewayDetails - Full AI Gateway details object
 * @param {Array<string>} selectedFeatures - Selected feature IDs (can be granular)
 * @returns {Object} Filtered AI Gateway details
 */
function filterAiGatewayDetails(aiGatewayDetails, selectedFeatures) {
    const filtered = JSON.parse(JSON.stringify(aiGatewayDetails)); // Deep clone
    
    // Helper to check if any feature in a group is selected
    const hasFeatureGroup = (prefix) => selectedFeatures.some(f => f.startsWith(prefix) || f === prefix.replace('-', ''));
    
    // Filter policies
    if (filtered.policies) {
        // Token Limits (check for any token-limits feature)
        if (!hasFeatureGroup('token-limits') && filtered.policies.tokenLimits) {
            delete filtered.policies.tokenLimits;
        }
        
        // Content Safety (check for any content-safety feature)
        if (!hasFeatureGroup('content-safety') && filtered.policies.contentSafety) {
            delete filtered.policies.contentSafety;
        }
        
        // Semantic Caching (check for any semantic-caching feature)
        if (!hasFeatureGroup('semantic-caching') && filtered.policies.semanticCaching) {
            delete filtered.policies.semanticCaching;
        }
        
        // Rate Limiting (check for any rate-limiting feature)
        if (!hasFeatureGroup('rate-limiting') && filtered.policies.rateLimiting) {
            delete filtered.policies.rateLimiting;
        }
    }
    
    // Filter integration
    if (filtered.integration) {
        // Check for Azure OpenAI (including sub-features)
        if (!selectedFeatures.some(f => f.startsWith('azure-openai')) && filtered.integration.azureOpenAI) {
            delete filtered.integration.azureOpenAI;
        }
        
        // Check for OpenAI (including sub-features)
        if (!selectedFeatures.some(f => f.startsWith('openai') && !f.startsWith('azure-openai')) && filtered.integration.openAI) {
            delete filtered.integration.openAI;
        }
        
        // Microsoft Foundry
        if (!selectedFeatures.includes('microsoft-foundry') && filtered.integration.microsoftFoundry) {
            delete filtered.integration.microsoftFoundry;
        }
        
        // Custom LLM
        if (!selectedFeatures.includes('custom-llm') && filtered.integration.customLLMProviders) {
            delete filtered.integration.customLLMProviders;
        }
        
        // Self-hosted (including sub-features)
        if (!selectedFeatures.some(f => f.startsWith('self-hosted')) && filtered.integration.selfHostedModels) {
            delete filtered.integration.selfHostedModels;
        }
    }
    
    // Filter MCP support (check for any mcp- feature)
    if (!hasFeatureGroup('mcp-') && filtered.mcpSupport) {
        filtered.mcpSupport = { enabled: false };
    }
    
    return filtered;
}

/**
 * Main wizard route - ALWAYS fetches fresh data from database (no caching)
 */
router.get('/', async (req, res) => {
    try {
        // Set headers to prevent browser caching - always fetch fresh
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        // Always get fresh database connection - no caching
        const db = getDatabase();
        const nodeId = req.query.node || null;
        const prevNodeId = req.query.prev || null;
        
        // Direct database queries - always fresh
        let currentNode;
        if (nodeId) {
            currentNode = getNodeById(db, nodeId);
        } else {
            currentNode = getRootNode(db);
        }
        
        if (!currentNode) {
            return res.status(404).send('Node not found');
        }
        
        // Get options for current node - direct database query (not needed for feature-selection)
        const options = currentNode.nodeType === 'feature-selection' ? [] : getOptionsForNode(db, currentNode.id);
        
        // Get selected features from query params if available
        let selectedFeatures = null;
        if (req.query.features) {
            try {
                const featuresData = JSON.parse(decodeURIComponent(req.query.features));
                // Handle both old format (array) and new format (object with features array)
                selectedFeatures = Array.isArray(featuresData) ? featuresData : featuresData.features;
            } catch (e) {
                console.warn('Failed to parse features from query:', e);
            }
        }
        
        // Check if this is a terminal node (has recipe) - direct database query
        const recipe = getRecipeForNode(db, currentNode.id, selectedFeatures);
        const isTerminal = currentNode.nodeType === 'terminal' || !!recipe;
        
        // Get version - direct database query
        const version = db.prepare('SELECT version FROM version ORDER BY updatedAt DESC LIMIT 1').get();
        
        // Get full path for breadcrumb reconstruction (if not at root)
        let pathToNode = [];
        if (currentNode.id && nodeId) {
            pathToNode = getPathToNode(db, currentNode.id);
        }
        
        // Render with fresh data - no caching
        res.render('index', {
            currentNode,
            options: options || [],
            recipe: recipe || null,
            isTerminal: isTerminal || false,
            version: version?.version || '1.0.0',
            nodeId: currentNode.id,
            prevNodeId: prevNodeId,
            pathToNode: pathToNode // Pass path for client-side reconstruction
        });
    } catch (error) {
        console.error('Error rendering wizard:', error);
        res.status(500).send('Internal server error');
    }
});

/**
 * Navigate to next node
 */
router.get('/wizard/navigate', async (req, res) => {
    try {
        const db = getDatabase();
        const { fromNodeId, optionId, features } = req.query;
        
        if (!fromNodeId || !optionId) {
            return res.status(400).json({ error: 'Missing fromNodeId or optionId' });
        }
        
        const nextNodeId = getNextNodeId(db, fromNodeId, optionId);
        
        if (!nextNodeId) {
            return res.status(404).json({ error: 'Path not found' });
        }
        
        // If features were provided (from feature selection), include them in URL
        let redirectUrl = `/?node=${nextNodeId}&prev=${fromNodeId}`;
        if (features) {
            redirectUrl += `&features=${encodeURIComponent(features)}`;
        }
        
        // Include previous node ID in URL so back button knows where to go
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error navigating:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Navigate back one step
 */
router.get('/wizard/back', async (req, res) => {
    try {
        const { currentNodeId, prevNodeId } = req.query;
        
        if (!currentNodeId) {
            return res.status(400).json({ error: 'Missing currentNodeId' });
        }
        
        // Use prevNodeId from query if available (most reliable)
        if (prevNodeId) {
            // Need to get the previous node's previous node if available
            // For now, just go to prevNodeId
            res.redirect(`/?node=${prevNodeId}`);
            return;
        }
        
        // Fallback: try to find previous node from database
        const db = getDatabase();
        const currentNode = getNodeById(db, currentNodeId);
        if (currentNode && currentNode.nodeType === 'root') {
            res.redirect('/');
            return;
        }
        
        // Find which path leads TO the current node (less reliable - multiple paths possible)
        const path = db.prepare(`
            SELECT fromNodeId FROM paths 
            WHERE toNodeId = ?
            LIMIT 1
        `).get(currentNodeId);
        
        if (path && path.fromNodeId) {
            res.redirect(`/?node=${path.fromNodeId}`);
        } else {
            // No previous node found, go to root
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error navigating back:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

