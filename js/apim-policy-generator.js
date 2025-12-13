// APIM Policy Generator - Generate Bicep templates from policy configurations

/**
 * Generate Bicep resource for a single policy
 * @param {Object} policyConfig - { policyId, policy, configuration }
 * @param {string} scope - 'global', 'product', 'api', 'operation'
 * @param {string} scopeId - Optional scope ID
 * @param {string} parentResource - Parent resource name in Bicep
 * @returns {string} Bicep code
 */
export function generatePolicyBicep(policyConfig, scope, scopeId, parentResource) {
    const { policy, configuration } = policyConfig;
    const xmlTemplate = policy.xmlTemplate || {};
    
    // Determine which sections to include based on XML template
    const sections = {
        inbound: xmlTemplate.inbound || null,
        backend: xmlTemplate.backend || null,
        outbound: xmlTemplate.outbound || null,
        onError: xmlTemplate['on-error'] || null
    };

    // Build XML content
    let xmlContent = '<policies>\n';
    
    if (sections.inbound) {
        xmlContent += '  <inbound>\n';
        xmlContent += `    ${renderPolicyXml(sections.inbound, configuration)}\n`;
        xmlContent += '  </inbound>\n';
    } else {
        xmlContent += '  <inbound />\n';
    }

    if (sections.backend) {
        xmlContent += '  <backend>\n';
        xmlContent += `    ${renderPolicyXml(sections.backend, configuration)}\n`;
        xmlContent += '  </backend>\n';
    } else {
        xmlContent += '  <backend>\n';
        xmlContent += '    <forward-request />\n';
        xmlContent += '  </backend>\n';
    }

    if (sections.outbound) {
        xmlContent += '  <outbound>\n';
        xmlContent += `    ${renderPolicyXml(sections.outbound, configuration)}\n`;
        xmlContent += '  </outbound>\n';
    } else {
        xmlContent += '  <outbound />\n';
    }

    if (sections.onError) {
        xmlContent += '  <on-error>\n';
        xmlContent += `    ${renderPolicyXml(sections.onError, configuration)}\n`;
        xmlContent += '  </on-error>\n';
    } else {
        xmlContent += '  <on-error />\n';
    }

    xmlContent += '</policies>';

    // Determine resource type based on scope
    let resourceType = '';
    let resourceName = '';
    
    switch (scope) {
        case 'global':
            resourceType = 'Microsoft.ApiManagement/service/policies@2023-05-01-preview';
            resourceName = 'globalPolicy';
            break;
        case 'product':
            resourceType = `Microsoft.ApiManagement/service/products/${scopeId}/policies@2023-05-01-preview`;
            resourceName = `productPolicy_${sanitizeName(scopeId)}`;
            break;
        case 'api':
            resourceType = 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview';
            resourceName = 'apiPolicy';
            break;
        case 'operation':
            resourceType = `Microsoft.ApiManagement/service/apis/${scopeId.split('/')[0]}/operations/${scopeId.split('/')[1]}/policies@2023-05-01-preview`;
            resourceName = `operationPolicy_${sanitizeName(scopeId)}`;
            break;
        default:
            resourceType = 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview';
            resourceName = 'apiPolicy';
    }

    // Generate Bicep resource
    const bicep = `
// ${policy.name} Policy
resource ${resourceName} '${resourceType}' = {
  parent: ${parentResource}
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
${xmlContent.split('\n').map(line => '      ' + line).join('\n')}
    '''
  }
}
`;

    return bicep;
}

/**
 * Generate combined Bicep for multiple policies at the same scope
 * @param {Array} configurations - Array of { policyId, policy, configuration }
 * @param {string} scope - 'global', 'product', 'api', 'operation'
 * @param {string} scopeId - Optional scope ID
 * @param {string} parentResource - Parent resource name in Bicep
 * @returns {Promise<string>} Combined Bicep code
 */
export async function generateCombinedBicep(configurations, scope, scopeId, parentResource) {
    if (!configurations || configurations.length === 0) {
        return '';
    }

    // Group policies by section (inbound, backend, outbound, on-error)
    const sections = {
        inbound: [],
        backend: [],
        outbound: [],
        onError: []
    };

    for (const config of configurations) {
        const { policy, configuration } = config;
        const xmlTemplate = policy.xmlTemplate || {};

        if (xmlTemplate.inbound) {
            sections.inbound.push({
                xml: renderPolicyXml(xmlTemplate.inbound, configuration),
                policy: policy
            });
        }
        if (xmlTemplate.backend) {
            sections.backend.push({
                xml: renderPolicyXml(xmlTemplate.backend, configuration),
                policy: policy
            });
        }
        if (xmlTemplate.outbound) {
            sections.outbound.push({
                xml: renderPolicyXml(xmlTemplate.outbound, configuration),
                policy: policy
            });
        }
        if (xmlTemplate['on-error']) {
            sections.onError.push({
                xml: renderPolicyXml(xmlTemplate['on-error'], configuration),
                policy: policy
            });
        }
    }

    // Build combined XML
    let xmlContent = '<policies>\n';
    
    // Inbound section
    xmlContent += '  <inbound>\n';
    if (sections.inbound.length > 0) {
        for (const item of sections.inbound) {
            xmlContent += `    ${item.xml}\n`;
        }
    }
    xmlContent += '  </inbound>\n';

    // Backend section
    xmlContent += '  <backend>\n';
    if (sections.backend.length > 0) {
        for (const item of sections.backend) {
            xmlContent += `    ${item.xml}\n`;
        }
    } else {
        xmlContent += '    <forward-request />\n';
    }
    xmlContent += '  </backend>\n';

    // Outbound section
    xmlContent += '  <outbound>\n';
    if (sections.outbound.length > 0) {
        for (const item of sections.outbound) {
            xmlContent += `    ${item.xml}\n`;
        }
    }
    xmlContent += '  </outbound>\n';

    // On-error section
    xmlContent += '  <on-error>\n';
    if (sections.onError.length > 0) {
        for (const item of sections.onError) {
            xmlContent += `    ${item.xml}\n`;
        }
    }
    xmlContent += '  </on-error>\n';

    xmlContent += '</policies>';

    // Determine resource type and name
    let resourceType = '';
    let resourceName = '';
    
    switch (scope) {
        case 'global':
            resourceType = 'Microsoft.ApiManagement/service/policies@2023-05-01-preview';
            resourceName = 'globalPolicy';
            break;
        case 'product':
            resourceType = `Microsoft.ApiManagement/service/products/${scopeId}/policies@2023-05-01-preview`;
            resourceName = `productPolicy_${sanitizeName(scopeId)}`;
            break;
        case 'api':
            resourceType = 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview';
            resourceName = 'apiPolicy';
            break;
        case 'operation':
            const [apiName, operationName] = scopeId.split('/');
            resourceType = `Microsoft.ApiManagement/service/apis/${apiName}/operations/${operationName}/policies@2023-05-01-preview`;
            resourceName = `operationPolicy_${sanitizeName(apiName)}_${sanitizeName(operationName)}`;
            break;
        default:
            resourceType = 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview';
            resourceName = 'apiPolicy';
    }

    // Generate Bicep resource
    const bicep = `
// Combined Policy Configuration
resource ${resourceName} '${resourceType}' = {
  parent: ${parentResource}
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
${xmlContent.split('\n').map(line => '      ' + line).join('\n')}
    '''
  }
}
`;

    return bicep;
}

/**
 * Render policy XML template with configuration values
 * @param {string} template - XML template string
 * @param {Object} configuration - Policy configuration values
 * @returns {string} Rendered XML
 */
function renderPolicyXml(template, configuration) {
    let rendered = template;
    
    // Replace {{variable}} placeholders with configuration values
    for (const [key, value] of Object.entries(configuration)) {
        const placeholder = `{{${key}}}`;
        if (rendered.includes(placeholder)) {
            // Handle different value types
            if (typeof value === 'boolean') {
                rendered = rendered.replace(new RegExp(placeholder, 'g'), value.toString());
            } else if (typeof value === 'number') {
                rendered = rendered.replace(new RegExp(placeholder, 'g'), value.toString());
            } else if (Array.isArray(value)) {
                // For arrays, might need special handling (e.g., CORS)
                rendered = rendered.replace(new RegExp(placeholder, 'g'), JSON.stringify(value));
            } else {
                // String values - escape XML
                const escapedValue = escapeXml(value);
                rendered = rendered.replace(new RegExp(placeholder, 'g'), escapedValue);
            }
        }
    }

    // Remove any remaining {{}} placeholders (optional parameters not set)
    rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');

    // Clean up extra spaces and attributes with empty values
    rendered = rendered.replace(/\s+=\s*""/g, '');
    rendered = rendered.replace(/\s+/g, ' ').trim();

    return rendered;
}

/**
 * Escape XML special characters
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
    if (typeof str !== 'string') {
        return str;
    }
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Sanitize name for Bicep resource identifier
 * @param {string} name
 * @returns {string}
 */
function sanitizeName(name) {
    if (!name) return '';
    return name
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/^[0-9]/, '_$&')
        .substring(0, 64); // Bicep identifier limit
}
