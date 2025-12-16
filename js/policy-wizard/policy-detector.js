/**
 * Policy Detection Module
 * Detects existing policies from database and APIM REST API
 */
import { fromXml } from './xml-parser.js';
/**
 * Detect existing policy for a given scope
 */
export async function detectPolicy(scope, apiId, operationId, apimAdapter, dbAdapter) {
    const result = {
        exists: false,
        source: 'database'
    };
    let dbPolicyXml = null;
    let apimPolicyXml = null;
    // Check database first
    if (dbAdapter) {
        try {
            dbPolicyXml = await dbAdapter.getPolicy(scope, apiId, operationId);
            if (dbPolicyXml) {
                result.exists = true;
                result.policyXml = dbPolicyXml;
                result.source = 'database';
                // Try to parse into PolicyModel
                try {
                    result.policyModel = await fromXml(dbPolicyXml);
                }
                catch (parseError) {
                    // Parsing failed, but we still have the XML
                    console.warn('Failed to parse policy from database:', parseError);
                }
            }
        }
        catch (error) {
            console.warn('Error checking database for policy:', error);
        }
    }
    // Check APIM REST API
    if (apimAdapter) {
        try {
            apimPolicyXml = await apimAdapter.getPolicy(scope, apiId, operationId);
            if (apimPolicyXml) {
                result.exists = true;
                if (result.policyXml && result.policyXml !== apimPolicyXml) {
                    // Both sources have policies, but they differ
                    result.source = 'both';
                    // Prefer APIM API version if different
                    result.policyXml = apimPolicyXml;
                }
                else if (!result.policyXml) {
                    // Only APIM API has the policy
                    result.policyXml = apimPolicyXml;
                    result.source = 'apim-api';
                }
                else {
                    // Same policy in both
                    result.source = 'both';
                }
                // Try to parse into PolicyModel if not already parsed
                if (!result.policyModel) {
                    try {
                        result.policyModel = await fromXml(apimPolicyXml);
                    }
                    catch (parseError) {
                        console.warn('Failed to parse policy from APIM API:', parseError);
                    }
                }
            }
        }
        catch (error) {
            console.warn('Error checking APIM API for policy:', error);
        }
    }
    return result;
}
/**
 * Default database adapter implementation
 * This is a placeholder - actual implementation should connect to the database
 */
export class DefaultDatabaseAdapter {
    async getPolicy(scope, apiId, operationId) {
        // TODO: Implement actual database query
        // This would query the apimPolicyConfigurations table
        // For now, return null
        return null;
    }
    async savePolicy(scope, apiId, operationId, xml) {
        // TODO: Implement actual database save
        throw new Error('Not implemented');
    }
}
//# sourceMappingURL=policy-detector.js.map