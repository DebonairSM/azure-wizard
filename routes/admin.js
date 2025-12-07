// Admin routes for resource management
import express from 'express';
import { getDatabase } from '../db/database.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * GET /admin - Admin dashboard
 */
router.get('/', (req, res) => {
    res.render('admin', {
        title: 'Azure Wizard - Admin',
        page: 'admin'
    });
});

/**
 * GET /admin/resources - Resource discovery page
 */
router.get('/resources', (req, res) => {
    res.render('admin', {
        title: 'Azure Resource Discovery - Admin',
        page: 'admin'
    });
});

/**
 * POST /api/admin/discover-resources - Trigger resource discovery
 */
router.post('/api/admin/discover-resources', async (req, res) => {
    const { services, enrich, dryRun, force } = req.body;

    // Build command arguments
    const args = [];
    
    if (services && services.length > 0) {
        // If specific services requested, run for each
        args.push('--service', services.join(','));
    }
    
    if (enrich) {
        args.push('--enrich');
    }
    
    if (dryRun) {
        args.push('--dry-run');
    }
    
    if (force) {
        args.push('--force');
    }

    try {
        // Spawn the discovery script
        const scriptPath = path.join(__dirname, '..', 'scripts', 'azure-resource-discovery.js');
        const child = spawn('node', [scriptPath, ...args], {
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe'
        });

        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                // Parse output for summary
                const summary = parseDiscoveryOutput(output);
                res.json({
                    success: true,
                    summary,
                    output,
                    dryRun: dryRun || false
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Discovery script failed',
                    output,
                    errorOutput
                });
            }
        });

        child.on('error', (error) => {
            res.status(500).json({
                success: false,
                error: error.message
            });
        });

    } catch (error) {
        console.error('Error triggering discovery:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/admin/discovery-status - Get current discovery status
 */
router.get('/api/admin/discovery-status', (req, res) => {
    try {
        const db = getDatabase();
        
        // Get count of offerings by service
        const serviceCount = db.prepare(`
            SELECT serviceName, COUNT(*) as count
            FROM azureOfferings
            GROUP BY serviceName
            ORDER BY serviceName
        `).all();

        // Get recent changelog entries
        const recentChanges = db.prepare(`
            SELECT serviceName, skuName, changeType, detectedAt
            FROM azureResourceChangelog
            ORDER BY detectedAt DESC
            LIMIT 10
        `).all();

        // Get last check time
        const lastCheck = db.prepare(`
            SELECT MAX(detectedAt) as lastCheck
            FROM azureResourceChangelog
        `).get();

        res.json({
            success: true,
            serviceCount,
            recentChanges,
            lastCheck: lastCheck?.lastCheck || null
        });

    } catch (error) {
        console.error('Error getting discovery status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/admin/resource-changelog - Get resource changelog
 */
router.get('/api/admin/resource-changelog', (req, res) => {
    try {
        const db = getDatabase();
        const { since, service, changeType, limit = 50 } = req.query;

        let query = 'SELECT * FROM azureResourceChangelog WHERE 1=1';
        const params = [];

        if (since) {
            query += ' AND detectedAt >= ?';
            params.push(since);
        }

        if (service) {
            query += ' AND serviceName = ?';
            params.push(service);
        }

        if (changeType) {
            query += ' AND changeType = ?';
            params.push(changeType);
        }

        query += ' ORDER BY detectedAt DESC LIMIT ?';
        params.push(parseInt(limit));

        const changelog = db.prepare(query).all(...params);

        res.json({
            success: true,
            changelog
        });

    } catch (error) {
        console.error('Error getting changelog:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/admin/preview-discovery - Preview what would be discovered
 */
router.post('/api/admin/preview-discovery', async (req, res) => {
    const { services } = req.body;

    // Build command arguments with --dry-run
    const args = ['--dry-run'];
    
    if (services && services.length > 0) {
        args.push('--service', services.join(','));
    }

    try {
        const scriptPath = path.join(__dirname, '..', 'scripts', 'azure-resource-discovery.js');
        const child = spawn('node', [scriptPath, ...args], {
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe'
        });

        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                const preview = parseDiscoveryOutput(output);
                res.json({
                    success: true,
                    preview,
                    output
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Preview failed',
                    output,
                    errorOutput
                });
            }
        });

        child.on('error', (error) => {
            res.status(500).json({
                success: false,
                error: error.message
            });
        });

    } catch (error) {
        console.error('Error previewing discovery:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Parse discovery script output to extract summary
 */
function parseDiscoveryOutput(output) {
    const summary = {
        total: 0,
        new: 0,
        updated: 0,
        unchanged: 0,
        services: []
    };

    // Extract totals from summary section
    const totalMatch = output.match(/Total offerings discovered: (\d+)/);
    const newMatch = output.match(/- New: (\d+)/);
    const updatedMatch = output.match(/- Updated: (\d+)/);
    const unchangedMatch = output.match(/- Unchanged: (\d+)/);

    if (totalMatch) summary.total = parseInt(totalMatch[1]);
    if (newMatch) summary.new = parseInt(newMatch[1]);
    if (updatedMatch) summary.updated = parseInt(updatedMatch[1]);
    if (unchangedMatch) summary.unchanged = parseInt(unchangedMatch[1]);

    // Extract per-service info
    const servicePattern = /\[([^\]]+)\] Found (\d+) offerings/g;
    let match;
    while ((match = servicePattern.exec(output)) !== null) {
        summary.services.push({
            name: match[1],
            count: parseInt(match[2])
        });
    }

    return summary;
}

export default router;
