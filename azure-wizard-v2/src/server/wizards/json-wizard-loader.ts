import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface WizardMetadata {
  id: string;
  name: string;
  description: string;
  version?: string;
}

export interface WizardItem {
  id: string;
  name: string;
  [key: string]: any;
}

export interface WizardCategory {
  name: string;
  path: string;
  items: WizardItem[];
  subcategories?: WizardCategory[];
}

/**
 * Load wizard metadata from _index.json
 */
export function loadWizardMetadata(wizardId: string): WizardMetadata | null {
  const wizardPath = getWizardPath(wizardId);
  if (!wizardPath) return null;

  const indexPath = join(wizardPath, '_index.json');
  if (!existsSync(indexPath)) {
    // Auto-generate metadata if _index.json doesn't exist
    return {
      id: wizardId,
      name: formatWizardName(wizardId),
      description: `Azure ${formatWizardName(wizardId)} configuration wizard`
    };
  }

  try {
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    return {
      id: wizardId,
      name: index.name || formatWizardName(wizardId),
      description: index.description || '',
      version: index.version
    };
  } catch (error) {
    console.error(`Error loading wizard metadata for ${wizardId}:`, error);
    return null;
  }
}

/**
 * Get all available wizards (scan wizards/ directory)
 */
export function getAllWizards(): WizardMetadata[] {
  const wizardsPath = join(__dirname, '..', '..', 'wizards');
  if (!existsSync(wizardsPath)) {
    return [];
  }

  const wizards: WizardMetadata[] = [];
  const entries = readdirSync(wizardsPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      const metadata = loadWizardMetadata(entry.name);
      if (metadata) {
        wizards.push(metadata);
      }
    }
  }

  return wizards;
}

/**
 * Get categories for a wizard (top-level folders)
 */
export function getWizardCategories(wizardId: string): string[] {
  const wizardPath = getWizardPath(wizardId);
  if (!wizardPath) return [];

  const categories: string[] = [];
  const entries = readdirSync(wizardPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      categories.push(entry.name);
    }
  }

  return categories.sort();
}

/**
 * Get items in a category (JSON files in category folder)
 */
export function getCategoryItems(wizardId: string, category: string): WizardItem[] {
  const wizardPath = getWizardPath(wizardId);
  if (!wizardPath) return [];

  const categoryPath = join(wizardPath, category);
  if (!existsSync(categoryPath) || !statSync(categoryPath).isDirectory()) {
    return [];
  }

  const items: WizardItem[] = [];
  const entries = readdirSync(categoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      try {
        const filePath = join(categoryPath, entry.name);
        const content = JSON.parse(readFileSync(filePath, 'utf8'));
        
        // Ensure id and name exist
        const item: WizardItem = {
          id: content.id || entry.name.replace('.json', ''),
          name: content.name || formatItemName(entry.name),
          ...content
        };
        
        items.push(item);
      } catch (error) {
        console.error(`Error loading item ${entry.name} in ${category}:`, error);
      }
    }
  }

  return items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Get a specific item by ID (searches all categories)
 */
export function getWizardItem(wizardId: string, itemId: string): WizardItem | null {
  const categories = getWizardCategories(wizardId);
  
  for (const category of categories) {
    const items = getCategoryItems(wizardId, category);
    const item = items.find(i => i.id === itemId);
    if (item) {
      return item;
    }
    
    // Check subcategories recursively
    const categoryPath = join(getWizardPath(wizardId)!, category);
    const subcategories = getSubcategories(categoryPath);
    for (const subcategory of subcategories) {
      const subItems = getCategoryItems(wizardId, `${category}/${subcategory}`);
      const subItem = subItems.find(i => i.id === itemId);
      if (subItem) {
        return subItem;
      }
    }
  }
  
  return null;
}

/**
 * Get tree structure for frontend (categories and items as nodes)
 */
export function getWizardTree(wizardId: string): any[] {
  const categories = getWizardCategories(wizardId);
  const wizardPath = getWizardPath(wizardId);
  if (!wizardPath) return [];

  const tree: any[] = [];

  for (const category of categories) {
    const categoryPath = join(wizardPath, category);
    const items = getCategoryItems(wizardId, category);
    
    // Check if category has subcategories
    const subcategories = getSubcategories(categoryPath);
    
    if (subcategories.length > 0) {
      // Category with subcategories
      const categoryNode = {
        id: `category-${category}`,
        name: formatCategoryName(category),
        type: 'category',
        children: subcategories.map(subcat => {
          const subItems = getCategoryItems(wizardId, `${category}/${subcat}`);
          return {
            id: `category-${category}-${subcat}`,
            name: formatCategoryName(subcat),
            type: 'subcategory',
            parentId: `category-${category}`,
            children: subItems.map(item => ({
              id: item.id,
              name: item.name,
              type: 'item',
              parentId: `category-${category}-${subcat}`,
              data: item
            }))
          };
        })
      };
      tree.push(categoryNode);
    } else {
      // Category with direct items
      const categoryNode = {
        id: `category-${category}`,
        name: formatCategoryName(category),
        type: 'category',
        children: items.map(item => ({
          id: item.id,
          name: item.name,
          type: 'item',
          parentId: `category-${category}`,
          data: item
        }))
      };
      tree.push(categoryNode);
    }
  }

  return tree;
}

/**
 * Helper: Get wizard directory path
 */
function getWizardPath(wizardId: string): string | null {
  const wizardsPath = join(__dirname, '..', '..', 'wizards');
  const wizardPath = join(wizardsPath, wizardId);
  
  if (existsSync(wizardPath) && statSync(wizardPath).isDirectory()) {
    return wizardPath;
  }
  
  return null;
}

/**
 * Helper: Get subcategories in a directory
 */
function getSubcategories(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];
  
  const subcategories: string[] = [];
  const entries = readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      subcategories.push(entry.name);
    }
  }
  
  return subcategories.sort();
}

/**
 * Helper: Format wizard name from ID
 */
function formatWizardName(id: string): string {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Helper: Format category name
 */
function formatCategoryName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Helper: Format item name from filename
 */
function formatItemName(filename: string): string {
  return filename
    .replace('.json', '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


