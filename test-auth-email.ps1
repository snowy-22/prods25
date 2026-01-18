# CanvasFlow Auth & Email Test Suite (PowerShell)
# Test ikinci hesap oluşturma ve email gönderimini

$ApiUrl = "http://localhost:3000/api/auth"
$Timestamp = Get-Date -UFormat %s
$TestEmail = "test2-$Timestamp@example.com"
$TestPassword = "SecurePassword123!"

Write-Host "🧪 CanvasFlow Auth & Email Test Suite" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Signup
Write-Host "📝 Test 1: Signup - Yeni hesap oluştur" -ForegroundColor Yellow
Write-Host "Email: $TestEmail" -ForegroundColor Gray
$SignupBody = @{
    action = "signup"
    email = $TestEmail
    password = $TestPassword
    passwordConfirm = $TestPassword
    name = "Test User 2"
    displayName = "Test2"
} | ConvertTo-Json

try {
    $SignupResponse = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $SignupBody -ContentType "application/json"
    Write-Host "✅ Response:" -ForegroundColor Green
    Write-Host ($SignupResponse | ConvertTo-Json -Depth 3) -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ($_.Exception.Response.Content | ConvertFrom-Json | ConvertTo-Json) -ForegroundColor Red
}
Write-Host ""

# Test 2: Signin
Write-Host "📝 Test 2: Signin - Hesaba giriş yap" -ForegroundColor Yellow
$SigninBody = @{
    action = "signin"
    email = $TestEmail
    password = $TestPassword
} | ConvertTo-Json

try {
    $SigninResponse = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $SigninBody -ContentType "application/json"
    Write-Host "✅ Response:" -ForegroundColor Green
    Write-Host ($SigninResponse | ConvertTo-Json -Depth 3) -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Password Reset
Write-Host "📝 Test 3: Password Reset - Şifremi unuttum" -ForegroundColor Yellow
$ResetBody = @{
    action = "password-reset"
    email = $TestEmail
} | ConvertTo-Json

try {
    $ResetResponse = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $ResetBody -ContentType "application/json"
    Write-Host "✅ Response:" -ForegroundColor Green
    Write-Host ($ResetResponse | ConvertTo-Json -Depth 3) -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Confirm Email
Write-Host "📝 Test 4: Confirm Email - Email doğrulama" -ForegroundColor Yellow
$ConfirmBody = @{
    action = "confirm-email"
    email = $TestEmail
} | ConvertTo-Json

try {
    $ConfirmResponse = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $ConfirmBody -ContentType "application/json"
    Write-Host "✅ Response:" -ForegroundColor Green
    Write-Host ($ConfirmResponse | ConvertTo-Json -Depth 3) -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "✅ Tüm testler tamamlandı!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 Notlar:" -ForegroundColor Magenta
Write-Host "- Emailler şu anda queue'de tutulmaktadır (gerçek gönderim için Resend/SendGrid entegrasyonu gerekli)" -ForegroundColor Gray
Write-Host "- Queue status kontrol etmek için: GET /api/email/queue" -ForegroundColor Gray
Write-Host "- Supabase dashboard'da yeni profil oluşturulmuş olmalı" -ForegroundColor Gray
