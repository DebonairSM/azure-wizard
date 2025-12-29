export interface Node {
  id: string;
  wizardId: string;
  parentId?: string;
  name: string;
  description?: string;
  nodeType?: string;
  displayOrder?: number;
  data?: any; // JSON data
  createdAt?: string;
  children?: Node[]; // For tree structure
}








