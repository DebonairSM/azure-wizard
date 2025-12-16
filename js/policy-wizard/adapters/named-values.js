/**
 * Named Values Adapter Interface
 * For fetching APIM named values
 */
/**
 * Default named values adapter implementation
 * This is a placeholder - actual implementation should call APIM REST API or database
 */
export class DefaultNamedValuesAdapter {
    async getAllNamedValues() {
        // TODO: Implement actual API call
        // GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{serviceName}/namedValues
        return [];
    }
    async getNamedValue(name) {
        // TODO: Implement actual API call
        // GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{serviceName}/namedValues/{namedValueId}
        return null;
    }
    async namedValueExists(name) {
        const namedValue = await this.getNamedValue(name);
        return namedValue !== null;
    }
}
//# sourceMappingURL=named-values.js.map