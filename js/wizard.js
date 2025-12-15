// AI: Main wizard controller. This orchestrates the UI, engine, and data loading.
// This is the entry point that wires everything together.

import { WizardEngine } from './wizard-engine.js';
import { loadData } from './data-loader.js';
import * as ui from './ui.js';
import * as builder from './builder.js';
import * as research from './research-service.js';

let wizardEngine = null;
let currentMode = 'wizard'; // 'wizard' or 'builder'

/**
 * Initialize the wizard
 */
async function initialize() {
    try {
        ui.showLoading();

        // Check if we have server-rendered data
        if (window.SERVER_DATA) {
            // Use server-rendered data directly
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
            wizardEngine.currentNodeId = currentNode.id;
            
            // If no options from server, try loading from IndexedDB or API
            if (options.length === 0 && currentNode?.id) {
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
                } catch (error) {
                    console.error('[Wizard Init] Error loading options:', error);
                }
            }
            
            // Render with server data
            await renderNode(currentNode, options, recipe, isTerminal);
        } else {
            // Load data (will use cache if version matches)
            await loadData();

            // Create wizard engine
            wizardEngine = new WizardEngine();
            await wizardEngine.initialize();

            // Render initial state
            await renderCurrentState();
        }

        ui.hideLoading();
    } catch (error) {
        console.error('Initialization error:', error);
        ui.showError(`Failed to initialize wizard: ${error.message}`);
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
            let recipe = await wizardEngine.dataProvider.getRecipeForNode(currentNode.id);
            
            // If no recipe, try to research and generate one
            if (!recipe) {
                try {
                    const breadcrumbs = await wizardEngine.getBreadcrumbs();
                    recipe = await research.researchRecipe(currentNode.id, currentNode, breadcrumbs);
                    
                    if (recipe) {
                        // Reload data to get the new recipe
                        await loadData();
                        recipe = await wizardEngine.dataProvider.getRecipeForNode(currentNode.id);
                    }
                } catch (researchError) {
                    console.error('Research recipe error:', researchError);
                }
            }
            
            if (recipe) {
                const explanation = await wizardEngine.explainPath();
                ui.renderRecipe(recipe, mode, explanation);
            } else {
                ui.showError('Recipe not found. Research is in progress or failed. Please try again.');
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
    const mode = wizardEngine ? wizardEngine.getMode() : 'design';
    const breadcrumbs = wizardEngine ? await wizardEngine.getBreadcrumbs() : [];
    
    // Debug logging
    console.log('[renderNode] Called with:', {
        nodeId: currentNode?.id,
        question: currentNode?.question,
        optionsCount: options?.length || 0,
        isTerminal,
        hasRecipe: !!recipe
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

    try {
        // If we have server-rendered data, navigate via server
        if (window.SERVER_DATA) {
            const currentNode = window.SERVER_DATA.currentNode;
            window.location.href = `/wizard/navigate?fromNodeId=${currentNode.id}&optionId=${optionId}`;
            return;
        }
        
        // Otherwise use client-side navigation
        const result = await wizardEngine.selectOption(optionId);
        await renderCurrentState();
    } catch (error) {
        console.error('Option selection error:', error);
        ui.showError(`Error selecting option: ${error.message}`);
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
 * Handle wizard mode toggle (study/design)
 * @param {string} mode
 */
async function handleWizardModeToggle(mode) {
    if (!wizardEngine) {
        return;
    }

    wizardEngine.setMode(mode);
    await renderCurrentState();

    // Update button states
    document.querySelectorAll('[data-wizard-mode]').forEach(btn => {
        if (btn.dataset.wizardMode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Handle app mode toggle (wizard/builder)
 * @param {string} mode
 */
async function handleAppModeToggle(mode) {
    currentMode = mode;

    if (mode === 'wizard') {
        // Show wizard, hide builder
        document.getElementById('wizardContainer').style.display = 'block';
        document.getElementById('builderContainer').style.display = 'none';
        document.getElementById('wizardModeToggle').style.display = 'flex';
        
        // Render wizard state
        if (wizardEngine) {
            await renderCurrentState();
        }
    } else if (mode === 'builder') {
        // Show builder, hide wizard
        document.getElementById('wizardContainer').style.display = 'none';
        document.getElementById('builderContainer').style.display = 'block';
        document.getElementById('wizardModeToggle').style.display = 'none';
        
        // Initialize builder
        await builder.initialize();
    }

    // Update button states
    document.querySelectorAll('[data-mode]').forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Handle start building from recipe
 */
async function handleStartBuilding() {
    if (!wizardEngine) {
        return;
    }

    const currentNode = await wizardEngine.getCurrentNode();
    if (!currentNode || currentNode.nodeType !== 'terminal') {
        return;
    }

    // Switch to builder mode
    await handleAppModeToggle('builder');

    // Load components from recipe
    await builder.loadComponentsFromRecipe(currentNode.id);
}

/**
 * Handle search
 * @param {string} query
 */
async function handleSearch(query) {
    if (!wizardEngine || !query.trim()) {
        ui.hideSearchResults();
        return;
    }

    try {
        // Try text search first
        const textResults = await wizardEngine.searchNodesByText(query);
        
        // Also try tag search
        const tagResults = await wizardEngine.searchNodesByTag(query);

        // Combine and deduplicate
        const allResults = [...textResults, ...tagResults];
        const uniqueResults = Array.from(
            new Map(allResults.map(node => [node.id, node])).values()
        );

        // If no results, offer to research
        if (uniqueResults.length === 0) {
            ui.showResearchPrompt(query, async () => {
                try {
                    ui.showLoading();
                    const newNodes = await research.researchSearchQuery(query);
                    ui.hideLoading();
                    
                    if (newNodes && newNodes.length > 0) {
                        // Reload data and show results
                        await loadData();
                        await wizardEngine.initialize();
                        ui.renderSearchResults(newNodes, handleSearchNodeSelect);
                    } else {
                        ui.showError('No new information found. Try a different search term.');
                    }
                } catch (error) {
                    ui.hideLoading();
                    ui.showError(`Research error: ${error.message}`);
                }
            });
        } else {
            ui.renderSearchResults(uniqueResults, handleSearchNodeSelect);
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

/**
 * Handle search result selection
 * @param {string} nodeId
 */
async function handleSearchNodeSelect(nodeId) {
    if (!wizardEngine) {
        return;
    }

    try {
        await wizardEngine.jumpToNode(nodeId);
        await renderCurrentState();
    } catch (error) {
        console.error('Search navigation error:', error);
        ui.showError(`Error navigating to node: ${error.message}`);
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

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    // App mode toggle buttons (wizard/builder)
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            handleAppModeToggle(btn.dataset.mode);
        });
    });

    // Wizard mode toggle buttons (study/design)
    document.querySelectorAll('[data-wizard-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            handleWizardModeToggle(btn.dataset.wizardMode);
        });
    });

    // Back button
    document.getElementById('backButton').addEventListener('click', handleBack);

    // Export button
    document.getElementById('exportButton').addEventListener('click', handleExport);

    // Start building button
    const startBuildingButton = document.getElementById('startBuildingButton');
    if (startBuildingButton) {
        startBuildingButton.addEventListener('click', handleStartBuilding);
    }

    // Search box
    const searchBox = document.querySelector('.search-box');
    let searchTimeout;
    searchBox.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            handleSearch(e.target.value);
        }, 300);
    });

    // Hide search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box') && !e.target.closest('.search-results')) {
            ui.hideSearchResults();
        }
    });

    // Research button
    const researchButton = document.getElementById('researchButton');
    const researchInput = document.getElementById('researchInput');
    researchButton.addEventListener('click', async () => {
        const topic = researchInput.value.trim();
        if (!topic) {
            ui.showError('Please enter a topic to research');
            return;
        }

        try {
            ui.showLoading();
            const result = await research.researchTopic(topic);
            ui.hideLoading();
            
            // Reload data and navigate to new node
            await loadData();
            await wizardEngine.initialize();
            await wizardEngine.jumpToNode(result.node.id);
            await renderCurrentState();
            
            researchInput.value = '';
            ui.showError('Research completed! New node added.');
            setTimeout(() => ui.hideError(), 3000);
        } catch (error) {
            ui.hideLoading();
            ui.showError(`Research error: ${error.message}`);
        }
    });

    // Research input enter key
    researchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            researchButton.click();
        }
    });

    // API Key button
    document.getElementById('apiKeyButton').addEventListener('click', () => {
        ui.showApiKeyDialog();
    });

    // Improve button
    const improveButton = document.getElementById('improveButton');
    improveButton.addEventListener('click', async () => {
        const nodeId = improveButton.dataset.nodeId;
        if (!nodeId || !wizardEngine) {
            return;
        }

        try {
            // Set loading state
            ui.setImproveButtonLoading(true);
            ui.showError('Improving node options... This may take a moment.');

            // Call improve function
            const result = await research.improveNode(nodeId);

            // Reload data to get updated options
            await loadData();
            
            // Navigate back to the same node to show updated options
            await wizardEngine.jumpToNode(nodeId);
            await renderCurrentState();

            // Show success message
            const newCount = result.newOptions?.length || 0;
            const enrichedCount = result.enrichedOptions?.length || 0;
            let message = 'Improvement completed! ';
            if (newCount > 0) {
                message += `Added ${newCount} new option${newCount > 1 ? 's' : ''}. `;
            }
            if (enrichedCount > 0) {
                message += `Enriched ${enrichedCount} existing option${enrichedCount > 1 ? 's' : ''}.`;
            }
            ui.showError(message);
            setTimeout(() => ui.hideError(), 5000);
        } catch (error) {
            console.error('Improve node error:', error);
            ui.showError(`Improvement error: ${error.message}`);
        } finally {
            ui.setImproveButtonLoading(false);
        }
    });

    // Initialize
    initialize();
});

