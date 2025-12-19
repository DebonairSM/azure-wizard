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

export class TreeView {
  private container: HTMLElement;
  private onNodeClick: (nodeId: string, nodeName: string) => Promise<void>;
  private expandedNodes: Set<string> = new Set();
  private loadedChildren: Map<string, Node[]> = new Map();

  constructor(onNodeClick: (nodeId: string, nodeName: string) => Promise<void>) {
    const container = document.getElementById('treeView');
    if (!container) {
      throw new Error('Tree view container not found');
    }
    this.container = container;
    this.onNodeClick = onNodeClick;
  }

  setRootNodes(nodes: Node[], wizardId: string): void {
    this.container.innerHTML = '';
    this.expandedNodes.clear();
    this.loadedChildren.clear();

    const ul = document.createElement('ul');
    ul.className = 'tree-root';

    nodes.forEach(node => {
      const li = this.createTreeNode(node, wizardId);
      ul.appendChild(li);
    });

    this.container.appendChild(ul);
  }

  async expandNode(nodeId: string, wizardId: string): Promise<void> {
    const li = this.container.querySelector(`[data-node-id="${nodeId}"]`) as HTMLLIElement | null;
    if (!li) return;
    if (this.expandedNodes.has(nodeId)) return;
    await this.toggleNode(nodeId, li, wizardId);
  }

  private createTreeNode(node: Node, wizardId: string): HTMLLIElement {
    const li = document.createElement('li');
    li.className = 'tree-node';
    li.dataset.nodeId = node.id;

    const nodeContent = document.createElement('div');
    nodeContent.className = 'tree-node-content';

    // Expand/collapse button (if has children or might have children)
    const expandButton = document.createElement('span');
    expandButton.className = 'tree-expand';
    expandButton.textContent = '▶';
    expandButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNode(node.id, li, wizardId);
    });

    // Node name
    const nodeName = document.createElement('span');
    nodeName.className = 'tree-node-name';
    nodeName.textContent = node.name;
    nodeName.addEventListener('click', () => {
      this.onNodeClick(node.id, node.name);
    });

    nodeContent.appendChild(expandButton);
    nodeContent.appendChild(nodeName);

    // Children container (initially hidden)
    const childrenContainer = document.createElement('ul');
    childrenContainer.className = 'tree-children';
    childrenContainer.style.display = 'none';

    // If we have children data, render them
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        const childLi = this.createTreeNode(child, wizardId);
        childrenContainer.appendChild(childLi);
      });
      this.loadedChildren.set(node.id, node.children);
    }

    li.appendChild(nodeContent);
    li.appendChild(childrenContainer);

    return li;
  }

  private async toggleNode(nodeId: string, liElement: HTMLLIElement, wizardId: string): Promise<void> {
    const childrenContainer = liElement.querySelector('.tree-children') as HTMLElement;
    const expandButton = liElement.querySelector('.tree-expand') as HTMLElement;

    if (!childrenContainer) return;

    const isExpanded = this.expandedNodes.has(nodeId);

    if (isExpanded) {
      // Collapse
      childrenContainer.style.display = 'none';
      expandButton.textContent = '▶';
      this.expandedNodes.delete(nodeId);
    } else {
      // Expand
      childrenContainer.style.display = 'block';
      expandButton.textContent = '▼';

      // Load children if not already loaded
      if (!this.loadedChildren.has(nodeId)) {
        try {
          const response = await fetch(`/api/wizards/${wizardId}/nodes/${nodeId}/children`);
          const children: Node[] = await response.json();

          // Clear existing children
          childrenContainer.innerHTML = '';

          if (children.length > 0) {
            children.forEach(child => {
              const childLi = this.createTreeNode(child, wizardId);
              childrenContainer.appendChild(childLi);
            });
            this.loadedChildren.set(nodeId, children);
          } else {
            // No children - remove expand button
            expandButton.style.display = 'none';
          }
        } catch (error) {
          console.error('Error loading children:', error);
        }
      }

      this.expandedNodes.add(nodeId);
    }
  }

  updateNodeChildren(nodeId: string, children: Node[]): void {
    const nodeElement = this.container.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
    if (!nodeElement) return;

    const childrenContainer = nodeElement.querySelector('.tree-children') as HTMLElement;
    if (!childrenContainer) return;

    // Clear existing children
    childrenContainer.innerHTML = '';

    if (children.length > 0) {
      children.forEach(child => {
        const wizardId = child.wizardId;
        const childLi = this.createTreeNode(child, wizardId);
        childrenContainer.appendChild(childLi);
      });
      this.loadedChildren.set(nodeId, children);

      // Show children if node is expanded
      if (this.expandedNodes.has(nodeId)) {
        childrenContainer.style.display = 'block';
      }
    }
  }

  clear(): void {
    this.container.innerHTML = '';
    this.expandedNodes.clear();
    this.loadedChildren.clear();
  }
}




