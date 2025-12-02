// AI: This module is the core IndexedDB wrapper. All database operations go through here.
// If we need to support multiple database backends, abstract this further.

const DB_NAME = 'azureWizardDB';
const DB_VERSION = 2;

/**
 * Initialize IndexedDB database with schema
 * @returns {Promise<IDBDatabase>}
 */
export async function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Nodes store
            if (!db.objectStoreNames.contains('nodes')) {
                const nodeStore = db.createObjectStore('nodes', { keyPath: 'id' });
                nodeStore.createIndex('nodeType', 'nodeType', { unique: false });
                nodeStore.createIndex('question', 'question', { unique: false });
                nodeStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                nodeStore.createIndex('azObjectives', 'azObjectives', { unique: false, multiEntry: true });
            }

            // Options store
            if (!db.objectStoreNames.contains('options')) {
                const optionStore = db.createObjectStore('options', { keyPath: 'id' });
                optionStore.createIndex('nodeId', 'nodeId', { unique: false });
            }

            // Paths store
            if (!db.objectStoreNames.contains('paths')) {
                const pathStore = db.createObjectStore('paths', { keyPath: ['fromNodeId', 'fromOptionId'] });
                pathStore.createIndex('fromNodeId', 'fromNodeId', { unique: false });
                pathStore.createIndex('fromOptionId', 'fromOptionId', { unique: false });
                pathStore.createIndex('toNodeId', 'toNodeId', { unique: false });
            }

            // Recipes store
            if (!db.objectStoreNames.contains('recipes')) {
                const recipeStore = db.createObjectStore('recipes', { keyPath: 'id' });
                recipeStore.createIndex('nodeId', 'nodeId', { unique: true });
            }

            // Components store
            if (!db.objectStoreNames.contains('components')) {
                const componentStore = db.createObjectStore('components', { keyPath: 'id' });
                componentStore.createIndex('category', 'category', { unique: false });
                componentStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            }

            // Compatibility rules store
            if (!db.objectStoreNames.contains('compatibilityRules')) {
                const ruleStore = db.createObjectStore('compatibilityRules', { keyPath: ['componentId1', 'componentId2'] });
                ruleStore.createIndex('componentId1', 'componentId1', { unique: false });
                ruleStore.createIndex('componentId2', 'componentId2', { unique: false });
                ruleStore.createIndex('type', 'type', { unique: false });
            }
        };
    });
}

/**
 * Get a node by ID
 * @param {string} nodeId
 * @returns {Promise<Object|null>}
 */
export async function getNodeById(nodeId) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['nodes'], 'readonly');
        const store = transaction.objectStore('nodes');
        const request = store.get(nodeId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
    });
}

/**
 * Get all options for a node
 * @param {string} nodeId
 * @returns {Promise<Array>}
 */
export async function getOptionsForNode(nodeId) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['options'], 'readonly');
        const store = transaction.objectStore('options');
        const index = store.index('nodeId');
        const request = index.getAll(nodeId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

/**
 * Get next node ID after selecting an option
 * @param {string} fromNodeId
 * @param {string} optionId
 * @returns {Promise<string|null>}
 */
export async function getNextNodeId(fromNodeId, optionId) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['paths'], 'readonly');
        const store = transaction.objectStore('paths');
        const request = store.get([fromNodeId, optionId]);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const path = request.result;
            resolve(path ? path.toNodeId : null);
        };
    });
}

/**
 * Get recipe for a terminal node
 * @param {string} nodeId
 * @returns {Promise<Object|null>}
 */
export async function getRecipeForNode(nodeId) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recipes'], 'readonly');
        const store = transaction.objectStore('recipes');
        const index = store.index('nodeId');
        const request = index.get(nodeId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
    });
}

/**
 * Search nodes by text (searches question and description)
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchNodesByText(query) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['nodes'], 'readonly');
        const store = transaction.objectStore('nodes');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const nodes = request.result || [];
            const lowerQuery = query.toLowerCase();
            const results = nodes.filter(node => {
                const question = (node.question || '').toLowerCase();
                const description = (node.description || '').toLowerCase();
                return question.includes(lowerQuery) || description.includes(lowerQuery);
            });
            resolve(results);
        };
    });
}

/**
 * Search nodes by tag
 * @param {string} tag
 * @returns {Promise<Array>}
 */
export async function searchNodesByTag(tag) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['nodes'], 'readonly');
        const store = transaction.objectStore('nodes');
        const index = store.index('tags');
        const request = index.getAll(tag);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

/**
 * Get root node
 * @returns {Promise<Object|null>}
 */
export async function getRootNode() {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['nodes'], 'readonly');
        const store = transaction.objectStore('nodes');
        const index = store.index('nodeType');
        const request = index.get('root');

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
    });
}

/**
 * Store nodes in bulk
 * @param {Array} nodes
 * @returns {Promise<void>}
 */
export async function storeNodes(nodes) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['nodes'], 'readwrite');
        const store = transaction.objectStore('nodes');

        nodes.forEach(node => store.put(node));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * Store options in bulk
 * @param {Array} options
 * @returns {Promise<void>}
 */
export async function storeOptions(options) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['options'], 'readwrite');
        const store = transaction.objectStore('options');

        options.forEach(option => store.put(option));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * Store paths in bulk
 * @param {Array} paths
 * @returns {Promise<void>}
 */
export async function storePaths(paths) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['paths'], 'readwrite');
        const store = transaction.objectStore('paths');

        paths.forEach(path => store.put(path));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * Store recipes in bulk
 * @param {Array} recipes
 * @returns {Promise<void>}
 */
export async function storeRecipes(recipes) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recipes'], 'readwrite');
        const store = transaction.objectStore('recipes');

        recipes.forEach(recipe => store.put(recipe));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * Get a component by ID
 * @param {string} componentId
 * @returns {Promise<Object|null>}
 */
export async function getComponentById(componentId) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['components'], 'readonly');
        const store = transaction.objectStore('components');
        const request = store.get(componentId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
    });
}

/**
 * Get all components
 * @returns {Promise<Array>}
 */
export async function getAllComponents() {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['components'], 'readonly');
        const store = transaction.objectStore('components');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

/**
 * Get components by category
 * @param {string} category
 * @returns {Promise<Array>}
 */
export async function getComponentsByCategory(category) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['components'], 'readonly');
        const store = transaction.objectStore('components');
        const index = store.index('category');
        const request = index.getAll(category);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

/**
 * Search components by text
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchComponentsByText(query) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['components'], 'readonly');
        const store = transaction.objectStore('components');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const components = request.result || [];
            const lowerQuery = query.toLowerCase();
            const results = components.filter(component => {
                const name = (component.name || '').toLowerCase();
                const description = (component.description || '').toLowerCase();
                return name.includes(lowerQuery) || description.includes(lowerQuery);
            });
            resolve(results);
        };
    });
}

/**
 * Get all compatibility rules
 * @returns {Promise<Array>}
 */
export async function getAllCompatibilityRules() {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['compatibilityRules'], 'readonly');
        const store = transaction.objectStore('compatibilityRules');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

/**
 * Store components in bulk
 * @param {Array} components
 * @returns {Promise<void>}
 */
export async function storeComponents(components) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['components'], 'readwrite');
        const store = transaction.objectStore('components');

        components.forEach(component => store.put(component));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * Store compatibility rules in bulk
 * @param {Array} rules
 * @returns {Promise<void>}
 */
export async function storeCompatibilityRules(rules) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['compatibilityRules'], 'readwrite');
        const store = transaction.objectStore('compatibilityRules');

        rules.forEach(rule => store.put(rule));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * Clear all data from IndexedDB
 * @returns {Promise<void>}
 */
export async function clearAllData() {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['nodes', 'options', 'paths', 'recipes', 'components', 'compatibilityRules'], 'readwrite');

        transaction.objectStore('nodes').clear();
        transaction.objectStore('options').clear();
        transaction.objectStore('paths').clear();
        transaction.objectStore('recipes').clear();
        transaction.objectStore('components').clear();
        transaction.objectStore('compatibilityRules').clear();

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}


