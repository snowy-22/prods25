#!/bin/bash

# CanvasFlow Auth & Email Test Suite
# Test ikinci hesap oluşturma ve email gönderimini

API_URL="http://localhost:3000/api/auth"
TIMESTAMP=$(date +%s)

echo "🧪 CanvasFlow Auth & Email Test Suite"
echo "========================================"
echo ""

# Test 1: Signup
echo "📝 Test 1: Signup - Yeni hesap oluştur"
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"signup\",
    \"email\": \"test2-${TIMESTAMP}@example.com\",
    \"password\": \"SecurePassword123!\",
    \"passwordConfirm\": \"SecurePassword123!\",
    \"name\": \"Test User 2\",
    \"displayName\": \"Test2\"
  }")

echo "Response: $SIGNUP_RESPONSE"
echo ""

# Test 2: Signin
echo "📝 Test 2: Signin - Hesaba giriş yap"
SIGNIN_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"signin\",
    \"email\": \"test2-${TIMESTAMP}@example.com\",
    \"password\": \"SecurePassword123!\"
  }")

echo "Response: $SIGNIN_RESPONSE"
echo ""

# Test 3: Password Reset
echo "📝 Test 3: Password Reset - Şifremi unuttum"
RESET_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"password-reset\",
    \"email\": \"test2-${TIMESTAMP}@example.com\"
  }")

echo "Response: $RESET_RESPONSE"
echo ""

# Test 4: Confirm Email
echo "📝 Test 4: Confirm Email - Email doğrulama"
CONFIRM_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"confirm-email\",
    \"email\": \"test2-${TIMESTAMP}@example.com\"
  }")

echo "Response: $CONFIRM_RESPONSE"
echo ""

echo "✅ Tüm testler tamamlandı!"
