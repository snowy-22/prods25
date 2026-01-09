/**
 * Advanced Features Types
 * 
 * Slug sistemi, klasörler, mesaj grupları, aramalar, toplantılar ve sosyal grup özellemeleri
 */

// ============================================================
// PROFILE SLUG SYSTEM
// ============================================================

export interface ProfileSlug {
  id: string;
  user_id: string;
  slug: string; // Profile adından generate edilmiş URL-safe slug
  display_name: string;
  profile_image_url?: string;
  bio?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  accessed_at?: string;
  access_count: number;
  public: boolean;
  verified: boolean;
}

export interface ProfileSlugReference {
  id: string;
  source_user_id: string;
  target_profile_slug: string; // ProfileSlug.slug'a referans
  relationship_type: 'follow' | 'friend' | 'subscriber' | 'collaborator';
  created_at: string;
  metadata?: Record<string, any>;
}

// ============================================================
// FOLDER SYSTEM WITH SLUG
// ============================================================

export interface FolderSlug {
  id: string;
  folder_id: string; // ContentItem.id referansı
  user_id: string;
  slug: string; // Folder adından generate edilmiş slug
  display_name: string;
  description?: string;
  is_public: boolean;
  parent_slug?: string; // Nested folder support
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
  access_count: number;
  last_accessed_at?: string;
}

export interface FolderStructure {
  folder_id: string;
  slug: string;
  name: string;
  children: FolderStructure[]; // Nested folders
  itemCount: number;
  lastModified: string;
}

// ============================================================
// MESSAGE GROUPS
// ============================================================

export interface MessageGroup {
  id: string;
  created_by: string;
  name: string;
  slug: string; // Group'a URL üzerinden erişim
  description?: string;
  avatar?: string;
  category?: string; // work, study, casual, gaming, etc.
  members: GroupMember[];
  is_private: boolean;
  is_archived: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  settings?: MessageGroupSettings;
}

export interface GroupMember {
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  is_muted: boolean;
  is_pinned: boolean;
}

export interface MessageGroupSettings {
  allow_file_sharing: boolean;
  allow_voice_messages: boolean;
  allow_video_messages: boolean;
  auto_delete_messages_days?: number;
  require_read_receipt: boolean;
  allow_mentions: boolean;
  pin_message_limit?: number;
}

export interface GroupInviteLink {
  id: string;
  group_id: string;
  created_by: string;
  token: string;
  expires_at?: string;
  max_uses?: number;
  used_count: number;
  created_at: string;
}

// ============================================================
// CALLS SYSTEM (Advanced Call Management)
// ============================================================

export type CallType = 'direct' | 'group' | 'conference' | 'webinar';
export type CallStatus = 'pending' | 'ringing' | 'ongoing' | 'on_hold' | 'ended' | 'missed' | 'declined';
export type CallEndReason = 'user_ended' | 'timeout' | 'no_answer' | 'declined' | 'network_error';

export interface CallSession {
  id: string;
  initiator_id: string;
  participants: CallParticipant[];
  type: CallType;
  status: CallStatus;
  
  // Timing
  initiated_at: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  
  // Quality & Recording
  recorded: boolean;
  recording_url?: string;
  quality: 'low' | 'medium' | 'high' | 'hd';
  
  // Metadata
  group_id?: string; // If group call
  meeting_id?: string; // If scheduled meeting
  end_reason?: CallEndReason;
  created_at: string;
  updated_at: string;
}

export interface CallParticipant {
  user_id: string;
  joined_at: string;
  left_at?: string;
  duration_seconds?: number;
  audio_enabled: boolean;
  video_enabled: boolean;
  screen_share_active: boolean;
  quality_score?: number;
  ip_address?: string;
}

export interface CallHistory {
  id: string;
  user_id: string;
  call_id: string;
  with_user_id?: string;
  with_group_id?: string;
  call_type: CallType;
  duration_seconds: number;
  status: CallStatus;
  timestamp: string;
  notes?: string;
}

// ============================================================
// MEETING PLANNING & SCHEDULING
// ============================================================

export type MeetingRecurrence = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface ScheduledMeeting {
  id: string;
  created_by: string;
  title: string;
  slug: string; // Meeting'e URL üzerinden erişim
  description?: string;
  
  // Meeting Details
  start_time: string;
  end_time: string;
  duration_minutes: number;
  recurrence: MeetingRecurrence;
  recurrence_rule?: string; // iCal RRULE format
  
  // Attendees
  participants: MeetingParticipant[];
  max_attendees?: number;
  auto_join_url?: string;
  
  // Location/Platform
  location?: string;
  meeting_link?: string;
  platform?: 'zoom' | 'teams' | 'google-meet' | 'custom' | 'physical';
  room_id?: string; // For physical or platform-specific
  
  // Status & Settings
  status: 'draft' | 'scheduled' | 'ongoing' | 'cancelled' | 'completed';
  is_public: boolean;
  allow_late_join: boolean;
  require_rsvp: boolean;
  
  // Agenda
  agenda?: MeetingAgendaItem[];
  notes?: string;
  attachments?: string[];
  
  // Reminders
  send_reminder_before_minutes?: number[];
  
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
}

export interface MeetingParticipant {
  user_id: string;
  email?: string;
  name: string;
  role: 'organizer' | 'presenter' | 'attendee';
  rsvp_status: 'pending' | 'accepted' | 'declined' | 'tentative';
  attended: boolean;
  joined_at?: string;
  left_at?: string;
  duration_seconds?: number;
  notes?: string;
}

export interface MeetingAgendaItem {
  id: string;
  topic: string;
  duration_minutes: number;
  presenter?: string;
  notes?: string;
  order: number;
}

export interface MeetingRecording {
  id: string;
  meeting_id: string;
  url: string;
  size_bytes: number;
  duration_seconds: number;
  format: string;
  created_at: string;
  expires_at?: string;
  access_log?: Array<{
    user_id: string;
    accessed_at: string;
  }>;
}

export interface MeetingFollowUp {
  id: string;
  meeting_id: string;
  assigned_to: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
}

// ============================================================
// SOCIAL GROUP CREATION
// ============================================================

export interface SocialGroup {
  id: string;
  created_by: string;
  name: string;
  slug: string; // Social group'a URL üzerinden erişim
  description?: string;
  avatar?: string;
  banner?: string;
  category: string; // gaming, art, tech, music, etc.
  subcategories?: string[];
  
  // Group Stats
  member_count: number;
  post_count: number;
  follower_count: number;
  
  // Settings
  is_private: boolean;
  is_verified: boolean;
  require_approval: boolean; // For member join requests
  
  // Moderation
  rules?: string;
  tags?: string[];
  content_policy?: string;
  
  // Sections/Channels
  sections?: SocialGroupSection[];
  
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
}

export interface SocialGroupSection {
  id: string;
  group_id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  post_count: number;
  rules?: string;
}

export interface SocialGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  is_banned: boolean;
  ban_reason?: string;
  contribution_score: number; // Based on posts, likes, engagement
  last_activity_at?: string;
}

export interface SocialGroupPost {
  id: string;
  group_id: string;
  section_id?: string;
  author_id: string;
  content: string;
  media?: {
    url: string;
    type: 'image' | 'video' | 'audio';
  }[];
  
  // Engagement
  like_count: number;
  comment_count: number;
  share_count: number;
  
  // Moderation
  is_pinned: boolean;
  is_highlighted: boolean;
  flagged: boolean;
  moderation_notes?: string;
  
  created_at: string;
  updated_at: string;
  edited_at?: string;
}

export interface SocialGroupInvite {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  created_at: string;
  responded_at?: string;
}

export interface JoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  message?: string;
  status: 'pending' | 'approved' | 'declined';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

// ============================================================
// STORE ACTIONS TYPE HINTS
// ============================================================

export interface AdvancedFeaturesStore {
  // Profile Slugs
  profileSlugs: ProfileSlug[];
  profileSlugReferences: ProfileSlugReference[];
  
  // Folder Slugs
  folderSlugs: FolderSlug[];
  folderStructure: FolderStructure[];
  
  // Message Groups
  messageGroups: MessageGroup[];
  groupInviteLinks: GroupInviteLink[];
  
  // Calls
  callSessions: CallSession[];
  callHistory: CallHistory[];
  
  // Meetings
  scheduledMeetings: ScheduledMeeting[];
  meetingRecordings: MeetingRecording[];
  meetingFollowUps: MeetingFollowUp[];
  
  // Social Groups
  socialGroups: SocialGroup[];
  socialGroupMembers: SocialGroupMember[];
  socialGroupPosts: SocialGroupPost[];
  joinRequests: JoinRequest[];
}
