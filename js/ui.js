// AI: UI rendering functions. These handle the visual presentation of nodes, options, and recipes.
// Mode-aware rendering is handled here.

/**
 * Render a node (question and options)
 * @param {Object} node
 * @param {Array} options
 * @param {Function} onOptionSelect
 * @param {string} mode
 */
export function renderNode(node, options, onOptionSelect, mode) {
    const questionTextEl = document.getElementById('questionText');
    const descriptionEl = document.getElementById('description');
    const optionsGridEl = document.getElementById('optionsGrid');

    if (!questionTextEl) {
        console.error('questionText element not found');
        return;
    }

    // Debug logging
    console.log('[ui.renderNode] Rendering:', {
        nodeId: node?.id,
        question: node?.question,
        optionsCount: options?.length || 0,
        mode
    });

    questionTextEl.textContent = node.question || 'Question';
    descriptionEl.textContent = node.description || '';

    // Render improve button for question-type nodes
    renderImproveButton(node);

    // Clear options
    optionsGridEl.innerHTML = '';

    // Ensure options is an array
    const optionsArray = Array.isArray(options) ? options : [];
    
    if (optionsArray.length === 0) {
        console.warn('[ui.renderNode] No options to render!');
    }

    // Render each option
    optionsArray.forEach(option => {
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
    document.getElementById('loading').style.display = 'block';
    document.getElementById('wizardContent').style.display = 'none';
    document.getElementById('error').style.display = 'none';
}

/**
 * Hide loading state
 */
export function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('wizardContent').style.display = 'block';
}

/**
 * Show error message
 * @param {string} message
 */
export function showError(message) {
    const errorEl = document.getElementById('error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
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


