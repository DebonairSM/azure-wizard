/**
 * Example 1: Simple Policy
 * Demonstrates creating a basic policy with catalog items
 */
import { PolicyWizard } from '../policy-wizard.js';
export function createSimplePolicy() {
    const model = {
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
                    },
                    {
                        type: 'catalog',
                        policyId: 'check-header',
                        order: 2,
                        configuration: {
                            name: 'x-api-key',
                            'failed-check-httpcode': 401,
                            'failed-check-error-message': 'API key is required'
                        }
                    }
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
                    }
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
//# sourceMappingURL=simple-policy.js.map