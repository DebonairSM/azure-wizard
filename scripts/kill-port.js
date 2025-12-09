// Helper script to kill a process using a specific port
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const port = process.argv[2] || process.env.PORT || '3030';

console.log(`Finding process using port ${port}...`);

try {
    // Find the process ID using the port
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    
    if (!stdout.trim()) {
        console.log(`No process found using port ${port}`);
        process.exit(0);
    }

    // Extract PID from netstat output
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
            pids.add(pid);
        }
    }

    if (pids.size === 0) {
        console.log(`Could not extract PID from netstat output`);
        process.exit(1);
    }

    console.log(`Found ${pids.size} process(es) using port ${port}:`);
    for (const pid of pids) {
        try {
            const { stdout: taskInfo } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
            console.log(`  PID ${pid}: ${taskInfo.trim()}`);
        } catch (e) {
            console.log(`  PID ${pid}: (process info unavailable)`);
        }
    }

    // Kill the processes
    for (const pid of pids) {
        try {
            console.log(`\nKilling process ${pid}...`);
            await execAsync(`taskkill /PID ${pid} /F`);
            console.log(`✓ Process ${pid} terminated`);
        } catch (e) {
            console.error(`✗ Failed to kill process ${pid}: ${e.message}`);
        }
    }

    console.log(`\n✓ Port ${port} should now be free`);
} catch (error) {
    if (error.stdout && error.stdout.includes('findstr')) {
        console.log(`No process found using port ${port}`);
    } else {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}
















