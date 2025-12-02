// AI: Research orchestration service
// Coordinates between knowledge cache, OpenAI service, and JSON updater

import * as openai from './openai-service.js';
import * as cache from './knowledge-cache.js';
import * as jsonUpdater from './json-updater.js';
import * as apiClient from './api-client.js';
import { forceReloadData, loadJsonData } from './data-loader.js';

/**
 * Research a topic when search returns no results
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of new nodes discovered
 */
export async function researchSearchQuery(query) {
    // Check cache first
    const cached = await cache.checkCache(query, 'search');
    if (cached) {
        return cached;
    }

    // No cache hit - research with LLM
    try {
        const node = await openai.generateNodeFromQuery(query);
        
        // Generate options for the new node
        const options = await openai.generateNodeOptions(node.question, { node });
        
        // Create option IDs and paths
        const optionIds = options.map((opt, idx) => {
            const id = `${node.id}-opt-${idx + 1}`;
            return { ...opt, id, nodeId: node.id };
        });

        // Save to JSON
        const updatedData = await jsonUpdater.batchAdd({
            nodes: [node],
            options: optionIds
        });

        // Save and reload
        await jsonUpdater.saveJsonData(updatedData);
        await forceReloadData();
        cache.invalidateCache();

        return [node];
    } catch (error) {
        console.error('Research search query error:', error);
        throw error;
    }
}

/**
 * Research and generate recipe for a terminal node
 * @param {string} nodeId - Terminal node ID
 * @param {Object} nodeInfo - Node information
 * @param {Array} choiceHistory - User's choice history
 * @returns {Promise<Object>} - Generated recipe
 */
export async function researchRecipe(nodeId, nodeInfo, choiceHistory = []) {
    // Check cache first
    const cached = await cache.checkCache(nodeId, 'recipe', { nodeId });
    if (cached) {
        return cached;
    }

    // Check if knowledge gap exists
    const hasGap = await cache.isKnowledgeGap(nodeId, 'recipe');
    if (!hasGap) {
        // Recipe exists, but cache check failed - reload
        const data = await loadJsonData('data/seed-data.json');
        return data.recipes.find(r => r.nodeId === nodeId) || null;
    }

    // No recipe - generate with LLM
    try {
        // Format choice history for context
        const choices = choiceHistory.map(c => ({
            nodeQuestion: c.nodeQuestion || '',
            optionLabel: c.optionLabel || ''
        }));

        const recipe = await openai.generateRecipe(nodeInfo, choices);
        
        // Ensure recipe has nodeId
        recipe.nodeId = nodeId;

        // Save to JSON
        const updatedData = await jsonUpdater.addRecipe(recipe);
        await jsonUpdater.saveJsonData(updatedData);
        await forceReloadData();
        cache.invalidateCache();

        return recipe;
    } catch (error) {
        console.error('Research recipe error:', error);
        throw error;
    }
}

/**
 * Research missing path (when option has no next node)
 * @param {string} fromNodeId - Source node ID
 * @param {string} optionId - Selected option ID
 * @param {Object} optionInfo - Option information
 * @returns {Promise<string|null>} - New node ID or null
 */
export async function researchMissingPath(fromNodeId, optionId, optionInfo) {
    // Check if path exists
    const hasGap = await cache.isKnowledgeGap(`${fromNodeId}_${optionId}`, 'path');
    if (!hasGap) {
        // Path exists
        const data = await loadJsonData('data/seed-data.json');
        const path = data.paths.find(
            p => p.fromNodeId === fromNodeId && p.fromOptionId === optionId
        );
        return path ? path.toNodeId : null;
    }

    // No path - research and create
    try {
        // Get context about the option
        const data = await loadJsonData('data/seed-data.json');
        const fromNode = data.nodes.find(n => n.id === fromNodeId);
        
        // Generate a new node based on the option
        const newNode = await openai.generateNodeFromQuery(
            `${fromNode?.question || 'Decision'} - ${optionInfo.label}`,
            { fromNode, option: optionInfo }
        );

        // Generate options for the new node
        const options = await openai.generateNodeOptions(newNode.question, { 
            parentNode: fromNode,
            selectedOption: optionInfo
        });

        // Create option IDs
        const optionIds = options.map((opt, idx) => ({
            ...opt,
            id: `${newNode.id}-opt-${idx + 1}`,
            nodeId: newNode.id
        }));

        // Create path
        const path = {
            fromNodeId,
            fromOptionId: optionId,
            toNodeId: newNode.id
        };

        // Save to JSON - validate nodes exist first
        try {
            const updatedData = await jsonUpdater.batchAdd({
                nodes: [newNode],
                options: optionIds,
                paths: [path]
            });

            await jsonUpdater.saveJsonData(updatedData);
            await forceReloadData();
            cache.invalidateCache();

            return newNode.id;
        } catch (validationError) {
            // If validation fails, the node/options might not have been added
            // Try adding just the node and options first, then the path
            console.warn('Batch add failed, trying sequential add:', validationError.message);
            
            const updatedData = await jsonUpdater.batchAdd({
                nodes: [newNode],
                options: optionIds
            });
            
            // Now add the path after nodes/options are confirmed
            const finalData = await jsonUpdater.addPath(path);
            
            await jsonUpdater.saveJsonData(finalData);
            await forceReloadData();
            cache.invalidateCache();

            return newNode.id;
        }
    } catch (error) {
        console.error('Research missing path error:', error);
        // Provide a more helpful error message
        if (error.message && error.message.includes('not found')) {
            throw new Error(`Research error: ${error.message}. The node may not have been created properly.`);
        }
        throw error;
    }
}

/**
 * Research missing options for a node
 * @param {string} nodeId - Node ID
 * @param {Object} nodeInfo - Node information
 * @returns {Promise<Array>} - Array of new options
 */
export async function researchMissingOptions(nodeId, nodeInfo) {
    // Check cache first
    const cached = await cache.checkCache(nodeId, 'option', { nodeId });
    if (cached) {
        return cached;
    }

    // Check if knowledge gap exists
    const hasGap = await cache.isKnowledgeGap(nodeId, 'options');
    if (!hasGap) {
        // Options exist
        const data = await loadJsonData('data/seed-data.json');
        return data.options.filter(o => o.nodeId === nodeId);
    }

    // No options - generate with LLM
    try {
        const options = await openai.generateNodeOptions(nodeInfo.question, { node: nodeInfo });
        
        // Create option IDs
        const optionIds = options.map((opt, idx) => ({
            ...opt,
            id: `${nodeId}-opt-${idx + 1}`,
            nodeId: nodeId
        }));

        // Save to JSON
        const updatedData = await jsonUpdater.batchAdd({
            options: optionIds
        });

        await jsonUpdater.saveJsonData(updatedData);
        await forceReloadData();
        cache.invalidateCache();

        return optionIds;
    } catch (error) {
        console.error('Research missing options error:', error);
        throw error;
    }
}

/**
 * User-initiated research for a topic
 * @param {string} topic - Topic to research
 * @returns {Promise<Object>} - Research results
 */
export async function researchTopic(topic) {
    try {
        // Research the topic
        const researchResult = await openai.researchAzureTopic(topic);
        
        // Try to create a node from the research
        const node = await openai.generateNodeFromQuery(topic, { research: researchResult });
        
        // Generate options
        const options = await openai.generateNodeOptions(node.question, { 
            research: researchResult 
        });

        // Create option IDs
        const optionIds = options.map((opt, idx) => ({
            ...opt,
            id: `${node.id}-opt-${idx + 1}`,
            nodeId: node.id
        }));

        // Save to JSON
        const updatedData = await jsonUpdater.batchAdd({
            nodes: [node],
            options: optionIds
        });

        await jsonUpdater.saveJsonData(updatedData);
        await forceReloadData();
        cache.invalidateCache();

        return {
            node,
            options: optionIds,
            research: researchResult
        };
    } catch (error) {
        console.error('Research topic error:', error);
        throw error;
    }
}

/**
 * Improve a node by adding missing Azure services and enriching existing options
 * @param {string} nodeId - Node ID to improve
 * @returns {Promise<Object>} - { newOptions: [], enrichedOptions: [] }
 */
export async function improveNode(nodeId) {
    try {
        // Load current node and options from API (SQLite source of truth)
        const node = await apiClient.getNodeById(nodeId);
        if (!node) {
            throw new Error(`Node ${nodeId} not found`);
        }
        
        // Get current options for this node from API
        const currentOptions = await apiClient.getOptionsForNode(nodeId);
        
        // Check if this node is APIM-related and add V2 context
        const isApimNode = node.tags?.some(tag => 
            tag.toLowerCase().includes('apim') || 
            tag.toLowerCase().includes('api management') ||
            tag.toLowerCase().includes('api-management')
        ) || node.question?.toLowerCase().includes('api management');
        
        // If APIM-related, log that V2 context will be included
        if (isApimNode) {
            console.log('APIM node detected - V2 tier context will be included in improvement suggestions');
        }
        
        // Call OpenAI to improve options (V2 context added in openai-service.js)
        const improvement = await openai.improveNodeOptions(nodeId, node, currentOptions);
        
        // Prepare new options with IDs and nodeId
        const newOptionsWithIds = (improvement.newOptions || []).map(opt => {
            // Generate ID from label
            const baseId = opt.label.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            const id = `${nodeId}-opt-${baseId}`;
            
            return {
                ...opt,
                id: id,
                nodeId: nodeId
            };
        });
        
        // Prepare enriched options with nodeId for matching
        const enrichedOptionsWithNodeId = (improvement.enrichedOptions || []).map(opt => ({
            ...opt,
            nodeId: nodeId
        }));
        
        // Update SQLite database via API
        const batchResult = await apiClient.batchUpdateOptions(
            newOptionsWithIds,
            enrichedOptionsWithNodeId
        );
        
        console.log('Batch update result:', batchResult);
        
        // Also update JSON for backup (optional, but keeps JSON in sync)
        try {
            const data = await loadJsonData('data/seed-data.json');
            const updatedData = await jsonUpdater.batchUpdateOptions(
                newOptionsWithIds,
                enrichedOptionsWithNodeId
            );
            await jsonUpdater.saveJsonData(updatedData);
        } catch (jsonError) {
            // JSON update is optional - log but don't fail
            console.warn('Failed to update JSON backup:', jsonError);
        }
        
        // Invalidate cache
        cache.invalidateCache();
        
        return {
            newOptions: newOptionsWithIds,
            enrichedOptions: enrichedOptionsWithNodeId,
            created: batchResult.created || 0,
            updated: batchResult.updated || 0
        };
    } catch (error) {
        console.error('Improve node error:', error);
        throw error;
    }
}
