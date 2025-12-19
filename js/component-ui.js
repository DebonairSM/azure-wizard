// AI: Component UI rendering functions for catalog, cart, configuration, and compatibility alerts.

/**
 * Render component catalog
 * @param {Array} components
 * @param {Function} onComponentClick
 * @param {string} selectedCategory
 */
export function renderComponentCatalog(components, onComponentClick, selectedCategory = 'all') {
    const catalogEl = document.getElementById('componentCatalog');
    if (!catalogEl) return;

    catalogEl.innerHTML = '';

    // Filter by category if selected
    const filtered = selectedCategory === 'all' 
        ? components 
        : components.filter(c => c.category === selectedCategory);

    if (filtered.length === 0) {
        catalogEl.innerHTML = '<div class="empty-state">No components found</div>';
        return;
    }

    filtered.forEach(component => {
        const card = document.createElement('div');
        card.className = 'component-card';
        card.onclick = () => onComponentClick(component.id);

        const name = document.createElement('div');
        name.className = 'component-name';
        name.textContent = component.name;

        const category = document.createElement('div');
        category.className = 'component-category';
        category.textContent = component.category;

        const description = document.createElement('div');
        description.className = 'component-description';
        description.textContent = component.description || '';

        card.appendChild(name);
        card.appendChild(category);
        card.appendChild(description);

        catalogEl.appendChild(card);
    });
}

/**
 * Render component categories filter
 * @param {Array} categories
 * @param {Function} onCategorySelect
 * @param {string} selectedCategory
 */
export function renderCategoryFilter(categories, onCategorySelect, selectedCategory = 'all') {
    const filterEl = document.getElementById('componentCategoryFilter');
    if (!filterEl) return;

    filterEl.innerHTML = '';

    // Add "All" option
    const allBtn = document.createElement('button');
    allBtn.className = `category-btn ${selectedCategory === 'all' ? 'active' : ''}`;
    allBtn.textContent = 'All';
    allBtn.onclick = () => onCategorySelect('all');
    filterEl.appendChild(allBtn);

    // Add category buttons
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${selectedCategory === category ? 'active' : ''}`;
        btn.textContent = category;
        btn.onclick = () => onCategorySelect(category);
        filterEl.appendChild(btn);
    });
}

/**
 * Render cart with selected components
 * @param {Array} cartItems
 * @param {Function} onRemoveClick
 * @param {Function} onSelectClick
 * @param {string} selectedComponentId
 */
export function renderCart(cartItems, onRemoveClick, onSelectClick, selectedComponentId = null) {
    const cartEl = document.getElementById('componentCart');
    if (!cartEl) return;

    cartEl.innerHTML = '';

    if (cartItems.length === 0) {
        cartEl.innerHTML = '<div class="empty-state">Cart is empty. Add components to build your solution.</div>';
        return;
    }

    cartItems.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = `cart-item ${selectedComponentId === item.componentId ? 'selected' : ''}`;
        cartItem.onclick = () => onSelectClick(item.componentId);

        const name = document.createElement('div');
        name.className = 'cart-item-name';
        name.textContent = item.component.name;

        const category = document.createElement('div');
        category.className = 'cart-item-category';
        category.textContent = item.component.category;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            onRemoveClick(item.componentId);
        };

        cartItem.appendChild(name);
        cartItem.appendChild(category);
        cartItem.appendChild(removeBtn);

        cartEl.appendChild(cartItem);
    });
}

/**
 * Render compatibility warnings/errors
 * @param {Object} compatibility - { errors: Array, warnings: Array, info: Array }
 * @param {Function} getComponentName
 */
export function renderCompatibilityAlerts(compatibility, getComponentName) {
    const alertsEl = document.getElementById('compatibilityAlerts');
    if (!alertsEl) return;

    alertsEl.innerHTML = '';

    // Render errors
    if (compatibility.errors && compatibility.errors.length > 0) {
        compatibility.errors.forEach(issue => {
            const errorEl = document.createElement('div');
            errorEl.className = 'compatibility-error';
            
            const title = document.createElement('strong');
            title.textContent = 'Error: ';
            
            const message = document.createElement('span');
            message.textContent = issue.message || 'Incompatible components';
            
            errorEl.appendChild(title);
            errorEl.appendChild(message);
            
            if (issue.reason) {
                const reason = document.createElement('div');
                reason.className = 'compatibility-reason';
                reason.textContent = issue.reason;
                errorEl.appendChild(reason);
            }
            
            alertsEl.appendChild(errorEl);
        });
    }

    // Render warnings
    if (compatibility.warnings && compatibility.warnings.length > 0) {
        compatibility.warnings.forEach(issue => {
            const warningEl = document.createElement('div');
            warningEl.className = 'compatibility-warning';
            
            const title = document.createElement('strong');
            title.textContent = 'Warning: ';
            
            const message = document.createElement('span');
            message.textContent = issue.message || 'Potential compatibility issue';
            
            warningEl.appendChild(title);
            warningEl.appendChild(message);
            
            if (issue.reason) {
                const reason = document.createElement('div');
                reason.className = 'compatibility-reason';
                reason.textContent = issue.reason;
                warningEl.appendChild(reason);
            }
            
            alertsEl.appendChild(warningEl);
        });
    }

    // Render info
    if (compatibility.info && compatibility.info.length > 0) {
        compatibility.info.forEach(issue => {
            const infoEl = document.createElement('div');
            infoEl.className = 'compatibility-info';
            
            const message = document.createElement('span');
            message.textContent = issue.message || 'Note';
            
            infoEl.appendChild(message);
            
            if (issue.reason) {
                const reason = document.createElement('div');
                reason.className = 'compatibility-reason';
                reason.textContent = issue.reason;
                infoEl.appendChild(reason);
            }
            
            alertsEl.appendChild(infoEl);
        });
    }

    if (compatibility.errors.length === 0 && 
        compatibility.warnings.length === 0 && 
        compatibility.info.length === 0) {
        alertsEl.innerHTML = '<div class="compatibility-success">All components are compatible ✓</div>';
    }
}

/**
 * Render component configuration form
 * @param {Object} component
 * @param {Object} currentConfig
 * @param {Function} onConfigChange
 */
export function renderComponentConfig(component, currentConfig, onConfigChange) {
    const configEl = document.getElementById('componentConfig');
    if (!configEl) return;

    configEl.innerHTML = '';

    if (!component) {
        configEl.innerHTML = '<div class="empty-state">Select a component to configure</div>';
        return;
    }

    const title = document.createElement('h3');
    title.textContent = `Configure ${component.name}`;
    configEl.appendChild(title);

    const description = document.createElement('p');
    description.className = 'config-description';
    description.textContent = component.description || '';
    configEl.appendChild(description);

    const schema = component.configSchema || {};
    const form = document.createElement('form');
    form.className = 'component-config-form';

    // Render each field in the config schema
    for (const [key, schemaDef] of Object.entries(schema)) {
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'config-field-group';

        const label = document.createElement('label');
        label.textContent = schemaDef.label || key;
        if (schemaDef.required) {
            label.innerHTML += ' <span class="required">*</span>';
        }
        fieldGroup.appendChild(label);

        let input;

        if (schemaDef.type === 'array') {
            // Array input
            input = document.createElement('textarea');
            input.value = Array.isArray(currentConfig[key]) 
                ? currentConfig[key].join(', ') 
                : '';
            input.placeholder = 'Enter values separated by commas';
            input.onchange = () => {
                const values = input.value.split(',').map(s => s.trim()).filter(s => s);
                onConfigChange(key, values);
            };
        } else if (schemaDef.type === 'number') {
            // Number input
            input = document.createElement('input');
            input.type = 'number';
            input.value = currentConfig[key] !== undefined ? currentConfig[key] : (schemaDef.default || '');
            input.onchange = () => {
                onConfigChange(key, parseFloat(input.value) || schemaDef.default);
            };
        } else {
            // String input
            input = document.createElement('input');
            input.type = 'text';
            input.value = currentConfig[key] !== undefined ? currentConfig[key] : (schemaDef.default || '');
            input.required = schemaDef.required || false;
            input.onchange = () => {
                onConfigChange(key, input.value);
            };
        }

        fieldGroup.appendChild(input);

        if (schemaDef.description) {
            const help = document.createElement('div');
            help.className = 'config-field-help';
            help.textContent = schemaDef.description;
            fieldGroup.appendChild(help);
        }

        form.appendChild(fieldGroup);
    }

    configEl.appendChild(form);
}

/**
 * Render solution preview/output
 * @param {Object} solution
 */
export function renderSolutionPreview(solution) {
    const previewEl = document.getElementById('solutionPreview');
    if (!previewEl) return;

    previewEl.innerHTML = '';

    if (!solution || !solution.components || solution.components.length === 0) {
        previewEl.innerHTML = '<div class="empty-state">Add components to see solution preview</div>';
        return;
    }

    const title = document.createElement('h3');
    title.textContent = 'Solution Summary';
    previewEl.appendChild(title);

    const summary = document.createElement('div');
    summary.className = 'solution-summary';
    
    const total = document.createElement('div');
    total.textContent = `Total Components: ${solution.summary.totalComponents}`;
    summary.appendChild(total);

    const categories = document.createElement('div');
    categories.textContent = `Categories: ${solution.summary.categories.join(', ')}`;
    summary.appendChild(categories);

    previewEl.appendChild(summary);

    // List components
    const componentsList = document.createElement('div');
    componentsList.className = 'solution-components-list';

    solution.components.forEach(item => {
        const compDiv = document.createElement('div');
        compDiv.className = 'solution-component';

        const compName = document.createElement('strong');
        compName.textContent = item.component.name;
        compDiv.appendChild(compName);

        const compDesc = document.createElement('div');
        compDesc.className = 'solution-component-desc';
        compDesc.textContent = item.component.description;
        compDiv.appendChild(compDesc);

        componentsList.appendChild(compDiv);
    });

    previewEl.appendChild(componentsList);
}

/**
 * Show component catalog
 */
export function showComponentCatalog() {
    const catalogEl = document.getElementById('componentCatalog');
    if (catalogEl) catalogEl.style.display = 'block';
}

/**
 * Hide component catalog
 */
export function hideComponentCatalog() {
    const catalogEl = document.getElementById('componentCatalog');
    if (catalogEl) catalogEl.style.display = 'none';
}

/**
 * Show error message
 * @param {string} message
 */
export function showComponentError(message) {
    const errorEl = document.getElementById('componentError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
}































