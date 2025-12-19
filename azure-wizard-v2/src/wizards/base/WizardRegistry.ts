import { IWizard } from './IWizard.js';
import { getDatabase } from '../../database/db.js';

/**
 * Registry for managing all wizards
 */
class WizardRegistry {
  private wizards: Map<string, IWizard> = new Map();

  /**
   * Register a wizard
   */
  register(wizard: IWizard): void {
    this.wizards.set(wizard.id, wizard);
    
    // Register wizard in database
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO wizards (id, name, description)
      VALUES (?, ?, ?)
    `);
    stmt.run(wizard.id, wizard.name, wizard.description);
    
    // Apply schema additions if any
    if (wizard.getSchemaAdditions) {
      const schemaAdditions = wizard.getSchemaAdditions();
      if (schemaAdditions) {
        db.exec(schemaAdditions);
      }
    }
    
    console.log(`Registered wizard: ${wizard.name} (${wizard.id})`);
  }

  /**
   * Get a wizard by ID
   */
  get(id: string): IWizard | undefined {
    return this.wizards.get(id);
  }

  /**
   * Get all registered wizards
   */
  getAll(): IWizard[] {
    return Array.from(this.wizards.values());
  }

  /**
   * Get wizard IDs
   */
  getIds(): string[] {
    return Array.from(this.wizards.keys());
  }
}

// Singleton instance
export const wizardRegistry = new WizardRegistry();





