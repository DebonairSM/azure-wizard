/**
 * APIM Policy Catalog
 * Comprehensive catalog of APIM policies grouped by category
 */
import { PolicyCatalogEntry, PolicyCategory } from './types.js';
/**
 * Get all policy catalog entries
 */
export declare function getAllPolicies(): PolicyCatalogEntry[];
/**
 * Get policies by category
 */
export declare function getPoliciesByCategory(category: PolicyCategory): PolicyCatalogEntry[];
/**
 * Get policy by ID
 */
export declare function getPolicyById(id: string): PolicyCatalogEntry | undefined;
//# sourceMappingURL=policy-catalog.d.ts.map