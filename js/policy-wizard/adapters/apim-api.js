/**
 * APIM REST API Adapter Interface
 * For interacting with Azure API Management REST API
 */
/**
 * Default APIM API adapter implementation
 * This is a placeholder - actual implementation should call APIM REST API
 */
export class DefaultApimApiAdapter {
    constructor(baseUrl, subscriptionKey, accessToken) {
        this.baseUrl = baseUrl;
        this.subscriptionKey = subscriptionKey;
        this.accessToken = accessToken;
    }
    async getPolicy(scope, apiId, operationId) {
        // TODO: Implement actual APIM REST API call
        // Example endpoint structure:
        // Global: GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{serviceName}/policies/policy
        // API: GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{serviceName}/apis/{apiId}/policies/policy
        // Operation: GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{serviceName}/apis/{apiId}/operations/{operationId}/policies/policy
        // For now, return null
        return null;
    }
    async setPolicy(scope, apiId, operationId, xml) {
        // TODO: Implement actual APIM REST API call
        // PUT to the same endpoints as getPolicy
        throw new Error('Not implemented');
    }
    async deletePolicy(scope, apiId, operationId) {
        // TODO: Implement actual APIM REST API call
        // DELETE to the same endpoints as getPolicy
        throw new Error('Not implemented');
    }
}
//# sourceMappingURL=apim-api.js.map