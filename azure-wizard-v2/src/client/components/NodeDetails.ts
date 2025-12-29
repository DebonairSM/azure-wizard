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
  private flowState: {
    answers: Record<string, any>;
    lastResult: any | null;
  } = { answers: {}, lastResult: null };

  constructor() {
    const container = document.getElementById('nodeDetails');
    if (!container) {
      throw new Error('Node details container not found');
    }
    this.container = container;

    // Best-effort restore of guided-flow state
    try {
      const storedAnswers = localStorage.getItem('apimFlow.answers');
      const storedResult = localStorage.getItem('apimFlow.lastResult');
      if (storedAnswers) this.flowState.answers = JSON.parse(storedAnswers);
      if (storedResult) this.flowState.lastResult = JSON.parse(storedResult);
    } catch {
      // ignore
    }
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

    // Guided flow steps (interactive)
    if (data.type === 'flow-step') {
      const title = document.createElement('h3');
      title.textContent = 'Guided flow';
      section.appendChild(title);

      const step = String(data.step || '');

      if (step === 'requirements') {
        const form = document.createElement('form');
        form.className = 'flow-form';

        const questions = Array.isArray(data.questions) ? data.questions : [];
        questions.forEach((q: any) => {
          const qId = String(q.id || '');
          if (!qId) return;

          const wrapper = document.createElement('div');
          wrapper.className = 'flow-question';

          const label = document.createElement('label');
          label.textContent = String(q.label || qId);
          label.style.display = 'block';
          label.style.fontWeight = '600';
          wrapper.appendChild(label);

          const current =
            this.flowState.answers[qId] !== undefined ? this.flowState.answers[qId] : q.default;

          if (q.type === 'boolean') {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = Boolean(current);
            input.addEventListener('change', () => {
              this.flowState.answers[qId] = input.checked;
              this.persistFlowState();
            });
            wrapper.appendChild(input);
          } else if (q.type === 'select' && Array.isArray(q.options)) {
            const select = document.createElement('select');
            select.value = String(current ?? q.default ?? '');
            q.options.forEach((opt: any) => {
              const option = document.createElement('option');
              option.value = String(opt.value);
              option.textContent = String(opt.label ?? opt.value);
              select.appendChild(option);
            });
            select.addEventListener('change', () => {
              this.flowState.answers[qId] = select.value;
              this.persistFlowState();
            });
            wrapper.appendChild(select);
          }

          form.appendChild(wrapper);
        });

        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Generate recommendation';
        button.addEventListener('click', async () => {
          button.disabled = true;
          const prev = button.textContent;
          button.textContent = 'Generating...';
          try {
            const result = await this.evaluateApimFlow(this.flowState.answers);
            this.flowState.lastResult = result;
            this.persistFlowState();
            this.renderFlowResult(section, result);
          } finally {
            button.disabled = false;
            button.textContent = prev || 'Generate recommendation';
          }
        });
        form.appendChild(button);

        const reset = document.createElement('button');
        reset.type = 'button';
        reset.textContent = 'Reset';
        reset.style.marginLeft = '8px';
        reset.addEventListener('click', () => {
          this.flowState.answers = {};
          this.flowState.lastResult = null;
          this.persistFlowState();
          this.displayNode(
            {
              id: 'flow-requirements',
              wizardId: 'apim',
              name: 'Guided flow: requirements',
              description: data.description,
              nodeType: 'item',
              wizardData: data
            },
            []
          );
        });
        form.appendChild(reset);

        section.appendChild(form);

        if (this.flowState.lastResult) {
          this.renderFlowResult(section, this.flowState.lastResult);
        }

        return section;
      }

      // recommendation/export: show last result if present
      if (step === 'recommendation' || step === 'export') {
        if (this.flowState.lastResult) {
          this.renderFlowResult(section, this.flowState.lastResult);
        } else {
          const p = document.createElement('p');
          p.textContent = 'No generated output yet. Use the Requirements step to generate a recommendation.';
          section.appendChild(p);
        }
        return section;
      }

      return section;
    }

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

    // Handle common informational page structures (links, next steps, checklists)
    const hasLinks = Array.isArray(data.links) && data.links.length > 0;
    const hasNextSteps = Array.isArray(data.nextSteps) && data.nextSteps.length > 0;
    const hasSummary = Array.isArray(data.summary) && data.summary.length > 0;
    const hasChecklist = Array.isArray(data.checklist) && data.checklist.length > 0;
    const hasTerms = Array.isArray(data.terms) && data.terms.length > 0;
    const hasSections = Array.isArray(data.sections) && data.sections.length > 0;

    if (hasSummary || hasChecklist || hasTerms || hasLinks || hasNextSteps || hasSections) {
      const title = document.createElement('h3');
      title.textContent = 'Details';
      section.appendChild(title);

      if (hasSummary) {
        const summaryTitle = document.createElement('h4');
        summaryTitle.textContent = 'Summary';
        section.appendChild(summaryTitle);

        const ul = document.createElement('ul');
        ul.className = 'bullet-list';
        data.summary.forEach((line: string) => {
          const li = document.createElement('li');
          li.textContent = String(line);
          ul.appendChild(li);
        });
        section.appendChild(ul);
      }

      if (hasChecklist) {
        const checklistTitle = document.createElement('h4');
        checklistTitle.textContent = 'Checklist';
        section.appendChild(checklistTitle);

        const ul = document.createElement('ul');
        ul.className = 'bullet-list';
        data.checklist.forEach((line: string) => {
          const li = document.createElement('li');
          li.textContent = String(line);
          ul.appendChild(li);
        });
        section.appendChild(ul);
      }

      if (hasTerms) {
        const termsTitle = document.createElement('h4');
        termsTitle.textContent = 'Terms';
        section.appendChild(termsTitle);

        const dl = document.createElement('dl');
        dl.className = 'data-list';
        data.terms.forEach((t: any) => {
          const dt = document.createElement('dt');
          dt.textContent = String(t.term ?? '');
          const dd = document.createElement('dd');
          dd.textContent = String(t.definition ?? '');
          dl.appendChild(dt);
          dl.appendChild(dd);
        });
        section.appendChild(dl);
      }

      if (hasSections) {
        const sectionsTitle = document.createElement('h4');
        sectionsTitle.textContent = 'Sections';
        section.appendChild(sectionsTitle);

        data.sections.forEach((s: any) => {
          const sTitle = document.createElement('div');
          sTitle.style.fontWeight = '600';
          sTitle.textContent = String(s.name ?? '');
          section.appendChild(sTitle);

          if (Array.isArray(s.links) && s.links.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'links-list';
            s.links.forEach((l: any) => {
              const li = document.createElement('li');
              const a = document.createElement('a');
              a.href = String(l.url ?? '');
              a.target = '_blank';
              a.rel = 'noreferrer';
              a.textContent = String(l.title ?? l.url ?? 'Link');
              li.appendChild(a);
              ul.appendChild(li);
            });
            section.appendChild(ul);
          }
        });
      }

      if (hasLinks) {
        const linksTitle = document.createElement('h4');
        linksTitle.textContent = 'Links';
        section.appendChild(linksTitle);

        const ul = document.createElement('ul');
        ul.className = 'links-list';

        data.links.forEach((l: any) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = String(l.url ?? '');
          a.target = '_blank';
          a.rel = 'noreferrer';
          a.textContent = String(l.title ?? l.url ?? 'Link');
          li.appendChild(a);
          ul.appendChild(li);
        });

        section.appendChild(ul);
      }

      if (hasNextSteps) {
        const nextTitle = document.createElement('h4');
        nextTitle.textContent = 'Next steps';
        section.appendChild(nextTitle);

        const ul = document.createElement('ul');
        ul.className = 'bullet-list';
        data.nextSteps.forEach((line: string) => {
          const li = document.createElement('li');
          li.textContent = String(line);
          ul.appendChild(li);
        });
        section.appendChild(ul);
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

  private persistFlowState(): void {
    try {
      localStorage.setItem('apimFlow.answers', JSON.stringify(this.flowState.answers));
      localStorage.setItem('apimFlow.lastResult', JSON.stringify(this.flowState.lastResult));
    } catch {
      // ignore
    }
  }

  private async evaluateApimFlow(answers: Record<string, any>): Promise<any> {
    const response = await fetch('/api/apim/flow/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers)
    });
    return await response.json();
  }

  private renderFlowResult(container: HTMLElement, result: any): void {
    const existing = container.querySelector('.flow-result');
    if (existing && existing.parentElement) existing.parentElement.removeChild(existing);

    const wrap = document.createElement('div');
    wrap.className = 'flow-result';

    const title = document.createElement('h4');
    title.textContent = 'Generated output';
    wrap.appendChild(title);

    const model = result?.deploymentModel ? String(result.deploymentModel) : 'N/A';
    const sku = result?.recommendedSku?.name ? String(result.recommendedSku.name) : 'No eligible SKU';
    const summary = document.createElement('div');
    summary.className = 'flow-summary';
    summary.textContent = `Deployment model: ${model} | Recommended SKU: ${sku}`;
    wrap.appendChild(summary);

    // Export helpers (copy + download)
    const buttons = document.createElement('div');
    buttons.className = 'flow-buttons';
    buttons.style.display = 'flex';
    buttons.style.gap = '8px';
    buttons.style.flexWrap = 'wrap';

    const copyJson = document.createElement('button');
    copyJson.type = 'button';
    copyJson.textContent = 'Copy JSON';
    copyJson.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      } catch {
        // ignore
      }
    });
    buttons.appendChild(copyJson);

    const dlJson = document.createElement('button');
    dlJson.type = 'button';
    dlJson.textContent = 'Download JSON';
    dlJson.addEventListener('click', () => {
      this.downloadText('apim-flow-output.json', JSON.stringify(result, null, 2), 'application/json');
    });
    buttons.appendChild(dlJson);

    const policyXml = result?.exports?.policyXml;
    if (typeof policyXml === 'string' && policyXml.length > 0) {
      const dlXml = document.createElement('button');
      dlXml.type = 'button';
      dlXml.textContent = 'Download policy XML';
      dlXml.addEventListener('click', () => {
        this.downloadText('apim-policies.xml', policyXml, 'application/xml');
      });
      buttons.appendChild(dlXml);
    }

    const checklistMd = result?.exports?.checklistMarkdown;
    if (typeof checklistMd === 'string' && checklistMd.length > 0) {
      const dlMd = document.createElement('button');
      dlMd.type = 'button';
      dlMd.textContent = 'Download checklist (MD)';
      dlMd.addEventListener('click', () => {
        this.downloadText('apim-checklist.md', checklistMd, 'text/markdown');
      });
      buttons.appendChild(dlMd);
    }

    wrap.appendChild(buttons);

    if (Array.isArray(result?.warnings) && result.warnings.length > 0) {
      const warnTitle = document.createElement('h4');
      warnTitle.textContent = 'Warnings';
      wrap.appendChild(warnTitle);
      const ul = document.createElement('ul');
      ul.className = 'bullet-list';
      result.warnings.forEach((w: any) => {
        const li = document.createElement('li');
        li.textContent = String(w);
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
    }

    const pre = document.createElement('pre');
    pre.className = 'flow-json';
    pre.textContent = JSON.stringify(result, null, 2);
    wrap.appendChild(pre);

    container.appendChild(wrap);
  }

  private downloadText(filename: string, content: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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




