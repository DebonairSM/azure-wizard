import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
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

// Copy wizard schema files (like apim-schema.sql)
if (existsSync(srcWizards)) {
  const wizards = readdirSync(srcWizards);
  for (const wizard of wizards) {
    const wizardPath = join(srcWizards, wizard);
    if (statSync(wizardPath).isDirectory()) {
      const wizardFiles = readdirSync(wizardPath);
      for (const file of wizardFiles) {
        if (file.endsWith('.sql')) {
          const srcFile = join(wizardPath, file);
          const distWizardPath = join(distWizards, wizard);
          if (!existsSync(distWizardPath)) {
            mkdirSync(distWizardPath, { recursive: true });
          }
          const dstFile = join(distWizardPath, file);
          copyFileSync(srcFile, dstFile);
        }
      }
    }
  }
  console.log('Wizard schema files copied');
}


