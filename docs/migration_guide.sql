-- CanvasFlow Database Migration Script
-- Run this script in your Supabase SQL Editor
-- This will create all necessary tables and policies

-- ===============================================
-- STEP 1: Enable Extensions
-- ===============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- ===============================================
-- STEP 2: Drop existing tables (optional - for fresh install)
-- ===============================================

-- Uncomment these lines if you want to start fresh
-- WARNING: This will delete all data!

-- DROP TABLE IF EXISTS guest_sessions CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS shared_items CASCADE;
-- DROP TABLE IF EXISTS devices CASCADE;
-- DROP TABLE IF EXISTS spaces CASCADE;
-- DROP TABLE IF EXISTS ratings CASCADE;
-- DROP TABLE IF EXISTS analyses CASCADE;
-- DROP TABLE IF EXISTS comments CASCADE;
-- DROP TABLE IF EXISTS organization_follows CASCADE;
-- DROP TABLE IF EXISTS organization_members CASCADE;
-- DROP TABLE IF EXISTS organizations CASCADE;
-- DROP TABLE IF EXISTS follows CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS items CASCADE;

-- ===============================================
-- STEP 3: Create Tables
-- ===============================================

-- Now run the full schema from docs/supabase_schema.sql
-- Copy and paste the contents here or run it separately

-- ===============================================
-- STEP 4: Verify Installation
-- ===============================================

DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'items', 'profiles', 'follows', 'organizations',
        'organization_members', 'organization_follows',
        'comments', 'analyses', 'ratings', 'spaces',
        'devices', 'shared_items', 'notifications', 'guest_sessions'
    );
    
    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE '✅ Migration Complete!';
    RAISE NOTICE '📊 Tables created: % / 14', table_count;
    RAISE NOTICE '🔒 RLS Policies: %', policy_count;
    
    IF table_count < 14 THEN
        RAISE WARNING '⚠️ Some tables are missing. Expected 14, found %.', table_count;
    END IF;
END $$;

-- ===============================================
-- STEP 5: Create Indexes for Performance
-- ===============================================

-- Items indexes
CREATE INDEX IF NOT EXISTS idx_items_parent_id ON items(parent_id);
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_username ON organizations(username);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(organization_type);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_item ON comments(item_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);

-- Analyses indexes
CREATE INDEX IF NOT EXISTS idx_analyses_item ON analyses(item_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);

-- Ratings indexes
CREATE INDEX IF NOT EXISTS idx_ratings_item ON ratings(item_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);

-- Devices indexes
CREATE INDEX IF NOT EXISTS idx_devices_owner ON devices(owner_id);
CREATE INDEX IF NOT EXISTS idx_devices_space ON devices(space_id);
CREATE INDEX IF NOT EXISTS idx_devices_online ON devices(is_online) WHERE is_online = true;

-- Shared items indexes
CREATE INDEX IF NOT EXISTS idx_shared_items_item ON shared_items(item_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_owner ON shared_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_shared_with ON shared_items(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_public ON shared_items(is_public) WHERE is_public = true;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Guest sessions indexes
CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON guest_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_expires ON guest_sessions(expires_at) WHERE expires_at > NOW();

-- ===============================================
-- STEP 6: Create Helper Functions
-- ===============================================

-- Function to clean up expired guest sessions
CREATE OR REPLACE FUNCTION cleanup_expired_guest_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM guest_sessions
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    follower_count BIGINT,
    following_count BIGINT,
    items_count BIGINT,
    comments_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM follows WHERE following_id = user_uuid),
        (SELECT COUNT(*) FROM follows WHERE follower_id = user_uuid),
        (SELECT COUNT(*) FROM items WHERE owner_id = user_uuid),
        (SELECT COUNT(*) FROM comments WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- STEP 7: Schedule Cleanup Jobs
-- ===============================================

-- Note: Supabase requires pg_cron extension for scheduled jobs
-- You can manually run cleanup_expired_guest_sessions() periodically
-- Or use Supabase Edge Functions with cron triggers

-- Example: Delete expired sessions daily
-- SELECT cron.schedule(
--     'cleanup-guest-sessions',
--     '0 2 * * *', -- Every day at 2 AM
--     $$SELECT cleanup_expired_guest_sessions();$$
-- );

RAISE NOTICE '🎉 Database setup complete! You can now use CanvasFlow.';
