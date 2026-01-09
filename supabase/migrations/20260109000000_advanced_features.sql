-- Advanced Features Migration
-- Profile Slugs, Folder Slugs, Message Groups, Calls, Meetings, Social Groups

-- ============================================================
-- PROFILE SLUG SYSTEM
-- ============================================================

CREATE TABLE profile_slugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  profile_image_url TEXT,
  bio TEXT,
  is_primary BOOLEAN DEFAULT false,
  access_count INTEGER DEFAULT 0,
  public BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accessed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, is_primary)
);

CREATE INDEX idx_profile_slugs_user_id ON profile_slugs(user_id);
CREATE INDEX idx_profile_slugs_slug ON profile_slugs(slug);

-- Profile Slug References (Followers, Friends, etc.)
CREATE TABLE profile_slug_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_profile_slug TEXT NOT NULL REFERENCES profile_slugs(slug) ON DELETE CASCADE,
  relationship_type TEXT CHECK (relationship_type IN ('follow', 'friend', 'subscriber', 'collaborator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

CREATE INDEX idx_profile_references_source ON profile_slug_references(source_user_id);
CREATE INDEX idx_profile_references_target ON profile_slug_references(target_profile_slug);

-- ============================================================
-- FOLDER SYSTEM WITH SLUG
-- ============================================================

CREATE TABLE folder_slugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  parent_slug TEXT REFERENCES folder_slugs(slug) ON DELETE SET NULL,
  color TEXT,
  icon TEXT,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_folder_slugs_user_id ON folder_slugs(user_id);
CREATE INDEX idx_folder_slugs_slug ON folder_slugs(slug);
CREATE INDEX idx_folder_slugs_folder_id ON folder_slugs(folder_id);
CREATE INDEX idx_folder_slugs_parent ON folder_slugs(parent_slug);

-- ============================================================
-- MESSAGE GROUPS
-- ============================================================

CREATE TABLE message_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar TEXT,
  category TEXT,
  is_private BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  settings JSONB
);

CREATE INDEX idx_message_groups_created_by ON message_groups(created_by);
CREATE INDEX idx_message_groups_slug ON message_groups(slug);

-- Group Members
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES message_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'moderator', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_muted BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Group Invite Links
CREATE TABLE group_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES message_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_group_invites_group_id ON group_invite_links(group_id);
CREATE INDEX idx_group_invites_token ON group_invite_links(token);

-- ============================================================
-- CALLS SYSTEM
-- ============================================================

CREATE TABLE call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_type TEXT CHECK (call_type IN ('direct', 'group', 'conference', 'webinar')),
  status TEXT CHECK (status IN ('pending', 'ringing', 'ongoing', 'on_hold', 'ended', 'missed', 'declined')),
  
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  recorded BOOLEAN DEFAULT false,
  recording_url TEXT,
  quality TEXT CHECK (quality IN ('low', 'medium', 'high', 'hd')) DEFAULT 'high',
  
  group_id UUID REFERENCES message_groups(id) ON DELETE SET NULL,
  meeting_id UUID,
  end_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_call_sessions_initiator ON call_sessions(initiator_id);
CREATE INDEX idx_call_sessions_status ON call_sessions(status);
CREATE INDEX idx_call_sessions_group_id ON call_sessions(group_id);

-- Call Participants
CREATE TABLE call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  audio_enabled BOOLEAN DEFAULT true,
  video_enabled BOOLEAN DEFAULT true,
  screen_share_active BOOLEAN DEFAULT false,
  quality_score NUMERIC(3,2),
  ip_address TEXT,
  UNIQUE(call_id, user_id)
);

CREATE INDEX idx_call_participants_call_id ON call_participants(call_id);
CREATE INDEX idx_call_participants_user_id ON call_participants(user_id);

-- Call History
CREATE TABLE call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_id UUID REFERENCES call_sessions(id) ON DELETE SET NULL,
  with_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  with_group_id UUID REFERENCES message_groups(id) ON DELETE SET NULL,
  call_type TEXT,
  duration_seconds INTEGER,
  status TEXT,
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_call_history_user_id ON call_history(user_id);
CREATE INDEX idx_call_history_timestamp ON call_history(timestamp);

-- ============================================================
-- MEETING PLANNING & SCHEDULING
-- ============================================================

CREATE TABLE scheduled_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  recurrence TEXT CHECK (recurrence IN ('once', 'daily', 'weekly', 'biweekly', 'monthly', 'custom')),
  recurrence_rule TEXT,
  
  max_attendees INTEGER,
  auto_join_url TEXT,
  location TEXT,
  meeting_link TEXT,
  platform TEXT CHECK (platform IN ('zoom', 'teams', 'google-meet', 'custom', 'physical')),
  room_id TEXT,
  
  status TEXT CHECK (status IN ('draft', 'scheduled', 'ongoing', 'cancelled', 'completed')) DEFAULT 'scheduled',
  is_public BOOLEAN DEFAULT false,
  allow_late_join BOOLEAN DEFAULT true,
  require_rsvp BOOLEAN DEFAULT false,
  
  agenda JSONB,
  notes TEXT,
  attachments TEXT[],
  send_reminder_before_minutes INTEGER[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_meetings_created_by ON scheduled_meetings(created_by);
CREATE INDEX idx_meetings_slug ON scheduled_meetings(slug);
CREATE INDEX idx_meetings_status ON scheduled_meetings(status);
CREATE INDEX idx_meetings_start_time ON scheduled_meetings(start_time);

-- Meeting Participants
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES scheduled_meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT CHECK (role IN ('organizer', 'presenter', 'attendee')) DEFAULT 'attendee',
  rsvp_status TEXT CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative')) DEFAULT 'pending',
  attended BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  notes TEXT,
  UNIQUE(meeting_id, COALESCE(user_id, email))
);

CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user_id ON meeting_participants(user_id);

-- Meeting Recordings
CREATE TABLE meeting_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES scheduled_meetings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  size_bytes BIGINT,
  duration_seconds INTEGER,
  format TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_meeting_recordings_meeting_id ON meeting_recordings(meeting_id);

-- Meeting Follow-Ups
CREATE TABLE meeting_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES scheduled_meetings(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_follow_ups_meeting_id ON meeting_follow_ups(meeting_id);
CREATE INDEX idx_follow_ups_assigned_to ON meeting_follow_ups(assigned_to);

-- ============================================================
-- SOCIAL GROUPS
-- ============================================================

CREATE TABLE social_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar TEXT,
  banner TEXT,
  category TEXT,
  subcategories TEXT[],
  
  member_count INTEGER DEFAULT 1,
  post_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  
  is_private BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  require_approval BOOLEAN DEFAULT false,
  
  rules TEXT,
  tags TEXT[],
  content_policy TEXT,
  sections JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_social_groups_created_by ON social_groups(created_by);
CREATE INDEX idx_social_groups_slug ON social_groups(slug);
CREATE INDEX idx_social_groups_category ON social_groups(category);

-- Social Group Members
CREATE TABLE social_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES social_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'moderator', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  contribution_score INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_social_members_group_id ON social_group_members(group_id);
CREATE INDEX idx_social_members_user_id ON social_group_members(user_id);

-- Social Group Posts
CREATE TABLE social_group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES social_groups(id) ON DELETE CASCADE,
  section_id UUID,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media JSONB,
  
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  is_pinned BOOLEAN DEFAULT false,
  is_highlighted BOOLEAN DEFAULT false,
  flagged BOOLEAN DEFAULT false,
  moderation_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  edited_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_social_posts_group_id ON social_group_posts(group_id);
CREATE INDEX idx_social_posts_author_id ON social_group_posts(author_id);
CREATE INDEX idx_social_posts_created_at ON social_group_posts(created_at);

-- Social Group Invites
CREATE TABLE social_group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES social_groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, invitee_id)
);

CREATE INDEX idx_group_invites_group_id ON social_group_invites(group_id);
CREATE INDEX idx_group_invites_invitee_id ON social_group_invites(invitee_id);

-- Join Requests
CREATE TABLE join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES social_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'declined')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_join_requests_group_id ON join_requests(group_id);
CREATE INDEX idx_join_requests_user_id ON join_requests(user_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Profile Slugs - Public read, owner write
ALTER TABLE profile_slugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_slugs_public_read"
  ON profile_slugs FOR SELECT
  USING (public = true OR auth.uid() = user_id);

CREATE POLICY "profile_slugs_owner_write"
  ON profile_slugs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Folder Slugs
ALTER TABLE folder_slugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folder_slugs_owner_all"
  ON folder_slugs FOR ALL
  USING (auth.uid() = user_id OR is_public = true)
  WITH CHECK (auth.uid() = user_id);

-- Message Groups - Members can read, creator/admin can write
ALTER TABLE message_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups_members_read"
  ON message_groups FOR SELECT
  USING (
    is_private = false OR
    EXISTS(SELECT 1 FROM group_members WHERE group_id = message_groups.id AND user_id = auth.uid())
  );

-- Group Members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read"
  ON group_members FOR SELECT
  USING (true);

CREATE POLICY "members_write"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Call Sessions
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calls_initiator_access"
  ON call_sessions FOR ALL
  USING (auth.uid() = initiator_id)
  WITH CHECK (auth.uid() = initiator_id);

-- Meetings
ALTER TABLE scheduled_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetings_creator_all"
  ON scheduled_meetings FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "meetings_public_read"
  ON scheduled_meetings FOR SELECT
  USING (is_public = true);

-- Social Groups
ALTER TABLE social_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups_public_read"
  ON social_groups FOR SELECT
  USING (is_private = false);

CREATE POLICY "groups_members_read"
  ON social_groups FOR SELECT
  USING (
    is_private = false OR
    EXISTS(SELECT 1 FROM social_group_members WHERE group_id = social_groups.id AND user_id = auth.uid())
  );

CREATE POLICY "groups_creator_write"
  ON social_groups FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
