/**
 * Wizard Steps Definition
 * Defines the steps of the policy wizard
 */
/**
 * Get all wizard steps
 */
export function getWizardSteps() {
    return [
        {
            id: 'scope-selection',
            name: 'Scope Selection',
            description: 'Select the scope for the policy (global, product, API, or operation)',
            order: 1,
            required: true
        },
        {
            id: 'policy-detection',
            name: 'Policy Detection',
            description: 'Check if a policy already exists for this scope',
            order: 2,
            required: false
        },
        {
            id: 'section-selection',
            name: 'Section Selection',
            description: 'Choose which policy sections to manage',
            order: 3,
            required: true
        },
        {
            id: 'policy-selection',
            name: 'Policy Selection',
            description: 'Browse and select policies from the catalog',
            order: 4,
            required: false
        },
        {
            id: 'policy-configuration',
            name: 'Policy Configuration',
            description: 'Configure parameters for selected policies',
            order: 5,
            required: false
        },
        {
            id: 'fragment-selection',
            name: 'Fragment Selection',
            description: 'Add policy fragments to sections',
            order: 6,
            required: false
        },
        {
            id: 'named-values',
            name: 'Named Values',
            description: 'Configure named value references',
            order: 7,
            required: false
        },
        {
            id: 'external-calls',
            name: 'External Calls',
            description: 'Configure send-request policies for external services',
            order: 8,
            required: false
        },
        {
            id: 'advanced-custom',
            name: 'Advanced/Custom',
            description: 'Add custom XML blocks and expressions',
            order: 9,
            required: false
        },
        {
            id: 'ordering',
            name: 'Ordering',
            description: 'Reorder policies within each section',
            order: 10,
            required: false
        },
        {
            id: 'validation',
            name: 'Validation',
            description: 'Review validation results',
            order: 11,
            required: false
        },
        {
            id: 'review-export',
            name: 'Review & Export',
            description: 'Review final XML and export',
            order: 12,
            required: true
        }
    ];
}
/**
 * Get step by ID
 */
export function getStepById(stepId) {
    return getWizardSteps().find(step => step.id === stepId);
}
/**
 * Get step by order
 */
export function getStepByOrder(order) {
    return getWizardSteps().find(step => step.order === order);
}
//# sourceMappingURL=wizard-steps.js.map