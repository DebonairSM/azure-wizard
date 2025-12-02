# PowerShell script to check database
$dbPath = ".\db\azure-wizard.db"

Write-Output "=== Database Verification ==="
Write-Output ""

# Check if sqlite3 is available, otherwise use node
if (Get-Command sqlite3 -ErrorAction SilentlyContinue) {
    Write-Output "Using sqlite3..."
    sqlite3 $dbPath "SELECT COUNT(*) as total FROM options WHERE nodeId='root';" | Out-File -FilePath .\db-check.txt
    sqlite3 $dbPath "SELECT label FROM options WHERE nodeId='root' ORDER BY label;" | Out-File -FilePath .\db-options.txt -Append
} else {
    Write-Output "Using node to check database..."
    node -e "const Database = require('better-sqlite3'); const db = new Database('./db/azure-wizard.db'); const count = db.prepare('SELECT COUNT(*) as total FROM options WHERE nodeId=?').get('root'); console.log('Total options:', count.total); const opts = db.prepare('SELECT label, LENGTH(pros) as pros_len, LENGTH(cons) as cons_len FROM options WHERE nodeId=? ORDER BY label').all('root'); opts.forEach(o => console.log('- ' + o.label + ' (Pros: ' + o.pros_len + ', Cons: ' + o.cons_len + ')')); db.close();" | Out-File -FilePath .\db-check.txt
}

Write-Output "Results saved to db-check.txt"
Get-Content .\db-check.txt


