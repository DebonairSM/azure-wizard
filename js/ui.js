// AI: UI rendering functions. These handle the visual presentation of nodes, options, and recipes.
// Mode-aware rendering is handled here.

import * as policyUI from './apim-policy-ui.js';

/**
 * Render a node (question and options)
 * @param {Object} node
 * @param {Array} options
 * @param {Function} onOptionSelect
 * @param {string} mode
 */
export function renderNode(node, options, onOptionSelect, mode) {
    // Check if this is a policy wizard node
    if (policyUI.isPolicyWizardNode(node.id)) {
        renderPolicyWizardNode(node, options, onOptionSelect);
        return;
    }

    const questionTextEl = document.getElementById('questionText');
    const descriptionEl = document.getElementById('description');
    const optionsGridEl = document.getElementById('optionsGrid');

    if (!questionTextEl) {
        console.error('questionText element not found');
        return;
    }

    questionTextEl.textContent = node.question || 'Question';
    descriptionEl.textContent = node.description || '';

    // Render improve button for question-type nodes
    renderImproveButton(node);

    // Clear options
    optionsGridEl.innerHTML = '';

    // Render each option
    options.forEach(option => {
        const card = document.createElement('div');
        card.className = 'option-card';
        card.onclick = () => onOptionSelect(option.id);

        const label = document.createElement('div');
        label.className = 'option-label';
        label.textContent = option.label;

        const description = document.createElement('div');
        description.className = 'option-description';
        description.textContent = option.description || '';

        card.appendChild(label);
        card.appendChild(description);

        // In study mode, show pros/cons
        if (mode === 'study') {
            if (option.pros && option.pros.length > 0) {
                const prosDiv = document.createElement('div');
                prosDiv.className = 'pros-cons pros';
                prosDiv.innerHTML = `<strong>Pros:</strong> ${option.pros.join(', ')}`;
                card.appendChild(prosDiv);
            }

            if (option.cons && option.cons.length > 0) {
                const consDiv = document.createElement('div');
                consDiv.className = 'pros-cons cons';
                consDiv.innerHTML = `<strong>Cons:</strong> ${option.cons.join(', ')}`;
                card.appendChild(consDiv);
            }

            if (option.whenToUse) {
                const whenToUse = document.createElement('div');
                whenToUse.className = 'pros-cons';
                whenToUse.style.marginTop = '8px';
                whenToUse.style.fontSize = '12px';
                whenToUse.innerHTML = `<strong>When to use:</strong> ${option.whenToUse}`;
                card.appendChild(whenToUse);
            }
        }

        optionsGridEl.appendChild(card);
    });
}

/**
 * Render a recipe (terminal node)
 * @param {Object} recipe
 * @param {string} mode
 * @param {string} explanation
 */
export function renderRecipe(recipe, mode, explanation) {
    const nodeDisplayEl = document.getElementById('nodeDisplay');
    const recipeDisplayEl = document.getElementById('recipeDisplay');
    const recipeTitleEl = document.getElementById('recipeTitle');
    const recipeStepsEl = document.getElementById('recipeSteps');
    const explainPathEl = document.getElementById('explainPath');

    if (!nodeDisplayEl || !recipeDisplayEl || !recipeTitleEl || !recipeStepsEl) {
        console.error('Required recipe display elements not found');
        return;
    }

    // Hide node display, show recipe
    nodeDisplayEl.style.display = 'none';
    recipeDisplayEl.style.display = 'block';

    recipeTitleEl.textContent = recipe.title || 'Recipe';

    // Show explanation
    if (explanation) {
        explainPathEl.textContent = explanation;
        explainPathEl.style.display = 'block';
    } else {
        explainPathEl.style.display = 'none';
    }

    // Clear steps
    recipeStepsEl.innerHTML = '';

    // Render steps
    if (recipe.steps && recipe.steps.length > 0) {
        recipe.steps.forEach(step => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step';

            const stepNumber = document.createElement('span');
            stepNumber.className = 'step-number';
            stepNumber.textContent = `Step ${step.number || '?'}: `;

            const stepTitle = document.createElement('strong');
            stepTitle.textContent = step.title || '';

            const stepDesc = document.createElement('div');
            stepDesc.style.marginTop = '5px';
            stepDesc.textContent = step.description || '';

            stepDiv.appendChild(stepNumber);
            stepDiv.appendChild(stepTitle);
            stepDiv.appendChild(stepDesc);

            recipeStepsEl.appendChild(stepDiv);
        });
    }

    // Mode-specific content
    if (mode === 'study') {
        // Show exam objectives, skill level, etc.
        if (recipe.skillLevel) {
            const skillLevel = document.createElement('div');
            skillLevel.style.marginTop = '15px';
            skillLevel.style.padding = '10px';
            skillLevel.style.background = '#f0f0f0';
            skillLevel.style.borderRadius = '4px';
            skillLevel.innerHTML = `<strong>Skill Level:</strong> ${recipe.skillLevel}`;
            recipeStepsEl.appendChild(skillLevel);
        }
    } else {
        // Design mode: show IaC hints, resource list
        if (recipe.bicepOutline) {
            const iacDiv = document.createElement('div');
            iacDiv.style.marginTop = '15px';
            iacDiv.style.padding = '10px';
            iacDiv.style.background = '#e8f4f8';
            iacDiv.style.borderRadius = '4px';
            iacDiv.innerHTML = `<strong>Infrastructure Resources:</strong> ${recipe.bicepOutline.resources?.join(', ') || 'N/A'}`;
            recipeStepsEl.appendChild(iacDiv);
        }
    }

    // Show links
    if (recipe.links && recipe.links.length > 0) {
        const linksDiv = document.createElement('div');
        linksDiv.style.marginTop = '15px';
        linksDiv.style.padding = '10px';
        linksDiv.style.background = '#f9f9f9';
        linksDiv.style.borderRadius = '4px';

        const linksTitle = document.createElement('strong');
        linksTitle.textContent = 'References: ';
        linksDiv.appendChild(linksTitle);

        recipe.links.forEach((link, index) => {
            const linkEl = document.createElement('a');
            linkEl.href = link.url;
            linkEl.target = '_blank';
            linkEl.textContent = link.label;
            linkEl.style.marginLeft = index > 0 ? '10px' : '5px';
            linksDiv.appendChild(linkEl);
        });

        recipeStepsEl.appendChild(linksDiv);
    }
}

/**
 * Render breadcrumbs
 * @param {Array} breadcrumbs
 * @param {Function} onBreadcrumbClick
 */
export function renderBreadcrumbs(breadcrumbs, onBreadcrumbClick) {
    const breadcrumbsEl = document.getElementById('breadcrumbs');
    if (!breadcrumbsEl) {
        console.warn('breadcrumbs element not found');
        return;
    }
    breadcrumbsEl.innerHTML = '';

    breadcrumbs.forEach((crumb, index) => {
        const crumbEl = document.createElement('div');
        crumbEl.className = 'breadcrumb';
        crumbEl.textContent = crumb.nodeQuestion || 'Node';
        crumbEl.onclick = () => onBreadcrumbClick(crumb.nodeId);

        breadcrumbsEl.appendChild(crumbEl);

        if (crumb.optionLabel) {
            const arrow = document.createElement('span');
            arrow.textContent = ' → ';
            arrow.style.margin = '0 5px';
            breadcrumbsEl.appendChild(arrow);

            const optionEl = document.createElement('div');
            optionEl.className = 'breadcrumb';
            optionEl.textContent = crumb.optionLabel;
            optionEl.style.background = '#d0e8f0';
            breadcrumbsEl.appendChild(optionEl);
        }

        if (index < breadcrumbs.length - 1) {
            const arrow = document.createElement('span');
            arrow.textContent = ' → ';
            arrow.style.margin = '0 5px';
            breadcrumbsEl.appendChild(arrow);
        }
    });
}

/**
 * Show loading state
 */
export function showLoading() {
    const loadingEl = document.getElementById('loading');
    const wizardContentEl = document.getElementById('wizardContent');
    const errorEl = document.getElementById('error');
    if (loadingEl) loadingEl.style.display = 'block';
    if (wizardContentEl) wizardContentEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
}

/**
 * Hide loading state
 */
export function hideLoading() {
    const loadingEl = document.getElementById('loading');
    const wizardContentEl = document.getElementById('wizardContent');
    if (loadingEl) loadingEl.style.display = 'none';
    if (wizardContentEl) wizardContentEl.style.display = 'block';
}

/**
 * Show error message
 * @param {string} message
 */
export function showError(message) {
    const errorEl = document.getElementById('error');
    const loadingEl = document.getElementById('loading');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
    if (loadingEl) loadingEl.style.display = 'none';
}

/**
 * Hide error message
 */
export function hideError() {
    document.getElementById('error').style.display = 'none';
}

/**
 * Render search results
 * @param {Array} nodes
 * @param {Function} onNodeSelect
 */
export function renderSearchResults(nodes, onNodeSelect) {
    const resultsEl = document.getElementById('searchResults');
    
    if (nodes.length === 0) {
        resultsEl.style.display = 'none';
        return;
    }

    resultsEl.innerHTML = '';
    resultsEl.style.display = 'block';

    nodes.forEach(node => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.textContent = node.question || node.id;
        item.onclick = () => {
            onNodeSelect(node.id);
            resultsEl.style.display = 'none';
        };
        resultsEl.appendChild(item);
    });
}

/**
 * Hide search results
 */
export function hideSearchResults() {
    document.getElementById('searchResults').style.display = 'none';
}

/**
 * Show research prompt when search has no results
 * @param {string} query - Search query
 * @param {Function} onResearch - Callback when user confirms research
 */
export function showResearchPrompt(query, onResearch) {
    const resultsEl = document.getElementById('searchResults');
    resultsEl.innerHTML = '';
    resultsEl.style.display = 'block';
    
    const promptDiv = document.createElement('div');
    promptDiv.style.padding = '15px';
    promptDiv.style.textAlign = 'center';
    
    const message = document.createElement('div');
    message.textContent = `No results found for "${query}". Would you like to research this topic?`;
    message.style.marginBottom = '15px';
    promptDiv.appendChild(message);
    
    const button = document.createElement('button');
    button.textContent = 'Research Topic';
    button.className = 'mode-btn';
    button.style.marginRight = '10px';
    button.onclick = () => {
        resultsEl.style.display = 'none';
        onResearch();
    };
    promptDiv.appendChild(button);
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'mode-btn';
    cancelButton.onclick = () => {
        resultsEl.style.display = 'none';
    };
    promptDiv.appendChild(cancelButton);
    
    resultsEl.appendChild(promptDiv);
}

/**
 * Show API key configuration dialog
 */
export function showApiKeyDialog() {
    const currentKey = localStorage.getItem('OPENAI_API_KEY') || '';
    
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.background = 'white';
    dialog.style.padding = '30px';
    dialog.style.borderRadius = '8px';
    dialog.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    dialog.style.zIndex = '10000';
    dialog.style.maxWidth = '500px';
    dialog.style.width = '90%';
    
    const title = document.createElement('h2');
    title.textContent = 'OpenAI API Key Configuration';
    title.style.marginBottom = '20px';
    dialog.appendChild(title);
    
    const info = document.createElement('p');
    info.textContent = 'Enter your OpenAI API key to enable research features. The key is stored locally in your browser.';
    info.style.marginBottom = '15px';
    info.style.color = '#666';
    info.style.fontSize = '14px';
    dialog.appendChild(info);
    
    const input = document.createElement('input');
    input.type = 'password';
    input.placeholder = 'sk-...';
    input.value = currentKey;
    input.style.width = '100%';
    input.style.padding = '10px';
    input.style.border = '1px solid #ddd';
    input.style.borderRadius = '4px';
    input.style.marginBottom = '15px';
    input.style.fontSize = '14px';
    dialog.appendChild(input);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'flex-end';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.className = 'mode-btn';
    saveButton.onclick = () => {
        const key = input.value.trim();
        if (key) {
            localStorage.setItem('OPENAI_API_KEY', key);
            window.OPENAI_API_KEY = key;
            document.body.removeChild(overlay);
            document.body.removeChild(dialog);
            showError('API key saved successfully!');
            setTimeout(() => hideError(), 2000);
        } else {
            alert('Please enter a valid API key');
        }
    };
    buttonContainer.appendChild(saveButton);
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'mode-btn';
    cancelButton.onclick = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(dialog);
    };
    buttonContainer.appendChild(cancelButton);
    
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.className = 'mode-btn';
    clearButton.style.background = '#d13438';
    clearButton.style.color = 'white';
    clearButton.style.borderColor = '#d13438';
    clearButton.onclick = () => {
        localStorage.removeItem('OPENAI_API_KEY');
        window.OPENAI_API_KEY = '';
        input.value = '';
    };
    buttonContainer.appendChild(clearButton);
    
    dialog.appendChild(buttonContainer);
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '9999';
    overlay.onclick = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(dialog);
    };
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    input.focus();
}
/**
 * Render improve button for question-type nodes
 * @param {Object} node - Node object
 */
export function renderImproveButton(node) {
    const improveButton = document.getElementById('improveButton');
    
    // Safety check
    if (!improveButton) {
        console.warn('Improve button element not found in DOM');
        return;
    }
    
    // Show button for question-type and root nodes (not terminal nodes)
    if (node && (node.nodeType === 'question' || node.nodeType === 'root')) {
        improveButton.classList.remove('hidden');
        improveButton.dataset.nodeId = node.id;
        console.log('Improve button shown for node:', node.id, 'nodeType:', node.nodeType);
    } else {
        improveButton.classList.add('hidden');
        improveButton.dataset.nodeId = '';
        if (node) {
            console.log('Improve button hidden for node:', node.id, 'nodeType:', node.nodeType);
        }
    }
    
    // Reset button state
    improveButton.disabled = false;
    improveButton.classList.remove('loading');
    improveButton.textContent = 'Improve';
}

/**
 * Set improve button loading state
 * @param {boolean} isLoading
 */
export function setImproveButtonLoading(isLoading) {
    const improveButton = document.getElementById('improveButton');
    if (isLoading) {
        improveButton.disabled = true;
        improveButton.classList.add('loading');
        improveButton.textContent = 'Improving...';
    } else {
        improveButton.disabled = false;
        improveButton.classList.remove('loading');
        improveButton.textContent = 'Improve';
    }
}

/**
 * Render policy wizard node
 * @param {Object} node
 * @param {Array} options
 * @param {Function} onOptionSelect
 */
export async function renderPolicyWizardNode(node, options, onOptionSelect) {
    const wizardContentEl = document.getElementById('wizardContent');
    if (!wizardContentEl) {
        console.error('wizardContent element not found');
        return;
    }

    try {
        const html = await policyUI.renderPolicyWizardNode(node, options);
        if (html) {
            // Create a container for the policy wizard
            const container = document.createElement('div');
            container.innerHTML = html;
            container.className = 'policy-wizard-container';
            
            // Clear existing content
            const nodeDisplayEl = document.getElementById('nodeDisplay');
            const recipeDisplayEl = document.getElementById('recipeDisplay');
            if (nodeDisplayEl) nodeDisplayEl.style.display = 'none';
            if (recipeDisplayEl) recipeDisplayEl.style.display = 'none';
            
            // Inject policy wizard HTML
            wizardContentEl.innerHTML = '';
            wizardContentEl.appendChild(container);
            wizardContentEl.style.display = 'block';
            
            // Set up event handlers for policy wizard buttons
            setupPolicyWizardEventHandlers(onOptionSelect);
        }
    } catch (error) {
        console.error('Error rendering policy wizard node:', error);
        showError(`Error rendering policy wizard: ${error.message}`);
    }
}

/**
 * Handle go back button clicks (event delegation)
 * @param {Event} e
 */
function handleGoBackClick(e) {
    const button = e.target.closest('.btn-go-back');
    if (!button) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Check if there's a specific target node
    const targetNodeId = button.dataset.targetNode;
    if (targetNodeId) {
        // Dispatch event to navigate to specific node
        window.dispatchEvent(new CustomEvent('wizard:go-to-node', { detail: { nodeId: targetNodeId } }));
    } else {
        // Default: try to use the back button or dispatch go-back event
        const backButton = document.getElementById('backButton');
        if (backButton && backButton.style.display !== 'none') {
            backButton.click();
        } else {
            window.dispatchEvent(new CustomEvent('wizard:go-back'));
        }
    }
}

/**
 * Set up event handlers for policy wizard UI elements
 * @param {Function} onOptionSelect
 */
function setupPolicyWizardEventHandlers(onOptionSelect) {
    // Handle option selection buttons
    document.querySelectorAll('.btn-select-option').forEach(button => {
        button.addEventListener('click', async (e) => {
            const optionId = e.target.dataset.optionId || e.target.closest('[data-option-id]')?.dataset.optionId;
            if (optionId) {
                await policyUI.handlePolicyWizardOption(optionId, { id: optionId });
                if (onOptionSelect) {
                    onOptionSelect(optionId);
                }
            }
        });
    });

    // Handle policy checkboxes
    document.querySelectorAll('input[type="checkbox"][data-policy-id]').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            const policyId = e.target.dataset.policyId;
            const engine = policyUI.initializePolicyEngine();
            if (e.target.checked) {
                // Note: addPolicy may need to be implemented in ApimPolicyEngine
                // For now, we'll just handle the checkbox state
                console.log('Policy selected:', policyId);
            } else {
                console.log('Policy deselected:', policyId);
            }
        });
    });

    // Handle policy configuration form submissions
    document.querySelectorAll('.policy-params-form').forEach(form => {
        form.addEventListener('change', async (e) => {
            const formData = new FormData(form);
            const policyIndex = form.closest('[data-policy-index]')?.dataset.policyIndex;
            if (policyIndex !== undefined) {
                const engine = policyUI.initializePolicyEngine();
                const selectedPolicies = engine.getSelectedPolicies();
                const policyItem = selectedPolicies[parseInt(policyIndex)];
                if (policyItem) {
                    const config = {};
                    for (const [key, value] of formData.entries()) {
                        config[key] = value;
                    }
                    // Note: configurePolicy may need to be implemented
                    console.log('Policy configuration updated:', config);
                }
            }
        });
    });

    // Handle config tabs
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const index = e.target.dataset.policyIndex;
            // Hide all forms
            document.querySelectorAll('.config-form').forEach(form => {
                form.classList.remove('active');
            });
            // Hide all tabs
            document.querySelectorAll('.config-tab').forEach(t => {
                t.classList.remove('active');
            });
            // Show selected form and tab
            e.target.classList.add('active');
            const form = document.querySelector(`.config-form[data-policy-index="${index}"]`);
            if (form) {
                form.classList.add('active');
            }
        });
    });

    // Handle copy Bicep button
    const copyBicepBtn = document.querySelector('.btn-copy-bicep');
    if (copyBicepBtn) {
        copyBicepBtn.addEventListener('click', async () => {
            const engine = policyUI.initializePolicyEngine();
            try {
                const bicep = await engine.generateBicep();
                await navigator.clipboard.writeText(bicep);
                const originalText = copyBicepBtn.textContent;
                copyBicepBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBicepBtn.textContent = originalText;
                }, 2000);
            } catch (error) {
                console.error('Error copying Bicep:', error);
                alert('Failed to copy Bicep: ' + error.message);
            }
        });
    }

    // Handle go back button - use event delegation to avoid duplicate listeners
    const wizardContentEl = document.getElementById('wizardContent');
    if (wizardContentEl) {
        // Remove any existing listener to avoid duplicates
        wizardContentEl.removeEventListener('click', handleGoBackClick);
        // Add new listener using event delegation
        wizardContentEl.addEventListener('click', handleGoBackClick);
    }
}



