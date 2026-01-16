# 🔐 Supabase Authentication Setup Guide

**Status:** ✅ Code deployed to GitHub (commit 385ce32)

---

## 📋 Overview

Your CanvasFlow application now supports **4 authentication methods**:
1. ✅ **Email/Password** - Email validation + password reset
2. ✅ **Google OAuth** - Credentials already updated
3. ✅ **GitHub OAuth** - Already configured
4. 🆕 **Facebook OAuth** - UI ready, needs Supabase config
5. 🆕 **Apple OAuth** - UI ready, needs Supabase config

---

## 🔧 Step 1: Email/Password Configuration

### Current Status: ✅ READY

Email authentication is **already configured** in Supabase with:
- Email confirmation enabled
- Password reset via email link
- User metadata for profile creation

**No action needed** - email login works out of the box.

### Test Email Login Locally:
```bash
# 1. Start dev server
npm run dev

# 2. Visit http://localhost:3000/auth
# 3. Click "Giriş Yap" tab
# 4. Enter email and password
# 5. Should redirect to dashboard or show error
```

---

## 🔵 Step 2: Google OAuth Setup

### Current Status: ✅ COMPLETE

Google OAuth credentials have been **rotated and updated** in `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=[in .env.local]
GOOGLE_CLIENT_SECRET=[in .env.local]
```

Note: Credentials are stored in `.env.local` which is not tracked in Git.

### In Supabase Dashboard:
1. Go to **Authentication → Providers → Google**
2. Verify credentials are set correctly
3. Authorized redirect URI should include:
   - `https://qukzepteomenikeelzno.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)

### Test Google Login:
- Visit http://localhost:3000/auth
- Click "Google ile Giriş"
- Should redirect to Google login, then back to your app

---

## 🟦 Step 3: Facebook OAuth Setup ⭐ REQUIRED

### Prerequisites:
You need Facebook App credentials from [Meta Developers Console](https://developers.facebook.com)

### Get Facebook Credentials:

1. **Go to Meta Developers Console:**
   - Visit https://developers.facebook.com
   - Log in with your Meta/Facebook account
   - Go to "My Apps" → Click your app (or create new)

2. **Find App ID and Secret:**
   - Click "Settings" → "Basic"
   - Copy **App ID**
   - Copy **App Secret** (may need to verify password)

3. **Configure OAuth Redirect:**
   - In Meta console, go to "Settings" → "Basic"
   - Under "App Domains", add: `localhost` and `tv25.app`
   - Under "Facebook Login" settings, add these Valid OAuth Redirect URIs:
     - `https://qukzepteomenikeelzno.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback`

### In Supabase Dashboard:

1. Go to **Authentication → Providers → Facebook**
2. Toggle **Enable Facebook Provider**
3. Paste your Facebook App credentials:
   - **Client ID:** `YOUR_FACEBOOK_APP_ID`
   - **Client Secret:** `YOUR_FACEBOOK_APP_SECRET`
4. Click **Save**

### Test Facebook Login:
- Visit http://localhost:3000/auth
- Click "Facebook ile Giriş"
- Should redirect to Facebook login, then back to your app

---

## 🍎 Step 4: Apple OAuth Setup ⭐ REQUIRED

### Prerequisites:
You need Apple Developer credentials from [Apple Developer](https://developer.apple.com)

### Get Apple Credentials:

1. **Go to Apple Developer Console:**
   - Visit https://developer.apple.com
   - Sign in with your Apple ID
   - Go to **Certificates, Identifiers & Profiles**

2. **Create/Get App ID:**
   - Go to **Identifiers** → Click **+** button
   - Select **App IDs** → Continue
   - Fill in details:
     - **App Type:** App
     - **Description:** CanvasFlow or TV25
     - **Bundle ID:** com.tv25app.canvasflow
   - Check **Sign in with Apple** capability
   - Continue and Register

3. **Create Service ID:**
   - Go to **Identifiers** → Click **+** button
   - Select **Services IDs** → Continue
   - Fill in:
     - **Description:** CanvasFlow Service
     - **Identifier:** com.tv25app.canvasflow.service
   - Check **Sign in with Apple** capability
   - Continue → Register
   
4. **Configure Service ID:**
   - Click on your newly created Service ID
   - Under **Sign in with Apple** → Configure
   - Add these domains/URLs:
     - **Domains and Subdomains:** 
       - `localhost`
       - `tv25.app`
       - `qukzepteomenikeelzno.supabase.co`
     - **Return URLs:**
       - `https://qukzepteomenikeelzno.supabase.co/auth/v1/callback`
       - `http://localhost:3000/auth/callback`
   - Save

5. **Create Authentication Key:**
   - Go to **Keys** → Click **+** button
   - Check **Sign in with Apple** capability
   - Continue → Register
   - Download the `.p8` file (save securely!)
   - Note down your:
     - **Key ID** (8-character identifier)
     - **Team ID** (10-character identifier from top-right of developer.apple.com)

### In Supabase Dashboard:

1. Go to **Authentication → Providers → Apple**
2. Toggle **Enable Apple Provider**
3. Fill in Apple credentials:
   - **Client ID:** `com.tv25app.canvasflow.service`
   - **Team ID:** `YOUR_TEAM_ID` (from Apple Developer)
   - **Key ID:** `YOUR_KEY_ID` (from key you created)
   - **Private Key:** Paste contents of downloaded `.p8` file
4. Click **Save**

### Test Apple Login:
- Visit http://localhost:3000/auth
- Click "Apple ile Giriş"
- Should redirect to Apple login, then back to your app

---

## 🔗 Callback URL Configuration

All OAuth providers redirect to this URL:
```
https://qukzepteomenikeelzno.supabase.co/auth/v1/callback
```

**Ensure ALL providers have this URL configured** in their respective consoles.

---

## 🧪 Testing Checklist

### Email/Password:
- [ ] Visit `/auth` → Enter email and password → Login works
- [ ] Click "Şifrenizi mi unuttunuz?" → Email reset works
- [ ] Create new account with signup form

### Google:
- [ ] Click "Google ile Giriş"
- [ ] Complete Google login flow
- [ ] Redirected back to app authenticated

### GitHub:
- [ ] Click "GitHub ile Giriş"
- [ ] Complete GitHub login flow
- [ ] Redirected back to app authenticated

### Facebook:
- [ ] Click "Facebook ile Giriş"
- [ ] Complete Facebook login flow
- [ ] Redirected back to app authenticated

### Apple:
- [ ] Click "Apple ile Giriş"
- [ ] Complete Apple login flow
- [ ] Redirected back to app authenticated

---

## 📊 Database Schema

Verify these tables exist in Supabase:

### `auth.users` (Auto-created by Supabase)
```sql
- id (UUID)
- email (TEXT)
- encrypted_password (TEXT)
- email_confirmed_at (TIMESTAMP)
- raw_user_meta_data (JSONB)
- raw_app_meta_data (JSONB)
```

### `profiles` (Custom table)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

If `profiles` table doesn't exist, create it via Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles
CREATE POLICY "Profiles are public"
  ON profiles FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

## 🚀 Deployment Status

### ✅ Completed:
- Code committed to GitHub (commit 385ce32)
- Email/password authentication ready
- Google OAuth credentials updated
- GitHub OAuth already configured
- Facebook OAuth UI + backend ready
- Apple OAuth UI + backend ready
- Production build verified (18.3s)

### ⏳ Pending:
- [ ] Configure Facebook provider in Supabase (requires Meta credentials)
- [ ] Configure Apple provider in Supabase (requires Apple Developer credentials)
- [ ] Test complete authentication flow with all 4 methods
- [ ] Deploy to production server

---

## 🔗 Important Links

| Service | Link | Status |
|---------|------|--------|
| Supabase Dashboard | https://supabase.com/dashboard/project/qukzepteomenikeelzno | ✅ Active |
| GitHub Repo | https://github.com/snowy-22/prods25 | ✅ Updated (385ce32) |
| Google API Console | https://console.developers.google.com | ✅ Credentials Updated |
| Meta Developers | https://developers.facebook.com | 🆕 Needs Setup |
| Apple Developer | https://developer.apple.com | 🆕 Needs Setup |
| Local Dev Server | http://localhost:3000 | 🔧 Run `npm run dev` |

---

## 💡 Quick Reference

**Start development server:**
```bash
npm run dev
```

**Test authentication:**
```
http://localhost:3000/auth
```

**View Supabase logs:**
```
Supabase Dashboard → Logs → Auth
```

**Check environment variables:**
```bash
cat .env.local
```

---

## ❓ Troubleshooting

### Email confirmation not working?
- Go to Supabase → Authentication → Email Templates
- Check if template is enabled
- Look for email in spam folder

### OAuth callback errors?
- Verify redirect URI matches in **ALL** providers
- Check `.env.local` has correct Client ID
- Clear browser cookies and cache

### Profile not created after login?
- Check `profiles` table exists (see Database Schema above)
- Check Supabase RLS policies allow insert
- Check server logs for errors

### Password reset not sending?
- Verify SMTP credentials in Supabase → Settings → Email
- Check email templates exist
- Look for email in spam/promotions folder

---

## 📝 Next Steps

1. **Gather OAuth credentials:**
   - Facebook App ID + Secret
   - Apple Team ID, Key ID + Private Key

2. **Configure Supabase:**
   - Enter credentials for Facebook
   - Enter credentials for Apple

3. **Test all methods:**
   - Follow testing checklist above

4. **Monitor logs:**
   - Supabase Dashboard → Logs
   - GitHub → Deployments

---

**Questions?** Check:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Facebook Login Docs](https://developers.facebook.com/docs/facebook-login)
- [Apple Sign in Docs](https://developer.apple.com/sign-in-with-apple/)

---

*Last updated: After GitHub commit 385ce32*
*Auth System Status: 🟢 4/4 providers ready (2 pending Supabase config)*
