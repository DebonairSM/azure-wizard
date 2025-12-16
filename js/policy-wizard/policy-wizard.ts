/**
 * APIM Policy Wizard
 * Main class for policy wizard functionality
 */

import {
  PolicyModel,
  PolicyScope,
  ValidationResult,
  PolicyDetectionResult,
  WizardInstanceState
} from './types.js';
import { validate, checkDuplicateVariableNames } from './validation.js';
import { toXml } from './xml-generator.js';
import { detectPolicy } from './policy-detector.js';
import { fromXml } from './xml-parser.js';
import { ApimApiAdapter } from './adapters/apim-api.js';
import { DatabaseAdapter } from './adapters/database.js';

/**
 * Policy Wizard Instance
 * Represents an active wizard session
 */
export class PolicyWizardInstance {
  private state: WizardInstanceState;

  constructor(initialModel: PolicyModel) {
    this.state = {
      currentStep: 0,
      policyModel: initialModel,
      completedSteps: []
    };
  }

  /**
   * Get current wizard state
   */
  getState(): WizardInstanceState {
    return { ...this.state };
  }

  /**
   * Get current policy model
   */
  getPolicyModel(): PolicyModel {
    return { ...this.state.policyModel };
  }

  /**
   * Update policy model
   */
  updatePolicyModel(model: Partial<PolicyModel>): void {
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
  validate(): ValidationResult {
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
  toXml(): string {
    return toXml(this.state.policyModel);
  }

  /**
   * Move to next step
   */
  nextStep(): void {
    this.state.currentStep++;
  }

  /**
   * Move to previous step
   */
  previousStep(): void {
    if (this.state.currentStep > 0) {
      this.state.currentStep--;
    }
  }

  /**
   * Go to specific step
   */
  goToStep(step: number): void {
    if (step >= 0) {
      this.state.currentStep = step;
    }
  }

  /**
   * Mark step as completed
   */
  completeStep(stepId: string): void {
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
  static start(
    scope: PolicyScope,
    apiId?: string,
    operationId?: string
  ): PolicyWizardInstance {
    const initialModel: PolicyModel = {
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
  static validate(policyModel: PolicyModel): ValidationResult {
    const result = validate(policyModel);
    
    // Add duplicate variable name checks
    const duplicateWarnings = checkDuplicateVariableNames(policyModel);
    result.warnings.push(...duplicateWarnings);

    return result;
  }

  /**
   * Convert policy model to XML
   */
  static toXml(policyModel: PolicyModel): string {
    return toXml(policyModel);
  }

  /**
   * Detect existing policy
   */
  static async detectPolicy(
    scope: PolicyScope,
    apiId?: string,
    operationId?: string,
    apimAdapter?: ApimApiAdapter,
    dbAdapter?: DatabaseAdapter
  ): Promise<PolicyDetectionResult> {
    return detectPolicy(scope, apiId, operationId, apimAdapter, dbAdapter);
  }

  /**
   * Parse XML into policy model
   */
  static async fromXml(xml: string): Promise<PolicyModel> {
    return fromXml(xml);
  }

  /**
   * Create wizard instance from existing policy model
   */
  static fromModel(policyModel: PolicyModel): PolicyWizardInstance {
    return new PolicyWizardInstance(policyModel);
  }
}

