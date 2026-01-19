# Fix Supabase createClient() calls in API routes
# This script adds 'await' keyword to all createClient() calls

$files = Get-ChildItem -Path "src\app\api" -Recurse -Filter "*.ts"

$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Skip if already has await
    if ($content -notmatch 'const supabase = await createClient\(\)') {
        # Replace const supabase = createClient() with const supabase = await createClient()
        $newContent = $content -replace 'const supabase = createClient\(\);', 'const supabase = await createClient();'
        
        if ($newContent -ne $content) {
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
            Write-Host "✅ Fixed: $($file.Name)" -ForegroundColor Green
            $count++
        }
    }
}

Write-Host "`n✨ Total files fixed: $count" -ForegroundColor Cyan
