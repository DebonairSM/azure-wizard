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
    const node = db.prepare(`
        SELECT * FROM nodes WHERE nodeType = 'root' LIMIT 1
    `).get();
    
    if (!node) return null;
    
    // Parse JSON fields
    node.tags = parseJsonArray(node.tags);
    node.azObjectives = parseJsonArray(node.azObjectives);
    node.roleFocus = parseJsonArray(node.roleFocus);
    
    return node;
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
 * Get recipe for node
 */
function getRecipeForNode(db, nodeId) {
    const recipe = db.prepare(`
        SELECT * FROM recipes WHERE nodeId = ?
    `).get(nodeId);
    
    if (!recipe) return null;
    
    // Parse JSON fields
    recipe.steps = parseJsonObject(recipe.steps);
    recipe.bicepOutline = parseJsonObject(recipe.bicepOutline);
    recipe.terraformOutline = parseJsonObject(recipe.terraformOutline);
    recipe.links = parseJsonArray(recipe.links);
    
    return recipe;
}

/**
 * Main wizard route
 */
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const nodeId = req.query.node || null;
        
        let currentNode;
        if (nodeId) {
            currentNode = getNodeById(db, nodeId);
        } else {
            currentNode = getRootNode(db);
        }
        
        if (!currentNode) {
            return res.status(404).send('Node not found');
        }
        
        // Get options for current node
        const options = getOptionsForNode(db, currentNode.id);
        
        // Ensure options is always an array
        const optionsArray = Array.isArray(options) ? options : [];
        
        // Check if this is a terminal node (has recipe)
        const recipe = getRecipeForNode(db, currentNode.id);
        const isTerminal = currentNode.nodeType === 'terminal' || !!recipe;
        
        // Get version
        const versionRow = db.prepare('SELECT version FROM version ORDER BY updatedAt DESC LIMIT 1').get();
        const version = versionRow?.version || '1.0.0';
        
        res.render('index', {
            currentNode,
            options: optionsArray,
            recipe: recipe || null,
            isTerminal: isTerminal || false,
            version: version,
            nodeId: currentNode.id
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
        const { fromNodeId, optionId } = req.query;
        
        if (!fromNodeId || !optionId) {
            return res.status(400).json({ error: 'Missing fromNodeId or optionId' });
        }
        
        const nextNodeId = getNextNodeId(db, fromNodeId, optionId);
        
        if (!nextNodeId) {
            return res.status(404).json({ error: 'Path not found' });
        }
        
        res.redirect(`/?node=${nextNodeId}`);
    } catch (error) {
        console.error('Error navigating:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

