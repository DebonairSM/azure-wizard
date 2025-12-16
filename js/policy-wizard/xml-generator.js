/**
 * XML Generator for APIM Policy Wizard
 * Converts PolicyModel to valid APIM policy XML
 */
import { getPolicyById } from './policy-catalog.js';
/**
 * Convert PolicyModel to APIM policy XML
 */
export function toXml(policyModel) {
    let xml = '<policies>\n';
    // Generate inbound section
    if (policyModel.sections.inbound) {
        xml += generateSection('inbound', policyModel.sections.inbound);
    }
    else {
        xml += '  <inbound />\n';
    }
    // Generate backend section
    if (policyModel.sections.backend) {
        xml += generateSection('backend', policyModel.sections.backend);
    }
    else {
        xml += '  <backend>\n';
        xml += '    <forward-request />\n';
        xml += '  </backend>\n';
    }
    // Generate outbound section
    if (policyModel.sections.outbound) {
        xml += generateSection('outbound', policyModel.sections.outbound);
    }
    else {
        xml += '  <outbound />\n';
    }
    // Generate on-error section
    if (policyModel.sections.onError) {
        xml += generateSection('on-error', policyModel.sections.onError);
    }
    else {
        xml += '  <on-error />\n';
    }
    xml += '</policies>';
    return xml;
}
/**
 * Generate a policy section
 */
function generateSection(sectionName, section) {
    let xml = `  <${sectionName}>\n`;
    // Include base if specified (defaults to true)
    if (section.includeBase !== false) {
        xml += '    <base />\n';
    }
    // Sort items by order
    const sortedItems = [...section.items].sort((a, b) => (a.order || 0) - (b.order || 0));
    // Generate each policy item
    for (const item of sortedItems) {
        xml += generatePolicyItem(item, 4); // 4 spaces indentation
    }
    xml += `  </${sectionName}>\n`;
    return xml;
}
/**
 * Generate a policy item
 */
function generatePolicyItem(item, indent) {
    const indentStr = ' '.repeat(indent);
    switch (item.type) {
        case 'catalog':
            return generateCatalogPolicyItem(item, indentStr);
        case 'fragment':
            return generateFragmentPolicyItem(item, indentStr);
        case 'custom-xml':
            return generateCustomXmlPolicyItem(item, indentStr);
        case 'expression':
            return generateCustomExpressionItem(item, indentStr);
        default:
            return '';
    }
}
/**
 * Generate catalog policy item XML
 */
function generateCatalogPolicyItem(item, indent) {
    const catalogEntry = getPolicyById(item.policyId);
    if (!catalogEntry) {
        // Fallback: generate basic XML from policyId
        return generateBasicPolicyXml(item.policyId, item.configuration, item.attributes, indent);
    }
    // Special handling for send-request
    if (item.policyId === 'send-request') {
        return generateSendRequestPolicy(item.configuration, indent);
    }
    // Use catalog template if available
    if (catalogEntry.xmlTemplate) {
        return catalogEntry.xmlTemplate(item.configuration);
    }
    // Fallback to basic generation
    return generateBasicPolicyXml(item.policyId, item.configuration, item.attributes, indent);
}
/**
 * Generate basic policy XML from policy ID and configuration
 */
function generateBasicPolicyXml(policyId, configuration, attributes, indent = '    ') {
    const attrs = [];
    // Add configuration as attributes
    if (configuration) {
        for (const [key, value] of Object.entries(configuration)) {
            if (value !== undefined && value !== null && value !== '') {
                const attrValue = formatAttributeValue(value);
                attrs.push(`${key}="${attrValue}"`);
            }
        }
    }
    // Add explicit attributes
    if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
            const attrValue = formatAttributeValue(value);
            attrs.push(`${key}="${attrValue}"`);
        }
    }
    const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    return `${indent}<${policyId}${attrsStr} />\n`;
}
/**
 * Format attribute value (handles named values and expressions)
 */
function formatAttributeValue(value) {
    if (typeof value === 'object' && value !== null && value.type === 'named-value') {
        const namedValue = value;
        return '${{' + namedValue.name + '}}';
    }
    if (typeof value === 'string' && value.startsWith('@(')) {
        // Already an expression
        return escapeXml(value);
    }
    // Escape XML special characters
    return escapeXml(String(value));
}
/**
 * Generate send-request policy XML
 */
function generateSendRequestPolicy(config, indent) {
    let xml = `${indent}<send-request`;
    // Add attributes
    if (config.mode) {
        xml += ` mode="${config.mode}"`;
    }
    if (config.responseVariableName) {
        xml += ` response-variable-name="${escapeXml(config.responseVariableName)}"`;
    }
    if (config.timeout !== undefined) {
        xml += ` timeout="${config.timeout}"`;
    }
    if (config.ignoreErrors) {
        xml += ' ignore-error="true"';
    }
    xml += '>\n';
    // Set URL (prefer setUrl, fallback to url)
    const requestUrl = config.setUrl || config.url;
    if (requestUrl) {
        const urlValue = formatStringOrNamedValue(requestUrl);
        xml += `${indent}  <set-url>${urlValue}</set-url>\n`;
    }
    // Set method
    if (config.method) {
        xml += `${indent}  <set-method>${config.method}</set-method>\n`;
    }
    // Set headers
    if (config.headers) {
        xml += `${indent}  <set-headers>\n`;
        for (const [name, value] of Object.entries(config.headers)) {
            const headerValue = formatStringOrNamedValue(value);
            xml += `${indent}    <header name="${escapeXml(name)}" value="${headerValue}" />\n`;
        }
        xml += `${indent}  </set-headers>\n`;
    }
    // Set body
    if (config.body) {
        const bodyValue = formatStringOrNamedValue(config.body);
        xml += `${indent}  <set-body>${bodyValue}</set-body>\n`;
    }
    // Set backend service if url is provided and setUrl is not (url is for backend service)
    if (config.url && !config.setUrl) {
        const urlValue = formatStringOrNamedValue(config.url);
        xml += `${indent}  <set-backend-service base-url="${urlValue}" />\n`;
    }
    xml += `${indent}</send-request>\n`;
    return xml;
}
/**
 * Format string or named value reference
 */
function formatStringOrNamedValue(value) {
    if (typeof value === 'string') {
        return escapeXml(value);
    }
    return '${{' + value.name + '}}';
}
/**
 * Generate fragment policy item XML
 */
function generateFragmentPolicyItem(item, indent) {
    return `${indent}<include-fragment fragment-id="${escapeXml(item.fragmentId)}" />\n`;
}
/**
 * Generate custom XML policy item
 */
function generateCustomXmlPolicyItem(item, indent) {
    // Indent the custom XML
    const lines = item.xml.split('\n');
    return lines.map(line => `${indent}${line}`).join('\n') + '\n';
}
/**
 * Generate custom expression item
 */
function generateCustomExpressionItem(item, indent) {
    if (item.context === 'attribute' && item.targetElement && item.targetAttribute) {
        // Expression as attribute value
        return `${indent}<${item.targetElement} ${item.targetAttribute}="${escapeXml(item.expression)}" />\n`;
    }
    else if (item.context === 'value' && item.targetElement) {
        // Expression as element value
        return `${indent}<${item.targetElement}>${escapeXml(item.expression)}</${item.targetElement}>\n`;
    }
    else if (item.context === 'condition') {
        // Expression as condition (typically in choose/when)
        return `${indent}@(${item.expression})\n`;
    }
    else {
        // Default: output expression as-is
        return `${indent}@(${item.expression})\n`;
    }
}
/**
 * Escape XML special characters
 */
export function escapeXml(str) {
    if (typeof str !== 'string') {
        return String(str);
    }
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
/**
 * Unescape XML special characters
 */
export function unescapeXml(str) {
    return str
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
}
//# sourceMappingURL=xml-generator.js.map