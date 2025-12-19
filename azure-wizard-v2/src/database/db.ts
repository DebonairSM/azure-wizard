import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let dbInstance: Database.Database | null = null;

/**
 * Get or create database instance
 */
export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  // Ensure data directory exists
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  const dbPath = join(dataDir, 'wizard.db');
  
  // Create database connection
  dbInstance = new Database(dbPath);
  
  // Enable foreign keys
  dbInstance.pragma('foreign_keys = ON');
  
  // Initialize schema
  initializeSchema();
  
  return dbInstance;
}

/**
 * Initialize database schema
 */
function initializeSchema(): void {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }

  try {
    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute schema (better-sqlite3 supports multiple statements)
    dbInstance.exec(schema);
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}


