// AI: Compatibility checker evaluates rules between components and returns warnings/errors.
// Supports multiple rule types: errors (hard conflicts), warnings (soft conflicts), and info (recommendations).

/**
 * Compatibility checker class
 */
export class CompatibilityChecker {
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.rulesCache = null;
    }

    /**
     * Initialize compatibility rules from data provider
     * @returns {Promise<void>}
     */
    async initialize() {
        if (!this.rulesCache) {
            this.rulesCache = await this.dataProvider.getAllCompatibilityRules();
        }
    }

    /**
     * Check compatibility between two components
     * @param {string} componentId1
     * @param {string} componentId2
     * @returns {Promise<Object|null>} - Rule object or null if compatible
     */
    async checkPair(componentId1, componentId2) {
        await this.initialize();
        
        // Check rules in both directions (symmetric)
        const rule = this.rulesCache.find(r => 
            (r.componentId1 === componentId1 && r.componentId2 === componentId2) ||
            (r.componentId1 === componentId2 && r.componentId2 === componentId1)
        );

        return rule || null;
    }

    /**
     * Check all compatibility issues for a set of components
     * @param {Array<string>} componentIds - Array of component IDs
     * @returns {Promise<Array>} - Array of compatibility issues { type, componentId1, componentId2, message, reason }
     */
    async checkAll(componentIds) {
        await this.initialize();
        
        const issues = [];
        
        // Check all pairs
        for (let i = 0; i < componentIds.length; i++) {
            for (let j = i + 1; j < componentIds.length; j++) {
                const rule = await this.checkPair(componentIds[i], componentIds[j]);
                if (rule) {
                    issues.push({
                        type: rule.type, // 'error', 'warning', 'info'
                        componentId1: componentIds[i],
                        componentId2: componentIds[j],
                        message: rule.message,
                        reason: rule.reason
                    });
                }
            }
        }

        return issues;
    }

    /**
     * Get all errors (hard conflicts) for a set of components
     * @param {Array<string>} componentIds
     * @returns {Promise<Array>}
     */
    async getErrors(componentIds) {
        const allIssues = await this.checkAll(componentIds);
        return allIssues.filter(issue => issue.type === 'error');
    }

    /**
     * Get all warnings (soft conflicts) for a set of components
     * @param {Array<string>} componentIds
     * @returns {Promise<Array>}
     */
    async getWarnings(componentIds) {
        const allIssues = await this.checkAll(componentIds);
        return allIssues.filter(issue => issue.type === 'warning');
    }

    /**
     * Get all info messages (recommendations) for a set of components
     * @param {Array<string>} componentIds
     * @returns {Promise<Array>}
     */
    async getInfo(componentIds) {
        const allIssues = await this.checkAll(componentIds);
        return allIssues.filter(issue => issue.type === 'info');
    }

    /**
     * Check if a component can be added given existing components
     * @param {string} newComponentId
     * @param {Array<string>} existingComponentIds
     * @returns {Promise<Object>} - { canAdd: boolean, errors: Array, warnings: Array }
     */
    async canAddComponent(newComponentId, existingComponentIds) {
        const testSet = [...existingComponentIds, newComponentId];
        const errors = await this.getErrors(testSet);
        
        return {
            canAdd: errors.length === 0,
            errors: errors.filter(e => 
                e.componentId1 === newComponentId || e.componentId2 === newComponentId
            ),
            warnings: await this.getWarnings(testSet).then(warnings => 
                warnings.filter(w => 
                    w.componentId1 === newComponentId || w.componentId2 === newComponentId
                )
            )
        };
    }

    /**
     * Get human-readable component names for an issue
     * @param {Object} issue
     * @returns {Promise<Object>} - { component1Name, component2Name }
     */
    async getComponentNames(issue) {
        const comp1 = await this.dataProvider.getComponentById(issue.componentId1);
        const comp2 = await this.dataProvider.getComponentById(issue.componentId2);
        
        return {
            component1Name: comp1 ? comp1.name : issue.componentId1,
            component2Name: comp2 ? comp2.name : issue.componentId2
        };
    }
}































