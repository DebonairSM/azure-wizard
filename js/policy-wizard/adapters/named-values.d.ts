/**
 * Named Values Adapter Interface
 * For fetching APIM named values
 */
import { NamedValueInfo } from '../types.js';
/**
 * Named values adapter interface
 */
export interface NamedValuesAdapter {
    /**
     * Get all named values
     */
    getAllNamedValues(): Promise<NamedValueInfo[]>;
    /**
     * Get named value by name
     */
    getNamedValue(name: string): Promise<NamedValueInfo | null>;
    /**
     * Check if named value exists
     */
    namedValueExists(name: string): Promise<boolean>;
}
/**
 * Default named values adapter implementation
 * This is a placeholder - actual implementation should call APIM REST API or database
 */
export declare class DefaultNamedValuesAdapter implements NamedValuesAdapter {
    getAllNamedValues(): Promise<NamedValueInfo[]>;
    getNamedValue(name: string): Promise<NamedValueInfo | null>;
    namedValueExists(name: string): Promise<boolean>;
}
//# sourceMappingURL=named-values.d.ts.map