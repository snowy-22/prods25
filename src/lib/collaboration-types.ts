/**
 * Multi-User Collaboration Types
 * Real-time folder collaboration, presence, and permissions
 */

// ==================== Permission Levels ====================

export type FolderPermissionLevel = 'viewer' | 'commenter' | 'editor' | 'admin' | 'owner';

export type FolderAccessType = 'private' | 'link' | 'public' | 'team';

// ==================== Collaborator Types ====================

export interface FolderCollaborator {
  id: string;
  userId: string;
  folderId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  permissionLevel: FolderPermissionLevel;
  invitedBy: string;
  invitedAt: string;
  acceptedAt?: string;
  lastAccessedAt?: string;
  status: 'pending' | 'active' | 'revoked' | 'expired';
  expiresAt?: string;
  canShare: boolean;
  canDownload: boolean;
  canComment: boolean;
  canRate: boolean;
  notificationsEnabled: boolean;
  metadata?: Record<string, any>;
}

export interface CollaboratorInvite {
  id: string;
  folderId: string;
  folderName: string;
  inviterUserId: string;
  inviterName: string;
  inviterAvatar?: string;
  inviteeEmail: string;
  inviteeUserId?: string;
  permissionLevel: FolderPermissionLevel;
  message?: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  declinedAt?: string;
}

// ==================== Presence Types ====================

export interface PresenceUser {
  id: string;
  odataType?: string; 
  userId: string;
  folderId: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
  permissionLevel: FolderPermissionLevel;
  isOnline: boolean;
  lastSeenAt: string;
  joinedAt: string;
  cursorPosition?: { x: number; y: number };
  selectedItemIds?: string[];
  currentViewId?: string;
  deviceInfo?: {
    deviceId: string;
    deviceType: 'desktop' | 'tablet' | 'mobile';
    browser?: string;
    os?: string;
  };
  color: string; // Unique color for this user's cursor/selection
}

export interface PresenceState {
  folderId: string;
  users: PresenceUser[];
  lastUpdated: string;
  totalOnline: number;
  totalViewers: number;
  totalEditors: number;
}

// ==================== Real-time Collaboration ====================

export type CollaborationEventType = 
  | 'item_created'
  | 'item_updated'
  | 'item_deleted'
  | 'item_moved'
  | 'item_resized'
  | 'item_selected'
  | 'item_deselected'
  | 'cursor_moved'
  | 'user_joined'
  | 'user_left'
  | 'permission_changed'
  | 'folder_settings_changed'
  | 'comment_added'
  | 'reaction_added';

export interface CollaborationEvent {
  id: string;
  folderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  eventType: CollaborationEventType;
  targetItemId?: string;
  targetItemName?: string;
  previousValue?: any;
  newValue?: any;
  timestamp: string;
  deviceId: string;
  metadata?: Record<string, any>;
}

export interface CollaborationSession {
  id: string;
  folderId: string;
  userId: string;
  deviceId: string;
  startedAt: string;
  endedAt?: string;
  duration?: number; // milliseconds
  actionsCount: number;
  itemsEdited: string[];
  isActive: boolean;
}

// ==================== Folder Engagement ====================

export interface FolderRating {
  id: string;
  folderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5 stars
  review?: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  helpfulCount: number;
  reportedCount: number;
}

export interface FolderLike {
  id: string;
  folderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
}

export interface FolderComment {
  id: string;
  folderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  replyToId?: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  isPinned: boolean;
  isResolved: boolean;
  reactions: Array<{ emoji: string; userId: string; userName: string }>;
  replyCount: number;
}

export interface FolderSave {
  id: string;
  folderId: string;
  userId: string;
  savedAt: string;
  collectionId?: string;
  collectionName?: string;
  notes?: string;
}

export interface FolderShare {
  id: string;
  folderId: string;
  sharedBy: string;
  sharedTo: 'link' | 'email' | 'social' | 'embed';
  platform?: string; // twitter, facebook, linkedin, etc.
  sharedAt: string;
  accessCount: number;
  lastAccessedAt?: string;
}

// ==================== Folder Engagement Stats ====================

export interface FolderEngagementStats {
  folderId: string;
  totalViews: number;
  uniqueViewers: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  averageRating: number;
  ratingCount: number;
  ratingDistribution: { [key: number]: number }; // 1-5 star counts
  collaboratorCount: number;
  activeCollaborators: number;
  lastActivityAt: string;
  trendingScore: number;
}

// ==================== Folder Settings ====================

export interface FolderCollaborationSettings {
  folderId: string;
  ownerId: string;
  accessType: FolderAccessType;
  allowPublicView: boolean;
  allowPublicComment: boolean;
  allowPublicRate: boolean;
  allowSave: boolean;
  allowShare: boolean;
  allowDownload: boolean;
  allowEmbed: boolean;
  requireApprovalForJoin: boolean;
  maxCollaborators: number;
  linkPassword?: string;
  linkExpiresAt?: string;
  watermarkEnabled: boolean;
  activityLogEnabled: boolean;
  notifyOnChanges: boolean;
  notifyOnComments: boolean;
  notifyOnJoin: boolean;
  autoAcceptFromDomain?: string[];
  blockedUsers: string[];
  blockedDomains: string[];
  createdAt: string;
  updatedAt: string;
}

// ==================== Activity Log ====================

export interface FolderActivityLog {
  id: string;
  folderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  actionType: 'view' | 'edit' | 'share' | 'permission' | 'comment' | 'rating' | 'save' | 'other';
  targetType?: 'item' | 'collaborator' | 'setting' | 'comment';
  targetId?: string;
  targetName?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ==================== Notifications ====================

export interface CollaborationNotification {
  id: string;
  userId: string;
  folderId: string;
  folderName: string;
  type: 
    | 'invite_received'
    | 'invite_accepted'
    | 'invite_declined'
    | 'permission_changed'
    | 'removed_from_folder'
    | 'new_comment'
    | 'comment_reply'
    | 'new_rating'
    | 'item_updated'
    | 'folder_shared'
    | 'collaborator_joined'
    | 'collaborator_left'
    | 'mention';
  actorUserId: string;
  actorName: string;
  actorAvatar?: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

// ==================== Helper Functions ====================

export function getPermissionColor(level: FolderPermissionLevel): string {
  switch (level) {
    case 'owner': return '#FFD700'; // Gold
    case 'admin': return '#9333EA'; // Purple
    case 'editor': return '#3B82F6'; // Blue
    case 'commenter': return '#22C55E'; // Green
    case 'viewer': return '#6B7280'; // Gray
    default: return '#6B7280';
  }
}

export function getPermissionLabel(level: FolderPermissionLevel): string {
  switch (level) {
    case 'owner': return 'Sahip';
    case 'admin': return 'Yönetici';
    case 'editor': return 'Editör';
    case 'commenter': return 'Yorumcu';
    case 'viewer': return 'Görüntüleyici';
    default: return 'Bilinmiyor';
  }
}

export function canUserEdit(level: FolderPermissionLevel): boolean {
  return ['owner', 'admin', 'editor'].includes(level);
}

export function canUserComment(level: FolderPermissionLevel): boolean {
  return ['owner', 'admin', 'editor', 'commenter'].includes(level);
}

export function canUserManagePermissions(level: FolderPermissionLevel): boolean {
  return ['owner', 'admin'].includes(level);
}

export function canUserDelete(level: FolderPermissionLevel): boolean {
  return level === 'owner';
}

// Generate unique color for user cursor
export function generateUserColor(userId: string): string {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', 
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
    '#F43F5E'
  ];
  
  // Hash userId to get consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Format relative time for activity
export function formatActivityTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'Şimdi';
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffHour < 24) return `${diffHour} sa önce`;
  if (diffDay < 7) return `${diffDay} gün önce`;
  
  return time.toLocaleDateString('tr-TR');
}
