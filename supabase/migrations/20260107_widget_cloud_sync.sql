-- Widget Cloud Sync Schema Migration
-- 2026-01-07
-- Widget'lar için bulut senkronizasyonu ve yönetim sistemini kurar

-- Widget veri tablosu
CREATE TABLE IF NOT EXISTS widget_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  data JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{
    "version": 1,
    "lastSyncAt": null,
    "lastModifiedAt": null,
    "lastModifiedBy": null,
    "syncStatus": "synced",
    "device": null,
    "browser": null
  }',
  checksum TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(widget_id, user_id),
  CONSTRAINT valid_widget_type CHECK (widget_type ~ '^[a-z-]+$'),
  CONSTRAINT valid_sync_status CHECK (metadata->>'syncStatus' IN ('synced', 'pending', 'error', 'conflict'))
);

-- Widget snapshot'ları (versioning ve backup)
CREATE TABLE IF NOT EXISTS widget_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_data_id UUID NOT NULL REFERENCES widget_data(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  snapshot_reason TEXT NOT NULL CHECK (snapshot_reason IN ('auto-save', 'before-change', 'user-backup', 'conflict-resolution')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT snapshot_not_empty CHECK (jsonb_array_length(snapshot_data) > 0 OR jsonb_typeof(snapshot_data) = 'object')
);

-- Widget ayarları (global ve kişiye özel)
CREATE TABLE IF NOT EXISTS widget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  global_settings JSONB DEFAULT '{}',
  user_preferences JSONB DEFAULT '{}',
  sync_preferences JSONB NOT NULL DEFAULT '{
    "autoSync": true,
    "syncInterval": 10000,
    "keepLocalCopy": true,
    "conflictResolution": "merge",
    "backupFrequency": 300000,
    "maxSnapshots": 20
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, widget_type),
  CONSTRAINT valid_conflict_resolution CHECK (
    sync_preferences->>'conflictResolution' IN ('client-wins', 'server-wins', 'manual', 'merge')
  )
);

-- Widget senkronizasyon log'u (audit trail)
CREATE TABLE IF NOT EXISTS widget_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sync', 'error', 'conflict', 'snapshot', 'restore')),
  details JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_sync_log CHECK (
    (event_type != 'error' AND error_message IS NULL) OR
    (event_type = 'error' AND error_message IS NOT NULL)
  )
);

-- Widget replication status (multi-device sync için)
CREATE TABLE IF NOT EXISTS widget_replication_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_data_id UUID NOT NULL REFERENCES widget_data(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  version_number INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'synced' CHECK (status IN ('synced', 'pending', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(widget_data_id, device_id)
);

-- ===== INDEXES =====

-- Widget veri sorgularında hız için
CREATE INDEX IF NOT EXISTS idx_widget_data_user_id ON widget_data(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_data_widget_type ON widget_data(widget_type);
CREATE INDEX IF NOT EXISTS idx_widget_data_updated_at ON widget_data(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_widget_data_widget_id_user ON widget_data(widget_id, user_id);

-- Snapshot sorgularında hız için
CREATE INDEX IF NOT EXISTS idx_widget_snapshots_user_id ON widget_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_snapshots_widget_id ON widget_snapshots(widget_data_id);
CREATE INDEX IF NOT EXISTS idx_widget_snapshots_reason ON widget_snapshots(snapshot_reason);
CREATE INDEX IF NOT EXISTS idx_widget_snapshots_created ON widget_snapshots(created_at DESC);

-- Ayarlar sorgularında hız için
CREATE INDEX IF NOT EXISTS idx_widget_settings_user_id ON widget_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_settings_widget_type ON widget_settings(widget_type);

-- Log sorgularında hız için
CREATE INDEX IF NOT EXISTS idx_widget_sync_logs_user_id ON widget_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_sync_logs_event_type ON widget_sync_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_widget_sync_logs_created ON widget_sync_logs(created_at DESC);

-- Replication sorgularında hız için
CREATE INDEX IF NOT EXISTS idx_replication_status_user ON widget_replication_status(user_id);
CREATE INDEX IF NOT EXISTS idx_replication_status_device ON widget_replication_status(device_id);

-- ===== ROW LEVEL SECURITY (RLS) =====

-- Clean up existing policies to make migration idempotent
DROP POLICY IF EXISTS "widget_data_select" ON widget_data;
DROP POLICY IF EXISTS "widget_data_insert" ON widget_data;
DROP POLICY IF EXISTS "widget_data_update" ON widget_data;
DROP POLICY IF EXISTS "widget_data_delete" ON widget_data;

DROP POLICY IF EXISTS "widget_snapshots_select" ON widget_snapshots;
DROP POLICY IF EXISTS "widget_snapshots_insert" ON widget_snapshots;
DROP POLICY IF EXISTS "widget_snapshots_delete" ON widget_snapshots;

DROP POLICY IF EXISTS "widget_settings_select" ON widget_settings;
DROP POLICY IF EXISTS "widget_settings_insert" ON widget_settings;
DROP POLICY IF EXISTS "widget_settings_update" ON widget_settings;

DROP POLICY IF EXISTS "widget_sync_logs_select" ON widget_sync_logs;
DROP POLICY IF EXISTS "widget_sync_logs_insert" ON widget_sync_logs;

DROP POLICY IF EXISTS "widget_replication_select" ON widget_replication_status;
DROP POLICY IF EXISTS "widget_replication_insert" ON widget_replication_status;
DROP POLICY IF EXISTS "widget_replication_update" ON widget_replication_status;

-- widget_data RLS
ALTER TABLE widget_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "widget_data_select"
  ON widget_data
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "widget_data_insert"
  ON widget_data
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "widget_data_update"
  ON widget_data
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "widget_data_delete"
  ON widget_data
  FOR DELETE
  USING (user_id = auth.uid());

-- widget_snapshots RLS
ALTER TABLE widget_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "widget_snapshots_select"
  ON widget_snapshots
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "widget_snapshots_insert"
  ON widget_snapshots
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "widget_snapshots_delete"
  ON widget_snapshots
  FOR DELETE
  USING (user_id = auth.uid());

-- widget_settings RLS
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "widget_settings_select"
  ON widget_settings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "widget_settings_insert"
  ON widget_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "widget_settings_update"
  ON widget_settings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- widget_sync_logs RLS
ALTER TABLE widget_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "widget_sync_logs_select"
  ON widget_sync_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "widget_sync_logs_insert"
  ON widget_sync_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- widget_replication_status RLS
ALTER TABLE widget_replication_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "widget_replication_select"
  ON widget_replication_status
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "widget_replication_insert"
  ON widget_replication_status
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "widget_replication_update"
  ON widget_replication_status
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===== HELPER FUNCTIONS =====

-- Widget veri versiyonlama
CREATE OR REPLACE FUNCTION increment_widget_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.metadata = jsonb_set(
    NEW.metadata,
    '{version}',
    to_jsonb((COALESCE(OLD.metadata->>'version', '1')::INTEGER + 1))
  );
  NEW.metadata = jsonb_set(
    NEW.metadata,
    '{lastModifiedAt}',
    to_jsonb(NOW()::TEXT)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS widget_data_version_increment ON widget_data;
CREATE TRIGGER widget_data_version_increment
BEFORE UPDATE ON widget_data
FOR EACH ROW
EXECUTE FUNCTION increment_widget_version();

-- Otomatik snapshot oluşturma (significant changes)
CREATE OR REPLACE FUNCTION create_auto_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_old_checksum TEXT;
  v_new_checksum TEXT;
BEGIN
  -- Checksum'ları karşılaştır
  v_old_checksum := OLD.checksum;
  v_new_checksum := NEW.checksum;
  
  -- Eğer veri önemli ölçüde değiştiyse snapshot oluştur
  IF v_old_checksum IS NULL OR v_old_checksum != v_new_checksum THEN
    INSERT INTO widget_snapshots (
      widget_data_id,
      user_id,
      snapshot_data,
      snapshot_reason
    ) VALUES (
      NEW.id,
      NEW.user_id,
      OLD.data,
      'before-change'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS widget_data_auto_snapshot ON widget_data;
CREATE TRIGGER widget_data_auto_snapshot
BEFORE UPDATE ON widget_data
FOR EACH ROW
WHEN (OLD.data IS DISTINCT FROM NEW.data)
EXECUTE FUNCTION create_auto_snapshot();

-- Cleanup old snapshots (max 20 per widget)
CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS VOID AS $$
BEGIN
  DELETE FROM widget_snapshots
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY widget_data_id ORDER BY created_at DESC) AS rn
      FROM widget_snapshots
    ) ranked
    WHERE ranked.rn > 20
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Senkronizasyon log kaydı
CREATE OR REPLACE FUNCTION log_sync_event(
  p_widget_id TEXT,
  p_user_id UUID,
  p_event_type TEXT,
  p_details JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO widget_sync_logs (
    widget_id,
    user_id,
    event_type,
    details,
    error_message
  ) VALUES (
    p_widget_id,
    p_user_id,
    p_event_type,
    p_details,
    p_error_message
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Widget veri kopyalama (yedekleme için)
CREATE OR REPLACE FUNCTION duplicate_widget_data(
  p_source_widget_id TEXT,
  p_user_id UUID,
  p_new_widget_id TEXT DEFAULT NULL
)
RETURNS TABLE(new_widget_id TEXT, snapshot_count INTEGER) AS $$
DECLARE
  v_new_widget_id TEXT;
  v_snapshot_count INTEGER;
  v_data widget_data%ROWTYPE;
  v_snapshots widget_snapshots%ROWTYPE;
BEGIN
  -- Source widget'ı bul
  SELECT * INTO v_data
  FROM widget_data
  WHERE widget_id = p_source_widget_id AND user_id = p_user_id
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Widget not found';
  END IF;
  
  v_new_widget_id := COALESCE(p_new_widget_id, p_source_widget_id || '-copy-' || NOW()::TEXT);
  v_snapshot_count := 0;
  
  -- Yeni widget veri kaydı oluştur
  INSERT INTO widget_data (
    widget_id,
    user_id,
    widget_type,
    data,
    metadata,
    checksum
  ) VALUES (
    v_new_widget_id,
    p_user_id,
    v_data.widget_type,
    v_data.data,
    jsonb_set(v_data.metadata, '{version}', '1'),
    v_data.checksum
  );
  
  -- Tüm snapshot'ları kopyala
  FOR v_snapshots IN
    SELECT * FROM widget_snapshots
    WHERE widget_data_id = v_data.id
  LOOP
    INSERT INTO widget_snapshots (
      widget_data_id,
      user_id,
      snapshot_data,
      snapshot_reason,
      tags
    ) VALUES (
      (SELECT id FROM widget_data WHERE widget_id = v_new_widget_id AND user_id = p_user_id),
      p_user_id,
      v_snapshots.snapshot_data,
      v_snapshots.snapshot_reason,
      v_snapshots.tags
    );
    v_snapshot_count := v_snapshot_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT v_new_widget_id, v_snapshot_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== COMMENTS =====

COMMENT ON TABLE widget_data IS 'Widget state and data storage with versioning';
COMMENT ON TABLE widget_snapshots IS 'Point-in-time backups of widget data for recovery';
COMMENT ON TABLE widget_settings IS 'Global and user-specific widget configuration';
COMMENT ON TABLE widget_sync_logs IS 'Audit trail for all widget synchronization events';
COMMENT ON TABLE widget_replication_status IS 'Multi-device synchronization status tracking';

COMMENT ON FUNCTION increment_widget_version() IS 'Automatically increment version number on widget data changes';
COMMENT ON FUNCTION create_auto_snapshot() IS 'Create automatic snapshots before significant data changes';
COMMENT ON FUNCTION log_sync_event(TEXT, UUID, TEXT, JSONB, TEXT) IS 'Log widget synchronization events for audit trail';
COMMENT ON FUNCTION duplicate_widget_data(TEXT, UUID, TEXT) IS 'Clone a widget with all its snapshots';
