import { Router, Request, Response } from 'express';
import {
  getAllWizards,
  loadWizardMetadata,
  getWizardCategories,
  getCategoryItems,
  getWizardItem,
  getWizardTree
} from '../wizards/json-wizard-loader.js';

const router = Router();

/**
 * GET /api/wizards
 * List all available wizards
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const wizards = getAllWizards();
    return res.json(wizards);
  } catch (error) {
    console.error('Error fetching wizards:', error);
    return res.status(500).json({ error: 'Failed to fetch wizards' });
  }
});

/**
 * GET /api/wizards/:id
 * Get wizard metadata
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metadata = loadWizardMetadata(id);

    if (!metadata) {
      return res.status(404).json({ error: 'Wizard not found' });
    }

    return res.json(metadata);
  } catch (error) {
    console.error('Error fetching wizard:', error);
    return res.status(500).json({ error: 'Failed to fetch wizard' });
  }
});

/**
 * GET /api/wizards/:id/nodes
 * Get root nodes for a wizard (categories)
 */
router.get('/:id/nodes', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metadata = loadWizardMetadata(id);

    if (!metadata) {
      return res.status(404).json({ error: 'Wizard not found' });
    }

    const categories = getWizardCategories(id);
    const nodes = categories.map((category, index) => ({
      id: `category-${category}`,
      wizardId: id,
      name: formatCategoryName(category),
      description: `${category} category`,
      nodeType: 'category',
      displayOrder: index
    }));

    return res.json(nodes);
  } catch (error) {
    console.error('Error fetching root nodes:', error);
    return res.status(500).json({ error: 'Failed to fetch root nodes' });
  }
});

/**
 * GET /api/wizards/:id/nodes/:nodeId
 * Get specific node data
 */
router.get('/:id/nodes/:nodeId', (req: Request, res: Response) => {
  try {
    const { id, nodeId } = req.params;
    const metadata = loadWizardMetadata(id);

    if (!metadata) {
      return res.status(404).json({ error: 'Wizard not found' });
    }

    // Parse nodeId to determine type
    if (nodeId.startsWith('category-')) {
      const category = nodeId.replace('category-', '');
      const items = getCategoryItems(id, category);
      
      return res.json({
        id: nodeId,
        wizardId: id,
        name: formatCategoryName(category),
        description: `${category} category`,
        nodeType: 'category',
        wizardData: {
          category: category,
          items: items
        }
      });
    } else {
      // Try to find item by ID across all categories
      const item = getWizardItem(id, nodeId);
      
      if (!item) {
        return res.status(404).json({ error: 'Node not found' });
      }

      return res.json({
        id: item.id,
        wizardId: id,
        name: item.name,
        description: item.description || '',
        nodeType: 'item',
        wizardData: item
      });
    }
  } catch (error) {
    console.error('Error fetching node:', error);
    return res.status(500).json({ error: 'Failed to fetch node' });
  }
});

/**
 * GET /api/wizards/:id/nodes/:nodeId/children
 * Get child nodes for a node
 */
router.get('/:id/nodes/:nodeId/children', (req: Request, res: Response) => {
  try {
    const { id, nodeId } = req.params;
    const metadata = loadWizardMetadata(id);

    if (!metadata) {
      return res.status(404).json({ error: 'Wizard not found' });
    }

    // Parse nodeId to determine type
    if (nodeId.startsWith('category-')) {
      const category = nodeId.replace('category-', '');
      const items = getCategoryItems(id, category);
      
      const children = items.map((item, index) => ({
        id: item.id,
        wizardId: id,
        parentId: nodeId,
        name: item.name,
        description: item.description || '',
        nodeType: 'item',
        displayOrder: index,
        data: item
      }));
      
      return res.json(children);
    } else {
      // Item node - no children for now (could add drill-down later)
      return res.json([]);
    }
  } catch (error) {
    console.error('Error fetching child nodes:', error);
    return res.status(500).json({ error: 'Failed to fetch child nodes' });
  }
});

/**
 * Helper: Format category name
 */
function formatCategoryName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default router;
