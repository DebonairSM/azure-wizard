/**
 * APIM REST API Adapter Interface
 * For interacting with Azure API Management REST API
 */
import { PolicyScope } from '../types.js';
/**
 * APIM API adapter interface
 */
export interface ApimApiAdapter {
    /**
     * Get policy XML from APIM REST API
     */
    getPolicy(scope: PolicyScope, apiId?: string, operationId?: string): Promise<string | null>;
    /**
     * Set policy XML via APIM REST API
     */
    setPolicy(scope: PolicyScope, apiId: string | undefined, operationId: string | undefined, xml: string): Promise<void>;
    /**
     * Delete policy via APIM REST API
     */
    deletePolicy(scope: PolicyScope, apiId: string | undefined, operationId: string | undefined): Promise<void>;
}
/**
 * Default APIM API adapter implementation
 * This is a placeholder - actual implementation should call APIM REST API
 */
export declare class DefaultApimApiAdapter implements ApimApiAdapter {
    private baseUrl;
    private subscriptionKey?;
    private accessToken?;
    constructor(baseUrl: string, subscriptionKey?: string, accessToken?: string);
    getPolicy(scope: PolicyScope, apiId?: string, operationId?: string): Promise<string | null>;
    setPolicy(scope: PolicyScope, apiId: string | undefined, operationId: string | undefined, xml: string): Promise<void>;
    deletePolicy(scope: PolicyScope, apiId: string | undefined, operationId: string | undefined): Promise<void>;
}
//# sourceMappingURL=apim-api.d.ts.map