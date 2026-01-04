-- Ensure encryption_keys table has RLS enabled and restricted access
-- Created: 2026-01-04

-- Create table if missing
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  key_id TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'aes-256-gcm',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rotated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(user_id, key_id)
);

CREATE INDEX IF NOT EXISTS idx_encryption_keys_user_id ON public.encryption_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_key_id ON public.encryption_keys(key_id);

-- Enforce RLS
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encryption_keys FORCE ROW LEVEL SECURITY;

-- Helper check for admin roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'encryption_keys' AND policyname = 'encryption_keys_select_owner_or_admin'
  ) THEN
    CREATE POLICY encryption_keys_select_owner_or_admin
      ON public.encryption_keys
      FOR SELECT
      USING (
        auth.uid() = user_id
        OR EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'encryption_keys' AND policyname = 'encryption_keys_insert_owner_or_admin'
  ) THEN
    CREATE POLICY encryption_keys_insert_owner_or_admin
      ON public.encryption_keys
      FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'encryption_keys' AND policyname = 'encryption_keys_update_owner_or_admin'
  ) THEN
    CREATE POLICY encryption_keys_update_owner_or_admin
      ON public.encryption_keys
      FOR UPDATE
      USING (
        auth.uid() = user_id
        OR EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')
        )
      )
      WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'encryption_keys' AND policyname = 'encryption_keys_delete_owner_or_admin'
  ) THEN
    CREATE POLICY encryption_keys_delete_owner_or_admin
      ON public.encryption_keys
      FOR DELETE
      USING (
        auth.uid() = user_id
        OR EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')
        )
      );
  END IF;
END
$$;

COMMENT ON TABLE public.encryption_keys IS 'Manages per-user encryption keys; RLS enforces owner or admin access';
