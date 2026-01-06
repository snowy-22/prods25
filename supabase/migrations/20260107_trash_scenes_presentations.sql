-- =====================================================
-- TRASH/RECYCLE BIN SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS trash_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('item', 'folder', 'list', 'grid', 'scene', 'presentation', 'layout', 'frame')),
  title TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  content JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  recovered_at TIMESTAMPTZ,
  permanent_delete_at TIMESTAMPTZ,
  
  -- Tracking
  restoration_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trash_items_user_id ON trash_items(user_id, deleted_at DESC);
CREATE INDEX idx_trash_items_expires ON trash_items(expires_at) WHERE permanent_delete_at IS NULL;
CREATE INDEX idx_trash_items_type ON trash_items(user_id, item_type);

ALTER TABLE trash_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own trash"
  ON trash_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE trash_items;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- =====================================================
-- SCENES
-- =====================================================

CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presentation_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Content
  background JSONB DEFAULT '{}'::jsonb,
  items JSONB DEFAULT '[]'::jsonb,
  
  -- Dimensions
  width NUMERIC DEFAULT 1920,
  height NUMERIC DEFAULT 1080,
  aspect_ratio TEXT DEFAULT '16:9',
  
  -- Duration & Timing
  duration NUMERIC DEFAULT 5000, -- milliseconds
  auto_advance BOOLEAN DEFAULT true,
  advance_delay NUMERIC DEFAULT 0,
  
  -- Transitions & Animations
  transition JSONB DEFAULT '{}'::jsonb,
  animations JSONB DEFAULT '[]'::jsonb,
  
  -- Organization
  "order" INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scenes_user_id ON scenes(user_id);
CREATE INDEX idx_scenes_presentation_id ON scenes(presentation_id, "order");
CREATE INDEX idx_scenes_updated ON scenes(user_id, updated_at DESC);

ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own scenes"
  ON scenes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  DROP TRIGGER IF EXISTS scenes_updated_at ON scenes;
EXCEPTION WHEN UNDEFINED_OBJECT THEN NULL;
END;
$$;

CREATE TRIGGER scenes_updated_at
  BEFORE UPDATE ON scenes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE scenes;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- =====================================================
-- PRESENTATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS presentations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  
  -- Content
  scene_ids TEXT[] NOT NULL DEFAULT '{}',
  total_duration NUMERIC DEFAULT 0,
  
  -- Settings
  settings JSONB DEFAULT '{
    "autoPlay": false,
    "autoPlayDelay": 5000,
    "loop": false,
    "loopDelay": 0,
    "quality": "high",
    "recordingEnabled": false,
    "analyticsEnabled": true
  }'::jsonb,
  
  -- Stream Settings
  stream_id TEXT,
  stream_url TEXT,
  stream_key TEXT,
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  is_draft BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  custom_css TEXT,
  
  -- Statistics
  statistics JSONB DEFAULT '{
    "views": 0,
    "totalDuration": 0,
    "completionRate": 0,
    "avgWatchTime": 0,
    "viewHistory": []
  }'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_presentations_user_id ON presentations(user_id);
CREATE INDEX idx_presentations_published ON presentations(user_id, is_published) WHERE is_published = true;
CREATE INDEX idx_presentations_updated ON presentations(user_id, updated_at DESC);

ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own presentations"
  ON presentations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  DROP TRIGGER IF EXISTS presentations_updated_at ON presentations;
EXCEPTION WHEN UNDEFINED_OBJECT THEN NULL;
END;
$$;

CREATE TRIGGER presentations_updated_at
  BEFORE UPDATE ON presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE presentations;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- =====================================================
-- TRANSITIONS (Predefined transition library)
-- =====================================================

CREATE TABLE IF NOT EXISTS transition_effects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  
  -- Configuration
  duration NUMERIC DEFAULT 500,
  ease TEXT DEFAULT 'ease-in-out',
  direction TEXT,
  intensity NUMERIC,
  
  -- Metadata
  is_preset BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transitions_user_id ON transition_effects(user_id);
CREATE INDEX idx_transitions_type ON transition_effects(type);

ALTER TABLE transition_effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own transitions"
  ON transition_effects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE transition_effects;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- =====================================================
-- BROADCAST SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS broadcast_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presentation_id TEXT NOT NULL,
  
  -- Stream Settings
  stream_settings JSONB NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'starting', 'live', 'paused', 'ended')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration NUMERIC,
  
  -- Statistics
  viewers INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  
  -- Recording
  recording_url TEXT,
  replay_url TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_broadcasts_user_id ON broadcast_sessions(user_id, started_at DESC);
CREATE INDEX idx_broadcasts_presentation_id ON broadcast_sessions(presentation_id);
CREATE INDEX idx_broadcasts_status ON broadcast_sessions(status) WHERE status IN ('live', 'paused');

ALTER TABLE broadcast_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own broadcasts"
  ON broadcast_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE broadcast_sessions;

-- =====================================================
-- RECOVERY LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS recovery_logs (
  id TEXT PRIMARY KEY,
  trash_item_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('deleted', 'restored', 'permanently_deleted', 'expired')),
  reason TEXT,
  restored_to TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recovery_logs_user_id ON recovery_logs(user_id, timestamp DESC);
CREATE INDEX idx_recovery_logs_trash_item ON recovery_logs(trash_item_id);

ALTER TABLE recovery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own logs"
  ON recovery_logs FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- CLEANUP JOBS (Auto-delete expired trash after 30 days)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_trash()
RETURNS void AS $$
BEGIN
  -- Move to recovery log before deletion
  INSERT INTO recovery_logs (id, trash_item_id, user_id, action, timestamp)
  SELECT gen_random_uuid()::text, id, user_id, 'expired', NOW()
  FROM trash_items
  WHERE expires_at <= NOW() AND permanent_delete_at IS NULL;
  
  -- Delete expired trash items
  DELETE FROM trash_items
  WHERE expires_at <= NOW() AND permanent_delete_at IS NULL;
  
  -- Clean up old recovery logs (keep 1 year)
  DELETE FROM recovery_logs
  WHERE timestamp < NOW() - INTERVAL '1 year';
  
  -- Clean up old broadcast sessions (keep 3 months)
  DELETE FROM broadcast_sessions
  WHERE ended_at IS NOT NULL AND ended_at < NOW() - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup daily at 2 AM UTC
-- Note: Requires pg_cron extension in Supabase
-- SELECT cron.schedule('cleanup-expired-trash', '0 2 * * *', 'SELECT cleanup_expired_trash()');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get trash statistics for user
CREATE OR REPLACE FUNCTION get_trash_stats(p_user_id UUID)
RETURNS TABLE (
  total_items BIGINT,
  total_size_kb NUMERIC,
  oldest_item_days NUMERIC,
  newest_item_days NUMERIC,
  items_expiring_soon BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*),
    COALESCE(SUM(octet_length(content::text)) / 1024, 0),
    COALESCE(EXTRACT(DAY FROM NOW() - MIN(deleted_at)), 0),
    COALESCE(EXTRACT(DAY FROM NOW() - MAX(deleted_at)), 0),
    COUNT(*) FILTER (WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days')
  FROM trash_items
  WHERE user_id = p_user_id AND permanent_delete_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Get presentation with all scenes
CREATE OR REPLACE FUNCTION get_presentation_full(p_presentation_id TEXT)
RETURNS TABLE (
  id TEXT,
  user_id UUID,
  title TEXT,
  description TEXT,
  scenes JSONB,
  settings JSONB,
  statistics JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.title,
    p.description,
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'duration', s.duration,
        'order', s."order"
      ) ORDER BY s."order"
    ),
    p.settings,
    p.statistics
  FROM presentations p
  LEFT JOIN scenes s ON p.id = s.presentation_id AND s.user_id = p.user_id
  WHERE p.id = p_presentation_id
  GROUP BY p.id, p.user_id, p.title, p.description, p.settings, p.statistics;
END;
$$ LANGUAGE plpgsql;

-- Get popular presentations
CREATE OR REPLACE FUNCTION get_popular_presentations(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  views NUMERIC,
  completion_rate NUMERIC,
  published_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    COALESCE((p.statistics->>'views')::NUMERIC, 0),
    COALESCE((p.statistics->>'completionRate')::NUMERIC, 0),
    p.published_at
  FROM presentations p
  WHERE p.user_id = p_user_id AND p.is_published = true
  ORDER BY (p.statistics->>'views')::NUMERIC DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get recent scenes
CREATE OR REPLACE FUNCTION get_recent_scenes(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  presentation_id TEXT,
  updated_at TIMESTAMPTZ,
  duration NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.presentation_id,
    s.updated_at,
    s.duration
  FROM scenes s
  WHERE s.user_id = p_user_id
  ORDER BY s.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MATERIALIZED VIEW for Quick Stats
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS presentation_stats AS
SELECT 
  p.id,
  p.user_id,
  p.title,
  COUNT(s.id) as scene_count,
  SUM(COALESCE(s.duration::NUMERIC, 0)) as total_duration,
  (p.statistics->>'views')::NUMERIC as view_count,
  (p.statistics->>'completionRate')::NUMERIC as avg_completion_rate,
  p.is_published,
  p.created_at,
  p.updated_at
FROM presentations p
LEFT JOIN scenes s ON p.id = s.presentation_id
GROUP BY p.id, p.user_id, p.title, p.statistics, p.is_published, p.created_at, p.updated_at;

CREATE INDEX idx_presentation_stats_user ON presentation_stats(user_id);
CREATE INDEX idx_presentation_stats_published ON presentation_stats(is_published) WHERE is_published = true;
