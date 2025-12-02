// AI: This abstraction allows switching between IndexedDB and in-memory JSON providers.
// Use this pattern for testing and fallback scenarios.

import * as storage from './storage.js';

/**
 * Data provider interface
 * @typedef {Object} DataProvider
 * @property {function(string): Promise<Object|null>} getNodeById
 * @property {function(string): Promise<Array>} getOptionsForNode
 * @property {function(string, string): Promise<string|null>} getNextNodeId
 * @property {function(string): Promise<Object|null>} getRecipeForNode
 * @property {function(): Promise<Object|null>} getRootNode
 * @property {function(string): Promise<Array>} searchNodesByText
 * @property {function(string): Promise<Array>} searchNodesByTag
 * @property {function(string): Promise<Object|null>} getComponentById
 * @property {function(): Promise<Array>} getAllComponents
 * @property {function(string): Promise<Array>} getComponentsByCategory
 * @property {function(string): Promise<Array>} searchComponentsByText
 * @property {function(): Promise<Array>} getAllCompatibilityRules
 */

/**
 * IndexedDB data provider implementation
 */
export const indexedDbDataProvider = {
    getNodeById: storage.getNodeById,
    getOptionsForNode: storage.getOptionsForNode,
    getNextNodeId: storage.getNextNodeId,
    getRecipeForNode: storage.getRecipeForNode,
    getRootNode: storage.getRootNode,
    searchNodesByText: storage.searchNodesByText,
    searchNodesByTag: storage.searchNodesByTag,
    getComponentById: storage.getComponentById,
    getAllComponents: storage.getAllComponents,
    getComponentsByCategory: storage.getComponentsByCategory,
    searchComponentsByText: storage.searchComponentsByText,
    getAllCompatibilityRules: storage.getAllCompatibilityRules,
};

/**
 * In-memory JSON data provider implementation
 * @param {Object} data - Full JSON data structure
 * @returns {DataProvider}
 */
export function createInMemoryJsonDataProvider(data) {
    const { nodes = [], options = [], paths = [], recipes = [], components = [], compatibilityRules = [] } = data;

    return {
        async getNodeById(nodeId) {
            return nodes.find(n => n.id === nodeId) || null;
        },

        async getOptionsForNode(nodeId) {
            return options.filter(o => o.nodeId === nodeId);
        },

        async getNextNodeId(fromNodeId, optionId) {
            const path = paths.find(
                p => p.fromNodeId === fromNodeId && p.fromOptionId === optionId
            );
            return path ? path.toNodeId : null;
        },

        async getRecipeForNode(nodeId) {
            return recipes.find(r => r.nodeId === nodeId) || null;
        },

        async getRootNode() {
            return nodes.find(n => n.nodeType === 'root') || null;
        },

        async searchNodesByText(query) {
            const lowerQuery = query.toLowerCase();
            return nodes.filter(node => {
                const question = (node.question || '').toLowerCase();
                const description = (node.description || '').toLowerCase();
                return question.includes(lowerQuery) || description.includes(lowerQuery);
            });
        },

        async searchNodesByTag(tag) {
            return nodes.filter(node => {
                const tags = node.tags || [];
                return tags.includes(tag);
            });
        },

        async getComponentById(componentId) {
            return components.find(c => c.id === componentId) || null;
        },

        async getAllComponents() {
            return components;
        },

        async getComponentsByCategory(category) {
            return components.filter(c => c.category === category);
        },

        async searchComponentsByText(query) {
            const lowerQuery = query.toLowerCase();
            return components.filter(component => {
                const name = (component.name || '').toLowerCase();
                const description = (component.description || '').toLowerCase();
                return name.includes(lowerQuery) || description.includes(lowerQuery);
            });
        },

        async getAllCompatibilityRules() {
            return compatibilityRules;
        },
    };
}

// Default export is IndexedDB provider
export default indexedDbDataProvider;


