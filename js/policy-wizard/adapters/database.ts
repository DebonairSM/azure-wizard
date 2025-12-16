/**
 * Database Adapter Interface
 * For querying policy configurations from local database
 */

import { PolicyScope } from '../types.js';

/**
 * Database adapter interface
 */
export interface DatabaseAdapter {
  /**
   * Get policy XML from database
   */
  getPolicy(scope: PolicyScope, apiId?: string, operationId?: string): Promise<string | null>;

  /**
   * Save policy XML to database
   */
  savePolicy(scope: PolicyScope, apiId: string | undefined, operationId: string | undefined, xml: string): Promise<void>;
}

