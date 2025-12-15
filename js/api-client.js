// API client for data operations
// Replaces direct IndexedDB access with API calls

const API_BASE = '/api';

/**
 * Get node by ID
 */
export async function getNodeById(nodeId) {
    const response = await fetch(`${API_BASE}/nodes/${nodeId}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to get node: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Get root node
 */
export async function getRootNode() {
    const nodes = await fetch(`${API_BASE}/nodes?nodeType=root`).then(r => r.json());
    return nodes.length > 0 ? nodes[0] : null;
}

/**
 * Get options for a node
 */
export async function getOptionsForNode(nodeId) {
    const response = await fetch(`${API_BASE}/options/${nodeId}`);
    if (!response.ok) {
        throw new Error(`Failed to get options: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Get next node ID from path
 */
export async function getNextNodeId(fromNodeId, optionId) {
    const response = await fetch(`${API_BASE}/paths?fromNodeId=${fromNodeId}&fromOptionId=${optionId}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to get path: ${response.statusText}`);
    }
    const path = await response.json();
    return path ? path.toNodeId : null;
}

/**
 * Get recipe for node
 */
export async function getRecipeForNode(nodeId) {
    const response = await fetch(`${API_BASE}/recipes/${nodeId}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to get recipe: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Search recipes
 */
export async function searchRecipes(query) {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    
    const response = await fetch(`${API_BASE}/recipes?${params}`);
    if (!response.ok) {
        throw new Error(`Failed to search recipes: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Search nodes
 */
export async function searchNodes(query, tag) {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (tag) params.append('tag', tag);
    
    const response = await fetch(`${API_BASE}/nodes?${params}`);
    if (!response.ok) {
        throw new Error(`Failed to search nodes: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Get all components
 */
export async function getAllComponents(category, search) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    const response = await fetch(`${API_BASE}/components?${params}`);
    if (!response.ok) {
        throw new Error(`Failed to get components: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Get component by ID
 */
export async function getComponentById(componentId) {
    const response = await fetch(`${API_BASE}/components/${componentId}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to get component: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Get compatibility rules
 */
export async function getCompatibilityRules(componentId1, componentId2) {
    const params = new URLSearchParams();
    if (componentId1) params.append('componentId1', componentId1);
    if (componentId2) params.append('componentId2', componentId2);
    
    const response = await fetch(`${API_BASE}/compatibility?${params}`);
    if (!response.ok) {
        throw new Error(`Failed to get compatibility rules: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Create node
 */
export async function createNode(node) {
    const response = await fetch(`${API_BASE}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create node');
    }
    return response.json();
}

/**
 * Create option
 */
export async function createOption(option) {
    const response = await fetch(`${API_BASE}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(option)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create option');
    }
    return response.json();
}

/**
 * Create path
 */
export async function createPath(path) {
    const response = await fetch(`${API_BASE}/paths`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(path)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create path');
    }
    return response.json();
}

/**
 * Create or update recipe
 */
export async function createRecipe(recipe) {
    const response = await fetch(`${API_BASE}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create recipe');
    }
    return response.json();
}

/**
 * Update option
 */
export async function updateOption(optionId, option) {
    const response = await fetch(`${API_BASE}/options/${optionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(option)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update option');
    }
    return response.json();
}

/**
 * Batch create or update options
 */
export async function batchUpdateOptions(newOptions, enrichedOptions) {
    const response = await fetch(`${API_BASE}/options/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            newOptions: newOptions || [],
            enrichedOptions: enrichedOptions || []
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to batch update options');
    }
    return response.json();
}

