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
export declare class DefaultFragmentsAdapter implements FragmentsAdapter {
    getAllFragments(): Promise<PolicyFragmentInfo[]>;
    getFragment(fragmentId: string): Promise<PolicyFragmentInfo | null>;
    fragmentExists(fragmentId: string): Promise<boolean>;
}
//# sourceMappingURL=fragments.d.ts.map