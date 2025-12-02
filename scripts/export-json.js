#!/usr/bin/env node
/**
 * Export SQLite database to JSON format (for backup/compatibility)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase, closeDatabase } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseJsonArray(text) {
    if (!text) return [];
    try {
        return JSON.parse(text);
    } catch {
        return [];
    }
}

function parseJsonObject(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

async function exportJson() {
    try {
        const db = getDatabase();
        
        // Get version
        const version = db.prepare('SELECT version FROM version ORDER BY updatedAt DESC LIMIT 1').get();
        const versionStr = version ? version.version : '1.0.0';
        
        // Get all nodes
        const nodes = db.prepare('SELECT * FROM nodes ORDER BY id').all();
        const parsedNodes = nodes.map(node => ({
            ...node,
            tags: parseJsonArray(node.tags),
            azObjectives: parseJsonArray(node.azObjectives),
            roleFocus: parseJsonArray(node.roleFocus)
        }));
        
        // Get all options
        const options = db.prepare('SELECT * FROM options ORDER BY id').all();
        const parsedOptions = options.map(opt => ({
            ...opt,
            pros: parseJsonArray(opt.pros),
            cons: parseJsonArray(opt.cons)
        }));
        
        // Get all paths
        const paths = db.prepare('SELECT * FROM paths ORDER BY fromNodeId, fromOptionId').all();
        
        // Get all recipes
        const recipes = db.prepare('SELECT * FROM recipes ORDER BY id').all();
        const parsedRecipes = recipes.map(recipe => ({
            ...recipe,
            steps: parseJsonObject(recipe.steps),
            bicepOutline: parseJsonObject(recipe.bicepOutline),
            terraformOutline: parseJsonObject(recipe.terraformOutline),
            links: parseJsonArray(recipe.links)
        }));
        
        // Get all components
        const components = db.prepare('SELECT * FROM components ORDER BY id').all();
        const parsedComponents = components.map(comp => ({
            ...comp,
            configSchema: parseJsonObject(comp.configSchema),
            tags: parseJsonArray(comp.tags),
            pros: parseJsonArray(comp.pros),
            cons: parseJsonArray(comp.cons),
            azObjectives: parseJsonArray(comp.azObjectives)
        }));
        
        // Get all compatibility rules
        const compatibilityRules = db.prepare('SELECT * FROM compatibilityRules ORDER BY componentId1, componentId2').all();
        
        // Build JSON structure
        const jsonData = {
            version: versionStr,
            nodes: parsedNodes,
            options: parsedOptions,
            paths: paths,
            recipes: parsedRecipes,
            components: parsedComponents,
            compatibilityRules: compatibilityRules
        };
        
        // Write to file
        const outputPath = path.join(__dirname, '..', 'data', `seed-data-${versionStr}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf8');
        
        console.log(`Exported to: ${outputPath}`);
        console.log(`Nodes: ${parsedNodes.length}`);
        console.log(`Options: ${parsedOptions.length}`);
        console.log(`Paths: ${paths.length}`);
        console.log(`Recipes: ${parsedRecipes.length}`);
        console.log(`Components: ${parsedComponents.length}`);
        console.log(`Compatibility Rules: ${compatibilityRules.length}`);
        
    } catch (error) {
        console.error('Error exporting JSON:', error);
        process.exit(1);
    } finally {
        closeDatabase();
    }
}

exportJson();





