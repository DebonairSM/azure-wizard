import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const srcClient = join(rootDir, 'src', 'client');
const distClient = join(rootDir, 'dist', 'client');
const srcDatabase = join(rootDir, 'src', 'database');
const distDatabase = join(rootDir, 'dist', 'database');
const srcWizards = join(rootDir, 'src', 'wizards');
const distWizards = join(rootDir, 'dist', 'wizards');

function copyRecursive(src, dst) {
  if (!existsSync(dst)) {
    mkdirSync(dst, { recursive: true });
  }

  const entries = readdirSync(src);

  for (const entry of entries) {
    const srcPath = join(src, entry);
    const dstPath = join(dst, entry);

    if (statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, dstPath);
    } else {
      copyFileSync(srcPath, dstPath);
    }
  }
}

// Copy client files
if (existsSync(srcClient)) {
  copyRecursive(srcClient, distClient);
  console.log('Client files copied to dist/client');
} else {
  console.error('Source client directory not found:', srcClient);
  process.exit(1);
}

// Copy database schema files
if (existsSync(srcDatabase)) {
  copyRecursive(srcDatabase, distDatabase);
  console.log('Database files copied to dist/database');
}

// Copy wizard content (JSON, SQL, etc.) into dist so the runtime can load it
if (existsSync(srcWizards)) {
  // Remove any previous wizard artifacts so renames (e.g., numeric prefixes) don't leave duplicates behind
  if (existsSync(distWizards)) {
    rmSync(distWizards, { recursive: true, force: true });
  }
  copyRecursive(srcWizards, distWizards);
  console.log('Wizard content copied to dist/wizards');
}


