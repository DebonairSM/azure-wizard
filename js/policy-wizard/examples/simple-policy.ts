/**
 * Example 1: Simple Policy
 * Demonstrates creating a basic policy with catalog items
 */

import { PolicyWizard } from '../policy-wizard.js';
import { PolicyModel, CatalogPolicyItem } from '../types.js';

export function createSimplePolicy(): PolicyModel {
  const model: PolicyModel = {
    scope: 'api',
    apiId: 'my-api',
    sections: {
      inbound: {
        includeBase: true,
        items: [
          {
            type: 'catalog',
            policyId: 'rate-limit',
            order: 1,
            configuration: {
              calls: 100,
              'renewal-period': 60
            }
          } as CatalogPolicyItem,
          {
            type: 'catalog',
            policyId: 'check-header',
            order: 2,
            configuration: {
              name: 'x-api-key',
              'failed-check-httpcode': 401,
              'failed-check-error-message': 'API key is required'
            }
          } as CatalogPolicyItem
        ]
      },
      outbound: {
        includeBase: true,
        items: [
          {
            type: 'catalog',
            policyId: 'set-header',
            order: 1,
            configuration: {
              name: 'X-Response-Time',
              existsAction: 'override'
            }
          } as CatalogPolicyItem
        ]
      }
    }
  };

  return model;
}

export function exampleUsage() {
  // Create the policy model
  const model = createSimplePolicy();

  // Validate it
  const validation = PolicyWizard.validate(model);
  console.log('Validation result:', validation);

  // Generate XML
  const xml = PolicyWizard.toXml(model);
  console.log('Generated XML:');
  console.log(xml);

  return { model, validation, xml };
}

