// Search service for unified search across nodes, components, and resources
import { searchNodes, getAllComponents, searchRecipes } from './api-client.js';

const DEBOUNCE_DELAY = 300;
const MAX_RESULTS = 10;

let debounceTimer = null;

/**
 * Debounce function to limit API calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
    return function(...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Highlight matching text in a string
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} HTML with highlighted matches
 */
function highlightMatch(text, query) {
    if (!text || !query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncate(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Search across all resources (nodes and components)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of search results with type indicators
 */
export async function searchAll(query) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search-service.js:51',message:'searchAll called',data:{query},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!query || query.trim().length === 0) {
        return [];
    }

    const trimmedQuery = query.trim();
    
    try {
        // Search nodes, components, and recipes in parallel
        const [nodes, components, recipes] = await Promise.all([
            searchNodes(trimmedQuery),
            getAllComponents(null, trimmedQuery),
            searchRecipes(trimmedQuery)
        ]);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search-service.js:63',message:'After searchNodes, getAllComponents, and searchRecipes',data:{nodesCount:nodes?.length||0,componentsCount:components?.length||0,recipesCount:recipes?.length||0,query:trimmedQuery},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        // Format node results
        const nodeResults = nodes.slice(0, MAX_RESULTS).map(node => ({
            id: node.id,
            type: 'node',
            title: node.question || node.id,
            description: node.description || '',
            nodeType: node.nodeType,
            tags: node.tags || []
        }));

        // Format component results
        const componentResults = components.slice(0, MAX_RESULTS).map(component => ({
            id: component.id,
            type: 'component',
            title: component.name || component.id,
            description: component.description || '',
            category: component.category,
            tags: component.tags || [],
            recipeNodeId: component.recipeNodeId || null
        }));

        // Format recipe results
        const recipeResults = recipes.slice(0, MAX_RESULTS).map(recipe => ({
            id: recipe.nodeId || recipe.id,
            type: 'recipe',
            title: recipe.title || recipe.nodeId || recipe.id,
            description: recipe.steps && recipe.steps.length > 0 
                ? `${recipe.steps.length} steps` 
                : 'Recipe',
            nodeId: recipe.nodeId,
            tags: []
        }));

        // Combine and limit total results
        const allResults = [...nodeResults, ...componentResults, ...recipeResults].slice(0, MAX_RESULTS);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search-service.js:96',message:'Final search results',data:{totalResults:allResults.length,recipeCount:recipeResults.length,query:trimmedQuery},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        return allResults;
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

/**
 * Debounced search function
 */
export const debouncedSearch = debounce(async (query, callback) => {
    const results = await searchAll(query);
    if (callback) {
        callback(results);
    }
}, DEBOUNCE_DELAY);

/**
 * Format search result for display
 * @param {Object} result - Search result object
 * @param {string} query - Search query for highlighting
 * @returns {string} HTML string for the result item
 */
export function formatSearchResult(result, query) {
    const highlightedTitle = highlightMatch(result.title, query);
    const highlightedDesc = highlightMatch(truncate(result.description, 80), query);
    const typeBadge = result.type === 'node' ? 'Node' : (result.type === 'recipe' ? 'Recipe' : 'Component');
    const typeClass = result.type === 'node' ? 'search-type-node' : (result.type === 'recipe' ? 'search-type-recipe' : 'search-type-component');
    
    return `
        <div class="search-result-item" data-type="${result.type}" data-id="${result.id}">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">
                        ${highlightedTitle}
                    </div>
                    <div style="font-size: 12px; color: #666; line-height: 1.4;">
                        ${highlightedDesc || 'No description'}
                    </div>
                </div>
                <span class="${typeClass}" style="margin-left: 8px; padding: 2px 8px; background: ${result.type === 'node' ? '#0078d4' : '#107c10'}; color: white; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap;">
                    ${typeBadge}
                </span>
            </div>
        </div>
    `;
}

