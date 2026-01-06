# Supabase Migration Deploy Guide

## Özet
- **Migration Dosyası**: `supabase/migrations/20260107_sharing_and_realtime_sync.sql`
- **Boyut**: 17.90 KB
- **Tablo Sayısı**: 8
- **Function Sayısı**: 7
- **RLS Policy Sayısı**: 0

## Deploy Yöntemleri

### 🔷 Yöntem 1: Supabase CLI (Önerilir)
```bash
# 1. Personal Access Token oluştur
# https://app.supabase.com/account/tokens

# 2. Token'ı set et
export SUPABASE_ACCESS_TOKEN="your_token"

# 3. Link et
npx supabase link --project-ref qukzepteomenikeelzno

# 4. Push et
npx supabase push
```

### 🔷 Yöntem 2: Supabase Dashboard
1. https://app.supabase.com/project/qukzepteomenikeelzno git
2. SQL Editor'ü aç
3. Aşağıdaki SQL'i yapıştır ve çalıştır:

```sql
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
  
  -- Link settings
  is_public BOOLEAN DEFAULT FALSE,
  allow_download BOOLEAN DEFAULT FALSE,
  allow_preview BOOLEAN DEFAULT TRUE,
  allow_comments BOOLEAN DEFAULT FALSE,
  
  -- Access tracking
  access_count INTEGER DEFAULT 0,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sharing_links_token ON sharing_links(share_token);
CREATE INDEX IF NOT EXISTS idx_sharing_links_shared_item ON sharing_links(shared_item_id);
CREATE INDEX IF NOT EXISTS idx_sharing_links_active ON sharing_links(is_active, expires_at) 
  WHERE is_active = true;

-- =====================================================
-- 4. SHARING ACCESS LOG (Paylaşım Erişim Günlüğü)
-- =====================================================
CREATE TABLE IF NOT EXISTS sharing_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sharing_link_id UUID NOT NULL REFERENCES sharing_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  action TEXT NOT NULL CHECK (action IN ('view', 'download', 'comment', 'share')),
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
    'post', 'comment', 'like', 'message', 'shared_item'
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
-- 8. RLS POLICIES
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
-- 9. REALTIME SUBSCRIPTIONS
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
-- 10. HELPER FUNCTIONS
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
-- 11. AUTO-CLEANUP ROUTINES
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
-- 12. COMMENTS TABLE (Optional - eğer posts varsa)
-- =====================================================

-- Comments table oluştur (posts table'ı varsa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
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

    CREATE POLICY IF NOT EXISTS "Comments viewable by all"
      ON public.comments FOR SELECT USING (true);

    CREATE POLICY IF NOT EXISTS "Users create own comments"
      ON public.comments FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users update own comments"
      ON public.comments FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users delete own comments"
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

```

### 🔷 Yöntem 3: Node.js Script
```bash
node scripts/deploy-direct.js
```

## Oluşturulan Kaynaklar

### Tablolar
1. shared_items
2. sharing_permissions
3. sharing_links
4. sharing_access_log
5. multi_tab_sync
6. social_realtime_events
7. message_delivery_status
8. public

### Functions
1. auto_expire_sharing_permissions()
2. track_multi_tab_sync()
3. log_social_event()
4. update_message_delivery()
5. cleanup_expired_sharing_links()
6. cleanup_old_sync_logs()
7. cleanup_old_social_events()

### RLS Policies
0 policy oluşturuldu (her tablo için güvenlik)

## Başarı Kontrol Listesi

Deployment sonrasında şunları kontrol et:
- [ ] Tablolar Supabase Dashboard'da görülüyor
- [ ] Functions "Functions" bölümünde listede
- [ ] RLS Policy'ler "Auth" bölümünde görülüyor
- [ ] `test_realtime` subscription test et
- [ ] TypeScript compile hataları yok

## Sonraki Adımlar

1. UI Components ekle (sharing, social, messaging)
2. Test suite çalıştır
3. E2E tests yaz
4. Production'a push et

---
*Generated on 2026-01-07T09:33:15.944Z*
