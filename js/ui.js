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
 * Show or hide the improve button and emit a request event when clicked.
 * This lets other modules listen for improvement requests without UI needing their logic.
 */
function renderImproveButton(node) {
    const button = document.getElementById('improveButton');
    if (!button) {
        return;
    }

    const isQuestionNode = node && node.nodeType !== 'terminal';
    const hasNodeId = !!node?.id;

    if (isQuestionNode && hasNodeId) {
        button.classList.remove('hidden');
        button.onclick = () => {
            const evt = new CustomEvent('improveNodeRequest', {
                detail: { nodeId: node.id }
            });
            window.dispatchEvent(evt);
        };
    } else {
        button.classList.add('hidden');
        button.onclick = null;
    }
}
