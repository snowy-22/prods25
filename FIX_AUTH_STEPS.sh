#!/bin/bash
# Supabase SQL Commands to Fix Authentication

# Run this in Supabase SQL Editor:
# https://app.supabase.com/project/qukzepteomenikeelzno/sql

echo "Paste these commands into Supabase SQL Editor:\n"

cat << 'EOF'
-- ============================================================
-- FIX 1: Add INSERT policy to public.users table
-- ============================================================
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

CREATE POLICY "Users can create own profile"
    ON public.users FOR INSERT
    WITH CHECK (true);  -- Allow service_role trigger to insert


-- ============================================================
-- FIX 2: Recreate trigger function with proper error handling
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ============================================================
-- FIX 3: Create trigger
-- ============================================================
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- VERIFY: Check if it worked
-- ============================================================
-- After running above, test signup at http://localhost:3000/auth
-- or run: node test-direct-signup.mjs
EOF

echo ""
echo "✅ Commands ready to execute in Supabase SQL Editor"
