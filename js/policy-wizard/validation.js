/**
 * Validation module for APIM Policy Wizard
 */
const VALID_HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
/**
 * Validate a policy model
 */
export function validate(policyModel) {
    const errors = [];
    const warnings = [];
    // Validate scope
    if (!policyModel.scope) {
        errors.push({
            path: 'scope',
            message: 'Policy scope is required',
            code: 'REQUIRED_FIELD'
        });
    }
    else if (!['global', 'product', 'api', 'operation'].includes(policyModel.scope)) {
        errors.push({
            path: 'scope',
            message: 'Invalid policy scope',
            code: 'INVALID_SCOPE'
        });
    }
    // Validate scope-specific requirements
    if (policyModel.scope === 'api' && !policyModel.apiId) {
        errors.push({
            path: 'apiId',
            message: 'API ID is required when scope is "api"',
            code: 'REQUIRED_FIELD'
        });
    }
    if (policyModel.scope === 'operation' && (!policyModel.apiId || !policyModel.operationId)) {
        errors.push({
            path: 'operationId',
            message: 'Both API ID and Operation ID are required when scope is "operation"',
            code: 'REQUIRED_FIELD'
        });
    }
    // Validate sections
    if (policyModel.sections) {
        validateSection('inbound', policyModel.sections.inbound, errors, warnings);
        validateSection('backend', policyModel.sections.backend, errors, warnings);
        validateSection('outbound', policyModel.sections.outbound, errors, warnings);
        validateSection('on-error', policyModel.sections.onError, errors, warnings);
    }
    else {
        warnings.push({
            path: 'sections',
            message: 'No policy sections defined',
            code: 'EMPTY_SECTIONS'
        });
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * Validate a policy section
 */
function validateSection(sectionName, section, errors, warnings) {
    if (!section) {
        return;
    }
    if (!Array.isArray(section.items)) {
        errors.push({
            path: `sections.${sectionName}.items`,
            message: 'Section items must be an array',
            code: 'INVALID_TYPE'
        });
        return;
    }
    // Check for duplicate orders
    const orders = section.items.map((item) => item.order).filter((o) => o !== undefined);
    const duplicateOrders = orders.filter((o, index) => orders.indexOf(o) !== index);
    if (duplicateOrders.length > 0) {
        warnings.push({
            path: `sections.${sectionName}.items`,
            message: `Duplicate order values found: ${duplicateOrders.join(', ')}`,
            code: 'DUPLICATE_ORDER'
        });
    }
    // Validate each item
    section.items.forEach((item, index) => {
        const itemPath = `sections.${sectionName}.items[${index}]`;
        validatePolicyItem(itemPath, item, errors, warnings);
    });
}
/**
 * Validate a policy item
 */
function validatePolicyItem(path, item, errors, warnings) {
    if (!item.type) {
        errors.push({
            path,
            message: 'Policy item type is required',
            code: 'REQUIRED_FIELD'
        });
        return;
    }
    switch (item.type) {
        case 'catalog':
            validateCatalogPolicyItem(path, item, errors, warnings);
            break;
        case 'fragment':
            validateFragmentPolicyItem(path, item, errors, warnings);
            break;
        case 'custom-xml':
            validateCustomXmlPolicyItem(path, item, errors, warnings);
            break;
        case 'expression':
            validateCustomExpressionItem(path, item, errors, warnings);
            break;
        default:
            errors.push({
                path,
                message: `Unknown policy item type: ${item.type}`,
                code: 'UNKNOWN_TYPE'
            });
    }
}
/**
 * Validate a catalog policy item
 */
function validateCatalogPolicyItem(path, item, errors, warnings) {
    if (!item.policyId) {
        errors.push({
            path: `${path}.policyId`,
            message: 'Policy ID is required for catalog policy items',
            code: 'REQUIRED_FIELD'
        });
    }
    // Validate send-request configuration if present
    if (item.policyId === 'send-request' && item.configuration) {
        validateSendRequestConfiguration(`${path}.configuration`, item.configuration, errors, warnings);
    }
}
/**
 * Validate a fragment policy item
 */
function validateFragmentPolicyItem(path, item, errors, warnings) {
    if (!item.fragmentId || item.fragmentId.trim() === '') {
        errors.push({
            path: `${path}.fragmentId`,
            message: 'Fragment ID is required',
            code: 'REQUIRED_FIELD'
        });
    }
}
/**
 * Validate a custom XML policy item
 */
function validateCustomXmlPolicyItem(path, item, errors, warnings) {
    if (!item.xml || item.xml.trim() === '') {
        errors.push({
            path: `${path}.xml`,
            message: 'XML content is required for custom XML policy items',
            code: 'REQUIRED_FIELD'
        });
        return;
    }
    // Basic XML well-formedness check
    try {
        const xmlStr = item.xml.trim();
        if (!xmlStr.startsWith('<') || !xmlStr.includes('>')) {
            errors.push({
                path: `${path}.xml`,
                message: 'Invalid XML format',
                code: 'INVALID_XML'
            });
            return;
        }
        // Check for balanced tags (basic check)
        const openTags = (xmlStr.match(/<[^/!?][^>]*>/g) || []).length;
        const closeTags = (xmlStr.match(/<\/[^>]+>/g) || []).length;
        const selfClosingTags = (xmlStr.match(/<[^>]+\/>/g) || []).length;
        if (openTags - closeTags - selfClosingTags !== 0 && !xmlStr.includes('/>')) {
            warnings.push({
                path: `${path}.xml`,
                message: 'XML may have unbalanced tags',
                code: 'UNBALANCED_TAGS'
            });
        }
    }
    catch (error) {
        errors.push({
            path: `${path}.xml`,
            message: 'Failed to parse XML',
            code: 'INVALID_XML'
        });
    }
}
/**
 * Validate a custom expression item
 */
function validateCustomExpressionItem(path, item, errors, warnings) {
    if (!item.expression || item.expression.trim() === '') {
        errors.push({
            path: `${path}.expression`,
            message: 'Expression is required for custom expression items',
            code: 'REQUIRED_FIELD'
        });
        return;
    }
    // Basic expression syntax check
    const expr = item.expression.trim();
    if (item.context === 'attribute' && !expr.startsWith('@(')) {
        warnings.push({
            path: `${path}.expression`,
            message: 'Attribute expressions should typically start with @(',
            code: 'EXPRESSION_FORMAT'
        });
    }
    // Check for balanced parentheses
    const openParens = (expr.match(/\(/g) || []).length;
    const closeParens = (expr.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
        errors.push({
            path: `${path}.expression`,
            message: 'Unbalanced parentheses in expression',
            code: 'INVALID_EXPRESSION'
        });
    }
}
/**
 * Validate send-request configuration
 */
function validateSendRequestConfiguration(path, config, errors, warnings) {
    // Validate URL
    if (!config.url) {
        errors.push({
            path: `${path}.url`,
            message: 'URL is required for send-request policy',
            code: 'REQUIRED_FIELD'
        });
    }
    else if (typeof config.url === 'string') {
        try {
            new URL(config.url);
        }
        catch {
            // Not a full URL, might be a relative path or expression
            if (!config.url.startsWith('@(') && !config.url.startsWith('${{')) {
                warnings.push({
                    path: `${path}.url`,
                    message: 'URL does not appear to be a valid URL or expression',
                    code: 'INVALID_URL'
                });
            }
        }
    }
    // Validate HTTP method
    if (config.method && !VALID_HTTP_METHODS.includes(config.method)) {
        errors.push({
            path: `${path}.method`,
            message: `Invalid HTTP method: ${config.method}. Must be one of: ${VALID_HTTP_METHODS.join(', ')}`,
            code: 'INVALID_HTTP_METHOD'
        });
    }
    // Validate timeout
    if (config.timeout !== undefined && (config.timeout < 0 || !Number.isInteger(config.timeout))) {
        errors.push({
            path: `${path}.timeout`,
            message: 'Timeout must be a non-negative integer',
            code: 'INVALID_TIMEOUT'
        });
    }
    // Validate response variable name
    if (config.responseVariableName && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(config.responseVariableName)) {
        errors.push({
            path: `${path}.responseVariableName`,
            message: 'Response variable name must be a valid identifier',
            code: 'INVALID_VARIABLE_NAME'
        });
    }
}
/**
 * Validate named value reference
 */
export function validateNamedValueReference(path, ref, errors, warnings) {
    if (!ref.name || ref.name.trim() === '') {
        errors.push({
            path: `${path}.name`,
            message: 'Named value name is required',
            code: 'REQUIRED_FIELD'
        });
    }
    // Named value names should follow APIM naming conventions
    if (ref.name && !/^[a-zA-Z0-9_-]+$/.test(ref.name)) {
        warnings.push({
            path: `${path}.name`,
            message: 'Named value name should contain only alphanumeric characters, hyphens, and underscores',
            code: 'INVALID_NAMED_VALUE_NAME'
        });
    }
}
/**
 * Check for duplicate variable names across all sections
 */
export function checkDuplicateVariableNames(policyModel) {
    const warnings = [];
    const variableNames = new Set();
    const checkSection = (sectionName, section) => {
        if (!section || !section.items) {
            return;
        }
        section.items.forEach((item, index) => {
            if (item.type === 'catalog' && item.configuration) {
                const catalogItem = item;
                if (catalogItem.policyId === 'set-variable' && catalogItem.configuration.name) {
                    const varName = catalogItem.configuration.name;
                    if (variableNames.has(varName)) {
                        warnings.push({
                            path: `sections.${sectionName}.items[${index}].configuration.name`,
                            message: `Duplicate variable name: ${varName}`,
                            code: 'DUPLICATE_VARIABLE_NAME'
                        });
                    }
                    else {
                        variableNames.add(varName);
                    }
                }
                // Check send-request response variable names
                if (catalogItem.policyId === 'send-request' && catalogItem.configuration.responseVariableName) {
                    const varName = catalogItem.configuration.responseVariableName;
                    if (variableNames.has(varName)) {
                        warnings.push({
                            path: `sections.${sectionName}.items[${index}].configuration.responseVariableName`,
                            message: `Duplicate response variable name: ${varName}`,
                            code: 'DUPLICATE_VARIABLE_NAME'
                        });
                    }
                    else {
                        variableNames.add(varName);
                    }
                }
            }
        });
    };
    if (policyModel.sections) {
        checkSection('inbound', policyModel.sections.inbound);
        checkSection('backend', policyModel.sections.backend);
        checkSection('outbound', policyModel.sections.outbound);
        checkSection('on-error', policyModel.sections.onError);
    }
    return warnings;
}
//# sourceMappingURL=validation.js.map