/**
 * Example 5: Policy with Custom XML
 * Demonstrates adding custom XML blocks and expressions
 */

import { PolicyWizard } from '../policy-wizard.js';
import { PolicyModel, CustomXmlPolicyItem, CustomExpressionItem, CatalogPolicyItem } from '../types.js';

export function createPolicyWithCustomXml(): PolicyModel {
  const model: PolicyModel = {
    scope: 'api',
    apiId: 'my-api',
    sections: {
      inbound: {
        includeBase: true,
        items: [
          {
            type: 'catalog',
            policyId: 'set-variable',
            order: 1,
            configuration: {
              name: 'correlationId',
              value: '@(Guid.NewGuid().ToString())'
            }
          } as CatalogPolicyItem,
          {
            type: 'custom-xml',
            xml: '<choose>\n  <when condition="@(context.Request.Headers.GetValueOrDefault("X-Skip-Validation", "false").ToLower() == "true")">\n    <set-variable name="skipValidation" value="true" />\n  </when>\n  <otherwise>\n    <set-variable name="skipValidation" value="false" />\n  </otherwise>\n</choose>',
            order: 2
          } as CustomXmlPolicyItem,
          {
            type: 'expression',
            expression: 'context.Request.Headers.GetValueOrDefault("X-Correlation-Id", context.Variables["correlationId"])',
            context: 'attribute',
            targetElement: 'set-header',
            targetAttribute: 'value',
            order: 3
          } as CustomExpressionItem
        ]
      },
      outbound: {
        includeBase: true,
        items: [
          {
            type: 'custom-xml',
            xml: '<set-header name="X-Request-ID" exists-action="override">\n  <value>@(context.Variables["correlationId"])</value>\n</set-header>',
            order: 1
          } as CustomXmlPolicyItem,
          {
            type: 'custom-xml',
            xml: '<trace>\n  <metadata name="response-time" value="@(context.Elapsed.TotalMilliseconds)" />\n  <metadata name="status-code" value="@(context.Response.StatusCode)" />\n</trace>',
            order: 2
          } as CustomXmlPolicyItem
        ]
      }
    }
  };

  return model;
}

export function exampleUsage() {
  const model = createPolicyWithCustomXml();
  const validation = PolicyWizard.validate(model);
  const xml = PolicyWizard.toXml(model);

  console.log('Policy with Custom XML:');
  console.log(xml);

  return { model, validation, xml };
}

