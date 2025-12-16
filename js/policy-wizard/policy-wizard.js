/**
 * APIM Policy Wizard
 * Main class for policy wizard functionality
 */
import { validate, checkDuplicateVariableNames } from './validation.js';
import { toXml } from './xml-generator.js';
import { detectPolicy } from './policy-detector.js';
import { fromXml } from './xml-parser.js';
/**
 * Policy Wizard Instance
 * Represents an active wizard session
 */
export class PolicyWizardInstance {
    constructor(initialModel) {
        this.state = {
            currentStep: 0,
            policyModel: initialModel,
            completedSteps: []
        };
    }
    /**
     * Get current wizard state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get current policy model
     */
    getPolicyModel() {
        return { ...this.state.policyModel };
    }
    /**
     * Update policy model
     */
    updatePolicyModel(model) {
        this.state.policyModel = {
            ...this.state.policyModel,
            ...model,
            sections: {
                ...this.state.policyModel.sections,
                ...model.sections
            }
        };
    }
    /**
     * Validate current policy model
     */
    validate() {
        const result = validate(this.state.policyModel);
        // Add duplicate variable name checks
        const duplicateWarnings = checkDuplicateVariableNames(this.state.policyModel);
        result.warnings.push(...duplicateWarnings);
        this.state.validationResult = result;
        return result;
    }
    /**
     * Generate XML from current policy model
     */
    toXml() {
        return toXml(this.state.policyModel);
    }
    /**
     * Move to next step
     */
    nextStep() {
        this.state.currentStep++;
    }
    /**
     * Move to previous step
     */
    previousStep() {
        if (this.state.currentStep > 0) {
            this.state.currentStep--;
        }
    }
    /**
     * Go to specific step
     */
    goToStep(step) {
        if (step >= 0) {
            this.state.currentStep = step;
        }
    }
    /**
     * Mark step as completed
     */
    completeStep(stepId) {
        if (!this.state.completedSteps.includes(stepId)) {
            this.state.completedSteps.push(stepId);
        }
    }
}
/**
 * Policy Wizard Main Class
 */
export class PolicyWizard {
    /**
     * Start a new wizard instance
     */
    static start(scope, apiId, operationId) {
        const initialModel = {
            scope,
            apiId,
            operationId,
            sections: {}
        };
        return new PolicyWizardInstance(initialModel);
    }
    /**
     * Validate a policy model
     */
    static validate(policyModel) {
        const result = validate(policyModel);
        // Add duplicate variable name checks
        const duplicateWarnings = checkDuplicateVariableNames(policyModel);
        result.warnings.push(...duplicateWarnings);
        return result;
    }
    /**
     * Convert policy model to XML
     */
    static toXml(policyModel) {
        return toXml(policyModel);
    }
    /**
     * Detect existing policy
     */
    static async detectPolicy(scope, apiId, operationId, apimAdapter, dbAdapter) {
        return detectPolicy(scope, apiId, operationId, apimAdapter, dbAdapter);
    }
    /**
     * Parse XML into policy model
     */
    static async fromXml(xml) {
        return fromXml(xml);
    }
    /**
     * Create wizard instance from existing policy model
     */
    static fromModel(policyModel) {
        return new PolicyWizardInstance(policyModel);
    }
}
//# sourceMappingURL=policy-wizard.js.map