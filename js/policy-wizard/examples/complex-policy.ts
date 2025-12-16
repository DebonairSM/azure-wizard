/**
 * Example 6: Complex Multi-Section Policy
 * Demonstrates a comprehensive policy with multiple sections, policies, fragments, and custom blocks
 */

import { PolicyWizard } from '../policy-wizard.js';
import {
  PolicyModel,
  CatalogPolicyItem,
  FragmentPolicyItem,
  CustomXmlPolicyItem,
  NamedValueReference,
  SendRequestConfiguration
} from '../types.js';

export function createComplexPolicy(): PolicyModel {
  const backendUrl: NamedValueReference = {
    type: 'named-value',
    name: 'backend-service-url'
  };

  const apiKey: NamedValueReference = {
    type: 'named-value',
    name: 'backend-api-key',
    keyVault: true
  };

  const validationFunctionConfig: SendRequestConfiguration = {
    url: 'https://validation.azurewebsites.net/api/validate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: '@(context.Request.Body.As<string>())',
    timeout: 10,
    ignoreErrors: false,
    responseVariableName: 'validationResult'
  };

  const model: PolicyModel = {
    scope: 'operation',
    apiId: 'payment-api',
    operationId: 'process-payment',
    metadata: {
      name: 'Payment Processing Policy',
      description: 'Comprehensive policy for payment processing with validation, rate limiting, and logging',
      version: '1.0.0'
    },
    sections: {
      inbound: {
        includeBase: true,
        items: [
          {
            type: 'fragment',
            fragmentId: 'common-cors-fragment',
            order: 1
          } as FragmentPolicyItem,
          {
            type: 'catalog',
            policyId: 'validate-jwt',
            order: 2,
            configuration: {
              'header-name': 'Authorization',
              'require-scheme': 'Bearer',
              'require-expiration-time': true,
              'require-signed-tokens': true
            }
          } as CatalogPolicyItem,
          {
            type: 'catalog',
            policyId: 'rate-limit-by-key',
            order: 3,
            configuration: {
              calls: 10,
              'renewal-period': 60,
              'counter-key': '@(context.Request.IpAddress)'
            }
          } as CatalogPolicyItem,
          {
            type: 'catalog',
            policyId: 'set-variable',
            order: 4,
            configuration: {
              name: 'requestId',
              value: '@(Guid.NewGuid().ToString())'
            }
          } as CatalogPolicyItem,
          {
            type: 'catalog',
            policyId: 'send-request',
            order: 5,
            configuration: validationFunctionConfig
          } as CatalogPolicyItem,
          {
            type: 'custom-xml',
            xml: '<choose>\n  <when condition="@(((IResponse)context.Variables["validationResult"]).StatusCode != 200)">\n    <return-response>\n      <set-status code="400" reason="Validation failed" />\n      <set-body>@(((IResponse)context.Variables["validationResult"]).Body.As<string>())</set-body>\n    </return-response>\n  </when>\n</choose>',
            order: 6
          } as CustomXmlPolicyItem,
          {
            type: 'catalog',
            policyId: 'set-backend-service',
            order: 7,
            configuration: {},
            attributes: {
              'base-url': backendUrl
            }
          } as CatalogPolicyItem
        ]
      },
      backend: {
        includeBase: true,
        items: [
          {
            type: 'catalog',
            policyId: 'set-header',
            order: 1,
            configuration: {
              name: 'x-api-key',
              existsAction: 'override'
            },
            attributes: {
              value: apiKey
            }
          } as CatalogPolicyItem,
          {
            type: 'catalog',
            policyId: 'set-header',
            order: 2,
            configuration: {
              name: 'x-request-id',
              existsAction: 'override'
            },
            attributes: {
              value: '@(context.Variables["requestId"])'
            }
          } as CatalogPolicyItem
        ]
      },
      outbound: {
        includeBase: true,
        items: [
          {
            type: 'fragment',
            fragmentId: 'response-logging-fragment',
            order: 1
          } as FragmentPolicyItem,
          {
            type: 'catalog',
            policyId: 'set-header',
            order: 2,
            configuration: {
              name: 'X-Request-ID',
              existsAction: 'override'
            },
            attributes: {
              value: '@(context.Variables["requestId"])'
            }
          } as CatalogPolicyItem,
          {
            type: 'catalog',
            policyId: 'trace',
            order: 3,
            configuration: {
              source: 'payment-api',
              severity: 'information'
            }
          } as CatalogPolicyItem
        ]
      },
      onError: {
        includeBase: true,
        items: [
          {
            type: 'catalog',
            policyId: 'set-status',
            order: 1,
            configuration: {
              code: 500,
              reason: 'Internal Server Error'
            }
          } as CatalogPolicyItem,
          {
            type: 'catalog',
            policyId: 'set-body',
            order: 2,
            configuration: {}
          } as CatalogPolicyItem,
          {
            type: 'custom-xml',
            xml: '<trace>\n  <metadata name="error" value="@(context.LastError.Message)" />\n  <metadata name="request-id" value="@(context.Variables["requestId"])" />\n</trace>',
            order: 3
          } as CustomXmlPolicyItem
        ]
      }
    }
  };

  return model;
}

export function exampleUsage() {
  const model = createComplexPolicy();
  const validation = PolicyWizard.validate(model);
  const xml = PolicyWizard.toXml(model);

  console.log('Complex Policy:');
  console.log(xml);
  console.log('\nValidation:');
  console.log('Valid:', validation.valid);
  console.log('Errors:', validation.errors.length);
  console.log('Warnings:', validation.warnings.length);

  return { model, validation, xml };
}

