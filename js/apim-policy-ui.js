// APIM Policy UI - UI components for policy wizard
// Integrates with existing ui.js and component-ui.js

import { ApimPolicyEngine } from './apim-policy-engine.js';

let policyEngine = null;

/**
 * Initialize policy engine
 */
export function initializePolicyEngine() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-ui.js:11',message:'initializePolicyEngine called',data:{engineExists:!!policyEngine},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!policyEngine) {
        policyEngine = new ApimPolicyEngine();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-ui.js:14',message:'initializePolicyEngine created new engine',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
    }
    return policyEngine;
}

/**
 * Render policy wizard start node
 * @param {Object} node - Node object
 * @param {Array} options - Options array
 * @returns {string} HTML
 */
export function renderPolicyWizardStart(node, options) {
    return `
        <div class="policy-wizard-start">
            <h2>${node.question || 'Configure API Management Policies'}</h2>
            <p class="node-description">${node.description || ''}</p>
            <div class="options-container">
                ${options.map(opt => `
                    <div class="option-card" data-option-id="${opt.id}">
                        <h3>${opt.label}</h3>
                        <p>${opt.description || ''}</p>
                        <button class="btn-select-option" data-option-id="${opt.id}">Select</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Render policy scope selection
 * @param {Object} node - Node object
 * @param {Array} options - Options array
 * @returns {string} HTML
 */
export function renderPolicyScope(node, options) {
    return `
        <div class="policy-scope-selection">
            <h2>${node.question || 'Select Policy Scope'}</h2>
            <p class="node-description">${node.description || ''}</p>
            <div class="options-container">
                ${options.map(opt => `
                    <div class="option-card" data-option-id="${opt.id}">
                        <h3>${opt.label}</h3>
                        <p>${opt.description || ''}</p>
                        <ul class="pros-list">
                            ${(opt.pros || []).map(pro => `<li>${pro}</li>`).join('')}
                        </ul>
                        <button class="btn-select-option" data-option-id="${opt.id}">Select</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Render policy category selection
 * @param {Object} node - Node object
 * @param {Array} options - Options array
 * @returns {string} HTML
 */
export function renderPolicyCategory(node, options) {
    return `
        <div class="policy-category-selection">
            <h2>${node.question || 'Select Policy Category'}</h2>
            <p class="node-description">${node.description || ''}</p>
            <div class="options-container grid-layout">
                ${options.map(opt => `
                    <div class="option-card category-card" data-option-id="${opt.id}">
                        <h3>${opt.label}</h3>
                        <p>${opt.description || ''}</p>
                        <button class="btn-select-option" data-option-id="${opt.id}">Select</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Render policy selection interface
 * @param {Object} node - Node object
 * @param {Array} options - Options array
 * @returns {Promise<string>} HTML
 */
export async function renderPolicySelection(node, options) {
    const engine = initializePolicyEngine();
    let scope = engine.getScope();
    let category = engine.getCategory();
    
    // If scope is not set, default to 'api' scope
    if (!scope.scope) {
        console.warn('Scope not set, defaulting to "api"');
        engine.selectScope('api');
        scope = engine.getScope();
    }
    
    // If category is not set but we have options, try to infer from the navigation
    // This handles the case where user navigates directly to selection
    if (!category) {
        console.warn('Category not set, checking if we can infer from context');
    }
    
    const selectedPolicies = engine.getSelectedPolicies();
    const selectedPolicyIds = selectedPolicies.map(p => p.policyId);
    
    console.log('[renderPolicySelection]', { scope: scope.scope, category, selectedPoliciesCount: selectedPolicies.length });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-ui.js:99',message:'renderPolicySelection called',data:{scope:scope.scope,scopeId:scope.scopeId,category,selectedPoliciesCount:selectedPolicies.length,selectedPolicyIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Fetch available policies
    const policies = await engine.getAvailablePolicies();
    
    console.log('[renderPolicySelection] Policies fetched:', policies.length, 'policies for category:', category);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-ui.js:105',message:'renderPolicySelection policies fetched',data:{policiesCount:policies.length,policyIds:policies.map(p=>p.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    return `
        <div class="policy-selection">
            <h2>${node.question || 'Select Policies'}</h2>
            <p class="node-description">${node.description || ''}</p>
            <div class="policy-selection-info">
                <p><strong>Scope:</strong> ${scope.scope || 'Not set'}</p>
                ${category ? `<p><strong>Category:</strong> ${category}</p>` : '<p><strong>Category:</strong> Not set - showing all policies</p>'}
            </div>
            ${policies.length === 0 ? `
                <div class="policy-selection-empty" style="padding: 20px; background: #f0f0f0; border-radius: 4px; margin: 20px 0;">
                    <p><strong>No policies found</strong></p>
                    <p>Category: ${category || 'Not set'}</p>
                    <p>Scope: ${scope.scope || 'Not set'}</p>
                    <p>Please check the browser console for details.</p>
                </div>
            ` : ''}
            <div class="policies-list">
                ${policies.map(policy => {
                    const isChecked = selectedPolicyIds.includes(policy.id);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-ui.js:118',message:'renderPolicySelection checkbox rendered',data:{policyId:policy.id,isChecked},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                    // #endregion
                    return `
                    <div class="policy-item" data-policy-id="${policy.id}">
                        <input type="checkbox" id="policy-${policy.id}" data-policy-id="${policy.id}" ${isChecked ? 'checked' : ''} />
                        <label for="policy-${policy.id}">
                            <strong>${policy.name}</strong>
                            <p>${policy.description || ''}</p>
                        </label>
                    </div>
                `;
                }).join('')}
            </div>
            <div class="selected-policies-summary">
                <h3>Selected Policies (<span id="selected-count">${selectedPolicies.length}</span>)</h3>
                <div id="selected-policies-list"></div>
            </div>
            <div class="policy-selection-actions">
                ${options.map(opt => `
                    <button class="btn-select-option" data-option-id="${opt.id}">${opt.label}</button>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Render policy configuration interface
 * @param {Object} node - Node object
 * @param {Array} options - Options array
 * @returns {Promise<string>} HTML
 */
export async function renderPolicyConfiguration(node, options) {
    const engine = initializePolicyEngine();
    const selectedPolicies = engine.getSelectedPolicies();
    
    if (selectedPolicies.length === 0) {
        return `
            <div class="policy-configuration">
                <h2>No Policies Selected</h2>
                <p>Please go back and select policies to configure.</p>
                <div style="margin-top: 20px;">
                    <button class="btn-go-back" data-target-node="apim-policy-selection" style="padding: 10px 20px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        ← Go Back to Select Policies
                    </button>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="policy-configuration">
            <h2>${node.question || 'Configure Policy Parameters'}</h2>
            <p class="node-description">${node.description || ''}</p>
            <div class="policy-config-tabs">
                ${selectedPolicies.map((policyItem, index) => `
                    <button class="config-tab ${index === 0 ? 'active' : ''}" data-policy-index="${index}">
                        ${policyItem.policy.name}
                    </button>
                `).join('')}
            </div>
            <div class="policy-config-forms">
                ${selectedPolicies.map((policyItem, index) => `
                    <div class="config-form ${index === 0 ? 'active' : ''}" data-policy-index="${index}">
                        <h3>${policyItem.policy.name}</h3>
                        <p>${policyItem.policy.description || ''}</p>
                        ${renderPolicyParameters(policyItem.policy, policyItem.configuration)}
                    </div>
                `).join('')}
            </div>
            <div class="policy-config-actions">
                ${options.map(opt => `
                    <button class="btn-select-option" data-option-id="${opt.id}">${opt.label}</button>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Render policy parameters form
 * @param {Object} policy - Policy object
 * @param {Object} configuration - Current configuration
 * @returns {string} HTML
 */
function renderPolicyParameters(policy, configuration) {
    const parameters = policy.parameters || {};
    const config = configuration || {};
    
    let html = '<form class="policy-params-form">';
    
    for (const [key, paramDef] of Object.entries(parameters)) {
        const value = config[key] !== undefined ? config[key] : (paramDef.default !== undefined ? paramDef.default : '');
        
        html += '<div class="form-group">';
        html += `<label for="param-${key}">${paramDef.label || key}</label>`;
        
        if (paramDef.type === 'boolean') {
            html += `<input type="checkbox" id="param-${key}" name="${key}" ${value ? 'checked' : ''} />`;
        } else if (paramDef.type === 'number') {
            html += `<input type="number" id="param-${key}" name="${key}" value="${value}" 
                    ${paramDef.min !== undefined ? `min="${paramDef.min}"` : ''} 
                    ${paramDef.max !== undefined ? `max="${paramDef.max}"` : ''} />`;
        } else if (paramDef.type === 'array') {
            html += `<textarea id="param-${key}" name="${key}" placeholder="Enter values separated by commas">${Array.isArray(value) ? value.join(', ') : ''}</textarea>`;
        } else if (paramDef.enum) {
            html += `<select id="param-${key}" name="${key}">`;
            for (const enumValue of paramDef.enum) {
                html += `<option value="${enumValue}" ${value === enumValue ? 'selected' : ''}>${enumValue}</option>`;
            }
            html += '</select>';
        } else {
            const inputType = paramDef.secret ? 'password' : 'text';
            html += `<input type="${inputType}" id="param-${key}" name="${key}" value="${value}" 
                    ${paramDef.required ? 'required' : ''} />`;
        }
        
        if (paramDef.description) {
            html += `<small class="form-help">${paramDef.description}</small>`;
        }
        
        html += '</div>';
    }
    
    html += '</form>';
    return html;
}

/**
 * Render policy complete terminal node
 * @param {Object} node - Node object
 * @returns {Promise<string>} HTML
 */
export async function renderPolicyComplete(node) {
    const engine = initializePolicyEngine();
    const selectedPolicies = engine.getSelectedPolicies();
    const scope = engine.getScope();
    
    // Generate Bicep
    let bicep = '';
    try {
        bicep = await engine.generateBicep();
    } catch (error) {
        console.error('Error generating Bicep:', error);
        bicep = '// Error generating Bicep template';
    }
    
    return `
        <div class="policy-complete">
            <h2>Policy Configuration Complete</h2>
            <div class="policy-summary">
                <h3>Configuration Summary</h3>
                <ul>
                    <li><strong>Scope:</strong> ${scope.scope}</li>
                    ${scope.scopeId ? `<li><strong>Scope ID:</strong> ${scope.scopeId}</li>` : ''}
                    <li><strong>Policies:</strong> ${selectedPolicies.length}</li>
                </ul>
                <div class="selected-policies-list">
                    ${selectedPolicies.map(p => `<div>• ${p.policy.name}</div>`).join('')}
                </div>
            </div>
            <div class="bicep-output">
                <h3>Generated Bicep Template</h3>
                <pre><code>${bicep}</code></pre>
                <button class="btn-copy-bicep">Copy Bicep</button>
            </div>
        </div>
    `;
}

/**
 * Check if node is a policy wizard node
 * @param {string} nodeId
 * @returns {boolean}
 */
export function isPolicyWizardNode(nodeId) {
    return nodeId && (
        nodeId.startsWith('apim-policy-') ||
        nodeId === 'apim-policy-wizard-start' ||
        nodeId === 'apim-policy-scope' ||
        nodeId === 'apim-policy-category' ||
        nodeId === 'apim-policy-selection' ||
        nodeId === 'apim-policy-configuration' ||
        nodeId === 'apim-policy-complete'
    );
}

/**
 * Handle policy wizard node rendering
 * @param {Object} node - Node object
 * @param {Array} options - Options array
 * @returns {Promise<string>} HTML
 */
export async function renderPolicyWizardNode(node, options) {
    if (!isPolicyWizardNode(node.id)) {
        return null;
    }
    
    switch (node.id) {
        case 'apim-policy-wizard-start':
            return renderPolicyWizardStart(node, options);
        case 'apim-policy-scope':
            return renderPolicyScope(node, options);
        case 'apim-policy-category':
            return renderPolicyCategory(node, options);
        case 'apim-policy-selection':
            return await renderPolicySelection(node, options);
        case 'apim-policy-configuration':
            return await renderPolicyConfiguration(node, options);
        case 'apim-policy-complete':
            return await renderPolicyComplete(node);
        default:
            return null;
    }
}

/**
 * Handle policy wizard option selection
 * @param {string} optionId
 * @param {Object} option
 * @returns {Promise<void>}
 */
export async function handlePolicyWizardOption(optionId, option) {
    const engine = initializePolicyEngine();
    
    // Handle scope selection
    if (optionId.startsWith('opt-policy-scope-')) {
        const scope = optionId.replace('opt-policy-scope-', '');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-ui.js:334',message:'handlePolicyWizardOption scope selection',data:{optionId,scope},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        engine.selectScope(scope);
    }
    
    // Handle category selection
    if (optionId.startsWith('opt-policy-category-')) {
        const category = optionId.replace('opt-policy-category-', '');
        // Map option IDs to category names
        const categoryMap = {
            'auth': 'authentication',
            'rate-limit': 'rate-limiting',
            'transformation': 'transformation',
            'caching': 'caching',
            'routing': 'routing',
            'security': 'security',
            'logging': 'logging',
            'error': 'error-handling',
            'ai': 'ai-gateway',
            'advanced': 'advanced'
        };
        const mappedCategory = categoryMap[category] || category;
        console.log('[handlePolicyWizardOption] Setting category:', mappedCategory, 'from option:', optionId);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-ui.js:355',message:'handlePolicyWizardOption category selection',data:{optionId,category:mappedCategory},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        engine.selectCategory(mappedCategory);
        console.log('[handlePolicyWizardOption] Category set to:', engine.getCategory());
    }
}
