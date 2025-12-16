/**
 * Policy Fragments Adapter Interface
 * For fetching APIM policy fragments
 */
/**
 * Default fragments adapter implementation
 * This is a placeholder - actual implementation should call APIM REST API or database
 */
export class DefaultFragmentsAdapter {
    async getAllFragments() {
        // TODO: Implement actual API call
        // GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{serviceName}/policyFragments
        return [];
    }
    async getFragment(fragmentId) {
        // TODO: Implement actual API call
        // GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{serviceName}/policyFragments/{fragmentId}
        return null;
    }
    async fragmentExists(fragmentId) {
        const fragment = await this.getFragment(fragmentId);
        return fragment !== null;
    }
}
//# sourceMappingURL=fragments.js.map