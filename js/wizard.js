// AI: Main wizard controller. This orchestrates the UI, engine, and data loading.
// This is the entry point that wires everything together.

import { WizardEngine } from './wizard-engine.js';
import { loadData } from './data-loader.js';
import * as ui from './ui.js';
import { generateBicepTemplate, generateDeploymentScript, generateDeploymentScriptPowerShell, generateReadme } from './bicep-generator.js';

let wizardEngine = null;
let pendingMode = null;

// Mode persistence key
const MODE_STORAGE_KEY = 'azureWizardMode';

/**
 * Get saved mode from localStorage
 * @returns {string} - 'study' or 'design' (default: 'design')
 */
function getSavedMode() {
    try {
        const saved = localStorage.getItem(MODE_STORAGE_KEY);
        return saved === 'study' || saved === 'design' ? saved : 'design';
    } catch (error) {
        console.warn('[Wizard] Failed to get saved mode:', error);
        return 'design';
    }
}

/**
 * Save mode to localStorage
 * @param {string} mode - 'study' or 'design'
 */
function saveMode(mode) {
    try {
        if (mode === 'study' || mode === 'design') {
            localStorage.setItem(MODE_STORAGE_KEY, mode);
            console.log('[Wizard] Saved mode to localStorage:', mode);
        }
    } catch (error) {
        console.warn('[Wizard] Failed to save mode:', error);
    }
}

/**
 * Initialize the wizard
 */
async function initialize() {
    try {
        // Load saved mode from localStorage
        const savedMode = getSavedMode();
        if (!pendingMode) {
            pendingMode = savedMode;
        }
        
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
            // Set mode from saved preference or pending mode
            const modeToUse = pendingMode || savedMode;
            wizardEngine.setMode(modeToUse);
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
                        // Restore mode after recreating engine
                        wizardEngine.setMode(modeToUse);
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
            
            // Update mode buttons to reflect current mode
            const currentMode = wizardEngine.getMode();
            updateModeButtons(currentMode);
        } else {
            // Load data (will use cache if version matches)
            ui.showLoading();
            await loadData();

            // Create wizard engine
            wizardEngine = new WizardEngine();
            await wizardEngine.initialize();

            // Apply any mode chosen before initialization, or use saved mode
            const modeToUse = pendingMode || savedMode;
            wizardEngine.setMode(modeToUse);

            // Render initial state
            await renderCurrentState();
            ui.hideLoading();
            
            // Update mode buttons to reflect current mode
            const currentMode = wizardEngine.getMode();
            updateModeButtons(currentMode);
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

        // Show back button only if not at root - check nodeType directly
        const backButton = document.getElementById('backButton');
        const isAtRoot = currentNode.nodeType === 'root';
        backButton.style.display = isAtRoot ? 'none' : 'block';
        backButton.disabled = false;

        // Check if terminal
        if (currentNode.nodeType === 'terminal') {
            const recipe = await wizardEngine.dataProvider.getRecipeForNode(currentNode.id);
            
            if (recipe) {
                const explanation = await wizardEngine.explainPath();
                ui.renderRecipe(recipe, mode, explanation);
            } else {
                ui.showError('Recipe not found for this node.');
            }
        } else if (currentNode.nodeType === 'feature-selection') {
            // Show feature selection form
            ui.renderFeatureSelection(currentNode, handleFeatureSubmit);
            
            // Hide recipe display
            document.getElementById('recipeDisplay').style.display = 'none';
            document.getElementById('nodeDisplay').style.display = 'block';
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
    
    // Show back button only if not at root - check nodeType directly
    const backButton = document.getElementById('backButton');
    const isAtRoot = currentNode.nodeType === 'root';
    backButton.style.display = isAtRoot ? 'none' : 'block';
    backButton.disabled = false;
    
    if (isTerminal && recipe) {
        const explanation = wizardEngine ? await wizardEngine.explainPath() : '';
        ui.renderRecipe(recipe, mode, explanation);
    } else if (currentNode.nodeType === 'feature-selection') {
        // Show feature selection form
        ui.renderFeatureSelection(currentNode, handleFeatureSubmit);
        document.getElementById('recipeDisplay').style.display = 'none';
        document.getElementById('nodeDisplay').style.display = 'block';
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
 * Handle feature selection form submission
 * @param {Array<string>} selectedFeatures
 */
async function handleFeatureSubmit(selectedFeatures) {
    if (!wizardEngine) {
        return;
    }

    // Get feature data from sessionStorage (includes config options)
    const featureDataStr = sessionStorage.getItem('apim-ai-gateway-selected-features');
    let featureData = { features: selectedFeatures };
    if (featureDataStr) {
        try {
            const stored = JSON.parse(featureDataStr);
            featureData = stored.features ? stored : { features: selectedFeatures, config: stored.config || {} };
        } catch (e) {
            // Fallback to array format
            featureData = { features: selectedFeatures };
        }
    }

    // Store features in sessionStorage
    sessionStorage.setItem('apim-ai-gateway-selected-features', JSON.stringify(featureData));

    // If we have server-rendered data, navigate via server
    if (window.SERVER_DATA) {
        const currentNode = window.SERVER_DATA.currentNode;
        // Navigate to recipe with features as query params
        const featuresParam = encodeURIComponent(JSON.stringify(featureData));
        window.location.href = `/wizard/navigate?fromNodeId=${currentNode.id}&optionId=feature-selection-submit&features=${featuresParam}`;
        return;
    }
    
    // Otherwise use client-side navigation
    ui.showLoading();
    ui.hideError();
    
    try {
        // Navigate to recipe node using the special option ID
        const result = await wizardEngine.selectOption('feature-selection-submit');
        ui.hideLoading();
        await renderCurrentState();
    } catch (error) {
        ui.hideLoading();
        console.error('Feature selection error:', error);
        ui.showError(`Error submitting features: ${error.message || 'Unknown error'}`);
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
    // If using server-side rendering, use server route to go back one step
    if (window.SERVER_DATA) {
        const currentNode = window.SERVER_DATA.currentNode;
        if (currentNode && currentNode.nodeType === 'root') {
            // Already at root, do nothing
            return;
        }
        // Navigate back via server using prevNodeId from URL
        const prevNodeId = window.SERVER_DATA.prevNodeId || '';
        window.location.href = `/wizard/back?currentNodeId=${currentNode.id}&prevNodeId=${prevNodeId}`;
        return;
    }

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
/**
 * Handle export - generate Bicep templates and export package
 */
async function handleExport() {
    if (!wizardEngine) {
        return;
    }

    try {
        // Get current node - should be terminal node with recipe
        const currentNode = await wizardEngine.getCurrentNode();
        if (!currentNode || currentNode.nodeType !== 'terminal') {
            ui.showError('No recipe available to export. Please navigate to a recipe first.');
            return;
        }

        // Get recipe data using the correct method
        const recipe = await wizardEngine.dataProvider.getRecipeForNode(currentNode.id);
        if (!recipe) {
            ui.showError('Recipe not found');
            return;
        }

        // Get selected features
        let selectedFeatures = [];
        try {
            const featuresStr = sessionStorage.getItem('apim-ai-gateway-selected-features');
            if (featuresStr) {
                const featuresData = JSON.parse(featuresStr);
                selectedFeatures = Array.isArray(featuresData) ? featuresData : 
                                 (featuresData.features || []);
            }
        } catch (e) {
            console.warn('Could not parse selected features:', e);
        }

        // Generate Bicep templates
        const bicepFiles = generateBicepTemplate(recipe, selectedFeatures, {});
        
        // Generate deployment scripts
        const deployScript = generateDeploymentScript(recipe, selectedFeatures, {});
        const deployScriptPS = generateDeploymentScriptPowerShell(recipe, selectedFeatures, {});
        
        // Generate README
        const readme = generateReadme(recipe, selectedFeatures, {});
        
        // Get export data for JSON
        const exportData = await wizardEngine.exportPath();
        const recipeJson = JSON.stringify(exportData, null, 2);

        // Display recipe JSON on screen
        const recipeExportDisplay = document.getElementById('recipeExportDisplay');
        const recipeJsonDisplay = document.getElementById('recipeJsonDisplay');
        const copyRecipeButton = document.getElementById('copyRecipeButton');
        
        if (recipeExportDisplay && recipeJsonDisplay) {
            recipeJsonDisplay.textContent = recipeJson;
            recipeExportDisplay.style.display = 'block';
            
            // Scroll to the export display area
            recipeExportDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Set up copy button functionality
            if (copyRecipeButton) {
                copyRecipeButton.onclick = async () => {
                    try {
                        await navigator.clipboard.writeText(recipeJson);
                        // Show feedback notification
                        const notification = document.createElement('div');
                        notification.className = 'copy-notification';
                        notification.textContent = 'Recipe copied to clipboard!';
                        document.body.appendChild(notification);
                        setTimeout(() => notification.remove(), 2000);
                    } catch (err) {
                        console.error('Failed to copy recipe:', err);
                        ui.showError('Failed to copy recipe to clipboard');
                    }
                };
            }
        }

        // Create ZIP file using JSZip (if available) or download individual files
        if (typeof JSZip !== 'undefined') {
            const zip = new JSZip();
            
            // Add Bicep files
            zip.file('main.bicep', bicepFiles.main);
            zip.file('parameters.bicep', bicepFiles.parameters);
            
            // Add deployment scripts
            zip.file('deploy.sh', deployScript);
            zip.file('deploy.ps1', deployScriptPS);
            
            // Add README
            zip.file('README.md', readme);
            
            // Add recipe metadata
            zip.file('recipe.json', recipeJson);
            
            // Generate and download ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `azure-recipe-${recipe.title?.toLowerCase().replace(/\s+/g, '-') || 'deployment'}-${new Date().toISOString().split('T')[0]}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // Fallback: download main.bicep file
            const blob = new Blob([bicepFiles.main], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `main.bicep`;
            a.click();
            URL.revokeObjectURL(url);
            
            ui.showError('JSZip not available. Only main.bicep downloaded. Install JSZip for full export package.');
        }
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
    console.log('[Wizard] updateModeButtons called with mode:', mode);
    console.log('[Wizard] Buttons found:', { design: !!designBtn, study: !!studyBtn });
    
    if (designBtn && studyBtn) {
        designBtn.classList.toggle('active', mode === 'design');
        studyBtn.classList.toggle('active', mode === 'study');
        console.log('[Wizard] Updated button states:', {
            design: designBtn.classList.contains('active'),
            study: studyBtn.classList.contains('active')
        });
    } else {
        console.warn('[Wizard] Could not update mode buttons - buttons not found');
    }
}

/**
 * Handle mode change
 * @param {string} mode
 */
async function handleModeChange(mode) {
    console.log('[Wizard] handleModeChange called with mode:', mode);
    console.log('[Wizard] wizardEngine exists:', !!wizardEngine);
    console.log('[Wizard] Has SERVER_DATA:', !!window.SERVER_DATA);
    
    if (!wizardEngine) {
        console.log('[Wizard] No wizardEngine yet, setting pendingMode to:', mode);
        pendingMode = mode;
        saveMode(mode); // Persist mode even before engine is ready
        updateModeButtons(mode);
        return;
    }

    console.log('[Wizard] Setting mode to:', mode);
    wizardEngine.setMode(mode);
    saveMode(mode); // Persist mode to localStorage
    updateModeButtons(mode);
    
    // If we have server-rendered data, re-render using that data with new mode
    if (window.SERVER_DATA) {
        console.log('[Wizard] Re-rendering with server data and new mode...');
        const currentNode = window.SERVER_DATA.currentNode;
        const options = window.SERVER_DATA.options || [];
        const recipe = window.SERVER_DATA.recipe;
        const isTerminal = window.SERVER_DATA.isTerminal;
        
        await renderNode(currentNode, options, recipe, isTerminal);
    } else {
        console.log('[Wizard] Rendering current state...');
        await renderCurrentState();
    }
    console.log('[Wizard] Mode change complete');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    console.log('[Wizard] Setting up event listeners');
    
    // Back button
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', handleBack);
    }

    // Mode buttons
    const designModeButton = document.getElementById('designModeButton');
    const studyModeButton = document.getElementById('studyModeButton');
    
    console.log('[Wizard] Mode buttons found:', {
        design: !!designModeButton,
        study: !!studyModeButton
    });
    
    if (designModeButton) {
        designModeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Wizard] Design mode button clicked');
            handleModeChange('design').catch(error => {
                console.error('Error changing to design mode:', error);
                ui.showError(`Error changing mode: ${error.message}`);
            });
        });
        console.log('[Wizard] Design mode button event listener attached');
    } else {
        console.warn('[Wizard] Design mode button not found');
    }
    
    if (studyModeButton) {
        studyModeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Wizard] Study mode button clicked');
            handleModeChange('study').catch(error => {
                console.error('Error changing to study mode:', error);
                ui.showError(`Error changing mode: ${error.message}`);
            });
        });
        console.log('[Wizard] Study mode button event listener attached');
    } else {
        console.warn('[Wizard] Study mode button not found');
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
}

// Set up event listeners - handle both cases (DOM already ready or not)
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', setupEventListeners);
} else {
    // DOM is already ready, run setup immediately
    setupEventListeners();
}
