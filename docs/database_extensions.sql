-- ============================================================================
-- CANVASFLOW DATABASE EXTENSIONS
-- ============================================================================
-- NFT, Achievements, Analytics, ve diğer yeni tablolar
-- ============================================================================

-- ============================================================================
-- 1. NFT/DIGITAL ASSETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  contract_address VARCHAR(255),
  token_id VARCHAR(255),
  chain VARCHAR(50), -- ethereum, polygon, solana, etc.
  metadata JSONB DEFAULT '{}',
  mint_date TIMESTAMP DEFAULT NOW(),
  rarity_score INT CHECK (rarity_score >= 0 AND rarity_score <= 100),
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_nft_per_user UNIQUE(user_id, contract_address, token_id)
);

CREATE INDEX idx_nfts_user_id ON public.nfts(user_id);
CREATE INDEX idx_nfts_chain ON public.nfts(chain);
CREATE INDEX idx_nfts_created_at ON public.nfts(created_at DESC);

-- ============================================================================
-- 2. ACHIEVEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL, -- badge, milestone, award, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  icon_emoji VARCHAR(10),
  points INT DEFAULT 0,
  rarity_level VARCHAR(50), -- common, rare, epic, legendary
  earned_at TIMESTAMP DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_achievement_per_user UNIQUE(user_id, achievement_type, title)
);

CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_achievements_type ON public.achievements(achievement_type);
CREATE INDEX idx_achievements_earned_at ON public.achievements(earned_at DESC);

-- ============================================================================
-- 3. ACHIEVEMENTS CATEGORIES/TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.achievement_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_emoji VARCHAR(10),
  color_hex VARCHAR(7),
  max_points INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO public.achievement_categories (name, icon_emoji, color_hex, max_points) VALUES
  ('Content Creation', '📝', '#FF6B6B', 500),
  ('Community', '👥', '#4ECDC4', 400),
  ('Learning', '📚', '#45B7D1', 350),
  ('Exploration', '🌍', '#FFA07A', 300),
  ('Mastery', '⭐', '#FFD93D', 600),
  ('Social', '💬', '#6C5CE7', 250),
  ('Performance', '🚀', '#00B894', 450)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 4. USER STATISTICS/ANALYTICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_items_created INT DEFAULT 0,
  total_storage_used_mb NUMERIC DEFAULT 0,
  total_views INT DEFAULT 0,
  total_shares INT DEFAULT 0,
  total_collaborations INT DEFAULT 0,
  most_used_widget VARCHAR(100),
  favorite_layout VARCHAR(50),
  last_activity_at TIMESTAMP,
  profile_completion_percentage INT DEFAULT 0,
  engagement_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX idx_user_analytics_engagement ON public.user_analytics(engagement_score DESC);

-- ============================================================================
-- 5. CANVAS FLOWS (Minimap + Animation Support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.canvas_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  flow_data JSONB NOT NULL DEFAULT '{"nodes": [], "edges": [], "viewport": {}}',
  thumbnail_url TEXT,
  is_animated BOOLEAN DEFAULT TRUE,
  animation_speed NUMERIC DEFAULT 1.0 CHECK (animation_speed > 0 AND animation_speed <= 2),
  show_minimap BOOLEAN DEFAULT TRUE,
  minimap_position VARCHAR(20) DEFAULT 'bottom-right', -- top-right, bottom-right, bottom-left, etc.
  show_grid BOOLEAN DEFAULT FALSE,
  show_compass BOOLEAN DEFAULT FALSE,
  background_pattern VARCHAR(50) DEFAULT 'dot', -- dot, grid, lines, gradient
  pattern_color VARCHAR(7),
  visibility VARCHAR(50) DEFAULT 'private', -- private, shared, public
  shared_with UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_canvas_flows_user_id ON public.canvas_flows(user_id);
CREATE INDEX idx_canvas_flows_created_at ON public.canvas_flows(created_at DESC);
CREATE INDEX idx_canvas_flows_visibility ON public.canvas_flows(visibility);

-- ============================================================================
-- 6. FLOW CONNECTIONS (For animated connecting lines)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.flow_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.canvas_flows(id) ON DELETE CASCADE,
  source_node_id VARCHAR(100) NOT NULL,
  target_node_id VARCHAR(100) NOT NULL,
  connection_type VARCHAR(50) DEFAULT 'bezier', -- bezier, straight, smooth
  animated BOOLEAN DEFAULT TRUE,
  animation_style VARCHAR(50) DEFAULT 'flow', -- flow, pulse, gradient
  stroke_color VARCHAR(7),
  stroke_width INT DEFAULT 2,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_connection UNIQUE(flow_id, source_node_id, target_node_id)
);

CREATE INDEX idx_flow_connections_flow_id ON public.flow_connections(flow_id);

-- ============================================================================
-- 7. WIDGET LIBRARY (Reusable widget templates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.widget_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  widget_type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  preview_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_widget_library_user_id ON public.widget_library(user_id);
CREATE INDEX idx_widget_library_type ON public.widget_library(widget_type);
CREATE INDEX idx_widget_library_public ON public.widget_library(is_public);

-- ============================================================================
-- 8. SMART SHORTCUTS/COMMAND PALETTE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_shortcuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shortcut_key VARCHAR(50) NOT NULL,
  action_type VARCHAR(100) NOT NULL, -- open_widget, create_item, navigate, etc.
  action_data JSONB NOT NULL DEFAULT '{}',
  is_custom BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_shortcut UNIQUE(user_id, shortcut_key)
);

CREATE INDEX idx_user_shortcuts_user_id ON public.user_shortcuts(user_id);

-- ============================================================================
-- 9. FAVORITES/COLLECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type VARCHAR(100) NOT NULL, -- widget, canvas_flow, nft, etc.
  collection_name VARCHAR(255) DEFAULT 'Default',
  ordered_position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_favorite UNIQUE(user_id, item_id, collection_name)
);

CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_collection ON public.favorites(user_id, collection_name);

-- ============================================================================
-- 10. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  action_url TEXT,
  icon_emoji VARCHAR(10),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- NFTs: Users can only view their own NFTs unless shared
ALTER TABLE public.nfts ENABLE ROW LEVEL SECURITY;

CREATE POLICY nfts_user_access ON public.nfts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Achievements: Public read, user-controlled write
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY achievements_user_write ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY achievements_user_update ON public.achievements
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY achievements_public_read ON public.achievements
  FOR SELECT USING (is_displayed = TRUE);

-- Canvas Flows: Privacy-aware access
ALTER TABLE public.canvas_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY canvas_flows_owner ON public.canvas_flows
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY canvas_flows_shared ON public.canvas_flows
  FOR SELECT USING (
    auth.uid() = ANY(shared_with) OR 
    visibility = 'public'
  );

-- Widget Library: Public templates, user-owned custom
ALTER TABLE public.widget_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY widget_library_public_read ON public.widget_library
  FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY widget_library_user_write ON public.widget_library
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Shortcuts: User-specific
ALTER TABLE public.user_shortcuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_shortcuts_access ON public.user_shortcuts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Favorites: User-specific
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY favorites_access ON public.favorites
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notifications: User-specific
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_access ON public.notifications
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- User Dashboard Stats
CREATE OR REPLACE VIEW public.user_dashboard_stats AS
SELECT 
  p.id as user_id,
  p.username,
  COALESCE(ua.total_items_created, 0) as total_items,
  COALESCE(ua.total_views, 0) as total_views,
  COALESCE(COUNT(DISTINCT a.id), 0) as achievement_count,
  COALESCE(COUNT(DISTINCT nft.id), 0) as nft_count,
  COALESCE(ua.engagement_score, 0) as engagement_score,
  ua.updated_at
FROM public.profiles p
LEFT JOIN public.user_analytics ua ON p.id = ua.user_id
LEFT JOIN public.achievements a ON p.id = a.user_id AND a.is_displayed = TRUE
LEFT JOIN public.nfts nft ON p.id = nft.user_id AND nft.is_visible = TRUE
GROUP BY p.id, p.username, ua.total_items_created, ua.total_views, ua.engagement_score, ua.updated_at;

-- Achievement Rankings
CREATE OR REPLACE VIEW public.achievement_rankings AS
SELECT 
  user_id,
  COUNT(*) as achievement_count,
  SUM(COALESCE((
    SELECT max_points FROM public.achievement_categories 
    WHERE name = (
      SELECT achievement_type FROM public.achievements 
      WHERE id = achievements.id LIMIT 1
    )
  ), 0)) as total_points,
  ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC, 
    SUM(COALESCE((
      SELECT max_points FROM public.achievement_categories 
      WHERE name = (
        SELECT achievement_type FROM public.achievements 
        WHERE id = achievements.id LIMIT 1
      )
    ), 0)) DESC) as rank
FROM public.achievements
WHERE is_displayed = TRUE
GROUP BY user_id;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update canvas_flows.updated_at
CREATE OR REPLACE FUNCTION update_canvas_flows_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER canvas_flows_update_timestamp
  BEFORE UPDATE ON public.canvas_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_canvas_flows_timestamp();

-- Update user_analytics on item creation
CREATE OR REPLACE FUNCTION increment_user_items_created()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_analytics
  SET total_items_created = total_items_created + 1,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- 1. Copy this SQL and run it in Supabase SQL editor
-- 2. Verify all tables created successfully
-- 3. Test RLS policies with different users
-- 4. Create stored procedures for analytics updates
-- 5. Set up scheduled functions for cleanup tasks
