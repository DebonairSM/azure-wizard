import { TreeView } from './components/TreeView.js';
import { NodeDetails } from './components/NodeDetails.js';

interface Wizard {
  id: string;
  name: string;
  description: string;
}

interface Node {
  id: string;
  wizardId: string;
  parentId?: string;
  name: string;
  description?: string;
  nodeType?: string;
  displayOrder?: number;
  data?: any;
  children?: Node[];
}

class App {
  private currentWizardId: string | null = null;
  private treeView: TreeView;
  private nodeDetails: NodeDetails;
  private wizardSelect: HTMLSelectElement;
  private breadcrumbs: HTMLElement;
  private breadcrumbPath: Array<{ nodeId: string; name: string }> = [];

  constructor() {
    this.treeView = new TreeView(this.handleNodeClick.bind(this));
    this.nodeDetails = new NodeDetails();
    this.wizardSelect = document.getElementById('wizardSelect') as HTMLSelectElement;
    this.breadcrumbs = document.getElementById('breadcrumbs') as HTMLElement;

    this.init();
  }

  private async init(): Promise<void> {
    this.wizardSelect.addEventListener('change', this.handleWizardChange.bind(this));

    const wizards = await this.loadWizards();

    // Auto-select the first wizard so the UI shows data immediately
    if (wizards.length > 0) {
      this.wizardSelect.value = wizards[0].id;
      await this.handleWizardChange();
    }
  }

  private async loadWizards(): Promise<Wizard[]> {
    try {
      const response = await fetch('/api/wizards');
      const wizards: Wizard[] = await response.json();

      this.wizardSelect.innerHTML = '<option value="">Select a wizard...</option>';
      wizards.forEach(wizard => {
        const option = document.createElement('option');
        option.value = wizard.id;
        option.textContent = wizard.name;
        this.wizardSelect.appendChild(option);
      });

      return wizards;
    } catch (error) {
      console.error('Error loading wizards:', error);
      this.wizardSelect.innerHTML = '<option value="">Error loading wizards</option>';
      return [];
    }
  }

  private async handleWizardChange(): Promise<void> {
    const wizardId = this.wizardSelect.value;
    if (!wizardId) {
      this.currentWizardId = null;
      this.treeView.clear();
      this.nodeDetails.clear();
      this.updateBreadcrumbs([]);
      return;
    }

    this.currentWizardId = wizardId;
    await this.loadWizardTree();
  }

  private async loadWizardTree(): Promise<void> {
    if (!this.currentWizardId) return;

    try {
      const response = await fetch(`/api/wizards/${this.currentWizardId}/nodes`);
      const rootNodes: Node[] = await response.json();

      this.treeView.setRootNodes(rootNodes, this.currentWizardId);
      this.updateBreadcrumbs([]);

      // Show something immediately: select + expand the first root node
      if (rootNodes.length > 0) {
        const first = rootNodes[0];
        await this.handleNodeClick(first.id, first.name);
        await this.treeView.expandNode(first.id, this.currentWizardId);
      } else {
        this.nodeDetails.clear();
      }
    } catch (error) {
      console.error('Error loading wizard tree:', error);
      this.nodeDetails.showError('Failed to load wizard tree');
    }
  }

  private async handleNodeClick(nodeId: string, nodeName: string): Promise<void> {
    if (!this.currentWizardId) return;

    try {
      // Load node details
      const nodeResponse = await fetch(`/api/wizards/${this.currentWizardId}/nodes/${nodeId}`);
      const nodeData = await nodeResponse.json();

      // Load children
      const childrenResponse = await fetch(`/api/wizards/${this.currentWizardId}/nodes/${nodeId}/children`);
      const children: Node[] = await childrenResponse.json();

      // Update tree view
      this.treeView.updateNodeChildren(nodeId, children);

      // Update node details
      this.nodeDetails.displayNode(nodeData, children);

      // Update breadcrumbs
      this.updateBreadcrumbPath(nodeId, nodeName);
    } catch (error) {
      console.error('Error loading node:', error);
      this.nodeDetails.showError('Failed to load node details');
    }
  }

  private updateBreadcrumbPath(nodeId: string, nodeName: string): void {
    // Find if this node is already in the path
    const existingIndex = this.breadcrumbPath.findIndex(b => b.nodeId === nodeId);
    
    if (existingIndex >= 0) {
      // Truncate to this point
      this.breadcrumbPath = this.breadcrumbPath.slice(0, existingIndex + 1);
    } else {
      // Add to path
      this.breadcrumbPath.push({ nodeId, name: nodeName });
    }

    this.updateBreadcrumbs(this.breadcrumbPath);
  }

  private updateBreadcrumbs(path: Array<{ nodeId: string; name: string }>): void {
    this.breadcrumbs.innerHTML = '';

    if (path.length === 0) {
      return;
    }

    path.forEach((crumb, index) => {
      const span = document.createElement('span');
      span.className = 'breadcrumb-item';
      if (index < path.length - 1) {
        span.style.cursor = 'pointer';
        span.style.textDecoration = 'underline';
        span.addEventListener('click', () => {
          this.handleBreadcrumbClick(crumb.nodeId);
        });
      }
      span.textContent = crumb.name;

      this.breadcrumbs.appendChild(span);

      if (index < path.length - 1) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = ' > ';
        this.breadcrumbs.appendChild(separator);
      }
    });
  }

  private async handleBreadcrumbClick(nodeId: string): Promise<void> {
    if (!this.currentWizardId) return;

    // Find the node in breadcrumb path
    const index = this.breadcrumbPath.findIndex(b => b.nodeId === nodeId);
    if (index >= 0) {
      const crumb = this.breadcrumbPath[index];
      await this.handleNodeClick(nodeId, crumb.name);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});




