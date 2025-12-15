// Main Express server for Azure Wizard
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';
import { loadEnv } from './scripts/load-env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (generates browser config)
loadEnv();

const app = express();
const PORT = process.env.PORT || 3030;

// Initialize database
initDatabase();

// Middleware
app.use(express.json());
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/favicon.svg', express.static(path.join(__dirname, 'favicon.svg')));
// Serve index.html as static file for client-side view with builder mode
app.use('/app.html', express.static(path.join(__dirname, 'index.html')));

// Set up EJS templating
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
import wizardRoutes from './routes/wizard.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';

// Routes
app.use('/', wizardRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

// Start server with error handling
const server = app.listen(PORT, () => {
    console.log(`Azure Wizard server running on http://localhost:${PORT}`);
    console.log(`Open your browser to http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.error(`\nTo fix this, you can:`);
        console.error(`1. Find and stop the process using port ${PORT}:`);
        console.error(`   Windows: netstat -ano | findstr :${PORT}`);
        console.error(`   Then kill the process: taskkill /PID <pid> /F`);
        console.error(`2. Use a different port by setting the PORT environment variable:`);
        console.error(`   set PORT=3031 && npm start`);
        console.error(`   (or create a .env file with PORT=3031)\n`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});

