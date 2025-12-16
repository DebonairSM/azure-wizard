/**
 * Example 4: Policy with Send-Request
 * Demonstrates configuring send-request policies for Azure Functions and Logic Apps
 */
import { PolicyWizard } from '../policy-wizard.js';
export function createPolicyWithSendRequest() {
    // Azure Function call
    const azureFunctionConfig = {
        url: 'https://myfunctionapp.azurewebsites.net/api/validate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-functions-key': {
                type: 'named-value',
                name: 'function-app-key'
            }
        },
        body: '@(context.Request.Body.As<string>())',
        timeout: 30,
        ignoreErrors: false,
        responseVariableName: 'validationResponse'
    };
    // Logic App call
    const logicAppConfig = {
        url: {
            type: 'named-value',
            name: 'logic-app-webhook-url'
        },
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            apiId: '@(context.Api.Id)',
            operationId: '@(context.Operation.Id)',
            requestBody: '@(context.Request.Body.As<string>())'
        }),
        timeout: 60,
        ignoreErrors: true,
        responseVariableName: 'logicAppResponse'
    };
    const model = {
        scope: 'operation',
        apiId: 'my-api',
        operationId: 'post-data',
        sections: {
            inbound: {
                includeBase: true,
                items: [
                    {
                        type: 'catalog',
                        policyId: 'send-request',
                        order: 1,
                        configuration: azureFunctionConfig
                    },
                    {
                        type: 'catalog',
                        policyId: 'set-variable',
                        order: 2,
                        configuration: {
                            name: 'isValid',
                            value: '@(((IResponse)context.Variables["validationResponse"]).Body.As<JObject>()["valid"].ToObject<bool>())'
                        }
                    }
                ]
            },
            backend: {
                includeBase: true,
                items: [
                    {
                        type: 'catalog',
                        policyId: 'send-request',
                        order: 1,
                        configuration: logicAppConfig
                    }
                ]
            }
        }
    };
    return model;
}
export function exampleUsage() {
    const model = createPolicyWithSendRequest();
    const validation = PolicyWizard.validate(model);
    const xml = PolicyWizard.toXml(model);
    console.log('Policy with Send-Request:');
    console.log(xml);
    return { model, validation, xml };
}
//# sourceMappingURL=send-request.js.map