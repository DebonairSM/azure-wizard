/**
 * Example 2: Policy with Named Values
 * Demonstrates using APIM named values in policies
 */
import { PolicyWizard } from '../policy-wizard.js';
export function createPolicyWithNamedValues() {
    const apiKeyNamedValue = {
        type: 'named-value',
        name: 'backend-api-key',
        keyVault: false
    };
    const backendUrlNamedValue = {
        type: 'named-value',
        name: 'backend-service-url',
        keyVault: false
    };
    const model = {
        scope: 'api',
        apiId: 'my-api',
        sections: {
            inbound: {
                includeBase: true,
                items: [
                    {
                        type: 'catalog',
                        policyId: 'set-backend-service',
                        order: 1,
                        configuration: {},
                        attributes: {
                            'base-url': backendUrlNamedValue
                        }
                    },
                    {
                        type: 'catalog',
                        policyId: 'set-header',
                        order: 2,
                        configuration: {
                            name: 'x-api-key',
                            existsAction: 'override'
                        },
                        attributes: {
                            value: apiKeyNamedValue
                        }
                    }
                ]
            }
        }
    };
    return model;
}
export function exampleUsage() {
    const model = createPolicyWithNamedValues();
    const validation = PolicyWizard.validate(model);
    const xml = PolicyWizard.toXml(model);
    console.log('Policy with Named Values:');
    console.log(xml);
    return { model, validation, xml };
}
//# sourceMappingURL=named-values.js.map