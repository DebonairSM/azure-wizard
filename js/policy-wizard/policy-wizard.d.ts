/**
 * APIM Policy Wizard
 * Main class for policy wizard functionality
 */
import { PolicyModel, PolicyScope, ValidationResult, PolicyDetectionResult, WizardInstanceState } from './types.js';
import { ApimApiAdapter } from './adapters/apim-api.js';
import { DatabaseAdapter } from './adapters/database.js';
/**
 * Policy Wizard Instance
 * Represents an active wizard session
 */
export declare class PolicyWizardInstance {
    private state;
    constructor(initialModel: PolicyModel);
    /**
     * Get current wizard state
     */
    getState(): WizardInstanceState;
    /**
     * Get current policy model
     */
    getPolicyModel(): PolicyModel;
    /**
     * Update policy model
     */
    updatePolicyModel(model: Partial<PolicyModel>): void;
    /**
     * Validate current policy model
     */
    validate(): ValidationResult;
    /**
     * Generate XML from current policy model
     */
    toXml(): string;
    /**
     * Move to next step
     */
    nextStep(): void;
    /**
     * Move to previous step
     */
    previousStep(): void;
    /**
     * Go to specific step
     */
    goToStep(step: number): void;
    /**
     * Mark step as completed
     */
    completeStep(stepId: string): void;
}
/**
 * Policy Wizard Main Class
 */
export declare class PolicyWizard {
    /**
     * Start a new wizard instance
     */
    static start(scope: PolicyScope, apiId?: string, operationId?: string): PolicyWizardInstance;
    /**
     * Validate a policy model
     */
    static validate(policyModel: PolicyModel): ValidationResult;
    /**
     * Convert policy model to XML
     */
    static toXml(policyModel: PolicyModel): string;
    /**
     * Detect existing policy
     */
    static detectPolicy(scope: PolicyScope, apiId?: string, operationId?: string, apimAdapter?: ApimApiAdapter, dbAdapter?: DatabaseAdapter): Promise<PolicyDetectionResult>;
    /**
     * Parse XML into policy model
     */
    static fromXml(xml: string): Promise<PolicyModel>;
    /**
     * Create wizard instance from existing policy model
     */
    static fromModel(policyModel: PolicyModel): PolicyWizardInstance;
}
//# sourceMappingURL=policy-wizard.d.ts.map