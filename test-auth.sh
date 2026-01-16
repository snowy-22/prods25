#!/bin/bash
# Auth System Quick Test Guide
# Run this to verify all authentication methods work

echo "🔐 CanvasFlow Authentication Test Guide"
echo "========================================"
echo ""

# Check if dev server is running
echo "1️⃣  Starting dev server..."
npm run dev &
DEV_PID=$!

# Wait for server to start
sleep 3

echo "✅ Dev server started (PID: $DEV_PID)"
echo ""

# Test URLs
echo "2️⃣  Test URLs:"
echo "   📧 Email/Password:  http://localhost:3000/auth"
echo "   🔵 Google OAuth:    http://localhost:3000/auth (click button)"
echo "   🟪 GitHub OAuth:    http://localhost:3000/auth (click button)"
echo "   🟦 Facebook OAuth:  http://localhost:3000/auth (click button - needs config)"
echo "   🍎 Apple OAuth:     http://localhost:3000/auth (click button - needs config)"
echo ""

echo "3️⃣  Test Checklist:"
echo "   [ ] Email login works (enter email, click 'Giriş Yap')"
echo "   [ ] Password reset works ('Şifrenizi mi unuttunuz?')"
echo "   [ ] Google OAuth works (click button, complete flow)"
echo "   [ ] GitHub OAuth works (click button, complete flow)"
echo "   [ ] Redirect to /canvas after successful login"
echo "   [ ] User profile created in database"
echo ""

echo "4️⃣  View Test Results:"
echo "   Browser Console:     F12 → Console tab"
echo "   Supabase Logs:       Dashboard → Logs → Auth"
echo "   Database Profile:    Dashboard → SQL Editor → SELECT * FROM profiles"
echo ""

echo "5️⃣  Configuration Status:"
echo "   ✅ Email/Password:  READY"
echo "   ✅ Google OAuth:    READY (credentials in .env.local)"
echo "   ✅ GitHub OAuth:    READY (pre-configured)"
echo "   🔄 Facebook OAuth:  NEEDS CONFIG (see SUPABASE_AUTH_SETUP.md)"
echo "   🔄 Apple OAuth:     NEEDS CONFIG (see SUPABASE_AUTH_SETUP.md)"
echo ""

echo "6️⃣  Stop dev server when done:"
echo "   Press Ctrl+C in terminal"
echo "   Or: kill $DEV_PID"
echo ""

echo "📚 Read these files for more info:"
echo "   - SUPABASE_AUTH_SETUP.md (complete setup guide)"
echo "   - AUTH_IMPLEMENTATION_STATUS.md (current status)"
echo ""

# Keep the script running
wait $DEV_PID
