/**
 * Example 3: Policy with Fragments
 * Demonstrates including policy fragments
 */

import { PolicyWizard } from '../policy-wizard.js';
import { PolicyModel, FragmentPolicyItem, CatalogPolicyItem } from '../types.js';

export function createPolicyWithFragments(): PolicyModel {
  const model: PolicyModel = {
    scope: 'api',
    apiId: 'my-api',
    sections: {
      inbound: {
        includeBase: true,
        items: [
          {
            type: 'fragment',
            fragmentId: 'common-auth-fragment',
            order: 1
          } as FragmentPolicyItem,
          {
            type: 'catalog',
            policyId: 'rate-limit',
            order: 2,
            configuration: {
              calls: 100,
              'renewal-period': 60
            }
          } as CatalogPolicyItem,
          {
            type: 'fragment',
            fragmentId: 'logging-fragment',
            order: 3
          } as FragmentPolicyItem
        ]
      },
      outbound: {
        includeBase: true,
        items: [
          {
            type: 'fragment',
            fragmentId: 'response-transformation-fragment',
            order: 1
          } as FragmentPolicyItem
        ]
      }
    }
  };

  return model;
}

export function exampleUsage() {
  const model = createPolicyWithFragments();
  const validation = PolicyWizard.validate(model);
  const xml = PolicyWizard.toXml(model);

  console.log('Policy with Fragments:');
  console.log(xml);

  return { model, validation, xml };
}

