// AI: Main wizard controller. This orchestrates the UI, engine, and data loading.
// This is the entry point that wires everything together.

import { WizardEngine } from './wizard-engine.js';
import { loadData } from './data-loader.js';
import * as ui from './ui.js';

let wizardEngine = null;
let pendingMode = null;

/**
 * Initialize the wizard
 */
async function initialize() {
    try {
        // Check if we have server-rendered data
        if (window.SERVER_DATA) {
            // Use server-rendered data directly - no need to show loading
            const currentNode = window.SERVER_DATA.currentNode;
            let options = window.SERVER_DATA.options || [];
            const recipe = window.SERVER_DATA.recipe;
            const isTerminal = window.SERVER_DATA.isTerminal;
            
            // Debug logging
            console.log('[Wizard Init] Server data:', {
                nodeId: currentNode?.id,
                question: currentNode?.question,
                optionsCount: options.length,
                options: options.slice(0, 3).map(o => ({ id: o.id, label: o.label }))
            });
            
            // Create wizard engine (will use IndexedDB as fallback)
            wizardEngine = new WizardEngine();
            if (pendingMode) {
                wizardEngine.setMode(pendingMode);
            }
            wizardEngine.currentNodeId = currentNode.id;
            
            // If no options from server, try loading from IndexedDB or API
            if (options.length === 0 && currentNode?.id) {
                ui.showLoading();
                console.log('[Wizard Init] No options from server, trying fallback...');
                try {
                    // First try IndexedDB
                    options = await wizardEngine.getCurrentOptions();
                    console.log('[Wizard Init] Loaded', options.length, 'options from IndexedDB');
                    
                    // If still no options, try loading from API
                    if (options.length === 0) {
                        console.log('[Wizard Init] No options in IndexedDB, loading from API...');
                        await loadData();
                        wizardEngine = new WizardEngine();
                        wizardEngine.currentNodeId = currentNode.id;
                        options = await wizardEngine.getCurrentOptions();
                        console.log('[Wizard Init] Loaded', options.length, 'options from API');
                    }
                    ui.hideLoading();
                } catch (error) {
                    ui.hideLoading();
                    console.error('[Wizard Init] Error loading options:', error);
                }
            }
            
            // Render with server data
            await renderNode(currentNode, options, recipe, isTerminal);
            // Ensure content is visible (server already rendered it)
            document.getElementById('wizardContent').style.display = 'block';
            document.getElementById('loading').style.display = 'none';
        } else {
            // Load data (will use cache if version matches)
            ui.showLoading();
            await loadData();

            // Create wizard engine
            wizardEngine = new WizardEngine();
            await wizardEngine.initialize();

            // Apply any mode chosen before initialization
            if (pendingMode) {
                wizardEngine.setMode(pendingMode);
            }

            // Render initial state
            await renderCurrentState();
            ui.hideLoading();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        ui.hideLoading();
        ui.showError(`Failed to initialize wizard: ${error.message}`);
    } finally {
        // As a final safeguard, ensure content is visible
        const wizardContent = document.getElementById('wizardContent');
        const loading = document.getElementById('loading');
        if (wizardContent) {
            wizardContent.style.display = 'block';
        }
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

/**
 * Render current wizard state
 */
async function renderCurrentState() {
    if (!wizardEngine) {
        return;
    }

    try {
        const currentNode = await wizardEngine.getCurrentNode();
        if (!currentNode) {
            return;
        }

        const mode = wizardEngine.getMode();

        const breadcrumbs = await wizardEngine.getBreadcrumbs();
        ui.renderBreadcrumbs(breadcrumbs, handleBreadcrumbClick);

        // Show/hide back button
        const backButton = document.getElementById('backButton');
        backButton.style.display = breadcrumbs.length > 1 ? 'block' : 'none';

        // Check if terminal
        if (currentNode.nodeType === 'terminal') {
            const recipe = await wizardEngine.dataProvider.getRecipeForNode(currentNode.id);
            
            if (recipe) {
                const explanation = await wizardEngine.explainPath();
                ui.renderRecipe(recipe, mode, explanation);
            } else {
                ui.showError('Recipe not found for this node.');
            }
        } else {
            // Show node with options
            const options = await wizardEngine.getCurrentOptions();
            ui.renderNode(currentNode, options, handleOptionSelect, mode);
            
            // Hide recipe display
            document.getElementById('recipeDisplay').style.display = 'none';
            document.getElementById('nodeDisplay').style.display = 'block';
        }
    } catch (error) {
        console.error('Render error:', error);
        ui.showError(`Error rendering state: ${error.message}`);
    }
}

/**
 * Render node with server-rendered data
 */
async function renderNode(currentNode, options, recipe, isTerminal) {
    const breadcrumbs = wizardEngine ? await wizardEngine.getBreadcrumbs() : [];
    const mode = wizardEngine ? wizardEngine.getMode() : 'design';
    
    // Debug logging
    console.log('[renderNode] Called with:', {
        nodeId: currentNode?.id,
        question: currentNode?.question,
        optionsCount: options?.length || 0,
        isTerminal,
        hasRecipe: !!recipe,
        mode
    });
    
    ui.renderBreadcrumbs(breadcrumbs, handleBreadcrumbClick);
    
    const backButton = document.getElementById('backButton');
    backButton.style.display = breadcrumbs.length > 1 ? 'block' : 'none';
    
    if (isTerminal && recipe) {
        const explanation = wizardEngine ? await wizardEngine.explainPath() : '';
        ui.renderRecipe(recipe, mode, explanation);
    } else {
        // Ensure options is an array
        const optionsArray = Array.isArray(options) ? options : [];
        console.log('[renderNode] Rendering node with', optionsArray.length, 'options');
        ui.renderNode(currentNode, optionsArray, handleOptionSelect, mode);
        document.getElementById('recipeDisplay').style.display = 'none';
        document.getElementById('nodeDisplay').style.display = 'block';
    }
}

/**
 * Handle option selection
 * @param {string} optionId
 */
async function handleOptionSelect(optionId) {
    if (!wizardEngine) {
        return;
    }

    // If we have server-rendered data, navigate via server
    if (window.SERVER_DATA) {
        const currentNode = window.SERVER_DATA.currentNode;
        window.location.href = `/wizard/navigate?fromNodeId=${currentNode.id}&optionId=${optionId}`;
        return;
    }
    
    // Otherwise use client-side navigation
    // Show loading state during option selection (may trigger research)
    ui.showLoading();
    ui.hideError();
    
    try {
        const result = await wizardEngine.selectOption(optionId);
        ui.hideLoading();
        await renderCurrentState();
    } catch (error) {
        ui.hideLoading();
        console.error('Option selection error:', error);
        ui.showError(`Error selecting option: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Handle back button click
 */
async function handleBack() {
    if (!wizardEngine) {
        return;
    }

    try {
        await wizardEngine.goBack();
        await renderCurrentState();
    } catch (error) {
        console.error('Back navigation error:', error);
        ui.showError(`Error going back: ${error.message}`);
    }
}

/**
 * Handle breadcrumb click
 * @param {string} nodeId
 */
async function handleBreadcrumbClick(nodeId) {
    if (!wizardEngine) {
        return;
    }

    try {
        // Get current breadcrumbs
        const breadcrumbs = await wizardEngine.getBreadcrumbs();
        const targetIndex = breadcrumbs.findIndex(b => b.nodeId === nodeId);
        
        if (targetIndex === -1) {
            return;
        }

        if (targetIndex === 0) {
            // Clicking root - just reset
            await wizardEngine.reset();
            await renderCurrentState();
            return;
        }

        // Save current choice history
        const currentHistory = [...wizardEngine.choiceHistory];
        
        // Breadcrumb structure: [rootNode, choice1Node, choice1Option, choice2Node, choice2Option, ...]
        // If targetIndex is even, it's a node after some choices
        // If targetIndex is odd, it's an option label (skip to next node)
        let targetNodeIndex = targetIndex;
        if (targetNodeIndex % 2 === 1) {
            // Clicked on an option label, go to the node after it
            targetNodeIndex = targetNodeIndex + 1;
        }
        
        // Calculate how many choices to make: (targetNodeIndex - 1) / 2
        // But only if targetNodeIndex > 0 and is even
        const choicesNeeded = targetNodeIndex > 0 ? Math.floor((targetNodeIndex - 1) / 2) : 0;
        
        // Reset and replay choices
        await wizardEngine.reset();
        
        for (let i = 0; i < choicesNeeded && i < currentHistory.length; i++) {
            await wizardEngine.selectOption(currentHistory[i].optionId);
        }

        await renderCurrentState();
    } catch (error) {
        console.error('Breadcrumb navigation error:', error);
        ui.showError(`Error navigating: ${error.message}`);
    }
}

/**
 * Handle load Azure resources
 */
async function handleLoadResources() {
    const button = document.getElementById('loadResourcesButton');
    const originalText = button.textContent;
    
    try {
        button.disabled = true;
        button.textContent = 'Loading...';
        ui.showError('Loading Azure resources and SKUs... This may take a moment.');
        
        const response = await fetch('/api/azure-resources/load', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        ui.showError(`Successfully loaded ${result.loaded || 0} Azure resources and SKUs.`);
        setTimeout(() => ui.hideError(), 5000);
    } catch (error) {
        console.error('Load resources error:', error);
        ui.showError(`Error loading resources: ${error.message}`);
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

/**
 * Handle export
 */
async function handleExport() {
    if (!wizardEngine) {
        return;
    }

    try {
        const exportData = await wizardEngine.exportPath();
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `azure-recipe-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export error:', error);
        ui.showError(`Error exporting: ${error.message}`);
    }
}

/**
 * Update mode buttons active state
 * @param {string} mode
 */
function updateModeButtons(mode) {
    const designBtn = document.getElementById('designModeButton');
    const studyBtn = document.getElementById('studyModeButton');
    if (designBtn && studyBtn) {
        designBtn.classList.toggle('active', mode === 'design');
        studyBtn.classList.toggle('active', mode === 'study');
    }
}

/**
 * Handle mode change
 * @param {string} mode
 */
function handleModeChange(mode) {
    if (!wizardEngine) {
        pendingMode = mode;
        updateModeButtons(mode);
        return;
    }

    wizardEngine.setMode(mode);
    updateModeButtons(mode);
    renderCurrentState();
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Back button
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', handleBack);
    }

    // Mode buttons
    const designModeButton = document.getElementById('designModeButton');
    const studyModeButton = document.getElementById('studyModeButton');
    if (designModeButton) {
        designModeButton.addEventListener('click', () => handleModeChange('design'));
    }
    if (studyModeButton) {
        studyModeButton.addEventListener('click', () => handleModeChange('study'));
    }

    // Export button
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', handleExport);
    }

    // Load Azure Resources button
    const loadResourcesButton = document.getElementById('loadResourcesButton');
    if (loadResourcesButton) {
        loadResourcesButton.addEventListener('click', handleLoadResources);
    }

    // Ensure content is visible if we have server-rendered data
    if (window.SERVER_DATA) {
        const wizardContent = document.getElementById('wizardContent');
        const loading = document.getElementById('loading');
        if (wizardContent) {
            wizardContent.style.display = 'block';
        }
        if (loading) {
            loading.style.display = 'none';
        }
    }

    // Initialize
    initialize().catch(error => {
        console.error('Failed to initialize wizard:', error);
        // Ensure content is visible even on error
        const wizardContent = document.getElementById('wizardContent');
        const loading = document.getElementById('loading');
        if (wizardContent) {
            wizardContent.style.display = 'block';
        }
        if (loading) {
            loading.style.display = 'none';
        }
    });
});
