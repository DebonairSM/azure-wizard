// AI: This module handles data loading from the API.
// The server now uses SQLite as the source of truth.

import * as storage from './storage.js';

const DATA_VERSION_KEY = 'azureWizardDataVersion';
const API_BASE = '/api';

/**
 * Get stored data version from localStorage
 * @returns {string|null}
 */
function getStoredDataVersion() {
    return localStorage.getItem(DATA_VERSION_KEY);
}

/**
 * Store data version in localStorage
 * @param {string} version
 */
function storeDataVersion(version) {
    localStorage.setItem(DATA_VERSION_KEY, version);
}

/**
 * Load JSON data from API (for backward compatibility)
 * @param {string} url - Ignored, uses API instead
 * @returns {Promise<Object>}
 */
export async function loadJsonData(url) {
    // Load all data from API
    const [versionRes, nodesRes, optionsRes, pathsRes, recipesRes, componentsRes, rulesRes] = await Promise.all([
        fetch(`${API_BASE}/version`),
        fetch(`${API_BASE}/nodes`),
        fetch(`${API_BASE}/options/all`).catch(() => null), // May not exist
        fetch(`${API_BASE}/paths?all=true`).catch(() => null), // May not exist
        fetch(`${API_BASE}/recipes/all?all=true`).catch(() => null), // May not exist
        fetch(`${API_BASE}/components`),
        fetch(`${API_BASE}/compatibility`)
    ]);

    const version = await versionRes.json();
    
    // For now, we'll need to load data differently since API doesn't return all at once
    // This is a compatibility function - actual usage should use API directly
    const nodes = await nodesRes.json();
    
    return {
        version: version.version || '1.0.0',
        nodes: nodes || [],
        options: [],
        paths: [],
        recipes: [],
        components: componentsRes.ok ? await componentsRes.json() : [],
        compatibilityRules: rulesRes.ok ? await rulesRes.json() : []
    };
}

/**
 * Validate tree structure
 * @param {Object} data
 * @throws {Error} if validation fails
 */
export function validateTreeStructure(data) {
    const { nodes = [], options = [], paths = [], recipes = [] } = data;

    // Check for root node
    const rootNodes = nodes.filter(n => n.nodeType === 'root');
    if (rootNodes.length === 0) {
        throw new Error('No root node found');
    }
    if (rootNodes.length > 1) {
        throw new Error('Multiple root nodes found');
    }

    // Check for orphaned nodes (nodes referenced in paths but not in nodes array)
    const nodeIds = new Set(nodes.map(n => n.id));
    const referencedNodeIds = new Set();
    paths.forEach(path => {
        referencedNodeIds.add(path.fromNodeId);
        referencedNodeIds.add(path.toNodeId);
    });
    recipes.forEach(recipe => {
        referencedNodeIds.add(recipe.nodeId);
    });

    const orphanedNodes = Array.from(referencedNodeIds).filter(id => !nodeIds.has(id));
    if (orphanedNodes.length > 0) {
        throw new Error(`Orphaned nodes referenced: ${orphanedNodes.join(', ')}`);
    }

    // Check for orphaned options (options referencing non-existent nodes)
    const orphanedOptions = options.filter(opt => !nodeIds.has(opt.nodeId));
    if (orphanedOptions.length > 0) {
        throw new Error(`Orphaned options found: ${orphanedOptions.map(o => o.id).join(', ')}`);
    }

    // Check for invalid paths (paths referencing non-existent options or nodes)
    const optionIds = new Set(options.map(o => o.id));
    const invalidPaths = paths.filter(path => {
        return !nodeIds.has(path.fromNodeId) ||
               !nodeIds.has(path.toNodeId) ||
               !optionIds.has(path.fromOptionId);
    });
    if (invalidPaths.length > 0) {
        // Provide detailed error information
        const details = invalidPaths.slice(0, 10).map(path => {
            const issues = [];
            if (!nodeIds.has(path.fromNodeId)) issues.push(`fromNodeId ${path.fromNodeId} not found`);
            if (!nodeIds.has(path.toNodeId)) issues.push(`toNodeId ${path.toNodeId} not found`);
            if (!optionIds.has(path.fromOptionId)) issues.push(`fromOptionId ${path.fromOptionId} not found`);
            return `Path [${path.fromNodeId} -> ${path.toNodeId} via ${path.fromOptionId}]: ${issues.join(', ')}`;
        });
        const more = invalidPaths.length > 10 ? ` (and ${invalidPaths.length - 10} more)` : '';
        throw new Error(`Invalid paths found: ${invalidPaths.length}${more}. Examples:\n${details.join('\n')}`);
    }
}

/**
 * Import data from JSON into IndexedDB
 * @param {Object} data
 * @returns {Promise<void>}
 */
async function importData(data) {
    const { nodes = [], options = [], paths = [], recipes = [], components = [], compatibilityRules = [] } = data;

    // Clear existing data
    await storage.clearAllData();

    // Store new data
    await storage.storeNodes(nodes);
    await storage.storeOptions(options);
    await storage.storePaths(paths);
    await storage.storeRecipes(recipes);
    await storage.storeComponents(components);
    await storage.storeCompatibilityRules(compatibilityRules);
}

/**
 * Load data from API with version checking
 * @param {string} url - Ignored, uses API instead
 * @returns {Promise<boolean>} - Returns true if data was loaded, false if cached version is current
 */
export async function loadData(url = null) {
    try {
        // Check if we have server-rendered data
        if (window.SERVER_DATA) {
            const serverVersion = window.SERVER_DATA.version;
            const storedVersion = getStoredDataVersion();
            
            if (storedVersion === serverVersion) {
                console.log('Data version is current, using cached data');
                return false;
            }
            
            console.log(`Data version changed: ${storedVersion} -> ${serverVersion}. Reloading...`);
            
            // Import server data into IndexedDB for offline support
            const data = {
                version: serverVersion,
                nodes: [window.SERVER_DATA.currentNode],
                options: window.SERVER_DATA.options || [],
                paths: [],
                recipes: window.SERVER_DATA.recipe ? [window.SERVER_DATA.recipe] : [],
                components: [],
                compatibilityRules: []
            };
            
            await importData(data);
            storeDataVersion(serverVersion);
            return true;
        }

        // Fallback: load from API
        const versionRes = await fetch(`${API_BASE}/version`);
        const versionData = await versionRes.json();
        const apiVersion = versionData.version;

        const storedVersion = getStoredDataVersion();

        if (storedVersion === apiVersion) {
            console.log('Data version is current, using cached data');
            // Even if version matches, check if we actually have data
            // This handles the case where cache was cleared but version wasn't
            const db = await storage.initDatabase();
            const rootOptions = await storage.getOptionsForNode('root');
            if (rootOptions.length === 0) {
                console.log('Version matches but no root options found, forcing reload...');
                // Force reload by clearing version
                storeDataVersion('force-reload');
                return await loadData(url);
            }
            return false;
        }

        console.log(`Data version changed: ${storedVersion} -> ${apiVersion}. Reloading...`);

        // Load all data from API
        const [nodes, options, paths, recipes, components, rules] = await Promise.all([
            fetch(`${API_BASE}/nodes`).then(r => r.json()),
            fetch(`${API_BASE}/options/all`).then(r => r.ok ? r.json() : []).catch(() => []),
            fetch(`${API_BASE}/paths?all=true`).then(r => r.ok ? r.json() : []).catch(() => []),
            fetch(`${API_BASE}/recipes/all?all=true`).then(r => r.ok ? r.json() : []).catch(() => []),
            fetch(`${API_BASE}/components`).then(r => r.json()),
            fetch(`${API_BASE}/compatibility`).then(r => r.json())
        ]);

        // Filter out invalid paths before validation
        const nodeIds = new Set(nodes.map(n => n.id));
        const optionIds = new Set(options.map(o => o.id));
        const validPaths = paths.filter(path => {
            return nodeIds.has(path.fromNodeId) &&
                   nodeIds.has(path.toNodeId) &&
                   optionIds.has(path.fromOptionId);
        });
        
        if (validPaths.length < paths.length) {
            const invalidCount = paths.length - validPaths.length;
            console.warn(`Filtered out ${invalidCount} invalid paths (referencing non-existent nodes or options)`);
        }

        const data = {
            version: apiVersion,
            nodes,
            options,
            paths: validPaths,
            recipes,
            components,
            compatibilityRules: rules
        };

        // Validate structure
        validateTreeStructure(data);

        // Import into IndexedDB
        await importData(data);

        // Store new version
        storeDataVersion(apiVersion);

        console.log('Data loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

/**
 * Force reload data (ignore version check)
 * @param {string} url - URL to JSON file
 * @returns {Promise<void>}
 */
export async function forceReloadData(url = 'data/seed-data.json') {
    const jsonData = await loadJsonData(url);
    validateTreeStructure(jsonData);
    await importData(jsonData);
    if (jsonData.version) {
        storeDataVersion(jsonData.version);
    }
}

/**
 * Get current data version
 * @returns {string|null}
 */
export function getCurrentDataVersion() {
    return getStoredDataVersion();
}

/**
 * Clear all caches (localStorage, IndexedDB, and in-memory)
 * @returns {Promise<void>}
 */
export async function clearAllCaches() {
    try {
        // Clear localStorage
        localStorage.removeItem(DATA_VERSION_KEY);
        localStorage.removeItem('azureWizardDataBackup');
        
        // Clear IndexedDB
        await storage.clearAllData();
        
        // Invalidate in-memory cache (if knowledge-cache is imported)
        try {
            const { invalidateCache } = await import('./knowledge-cache.js');
            invalidateCache();
        } catch (e) {
            // knowledge-cache might not be available, that's okay
            console.debug('Could not invalidate knowledge cache:', e);
        }
        
        console.log('All caches cleared successfully');
    } catch (error) {
        console.error('Error clearing caches:', error);
        throw error;
    }
}


