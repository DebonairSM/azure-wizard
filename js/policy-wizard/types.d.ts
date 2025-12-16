/**
 * Type definitions for APIM Policy Wizard
 * Core data model representing APIM policies
 */
/**
 * Policy scope types
 */
export type PolicyScope = 'global' | 'product' | 'api' | 'operation';
/**
 * HTTP methods for send-request policies
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
/**
 * Policy section names
 */
export type PolicySectionName = 'inbound' | 'backend' | 'outbound' | 'on-error';
/**
 * Named value reference for APIM named values
 */
export interface NamedValueReference {
    type: 'named-value';
    name: string;
    keyVault?: boolean;
}
/**
 * Value that can be a string or named value reference
 */
export type StringOrNamedValue = string | NamedValueReference;
/**
 * Main policy model representing a complete APIM policy
 */
export interface PolicyModel {
    scope: PolicyScope;
    apiId?: string;
    operationId?: string;
    sections: PolicySections;
    metadata?: PolicyMetadata;
}
/**
 * All four policy sections
 */
export interface PolicySections {
    inbound?: PolicySection;
    backend?: PolicySection;
    outbound?: PolicySection;
    onError?: PolicySection;
}
/**
 * Policy section with ordered list of policy items
 */
export interface PolicySection {
    items: PolicyItem[];
    includeBase?: boolean;
}
/**
 * Union type for different policy item types
 */
export type PolicyItem = CatalogPolicyItem | FragmentPolicyItem | CustomXmlPolicyItem | CustomExpressionItem;
/**
 * Built-in policy from catalog with configuration
 */
export interface CatalogPolicyItem {
    type: 'catalog';
    policyId: string;
    order: number;
    configuration: Record<string, any>;
    attributes?: Record<string, string | NamedValueReference>;
}
/**
 * Reference to a policy fragment
 */
export interface FragmentPolicyItem {
    type: 'fragment';
    fragmentId: string;
    order: number;
}
/**
 * Raw XML block for custom policies
 */
export interface CustomXmlPolicyItem {
    type: 'custom-xml';
    xml: string;
    order: number;
}
/**
 * C# policy expression
 */
export interface CustomExpressionItem {
    type: 'expression';
    expression: string;
    context: 'attribute' | 'value' | 'condition';
    order: number;
    targetElement?: string;
    targetAttribute?: string;
}
/**
 * Special configuration for send-request policies
 */
export interface SendRequestConfiguration {
    url: string | NamedValueReference;
    method: HttpMethod;
    mode?: 'new' | 'copy';
    headers?: Record<string, string | NamedValueReference>;
    body?: string | NamedValueReference;
    timeout?: number;
    ignoreErrors?: boolean;
    responseVariableName?: string;
    setUrl?: string | NamedValueReference;
}
/**
 * Policy metadata
 */
export interface PolicyMetadata {
    name?: string;
    description?: string;
    version?: string;
    createdAt?: Date;
    updatedAt?: Date;
    tags?: string[];
}
/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
/**
 * Validation error
 */
export interface ValidationError {
    path: string;
    message: string;
    code: string;
}
/**
 * Validation warning
 */
export interface ValidationWarning {
    path: string;
    message: string;
    code: string;
}
/**
 * Policy detection result
 */
export interface PolicyDetectionResult {
    exists: boolean;
    policyXml?: string;
    policyModel?: PolicyModel;
    source: 'database' | 'apim-api' | 'both';
}
/**
 * Policy catalog entry
 */
export interface PolicyCatalogEntry {
    id: string;
    name: string;
    category: PolicyCategory;
    description?: string;
    supportedSections: PolicySectionName[];
    parameters?: PolicyParameterSchema;
    validationRules?: ValidationRule[];
    xmlTemplate?: (config: Record<string, any>) => string;
}
/**
 * Policy categories
 */
export type PolicyCategory = 'access-control' | 'transformation' | 'backend' | 'observability' | 'caching' | 'security' | 'ai-gateway' | 'advanced';
/**
 * Policy parameter schema
 */
export interface PolicyParameterSchema {
    [key: string]: PolicyParameter;
}
/**
 * Policy parameter definition
 */
export interface PolicyParameter {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    default?: any;
    description?: string;
    enum?: string[];
    min?: number;
    max?: number;
    pattern?: string;
    items?: PolicyParameter;
    properties?: PolicyParameterSchema;
}
/**
 * Validation rule
 */
export interface ValidationRule {
    type: 'required' | 'pattern' | 'range' | 'custom';
    field: string;
    message?: string;
    validator?: (value: any) => boolean;
}
/**
 * Named value information
 */
export interface NamedValueInfo {
    name: string;
    value?: string;
    secret?: boolean;
    keyVault?: boolean;
    keyVaultSecretId?: string;
    tags?: string[];
}
/**
 * Policy fragment information
 */
export interface PolicyFragmentInfo {
    id: string;
    name?: string;
    description?: string;
    content?: string;
    format?: 'xml' | 'rawxml';
}
/**
 * Wizard step definition
 */
export interface WizardStep {
    id: string;
    name: string;
    description?: string;
    order: number;
    required?: boolean;
}
/**
 * Wizard instance state
 */
export interface WizardInstanceState {
    currentStep: number;
    policyModel: PolicyModel;
    validationResult?: ValidationResult;
    completedSteps: string[];
}
//# sourceMappingURL=types.d.ts.map