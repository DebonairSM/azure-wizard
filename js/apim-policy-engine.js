// APIM Policy Engine - Manages policy selection and configuration
// Integrates with WizardEngine for navigation through policy wizard

import indexedDbDataProvider from './data-provider.js';

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
        this.selectedScope = scope;
        this.scopeId = scopeId;
    }

    /**
     * Get selected scope
     * @returns {Object} - { scope, scopeId }
     */
    getScope() {
        return {
            scope: this.selectedScope,
            scopeId: this.scopeId
        };
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

        // Fetch policies from API
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
        return this.selectedPolicies.map(p => ({
            policyId: p.policyId,
            policy: p.policy,
            configuration: p.configuration
        }));
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
     * @returns {Promise<string>}
     */
    async generateBicep() {
        if (this.selectedPolicies.length === 0) {
            return '';
        }

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
