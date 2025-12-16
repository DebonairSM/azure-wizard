/**
 * XML Generator for APIM Policy Wizard
 * Converts PolicyModel to valid APIM policy XML
 */
import { PolicyModel } from './types.js';
/**
 * Convert PolicyModel to APIM policy XML
 */
export declare function toXml(policyModel: PolicyModel): string;
/**
 * Escape XML special characters
 */
export declare function escapeXml(str: string): string;
/**
 * Unescape XML special characters
 */
export declare function unescapeXml(str: string): string;
//# sourceMappingURL=xml-generator.d.ts.map