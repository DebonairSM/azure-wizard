// AI: Builder mode controller. Handles component builder UI and interactions.

import { ComponentBuilder } from './component-builder.js';
import * as componentUI from './component-ui.js';
import indexedDbDataProvider from './data-provider.js';

let componentBuilder = null;
let selectedCategory = 'all';
let allComponents = [];

/**
 * Initialize builder mode
 */
async function initialize() {
    try {
        componentBuilder = new ComponentBuilder(indexedDbDataProvider);
        await componentBuilder.initialize();

        // Load all components
        allComponents = await indexedDbDataProvider.getAllComponents();

        // Get unique categories
        const categories = [...new Set(allComponents.map(c => c.category))].sort();

        // Render initial state
        await renderBuilder();

        // Render categories
        componentUI.renderCategoryFilter(categories, handleCategorySelect, selectedCategory);
        componentUI.renderComponentCatalog(allComponents, handleComponentClick, selectedCategory);
    } catch (error) {
        console.error('Builder initialization error:', error);
        componentUI.showComponentError(`Failed to initialize builder: ${error.message}`);
    }
}

/**
 * Render builder UI
 */
async function renderBuilder() {
    if (!componentBuilder) {
        return;
    }

    // Render cart
    const cart = componentBuilder.getCart();
    componentUI.renderCart(cart, handleRemoveComponent, handleSelectComponent, componentBuilder.selectedComponentId);

    // Render compatibility
    const compatibility = await componentBuilder.checkCompatibility();
    componentUI.renderCompatibilityAlerts(compatibility, async (componentId) => {
        const component = await indexedDbDataProvider.getComponentById(componentId);
        return component ? component.name : componentId;
    });

    // Render selected component config
    const selected = componentBuilder.getSelectedComponent();
    if (selected) {
        const config = componentBuilder.getComponentConfig(selected.componentId);
        componentUI.renderComponentConfig(selected.component, config, handleConfigChange);
    } else {
        componentUI.renderComponentConfig(null, {}, () => {});
    }

    // Render solution preview
    const solution = await componentBuilder.generateSolution();
    componentUI.renderSolutionPreview(solution);
}

/**
 * Handle component click from catalog
 * @param {string} componentId
 */
async function handleComponentClick(componentId) {
    if (!componentBuilder) {
        return;
    }

    try {
        const result = await componentBuilder.addComponent(componentId);

        if (result.success) {
            // Successfully added
            await renderBuilder();
        } else {
            // Show errors
            if (result.errors && result.errors.length > 0) {
                const errorMsg = result.errors.map(e => e.message).join('; ');
                componentUI.showComponentError(errorMsg);
            }
        }
    } catch (error) {
        console.error('Error adding component:', error);
        componentUI.showComponentError(`Error adding component: ${error.message}`);
    }
}

/**
 * Handle remove component from cart
 * @param {string} componentId
 */
async function handleRemoveComponent(componentId) {
    if (!componentBuilder) {
        return;
    }

    componentBuilder.removeComponent(componentId);
    await renderBuilder();
}

/**
 * Handle select component for configuration
 * @param {string} componentId
 */
async function handleSelectComponent(componentId) {
    if (!componentBuilder) {
        return;
    }

    componentBuilder.setSelectedComponent(componentId);
    await renderBuilder();
}

/**
 * Handle category filter select
 * @param {string} category
 */
function handleCategorySelect(category) {
    selectedCategory = category;
    componentUI.renderComponentCatalog(allComponents, handleComponentClick, selectedCategory);
}

/**
 * Handle configuration change
 * @param {string} key
 * @param {any} value
 */
async function handleConfigChange(key, value) {
    if (!componentBuilder || !componentBuilder.selectedComponentId) {
        return;
    }

    const currentConfig = componentBuilder.getComponentConfig(componentBuilder.selectedComponentId);
    componentBuilder.configureComponent(componentBuilder.selectedComponentId, {
        ...currentConfig,
        [key]: value
    });

    await renderBuilder();
}

/**
 * Handle export solution
 */
async function handleExportSolution() {
    if (!componentBuilder) {
        return;
    }

    try {
        const exportData = await componentBuilder.exportCart();
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `azure-solution-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export error:', error);
        componentUI.showComponentError(`Error exporting solution: ${error.message}`);
    }
}

/**
 * Load components from recipe (for recipe-to-component conversion)
 * @param {string} recipeNodeId
 */
async function loadComponentsFromRecipe(recipeNodeId) {
    if (!componentBuilder) {
        await initialize();
    }

    try {
        const componentIds = await componentBuilder.loadComponentsFromRecipe(recipeNodeId);
        
        if (componentIds.length > 0) {
            await renderBuilder();
        } else {
            componentUI.showComponentError('No components found for this recipe');
        }
    } catch (error) {
        console.error('Error loading components from recipe:', error);
        componentUI.showComponentError(`Error loading components: ${error.message}`);
    }
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    const exportButton = document.getElementById('exportSolutionButton');
    if (exportButton) {
        exportButton.addEventListener('click', handleExportSolution);
    }
});

/**
 * Add component to cart and re-render (for use by wizard.js)
 * @param {string} componentId
 * @returns {Promise<Object>}
 */
async function addComponentAndRender(componentId) {
    if (!componentBuilder) {
        await initialize();
    }
    
    const result = await componentBuilder.addComponent(componentId);
    if (result.success) {
        await renderBuilder();
    }
    return result;
}

// Export for use by wizard.js
export { initialize, loadComponentsFromRecipe, addComponentAndRender };


































