// AI: Safe JSON file updates
// Reads, updates, and writes seed-data.json with validation

import { loadJsonData } from './data-loader.js';
import { validateTreeStructure } from './data-loader.js';

/**
 * Load current JSON data
 * @returns {Promise<Object>}
 */
async function loadCurrentData() {
    return await loadJsonData('data/seed-data.json');
}

/**
 * Generate next version number
 * @param {string} currentVersion - Current version string (e.g., "2025.01.18")
 * @returns {string}
 */
function generateNextVersion(currentVersion) {
    if (!currentVersion) {
        return new Date().toISOString().split('T')[0].replace(/-/g, '.');
    }
    
    // Try to parse date format (YYYY.MM.DD)
    const match = currentVersion.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
    if (match) {
        const [, year, month, day] = match;
        const date = new Date(year, parseInt(month) - 1, parseInt(day));
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0].replace(/-/g, '.');
    }
    
    // Fallback: append timestamp
    return `${currentVersion}.${Date.now()}`;
}

/**
 * Add a node to JSON data
 * @param {Object} node - Node object
 * @returns {Promise<Object>} - Updated data
 */
export async function addNode(node) {
    const data = await loadCurrentData();
    
    // Check if node already exists
    if (data.nodes.find(n => n.id === node.id)) {
        throw new Error(`Node ${node.id} already exists`);
    }
    
    data.nodes.push(node);
    data.version = generateNextVersion(data.version);
    
    return data;
}

/**
 * Add an option to JSON data
 * @param {Object} option - Option object
 * @returns {Promise<Object>} - Updated data
 */
export async function addOption(option) {
    const data = await loadCurrentData();
    
    // Check if option already exists
    if (data.options.find(o => o.id === option.id)) {
        throw new Error(`Option ${option.id} already exists`);
    }
    
    // Verify node exists
    if (!data.nodes.find(n => n.id === option.nodeId)) {
        throw new Error(`Node ${option.nodeId} not found`);
    }
    
    data.options.push(option);
    data.version = generateNextVersion(data.version);
    
    return data;
}

/**
 * Add a path to JSON data
 * @param {Object} path - Path object { fromNodeId, fromOptionId, toNodeId }
 * @returns {Promise<Object>} - Updated data
 */
export async function addPath(path) {
    const data = await loadCurrentData();
    
    // Validate that target node exists
    if (!data.nodes.find(n => n.id === path.toNodeId)) {
        throw new Error(`Cannot create path: target node ${path.toNodeId} not found`);
    }
    
    // Validate that source node exists
    if (!data.nodes.find(n => n.id === path.fromNodeId)) {
        throw new Error(`Cannot create path: source node ${path.fromNodeId} not found`);
    }
    
    // Validate that option exists
    if (!data.options.find(o => o.id === path.fromOptionId)) {
        throw new Error(`Cannot create path: option ${path.fromOptionId} not found`);
    }
    
    // Check if path already exists
    const existing = data.paths.find(
        p => p.fromNodeId === path.fromNodeId && 
             p.fromOptionId === path.fromOptionId
    );
    if (existing) {
        // Validate new target node exists before updating
        if (!data.nodes.find(n => n.id === path.toNodeId)) {
            throw new Error(`Cannot update path: target node ${path.toNodeId} not found`);
        }
        existing.toNodeId = path.toNodeId;
    } else {
        data.paths.push(path);
    }
    
    data.version = generateNextVersion(data.version);
    
    return data;
}

/**
 * Add or update a recipe in JSON data
 * @param {Object} recipe - Recipe object
 * @returns {Promise<Object>} - Updated data
 */
export async function addRecipe(recipe) {
    const data = await loadCurrentData();
    
    // Check if recipe already exists
    const existingIndex = data.recipes.findIndex(r => r.nodeId === recipe.nodeId);
    if (existingIndex >= 0) {
        // Update existing recipe
        data.recipes[existingIndex] = recipe;
    } else {
        data.recipes.push(recipe);
    }
    
    data.version = generateNextVersion(data.version);
    
    return data;
}

/**
 * Update version field
 * @param {string} newVersion - New version string
 * @returns {Promise<Object>} - Updated data
 */
export async function updateVersion(newVersion) {
    const data = await loadCurrentData();
    data.version = newVersion;
    return data;
}

/**
 * Save JSON data to file using File System Access API if available
 * Falls back to helper script or download
 * @param {Object} data - Data to save
 * @returns {Promise<boolean>} - True if saved directly, false if download triggered
 */
export async function saveJsonFile(data) {
    // Validate before saving
    validateTreeStructure(data);
    
    const jsonStr = JSON.stringify(data, null, 2);
    
    // Try File System Access API first (Chrome/Edge)
    if ('showSaveFilePicker' in window) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: 'seed-data.json',
                types: [{
                    description: 'JSON files',
                    accept: { 'application/json': ['.json'] }
                }],
                startIn: 'documents'
            });
            
            const writable = await fileHandle.createWritable();
            await writable.write(jsonStr);
            await writable.close();
            
            // Store in localStorage as backup
            localStorage.setItem('azureWizardDataBackup', jsonStr);
            localStorage.setItem('azureWizardDataVersion', data.version);
            
            console.log('File saved successfully using File System Access API');
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('File System Access API failed:', error);
            }
            // Fall through to other methods
        }
    }
    
    // Try helper script via fetch (if running locally)
    try {
        const response = await fetch('http://localhost:3031/write-json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: jsonStr
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log('File saved successfully via helper script');
                localStorage.setItem('azureWizardDataBackup', jsonStr);
                localStorage.setItem('azureWizardDataVersion', data.version);
                return true;
            }
        }
    } catch (error) {
        // Helper script not available, continue to download
        console.debug('Helper script not available:', error.message);
    }
    
    // Fallback: trigger download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seed-data-${data.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Store in localStorage as backup
    localStorage.setItem('azureWizardDataBackup', jsonStr);
    localStorage.setItem('azureWizardDataVersion', data.version);
    
    console.log('JSON data prepared for download. Please save it to data/seed-data.json');
    console.log('Version:', data.version);
    return false;
}

/**
 * Save JSON data (attempts to update file via fetch if possible)
 * Falls back to download if direct write not available
 * @param {Object} data - Data to save
 * @returns {Promise<boolean>} - True if saved successfully, false if download triggered
 */
export async function saveJsonData(data) {
    try {
        // Validate before saving
        validateTreeStructure(data);
        
        // Try to save via fetch (requires backend endpoint)
        // For now, we'll use download method
        await saveJsonFile(data);
        return false; // Indicates download was triggered
    } catch (error) {
        console.error('Error saving JSON:', error);
        throw error;
    }
}

/**
 * Batch add multiple items
 * @param {Object} items - { nodes: [], options: [], paths: [], recipes: [] }
 * @returns {Promise<Object>} - Updated data
 */
export async function batchAdd(items) {
    const data = await loadCurrentData();
    
    // Add nodes
    if (items.nodes) {
        items.nodes.forEach(node => {
            if (!data.nodes.find(n => n.id === node.id)) {
                data.nodes.push(node);
            }
        });
    }
    
    // Add options
    if (items.options) {
        items.options.forEach(option => {
            if (!data.options.find(o => o.id === option.id)) {
                data.options.push(option);
            }
        });
    }
    
    // Add paths
    if (items.paths) {
        items.paths.forEach(path => {
            // Validate target node exists
            if (!data.nodes.find(n => n.id === path.toNodeId)) {
                throw new Error(`Cannot create path: target node ${path.toNodeId} not found`);
            }
            // Validate source node exists
            if (!data.nodes.find(n => n.id === path.fromNodeId)) {
                throw new Error(`Cannot create path: source node ${path.fromNodeId} not found`);
            }
            
            const existing = data.paths.find(
                p => p.fromNodeId === path.fromNodeId && 
                     p.fromOptionId === path.fromOptionId
            );
            if (!existing) {
                data.paths.push(path);
            } else {
                // Validate new target node exists before updating
                if (!data.nodes.find(n => n.id === path.toNodeId)) {
                    throw new Error(`Cannot update path: target node ${path.toNodeId} not found`);
                }
                existing.toNodeId = path.toNodeId;
            }
        });
    }
    
    // Add/update recipes
    if (items.recipes) {
        items.recipes.forEach(recipe => {
            const existingIndex = data.recipes.findIndex(r => r.nodeId === recipe.nodeId);
            if (existingIndex >= 0) {
                data.recipes[existingIndex] = recipe;
            } else {
                data.recipes.push(recipe);
            }
        });
    }
    
    data.version = generateNextVersion(data.version);
    
    return data;
}

/**
 * Update existing options with enriched data
 * @param {Array} enrichedOptions - Array of enriched option objects (must have matching label)
 * @returns {Promise<Object>} - Updated data
 */
export async function updateOptions(enrichedOptions) {
    const data = await loadCurrentData();
    
    enrichedOptions.forEach(enrichedOpt => {
        // Find existing option by label (case-insensitive)
        const existingIndex = data.options.findIndex(
            opt => opt.label.toLowerCase() === enrichedOpt.label.toLowerCase()
        );
        
        if (existingIndex >= 0) {
            // Merge enriched data into existing option
            const existing = data.options[existingIndex];
            
            // Update fields if provided in enriched option
            if (enrichedOpt.description) existing.description = enrichedOpt.description;
            if (enrichedOpt.pros && Array.isArray(enrichedOpt.pros)) existing.pros = enrichedOpt.pros;
            if (enrichedOpt.cons && Array.isArray(enrichedOpt.cons)) existing.cons = enrichedOpt.cons;
            if (enrichedOpt.whenToUse) existing.whenToUse = enrichedOpt.whenToUse;
            if (enrichedOpt.whenNotToUse) existing.whenNotToUse = enrichedOpt.whenNotToUse;
            
            // Preserve other fields (id, nodeId, etc.)
            data.options[existingIndex] = existing;
        } else {
            console.warn(`Option with label "${enrichedOpt.label}" not found for update`);
        }
    });
    
    data.version = generateNextVersion(data.version);
    
    return data;
}

/**
 * Batch update: add new options and update existing ones
 * @param {Array} newOptions - New options to add
 * @param {Array} enrichedOptions - Enriched options to update (matched by label)
 * @returns {Promise<Object>} - Updated data
 */
export async function batchUpdateOptions(newOptions, enrichedOptions) {
    const data = await loadCurrentData();
    
    // Add new options
    if (newOptions && newOptions.length > 0) {
        newOptions.forEach(option => {
            // Generate ID if not provided
            if (!option.id) {
                const baseId = option.label.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                option.id = `${option.nodeId || 'opt'}-${baseId}`;
            }
            
            // Ensure nodeId is set
            if (!option.nodeId) {
                throw new Error(`Option "${option.label}" missing nodeId`);
            }
            
            // Verify node exists
            if (!data.nodes.find(n => n.id === option.nodeId)) {
                throw new Error(`Node ${option.nodeId} not found for option ${option.label}`);
            }
            
            // Check if option already exists
            if (!data.options.find(o => o.id === option.id)) {
                data.options.push(option);
            }
        });
    }
    
    // Update existing options
    if (enrichedOptions && enrichedOptions.length > 0) {
        enrichedOptions.forEach(enrichedOpt => {
            // Find existing option by label (case-insensitive)
            const existingIndex = data.options.findIndex(
                opt => opt.label.toLowerCase() === enrichedOpt.label.toLowerCase()
            );
            
            if (existingIndex >= 0) {
                const existing = data.options[existingIndex];
                
                // Merge enriched data
                if (enrichedOpt.description) existing.description = enrichedOpt.description;
                if (enrichedOpt.pros && Array.isArray(enrichedOpt.pros)) existing.pros = enrichedOpt.pros;
                if (enrichedOpt.cons && Array.isArray(enrichedOpt.cons)) existing.cons = enrichedOpt.cons;
                if (enrichedOpt.whenToUse) existing.whenToUse = enrichedOpt.whenToUse;
                if (enrichedOpt.whenNotToUse) existing.whenNotToUse = enrichedOpt.whenNotToUse;
                
                data.options[existingIndex] = existing;
            } else {
                console.warn(`Option with label "${enrichedOpt.label}" not found for update`);
            }
        });
    }
    
    data.version = generateNextVersion(data.version);
    
    return data;
}
