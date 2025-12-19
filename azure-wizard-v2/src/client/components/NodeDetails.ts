interface NodeData {
  id: string;
  wizardId: string;
  parentId?: string;
  name: string;
  description?: string;
  nodeType?: string;
  displayOrder?: number;
  data?: any;
  wizardData?: any;
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
}

export class NodeDetails {
  private container: HTMLElement;

  constructor() {
    const container = document.getElementById('nodeDetails');
    if (!container) {
      throw new Error('Node details container not found');
    }
    this.container = container;
  }

  displayNode(nodeData: NodeData, children: Node[]): void {
    this.container.innerHTML = '';

    // Node header
    const header = document.createElement('div');
    header.className = 'node-header';
    
    const title = document.createElement('h2');
    title.textContent = nodeData.name;
    header.appendChild(title);

    if (nodeData.description) {
      const description = document.createElement('p');
      description.className = 'node-description';
      description.textContent = nodeData.description;
      header.appendChild(description);
    }

    this.container.appendChild(header);

    // Node type badge
    if (nodeData.nodeType) {
      const badge = document.createElement('span');
      badge.className = 'node-type-badge';
      badge.textContent = nodeData.nodeType;
      header.appendChild(badge);
    }

    // Additional data
    if (nodeData.wizardData) {
      const dataSection = this.createDataSection(nodeData.wizardData);
      this.container.appendChild(dataSection);
    }

    // Children section
    if (children && children.length > 0) {
      const childrenSection = document.createElement('div');
      childrenSection.className = 'node-children';
      
      const childrenTitle = document.createElement('h3');
      childrenTitle.textContent = 'Children';
      childrenSection.appendChild(childrenTitle);

      const childrenList = document.createElement('ul');
      childrenList.className = 'children-list';
      
      children.forEach(child => {
        const li = document.createElement('li');
        li.textContent = child.name;
        if (child.description) {
          const desc = document.createElement('span');
          desc.className = 'child-description';
          desc.textContent = ` - ${child.description}`;
          li.appendChild(desc);
        }
        childrenList.appendChild(li);
      });

      childrenSection.appendChild(childrenList);
      this.container.appendChild(childrenSection);
    } else if (nodeData.nodeType === 'attribute' && nodeData.data) {
      // Show attribute value
      const valueSection = document.createElement('div');
      valueSection.className = 'node-value';
      
      const valueLabel = document.createElement('strong');
      valueLabel.textContent = 'Value: ';
      valueSection.appendChild(valueLabel);

      const value = document.createElement('span');
      if (nodeData.data.type === 'json') {
        value.textContent = JSON.stringify(nodeData.data.value, null, 2);
        value.style.fontFamily = 'monospace';
        value.style.whiteSpace = 'pre-wrap';
      } else {
        value.textContent = String(nodeData.data.value || 'N/A');
      }
      valueSection.appendChild(value);

      this.container.appendChild(valueSection);
    }
  }

  private createDataSection(data: any): HTMLElement {
    const section = document.createElement('div');
    section.className = 'node-data-section';

    // Handle special cases for better display
    if (data.items && Array.isArray(data.items)) {
      // Category with items
      const title = document.createElement('h3');
      title.textContent = `${data.items.length} item(s)`;
      section.appendChild(title);
      
      const itemsList = document.createElement('ul');
      itemsList.className = 'items-list';
      data.items.forEach((item: any) => {
        const li = document.createElement('li');
        li.textContent = item.name || item.id;
        if (item.description) {
          const desc = document.createElement('span');
          desc.className = 'item-description';
          desc.textContent = ` - ${item.description}`;
          li.appendChild(desc);
        }
        itemsList.appendChild(li);
      });
      section.appendChild(itemsList);
      return section;
    }

    // Handle policy data
    if (data.parameters || data.xmlTemplate || data.examples) {
      const title = document.createElement('h3');
      title.textContent = 'Policy Details';
      section.appendChild(title);

      if (data.description) {
        const desc = document.createElement('p');
        desc.className = 'policy-description';
        desc.textContent = data.description;
        section.appendChild(desc);
      }

      if (data.parameters && Object.keys(data.parameters).length > 0) {
        const paramsTitle = document.createElement('h4');
        paramsTitle.textContent = 'Parameters';
        section.appendChild(paramsTitle);
        
        const paramsList = document.createElement('dl');
        paramsList.className = 'parameters-list';
        for (const [key, param] of Object.entries(data.parameters)) {
          const dt = document.createElement('dt');
          dt.textContent = key;
          paramsList.appendChild(dt);
          
          const dd = document.createElement('dd');
          const paramObj = param as any;
          dd.innerHTML = `
            <strong>Type:</strong> ${paramObj.type || 'string'}<br>
            ${paramObj.required ? '<strong>Required:</strong> Yes<br>' : ''}
            ${paramObj.description ? `<strong>Description:</strong> ${paramObj.description}<br>` : ''}
            ${paramObj.default !== undefined ? `<strong>Default:</strong> ${paramObj.default}` : ''}
          `;
          paramsList.appendChild(dd);
        }
        section.appendChild(paramsList);
      }

      if (data.xmlTemplate) {
        const xmlTitle = document.createElement('h4');
        xmlTitle.textContent = 'XML Template';
        section.appendChild(xmlTitle);
        
        const xmlCode = document.createElement('pre');
        xmlCode.className = 'xml-code';
        xmlCode.textContent = typeof data.xmlTemplate === 'string' 
          ? data.xmlTemplate 
          : JSON.stringify(data.xmlTemplate, null, 2);
        section.appendChild(xmlCode);
      }

      if (data.examples && Array.isArray(data.examples) && data.examples.length > 0) {
        const examplesTitle = document.createElement('h4');
        examplesTitle.textContent = 'Examples';
        section.appendChild(examplesTitle);
        
        data.examples.forEach((example: any, index: number) => {
          const exampleDiv = document.createElement('div');
          exampleDiv.className = 'example';
          if (example.name) {
            const exampleName = document.createElement('strong');
            exampleName.textContent = example.name;
            exampleDiv.appendChild(exampleName);
          }
          if (example.xml) {
            const exampleCode = document.createElement('pre');
            exampleCode.className = 'example-code';
            exampleCode.textContent = example.xml;
            exampleDiv.appendChild(exampleCode);
          }
          section.appendChild(exampleDiv);
        });
      }

      if (data.documentation) {
        const docLink = document.createElement('a');
        docLink.href = data.documentation;
        docLink.target = '_blank';
        docLink.textContent = 'View Documentation';
        docLink.className = 'doc-link';
        section.appendChild(docLink);
      }

      return section;
    }

    // Default: show all data as key-value pairs
    const title = document.createElement('h3');
    title.textContent = 'Details';
    section.appendChild(title);

    const dataList = document.createElement('dl');
    dataList.className = 'data-list';

    for (const [key, value] of Object.entries(data)) {
      // Skip internal fields
      if (key === 'id' || key === 'category' || key === 'items') continue;
      
      const dt = document.createElement('dt');
      dt.textContent = key;
      dataList.appendChild(dt);

      const dd = document.createElement('dd');
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          dd.textContent = value.length > 0 ? value.join(', ') : 'None';
        } else {
          dd.textContent = JSON.stringify(value, null, 2);
          dd.style.fontFamily = 'monospace';
          dd.style.whiteSpace = 'pre-wrap';
        }
      } else {
        dd.textContent = String(value);
      }
      dataList.appendChild(dd);
    }

    section.appendChild(dataList);
    return section;
  }

  showError(message: string): void {
    this.container.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
      </div>
    `;
  }

  clear(): void {
    this.container.innerHTML = '<p class="placeholder">Select a wizard and navigate the tree to view details</p>';
  }
}




