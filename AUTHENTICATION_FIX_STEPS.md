# Supabase Authentication Fix - DO THIS MANUALLY

## Step 1: Disable Email Confirmation (Development)
1. Go to: https://app.supabase.com
2. Select project: **qukzepteomenikeelzno**
3. Go to: **Authentication** → **Providers** (top menu)
4. Find **Email** provider
5. Toggle OFF: "Confirm email" checkbox
6. Click **Save**

## Step 2: Create Test User
1. Go to: **Authentication** → **Users**
2. Click **Add user** button (top right)
3. Email: `test@example.com`
4. Password: `Test123!@#`
5. Check **Auto confirm user** checkbox
6. Click **Create user**

## Step 3: Test Login
Once user is created, run:
```bash
node test-login-direct.mjs
```

Should see: ✅ Login successful!

## Step 4: Manual Test in Browser
1. Go to http://localhost:3000/auth
2. Click "Giriş Yap" (Login) tab
3. Enter:
   - Email: test@example.com
   - Password: Test123!@#
4. Click "Giriş Yap"

Expected result: Should redirect to http://localhost:3000/canvas

---

## Why This Failed?

**Root Cause**: The `handle_new_user()` trigger was trying to insert into `public.profiles` table that doesn't exist.

**What We Fixed**:
- Changed trigger to INSERT into `public.users` (the actual table)
- Added `username` and `full_name` columns with defaults
- Now when auth.users record is created, trigger automatically creates matching profile in public.users

**Email Confirmation Issue**:
- Supabase Auth requires email confirmation by default
- User record created but trigger might not fire until email is confirmed
- For development: DISABLE "Confirm email" requirement

---

## If Manual Creation Doesn't Work

Try creating user via API with confirmed status:

```bash
node test-create-confirmed-user.mjs
```

This will use the admin API key (requires Supabase Service Role key - don't have in env).
