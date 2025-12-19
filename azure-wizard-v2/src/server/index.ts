import express, { Express } from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import apiRoutes from './routes/api.js';
import wizardRoutes from './routes/wizards.js';
import { getAllWizards } from './wizards/json-wizard-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 3030;

// In dev/local usage, avoid stale client JS/CSS from browser cache
app.use((req, res, next) => {
  const path = req.path || '';
  if (path === '/' || path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.html') || path.endsWith('.map')) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
  }
  next();
});

// Log available wizards on startup
try {
  const wizards = getAllWizards();
  console.log(`Loaded ${wizards.length} wizard(s):`);
  wizards.forEach(w => console.log(`  - ${w.name} (${w.id})`));
} catch (error) {
  console.error('Error loading wizards:', error);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes (mount before static files)
app.use('/api', apiRoutes);
app.use('/api/wizards', wizardRoutes);

// Serve static files from compiled client directory
const clientPath = join(__dirname, '..', 'client');
app.use(express.static(clientPath));

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(join(clientPath, 'index.html'));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Azure Wizard V2 server running on http://localhost:${PORT}`);
  console.log(`Open your browser to http://localhost:${PORT}`);
});

server.on('error', (err: any) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`\nTo fix this, you can:`);
    console.error(`- Stop the other process using port ${PORT}`);
    console.error(`- Or start v2 on a different port:`);
    console.error(`  PowerShell: $env:PORT=3032; npm start`);
    console.error(`  CMD: set PORT=3032 && npm start\n`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});
