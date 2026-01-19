/**
 * Collaboration Manager
 * Real-time multi-user folder collaboration with presence tracking
 */

import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  FolderCollaborator,
  CollaboratorInvite,
  PresenceUser,
  PresenceState,
  CollaborationEvent,
  CollaborationEventType,
  FolderCollaborationSettings,
  FolderEngagementStats,
  FolderRating,
  FolderLike,
  FolderComment,
  FolderSave,
  FolderActivityLog,
  FolderPermissionLevel,
  generateUserColor,
  canUserEdit,
  canUserComment,
  canUserManagePermissions,
} from './collaboration-types';
import { getDeviceId } from './supabase-sync';

// ==================== Presence Manager ====================

class PresenceManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private presenceStates: Map<string, PresenceState> = new Map();
  private currentUser: PresenceUser | null = null;
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

  async joinFolder(
    folderId: string,
    userId: string,
    userInfo: {
      displayName: string;
      avatarUrl?: string;
      email?: string;
      permissionLevel: FolderPermissionLevel;
    },
    callbacks?: {
      onUserJoined?: (user: PresenceUser) => void;
      onUserLeft?: (user: PresenceUser) => void;
      onPresenceSync?: (state: PresenceState) => void;
      onCursorMove?: (userId: string, position: { x: number; y: number }) => void;
      onSelectionChange?: (userId: string, itemIds: string[]) => void;
    }
  ): Promise<PresenceState> {
    const supabase = createClient();
    const deviceId = getDeviceId();
    const color = generateUserColor(userId);

    // Create presence user object
    this.currentUser = {
      id: `presence-${userId}-${deviceId}`,
      odataType: 'presence',
      userId,
      folderId,
      displayName: userInfo.displayName,
      avatarUrl: userInfo.avatarUrl,
      email: userInfo.email,
      permissionLevel: userInfo.permissionLevel,
      isOnline: true,
      lastSeenAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
      deviceInfo: {
        deviceId,
        deviceType: this.detectDeviceType(),
        browser: this.detectBrowser(),
        os: this.detectOS(),
      },
      color,
    };

    // Create or get channel for this folder
    const channelName = `folder:${folderId}`;
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: userId,
          },
        },
      });

      // Handle presence sync
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel!.presenceState();
        const users = this.parsePresenceState(state, folderId);
        const presenceState: PresenceState = {
          folderId,
          users,
          lastUpdated: new Date().toISOString(),
          totalOnline: users.filter(u => u.isOnline).length,
          totalViewers: users.filter(u => u.permissionLevel === 'viewer').length,
          totalEditors: users.filter(u => canUserEdit(u.permissionLevel)).length,
        };
        this.presenceStates.set(folderId, presenceState);
        callbacks?.onPresenceSync?.(presenceState);
      });

      // Handle user join
      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const user = this.parsePresenceUser(newPresences[0], folderId);
        if (user && callbacks?.onUserJoined) {
          callbacks.onUserJoined(user);
        }
      });

      // Handle user leave
      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const user = this.parsePresenceUser(leftPresences[0], folderId);
        if (user && callbacks?.onUserLeft) {
          callbacks.onUserLeft(user);
        }
      });

      // Handle cursor broadcasts
      channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
        if (payload.userId !== userId) {
          callbacks?.onCursorMove?.(payload.userId, payload.position);
        }
      });

      // Handle selection broadcasts
      channel.on('broadcast', { event: 'selection' }, ({ payload }) => {
        if (payload.userId !== userId) {
          callbacks?.onSelectionChange?.(payload.userId, payload.itemIds);
        }
      });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.currentUser) {
          await channel!.track(this.currentUser as unknown as { [key: string]: any });
        }
      });

      this.channels.set(channelName, channel);

      // Start heartbeat
      const heartbeat = setInterval(() => {
        this.updatePresence(folderId);
      }, 30000); // 30 second heartbeat
      this.heartbeatIntervals.set(folderId, heartbeat);
    }

    // Return initial presence state
    return this.presenceStates.get(folderId) || {
      folderId,
      users: [this.currentUser],
      lastUpdated: new Date().toISOString(),
      totalOnline: 1,
      totalViewers: 0,
      totalEditors: 1,
    };
  }

  async leaveFolder(folderId: string): Promise<void> {
    const channelName = `folder:${folderId}`;
    const channel = this.channels.get(channelName);

    if (channel) {
      await channel.untrack();
      await channel.unsubscribe();
      this.channels.delete(channelName);
    }

    // Clear heartbeat
    const heartbeat = this.heartbeatIntervals.get(folderId);
    if (heartbeat) {
      clearInterval(heartbeat);
      this.heartbeatIntervals.delete(folderId);
    }

    this.presenceStates.delete(folderId);
  }

  async updatePresence(folderId: string): Promise<void> {
    const channelName = `folder:${folderId}`;
    const channel = this.channels.get(channelName);

    if (channel && this.currentUser) {
      this.currentUser.lastSeenAt = new Date().toISOString();
      await channel.track(this.currentUser);
    }
  }

  async broadcastCursor(folderId: string, position: { x: number; y: number }): Promise<void> {
    const channelName = `folder:${folderId}`;
    const channel = this.channels.get(channelName);

    if (channel && this.currentUser) {
      this.currentUser.cursorPosition = position;
      await channel.send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          userId: this.currentUser.userId,
          position,
          color: this.currentUser.color,
        },
      });
    }
  }

  async broadcastSelection(folderId: string, itemIds: string[]): Promise<void> {
    const channelName = `folder:${folderId}`;
    const channel = this.channels.get(channelName);

    if (channel && this.currentUser) {
      this.currentUser.selectedItemIds = itemIds;
      await channel.send({
        type: 'broadcast',
        event: 'selection',
        payload: {
          userId: this.currentUser.userId,
          itemIds,
          color: this.currentUser.color,
        },
      });
    }
  }

  getPresenceState(folderId: string): PresenceState | undefined {
    return this.presenceStates.get(folderId);
  }

  getOnlineUsers(folderId: string): PresenceUser[] {
    const state = this.presenceStates.get(folderId);
    return state?.users.filter(u => u.isOnline) || [];
  }

  private parsePresenceState(state: any, folderId: string): PresenceUser[] {
    const users: PresenceUser[] = [];
    for (const [key, presences] of Object.entries(state)) {
      if (Array.isArray(presences) && presences.length > 0) {
        const user = this.parsePresenceUser(presences[0], folderId);
        if (user) users.push(user);
      }
    }
    return users;
  }

  private parsePresenceUser(presence: any, folderId: string): PresenceUser | null {
    if (!presence) return null;
    return {
      id: presence.id || `presence-${presence.userId}`,
      userId: presence.userId,
      folderId,
      displayName: presence.displayName || 'Unknown',
      avatarUrl: presence.avatarUrl,
      email: presence.email,
      permissionLevel: presence.permissionLevel || 'viewer',
      isOnline: true,
      lastSeenAt: presence.lastSeenAt || new Date().toISOString(),
      joinedAt: presence.joinedAt || new Date().toISOString(),
      cursorPosition: presence.cursorPosition,
      selectedItemIds: presence.selectedItemIds,
      deviceInfo: presence.deviceInfo,
      color: presence.color || generateUserColor(presence.userId),
    };
  }

  private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private detectBrowser(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'unknown';
  }

  private detectOS(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'unknown';
  }

  cleanup(): void {
    // Leave all folders
    for (const folderId of this.presenceStates.keys()) {
      this.leaveFolder(folderId);
    }
    this.currentUser = null;
  }
}

// ==================== Collaboration Event Manager ====================

class CollaborationEventManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  async subscribeToFolderEvents(
    folderId: string,
    userId: string,
    callbacks: {
      onItemCreated?: (event: CollaborationEvent) => void;
      onItemUpdated?: (event: CollaborationEvent) => void;
      onItemDeleted?: (event: CollaborationEvent) => void;
      onItemMoved?: (event: CollaborationEvent) => void;
      onPermissionChanged?: (event: CollaborationEvent) => void;
      onCommentAdded?: (event: CollaborationEvent) => void;
      onReactionAdded?: (event: CollaborationEvent) => void;
    }
  ): Promise<void> {
    const supabase = createClient();
    const channelName = `folder-events:${folderId}`;

    let channel = this.channels.get(channelName);
    if (channel) return;

    channel = supabase.channel(channelName);

    // Listen for broadcast events
    channel.on('broadcast', { event: 'collaboration' }, ({ payload }) => {
      const event = payload as CollaborationEvent;
      
      // Don't process own events
      if (event.userId === userId && event.deviceId === getDeviceId()) return;

      switch (event.eventType) {
        case 'item_created':
          callbacks.onItemCreated?.(event);
          break;
        case 'item_updated':
          callbacks.onItemUpdated?.(event);
          break;
        case 'item_deleted':
          callbacks.onItemDeleted?.(event);
          break;
        case 'item_moved':
        case 'item_resized':
          callbacks.onItemMoved?.(event);
          break;
        case 'permission_changed':
          callbacks.onPermissionChanged?.(event);
          break;
        case 'comment_added':
          callbacks.onCommentAdded?.(event);
          break;
        case 'reaction_added':
          callbacks.onReactionAdded?.(event);
          break;
      }
    });

    await channel.subscribe();
    this.channels.set(channelName, channel);
  }

  async broadcastEvent(
    folderId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    eventType: CollaborationEventType,
    targetItemId?: string,
    targetItemName?: string,
    previousValue?: any,
    newValue?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    const channelName = `folder-events:${folderId}`;
    const channel = this.channels.get(channelName);

    if (!channel) return;

    const event: CollaborationEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      folderId,
      userId,
      userName,
      userAvatar,
      eventType,
      targetItemId,
      targetItemName,
      previousValue,
      newValue,
      timestamp: new Date().toISOString(),
      deviceId: getDeviceId(),
      metadata,
    };

    await channel.send({
      type: 'broadcast',
      event: 'collaboration',
      payload: event,
    });

    // Also save to database for activity log
    await this.saveEventToLog(event);
  }

  private async saveEventToLog(event: CollaborationEvent): Promise<void> {
    const supabase = createClient();
    
    try {
      await supabase.from('folder_activity_logs').insert({
        folder_id: event.folderId,
        user_id: event.userId,
        user_name: event.userName,
        user_avatar: event.userAvatar,
        action: event.eventType,
        action_type: this.getActionType(event.eventType),
        target_type: event.targetItemId ? 'item' : undefined,
        target_id: event.targetItemId,
        target_name: event.targetItemName,
        details: JSON.stringify({ previousValue: event.previousValue, newValue: event.newValue }),
        device_id: event.deviceId,
        metadata: event.metadata,
        created_at: event.timestamp,
      });
    } catch (error) {
      console.error('Failed to save activity log:', error);
    }
  }

  private getActionType(eventType: CollaborationEventType): string {
    switch (eventType) {
      case 'item_created':
      case 'item_updated':
      case 'item_deleted':
      case 'item_moved':
      case 'item_resized':
        return 'edit';
      case 'permission_changed':
        return 'permission';
      case 'comment_added':
        return 'comment';
      case 'reaction_added':
        return 'rating';
      default:
        return 'other';
    }
  }

  unsubscribe(folderId: string): void {
    const channelName = `folder-events:${folderId}`;
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  cleanup(): void {
    for (const channel of this.channels.values()) {
      channel.unsubscribe();
    }
    this.channels.clear();
  }
}

// ==================== Collaborator Management ====================

export async function inviteCollaborator(
  folderId: string,
  inviterUserId: string,
  inviterName: string,
  inviterAvatar: string | undefined,
  inviteeEmail: string,
  permissionLevel: FolderPermissionLevel,
  message?: string
): Promise<CollaboratorInvite | null> {
  const supabase = createClient();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  // Get folder name
  const { data: folder } = await supabase
    .from('folders')
    .select('name')
    .eq('id', folderId)
    .single();

  const invite: Partial<CollaboratorInvite> = {
    folderId,
    folderName: folder?.name || 'Untitled Folder',
    inviterUserId,
    inviterName,
    inviterAvatar,
    inviteeEmail,
    permissionLevel,
    message,
    token,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  const { data, error } = await supabase
    .from('folder_invites')
    .insert(invite)
    .select()
    .single();

  if (error) {
    console.error('Failed to create invite:', error);
    return null;
  }

  return data as CollaboratorInvite;
}

export async function acceptInvite(
  token: string,
  userId: string,
  userName: string,
  userAvatar?: string
): Promise<FolderCollaborator | null> {
  const supabase = createClient();

  // Find and validate invite
  const { data: invite, error: inviteError } = await supabase
    .from('folder_invites')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single();

  if (inviteError || !invite) {
    console.error('Invite not found or expired');
    return null;
  }

  // Check if expired
  if (new Date(invite.expires_at) < new Date()) {
    await supabase
      .from('folder_invites')
      .update({ status: 'expired' })
      .eq('id', invite.id);
    return null;
  }

  // Create collaborator
  const collaborator: Partial<FolderCollaborator> = {
    userId,
    folderId: invite.folder_id,
    email: invite.invitee_email,
    displayName: userName,
    avatarUrl: userAvatar,
    permissionLevel: invite.permission_level,
    invitedBy: invite.inviter_user_id,
    invitedAt: invite.created_at,
    acceptedAt: new Date().toISOString(),
    status: 'active',
    canShare: invite.permission_level !== 'viewer',
    canDownload: true,
    canComment: true,
    canRate: true,
    notificationsEnabled: true,
  };

  const { data: newCollaborator, error: collabError } = await supabase
    .from('folder_collaborators')
    .insert(collaborator)
    .select()
    .single();

  if (collabError) {
    console.error('Failed to create collaborator:', collabError);
    return null;
  }

  // Update invite status
  await supabase
    .from('folder_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString(), invitee_user_id: userId })
    .eq('id', invite.id);

  return newCollaborator as FolderCollaborator;
}

export async function removeCollaborator(
  folderId: string,
  collaboratorUserId: string,
  removedBy: string
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('folder_collaborators')
    .update({ status: 'revoked' })
    .eq('folder_id', folderId)
    .eq('user_id', collaboratorUserId);

  if (error) {
    console.error('Failed to remove collaborator:', error);
    return false;
  }

  return true;
}

export async function updateCollaboratorPermission(
  folderId: string,
  collaboratorUserId: string,
  newPermissionLevel: FolderPermissionLevel
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('folder_collaborators')
    .update({ permission_level: newPermissionLevel })
    .eq('folder_id', folderId)
    .eq('user_id', collaboratorUserId);

  if (error) {
    console.error('Failed to update permission:', error);
    return false;
  }

  return true;
}

export async function getFolderCollaborators(folderId: string): Promise<FolderCollaborator[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('folder_collaborators')
    .select('*')
    .eq('folder_id', folderId)
    .eq('status', 'active')
    .order('accepted_at', { ascending: false });

  if (error) {
    console.error('Failed to get collaborators:', error);
    return [];
  }

  return data as FolderCollaborator[];
}

// ==================== Folder Engagement ====================

export async function rateFolder(
  folderId: string,
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  rating: number,
  review?: string
): Promise<FolderRating | null> {
  const supabase = createClient();

  // Check if user already rated
  const { data: existing } = await supabase
    .from('folder_ratings')
    .select('id')
    .eq('folder_id', folderId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update existing rating
    const { data, error } = await supabase
      .from('folder_ratings')
      .update({
        rating,
        review,
        updated_at: new Date().toISOString(),
        is_edited: true,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return null;
    return data as FolderRating;
  }

  // Create new rating
  const { data, error } = await supabase
    .from('folder_ratings')
    .insert({
      folder_id: folderId,
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
      rating,
      review,
      is_edited: false,
      helpful_count: 0,
      reported_count: 0,
    })
    .select()
    .single();

  if (error) return null;
  return data as FolderRating;
}

export async function toggleFolderLike(
  folderId: string,
  userId: string,
  userName: string,
  userAvatar?: string
): Promise<{ liked: boolean; totalLikes: number }> {
  const supabase = createClient();

  // Check if already liked
  const { data: existing } = await supabase
    .from('folder_likes')
    .select('id')
    .eq('folder_id', folderId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Unlike
    await supabase
      .from('folder_likes')
      .delete()
      .eq('id', existing.id);

    const { count } = await supabase
      .from('folder_likes')
      .select('*', { count: 'exact', head: true })
      .eq('folder_id', folderId);

    return { liked: false, totalLikes: count || 0 };
  }

  // Like
  await supabase
    .from('folder_likes')
    .insert({
      folder_id: folderId,
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
    });

  const { count } = await supabase
    .from('folder_likes')
    .select('*', { count: 'exact', head: true })
    .eq('folder_id', folderId);

  return { liked: true, totalLikes: count || 0 };
}

export async function addFolderComment(
  folderId: string,
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  content: string,
  replyToId?: string
): Promise<FolderComment | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('folder_comments')
    .insert({
      folder_id: folderId,
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
      content,
      reply_to_id: replyToId,
      is_edited: false,
      is_pinned: false,
      is_resolved: false,
      reply_count: 0,
    })
    .select()
    .single();

  if (error) return null;

  // Update reply count if this is a reply
  if (replyToId) {
    await supabase.rpc('increment_reply_count', { comment_id: replyToId });
  }

  return data as FolderComment;
}

export async function saveFolder(
  folderId: string,
  userId: string,
  collectionId?: string,
  collectionName?: string,
  notes?: string
): Promise<FolderSave | null> {
  const supabase = createClient();

  // Check if already saved
  const { data: existing } = await supabase
    .from('folder_saves')
    .select('id')
    .eq('folder_id', folderId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update existing save
    const { data, error } = await supabase
      .from('folder_saves')
      .update({
        collection_id: collectionId,
        collection_name: collectionName,
        notes,
        saved_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return null;
    return data as FolderSave;
  }

  // Create new save
  const { data, error } = await supabase
    .from('folder_saves')
    .insert({
      folder_id: folderId,
      user_id: userId,
      collection_id: collectionId,
      collection_name: collectionName,
      notes,
    })
    .select()
    .single();

  if (error) return null;
  return data as FolderSave;
}

export async function unsaveFolder(folderId: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('folder_saves')
    .delete()
    .eq('folder_id', folderId)
    .eq('user_id', userId);

  return !error;
}

export async function getFolderEngagementStats(folderId: string): Promise<FolderEngagementStats | null> {
  const supabase = createClient();

  // Get counts in parallel
  const [
    { count: likesCount },
    { count: commentsCount },
    { count: savesCount },
    { count: collaboratorCount },
    { data: ratings },
    { count: viewsCount },
  ] = await Promise.all([
    supabase.from('folder_likes').select('*', { count: 'exact', head: true }).eq('folder_id', folderId),
    supabase.from('folder_comments').select('*', { count: 'exact', head: true }).eq('folder_id', folderId),
    supabase.from('folder_saves').select('*', { count: 'exact', head: true }).eq('folder_id', folderId),
    supabase.from('folder_collaborators').select('*', { count: 'exact', head: true }).eq('folder_id', folderId).eq('status', 'active'),
    supabase.from('folder_ratings').select('rating').eq('folder_id', folderId),
    supabase.from('folder_views').select('*', { count: 'exact', head: true }).eq('folder_id', folderId),
  ]);

  // Calculate rating stats
  const ratingValues = (ratings || []).map(r => r.rating);
  const averageRating = ratingValues.length > 0 
    ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length 
    : 0;
  
  const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingValues.forEach(r => {
    if (ratingDistribution[r] !== undefined) {
      ratingDistribution[r]++;
    }
  });

  return {
    folderId,
    totalViews: viewsCount || 0,
    uniqueViewers: 0, // Would need separate query
    totalLikes: likesCount || 0,
    totalComments: commentsCount || 0,
    totalShares: 0, // Would need separate query
    totalSaves: savesCount || 0,
    averageRating,
    ratingCount: ratingValues.length,
    ratingDistribution,
    collaboratorCount: collaboratorCount || 0,
    activeCollaborators: 0, // Would need presence check
    lastActivityAt: new Date().toISOString(),
    trendingScore: (likesCount || 0) * 2 + (commentsCount || 0) * 3 + (savesCount || 0),
  };
}

// ==================== Exports ====================

export const presenceManager = new PresenceManager();
export const collaborationEventManager = new CollaborationEventManager();

export {
  canUserEdit,
  canUserComment,
  canUserManagePermissions,
  generateUserColor,
};
