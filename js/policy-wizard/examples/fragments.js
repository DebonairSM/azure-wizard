/**
 * Example 3: Policy with Fragments
 * Demonstrates including policy fragments
 */
import { PolicyWizard } from '../policy-wizard.js';
export function createPolicyWithFragments() {
    const model = {
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
                    },
                    {
                        type: 'catalog',
                        policyId: 'rate-limit',
                        order: 2,
                        configuration: {
                            calls: 100,
                            'renewal-period': 60
                        }
                    },
                    {
                        type: 'fragment',
                        fragmentId: 'logging-fragment',
                        order: 3
                    }
                ]
            },
            outbound: {
                includeBase: true,
                items: [
                    {
                        type: 'fragment',
                        fragmentId: 'response-transformation-fragment',
                        order: 1
                    }
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
//# sourceMappingURL=fragments.js.map