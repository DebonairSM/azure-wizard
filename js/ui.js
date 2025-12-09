// AI: UI rendering functions. These handle the visual presentation of nodes, options, and recipes.
// Mode-aware rendering is handled here.

/**
 * AI Gateway feature definitions organized by category
 */
const AI_GATEWAY_FEATURES = {
    policies: {
        label: "Policies",
        features: [
            {
                id: "token-limits",
                label: "Token Limits",
                description: "Configure request, response, and total token limits to control usage and costs",
                recipeStep: 3
            },
            {
                id: "content-safety",
                label: "Content Safety",
                description: "Enable prompt injection protection, content moderation, and PII detection",
                recipeStep: 4
            },
            {
                id: "semantic-caching",
                label: "Semantic Caching",
                description: "Reduce costs by caching similar queries using embedding-based similarity matching",
                recipeStep: 5
            },
            {
                id: "rate-limiting",
                label: "Rate Limiting",
                description: "Token-based, request-based, and cost-based rate limiting policies",
                recipeStep: 6
            }
        ]
    },
    integration: {
        label: "LLM Provider Integration",
        features: [
            {
                id: "azure-openai",
                label: "Azure OpenAI",
                description: "Integrate with Azure OpenAI services",
                recipeStep: 2
            },
            {
                id: "openai",
                label: "OpenAI",
                description: "Integrate with OpenAI API",
                recipeStep: 2
            },
            {
                id: "microsoft-foundry",
                label: "Microsoft Foundry",
                description: "Integrate with Microsoft Foundry",
                recipeStep: 2
            },
            {
                id: "custom-llm",
                label: "Custom LLM Providers",
                description: "Support for custom LLM provider endpoints",
                recipeStep: 2
            },
            {
                id: "self-hosted",
                label: "Self-hosted Models",
                description: "Support for self-hosted models (Ollama, vLLM)",
                recipeStep: 2
            }
        ]
    },
    advanced: {
        label: "Advanced Features",
        features: [
            {
                id: "mcp-support",
                label: "MCP Support",
                description: "Model Context Protocol support for AI agent tool discovery and invocation",
                recipeStep: null // Special handling
            },
            {
                id: "realtime-api",
                label: "Real-time API Support",
                description: "WebSocket support for real-time APIs like GPT-4o Realtime API",
                recipeStep: 7
            }
        ]
    }
};

/**
 * Render feature selection form for AI Gateway features
 * @param {Object} node
 * @param {Function} onFeatureSubmit
 */
export function renderFeatureSelection(node, onFeatureSubmit) {
    const questionTextEl = document.getElementById('questionText');
    const descriptionEl = document.getElementById('description');
    const optionsGridEl = document.getElementById('optionsGrid');

    if (!questionTextEl || !optionsGridEl) {
        console.error('Required elements not found for feature selection');
        return;
    }

    questionTextEl.textContent = node.question || 'Select Features';
    descriptionEl.textContent = node.description || '';

    // Clear options grid
    optionsGridEl.innerHTML = '';

    // Create form container
    const form = document.createElement('form');
    form.id = 'featureSelectionForm';
    form.className = 'feature-selection-form';
    form.style.display = 'grid';
    form.style.gap = '30px';

    // Render each category
    Object.entries(AI_GATEWAY_FEATURES).forEach(([categoryKey, category]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'feature-category';
        categoryDiv.style.border = '1px solid #ddd';
        categoryDiv.style.borderRadius = '8px';
        categoryDiv.style.padding = '20px';
        categoryDiv.style.background = '#fafafa';

        // Category header
        const categoryHeader = document.createElement('div');
        categoryHeader.style.display = 'flex';
        categoryHeader.style.justifyContent = 'space-between';
        categoryHeader.style.alignItems = 'center';
        categoryHeader.style.marginBottom = '15px';

        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category.label;
        categoryTitle.style.margin = '0';
        categoryTitle.style.fontSize = '18px';
        categoryTitle.style.color = '#333';
        categoryHeader.appendChild(categoryTitle);

        // Select all button for category
        const selectAllBtn = document.createElement('button');
        selectAllBtn.type = 'button';
        selectAllBtn.textContent = 'Select All';
        selectAllBtn.className = 'select-all-btn';
        selectAllBtn.style.padding = '5px 12px';
        selectAllBtn.style.fontSize = '12px';
        selectAllBtn.style.background = '#0078d4';
        selectAllBtn.style.color = 'white';
        selectAllBtn.style.border = 'none';
        selectAllBtn.style.borderRadius = '4px';
        selectAllBtn.style.cursor = 'pointer';
        selectAllBtn.onclick = (e) => {
            e.preventDefault();
            const checkboxes = categoryDiv.querySelectorAll(`input[type="checkbox"][data-category="${categoryKey}"]`);
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => {
                cb.checked = !allChecked;
            });
            updateSelectAllButton(selectAllBtn, categoryDiv, categoryKey);
        };
        categoryHeader.appendChild(selectAllBtn);

        categoryDiv.appendChild(categoryHeader);

        // Feature checkboxes
        const featuresList = document.createElement('div');
        featuresList.style.display = 'grid';
        featuresList.style.gap = '12px';

        category.features.forEach(feature => {
            const featureItem = document.createElement('div');
            featureItem.style.display = 'flex';
            featureItem.style.alignItems = 'flex-start';
            featureItem.style.padding = '12px';
            featureItem.style.background = 'white';
            featureItem.style.borderRadius = '4px';
            featureItem.style.border = '1px solid #e0e0e0';
            featureItem.style.transition = 'all 0.2s';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `feature-${feature.id}`;
            checkbox.name = 'features';
            checkbox.value = feature.id;
            checkbox.setAttribute('data-category', categoryKey);
            checkbox.style.marginRight = '12px';
            checkbox.style.marginTop = '2px';
            checkbox.style.cursor = 'pointer';
            checkbox.onchange = () => {
                updateSelectAllButton(selectAllBtn, categoryDiv, categoryKey);
                updateFeatureItemStyle(featureItem, checkbox.checked);
            };

            const label = document.createElement('label');
            label.htmlFor = `feature-${feature.id}`;
            label.style.flex = '1';
            label.style.cursor = 'pointer';
            label.style.display = 'flex';
            label.style.flexDirection = 'column';

            const featureLabel = document.createElement('div');
            featureLabel.textContent = feature.label;
            featureLabel.style.fontWeight = '600';
            featureLabel.style.marginBottom = '4px';
            featureLabel.style.color = '#333';

            const featureDesc = document.createElement('div');
            featureDesc.textContent = feature.description;
            featureDesc.style.fontSize = '13px';
            featureDesc.style.color = '#666';

            label.appendChild(featureLabel);
            label.appendChild(featureDesc);

            featureItem.appendChild(checkbox);
            featureItem.appendChild(label);
            featuresList.appendChild(featureItem);
        });

        categoryDiv.appendChild(featuresList);
        form.appendChild(categoryDiv);
    });

    // Submit button
    const submitDiv = document.createElement('div');
    submitDiv.style.display = 'flex';
    submitDiv.style.justifyContent = 'flex-end';
    submitDiv.style.marginTop = '20px';

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Continue to Recipe';
    submitBtn.className = 'feature-submit-btn';
    submitBtn.style.padding = '12px 24px';
    submitBtn.style.fontSize = '16px';
    submitBtn.style.background = '#0078d4';
    submitBtn.style.color = 'white';
    submitBtn.style.border = 'none';
    submitBtn.style.borderRadius = '4px';
    submitBtn.style.cursor = 'pointer';
    submitBtn.style.fontWeight = '600';
    submitBtn.style.transition = 'background 0.2s';

    submitBtn.onmouseover = () => {
        submitBtn.style.background = '#106ebe';
    };
    submitBtn.onmouseout = () => {
        submitBtn.style.background = '#0078d4';
    };

    submitDiv.appendChild(submitBtn);
    form.appendChild(submitDiv);

    // Form submission
    form.onsubmit = (e) => {
        e.preventDefault();
        const selectedFeatures = Array.from(form.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        if (selectedFeatures.length === 0) {
            alert('Please select at least one feature to continue.');
            return;
        }

        // Store selected features
        sessionStorage.setItem('apim-ai-gateway-selected-features', JSON.stringify(selectedFeatures));
        
        // Call submit handler
        if (onFeatureSubmit) {
            onFeatureSubmit(selectedFeatures);
        }
    };

    optionsGridEl.appendChild(form);
}

/**
 * Update select all button text based on checkbox states
 */
function updateSelectAllButton(button, categoryDiv, categoryKey) {
    const checkboxes = categoryDiv.querySelectorAll(`input[type="checkbox"][data-category="${categoryKey}"]`);
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const totalCount = checkboxes.length;
    
    if (checkedCount === 0) {
        button.textContent = 'Select All';
    } else if (checkedCount === totalCount) {
        button.textContent = 'Deselect All';
    } else {
        button.textContent = `Select All (${checkedCount}/${totalCount})`;
    }
}

/**
 * Update feature item style based on selection
 */
function updateFeatureItemStyle(item, isChecked) {
    if (isChecked) {
        item.style.borderColor = '#0078d4';
        item.style.background = '#f0f7ff';
    } else {
        item.style.borderColor = '#e0e0e0';
        item.style.background = 'white';
    }
}

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

    // Show configuration options if available
    if (recipe.configSchema && Object.keys(recipe.configSchema).length > 0) {
        const configDiv = document.createElement('div');
        configDiv.style.marginTop = '20px';
        configDiv.style.padding = '15px';
        configDiv.style.background = '#fff';
        configDiv.style.border = '1px solid #ddd';
        configDiv.style.borderRadius = '4px';

        const configTitle = document.createElement('h3');
        configTitle.textContent = 'Configuration Options';
        configTitle.style.marginTop = '0';
        configTitle.style.marginBottom = '15px';
        configDiv.appendChild(configTitle);

        const configDesc = document.createElement('p');
        configDesc.textContent = `This recipe supports ${Object.keys(recipe.configSchema).length} configuration options.`;
        configDesc.style.marginBottom = '15px';
        configDesc.style.color = '#666';
        configDiv.appendChild(configDesc);

        const optionsList = document.createElement('div');
        optionsList.style.display = 'grid';
        optionsList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
        optionsList.style.gap = '10px';

        Object.entries(recipe.configSchema).slice(0, 20).forEach(([key, schema]) => {
            const optionItem = document.createElement('div');
            optionItem.style.padding = '8px';
            optionItem.style.background = '#f9f9f9';
            optionItem.style.borderRadius = '3px';
            optionItem.style.fontSize = '0.9em';

            const optionLabel = document.createElement('div');
            optionLabel.style.fontWeight = 'bold';
            optionLabel.textContent = schema.label || key;
            optionItem.appendChild(optionLabel);

            if (schema.description) {
                const optionDesc = document.createElement('div');
                optionDesc.style.fontSize = '0.85em';
                optionDesc.style.color = '#666';
                optionDesc.style.marginTop = '3px';
                optionDesc.textContent = schema.description;
                optionItem.appendChild(optionDesc);
            }

            const optionType = document.createElement('div');
            optionType.style.fontSize = '0.8em';
            optionType.style.color = '#999';
            optionType.style.marginTop = '3px';
            optionType.textContent = `Type: ${schema.type}${schema.default !== undefined ? ` | Default: ${schema.default}` : ''}`;
            optionItem.appendChild(optionType);

            optionsList.appendChild(optionItem);
        });

        configDiv.appendChild(optionsList);

        if (Object.keys(recipe.configSchema).length > 20) {
            const moreText = document.createElement('p');
            moreText.style.marginTop = '10px';
            moreText.style.fontSize = '0.9em';
            moreText.style.color = '#666';
            moreText.textContent = `... and ${Object.keys(recipe.configSchema).length - 20} more configuration options`;
            configDiv.appendChild(moreText);
        }

        recipeStepsEl.appendChild(configDiv);
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
