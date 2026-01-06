-- =====================================================
-- USER ROLES & PERMISSIONS SYSTEM
-- Global roles and organization-level permissions
-- =====================================================

-- =====================================================
-- 1. GLOBAL USER ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active, expires_at);

-- RLS for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User roles viewable by all authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "User roles viewable by all authenticated users" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage roles" 
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = TRUE
    )
  );

CREATE POLICY "Users can view own roles" 
  ON public.user_roles FOR SELECT 
  USING (user_id = auth.uid());

-- =====================================================
-- 2. ORGANIZATION ROLES TABLE (Separate from Members)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organization_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'member', 'viewer')),
  
  -- Permissions
  can_manage_members BOOLEAN DEFAULT FALSE,
  can_manage_content BOOLEAN DEFAULT FALSE,
  can_post BOOLEAN DEFAULT TRUE,
  can_comment BOOLEAN DEFAULT TRUE,
  can_invite BOOLEAN DEFAULT FALSE,
  can_manage_settings BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_roles_org_id ON public.organization_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_roles_user_id ON public.organization_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_org_roles_role ON public.organization_roles(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_org_roles_active ON public.organization_roles(is_active);

-- RLS for organization_roles
ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org roles viewable by members" ON public.organization_roles;
DROP POLICY IF EXISTS "Org admins can manage roles" ON public.organization_roles;

CREATE POLICY "Org roles viewable by members" 
  ON public.organization_roles FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.organization_roles or2
      WHERE or2.organization_id = organization_roles.organization_id
      AND or2.user_id = auth.uid()
      AND or2.is_active = TRUE
    )
  );

CREATE POLICY "Org admins can manage roles" 
  ON public.organization_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_roles or2
      WHERE or2.organization_id = organization_roles.organization_id
      AND or2.user_id = auth.uid()
      AND or2.role IN ('owner', 'admin')
      AND or2.is_active = TRUE
    )
  );

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Check if user has global admin role
CREATE OR REPLACE FUNCTION public.is_global_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
    AND role IN ('admin', 'super_admin')
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific role in organization
CREATE OR REPLACE FUNCTION public.has_org_role(
  check_user_id UUID,
  check_org_id UUID,
  required_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_roles
    WHERE user_id = check_user_id
    AND organization_id = check_org_id
    AND role = required_role
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage organization
CREATE OR REPLACE FUNCTION public.can_manage_org(
  check_user_id UUID,
  check_org_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_roles
    WHERE user_id = check_user_id
    AND organization_id = check_org_id
    AND role IN ('owner', 'admin')
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. TRIGGER FUNCTIONS
-- =====================================================

-- Auto-assign 'user' role to new users
CREATE OR REPLACE FUNCTION public.assign_default_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (NEW.id, 'user', TRUE)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_assign_default_user_role ON auth.users;
CREATE TRIGGER trg_assign_default_user_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_user_role();

-- Auto-expire roles
CREATE OR REPLACE FUNCTION public.auto_expire_roles()
RETURNS void AS $$
BEGIN
  -- Expire global roles
  UPDATE public.user_roles
  SET is_active = FALSE
  WHERE expires_at < NOW() AND is_active = TRUE;
  
  -- Expire organization roles
  UPDATE public.organization_roles
  SET is_active = FALSE
  WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. PERMISSIONS TABLE (Fine-grained permissions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'post', 'comment', 'folder', 'scene', etc.
  resource_id TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'delete', 'share', 'admin')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(user_id, resource_type, resource_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON public.permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON public.permissions(is_active, expires_at);

-- RLS for permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissions viewable by owner or admins" ON public.permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;

CREATE POLICY "Permissions viewable by owner or admins" 
  ON public.permissions FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR public.is_global_admin(auth.uid())
  );

CREATE POLICY "Admins can manage permissions" 
  ON public.permissions FOR ALL
  USING (public.is_global_admin(auth.uid()));

-- =====================================================
-- 6. REALTIME SUBSCRIPTIONS
-- =====================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_roles;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.permissions;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- =====================================================
-- 7. SEED DEFAULT ROLES (Optional)
-- =====================================================

COMMENT ON TABLE public.user_roles IS 'Global user roles and permissions';
COMMENT ON TABLE public.organization_roles IS 'Organization-specific roles and permissions';
COMMENT ON TABLE public.permissions IS 'Fine-grained resource-level permissions';
