# Fix Next.js 15 async params in API routes

Write-Host "Fixing Next.js 15 async params..." -ForegroundColor Cyan

# Find all route files with [id], [itemId], [slug] etc.
$files = Get-ChildItem -Path "src\app\api" -Recurse -Filter "*.ts" | Where-Object { $_.DirectoryName -match '\[.*\]' }

$fixedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName | Out-String
    $modified = $false
    
    # Fix RouteParams interface - change to Promise
    if ($content -match 'interface RouteParams\s*\{\s*params:\s*\{') {
        $content = $content -replace '(interface RouteParams\s*\{\s*params:)\s*(\{[^}]+\})', '$1 Promise<$2>'
        $modified = $true
    }
    
    # Fix function signatures - add await for params
    # Pattern 1: export async function GET(request: NextRequest, { params }: RouteParams)
    if ($content -match 'export async function (GET|POST|PATCH|PUT|DELETE)\(request: NextRequest, \{ params \}: RouteParams\)') {
        # Add const { id/itemId/slug } = await params; after try {
        if ($content -match 'try \{' -and $content -notmatch 'const \{ \w+ \} = await params;') {
            # Find the param name from the interface
            if ($content -match 'params: Promise<\{\s*(\w+):\s*string') {
                $paramName = $matches[1]
                $content = $content -replace '(try \{)', "`$1`n    const { $paramName } = await params;"
                $modified = $true
            }
        }
    }
    
    # Fix direct params.id usage -> change to id (after destructuring)
    $content = $content -replace 'params\.(id|itemId|slug|groupId)', '$1'
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
        $fixedCount++
    }
}

Write-Host "`nTotal files fixed: $fixedCount" -ForegroundColor Cyan
