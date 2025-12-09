// AI: Knowledge gap detection and caching system
// Checks JSON data before calling LLM to avoid redundant API calls

import { loadJsonData } from './data-loader.js';

let cachedData = null;

/**
 * Load and cache JSON data
 * @returns {Promise<Object>}
 */
async function getCachedData() {
    if (!cachedData) {
        cachedData = await loadJsonData('data/seed-data.json');
    }
    return cachedData;
}

/**
 * Generate cache key from topic and context
 * @param {string} topic - Topic/query
 * @param {Object} context - Additional context
 * @returns {string}
 */
export function generateCacheKey(topic, context = {}) {
    const contextStr = JSON.stringify(context);
    return `${topic.toLowerCase().trim()}_${contextStr}`;
}

/**
 * Check if knowledge exists in cache (JSON)
 * @param {string} query - Search query or topic
 * @param {string} type - Type: 'node', 'recipe', 'option', 'search'
 * @param {Object} context - Additional context
 * @returns {Promise<Object|null>} - Cached data or null
 */
export async function checkCache(query, type, context = {}) {
    try {
        const data = await getCachedData();
        const lowerQuery = query.toLowerCase().trim();

        switch (type) {
            case 'node':
                // Check for nodes matching query
                const matchingNodes = data.nodes.filter(node => {
                    const question = (node.question || '').toLowerCase();
                    const description = (node.description || '').toLowerCase();
                    const tags = (node.tags || []).join(' ').toLowerCase();
                    return question.includes(lowerQuery) || 
                           description.includes(lowerQuery) ||
                           tags.includes(lowerQuery);
                });
                return matchingNodes.length > 0 ? matchingNodes[0] : null;

            case 'recipe':
                // Check for recipes for a node
                if (context.nodeId) {
                    const recipe = data.recipes.find(r => r.nodeId === context.nodeId);
                    return recipe || null;
                }
                return null;

            case 'option':
                // Check for options for a node
                if (context.nodeId) {
                    const options = data.options.filter(o => o.nodeId === context.nodeId);
                    return options.length > 0 ? options : null;
                }
                return null;

            case 'search':
                // Check for any matching content
                const searchResults = [];
                
                // Search nodes
                data.nodes.forEach(node => {
                    const question = (node.question || '').toLowerCase();
                    const description = (node.description || '').toLowerCase();
                    const tags = (node.tags || []).join(' ').toLowerCase();
                    if (question.includes(lowerQuery) || description.includes(lowerQuery) || tags.includes(lowerQuery)) {
                        searchResults.push(node);
                    }
                });
                
                // Search options
                data.options.forEach(option => {
                    const label = (option.label || '').toLowerCase();
                    const desc = (option.description || '').toLowerCase();
                    if (label.includes(lowerQuery) || desc.includes(lowerQuery)) {
                        // Find parent node
                        const parentNode = data.nodes.find(n => n.id === option.nodeId);
                        if (parentNode && !searchResults.find(n => n.id === parentNode.id)) {
                            searchResults.push(parentNode);
                        }
                    }
                });
                
                return searchResults.length > 0 ? searchResults : null;

            default:
                return null;
        }
    } catch (error) {
        console.error('Cache check error:', error);
        return null;
    }
}

/**
 * Check if a knowledge gap exists
 * @param {string} nodeId - Node ID
 * @param {string} type - Type: 'recipe', 'options', 'path'
 * @returns {Promise<boolean>} - True if gap exists
 */
export async function isKnowledgeGap(nodeId, type) {
    try {
        const data = await getCachedData();

        switch (type) {
            case 'recipe':
                // Check if terminal node has no recipe
                const node = data.nodes.find(n => n.id === nodeId);
                if (node && node.nodeType === 'terminal') {
                    const recipe = data.recipes.find(r => r.nodeId === nodeId);
                    return !recipe;
                }
                return false;

            case 'options':
                // Check if question node has no options
                const questionNode = data.nodes.find(n => n.id === nodeId);
                if (questionNode && questionNode.nodeType === 'question') {
                    const options = data.options.filter(o => o.nodeId === nodeId);
                    return options.length === 0;
                }
                return false;

            case 'path':
                // Check if option has no path
                if (nodeId.includes('_')) {
                    const [fromNodeId, optionId] = nodeId.split('_');
                    const path = data.paths.find(
                        p => p.fromNodeId === fromNodeId && p.fromOptionId === optionId
                    );
                    return !path;
                }
                return false;

            default:
                return false;
        }
    } catch (error) {
        console.error('Knowledge gap check error:', error);
        return true; // Assume gap exists on error
    }
}

/**
 * Invalidate cache (force reload)
 */
export function invalidateCache() {
    cachedData = null;
}





















