// Script to load API key from .env file and create a config file for the browser
// This bridges the gap between .env (server-side) and browser environment

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const outputPath = path.join(projectRoot, 'js', 'api-key-config.js');

export function loadEnv() {
    // This function can be called from server.js
    // For now, we just generate the browser config file
    generateBrowserConfig();
}

function generateBrowserConfig() {
    // Read .env file
    let apiKey = null;
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        // Match OPENAI_API_KEY=value on any line, handle various line endings
        const lines = envContent.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('OPENAI_API_KEY=')) {
                apiKey = trimmed.substring('OPENAI_API_KEY='.length).trim();
                // Remove quotes if present
                if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || 
                    (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
                    apiKey = apiKey.slice(1, -1);
                }
                break;
            }
        }
    }

    // Generate config file
    if (apiKey) {
        const configContent = `// Auto-generated from .env file - DO NOT COMMIT
// This file sets the API key for browser use
window.OPENAI_API_KEY = '${apiKey}';
`;
        fs.writeFileSync(outputPath, configContent, 'utf8');
        console.log('✓ API key loaded from .env and configured');
    } else {
        // Create empty file if no key found
        const configContent = `// No API key found in .env file
// You can set it via the UI dialog or add OPENAI_API_KEY to your .env file
`;
        fs.writeFileSync(outputPath, configContent, 'utf8');
        console.log('⚠ No OPENAI_API_KEY found in .env file');
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('load-env.js')) {
    generateBrowserConfig();
}



