/**
 * Validation module for APIM Policy Wizard
 */
import { PolicyModel, ValidationResult, ValidationError, ValidationWarning, NamedValueReference } from './types.js';
/**
 * Validate a policy model
 */
export declare function validate(policyModel: PolicyModel): ValidationResult;
/**
 * Validate named value reference
 */
export declare function validateNamedValueReference(path: string, ref: NamedValueReference, errors: ValidationError[], warnings: ValidationWarning[]): void;
/**
 * Check for duplicate variable names across all sections
 */
export declare function checkDuplicateVariableNames(policyModel: PolicyModel): ValidationWarning[];
//# sourceMappingURL=validation.d.ts.map