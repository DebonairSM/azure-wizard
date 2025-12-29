import { Node } from '../../shared/models/Node.js';

/**
 * Base interface for all wizards
 */
export interface IWizard {
  /** Unique identifier for the wizard */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Description of what this wizard does */
  description: string;
  
  /** Get the root node(s) for this wizard */
  getRootNodes(): Promise<Node[]>;
  
  /** Get child nodes for a given node */
  getNodeChildren(nodeId: string): Promise<Node[]>;
  
  /** Get detailed data for a specific node */
  getNodeData(nodeId: string): Promise<any>;
  
  /** Load/initialize wizard data into database */
  loadData(): Promise<void>;
  
  /** Optional: Define additional schema for this wizard */
  getSchemaAdditions?(): string;
}








