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
export class DefaultNamedValuesAdapter implements NamedValuesAdapter {
  async getAllNamedValues(): Promise<NamedValueInfo[]> {
    // TODO: Implement actual API call
    // GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{serviceName}/namedValues
    return [];
  }

  async getNamedValue(name: string): Promise<NamedValueInfo | null> {
    // TODO: Implement actual API call
    // GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{serviceName}/namedValues/{namedValueId}
    return null;
  }

  async namedValueExists(name: string): Promise<boolean> {
    const namedValue = await this.getNamedValue(name);
    return namedValue !== null;
  }
}

