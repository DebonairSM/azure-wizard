// APIM Policy Engine - Manages policy selection and configuration
// Integrates with WizardEngine for navigation through policy wizard
// Now uses the new PolicyWizard internally (requires TypeScript compilation)

import indexedDbDataProvider from './data-provider.js';

// PolicyWizard will be loaded lazily when needed
let PolicyWizard = null;
let wizardModulePromise = null;

/**
 * Load PolicyWizard module (lazy loading)
 * @returns {Promise<Object>} PolicyWizard module
 */
async function loadPolicyWizard() {
    if (PolicyWizard) {
        return PolicyWizard;
    }
    
    if (!wizardModulePromise) {
        wizardModulePromise = import('./policy-wizard/index.js').catch(error => {
            console.warn('PolicyWizard not available yet. Run "npm run build" to compile TypeScript files.');
            return null;
        });
    }
    
    const wizardModule = await wizardModulePromise;
    if (wizardModule) {
        PolicyWizard = wizardModule.PolicyWizard;
    }
    
    return PolicyWizard;
}

/**
 * APIM Policy Engine class
 */
export class ApimPolicyEngine {
    constructor(dataProvider = indexedDbDataProvider) {
        this.dataProvider = dataProvider;
        this.selectedScope = null; // 'global', 'product', 'api', 'operation'
        this.scopeId = null; // ID of the scope (product name, API name, operation name)
        this.selectedCategory = null;
        this.selectedPolicies = []; // Array of { policyId, policy, configuration }
        this.currentPolicyIndex = 0; // Index of policy being configured
        this.wizardInstance = null; // PolicyWizard instance (if available)
        
        // PolicyWizard will be initialized lazily when needed
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-engine.js:17',message:'ApimPolicyEngine constructor',data:{selectedScope:this.selectedScope,selectedCategory:this.selectedCategory,selectedPoliciesCount:this.selectedPolicies.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
    }

    /**
     * Initialize PolicyWizard instance
     * @private
     * @returns {Promise<void>}
     */
    async initializeWizard() {
        const wizard = await loadPolicyWizard();
        if (wizard && this.selectedScope) {
            const [apiId, operationId] = this.scopeId ? this.scopeId.split('/') : [undefined, undefined];
            this.wizardInstance = wizard.start(this.selectedScope, apiId, operationId);
        }
    }

    /**
     * Initialize the policy engine
     * @returns {Promise<void>}
     */
    async initialize() {
        this.selectedScope = null;
        this.scopeId = null;
        this.selectedCategory = null;
        this.selectedPolicies = [];
        this.currentPolicyIndex = 0;
    }

    /**
     * Select policy scope
     * @param {string} scope - 'global', 'product', 'api', 'operation'
     * @param {string} scopeId - Optional ID for the scope
     */
    selectScope(scope, scopeId = null) {
        if (!['global', 'product', 'api', 'operation'].includes(scope)) {
            throw new Error(`Invalid scope: ${scope}`);
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-engine.js:36',message:'selectScope called BEFORE',data:{scope,scopeId,currentScope:this.selectedScope},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        this.selectedScope = scope;
        this.scopeId = scopeId;
        
        // Reinitialize wizard with new scope (async, but don't wait)
        this.initializeWizard().catch(err => console.warn('Failed to initialize wizard:', err));
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-engine.js:42',message:'selectScope called AFTER',data:{scope:this.selectedScope,scopeId:this.scopeId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
    }

    /**
     * Get selected scope
     * @returns {Object} - { scope, scopeId }
     */
    getScope() {
        const result = {
            scope: this.selectedScope,
            scopeId: this.scopeId
        };
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-engine.js:48',message:'getScope called',data:result,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return result;
    }

    /**
     * Select policy category
     * @param {string} category
     */
    selectCategory(category) {
        this.selectedCategory = category;
    }

    /**
     * Get selected category
     * @returns {string|null}
     */
    getCategory() {
        return this.selectedCategory;
    }

    /**
     * Get available policies for current scope and category
     * @returns {Promise<Array>}
     */
    async getAvailablePolicies() {
        if (!this.selectedScope) {
            return [];
        }

        // Use PolicyWizard catalog if available, otherwise fall back to API
        try {
            const wizard = await loadPolicyWizard();
            if (wizard) {
                // Import policy catalog
                const catalogModule = await import('./policy-wizard/policy-catalog.js');
                let policies = [];
                
                if (this.selectedCategory) {
                    // Get policies by category
                    policies = catalogModule.getPoliciesByCategory(this.selectedCategory);
                } else {
                    // Get all policies
                    policies = catalogModule.getAllPolicies();
                }
                
                // Filter by supported sections based on scope
                // For now, return all policies - scope filtering can be added later
                return policies.map(policy => ({
                    id: policy.id,
                    name: policy.name,
                    description: policy.description,
                    category: policy.category,
                    supportedSections: policy.supportedSections || []
                }));
            }
        } catch (error) {
            console.warn('PolicyWizard catalog not available, falling back to API:', error);
        }

        // Fallback to API
        try {
            const response = await fetch(`/api/apim-policies?scope=${this.selectedScope}${this.selectedCategory ? `&category=${this.selectedCategory}` : ''}`);
            if (!response.ok) {
                throw new Error('Failed to fetch policies');
            }
            const policies = await response.json();
            return policies;
        } catch (error) {
            console.error('Error fetching policies:', error);
            return [];
        }
    }

    /**
     * Get all policy categories
     * @returns {Promise<Array>}
     */
    async getCategories() {
        try {
            const response = await fetch('/api/apim-policies/categories');
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            const categories = await response.json();
            return categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }

    /**
     * Add policy to selection
     * @param {string} policyId
     * @returns {Promise<Object>} - { success: boolean, policy: Object }
     */
    async addPolicy(policyId) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-engine.js:117',message:'addPolicy called BEFORE',data:{policyId,currentSelectedCount:this.selectedPolicies.length,selectedPolicyIds:this.selectedPolicies.map(p=>p.policyId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Check if already selected
        if (this.selectedPolicies.find(p => p.policyId === policyId)) {
            return {
                success: false,
                error: 'Policy already selected'
            };
        }

        // Fetch policy details
        try {
            const response = await fetch(`/api/apim-policies/${policyId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch policy');
            }
            const policy = await response.json();

            // Initialize configuration with defaults
            const configuration = this.initializeConfiguration(policy);

            this.selectedPolicies.push({
                policyId: policy.id,
                policy: policy,
                configuration: configuration
            });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-engine.js:141',message:'addPolicy called AFTER',data:{policyId,selectedCount:this.selectedPolicies.length,selectedPolicyIds:this.selectedPolicies.map(p=>p.policyId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion

            return {
                success: true,
                policy: policy
            };
        } catch (error) {
            console.error('Error adding policy:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Remove policy from selection
     * @param {string} policyId
     */
    removePolicy(policyId) {
        this.selectedPolicies = this.selectedPolicies.filter(p => p.policyId !== policyId);
    }

    /**
     * Get selected policies
     * @returns {Array}
     */
    getSelectedPolicies() {
        const result = this.selectedPolicies.map(p => ({
            policyId: p.policyId,
            policy: p.policy,
            configuration: p.configuration
        }));
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apim-policy-engine.js:168',message:'getSelectedPolicies called',data:{count:result.length,policyIds:result.map(p=>p.policyId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return result;
    }

    /**
     * Configure a policy
     * @param {string} policyId
     * @param {Object} configuration
     */
    configurePolicy(policyId, configuration) {
        const policyItem = this.selectedPolicies.find(p => p.policyId === policyId);
        if (policyItem) {
            policyItem.configuration = { ...policyItem.configuration, ...configuration };
        }
    }

    /**
     * Get configuration for a policy
     * @param {string} policyId
     * @returns {Object|null}
     */
    getPolicyConfiguration(policyId) {
        const policyItem = this.selectedPolicies.find(p => p.policyId === policyId);
        return policyItem ? policyItem.configuration : null;
    }

    /**
     * Initialize configuration with defaults from policy parameters
     * @param {Object} policy
     * @returns {Object}
     */
    initializeConfiguration(policy) {
        const config = {};
        const parameters = policy.parameters || {};

        for (const [key, paramDef] of Object.entries(parameters)) {
            if (paramDef.default !== undefined) {
                config[key] = paramDef.default;
            } else if (paramDef.type === 'boolean') {
                config[key] = false;
            } else if (paramDef.type === 'number') {
                config[key] = 0;
            } else if (paramDef.type === 'array') {
                config[key] = [];
            } else {
                config[key] = '';
            }
        }

        return config;
    }

    /**
     * Set current policy index for configuration UI
     * @param {number} index
     */
    setCurrentPolicyIndex(index) {
        if (index >= 0 && index < this.selectedPolicies.length) {
            this.currentPolicyIndex = index;
        }
    }

    /**
     * Get current policy being configured
     * @returns {Object|null}
     */
    getCurrentPolicy() {
        if (this.currentPolicyIndex >= 0 && this.currentPolicyIndex < this.selectedPolicies.length) {
            return this.selectedPolicies[this.currentPolicyIndex];
        }
        return null;
    }

    /**
     * Generate Bicep for all selected policies
     * Uses PolicyWizard if available, otherwise falls back to API call
     * @returns {Promise<string>}
     */
    async generateBicep() {
        if (this.selectedPolicies.length === 0) {
            return '';
        }

        // Try to use PolicyWizard if available
        const wizard = await loadPolicyWizard();
        if (wizard && this.wizardInstance) {
            try {
                // Convert selected policies to PolicyModel format
                const policyModel = this.convertToPolicyModel();
                const xml = wizard.toXml(policyModel);
                
                // Use existing Bicep generator to wrap XML in Bicep resource
                const { generatePolicyBicep } = await import('./apim-policy-generator.js');
                const bicep = generatePolicyBicep(
                    { policy: { name: 'Combined Policy' }, configuration: {} },
                    this.selectedScope,
                    this.scopeId,
                    this.getParentResourceName()
                );
                
                // Replace the XML content in the Bicep template
                return bicep.replace(/value: '''[\s\S]*?'''/, `value: '''\n${xml.split('\n').map(line => '      ' + line).join('\n')}\n    '''`);
            } catch (error) {
                console.warn('Error using PolicyWizard, falling back to API:', error);
            }
        }

        // Fallback to API call
        const configurations = this.selectedPolicies.map(p => ({
            policyId: p.policyId,
            policy: p.policy,
            configuration: p.configuration
        }));

        try {
            const response = await fetch('/api/apim-policies/generate-bicep', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    configurations: configurations,
                    scope: this.selectedScope,
                    scopeId: this.scopeId,
                    parentResource: this.getParentResourceName()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate Bicep');
            }

            const result = await response.json();
            return result.bicep || '';
        } catch (error) {
            console.error('Error generating Bicep:', error);
            throw error;
        }
    }

    /**
     * Convert current state to PolicyModel format
     * @private
     * @returns {Object} PolicyModel
     */
    convertToPolicyModel() {
        // This is a simplified conversion - full implementation would map all policies
        const model = {
            scope: this.selectedScope,
            apiId: this.selectedScope === 'api' || this.selectedScope === 'operation' ? this.scopeId?.split('/')[0] : undefined,
            operationId: this.selectedScope === 'operation' ? this.scopeId?.split('/')[1] : undefined,
            sections: {}
        };

        // Convert selected policies to PolicyModel items
        // This is a basic conversion - would need more sophisticated mapping
        return model;
    }

    /**
     * Get PolicyWizard instance (if available)
     * @returns {Object|null} PolicyWizardInstance or null
     */
    getWizardInstance() {
        return this.wizardInstance;
    }

    /**
     * Generate XML using PolicyWizard
     * @returns {Promise<string>} Policy XML
     */
    async generateXml() {
        const wizard = await loadPolicyWizard();
        if (wizard && this.wizardInstance) {
            return this.wizardInstance.toXml();
        }
        throw new Error('PolicyWizard not available. Run "npm run build" to compile TypeScript files.');
    }

    /**
     * Validate current policy configuration using PolicyWizard
     * @returns {Promise<Object>} Validation result
     */
    async validate() {
        const wizard = await loadPolicyWizard();
        if (wizard && this.wizardInstance) {
            return this.wizardInstance.validate();
        }
        return { valid: true, errors: [], warnings: [] };
    }

    /**
     * Get parent resource name based on scope
     * @returns {string}
     */
    getParentResourceName() {
        switch (this.selectedScope) {
            case 'global':
                return 'apimService';
            case 'product':
                return 'productResource';
            case 'api':
                return 'apiResource';
            case 'operation':
                return 'operationResource';
            default:
                return 'apiResource';
        }
    }

    /**
     * Clear all selections
     */
    clear() {
        this.selectedScope = null;
        this.scopeId = null;
        this.selectedCategory = null;
        this.selectedPolicies = [];
        this.currentPolicyIndex = 0;
    }

    /**
     * Export current configuration as JSON
     * @returns {Object}
     */
    exportConfiguration() {
        return {
            scope: this.selectedScope,
            scopeId: this.scopeId,
            category: this.selectedCategory,
            policies: this.getSelectedPolicies(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Load configuration from JSON
     * @param {Object} config
     */
    async loadConfiguration(config) {
        this.clear();
        this.selectScope(config.scope, config.scopeId);
        if (config.category) {
            this.selectCategory(config.category);
        }

        for (const policyConfig of config.policies || []) {
            await this.addPolicy(policyConfig.policyId);
            if (policyConfig.configuration) {
                this.configurePolicy(policyConfig.policyId, policyConfig.configuration);
            }
        }
    }
}
