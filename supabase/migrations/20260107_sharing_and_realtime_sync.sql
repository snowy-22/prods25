-- =====================================================
-- SHARING SYSTEM + REALTIME MULTI-TAB SYNC
-- Paylaşılan öğeler, izinler ve tüm sekmelerde canlı senkronizasyon
-- 2026-01-07
-- =====================================================

-- =====================================================
-- 1. SHARED ITEMS TABLE (Paylaşılan Öğeler)
-- =====================================================
CREATE TABLE IF NOT EXISTS shared_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(item_id, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_items_owner_id ON shared_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_item_id ON shared_items(item_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_updated ON shared_items(updated_at DESC);

-- =====================================================
-- 2. SHARING PERMISSIONS TABLE (Paylaşım İzinleri)
-- =====================================================
CREATE TABLE IF NOT EXISTS sharing_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_item_id UUID NOT NULL REFERENCES shared_items(id) ON DELETE CASCADE,
  grantee_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  grantee_email TEXT,
  grantee_role TEXT NOT NULL DEFAULT 'viewer' 
    CHECK (grantee_role IN ('viewer', 'commenter', 'editor', 'owner')),
  
  -- Permission details
  can_view BOOLEAN DEFAULT TRUE,
  can_comment BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_share BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Tracking
  granted_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sharing_perms_shared_item ON sharing_permissions(shared_item_id);
CREATE INDEX IF NOT EXISTS idx_sharing_perms_grantee_user ON sharing_permissions(grantee_user_id);
CREATE INDEX IF NOT EXISTS idx_sharing_perms_grantee_email ON sharing_permissions(grantee_email);
CREATE INDEX IF NOT EXISTS idx_sharing_perms_expires ON sharing_permissions(expires_at) 
  WHERE expires_at IS NOT NULL AND is_active = true;

-- Auto-expire permissions trigger
CREATE OR REPLACE FUNCTION auto_expire_sharing_permissions()
RETURNS void AS $$
BEGIN
  UPDATE sharing_permissions
  SET is_active = FALSE
  WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. SHARING LINKS TABLE (Paylaşım Bağlantıları)
-- =====================================================
CREATE TABLE IF NOT EXISTS sharing_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_item_id UUID NOT NULL REFERENCES shared_items(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Slug System (Custom or Random)
  custom_slug TEXT UNIQUE,
  random_slug TEXT UNIQUE DEFAULT substring(md5(random()::text || now()::text) from 1 for 8),
  slug_type TEXT DEFAULT 'random' CHECK (slug_type IN ('custom', 'random')),
  
  -- Link settings
  is_public BOOLEAN DEFAULT FALSE,
  allow_download BOOLEAN DEFAULT FALSE,
  allow_preview BOOLEAN DEFAULT TRUE,
  allow_comments BOOLEAN DEFAULT FALSE,
  
  -- Export & Watermark Settings
  export_formats TEXT[] DEFAULT ARRAY['json']::TEXT[],
  watermark_enabled BOOLEAN DEFAULT TRUE,
  watermark_text TEXT DEFAULT 'Shared via CanvasFlow',
  watermark_position TEXT DEFAULT 'bottom-right' CHECK (watermark_position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center')),
  
  -- UTM Tracking Parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Access tracking
  access_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  title TEXT,
  description TEXT,
  
  -- Timestamps
  created_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure either custom_slug or random_slug is used
  CHECK (
    (slug_type = 'custom' AND custom_slug IS NOT NULL) OR
    (slug_type = 'random' AND random_slug IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_sharing_links_token ON sharing_links(share_token);
CREATE INDEX IF NOT EXISTS idx_sharing_links_shared_item ON sharing_links(shared_item_id);
CREATE INDEX IF NOT EXISTS idx_sharing_links_active ON sharing_links(is_active, expires_at) 
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sharing_links_custom_slug ON sharing_links(custom_slug) WHERE custom_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sharing_links_random_slug ON sharing_links(random_slug) WHERE random_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sharing_links_utm_source ON sharing_links(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sharing_links_utm_campaign ON sharing_links(utm_campaign) WHERE utm_campaign IS NOT NULL;

-- =====================================================
-- 4. SHARING ACCESS LOG (Paylaşım Erişim Günlüğü)
-- =====================================================
CREATE TABLE IF NOT EXISTS sharing_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sharing_link_id UUID NOT NULL REFERENCES sharing_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  action TEXT NOT NULL CHECK (action IN ('view', 'download', 'comment', 'share', 'export_json', 'export_html')),
  
  -- UTM Parameters (captured from URL)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Referrer tracking
  referrer_url TEXT,
  referrer_domain TEXT,
  
  -- Geographic data (optional - can be enriched via IP)
  country TEXT,
  city TEXT,
  
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_log_link ON sharing_access_log(sharing_link_id);
CREATE INDEX IF NOT EXISTS idx_access_log_user ON sharing_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_accessed_at ON sharing_access_log(accessed_at DESC);

-- =====================================================
-- 5. MULTI-TAB SYNC LOG (Tüm Sekmeler Arası Senkronizasyon)
-- =====================================================
CREATE TABLE IF NOT EXISTS multi_tab_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Device ve Tab bilgisi
  device_id TEXT NOT NULL,
  tab_id TEXT NOT NULL,
  browser_name TEXT,
  browser_version TEXT,
  
  -- Senkronizasyon verileri
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'canvas_item', 'visual_update', 'layout_change', 'style_update',
    'post', 'comment', 'like', 'message', 'shared_item', 'sharing_link',
    'folder_share', 'export_json', 'export_html'
  )),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view')),
  
  -- Change details
  change_data JSONB DEFAULT '{}'::jsonb,
  previous_state JSONB,
  new_state JSONB,
  
  -- Status
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict', 'error')),
  error_message TEXT,
  
  -- Timestamps
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  
  -- Version control
  version_number INTEGER DEFAULT 1,
  conflict_resolution_id UUID REFERENCES multi_tab_sync(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_user_id ON multi_tab_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_device_tab ON multi_tab_sync(user_id, device_id, tab_id);
CREATE INDEX IF NOT EXISTS idx_sync_entity ON multi_tab_sync(user_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_occurred ON multi_tab_sync(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_status ON multi_tab_sync(sync_status) WHERE sync_status != 'synced';

-- =====================================================
-- 6. SOCIAL REALTIME UPDATES (Sosyal Canlı Güncellemeler)
-- =====================================================
CREATE TABLE IF NOT EXISTS social_realtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'post_created', 'post_updated', 'post_deleted',
    'comment_added', 'comment_updated', 'comment_deleted',
    'like_added', 'like_removed',
    'follow_added', 'follow_removed',
    'profile_updated'
  )),
  
  -- Target entity
  target_entity_type TEXT CHECK (target_entity_type IN ('post', 'comment', 'profile', 'user')),
  target_entity_id TEXT,
  
  -- Actor (who did this)
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event data
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Delivery tracking
  delivered_to_tabs TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_events_user ON social_realtime_events(user_id);
CREATE INDEX IF NOT EXISTS idx_social_events_type ON social_realtime_events(event_type);
CREATE INDEX IF NOT EXISTS idx_social_events_created ON social_realtime_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_events_actor ON social_realtime_events(actor_id);

-- =====================================================
-- 7. MESSAGE REALTIME DELIVERY (Mesaj Canlı Gönderimi)
-- =====================================================
CREATE TABLE IF NOT EXISTS message_delivery_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Delivery status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  
  -- Timestamps
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Device tracking
  delivered_on_device_id TEXT,
  delivered_on_tab_ids TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_msg_delivery_recipient ON message_delivery_status(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_msg_delivery_status ON message_delivery_status(status);
CREATE INDEX IF NOT EXISTS idx_msg_delivery_sent ON message_delivery_status(sent_at DESC);

-- =====================================================
-- 8. ENSURE UPDATED_AT COLUMNS EXIST (Safety Check)
-- =====================================================

-- Add updated_at column to existing tables if missing
DO $$
BEGIN
  -- shared_items
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shared_items' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE shared_items ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- sharing_permissions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sharing_permissions' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE sharing_permissions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- sharing_links
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sharing_links' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE sharing_links ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END
$$;

-- =====================================================
-- 9. RLS POLICIES
-- =====================================================

-- Shared Items RLS
ALTER TABLE shared_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see items they own"
  ON shared_items FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create shared items"
  ON shared_items FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can modify their shared items"
  ON shared_items FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their shared items"
  ON shared_items FOR DELETE
  USING (owner_id = auth.uid());

-- Sharing Permissions RLS
ALTER TABLE sharing_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see permissions on items they own"
  ON sharing_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_items
      WHERE shared_items.id = sharing_permissions.shared_item_id
      AND shared_items.owner_id = auth.uid()
    ) OR
    grantee_user_id = auth.uid()
  );

CREATE POLICY "Item owners can grant permissions"
  ON sharing_permissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shared_items
      WHERE shared_items.id = sharing_permissions.shared_item_id
      AND shared_items.owner_id = auth.uid()
    )
  );

-- Sharing Links RLS
ALTER TABLE sharing_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see links they created"
  ON sharing_links FOR SELECT
  USING (created_by_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create links"
  ON sharing_links FOR INSERT
  WITH CHECK (created_by_id = auth.uid());

CREATE POLICY "Users can modify their links"
  ON sharing_links FOR UPDATE
  USING (created_by_id = auth.uid());

-- Multi-Tab Sync RLS
ALTER TABLE multi_tab_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own sync logs"
  ON multi_tab_sync FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create sync logs"
  ON multi_tab_sync FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sync logs"
  ON multi_tab_sync FOR UPDATE
  USING (user_id = auth.uid());

-- Social Events RLS
ALTER TABLE social_realtime_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see events about them"
  ON social_realtime_events FOR SELECT
  USING (
    user_id = auth.uid() OR
    actor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id::text = social_realtime_events.target_entity_id
      AND posts.user_id = auth.uid()
    )
  );

-- Message Delivery RLS
ALTER TABLE message_delivery_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see delivery status for their messages"
  ON message_delivery_status FOR SELECT
  USING (recipient_user_id = auth.uid());

-- =====================================================
-- 10. REALTIME SUBSCRIPTIONS
-- =====================================================

-- Add tables to realtime publication (if publication exists)
DO $$
BEGIN
  -- Check if publication exists before adding tables
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shared_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE sharing_permissions;
    ALTER PUBLICATION supabase_realtime ADD TABLE sharing_links;
    ALTER PUBLICATION supabase_realtime ADD TABLE multi_tab_sync;
    ALTER PUBLICATION supabase_realtime ADD TABLE social_realtime_events;
    ALTER PUBLICATION supabase_realtime ADD TABLE message_delivery_status;
  END IF;
END
$$;

-- =====================================================
-- 11. HELPER FUNCTIONS
-- =====================================================

-- Function to track multi-tab sync
CREATE OR REPLACE FUNCTION track_multi_tab_sync(
  p_user_id UUID,
  p_device_id TEXT,
  p_tab_id TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_action TEXT,
  p_change_data JSONB DEFAULT NULL,
  p_previous_state JSONB DEFAULT NULL,
  p_new_state JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_sync_id UUID;
BEGIN
  INSERT INTO multi_tab_sync (
    user_id, device_id, tab_id, entity_type, entity_id, action,
    change_data, previous_state, new_state
  ) VALUES (
    p_user_id, p_device_id, p_tab_id, p_entity_type, p_entity_id, p_action,
    COALESCE(p_change_data, '{}'::jsonb),
    p_previous_state,
    p_new_state
  ) RETURNING id INTO v_sync_id;
  
  RETURN v_sync_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log social events
CREATE OR REPLACE FUNCTION log_social_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_target_entity_type TEXT,
  p_target_entity_id TEXT,
  p_actor_id UUID,
  p_event_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO social_realtime_events (
    user_id, event_type, target_entity_type, target_entity_id,
    actor_id, event_data
  ) VALUES (
    p_user_id, p_event_type, p_target_entity_type, p_target_entity_id,
    p_actor_id, COALESCE(p_event_data, '{}'::jsonb)
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast message delivery
CREATE OR REPLACE FUNCTION update_message_delivery(
  p_message_id UUID,
  p_recipient_user_id UUID,
  p_status TEXT,
  p_delivered_on_device_id TEXT DEFAULT NULL,
  p_delivered_on_tab_ids TEXT[] DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE message_delivery_status
  SET 
    status = p_status,
    delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE delivered_at END,
    read_at = CASE WHEN p_status = 'read' THEN NOW() ELSE read_at END,
    delivered_on_device_id = COALESCE(p_delivered_on_device_id, delivered_on_device_id),
    delivered_on_tab_ids = CASE WHEN p_delivered_on_tab_ids IS NOT NULL 
      THEN array_cat(delivered_on_tab_ids, p_delivered_on_tab_ids)
      ELSE delivered_on_tab_ids
    END
  WHERE message_id = p_message_id AND recipient_user_id = p_recipient_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. SLUG GENERATION & VALIDATION FUNCTIONS
-- =====================================================

-- Function to generate random slug (8 alphanumeric characters)
CREATE OR REPLACE FUNCTION generate_random_slug(p_length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  v_slug TEXT;
  v_charset TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_slug := '';
    FOR i IN 1..p_length LOOP
      v_slug := v_slug || substr(v_charset, floor(random() * length(v_charset) + 1)::int, 1);
    END LOOP;
    
    -- Check if slug already exists
    SELECT EXISTS(
      SELECT 1 FROM sharing_links 
      WHERE random_slug = v_slug OR custom_slug = v_slug
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if custom slug is available
CREATE OR REPLACE FUNCTION is_slug_available(p_slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if slug already exists
  RETURN NOT EXISTS(
    SELECT 1 FROM sharing_links 
    WHERE custom_slug = p_slug OR random_slug = p_slug
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reserve custom slug (with collision detection)
CREATE OR REPLACE FUNCTION reserve_custom_slug(
  p_shared_item_id UUID,
  p_custom_slug TEXT,
  p_created_by_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_link_id UUID;
BEGIN
  -- Validate slug format (alphanumeric and hyphens only, 3-50 chars)
  IF p_custom_slug !~ '^[a-z0-9-]{3,50}$' THEN
    RAISE EXCEPTION 'Invalid slug format. Use lowercase letters, numbers, and hyphens (3-50 characters).';
  END IF;
  
  -- Check availability
  IF NOT is_slug_available(p_custom_slug) THEN
    RAISE EXCEPTION 'Slug already in use. Please choose a different one.';
  END IF;
  
  -- Create sharing link with custom slug
  INSERT INTO sharing_links (
    shared_item_id,
    custom_slug,
    slug_type,
    created_by_id
  ) VALUES (
    p_shared_item_id,
    p_custom_slug,
    'custom',
    p_created_by_id
  ) RETURNING id INTO v_link_id;
  
  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 13. EXPORT FUNCTIONS (JSON & HTML)
-- =====================================================

-- Function to export folder as JSON with watermark
CREATE OR REPLACE FUNCTION export_folder_as_json(
  p_folder_id TEXT,
  p_user_id UUID,
  p_include_watermark BOOLEAN DEFAULT TRUE
)
RETURNS JSONB AS $$
DECLARE
  v_folder JSONB;
  v_items JSONB;
BEGIN
  -- Get folder data
  SELECT jsonb_build_object(
    'id', id,
    'title', title,
    'type', type,
    'metadata', metadata,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_folder
  FROM canvas_items
  WHERE id = p_folder_id AND user_id = p_user_id;
  
  -- Get folder items
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'type', type,
      'content', content,
      'url', url,
      'thumbnail', thumbnail,
      'metadata', metadata,
      'x', x,
      'y', y,
      'width', width,
      'height', height,
      'styles', styles
    )
  ) INTO v_items
  FROM canvas_items
  WHERE parent_id = p_folder_id AND user_id = p_user_id;
  
  -- Build export
  RETURN jsonb_build_object(
    'folder', v_folder,
    'items', COALESCE(v_items, '[]'::jsonb),
    'export_metadata', jsonb_build_object(
      'exported_at', NOW(),
      'exported_by', p_user_id,
      'format', 'json',
      'watermark', CASE WHEN p_include_watermark THEN 'Exported via CanvasFlow' ELSE NULL END
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export folder as HTML with watermark
CREATE OR REPLACE FUNCTION export_folder_as_html(
  p_folder_id TEXT,
  p_user_id UUID,
  p_watermark_text TEXT DEFAULT 'Shared via CanvasFlow',
  p_watermark_position TEXT DEFAULT 'bottom-right'
)
RETURNS TEXT AS $$
DECLARE
  v_html TEXT;
  v_folder_title TEXT;
  v_items RECORD;
  v_watermark_style TEXT;
BEGIN
  -- Get folder title
  SELECT title INTO v_folder_title
  FROM canvas_items
  WHERE id = p_folder_id AND user_id = p_user_id;
  
  -- Set watermark position styles
  v_watermark_style := CASE p_watermark_position
    WHEN 'top-left' THEN 'top: 10px; left: 10px;'
    WHEN 'top-right' THEN 'top: 10px; right: 10px;'
    WHEN 'bottom-left' THEN 'bottom: 10px; left: 10px;'
    WHEN 'bottom-right' THEN 'bottom: 10px; right: 10px;'
    WHEN 'center' THEN 'top: 50%; left: 50%; transform: translate(-50%, -50%);'
    ELSE 'bottom: 10px; right: 10px;'
  END;
  
  -- Build HTML
  v_html := '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>' || COALESCE(v_folder_title, 'Shared Folder') || '</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); position: relative; }
    h1 { color: #333; margin-top: 0; }
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
    .item { background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; }
    .item-title { font-weight: bold; color: #0066cc; margin-bottom: 8px; }
    .item-type { font-size: 0.85em; color: #666; text-transform: uppercase; }
    .watermark { position: fixed; ' || v_watermark_style || ' background: rgba(0,0,0,0.05); color: rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 4px; font-size: 0.75em; pointer-events: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>' || COALESCE(v_folder_title, 'Shared Folder') || '</h1>
    <div class="items-grid">';
  
  -- Add items
  FOR v_items IN
    SELECT title, type, content, url
    FROM canvas_items
    WHERE parent_id = p_folder_id AND user_id = p_user_id
    ORDER BY "order", created_at
  LOOP
    v_html := v_html || '
      <div class="item">
        <div class="item-title">' || COALESCE(v_items.title, 'Untitled') || '</div>
        <div class="item-type">' || v_items.type || '</div>';
    
    IF v_items.content IS NOT NULL THEN
      v_html := v_html || '
        <p>' || substring(v_items.content from 1 for 100) || '...</p>';
    END IF;
    
    IF v_items.url IS NOT NULL THEN
      v_html := v_html || '
        <a href="' || v_items.url || '" target="_blank">View Link</a>';
    END IF;
    
    v_html := v_html || '
      </div>';
  END LOOP;
  
  v_html := v_html || '
    </div>
  </div>
  <div class="watermark">' || p_watermark_text || '</div>
</body>
</html>';
  
  RETURN v_html;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 14. AUTO-CLEANUP ROUTINES
-- =====================================================

-- Clean up expired sharing links
CREATE OR REPLACE FUNCTION cleanup_expired_sharing_links()
RETURNS void AS $$
BEGIN
  DELETE FROM sharing_links
  WHERE expires_at < NOW() - INTERVAL '7 days' AND is_active = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Clean up old sync logs (>30 days)
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM multi_tab_sync
  WHERE occurred_at < NOW() - INTERVAL '30 days' AND sync_status = 'synced';
END;
$$ LANGUAGE plpgsql;

-- Clean up old social events (>30 days)
CREATE OR REPLACE FUNCTION cleanup_old_social_events()
RETURNS void AS $$
BEGIN
  DELETE FROM social_realtime_events
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 15. ENSURE UPDATED_AT COLUMNS (Safety Check)
-- =====================================================

-- Check ve ekle updated_at kolonu eksik tabloların
DO $$
BEGIN
  -- shared_items
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shared_items' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE shared_items ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to shared_items';
  END IF;

  -- sharing_permissions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sharing_permissions' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE sharing_permissions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to sharing_permissions';
  END IF;

  -- sharing_links
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sharing_links' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE sharing_links ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to sharing_links';
  END IF;

  -- multi_tab_sync  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'multi_tab_sync' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE multi_tab_sync ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to multi_tab_sync';
  END IF;

  -- social_realtime_events
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'social_realtime_events' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE social_realtime_events ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to social_realtime_events';
  END IF;

  -- sharing_access_log
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sharing_access_log' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE sharing_access_log ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to sharing_access_log';
  END IF;

  -- message_delivery_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'message_delivery_status' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE message_delivery_status ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to message_delivery_status';
  END IF;

END
$$;

-- =====================================================
-- 16. COMMENTS TABLE (Optional - eğer posts varsa)
-- =====================================================

-- Comments table oluştur (posts table'ı varsa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts' AND table_schema = 'public') THEN
    CREATE TABLE IF NOT EXISTS public.comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

    ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Comments RLS Policies (separate from table creation)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments' AND table_schema = 'public') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Comments viewable by all" ON public.comments;
    DROP POLICY IF EXISTS "Users create own comments" ON public.comments;
    DROP POLICY IF EXISTS "Users update own comments" ON public.comments;
    DROP POLICY IF EXISTS "Users delete own comments" ON public.comments;
    
    -- Create policies
    CREATE POLICY "Comments viewable by all"
      ON public.comments FOR SELECT USING (true);
    
    CREATE POLICY "Users create own comments"
      ON public.comments FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users update own comments"
      ON public.comments FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users delete own comments"
      ON public.comments FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- =====================================================
-- END MIGRATION
-- =====================================================

-- Optional: Add comments table to realtime if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'comments' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
END
$$;
