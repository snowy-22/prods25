-- =====================================================
-- COMPREHENSIVE LIVE DATA SYNC SYSTEM
-- All canvas items, search history, AI chat history, and frame updates
-- =====================================================

-- =====================================================
-- 1. CANVAS ITEMS (Folders, Lists, Grids, All Content)
-- =====================================================

CREATE TABLE IF NOT EXISTS canvas_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id TEXT,
  type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  icon TEXT,
  url TEXT,
  thumbnail TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Position & Layout
  x NUMERIC,
  y NUMERIC,
  width NUMERIC,
  height NUMERIC,
  grid_span_col INTEGER,
  grid_span_row INTEGER,
  layout_mode TEXT,
  
  -- Styling
  styles JSONB DEFAULT '{}'::jsonb,
  frame_style TEXT,
  border_style TEXT,
  animation_preset TEXT,
  
  -- Hierarchy & Organization
  "order" INTEGER DEFAULT 0,
  is_expanded BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_deletable BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Version control
  version INTEGER DEFAULT 1,
  device_id TEXT
);

-- Indexes for performance
CREATE INDEX idx_canvas_items_user_id ON canvas_items(user_id);
CREATE INDEX idx_canvas_items_parent_id ON canvas_items(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_canvas_items_type ON canvas_items(user_id, type);
CREATE INDEX idx_canvas_items_updated ON canvas_items(user_id, updated_at DESC);
CREATE INDEX idx_canvas_items_pinned ON canvas_items(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_canvas_items_favorite ON canvas_items(user_id, is_favorite) WHERE is_favorite = true;

-- RLS Policies
ALTER TABLE canvas_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own canvas items"
  ON canvas_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update trigger
DO $$
BEGIN
  DROP TRIGGER IF EXISTS canvas_items_updated_at ON canvas_items;
EXCEPTION WHEN UNDEFINED_OBJECT THEN NULL;
END;
$$;

CREATE TRIGGER canvas_items_updated_at
  BEFORE UPDATE ON canvas_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Realtime sync
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE canvas_items;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- =====================================================
-- 2. SEARCH HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type TEXT DEFAULT 'general' CHECK (search_type IN ('general', 'web', 'youtube', 'local', 'ai')),
  results_count INTEGER DEFAULT 0,
  selected_result_id TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_search_history_user_id ON search_history(user_id, created_at DESC);
CREATE INDEX idx_search_history_query ON search_history(user_id, query);
CREATE INDEX idx_search_history_type ON search_history(user_id, search_type);

-- RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own search history"
  ON search_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE search_history;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- =====================================================
-- 3. AI CHAT HISTORY & CONVERSATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  context_items JSONB DEFAULT '[]'::jsonb,
  system_prompt TEXT,
  model_name TEXT DEFAULT 'gemini-1.5-flash',
  total_messages INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

-- Add is_pinned column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'ai_conversations'
    AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE ai_conversations ADD COLUMN is_pinned BOOLEAN DEFAULT false;
  END IF;
END
$$;

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id, updated_at DESC);
CREATE INDEX idx_ai_conversations_pinned ON ai_conversations(user_id, is_pinned) WHERE is_pinned = true;

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own AI conversations"
  ON ai_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ai_conversations;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB DEFAULT '[]'::jsonb,
  tool_results JSONB DEFAULT '[]'::jsonb,
  tokens_used INTEGER,
  model_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sequence_number INTEGER NOT NULL
);

-- Add sequence_number column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'ai_messages'
    AND column_name = 'sequence_number'
  ) THEN
    ALTER TABLE ai_messages ADD COLUMN sequence_number INTEGER NOT NULL DEFAULT 0;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON ai_messages(user_id, created_at DESC);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own AI messages"
  ON ai_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ai_messages;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- =====================================================
-- 4. FRAME & STYLE UPDATES
-- =====================================================

CREATE TABLE IF NOT EXISTS frame_style_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  style_type TEXT NOT NULL CHECK (style_type IN ('frame', 'border', 'animation', 'background', 'custom')),
  previous_value JSONB,
  new_value JSONB NOT NULL,
  applied_by TEXT DEFAULT 'user' CHECK (applied_by IN ('user', 'ai', 'preset', 'system')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_frame_style_history_user_id ON frame_style_history(user_id, created_at DESC);
CREATE INDEX idx_frame_style_history_item_id ON frame_style_history(item_id, created_at DESC);
CREATE INDEX idx_frame_style_history_type ON frame_style_history(user_id, style_type);

ALTER TABLE frame_style_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own frame style history"
  ON frame_style_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE frame_style_history;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- =====================================================
-- 5. GRID & LAYOUT STATE
-- =====================================================

CREATE TABLE IF NOT EXISTS layout_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  view_id TEXT NOT NULL,
  layout_mode TEXT NOT NULL CHECK (layout_mode IN ('grid', 'canvas', 'list', 'carousel', 'presentation')),
  grid_columns INTEGER,
  grid_rows INTEGER,
  viewport_settings JSONB DEFAULT '{}'::jsonb,
  zoom_level NUMERIC DEFAULT 1.0,
  scroll_position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
  visible_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, view_id)
);

CREATE INDEX idx_layout_states_user_id ON layout_states(user_id);
CREATE INDEX idx_layout_states_view_id ON layout_states(view_id);

ALTER TABLE layout_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own layout states"
  ON layout_states FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  DROP TRIGGER IF EXISTS layout_states_updated_at ON layout_states;
EXCEPTION WHEN UNDEFINED_OBJECT THEN NULL;
END;
$$;

CREATE TRIGGER layout_states_updated_at
  BEFORE UPDATE ON layout_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE layout_states;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- =====================================================
-- 6. INTERACTION HISTORY (Clicks, Hovers, Selections)
-- =====================================================

CREATE TABLE IF NOT EXISTS interaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('click', 'hover', 'select', 'drag', 'drop', 'resize', 'delete', 'edit')),
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interaction_history_user_id ON interaction_history(user_id, created_at DESC);
CREATE INDEX idx_interaction_history_item_id ON interaction_history(item_id);
CREATE INDEX idx_interaction_history_type ON interaction_history(user_id, interaction_type);

ALTER TABLE interaction_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own interaction history"
  ON interaction_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to get user's recent items
CREATE OR REPLACE FUNCTION get_recent_items(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  type TEXT,
  title TEXT,
  thumbnail TEXT,
  accessed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.type,
    ci.title,
    ci.thumbnail,
    ci.accessed_at
  FROM canvas_items ci
  WHERE ci.user_id = p_user_id
    AND ci.is_archived = false
  ORDER BY ci.accessed_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular search queries
CREATE OR REPLACE FUNCTION get_popular_searches(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  query TEXT,
  search_count BIGINT,
  last_searched TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.query,
    COUNT(*)::BIGINT as search_count,
    MAX(sh.created_at) as last_searched
  FROM search_history sh
  WHERE sh.user_id = p_user_id
  GROUP BY sh.query
  ORDER BY search_count DESC, last_searched DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old interaction history (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_interactions(
  p_retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM interaction_history
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. MATERIALIZED VIEW FOR ANALYTICS
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_stats AS
SELECT 
  ci.user_id,
  COUNT(DISTINCT ci.id) as total_items,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.type = 'folder') as folder_count,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.type = 'list') as list_count,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.is_favorite = true) as favorite_count,
  COUNT(DISTINCT sh.id) as total_searches,
  COUNT(DISTINCT ac.id) as ai_conversation_count,
  COUNT(DISTINCT am.id) as ai_message_count,
  MAX(ci.accessed_at) as last_activity,
  MAX(sh.created_at) as last_search,
  MAX(ac.last_message_at) as last_ai_chat
FROM canvas_items ci
LEFT JOIN search_history sh ON sh.user_id = ci.user_id
LEFT JOIN ai_conversations ac ON ac.user_id = ci.user_id
LEFT JOIN ai_messages am ON am.user_id = ci.user_id
GROUP BY ci.user_id;

CREATE UNIQUE INDEX idx_user_activity_stats_user_id ON user_activity_stats(user_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_user_activity_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE canvas_items IS 'Stores all canvas items (folders, lists, grids, content) with real-time sync';
COMMENT ON TABLE search_history IS 'User search history for autocomplete and analytics';
COMMENT ON TABLE ai_conversations IS 'AI chat conversations with context tracking';
COMMENT ON TABLE ai_messages IS 'Individual AI chat messages with tool calls';
COMMENT ON TABLE frame_style_history IS 'History of frame and style changes for undo/redo';
COMMENT ON TABLE layout_states IS 'Current layout state for each view (grid, canvas modes)';
COMMENT ON TABLE interaction_history IS 'User interaction tracking for analytics';
COMMENT ON MATERIALIZED VIEW user_activity_stats IS 'Aggregated user activity statistics';
