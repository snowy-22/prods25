/**
 * Advanced Features Store Actions
 * 
 * Profile Slugs, Folder Slugs, Message Groups, Calls, Meetings, Social Groups
 * Store.ts'e entegre edilmek için actions
 */

import { useAppStore } from './store';
import {
  ProfileSlug,
  ProfileSlugReference,
  FolderSlug,
  FolderStructure,
  MessageGroup,
  GroupInviteLink,
  CallSession,
  CallHistory,
  ScheduledMeeting,
  MeetingRecording,
  MeetingFollowUp,
  SocialGroup,
  SocialGroupMember,
  SocialGroupPost,
  JoinRequest,
} from './advanced-features-types';
import { createClient } from './supabase/client';

/**
 * PROFILE SLUG ACTIONS
 */

export const profileSlugActions = {
  async createProfileSlug(displayName: string, bio?: string, profileImageUrl?: string): Promise<ProfileSlug | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Generate slug from display name
    const slug = generateSlug(displayName);

    const { data, error } = await supabase
      .from('profile_slugs')
      .insert({
        user_id: user.id,
        slug,
        display_name: displayName,
        bio,
        profile_image_url: profileImageUrl,
        is_primary: true,
        public: true,
        verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create profile slug:', error);
      return null;
    }

    return data;
  },

  async createProfileReference(targetSlug: string, relationshipType: 'follow' | 'friend' | 'subscriber' | 'collaborator') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profile_slug_references')
      .insert({
        source_user_id: user.id,
        target_profile_slug: targetSlug,
        relationship_type: relationshipType,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create profile reference:', error);
      return null;
    }

    return data;
  },

  async getProfileBySlug(slug: string): Promise<ProfileSlug | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profile_slugs')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) console.error('Failed to get profile:', error);
    return data;
  },
};

/**
 * FOLDER SLUG ACTIONS
 */

export const folderSlugActions = {
  async createFolderSlug(folderId: string, displayName: string, description?: string, isPublic?: boolean): Promise<FolderSlug | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const slug = generateSlug(displayName);

    const { data, error } = await supabase
      .from('folder_slugs')
      .insert({
        folder_id: folderId,
        user_id: user.id,
        slug,
        display_name: displayName,
        description,
        is_public: isPublic || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create folder slug:', error);
      return null;
    }

    return data;
  },

  async getFolderStructure(folderSlug: string): Promise<FolderStructure | null> {
    const supabase = createClient();
    const { data: folder, error } = await supabase
      .from('folder_slugs')
      .select('*')
      .eq('slug', folderSlug)
      .single();

    if (error) {
      console.error('Failed to get folder structure:', error);
      return null;
    }

    // Fetch child folders
    const { data: children } = await supabase
      .from('folder_slugs')
      .select('*')
      .eq('parent_slug', folderSlug);

    return {
      folder_id: folder.folder_id,
      slug: folder.slug,
      name: folder.display_name,
      children: children?.map((child) => ({
        folder_id: child.folder_id,
        slug: child.slug,
        name: child.display_name,
        children: [],
        itemCount: 0,
        lastModified: child.updated_at,
      })) || [],
      itemCount: 0,
      lastModified: folder.updated_at,
    };
  },
};

/**
 * MESSAGE GROUP ACTIONS
 */

export const messageGroupActions = {
  async createMessageGroup(name: string, description?: string, category?: string, isPrivate?: boolean): Promise<MessageGroup | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const slug = generateSlug(name);

    const { data, error } = await supabase
      .from('message_groups')
      .insert({
        created_by: user.id,
        name,
        slug,
        description,
        category,
        is_private: isPrivate || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create message group:', error);
      return null;
    }

    // Add creator as admin
    await supabase
      .from('group_members')
      .insert({
        group_id: data.id,
        user_id: user.id,
        role: 'admin',
      });

    return {
      ...data,
      members: [{ user_id: user.id, role: 'admin' as const, joined_at: new Date().toISOString(), is_muted: false, is_pinned: false }],
    };
  },

  async addGroupMember(groupId: string, userId: string, role: 'admin' | 'moderator' | 'member' = 'member') {
    const supabase = createClient();
    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role,
      });

    if (error) console.error('Failed to add group member:', error);
    return !error;
  },

  async createInviteLink(groupId: string, expiresInDays?: number, maxUses?: number): Promise<GroupInviteLink | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const token = generateToken(16);
    let expiresAt = null;
    if (expiresInDays) {
      const date = new Date();
      date.setDate(date.getDate() + expiresInDays);
      expiresAt = date.toISOString();
    }

    const { data, error } = await supabase
      .from('group_invite_links')
      .insert({
        group_id: groupId,
        created_by: user.id,
        token,
        expires_at: expiresAt,
        max_uses: maxUses,
      })
      .select()
      .single();

    if (error) console.error('Failed to create invite link:', error);
    return data;
  },
};

/**
 * CALL ACTIONS
 */

export const callActions = {
  async initiateCall(callType: 'direct' | 'group' | 'conference' | 'webinar', groupId?: string): Promise<CallSession | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('call_sessions')
      .insert({
        initiator_id: user.id,
        call_type: callType,
        status: 'pending',
        group_id: groupId,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to initiate call:', error);
      return null;
    }

    return data;
  },

  async addCallParticipant(callId: string, userId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('call_participants')
      .insert({
        call_id: callId,
        user_id: userId,
      });

    if (error) console.error('Failed to add call participant:', error);
    return !error;
  },

  async endCall(callId: string, endReason?: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('call_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        end_reason: endReason,
      })
      .eq('id', callId);

    if (error) console.error('Failed to end call:', error);
    return !error;
  },

  async logCallHistory(userId: string, callId: string, duration: number, status: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('call_history')
      .insert({
        user_id: userId,
        call_id: callId,
        duration_seconds: duration,
        status,
      });

    if (error) console.error('Failed to log call history:', error);
  },
};

/**
 * MEETING ACTIONS
 */

export const meetingActions = {
  async createMeeting(title: string, startTime: string, endTime: string, description?: string): Promise<ScheduledMeeting | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const slug = generateSlug(title);
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

    const { data, error } = await supabase
      .from('scheduled_meetings')
      .insert({
        created_by: user.id,
        title,
        slug,
        description,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: Math.round(durationMinutes),
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create meeting:', error);
      return null;
    }

    // Add creator as organizer
    await supabase
      .from('meeting_participants')
      .insert({
        meeting_id: data.id,
        user_id: user.id,
        name: user.email?.split('@')[0] || 'Organizer',
        role: 'organizer',
        rsvp_status: 'accepted',
      });

    return data;
  },

  async addMeetingParticipant(meetingId: string, userIdOrEmail: string, name?: string, role: 'organizer' | 'presenter' | 'attendee' = 'attendee') {
    const supabase = createClient();
    const isEmail = userIdOrEmail.includes('@');

    const { error } = await supabase
      .from('meeting_participants')
      .insert({
        meeting_id: meetingId,
        user_id: !isEmail ? userIdOrEmail : null,
        email: isEmail ? userIdOrEmail : null,
        name: name || userIdOrEmail,
        role,
        rsvp_status: 'pending',
      });

    if (error) console.error('Failed to add meeting participant:', error);
    return !error;
  },

  async recordMeeting(meetingId: string, recordingUrl: string, durationSeconds: number, format: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('meeting_recordings')
      .insert({
        meeting_id: meetingId,
        url: recordingUrl,
        duration_seconds: durationSeconds,
        format,
      });

    if (error) console.error('Failed to record meeting:', error);
  },
};

/**
 * SOCIAL GROUP ACTIONS
 */

export const socialGroupActions = {
  async createSocialGroup(name: string, category: string, description?: string, isPrivate?: boolean): Promise<SocialGroup | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const slug = generateSlug(name);

    const { data, error } = await supabase
      .from('social_groups')
      .insert({
        created_by: user.id,
        name,
        slug,
        category,
        description,
        is_private: isPrivate || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create social group:', error);
      return null;
    }

    // Add creator as admin member
    await supabase
      .from('social_group_members')
      .insert({
        group_id: data.id,
        user_id: user.id,
        role: 'admin',
      });

    return data;
  },

  async inviteToSocialGroup(groupId: string, inviteeId: string, message?: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('social_group_invites')
      .insert({
        group_id: groupId,
        inviter_id: user.id,
        invitee_id: inviteeId,
        message,
      })
      .select()
      .single();

    if (error) console.error('Failed to invite to group:', error);
    return data;
  },

  async postToSocialGroup(groupId: string, content: string, media?: any[]): Promise<SocialGroupPost | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('social_group_posts')
      .insert({
        group_id: groupId,
        author_id: user.id,
        content,
        media: media ? JSON.stringify(media) : null,
      })
      .select()
      .single();

    if (error) console.error('Failed to post to group:', error);
    return data;
  },

  async requestJoinGroup(groupId: string, message?: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('join_requests')
      .insert({
        group_id: groupId,
        user_id: user.id,
        message,
      })
      .select()
      .single();

    if (error) console.error('Failed to request join:', error);
    return data;
  },
};

/**
 * UTILITY FUNCTIONS
 */

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

export function generateToken(length: number = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * STORE EXTENSION TYPE
 * 
 * AppStore'a eklenecek yeni interface örneği:
 * 
 * interface AppStore {
 *   // ... existing properties ...
 *   
 *   // Advanced Features
 *   profileSlugs: ProfileSlug[];
 *   folderSlugs: FolderSlug[];
 *   messageGroups: MessageGroup[];
 *   callSessions: CallSession[];
 *   scheduledMeetings: ScheduledMeeting[];
 *   socialGroups: SocialGroup[];
 *   
 *   // Profile Slug Actions
 *   createProfileSlug: (displayName: string, bio?: string, profileImageUrl?: string) => Promise<ProfileSlug | null>;
 *   createProfileReference: (targetSlug: string, relationshipType: string) => Promise<any>;
 *   getProfileBySlug: (slug: string) => Promise<ProfileSlug | null>;
 *   
 *   // Folder Actions
 *   createFolderSlug: (folderId: string, displayName: string, description?: string, isPublic?: boolean) => Promise<FolderSlug | null>;
 *   getFolderStructure: (folderSlug: string) => Promise<FolderStructure | null>;
 *   
 *   // Message Group Actions
 *   createMessageGroup: (name: string, description?: string, category?: string, isPrivate?: boolean) => Promise<MessageGroup | null>;
 *   addGroupMember: (groupId: string, userId: string, role?: string) => Promise<boolean>;
 *   createInviteLink: (groupId: string, expiresInDays?: number, maxUses?: number) => Promise<GroupInviteLink | null>;
 *   
 *   // Call Actions
 *   initiateCall: (callType: string, groupId?: string) => Promise<CallSession | null>;
 *   addCallParticipant: (callId: string, userId: string) => Promise<boolean>;
 *   endCall: (callId: string, endReason?: string) => Promise<boolean>;
 *   
 *   // Meeting Actions
 *   createMeeting: (title: string, startTime: string, endTime: string, description?: string) => Promise<ScheduledMeeting | null>;
 *   addMeetingParticipant: (meetingId: string, userIdOrEmail: string, name?: string, role?: string) => Promise<boolean>;
 *   
 *   // Social Group Actions
 *   createSocialGroup: (name: string, category: string, description?: string, isPrivate?: boolean) => Promise<SocialGroup | null>;
 *   postToSocialGroup: (groupId: string, content: string, media?: any[]) => Promise<SocialGroupPost | null>;
 *   inviteToSocialGroup: (groupId: string, inviteeId: string, message?: string) => Promise<any>;
 * }
 */
