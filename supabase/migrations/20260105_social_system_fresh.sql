-- =====================================================
-- CANVASFLOW SOCIAL MEDIA SYSTEM - FRESH DEPLOYMENT
-- Safe, idempotent migration with proper dependencies
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE (User Social Profiles)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0, 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles viewable by all" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users create own profile" ON public.profiles;

CREATE POLICY "Profiles viewable by all" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users create own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. FOLLOWS TABLE (Social Connections)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- RLS for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows viewable by all" ON public.follows;
DROP POLICY IF EXISTS "Users create own follow" ON public.follows;
DROP POLICY IF EXISTS "Users delete own follow" ON public.follows;

CREATE POLICY "Follows viewable by all" 
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users create own follow" 
  ON public.follows FOR INSERT 
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users delete own follow" 
  ON public.follows FOR DELETE 
  USING (auth.uid() = follower_id);

-- =====================================================
-- 3. POSTS TABLE (User Content)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  visibility TEXT DEFAULT 'public',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);

-- RLS for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts viewable if public or owner" ON public.posts;
DROP POLICY IF EXISTS "Users create own posts" ON public.posts;
DROP POLICY IF EXISTS "Users update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users delete own posts" ON public.posts;

CREATE POLICY "Posts viewable if public or owner" 
  ON public.posts FOR SELECT 
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users create own posts" 
  ON public.posts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own posts" 
  ON public.posts FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own posts" 
  ON public.posts FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. LIKES TABLE (Post Reactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- RLS for likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes viewable by all" ON public.likes;
DROP POLICY IF EXISTS "Users can like posts" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON public.likes;

CREATE POLICY "Likes viewable by all" 
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "Users can like posts" 
  ON public.likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" 
  ON public.likes FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. POST_COMMENTS TABLE (Threaded Comments)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments(created_at DESC);

-- RLS for post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments viewable by all" ON public.post_comments;
DROP POLICY IF EXISTS "Users create comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users update own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users delete own comments" ON public.post_comments;

CREATE POLICY "Comments viewable by all" 
  ON public.post_comments FOR SELECT USING (true);

CREATE POLICY "Users create comments" 
  ON public.post_comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own comments" 
  ON public.post_comments FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own comments" 
  ON public.post_comments FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. HASHTAGS TABLE (Trending Tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 1,
  trending_score FLOAT DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_trending_score ON public.hashtags(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON public.hashtags(usage_count DESC);

-- RLS for hashtags
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hashtags viewable by all" ON public.hashtags;

CREATE POLICY "Hashtags viewable by all" 
  ON public.hashtags FOR SELECT USING (true);

-- =====================================================
-- 7. ORGANIZATIONS TABLE (Communities)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  website TEXT,
  follower_count INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 1,
  is_verified BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

-- RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizations viewable by all" ON public.organizations;
DROP POLICY IF EXISTS "Admins update org" ON public.organizations;
DROP POLICY IF EXISTS "Creator deletes org" ON public.organizations;

CREATE POLICY "Organizations viewable by all" 
  ON public.organizations FOR SELECT USING (true);

CREATE POLICY "Admins update org" 
  ON public.organizations FOR UPDATE 
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator deletes org" 
  ON public.organizations FOR DELETE 
  USING (created_by = auth.uid());

-- =====================================================
-- 8. ORGANIZATION_MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);

-- RLS for organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members viewable by all" ON public.organization_members;
DROP POLICY IF EXISTS "Admins manage members" ON public.organization_members;

CREATE POLICY "Members viewable by all" 
  ON public.organization_members FOR SELECT USING (true);

CREATE POLICY "Admins manage members" 
  ON public.organization_members FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 9. USER_FEEDS TABLE (Personalized Feed)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reason TEXT DEFAULT 'following',
  feed_score FLOAT DEFAULT 0,
  is_seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_feeds_user_id ON public.user_feeds(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feeds_is_seen ON public.user_feeds(is_seen);

-- RLS for user_feeds
ALTER TABLE public.user_feeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own feed" ON public.user_feeds;

CREATE POLICY "Users see own feed" 
  ON public.user_feeds FOR SELECT 
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Update follow counts
DROP FUNCTION IF EXISTS public.update_follow_counts() CASCADE;
CREATE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_follow_counts ON public.follows;
CREATE TRIGGER trg_update_follow_counts
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_follow_counts();

-- Update post like count
DROP FUNCTION IF EXISTS public.update_post_like_count() CASCADE;
CREATE FUNCTION public.update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_post_like_count ON public.likes;
CREATE TRIGGER trg_update_post_like_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_like_count();

-- Update post comment count
DROP FUNCTION IF EXISTS public.update_post_comment_count() CASCADE;
CREATE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_post_comment_count ON public.post_comments;
CREATE TRIGGER trg_update_post_comment_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comment_count();

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS
-- =====================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.hashtags;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_members;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_feeds;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- =====================================================
-- 10. SHARED_FOLDERS TABLE (URL Slug-based Folder Sharing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.shared_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id TEXT NOT NULL, -- ContentItem ID from client
  slug TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  access_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ, -- NULL = never expires
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_folders_slug ON public.shared_folders(slug);
CREATE INDEX IF NOT EXISTS idx_shared_folders_user_id ON public.shared_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_folders_folder_id ON public.shared_folders(folder_id);
CREATE INDEX IF NOT EXISTS idx_shared_folders_expires_at ON public.shared_folders(expires_at);

-- RLS for shared_folders
ALTER TABLE public.shared_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shared folders viewable by all if active" ON public.shared_folders;
DROP POLICY IF EXISTS "Users create own shared folders" ON public.shared_folders;
DROP POLICY IF EXISTS "Users update own shared folders" ON public.shared_folders;
DROP POLICY IF EXISTS "Users delete own shared folders" ON public.shared_folders;

CREATE POLICY "Shared folders viewable by all if active" 
  ON public.shared_folders FOR SELECT 
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users create own shared folders" 
  ON public.shared_folders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own shared folders" 
  ON public.shared_folders FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own shared folders" 
  ON public.shared_folders FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- 11. ANALYTICS_SESSIONS TABLE (User Session Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for guests
  device_info JSONB DEFAULT '{}',
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  language TEXT,
  timezone TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  is_guest BOOLEAN DEFAULT TRUE,
  ip_address TEXT,
  country_code TEXT,
  city TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON public.analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON public.analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_is_guest ON public.analytics_sessions(is_guest);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_first_seen ON public.analytics_sessions(first_seen_at DESC);

-- RLS for analytics_sessions
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sessions viewable by owner or admin" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Sessions insertable by all" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Sessions updatable by session owner" ON public.analytics_sessions;

CREATE POLICY "Sessions viewable by owner or admin" 
  ON public.analytics_sessions FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR public.is_global_admin(auth.uid())
  );

CREATE POLICY "Sessions insertable by all" 
  ON public.analytics_sessions FOR INSERT 
  WITH CHECK (true); -- Allow guest tracking

CREATE POLICY "Sessions updatable by session owner" 
  ON public.analytics_sessions FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================
-- 12. ANALYTICS_EVENTS TABLE (Detailed Event Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'folder_view', 'item_click', 'share', 'download', etc.
  event_category TEXT, -- 'navigation', 'engagement', 'conversion'
  resource_type TEXT, -- 'folder', 'video', 'image', 'widget'
  resource_id TEXT, -- ContentItem ID
  resource_slug TEXT, -- Shared folder slug (if applicable)
  metadata JSONB DEFAULT '{}',
  duration INTEGER, -- Time spent (ms)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);

-- Add resource_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'analytics_events' 
    AND column_name = 'resource_id'
  ) THEN
    ALTER TABLE public.analytics_events ADD COLUMN resource_id TEXT;
  END IF;
END
$$;

-- Add resource_slug column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'analytics_events' 
    AND column_name = 'resource_slug'
  ) THEN
    ALTER TABLE public.analytics_events ADD COLUMN resource_slug TEXT;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_resource_id ON public.analytics_events(resource_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_resource_slug ON public.analytics_events(resource_slug);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

-- RLS for analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events viewable by owner or admin" ON public.analytics_events;
DROP POLICY IF EXISTS "Events insertable by all" ON public.analytics_events;

CREATE POLICY "Events viewable by owner or admin" 
  ON public.analytics_events FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR public.is_global_admin(auth.uid())
  );

CREATE POLICY "Events insertable by all" 
  ON public.analytics_events FOR INSERT 
  WITH CHECK (true); -- Allow guest event tracking

-- =====================================================
-- 13. ANALYTICS_CONTENT_STATS TABLE (Aggregated Content Performance)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.analytics_content_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_title TEXT,
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_saves INTEGER DEFAULT 0,
  avg_duration INTEGER DEFAULT 0, -- Average time spent (ms)
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);


-- Add resource_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'analytics_content_stats' 
    AND column_name = 'resource_id'
  ) THEN
    ALTER TABLE public.analytics_content_stats ADD COLUMN resource_id TEXT NOT NULL DEFAULT '';
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_analytics_content_user_id ON public.analytics_content_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_content_resource_id ON public.analytics_content_stats(resource_id);
CREATE INDEX IF NOT EXISTS idx_analytics_content_total_views ON public.analytics_content_stats(total_views DESC);

-- RLS for analytics_content_stats
ALTER TABLE public.analytics_content_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Content stats viewable by owner" ON public.analytics_content_stats;
DROP POLICY IF EXISTS "Content stats insertable by owner" ON public.analytics_content_stats;
DROP POLICY IF EXISTS "Content stats updatable by owner" ON public.analytics_content_stats;

CREATE POLICY "Content stats viewable by owner" 
  ON public.analytics_content_stats FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Content stats insertable by owner" 
  ON public.analytics_content_stats FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Content stats updatable by owner" 
  ON public.analytics_content_stats FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TRIGGER FUNCTIONS FOR ANALYTICS
-- =====================================================

-- Update shared folder access count
DROP FUNCTION IF EXISTS public.increment_shared_folder_access() CASCADE;
CREATE FUNCTION public.increment_shared_folder_access()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.shared_folders 
  SET access_count = access_count + 1, updated_at = NOW()
  WHERE slug = NEW.resource_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_shared_folder_access ON public.analytics_events;
CREATE TRIGGER trg_increment_shared_folder_access
  AFTER INSERT ON public.analytics_events
  FOR EACH ROW
  WHEN (NEW.event_type = 'shared_folder_view' AND NEW.resource_slug IS NOT NULL)
  EXECUTE FUNCTION public.increment_shared_folder_access();

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS FOR NEW TABLES
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_content_stats;

-- =====================================================
-- VALIDATION
-- =====================================================

SELECT 
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 'follows', 'posts', 'likes', 'post_comments',
  'hashtags', 'organizations', 'organization_members', 'user_feeds',
  'shared_folders', 'analytics_sessions', 'analytics_events', 'analytics_content_stats'
)
ORDER BY table_name;
