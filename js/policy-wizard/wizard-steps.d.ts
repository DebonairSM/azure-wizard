/**
 * Wizard Steps Definition
 * Defines the steps of the policy wizard
 */
import { WizardStep } from './types.js';
/**
 * Get all wizard steps
 */
export declare function getWizardSteps(): WizardStep[];
/**
 * Get step by ID
 */
export declare function getStepById(stepId: string): WizardStep | undefined;
/**
 * Get step by order
 */
export declare function getStepByOrder(order: number): WizardStep | undefined;
//# sourceMappingURL=wizard-steps.d.ts.map