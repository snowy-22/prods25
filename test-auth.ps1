# Auth System Quick Test Guide (PowerShell)
# Run this to verify all authentication methods work

Write-Host "🔐 CanvasFlow Authentication Test Guide" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if npm is available
try {
    npm --version > $null 2>&1
} catch {
    Write-Host "❌ npm not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "1️⃣  Starting dev server..." -ForegroundColor Yellow
npm run dev

# Note: This will run indefinitely, user must press Ctrl+C to stop
