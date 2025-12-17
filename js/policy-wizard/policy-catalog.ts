/**
 * APIM Policy Catalog
 * Comprehensive catalog of APIM policies grouped by category
 */

import {
  PolicyCatalogEntry,
  PolicyCategory,
  PolicySectionName,
  PolicyParameter,
  PolicyParameterSchema
} from './types.js';

/**
 * Get all policy catalog entries
 */
export function getAllPolicies(): PolicyCatalogEntry[] {
  return [
    ...getAccessControlPolicies(),
    ...getTransformationPolicies(),
    ...getBackendPolicies(),
    ...getObservabilityPolicies(),
    ...getCachingPolicies(),
    ...getSecurityPolicies(),
    ...getAiGatewayPolicies(),
    ...getAdvancedPolicies()
  ];
}

/**
 * Get policies by category
 */
export function getPoliciesByCategory(category: PolicyCategory): PolicyCatalogEntry[] {
  return getAllPolicies().filter(p => p.category === category);
}

/**
 * Get policy by ID
 */
export function getPolicyById(id: string): PolicyCatalogEntry | undefined {
  return getAllPolicies().find(p => p.id === id);
}

/**
 * Access Control Policies
 */
function getAccessControlPolicies(): PolicyCatalogEntry[] {
  return [
    {
      id: 'check-header',
      name: 'Check Header',
      category: 'access-control',
      description: 'Enforces that a request has a specified HTTP header',
      supportedSections: ['inbound'],
      parameters: {
        name: { type: 'string', required: true, description: 'Header name' },
        'failed-check-httpcode': { type: 'number', default: 401, description: 'HTTP status code to return on failure' },
        'failed-check-error-message': { type: 'string', description: 'Error message to return' },
        'ignore-case': { type: 'boolean', default: true, description: 'Ignore case when comparing' }
      }
    },
    {
      id: 'validate-jwt',
      name: 'Validate JWT',
      category: 'access-control',
      description: 'Enforces existence and validity of a JWT extracted from either a specified HTTP header or a specified query parameter',
      supportedSections: ['inbound'],
      parameters: {
        'header-name': { type: 'string', description: 'HTTP header name containing the token' },
        'query-parameter-name': { type: 'string', description: 'Query parameter name containing the token' },
        'require-expiration-time': { type: 'boolean', default: true },
        'require-scheme': { type: 'string', default: 'Bearer' },
        'require-signed-tokens': { type: 'boolean', default: true }
      }
    },
    {
      id: 'ip-filter',
      name: 'IP Filter',
      category: 'access-control',
      description: 'Filters (allows/blocks) calls from specific IP addresses and/or address ranges',
      supportedSections: ['inbound'],
      parameters: {
        action: { type: 'string', required: true, enum: ['allow', 'forbid'], description: 'Action to take' },
        'address-range-variable-name': { type: 'string', description: 'Variable name containing IP ranges' }
      }
    },
    {
      id: 'quota-by-key',
      name: 'Quota By Key',
      category: 'access-control',
      description: 'Enforces a renewable or lifetime call volume and/or bandwidth quota per key',
      supportedSections: ['inbound'],
      parameters: {
        'counter-key': { type: 'string', required: true, description: 'Expression to use as quota key' },
        calls: { type: 'number', description: 'Maximum number of calls' },
        bandwidth: { type: 'number', description: 'Maximum bandwidth in kilobytes' },
        'renewal-period': { type: 'number', description: 'Renewal period in seconds' }
      }
    },
    {
      id: 'rate-limit-by-key',
      name: 'Rate Limit By Key',
      category: 'access-control',
      description: 'Prevents API usage spikes by limiting the call rate per key',
      supportedSections: ['inbound'],
      parameters: {
        'counter-key': { type: 'string', required: true, description: 'Expression to use as rate limit key' },
        calls: { type: 'number', required: true, description: 'Maximum number of calls' },
        'renewal-period': { type: 'number', required: true, description: 'Renewal period in seconds' }
      }
    },
    {
      id: 'rate-limit',
      name: 'Rate Limit',
      category: 'access-control',
      description: 'Prevents API usage spikes by limiting the call rate per subscription',
      supportedSections: ['inbound'],
      parameters: {
        calls: { type: 'number', required: true, description: 'Maximum number of calls' },
        'renewal-period': { type: 'number', required: true, description: 'Renewal period in seconds' }
      }
    },
    {
      id: 'quota',
      name: 'Quota',
      category: 'access-control',
      description: 'Enforces a renewable or lifetime call volume and/or bandwidth quota per subscription',
      supportedSections: ['inbound'],
      parameters: {
        calls: { type: 'number', description: 'Maximum number of calls' },
        bandwidth: { type: 'number', description: 'Maximum bandwidth in kilobytes' },
        'renewal-period': { type: 'number', description: 'Renewal period in seconds' }
      }
    }
  ];
}

/**
 * Transformation Policies
 */
function getTransformationPolicies(): PolicyCatalogEntry[] {
  return [
    {
      id: 'set-header',
      name: 'Set Header',
      category: 'transformation',
      description: 'Assigns a value to an existing response and/or request header or adds a new response and/or request header',
      supportedSections: ['inbound', 'outbound', 'backend'],
      parameters: {
        name: { type: 'string', required: true, description: 'Header name' },
        'exists-action': { type: 'string', enum: ['override', 'skip', 'append', 'delete'], default: 'override' }
      }
    },
    {
      id: 'set-query-parameter',
      name: 'Set Query Parameter',
      category: 'transformation',
      description: 'Adds, replaces value of, or deletes request query parameter',
      supportedSections: ['inbound'],
      parameters: {
        name: { type: 'string', required: true, description: 'Query parameter name' },
        'exists-action': { type: 'string', enum: ['override', 'skip', 'append', 'delete'], default: 'override' }
      }
    },
    {
      id: 'set-body',
      name: 'Set Body',
      category: 'transformation',
      description: 'Sets the body for the request and response',
      supportedSections: ['inbound', 'outbound', 'backend'],
      parameters: {}
    },
    {
      id: 'rewrite-uri',
      name: 'Rewrite URI',
      category: 'transformation',
      description: 'Converts a request URL from its public form to the form expected by the web service',
      supportedSections: ['inbound'],
      parameters: {
        template: { type: 'string', description: 'URI template' },
        'copy-unmatched-params': { type: 'boolean', default: true }
      }
    },
    {
      id: 'xml-to-json',
      name: 'XML to JSON',
      category: 'transformation',
      description: 'Converts request or response body from XML to JSON',
      supportedSections: ['inbound', 'outbound'],
      parameters: {
        apply: { type: 'string', enum: ['always', 'content-type-xml'], default: 'always' }
      }
    },
    {
      id: 'json-to-xml',
      name: 'JSON to XML',
      category: 'transformation',
      description: 'Converts request or response body from JSON to XML',
      supportedSections: ['inbound', 'outbound'],
      parameters: {
        apply: { type: 'string', enum: ['always', 'content-type-json'], default: 'always' }
      }
    },
    {
      id: 'find-and-replace',
      name: 'Find and Replace',
      category: 'transformation',
      description: 'Finds a request or response substring and replaces it with another substring',
      supportedSections: ['inbound', 'outbound'],
      parameters: {
        from: { type: 'string', required: true, description: 'Text to find' },
        to: { type: 'string', required: true, description: 'Replacement text' }
      }
    },
    {
      id: 'set-status',
      name: 'Set Status',
      category: 'transformation',
      description: 'Sets HTTP status code to the specified value',
      supportedSections: ['outbound', 'on-error'],
      parameters: {
        code: { type: 'number', required: true, description: 'HTTP status code' },
        reason: { type: 'string', description: 'Status reason phrase' }
      }
    }
  ];
}

/**
 * Backend Policies
 */
function getBackendPolicies(): PolicyCatalogEntry[] {
  return [
    {
      id: 'set-backend-service',
      name: 'Set Backend Service',
      category: 'backend',
      description: 'Changes the backend service for an incoming request',
      supportedSections: ['inbound'],
      parameters: {
        'base-url': { type: 'string', description: 'Base URL of the backend service' },
        'service-url': { type: 'string', description: 'Service URL' },
        'backend-id': { type: 'string', description: 'Backend ID' }
      }
    },
    {
      id: 'send-request',
      name: 'Send Request',
      category: 'backend',
      description: 'Sends the provided request to the specified URL',
      supportedSections: ['inbound', 'outbound', 'backend', 'on-error'],
      parameters: {
        mode: { type: 'string', enum: ['new', 'copy'], default: 'new', description: 'Request mode' },
        'response-variable-name': { type: 'string', description: 'Variable name to store response' },
        timeout: { type: 'number', description: 'Timeout in seconds' },
        'ignore-error': { type: 'boolean', default: false, description: 'Ignore errors' }
      }
    },
    {
      id: 'set-variable',
      name: 'Set Variable',
      category: 'backend',
      description: 'Saves a value in a named context variable for later access',
      supportedSections: ['inbound', 'outbound', 'backend', 'on-error'],
      parameters: {
        name: { type: 'string', required: true, description: 'Variable name' },
        value: { type: 'string', description: 'Variable value' }
      }
    },
    {
      id: 'forward-request',
      name: 'Forward Request',
      category: 'backend',
      description: 'Forwards the request to the backend service',
      supportedSections: ['backend'],
      parameters: {
        timeout: { type: 'number', description: 'Timeout in seconds' }
      }
    },
    {
      id: 'wait',
      name: 'Wait',
      category: 'backend',
      description: 'Waits for enclosed send-request, cache-lookup-value, or choose policies to complete before proceeding',
      supportedSections: ['inbound', 'outbound', 'backend'],
      parameters: {}
    }
  ];
}

/**
 * Observability Policies
 */
function getObservabilityPolicies(): PolicyCatalogEntry[] {
  return [
    {
      id: 'log-to-eventhub',
      name: 'Log to Event Hub',
      category: 'observability',
      description: 'Sends messages in the specified format to an Event Hub defined by a Logger entity',
      supportedSections: ['inbound', 'outbound', 'backend', 'on-error'],
      parameters: {
        'logger-id': { type: 'string', required: true, description: 'Logger ID' },
        'partition-key': { type: 'string', description: 'Partition key expression' }
      }
    },
    {
      id: 'log-to-application-insights',
      name: 'Log to Application Insights',
      category: 'observability',
      description: 'Sends telemetry data to Azure Application Insights',
      supportedSections: ['inbound', 'outbound', 'backend', 'on-error'],
      parameters: {
        'instrumentation-key': { type: 'string', description: 'Instrumentation key' },
        'instrumentation-key-name': { type: 'string', description: 'Named value containing instrumentation key' }
      }
    },
    {
      id: 'trace',
      name: 'Trace',
      category: 'observability',
      description: 'Adds custom traces into the Application Insights telemetry',
      supportedSections: ['inbound', 'outbound', 'backend', 'on-error'],
      parameters: {
        source: { type: 'string', description: 'Trace source' },
        severity: { type: 'string', enum: ['verbose', 'information', 'error'], default: 'information' }
      }
    },
    {
      id: 'emit-metrics',
      name: 'Emit Metrics',
      category: 'observability',
      description: 'Emits custom metrics to Application Insights',
      supportedSections: ['inbound', 'outbound', 'backend', 'on-error'],
      parameters: {
        name: { type: 'string', required: true, description: 'Metric name' },
        value: { type: 'number', required: true, description: 'Metric value' }
      }
    }
  ];
}

/**
 * Caching Policies
 */
function getCachingPolicies(): PolicyCatalogEntry[] {
  return [
    {
      id: 'cache-lookup',
      name: 'Cache Lookup',
      category: 'caching',
      description: 'Perform cache lookup and return a valid cached response when available',
      supportedSections: ['inbound'],
      parameters: {
        'vary-by-developer': { type: 'boolean', default: false },
        'vary-by-developer-groups': { type: 'boolean', default: false },
        'downstream-caching-type': { type: 'string', enum: ['none', 'private', 'public'], default: 'none' }
      }
    },
    {
      id: 'cache-store',
      name: 'Cache Store',
      category: 'caching',
      description: 'Caches response according to the specified cache control configuration',
      supportedSections: ['outbound'],
      parameters: {
        duration: { type: 'number', required: true, description: 'Cache duration in seconds' },
        'vary-by-developer': { type: 'boolean', default: false },
        'vary-by-developer-groups': { type: 'boolean', default: false }
      }
    },
    {
      id: 'cache-remove-value',
      name: 'Cache Remove Value',
      category: 'caching',
      description: 'Removes a cached item by key',
      supportedSections: ['inbound', 'outbound', 'backend'],
      parameters: {
        key: { type: 'string', required: true, description: 'Cache key' }
      }
    },
    {
      id: 'cache-lookup-value',
      name: 'Cache Lookup Value',
      category: 'caching',
      description: 'Performs cache lookup and returns a cached value when available',
      supportedSections: ['inbound', 'outbound', 'backend'],
      parameters: {
        key: { type: 'string', required: true, description: 'Cache key' },
        'variable-name': { type: 'string', required: true, description: 'Variable name to store value' }
      }
    },
    {
      id: 'cache-store-value',
      name: 'Cache Store Value',
      category: 'caching',
      description: 'Cache store by key',
      supportedSections: ['inbound', 'outbound', 'backend'],
      parameters: {
        key: { type: 'string', required: true, description: 'Cache key' },
        value: { type: 'string', required: true, description: 'Value to cache' },
        duration: { type: 'number', description: 'Cache duration in seconds' }
      }
    }
  ];
}

/**
 * Security Policies
 */
function getSecurityPolicies(): PolicyCatalogEntry[] {
  return [
    {
      id: 'validate-jwt',
      name: 'Validate JWT',
      category: 'security',
      description: 'Enforces existence and validity of a JWT',
      supportedSections: ['inbound'],
      parameters: {
        'header-name': { type: 'string', description: 'HTTP header name' },
        'query-parameter-name': { type: 'string', description: 'Query parameter name' },
        'require-expiration-time': { type: 'boolean', default: true },
        'require-scheme': { type: 'string', default: 'Bearer' },
        'require-signed-tokens': { type: 'boolean', default: true }
      }
    },
    {
      id: 'validate-azure-ad-token',
      name: 'Validate Azure AD Token',
      category: 'security',
      description: 'Validates Azure AD bearer token',
      supportedSections: ['inbound'],
      parameters: {
        'tenant-id': { type: 'string', required: true, description: 'Azure AD tenant ID' },
        'audience': { type: 'string', required: true, description: 'Expected audience' }
      }
    },
    {
      id: 'authenticate-basic',
      name: 'Authenticate Basic',
      category: 'security',
      description: 'Authenticate with a backend service using Basic authentication',
      supportedSections: ['inbound'],
      parameters: {
        username: { type: 'string', required: true, description: 'Username' },
        password: { type: 'string', required: true, description: 'Password' }
      }
    },
    {
      id: 'authenticate-certificate',
      name: 'Authenticate Certificate',
      category: 'security',
      description: 'Authenticate with a backend service using a client certificate',
      supportedSections: ['inbound'],
      parameters: {
        thumbprint: { type: 'string', description: 'Certificate thumbprint' },
        'certificate-id': { type: 'string', description: 'Certificate ID' }
      }
    },
    {
      id: 'authenticate-managed-identity',
      name: 'Authenticate Managed Identity',
      category: 'security',
      description: 'Authenticate with a backend service using a managed identity',
      supportedSections: ['inbound'],
      parameters: {
        identity: { type: 'string', description: 'Managed identity' },
        'ignore-error': { type: 'boolean', default: false }
      }
    },
    {
      id: 'cross-domain',
      name: 'Cross Domain',
      category: 'security',
      description: 'Makes the API accessible from Adobe Flash and Microsoft Silverlight browser-based clients',
      supportedSections: ['inbound'],
      parameters: {}
    },
    {
      id: 'cors',
      name: 'CORS',
      category: 'security',
      description: 'Adds cross-origin resource sharing (CORS) support to an operation or an API',
      supportedSections: ['inbound', 'outbound'],
      parameters: {
        'allowed-origins': { type: 'array', description: 'Allowed origins' },
        'allowed-methods': { type: 'array', description: 'Allowed HTTP methods' },
        'allowed-headers': { type: 'array', description: 'Allowed headers' },
        'expose-headers': { type: 'array', description: 'Exposed headers' },
        'allow-credentials': { type: 'boolean', default: false }
      }
    }
  ];
}

/**
 * Advanced Policies
 */
function getAdvancedPolicies(): PolicyCatalogEntry[] {
  return [
    {
      id: 'include-fragment',
      name: 'Include Fragment',
      category: 'advanced',
      description: 'Includes policy statements from a specified policy fragment',
      supportedSections: ['inbound', 'outbound', 'backend', 'on-error'],
      parameters: {
        'fragment-id': { type: 'string', required: true, description: 'Fragment ID' }
      }
    },
    {
      id: 'choose',
      name: 'Choose',
      category: 'advanced',
      description: 'Conditionally applies policy statements based on the evaluation of Boolean expressions',
      supportedSections: ['inbound', 'outbound', 'backend', 'on-error'],
      parameters: {}
    },
    {
      id: 'return-response',
      name: 'Return Response',
      category: 'advanced',
      description: 'Aborts pipeline execution and returns either a default or customized response to the caller',
      supportedSections: ['inbound', 'outbound', 'backend', 'on-error'],
      parameters: {}
    },
    {
      id: 'mock-response',
      name: 'Mock Response',
      category: 'advanced',
      description: 'Aborts pipeline execution and returns a mocked response directly to the caller',
      supportedSections: ['inbound'],
      parameters: {
        'status-code': { type: 'number', required: true, description: 'HTTP status code' }
      }
    }
  ];
}

/**
 * AI Gateway Policies
 */
function getAiGatewayPolicies(): PolicyCatalogEntry[] {
  return [
    {
      id: 'ai-gateway-token-limit',
      name: 'AI Gateway Token Limit',
      category: 'ai-gateway',
      description: 'Enforces token limits for AI Gateway requests',
      supportedSections: ['inbound'],
      parameters: {
        'max-tokens': { type: 'number', required: true, description: 'Maximum tokens allowed' },
        'token-count-variable': { type: 'string', description: 'Variable name to store token count' }
      }
    },
    {
      id: 'ai-gateway-content-safety',
      name: 'AI Gateway Content Safety',
      category: 'ai-gateway',
      description: 'Validates content safety for AI Gateway requests',
      supportedSections: ['inbound'],
      parameters: {
        'safety-level': { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium', description: 'Content safety level' }
      }
    },
    {
      id: 'ai-gateway-semantic-cache',
      name: 'AI Gateway Semantic Cache',
      category: 'ai-gateway',
      description: 'Enables semantic caching for AI Gateway requests',
      supportedSections: ['inbound', 'backend'],
      parameters: {
        'cache-key': { type: 'string', description: 'Cache key for semantic matching' },
        'ttl': { type: 'number', description: 'Time to live in seconds' }
      }
    }
  ];
}

