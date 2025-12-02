#!/usr/bin/env node
/**
 * Migrate data from seed-data.json to SQLite database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_PATH = path.join(__dirname, '..', 'data', 'seed-data.json');

/**
 * Parse JSON array stored as text
 */
function parseJsonArray(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

/**
 * Stringify JSON array to text
 */
function stringifyJsonArray(arr) {
    if (!arr || !Array.isArray(arr)) return null;
    return JSON.stringify(arr);
}

/**
 * Stringify JSON object to text
 */
function stringifyJsonObject(obj) {
    if (!obj || typeof obj !== 'object') return null;
    return JSON.stringify(obj);
}

async function migrate() {
    console.log('Starting migration from JSON to SQLite...');

    // Read JSON file
    if (!fs.existsSync(JSON_PATH)) {
        console.error(`JSON file not found: ${JSON_PATH}`);
        process.exit(1);
    }

    const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`Loaded JSON data version: ${jsonData.version}`);

    // Initialize database
    const db = initDatabase();

    try {
        // Start transaction
        const transaction = db.transaction(() => {
            // Clear existing data
            console.log('Clearing existing data...');
            db.prepare('DELETE FROM compatibilityRules').run();
            db.prepare('DELETE FROM components').run();
            db.prepare('DELETE FROM recipes').run();
            db.prepare('DELETE FROM paths').run();
            db.prepare('DELETE FROM options').run();
            db.prepare('DELETE FROM nodes').run();
            db.prepare('DELETE FROM version').run();

            // Insert version
            console.log('Inserting version...');
            db.prepare(`
                INSERT INTO version (version, updatedAt)
                VALUES (?, CURRENT_TIMESTAMP)
            `).run(jsonData.version || '1.0.0');

            // Insert nodes
            console.log(`Inserting ${jsonData.nodes?.length || 0} nodes...`);
            const insertNode = db.prepare(`
                INSERT INTO nodes (id, question, description, nodeType, tags, azObjectives, roleFocus)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            for (const node of jsonData.nodes || []) {
                insertNode.run(
                    node.id,
                    node.question || null,
                    node.description || null,
                    node.nodeType || 'question',
                    stringifyJsonArray(node.tags),
                    stringifyJsonArray(node.azObjectives),
                    stringifyJsonArray(node.roleFocus)
                );
            }

            // Create sets for validation (after nodes are inserted)
            const nodeIds = new Set((jsonData.nodes || []).map(n => n.id));

            // Insert options
            console.log(`Inserting ${jsonData.options?.length || 0} options...`);
            const insertOption = db.prepare(`
                INSERT INTO options (id, nodeId, label, description, pros, cons, whenToUse, whenNotToUse)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            const optionIds = new Set(); // Track successfully inserted options
            let optionsInserted = 0;
            let optionsSkipped = 0;
            
            for (const option of jsonData.options || []) {
                // Validate nodeId exists
                if (!nodeIds.has(option.nodeId)) {
                    console.warn(`Skipping option with invalid nodeId: ${option.id}, nodeId=${option.nodeId}`);
                    optionsSkipped++;
                    continue;
                }
                
                try {
                    insertOption.run(
                        option.id,
                        option.nodeId,
                        option.label,
                        option.description || null,
                        stringifyJsonArray(option.pros),
                        stringifyJsonArray(option.cons),
                        option.whenToUse || null,
                        option.whenNotToUse || null
                    );
                    optionIds.add(option.id); // Track successfully inserted option
                    optionsInserted++;
                } catch (error) {
                    console.error(`Failed to insert option: id=${option.id}, nodeId=${option.nodeId}`);
                    console.error(`Error: ${error.message}`);
                    throw error;
                }
            }
            
            if (optionsSkipped > 0) {
                console.warn(`Warning: Skipped ${optionsSkipped} invalid options`);
            }
            console.log(`Inserted ${optionsInserted} options`);

            // Insert paths
            console.log(`Inserting ${jsonData.paths?.length || 0} paths...`);
            
            const insertPath = db.prepare(`
                INSERT INTO paths (fromNodeId, fromOptionId, toNodeId)
                VALUES (?, ?, ?)
            `);
            
            // Track inserted paths to detect duplicates
            const insertedPaths = new Set();
            let pathsInserted = 0;
            let pathsSkipped = 0;
            let pathsDuplicates = 0;
            
            for (const path of jsonData.paths || []) {
                // Check for duplicate (same fromNodeId + fromOptionId combination)
                const pathKey = `${path.fromNodeId}|${path.fromOptionId}`;
                if (insertedPaths.has(pathKey)) {
                    console.warn(`Skipping duplicate path: fromNodeId=${path.fromNodeId}, fromOptionId=${path.fromOptionId}, toNodeId=${path.toNodeId}`);
                    pathsDuplicates++;
                    continue;
                }
                
                // Validate foreign key references
                const fromNodeExists = nodeIds.has(path.fromNodeId);
                const fromOptionExists = optionIds.has(path.fromOptionId);
                const toNodeExists = nodeIds.has(path.toNodeId);
                
                if (!fromNodeExists || !fromOptionExists || !toNodeExists) {
                    console.warn(`Skipping invalid path: fromNodeId=${path.fromNodeId} (exists: ${fromNodeExists}), fromOptionId=${path.fromOptionId} (exists: ${fromOptionExists}), toNodeId=${path.toNodeId} (exists: ${toNodeExists})`);
                    pathsSkipped++;
                    continue;
                }
                
                try {
                    insertPath.run(
                        path.fromNodeId,
                        path.fromOptionId,
                        path.toNodeId
                    );
                    insertedPaths.add(pathKey);
                    pathsInserted++;
                } catch (error) {
                    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
                        console.warn(`Skipping duplicate path (constraint violation): fromNodeId=${path.fromNodeId}, fromOptionId=${path.fromOptionId}, toNodeId=${path.toNodeId}`);
                        pathsDuplicates++;
                    } else {
                        console.error(`Failed to insert path: fromNodeId=${path.fromNodeId}, fromOptionId=${path.fromOptionId}, toNodeId=${path.toNodeId}`);
                        console.error(`Error: ${error.message}`);
                        throw error;
                    }
                }
            }
            
            if (pathsSkipped > 0) {
                console.warn(`Warning: Skipped ${pathsSkipped} invalid paths`);
            }
            if (pathsDuplicates > 0) {
                console.warn(`Warning: Skipped ${pathsDuplicates} duplicate paths`);
            }
            console.log(`Inserted ${pathsInserted} paths`);

            // Insert recipes
            console.log(`Inserting ${jsonData.recipes?.length || 0} recipes...`);
            const insertRecipe = db.prepare(`
                INSERT INTO recipes (id, nodeId, title, steps, bicepOutline, terraformOutline, links, skillLevel, estimatedTime)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            let recipesInserted = 0;
            let recipesSkipped = 0;
            
            for (const recipe of jsonData.recipes || []) {
                // Validate nodeId exists
                if (!nodeIds.has(recipe.nodeId)) {
                    console.warn(`Skipping recipe with invalid nodeId: ${recipe.nodeId}`);
                    recipesSkipped++;
                    continue;
                }
                
                try {
                    insertRecipe.run(
                        recipe.id || recipe.nodeId,
                        recipe.nodeId,
                        recipe.title || null,
                        stringifyJsonObject(recipe.steps),
                        stringifyJsonObject(recipe.bicepOutline),
                        stringifyJsonObject(recipe.terraformOutline),
                        stringifyJsonArray(recipe.links),
                        recipe.skillLevel || null,
                        recipe.estimatedTime || null
                    );
                    recipesInserted++;
                } catch (error) {
                    console.error(`Failed to insert recipe: id=${recipe.id || recipe.nodeId}, nodeId=${recipe.nodeId}`);
                    console.error(`Error: ${error.message}`);
                    throw error;
                }
            }
            
            if (recipesSkipped > 0) {
                console.warn(`Warning: Skipped ${recipesSkipped} invalid recipes`);
            }
            console.log(`Inserted ${recipesInserted} recipes`);

            // Insert components
            console.log(`Inserting ${jsonData.components?.length || 0} components...`);
            const insertComponent = db.prepare(`
                INSERT INTO components (id, name, category, description, configSchema, tags, pros, cons, recipeNodeId, azObjectives)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            const componentIds = new Set();
            let componentsInserted = 0;
            let componentsSkipped = 0;
            
            for (const component of jsonData.components || []) {
                // Validate recipeNodeId if provided
                if (component.recipeNodeId && !nodeIds.has(component.recipeNodeId)) {
                    console.warn(`Skipping component with invalid recipeNodeId: ${component.id}, recipeNodeId=${component.recipeNodeId}`);
                    componentsSkipped++;
                    continue;
                }
                
                try {
                    insertComponent.run(
                        component.id,
                        component.name,
                        component.category,
                        component.description || null,
                        stringifyJsonObject(component.configSchema),
                        stringifyJsonArray(component.tags),
                        stringifyJsonArray(component.pros),
                        stringifyJsonArray(component.cons),
                        component.recipeNodeId || null,
                        stringifyJsonArray(component.azObjectives)
                    );
                    componentIds.add(component.id);
                    componentsInserted++;
                } catch (error) {
                    console.error(`Failed to insert component: id=${component.id}`);
                    console.error(`Error: ${error.message}`);
                    throw error;
                }
            }
            
            if (componentsSkipped > 0) {
                console.warn(`Warning: Skipped ${componentsSkipped} invalid components`);
            }
            console.log(`Inserted ${componentsInserted} components`);

            // Insert compatibility rules
            console.log(`Inserting ${jsonData.compatibilityRules?.length || 0} compatibility rules...`);
            const insertRule = db.prepare(`
                INSERT INTO compatibilityRules (componentId1, componentId2, type, reason)
                VALUES (?, ?, ?, ?)
            `);
            
            // Track inserted rules to detect duplicates
            const insertedRules = new Set();
            let rulesInserted = 0;
            let rulesSkipped = 0;
            let rulesDuplicates = 0;
            
            for (const rule of jsonData.compatibilityRules || []) {
                // Check for duplicate (same componentId1 + componentId2 combination)
                // Normalize order: always use smaller ID first for consistency
                const [id1, id2] = rule.componentId1 < rule.componentId2 
                    ? [rule.componentId1, rule.componentId2]
                    : [rule.componentId2, rule.componentId1];
                const ruleKey = `${id1}|${id2}`;
                
                if (insertedRules.has(ruleKey)) {
                    console.warn(`Skipping duplicate compatibility rule: componentId1=${rule.componentId1}, componentId2=${rule.componentId2}`);
                    rulesDuplicates++;
                    continue;
                }
                
                // Validate component IDs exist
                const component1Exists = componentIds.has(rule.componentId1);
                const component2Exists = componentIds.has(rule.componentId2);
                
                if (!component1Exists || !component2Exists) {
                    console.warn(`Skipping compatibility rule with invalid component IDs: componentId1=${rule.componentId1} (exists: ${component1Exists}), componentId2=${rule.componentId2} (exists: ${component2Exists})`);
                    rulesSkipped++;
                    continue;
                }
                
                try {
                    insertRule.run(
                        rule.componentId1,
                        rule.componentId2,
                        rule.type,
                        rule.reason || null
                    );
                    insertedRules.add(ruleKey);
                    rulesInserted++;
                } catch (error) {
                    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
                        console.warn(`Skipping duplicate compatibility rule (constraint violation): componentId1=${rule.componentId1}, componentId2=${rule.componentId2}`);
                        rulesDuplicates++;
                    } else {
                        console.error(`Failed to insert compatibility rule: componentId1=${rule.componentId1}, componentId2=${rule.componentId2}`);
                        console.error(`Error: ${error.message}`);
                        throw error;
                    }
                }
            }
            
            if (rulesSkipped > 0) {
                console.warn(`Warning: Skipped ${rulesSkipped} invalid compatibility rules`);
            }
            if (rulesDuplicates > 0) {
                console.warn(`Warning: Skipped ${rulesDuplicates} duplicate compatibility rules`);
            }
            console.log(`Inserted ${rulesInserted} compatibility rules`);
        });

        transaction();

        console.log('Migration completed successfully!');
        console.log(`Database location: ${path.join(__dirname, '..', 'data', 'wizard.db')}`);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        closeDatabase();
    }
}

migrate();

