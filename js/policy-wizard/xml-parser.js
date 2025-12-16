/**
 * XML Parser for APIM Policy Wizard
 * Parses existing APIM policy XML into PolicyModel
 */
import { parseString } from 'xml2js';
/**
 * Parse APIM policy XML into PolicyModel
 * Uses xml2js for robust XML parsing
 */
export async function fromXml(xml) {
    try {
        // Use xml2js for parsing
        return new Promise((resolve, reject) => {
            parseString(xml, { explicitArray: false, mergeAttrs: true }, (err, result) => {
                if (err) {
                    reject(new Error(`Failed to parse XML: ${err.message}`));
                    return;
                }
                if (!result || !result.policies) {
                    reject(new Error('Invalid policy XML: missing <policies> root element'));
                    return;
                }
                try {
                    const model = parsePolicyXml(result);
                    resolve(model);
                }
                catch (parseError) {
                    reject(new Error(`Failed to convert parsed XML to PolicyModel: ${parseError.message}`));
                }
            });
        });
    }
    catch (error) {
        throw new Error(`Failed to parse XML: ${error.message}`);
    }
}
/**
 * Parse section content from xml2js result
 */
function parseSectionContent(section) {
    if (!section) {
        return {};
    }
    const result = {};
    // Check for base element
    if (section.base !== undefined) {
        result.base = section.base;
    }
    // Copy all other elements
    for (const [key, value] of Object.entries(section)) {
        if (key !== 'base' && key !== '_') {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Parse parsed XML object into PolicyModel
 */
function parsePolicyXml(parsed) {
    const policies = parsed.policies || {};
    const model = {
        scope: 'api', // Default, should be determined from context
        sections: {}
    };
    // Parse inbound section
    if (policies.inbound) {
        const inboundContent = Array.isArray(policies.inbound) ? policies.inbound[0] : policies.inbound;
        model.sections.inbound = parseSection(inboundContent);
    }
    // Parse backend section
    if (policies.backend) {
        const backendContent = Array.isArray(policies.backend) ? policies.backend[0] : policies.backend;
        model.sections.backend = parseSection(backendContent);
    }
    // Parse outbound section
    if (policies.outbound) {
        const outboundContent = Array.isArray(policies.outbound) ? policies.outbound[0] : policies.outbound;
        model.sections.outbound = parseSection(outboundContent);
    }
    // Parse on-error section
    if (policies['on-error']) {
        const onErrorContent = Array.isArray(policies['on-error']) ? policies['on-error'][0] : policies['on-error'];
        model.sections.onError = parseSection(onErrorContent);
    }
    return model;
}
/**
 * Parse a policy section
 */
function parseSection(section) {
    const items = [];
    let includeBase = false;
    let order = 0;
    // Check for base element
    if (section.base !== undefined) {
        includeBase = true;
    }
    // Parse all policy elements
    for (const [key, value] of Object.entries(section)) {
        if (key === 'base' || key === '_' || key === '$') {
            continue;
        }
        // Handle xml2js structure - value might be an object with attributes and text
        const normalizedValue = normalizeXml2JsValue(value);
        if (Array.isArray(normalizedValue)) {
            // Multiple elements of same type
            for (const item of normalizedValue) {
                const policyItem = parsePolicyElement(key, item, order++);
                if (policyItem) {
                    items.push(policyItem);
                }
            }
        }
        else if (typeof normalizedValue === 'object' && normalizedValue !== null) {
            // Single element
            const policyItem = parsePolicyElement(key, normalizedValue, order++);
            if (policyItem) {
                items.push(policyItem);
            }
        }
        else if (normalizedValue === '' || normalizedValue === null || normalizedValue === undefined) {
            // Self-closing element
            const policyItem = {
                type: 'catalog',
                policyId: key,
                order: order++,
                configuration: {}
            };
            items.push(policyItem);
        }
    }
    return {
        items,
        includeBase
    };
}
/**
 * Normalize xml2js value structure
 */
function normalizeXml2JsValue(value) {
    if (value === null || value === undefined) {
        return value;
    }
    // xml2js sometimes wraps single elements in arrays
    if (Array.isArray(value) && value.length === 1) {
        return normalizeXml2JsValue(value[0]);
    }
    // xml2js uses $ for attributes and _ for text
    if (typeof value === 'object' && !Array.isArray(value)) {
        // If it only has $ and _ properties, it's a simple element
        const keys = Object.keys(value);
        if (keys.length === 0) {
            return '';
        }
        if (keys.length === 1 && keys[0] === '_') {
            return value._ || '';
        }
        if (keys.length === 1 && keys[0] === '$') {
            return '';
        }
    }
    return value;
}
/**
 * Parse a single policy element
 */
function parsePolicyElement(elementName, element, order) {
    // Normalize element - xml2js uses $ for attributes
    const attrs = element.$ || {};
    const text = element._ || '';
    const hasBody = text || (typeof element === 'object' && Object.keys(element).some(k => k !== '$' && k !== '_'));
    // Check if it's a fragment
    if (elementName === 'include-fragment' || elementName === 'include') {
        const fragmentId = attrs['fragment-id'] || attrs.fragmentId || element['fragment-id'] || element.fragmentId || '';
        return {
            type: 'fragment',
            fragmentId,
            order
        };
    }
    // Check if it's send-request (complex element)
    if (elementName === 'send-request') {
        return parseSendRequestElement(element, order);
    }
    // For most policies, extract attributes as configuration
    const configuration = {};
    const attributes = {};
    // Process xml2js attributes ($)
    for (const [key, value] of Object.entries(attrs)) {
        const strValue = String(value);
        // Check if value is a named value reference
        if (strValue.startsWith('${{') && strValue.endsWith('}}')) {
            const namedValueName = strValue.slice(3, -2);
            attributes[key] = {
                type: 'named-value',
                name: namedValueName
            };
        }
        else {
            configuration[key] = value;
            attributes[key] = strValue;
        }
    }
    // Process direct properties (non-xml2js structure)
    for (const [key, value] of Object.entries(element)) {
        if (key === '_' || key === '$' || key.startsWith('$')) {
            continue;
        }
        if (typeof value === 'string') {
            // Check if value is a named value reference
            if (value.startsWith('${{') && value.endsWith('}}')) {
                const namedValueName = value.slice(3, -2);
                attributes[key] = {
                    type: 'named-value',
                    name: namedValueName
                };
            }
            else {
                configuration[key] = value;
                attributes[key] = value;
            }
        }
        else {
            configuration[key] = value;
        }
    }
    // Check if there's body content or nested elements
    if (hasBody || (typeof element === 'object' && Object.keys(element).some(k => k !== '$' && k !== '_' && !attributes[k]))) {
        // Has body content or nested elements - treat as custom XML
        return {
            type: 'custom-xml',
            xml: buildElementXml(elementName, element, attrs, text),
            order
        };
    }
    return {
        type: 'catalog',
        policyId: elementName,
        order,
        configuration,
        attributes
    };
}
/**
 * Parse send-request element
 */
function parseSendRequestElement(element, order) {
    const config = {};
    // Extract attributes
    if (element.mode)
        config.mode = element.mode;
    if (element['response-variable-name'])
        config.responseVariableName = element['response-variable-name'];
    if (element.timeout)
        config.timeout = parseInt(element.timeout, 10);
    if (element['ignore-error'])
        config.ignoreErrors = element['ignore-error'] === 'true';
    // Extract set-url
    if (element['set-url']) {
        config.setUrl = extractTextContent(element['set-url']);
    }
    // Extract set-method
    if (element['set-method']) {
        config.method = extractTextContent(element['set-method']);
    }
    // Extract set-headers
    if (element['set-headers']) {
        const headers = {};
        const headerArray = Array.isArray(element['set-headers'].header)
            ? element['set-headers'].header
            : [element['set-headers'].header];
        for (const header of headerArray) {
            if (header && header.name && header.value) {
                headers[header.name] = header.value;
            }
        }
        config.headers = headers;
    }
    // Extract set-body
    if (element['set-body']) {
        config.body = extractTextContent(element['set-body']);
    }
    // Extract set-backend-service
    if (element['set-backend-service']) {
        const backend = element['set-backend-service'];
        config.url = backend['base-url'] || backend.baseUrl || '';
    }
    return {
        type: 'catalog',
        policyId: 'send-request',
        order,
        configuration: config
    };
}
/**
 * Extract text content from element
 */
function extractTextContent(element) {
    if (typeof element === 'string') {
        return element;
    }
    if (element && element._) {
        return element._;
    }
    if (element && typeof element === 'object') {
        // Try to find text content
        for (const value of Object.values(element)) {
            if (typeof value === 'string') {
                return value;
            }
        }
    }
    return '';
}
/**
 * Build XML string from element (for custom XML items)
 */
function buildElementXml(elementName, element, attrs, text) {
    // This is a simplified version - for production, use a proper XML builder
    const attributes = [];
    // Use provided attrs or extract from element
    const elementAttrs = attrs || element.$ || {};
    for (const [key, value] of Object.entries(elementAttrs)) {
        if (typeof value === 'string') {
            attributes.push(`${key}="${value.replace(/"/g, '&quot;')}"`);
        }
    }
    // Also check direct properties
    for (const [key, value] of Object.entries(element)) {
        if (key !== '_' && key !== '$' && typeof value === 'string' && !elementAttrs[key]) {
            attributes.push(`${key}="${value.replace(/"/g, '&quot;')}"`);
        }
    }
    const attrsStr = attributes.length > 0 ? ' ' + attributes.join(' ') : '';
    const body = text || element._ || '';
    if (body) {
        return `<${elementName}${attrsStr}>${body}</${elementName}>`;
    }
    else {
        return `<${elementName}${attrsStr} />`;
    }
}
//# sourceMappingURL=xml-parser.js.map