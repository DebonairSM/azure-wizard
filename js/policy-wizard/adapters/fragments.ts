/**
 * Policy Fragments Adapter Interface
 * For fetching APIM policy fragments
 */

import { PolicyFragmentInfo } from '../types.js';

/**
 * Policy fragments adapter interface
 */
export interface FragmentsAdapter {
  /**
   * Get all policy fragments
   */
  getAllFragments(): Promise<PolicyFragmentInfo[]>;

  /**
   * Get policy fragment by ID
   */
  getFragment(fragmentId: string): Promise<PolicyFragmentInfo | null>;

  /**
   * Check if fragment exists
   */
  fragmentExists(fragmentId: string): Promise<boolean>;
}

/**
 * Default fragments adapter implementation
 * This is a placeholder - actual implementation should call APIM REST API or database
 */
export class DefaultFragmentsAdapter implements FragmentsAdapter {
  async getAllFragments(): Promise<PolicyFragmentInfo[]> {
    // TODO: Implement actual API call
    // GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{serviceName}/policyFragments
    return [];
  }

  async getFragment(fragmentId: string): Promise<PolicyFragmentInfo | null> {
    // TODO: Implement actual API call
    // GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{serviceName}/policyFragments/{fragmentId}
    return null;
  }

  async fragmentExists(fragmentId: string): Promise<boolean> {
    const fragment = await this.getFragment(fragmentId);
    return fragment !== null;
  }
}

