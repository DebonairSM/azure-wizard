/**
 * XML Parser for APIM Policy Wizard
 * Parses existing APIM policy XML into PolicyModel
 */
import { PolicyModel } from './types.js';
/**
 * Parse APIM policy XML into PolicyModel
 * Uses xml2js for robust XML parsing
 */
export declare function fromXml(xml: string): Promise<PolicyModel>;
//# sourceMappingURL=xml-parser.d.ts.map