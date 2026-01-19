# 🚀 Vercel Domain Migration Checklist

## ✅ Completed Actions
- [x] Domain moved to Vercel project
- [x] Environment variables configured in `.env.local`

## 🔧 Critical Configuration Steps

### 1. Supabase Authentication Redirect URLs

**Current Domain:** `https://tv25.app`

#### Required Actions in Supabase Dashboard:

1. **Navigate to:** Supabase Dashboard → Authentication → URL Configuration

2. **Update these URLs:**

   **Site URL:**
   ```
   https://tv25.app
   ```

   **Redirect URLs (add all):**
   ```
   https://tv25.app
   https://tv25.app/auth/callback
   https://tv25.app/auth/confirm
   http://localhost:3000
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/confirm
   ```

   **Additional Redirect URLs (optional):**
   ```
   https://*.vercel.app
   https://*.vercel.app/auth/callback
   https://*.vercel.app/auth/confirm
   ```

#### Why This is Critical:
- Without correct redirect URLs, auth signup/signin will fail
- Password reset emails won't work
- Email confirmation links will be broken

---

### 2. CORS Configuration

Verify CORS settings in Supabase allow your domain.

**Check in:** Supabase Dashboard → Settings → API

Should include:
```
https://tv25.app
http://localhost:3000
```

---

### 3. Environment Variables in Vercel

Ensure these are set in **Vercel Dashboard → Project Settings → Environment Variables:**

#### Required for Production:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://qukzepteomenikeelzno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_pOysGok_b2eHkSxtm_yKQA_mEdVGfBi
NEXT_PUBLIC_APP_URL=https://tv25.app
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Required for Development:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://qukzepteomenikeelzno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_pOysGok_b2eHkSxtm_yKQA_mEdVGfBi
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 4. Email Template Links

Check Supabase email templates contain correct domain:

**Navigate to:** Supabase Dashboard → Authentication → Email Templates

**Templates to verify:**
- Confirm signup
- Magic Link
- Change Email Address
- Reset Password

**Ensure all use:** `{{ .SiteURL }}`

---

### 5. Next.js Middleware (Optional)

If using middleware for auth, verify redirect logic:

**File:** `src/middleware.ts`

Should use environment variable:
```typescript
const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
```

---

## 🧪 Testing Checklist

### Test Authentication Flow:

1. **Signup Test:**
```bash
curl -X POST https://tv25.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "signup",
    "email": "test@example.com",
    "password": "TestPass123!",
    "passwordConfirm": "TestPass123!",
    "name": "Test User"
  }'
```

2. **Expected Result:**
   - ✅ Email sent successfully
   - ✅ Confirmation link works
   - ✅ Redirect to correct domain after confirmation

3. **Password Reset Test:**
```bash
curl -X POST https://tv25.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "password-reset",
    "email": "test@example.com"
  }'
```

4. **Expected Result:**
   - ✅ Reset email received
   - ✅ Reset link points to tv25.app
   - ✅ Password reset successful

---

## 🚨 Common Issues After Domain Migration

### Issue 1: "Invalid redirect URL" error
**Solution:** Add domain to Supabase redirect URLs (see step 1)

### Issue 2: CORS errors
**Solution:** Update CORS in Supabase API settings

### Issue 3: Email links point to old domain
**Solution:** Update Site URL in Supabase

### Issue 4: Local development broken
**Solution:** Keep localhost URLs in redirect list

---

## ✅ Verification Commands

### Check Environment Variables:
```bash
# In Vercel deployment
echo $NEXT_PUBLIC_APP_URL
# Should output: https://tv25.app
```

### Check Supabase Connection:
```bash
curl https://qukzepteomenikeelzno.supabase.co/rest/v1/ \
  -H "apikey: sb_publishable_pOysGok_b2eHkSxtm_yKQA_mEdVGfBi"
# Should return API info
```

---

## 📝 Next Steps

1. [ ] Update Supabase Redirect URLs
2. [ ] Verify CORS settings
3. [ ] Test signup flow
4. [ ] Test password reset
5. [ ] Test email confirmation
6. [ ] Verify all env vars in Vercel
7. [ ] Test production deployment

---

## 🔗 Useful Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/qukzepteomenikeelzno
- **Vercel Dashboard:** https://vercel.com/your-team/prods25
- **Production Site:** https://tv25.app
- **Documentation:** [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

---

## 📞 Need Help?

If authentication still fails after these steps:
1. Check Supabase logs in Dashboard → Logs → Auth
2. Check browser console for errors
3. Verify email delivery in email provider logs

