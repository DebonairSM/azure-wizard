/**
 * Policy Detection Module
 * Detects existing policies from database and APIM REST API
 */
import { PolicyDetectionResult, PolicyScope } from './types.js';
import { ApimApiAdapter } from './adapters/apim-api.js';
import { DatabaseAdapter } from './adapters/database.js';
/**
 * Detect existing policy for a given scope
 */
export declare function detectPolicy(scope: PolicyScope, apiId?: string, operationId?: string, apimAdapter?: ApimApiAdapter, dbAdapter?: DatabaseAdapter): Promise<PolicyDetectionResult>;
/**
 * Default database adapter implementation
 * This is a placeholder - actual implementation should connect to the database
 */
export declare class DefaultDatabaseAdapter implements DatabaseAdapter {
    getPolicy(scope: PolicyScope, apiId?: string, operationId?: string): Promise<string | null>;
    savePolicy(scope: PolicyScope, apiId: string | undefined, operationId: string | undefined, xml: string): Promise<void>;
}
//# sourceMappingURL=policy-detector.d.ts.map